import { Resend } from "resend";
import { createEmailRepository } from "@/features/email/server/email.repository";
import type { EmailDeliveryStatus } from "@/features/email/types";
import { jsonResponse } from "@/shared/server/authz";
import { loadLocalServerEnv } from "@/shared/server/env";

const RESEND_WEBHOOK_PATH = "/api/webhooks/resend";

function statusFromEvent(type: string): EmailDeliveryStatus | null {
  if (type === "email.sent") return "sent";
  if (type === "email.delivered") return "delivered";
  if (type === "email.failed") return "failed";
  if (type === "email.bounced") return "bounced";
  if (type === "email.complained") return "complained";
  if (type === "email.suppressed") return "suppressed";
  return null;
}

function asObject(value: unknown): Record<string, unknown> {
  return typeof value === "object" && value !== null ? (value as Record<string, unknown>) : {};
}

function readMessageId(event: Record<string, unknown>) {
  const data = asObject(event["data"]);
  const candidates = [data["email_id"], data["emailId"], data["id"], event["email_id"]];
  for (const candidate of candidates) {
    if (typeof candidate === "string" && candidate.trim()) return candidate.trim();
  }
  return null;
}

function readOccurredAt(event: Record<string, unknown>) {
  const data = asObject(event["data"]);
  const candidates = [
    data["created_at"],
    data["createdAt"],
    event["created_at"],
    event["createdAt"],
  ];
  for (const candidate of candidates) {
    if (typeof candidate === "string" && candidate.trim()) return candidate.trim();
  }
  return null;
}

export async function handleResendWebhookRequest(request: Request) {
  const url = new URL(request.url);
  if (url.pathname !== RESEND_WEBHOOK_PATH) return null;
  if (request.method !== "POST") {
    return jsonResponse({ error: "Método não permitido." }, { status: 405 });
  }

  loadLocalServerEnv();
  const apiKey = process.env["RESEND_API_KEY"];
  const webhookSecret = process.env["RESEND_WEBHOOK_SECRET"];
  if (!apiKey || !webhookSecret) {
    return jsonResponse({ error: "Webhook Resend não configurado." }, { status: 503 });
  }

  const eventId = request.headers.get("svix-id");
  const timestamp = request.headers.get("svix-timestamp");
  const signature = request.headers.get("svix-signature");
  if (!eventId || !timestamp || !signature) {
    return jsonResponse({ error: "Headers de assinatura ausentes." }, { status: 400 });
  }

  try {
    const payload = await request.text();
    const verified = new Resend(apiKey).webhooks.verify({
      payload,
      headers: { id: eventId, timestamp, signature },
      webhookSecret,
    }) as unknown as Record<string, unknown>;
    const type = typeof verified["type"] === "string" ? verified["type"] : "unknown";
    const providerMessageId = readMessageId(verified);
    const result = await createEmailRepository().recordWebhookEvent({
      providerEventId: eventId,
      providerMessageId,
      eventType: type,
      payload: verified,
      occurredAt: readOccurredAt(verified),
      status: statusFromEvent(type),
    });

    console.info("email.webhook", {
      provider: "resend",
      eventType: type,
      providerMessageId,
      result,
    });
    return jsonResponse({ ok: true, result });
  } catch (error) {
    console.error("email.webhook.failure", error instanceof Error ? error.message : error);
    return jsonResponse({ error: "Webhook inválido." }, { status: 400 });
  }
}
