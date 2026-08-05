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

function dateKey(offsetDays) {
  return new Date(Date.now() + offsetDays * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);
}

const suffix = Date.now().toString().slice(-8);
let clientId = "";
const callIds = [];
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
        tradeName: `Teste Agenda ${suffix}`,
        legalName: `Teste Agenda ${suffix} LTDA`,
        document: `22333444${suffix.slice(0, 4)}90`,
        stateRegistration: "",
        municipalRegistration: "",
        segment: "Teste operacional",
        email: `agenda-${suffix}@example.com`,
        phone: "",
        website: "",
        notes: "Registro temporario de teste funcional de agenda.",
        logoUrl: "",
        owner: "Teste Agenda",
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

  const scheduled = await request(
    "/api/scheduled-calls",
    {
      method: "POST",
      body: JSON.stringify({
        clientId,
        ownerUserId: "",
        title: `Call teste ${suffix}`,
        description: "Validacao funcional de agenda.",
        startDate: dateKey(2),
        startTime: "09:00",
        endDate: dateKey(2),
        endTime: "09:30",
        timezone: "America/Sao_Paulo",
        meetingLink: "https://meet.google.com/automy-test",
        contactName: "Teste Agenda",
        contactEmail: `agenda-${suffix}@example.com`,
        contactPhone: "",
        participants: "Matheus; Operacao",
        reminderMinutes: 30,
        notes: "Remover apos teste.",
        status: "scheduled",
      }),
    },
    cookie,
  );
  await assertOk("createScheduled", scheduled, 201);
  const scheduledId = scheduled.json.call.id;
  callIds.push(scheduledId);

  const rescheduled = await request(
    "/api/scheduled-calls",
    {
      method: "PATCH",
      body: JSON.stringify({
        id: scheduledId,
        startDate: dateKey(3),
        startTime: "10:00",
        endDate: dateKey(3),
        endTime: "10:45",
        timezone: "America/Sao_Paulo",
        status: "rescheduled",
      }),
    },
    cookie,
  );
  await assertOk("rescheduled", rescheduled);

  const completed = await request(
    "/api/scheduled-calls",
    { method: "PATCH", body: JSON.stringify({ id: scheduledId, status: "completed" }) },
    cookie,
  );
  await assertOk("completed", completed);

  const cancellable = await request(
    "/api/scheduled-calls",
    {
      method: "POST",
      body: JSON.stringify({
        clientId,
        ownerUserId: "",
        title: `Call cancelamento ${suffix}`,
        description: "",
        startDate: dateKey(4),
        startTime: "11:00",
        endDate: dateKey(4),
        endTime: "11:30",
        timezone: "America/Sao_Paulo",
        meetingLink: "",
        contactName: "",
        contactEmail: "",
        contactPhone: "",
        participants: "",
        reminderMinutes: 15,
        notes: "",
        status: "scheduled",
      }),
    },
    cookie,
  );
  await assertOk("createCancelable", cancellable, 201);
  const cancellableId = cancellable.json.call.id;
  callIds.push(cancellableId);

  const canceled = await request(
    "/api/scheduled-calls",
    { method: "PATCH", body: JSON.stringify({ id: cancellableId, status: "canceled" }) },
    cookie,
  );
  await assertOk("canceled", canceled);

  const listed = await request("/api/scheduled-calls", {}, cookie);
  await assertOk("list", listed);
  const completedVisible = listed.json.calls.some(
    (call) => call.id === scheduledId && call.status === "completed",
  );
  const canceledVisible = listed.json.calls.some(
    (call) => call.id === cancellableId && call.status === "canceled",
  );

  for (const callId of [...callIds]) {
    const deletedCall = await request(
      `/api/scheduled-calls?id=${encodeURIComponent(callId)}`,
      { method: "DELETE" },
      cookie,
    );
    await assertOk(`deleteCall:${callId}`, deletedCall);
    callIds.splice(callIds.indexOf(callId), 1);
  }

  const deletedClient = await request(
    `/api/clients?id=${encodeURIComponent(clientId)}`,
    { method: "DELETE" },
    cookie,
  );
  await assertOk("deleteClient", deletedClient);
  clientId = "";

  const after = await request("/api/scheduled-calls", {}, cookie);
  await assertOk("after", after);
  const stillVisible = after.json.calls.some(
    (call) => call.id === scheduledId || call.id === cancellableId,
  );

  console.log(
    JSON.stringify(
      {
        login: login.status,
        client: createdClient.status,
        createScheduled: scheduled.status,
        rescheduled: rescheduled.status,
        completed: completed.status,
        createCancelable: cancellable.status,
        canceled: canceled.status,
        list: listed.status,
        completedVisible,
        canceledVisible,
        stillVisible,
      },
      null,
      2,
    ),
  );

  if (!completedVisible || !canceledVisible || stillVisible) process.exitCode = 1;
} finally {
  if (cookie) {
    for (const callId of callIds) {
      await request(
        `/api/scheduled-calls?id=${encodeURIComponent(callId)}`,
        { method: "DELETE" },
        cookie,
      ).catch(() => null);
    }
  }

  if (cookie && clientId) {
    await request(
      `/api/clients?id=${encodeURIComponent(clientId)}`,
      { method: "DELETE" },
      cookie,
    ).catch(() => null);
  }
}
