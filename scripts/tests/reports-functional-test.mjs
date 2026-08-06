const baseUrl = process.env.TEST_BASE_URL || "http://localhost:4173";
const email = process.env.TEST_ADMIN_EMAIL;
const password = process.env.TEST_ADMIN_PASSWORD;

if (!email || !password) {
  throw new Error("Defina TEST_ADMIN_EMAIL e TEST_ADMIN_PASSWORD para executar o teste.");
}

const reportKinds = [
  "clients",
  "products",
  "contracts",
  "finance",
  "scheduling",
  "support",
  "users",
  "permissions",
  "audit",
];

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

const login = await request("/api/auth/sign-in/email", {
  method: "POST",
  body: JSON.stringify({ email, password, rememberMe: true }),
});
await assertOk("login", login);
if (!login.cookie) throw new Error("login:cookie ausente");

const results = [];
for (const kind of reportKinds) {
  const result = await request(`/api/reports?kind=${kind}&period=all`, {}, login.cookie);
  await assertOk(`report:${kind}`, result);
  const report = result.json?.report;
  const valid =
    report?.kind === kind &&
    typeof report.title === "string" &&
    typeof report.generatedAt === "string" &&
    Array.isArray(report.rows);
  results.push({ kind, status: result.status, rows: report?.rows?.length ?? 0, valid });
}

const invalid = results.filter((result) => !result.valid);
console.log(JSON.stringify({ login: login.status, reports: results }, null, 2));

if (invalid.length > 0) {
  process.exitCode = 1;
}
