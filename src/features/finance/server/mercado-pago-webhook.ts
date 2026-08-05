import {
  createFinanceCharge,
  deleteFinanceCharge,
  FinanceDomainError,
  listFinanceCharges,
  recordMercadoPagoWebhookEvent,
  updateFinanceCharge,
  upsertMercadoPagoCharge,
} from "@/features/finance/server/finance-db";
import type { Charge } from "@/features/finance/types";
import { chargeFormSchema, chargePatchSchema } from "@/features/finance/validation";
import { jsonResponse, requireAuthenticatedUser, requirePermission } from "@/shared/server/authz";

type MercadoPagoNotification = {
  id?: string | number;
  type?: string;
  topic?: string;
  action?: string;
  data?: { id?: string | number };
};

type MercadoPagoResource = {
  id?: string | number;
  status?: string;
  transaction_amount?: number;
  amount?: number;
  payment_method_id?: string;
  payment_type_id?: string;
  description?: string;
  external_reference?: string;
  date_created?: string;
  date_approved?: string;
  date_of_expiration?: string;
  money_release_date?: string;
  preapproval_id?: string;
  payer?: {
    email?: string;
    first_name?: string;
    last_name?: string;
  };
};

const MERCADO_PAGO_WEBHOOK_PATH = "/api/webhooks/mercado-pago";
const FINANCE_CHARGES_PATH = "/api/finance/charges";

function parseSignatureHeader(header: string | null) {
  if (!header) return null;

  return Object.fromEntries(
    header.split(",").map((part) => {
      const [key, value] = part.split("=");
      return [key?.trim(), value?.trim()];
    }),
  );
}

function hexFromBuffer(buffer: ArrayBuffer) {
  return [...new Uint8Array(buffer)].map((byte) => byte.toString(16).padStart(2, "0")).join("");
}

function timingSafeEqual(a: string, b: string) {
  if (a.length !== b.length) return false;

  let mismatch = 0;
  for (let index = 0; index < a.length; index += 1) {
    mismatch |= a.charCodeAt(index) ^ b.charCodeAt(index);
  }

  return mismatch === 0;
}

