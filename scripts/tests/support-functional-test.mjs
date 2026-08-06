const baseUrl = process.env.TEST_BASE_URL || "http://localhost:4173";
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
let ticketId = "";
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
        tradeName: `Teste Suporte ${suffix}`,
        legalName: `Teste Suporte ${suffix} LTDA`,
        document: `33444555${suffix.slice(0, 4)}90`,
        stateRegistration: "",
        municipalRegistration: "",
        segment: "Teste operacional",
        email: `suporte-${suffix}@example.com`,
        phone: "",
        website: "",
        notes: "Registro temporario de teste funcional de suporte.",
        logoUrl: "",
        owner: "Teste Suporte",
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

  const createdTicket = await request(
    "/api/support/tickets",
    {
      method: "POST",
      body: JSON.stringify({
        clientId,
        ownerUserId: "",
        title: `Ticket teste ${suffix}`,
        description: "Validacao funcional de suporte.",
        category: "Operacional",
        priority: "Alta",
        status: "Aberto",
        firstResponseDueAt: "",
        resolutionDueAt: "",
        tags: "teste, suporte",
        initialMessage: "Mensagem inicial do teste.",
      }),
    },
    cookie,
  );
  await assertOk("createTicket", createdTicket, 201);
  ticketId = createdTicket.json.ticket.id;

  const message = await request(
    "/api/support/tickets",
    { method: "PATCH", body: JSON.stringify({ id: ticketId, message: "Atualizacao registrada." }) },
    cookie,
  );
  await assertOk("message", message);

  const resolved = await request(
    "/api/support/tickets",
    { method: "PATCH", body: JSON.stringify({ id: ticketId, status: "Resolvido" }) },
    cookie,
  );
  await assertOk("resolved", resolved);

  const reopened = await request(
    "/api/support/tickets",
    { method: "PATCH", body: JSON.stringify({ id: ticketId, status: "Aberto" }) },
    cookie,
  );
  await assertOk("reopened", reopened);

  const canceled = await request(
    "/api/support/tickets",
    { method: "PATCH", body: JSON.stringify({ id: ticketId, status: "Cancelado" }) },
    cookie,
  );
  await assertOk("canceled", canceled);

  const listed = await request("/api/support/tickets", {}, cookie);
  await assertOk("list", listed);
  const listedTicket = listed.json.tickets.find((ticket) => ticket.id === ticketId);
  const messageVisible = listedTicket?.messages?.some(
    (item) => item.body === "Atualizacao registrada.",
  );
  const canceledVisible = listedTicket?.status === "Cancelado";

  const deletedTicket = await request(
    `/api/support/tickets?id=${encodeURIComponent(ticketId)}`,
    { method: "DELETE" },
    cookie,
  );
  await assertOk("deleteTicket", deletedTicket);
  ticketId = "";

  const deletedClient = await request(
    `/api/clients?id=${encodeURIComponent(clientId)}`,
    { method: "DELETE" },
    cookie,
  );
  await assertOk("deleteClient", deletedClient);
  clientId = "";

  const after = await request("/api/support/tickets", {}, cookie);
  await assertOk("after", after);
  const stillVisible = after.json.tickets.some(
    (ticket) => ticket.id === createdTicket.json.ticket.id,
  );

  console.log(
    JSON.stringify(
      {
        login: login.status,
        client: createdClient.status,
        createTicket: createdTicket.status,
        message: message.status,
        resolved: resolved.status,
        reopened: reopened.status,
        canceled: canceled.status,
        list: listed.status,
        messageVisible,
        canceledVisible,
        deleteTicket: deletedTicket.status,
        deleteClient: deletedClient.status,
        stillVisible,
      },
      null,
      2,
    ),
  );

  if (!messageVisible || !canceledVisible || stillVisible) process.exitCode = 1;
} finally {
  if (cookie && ticketId) {
    await request(
      `/api/support/tickets?id=${encodeURIComponent(ticketId)}`,
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
