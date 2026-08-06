const baseUrl = process.env.TEST_BASE_URL || "http://127.0.0.1:4173";
const email = process.env.TEST_ADMIN_EMAIL;
const password = process.env.TEST_ADMIN_PASSWORD;

if (!email || !password) {
  throw new Error("Defina TEST_ADMIN_EMAIL e TEST_ADMIN_PASSWORD para executar o teste.");
}

function cookieHeaderFrom(response) {
  const raw = response.headers.getSetCookie?.() ?? [];
  return raw.map((cookie) => cookie.split(";")[0]).join("; ");
}

async function request(path, init = {}, cookie = "") {
  const response = await fetch(new URL(path, baseUrl), {
    redirect: "manual",
    ...init,
    headers: {
      accept: "application/json",
      origin: baseUrl,
      ...(init.body ? { "content-type": "application/json" } : {}),
      ...(cookie ? { cookie } : {}),
      ...init.headers,
    },
  });
  const text = await response.text();
  let json = null;
  try {
    json = text ? JSON.parse(text) : null;
  } catch {
    // Keep raw text for diagnostics.
  }
  return { status: response.status, json, text, cookie: cookieHeaderFrom(response) };
}

async function assertOk(name, result, expected = 200) {
  if (result.status !== expected) {
    throw new Error(`${name}:${result.status}:${result.text}`);
  }
}

const suffix = Date.now().toString().slice(-8);
let clientId = "";
let chargeId = "";
let cookie = "";

try {
  const login = await request("/api/auth/sign-in/email", {
    method: "POST",
    body: JSON.stringify({ email, password, rememberMe: true }),
  });
  await assertOk("login", login);
  if (!login.cookie) throw new Error("login:cookie ausente");

  cookie = login.cookie;
  const createdClient = await request(
    "/api/clients",
    {
      method: "POST",
      body: JSON.stringify({
        tradeName: `Teste Financeiro ${suffix}`,
        legalName: `Teste Financeiro ${suffix} LTDA`,
        document: `11222333${suffix.slice(0, 4)}90`,
        stateRegistration: "",
        municipalRegistration: "",
        segment: "Teste operacional",
        email: `financeiro-${suffix}@example.com`,
        phone: "",
        website: "",
        notes: "Registro temporario de teste funcional financeiro.",
        logoUrl: "",
        owner: "Teste Financeiro",
        ownerEmail: "",
        ownerPhone: "",
        plan: "",
        status: "Ativo",
        postalCode: "",
        street: "",
        number: "",
        complement: "",
        district: "",
        city: "Sao Paulo",
        state: "SP",
        country: "BR",
      }),
    },
    cookie,
  );
  await assertOk("client", createdClient, 201);
  clientId = createdClient.json.client.id;

  const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString().slice(0, 10);
  const createdCharge = await request(
    "/api/finance/charges",
    {
      method: "POST",
      body: JSON.stringify({
        clientId,
        contractId: "",
        invoice: `FIN-${suffix}`,
        reference: `REF-${suffix}`,
        description: "Cobranca temporaria de validacao funcional.",
        dueDate: yesterday,
        amount: 321.45,
        method: "Pix",
        status: "pending",
        notes: "Remover apos teste.",
      }),
    },
    cookie,
  );
  await assertOk("createCharge", createdCharge, 201);
  chargeId = createdCharge.json.charge.id;

  const listed = await request("/api/finance/charges", {}, cookie);
  await assertOk("list", listed);
  const listedCharge = listed.json.charges.find((charge) => charge.id === chargeId);
  const overdueDetected = listedCharge?.status === "overdue";

  const paid = await request(
    "/api/finance/charges",
    { method: "PATCH", body: JSON.stringify({ id: chargeId, status: "paid" }) },
    cookie,
  );
  await assertOk("paid", paid);

  const canceled = await request(
    "/api/finance/charges",
    { method: "PATCH", body: JSON.stringify({ id: chargeId, status: "canceled" }) },
    cookie,
  );
  await assertOk("cancel", canceled);

  const deletedCharge = await request(
    `/api/finance/charges?id=${encodeURIComponent(chargeId)}`,
    { method: "DELETE" },
    cookie,
  );
  await assertOk("deleteCharge", deletedCharge);
  chargeId = "";

  const deletedClient = await request(
    `/api/clients?id=${encodeURIComponent(clientId)}`,
    { method: "DELETE" },
    cookie,
  );
  await assertOk("deleteClient", deletedClient);
  clientId = "";

  const after = await request("/api/finance/charges", {}, cookie);
  await assertOk("after", after);
  const stillVisible = after.json.charges.some(
    (charge) => charge.id === createdCharge.json.charge.id,
  );

  console.log(
    JSON.stringify(
      {
        login: login.status,
        client: createdClient.status,
        createCharge: createdCharge.status,
        list: listed.status,
        overdueDetected,
        paid: paid.status,
        canceled: canceled.status,
        deleteCharge: deletedCharge.status,
        deleteClient: deletedClient.status,
        stillVisible,
      },
      null,
      2,
    ),
  );

  if (!overdueDetected || stillVisible) process.exitCode = 1;
} finally {
  if (cookie && chargeId) {
    await request(
      `/api/finance/charges?id=${encodeURIComponent(chargeId)}`,
      { method: "DELETE" },
      cookie,
    ).catch(() => null);
  }

  if (cookie && clientId) {
    await request(
      `/api/clients?id=${encodeURIComponent(clientId)}`,
      { method: "DELETE" },
      cookie,
    ).catch(() => null);
  }
}