async function createHmacSha256Hex(value: string, secret: string) {
  const encoder = new TextEncoder();
  const key = await crypto.subtle.importKey(
    "raw",
    encoder.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const signature = await crypto.subtle.sign("HMAC", key, encoder.encode(value));
  return hexFromBuffer(signature);
}

async function validateMercadoPagoSignature(request: Request, dataId: string) {
  const secret = process.env["MERCADO_PAGO_WEBHOOK_SECRET"];

  if (!secret) {
    return process.env["NODE_ENV"] !== "production";
  }

  const xSignature = parseSignatureHeader(request.headers.get("x-signature"));
  const xRequestId = request.headers.get("x-request-id");
  const timestamp = xSignature?.ts;
  const receivedSignature = xSignature?.v1;

  if (!xRequestId || !timestamp || !receivedSignature) return false;
  if (isReplayTimestamp(timestamp)) return false;

  const manifest = `id:${dataId};request-id:${xRequestId};ts:${timestamp};`;
  const expectedSignature = await createHmacSha256Hex(manifest, secret);
  return timingSafeEqual(expectedSignature, receivedSignature);
}

function isReplayTimestamp(timestamp: string) {
  const timestampNumber = Number(timestamp);
  if (!Number.isFinite(timestampNumber)) return true;

  const timestampMs = timestampNumber > 10_000_000_000 ? timestampNumber : timestampNumber * 1000;
  const ageMs = Math.abs(Date.now() - timestampMs);
  return ageMs > 10 * 60 * 1000;
}

function getDataId(url: URL, notification: MercadoPagoNotification) {
  return (
    url.searchParams.get("data.id") ??
    url.searchParams.get("data_id") ??
    String(notification.data?.id ?? notification.id ?? "")
  );
}

function getTopic(url: URL, notification: MercadoPagoNotification) {
  return (
    notification.type ??
    notification.topic ??
    url.searchParams.get("type") ??
    url.searchParams.get("topic") ??
    ""
  );
}

function getMercadoPagoResourceUrl(topic: string, dataId: string) {
  if (topic === "payment") {
    return `https://api.mercadopago.com/v1/payments/${encodeURIComponent(dataId)}`;
  }

  if (topic === "subscription_authorized_payment") {
    return `https://api.mercadopago.com/authorized_payments/${encodeURIComponent(dataId)}`;
  }

  return null;
}

async function fetchMercadoPagoResource(topic: string, dataId: string) {
  const accessToken = process.env["MERCADO_PAGO_ACCESS_TOKEN"];
  const resourceUrl = getMercadoPagoResourceUrl(topic, dataId);

  if (!accessToken || !resourceUrl) return null;

  const response = await fetch(resourceUrl, {
    headers: {
      authorization: `Bearer ${accessToken}`,
      accept: "application/json",
    },
  });

  if (!response.ok) {
    throw new Error(`Mercado Pago respondeu ${response.status} ao buscar ${topic}:${dataId}.`);
  }

  return (await response.json()) as MercadoPagoResource;
}

function mapChargeStatus(status: string | undefined): Charge["status"] {
  if (status === "approved" || status === "accredited") return "paid";
  if (status === "cancelled") return "canceled";
  if (status === "rejected" || status === "charged_back") return "failed";
  return "pending";
}

function formatDateOnly(value: string | undefined) {
  if (!value) return null;

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;

  return date.toISOString().slice(0, 10);
}

function getClientName(resource: MercadoPagoResource) {
  const fullName = [resource.payer?.first_name, resource.payer?.last_name]
    .filter(Boolean)
    .join(" ");
  return fullName || resource.payer?.email || "Cliente não identificado";
}

async function handleMercadoPagoWebhook(request: Request) {
  if (request.method !== "POST") {
    return jsonResponse({ error: "Método não permitido." }, { status: 405 });
  }

  const url = new URL(request.url);
  const notification = (await request.json()) as MercadoPagoNotification;
  const dataId = getDataId(url, notification);
  const topic = getTopic(url, notification);
  const requestId = request.headers.get("x-request-id");
  const signatureParts = parseSignatureHeader(request.headers.get("x-signature"));
  const eventId = `${topic || "unknown"}:${dataId || notification.id || requestId || crypto.randomUUID()}`;

  if (!dataId || !topic) {
    return jsonResponse({ error: "Notificação sem tópico ou data.id." }, { status: 400 });
  }

  const isSignatureValid = await validateMercadoPagoSignature(request, dataId);
  if (!isSignatureValid) {
    await recordMercadoPagoWebhookEvent({
      eventId,
      requestId,
      signatureTimestamp: signatureParts?.ts
        ? new Date(Number(signatureParts.ts) * 1000).toISOString()
        : null,
      topic,
      dataId,
      action: notification.action ?? null,
      status: "failed",
      error: "Assinatura inválida ou fora da janela de replay.",
      payload: notification,
    });
    return jsonResponse({ error: "Assinatura inválida." }, { status: 401 });
  }

  const resource = await fetchMercadoPagoResource(topic, dataId);
  if (!resource) {
    await recordMercadoPagoWebhookEvent({
      eventId,
      requestId,
      signatureTimestamp: signatureParts?.ts
        ? new Date(Number(signatureParts.ts) * 1000).toISOString()
        : null,
      topic,
      dataId,
      action: notification.action ?? null,
      status: "ignored",
      error: "Recurso não buscado por credencial ausente ou tópico não suportado.",
      payload: notification,
    });
    return jsonResponse({ received: true, stored: false, topic, dataId });
  }

  const charge = await upsertMercadoPagoCharge({
    invoice: `MP-${resource.id ?? dataId}`,
    clientName: getClientName(resource),
    dueDate: formatDateOnly(resource.date_of_expiration ?? resource.money_release_date),
    amount: Number(resource.transaction_amount ?? resource.amount ?? 0),
    method: resource.payment_method_id ?? resource.payment_type_id ?? "Mercado Pago",
    status: mapChargeStatus(resource.status),
    providerTopic: topic,
    providerAction: notification.action ?? null,
    providerPaymentId: String(resource.id ?? dataId),
    providerSubscriptionId: resource.preapproval_id ?? null,
    providerStatus: resource.status ?? null,
    externalReference: resource.external_reference ?? null,
    paidAt: resource.date_approved ?? null,
    pendingAt: resource.status === "pending" ? (resource.date_created ?? null) : null,
    payload: { notification, resource },
  });

  await recordMercadoPagoWebhookEvent({
    eventId,
    requestId,
    signatureTimestamp: signatureParts?.ts
      ? new Date(Number(signatureParts.ts) * 1000).toISOString()
      : null,
    topic,
    dataId,
    action: notification.action ?? null,
    status: charge ? "processed" : "ignored",
    error: charge ? null : "Cobrança correspondente não encontrada para conciliação.",
    payload: { notification, resource },
    chargeId: charge?.id ?? null,
    companyId: charge?.company_id ?? null,
  });

  return jsonResponse({ received: true, stored: Boolean(charge), topic, dataId });
}

async function handleFinanceCharges(request: Request) {
  const auth = await requireAuthenticatedUser(request);
  if (auth.error) return auth.error;

  const permissionError = requirePermission(
    auth.context,
    request.method === "GET" ? "finance.read" : "finance.manage",
  );
  if (permissionError) return permissionError;

  if (!["GET", "POST", "PATCH", "PUT", "DELETE"].includes(request.method)) {
    return jsonResponse({ error: "Método não permitido." }, { status: 405 });
  }

  try {
    if (request.method === "GET") {
      return jsonResponse(await listFinanceCharges(auth.context.companyId));
    }

    if (request.method === "POST") {
      const parsed = chargeFormSchema.safeParse(await request.json());
      if (!parsed.success) {
        return jsonResponse(
          { error: parsed.error.issues[0]?.message ?? "Dados inválidos." },
          { status: 400 },
        );
      }

      return jsonResponse(
        { charge: await createFinanceCharge(parsed.data, auth.context) },
        { status: 201 },
      );
    }

    if (request.method === "PATCH" || request.method === "PUT") {
      const parsed = chargePatchSchema.safeParse(await request.json());
      if (!parsed.success) {
        return jsonResponse(
          { error: parsed.error.issues[0]?.message ?? "Cobrança não informada." },
          { status: 400 },
        );
      }

      return jsonResponse({ charge: await updateFinanceCharge(parsed.data, auth.context) });
    }

    if (request.method === "DELETE") {
      const url = new URL(request.url);
      const id = url.searchParams.get("id") ?? "";
      if (!id) return jsonResponse({ error: "Cobrança não informada." }, { status: 400 });

      await deleteFinanceCharge(id, auth.context);
      return jsonResponse({ ok: true });
    }

    return jsonResponse({ error: "Método não permitido." }, { status: 405 });
  } catch (error) {
    if (error instanceof FinanceDomainError) {
      return jsonResponse({ error: error.message }, { status: error.status });
    }

    console.error(error);
    return jsonResponse({ error: "Erro ao acessar dados financeiros." }, { status: 500 });
  }
}

export async function handleFinanceApiRequest(request: Request) {
  const url = new URL(request.url);

  if (url.pathname === MERCADO_PAGO_WEBHOOK_PATH) {
    return handleMercadoPagoWebhook(request);
  }

  if (url.pathname === FINANCE_CHARGES_PATH) {
    return handleFinanceCharges(request);
  }

  return null;
}
