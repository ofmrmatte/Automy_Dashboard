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

async function archiveProductNotifications(cookie, productId) {
  const notifications = await request("/api/notifications", {}, cookie);
  if (notifications.status !== 200) return;

  const related = notifications.json?.notifications?.filter(
    (notification) => notification.relatedEntityId === productId,
  );
  for (const notification of related ?? []) {
    await request(
      `/api/notifications/${encodeURIComponent(notification.id)}/archive`,
      {
        method: "PATCH",
      },
      cookie,
    );
  }
}

const suffix = Date.now().toString().slice(-8);
let cookie = "";
let productId = "";
let archived = false;

try {
  const login = await request("/api/auth/sign-in/email", {
    method: "POST",
    body: JSON.stringify({ email, password, rememberMe: true }),
  });
  await assertOk("login", login);
  if (!login.cookie) throw new Error("login:cookie ausente");
  cookie = login.cookie;

  const anonymous = await request("/api/notifications");
  await assertOk("anonymous", anonymous, 401);

  const createdProduct = await request(
    "/api/products",
    {
      method: "POST",
      body: JSON.stringify({
        name: `Teste Notificacao ${suffix}`,
        description: "Produto temporario para validar notificacoes reais.",
        category: "Operacional",
        version: "1.0.0",
        status: "Ativo",
        basePrice: 10,
        billingMode: "Mensal",
        notes: "Remover apos teste.",
        hostedOnAutomyUrl: true,
        customUrl: false,
        userLimit: 5,
        segment: "Teste funcional",
        implementationDays: 15,
        implementationFee: 0,
        paymentMethod: "Pix",
        installments: 1,
        discountPercent: 0,
        hasMonthlyFee: true,
        monthlyFee: 10,
        hasDatabaseCost: false,
        databaseCost: 0,
        extraUserPrice: 0,
        loyaltyMonths: 12,
        deliverables: "Validacao operacional de notificacoes reais da Automy.",
        contractTemplate: "",
      }),
    },
    cookie,
  );
  await assertOk("createProduct", createdProduct, 201);
  productId = createdProduct.json.product.id;

  const listed = await request("/api/notifications", {}, cookie);
  await assertOk("listNotifications", listed);
  const notification = listed.json.notifications.find(
    (item) => item.relatedEntityId === productId && item.relatedEntityType === "product",
  );

  if (!notification) {
    throw new Error("notification:notificacao operacional nao encontrada");
  }

  const read = await request(
    `/api/notifications/${encodeURIComponent(notification.id)}/read`,
    { method: "PATCH" },
    cookie,
  );
  await assertOk("markRead", read);

  const archive = await request(
    `/api/notifications/${encodeURIComponent(notification.id)}/archive`,
    { method: "PATCH" },
    cookie,
  );
  await assertOk("archive", archive);
  archived = true;

  const afterArchive = await request("/api/notifications", {}, cookie);
  await assertOk("afterArchive", afterArchive);
  const stillVisible = afterArchive.json.notifications.some((item) => item.id === notification.id);

  console.log(
    JSON.stringify(
      {
        login: login.status,
        anonymous: anonymous.status,
        createProduct: createdProduct.status,
        listNotifications: listed.status,
        notificationFound: Boolean(notification),
        markRead: read.status,
        archive: archive.status,
        stillVisible,
      },
      null,
      2,
    ),
  );

  if (stillVisible) process.exitCode = 1;
} finally {
  if (cookie && productId) {
    await request(
      `/api/products?id=${encodeURIComponent(productId)}`,
      { method: "DELETE" },
      cookie,
    );
    if (!archived) await archiveProductNotifications(cookie, productId);
    await archiveProductNotifications(cookie, productId);
  }
}
