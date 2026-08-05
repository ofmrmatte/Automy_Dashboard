const baseUrl = process.env.SECURITY_BASE_URL || "http://127.0.0.1:4173";
const requestOrigin = process.env.SECURITY_ORIGIN || new URL(baseUrl).origin;

const checks = [];

function record(name, status, details = {}) {
  checks.push({ name, status, details });
}

function assertStatus(name, actual, expected) {
  record(name, actual === expected ? "passed" : "failed", { expected, actual });
}

function cookieHeaderFrom(response) {
  const raw = response.headers.getSetCookie?.() ?? [];
  return raw.map((cookie) => cookie.split(";")[0]).join("; ");
}

async function request(path, init = {}) {
  return fetch(new URL(path, baseUrl), {
    redirect: "manual",
    ...init,
    headers: {
      accept: "application/json",
      origin: requestOrigin,
      ...(init.body ? { "content-type": "application/json" } : {}),
      ...init.headers,
    },
  });
}

async function signIn(email, password) {
  const response = await request("/api/auth/sign-in/email", {
    method: "POST",
    body: JSON.stringify({ email, password, rememberMe: true }),
  });

  return {
    response,
    cookie: cookieHeaderFrom(response),
  };
}

async function verifyAnonymousApiProtection() {
  const internalEndpoints = [
    "/api/clients",
    "/api/products",
    "/api/contracts",
    "/api/support/tickets",
    "/api/scheduled-calls",
    "/api/settings/profile?authUserId=test",
    "/api/dashboard/summary",
    "/api/dashboard/activity",
    "/api/finance/charges",
    "/api/identity/profile",
    "/api/identity/preferences",
    "/api/identity/sessions",
    "/api/users",
    "/api/users/sessions?id=test",
    "/api/permissions",
  ];

  for (const endpoint of internalEndpoints) {
    const response = await request(endpoint);
    assertStatus(`GET ${endpoint} sem sessao`, response.status, 401);
  }

  const writeResponse = await request("/api/finance/charges", { method: "POST", body: "{}" });
  assertStatus("POST /api/finance/charges sem sessao", writeResponse.status, 401);

  const createUserResponse = await request("/api/users", { method: "POST", body: "{}" });
  assertStatus("POST /api/users sem sessao", createUserResponse.status, 401);

  const passwordResponse = await request("/api/users/password", { method: "POST", body: "{}" });
  assertStatus("POST /api/users/password sem sessao", passwordResponse.status, 401);

  const revokeSessionsResponse = await request("/api/users/sessions?id=test", {
    method: "DELETE",
  });
  assertStatus("DELETE /api/users/sessions sem sessao", revokeSessionsResponse.status, 401);

  const updateIdentityProfileResponse = await request("/api/identity/profile", {
    method: "PATCH",
    body: "{}",
  });
  assertStatus("PATCH /api/identity/profile sem sessao", updateIdentityProfileResponse.status, 401);

  const updateIdentityPreferencesResponse = await request("/api/identity/preferences", {
    method: "PATCH",
    body: "{}",
  });
  assertStatus(
    "PATCH /api/identity/preferences sem sessao",
    updateIdentityPreferencesResponse.status,
    401,
  );

  const updateIdentityPasswordResponse = await request("/api/identity/password", {
    method: "POST",
    body: "{}",
  });
  assertStatus(
    "POST /api/identity/password sem sessao",
    updateIdentityPasswordResponse.status,
    401,
  );

  const uploadIdentityAvatarResponse = await request("/api/identity/avatar", {
    method: "POST",
    body: "{}",
  });
  assertStatus("POST /api/identity/avatar sem sessao", uploadIdentityAvatarResponse.status, 401);

  const deleteIdentitySessionsResponse = await request("/api/identity/sessions?id=test", {
    method: "DELETE",
  });
  assertStatus(
    "DELETE /api/identity/sessions sem sessao",
    deleteIdentitySessionsResponse.status,
    401,
  );
}

async function verifyUntrustedOrigin() {
  const response = await request("/api/auth/sign-in/email", {
    method: "POST",
    headers: { origin: "https://untrusted.example" },
    body: JSON.stringify({ email: "security@example.invalid", password: "invalid-password" }),
  });

  record("Origin nao confiavel rejeitado", response.status >= 400 ? "passed" : "failed", {
    actual: response.status,
  });
}

async function verifyAdminFlow() {
  const email = process.env.SECURITY_ADMIN_EMAIL;
  const password = process.env.SECURITY_ADMIN_PASSWORD;
  if (!email || !password) {
    record("Admin autenticado", "skipped", {
      reason: "Defina SECURITY_ADMIN_EMAIL e SECURITY_ADMIN_PASSWORD para validar.",
    });
    return;
  }

  const { response, cookie } = await signIn(email, password);
  assertStatus("Login admin", response.status, 200);

  if (!cookie) {
    record("Cookie de sessao admin", "failed");
    return;
  }

  const readResponse = await request("/api/finance/charges", {
    headers: { cookie },
  });
  assertStatus("Admin lendo /api/finance/charges", readResponse.status, 200);

  const writeResponse = await request("/api/finance/charges", {
    method: "POST",
    headers: { cookie },
    body: "{}",
  });
  assertStatus("Admin autorizado antes do metodo nao implementado", writeResponse.status, 405);

  const profileResponse = await request("/api/identity/profile", {
    headers: { cookie },
  });
  record("Sessao persistente admin", profileResponse.status !== 401, {
    actual: profileResponse.status,
  });
}

async function verifyReadOnlyWriteBlock() {
  const email = process.env.SECURITY_READ_ONLY_EMAIL;
  const password = process.env.SECURITY_READ_ONLY_PASSWORD;
  if (!email || !password) {
    record("read_only escrevendo cobrancas", "skipped", {
      reason: "Defina SECURITY_READ_ONLY_EMAIL e SECURITY_READ_ONLY_PASSWORD para validar.",
    });
    return;
  }

  const { response, cookie } = await signIn(email, password);
  assertStatus("Login read_only", response.status, 200);

  if (!cookie) {
    record("Cookie de sessao read_only", "failed");
    return;
  }

  const writeResponse = await request("/api/finance/charges", {
    method: "POST",
    headers: { cookie },
    body: "{}",
  });
  assertStatus("read_only escrevendo /api/finance/charges", writeResponse.status, 403);
}

await verifyAnonymousApiProtection();
await verifyUntrustedOrigin();
await verifyAdminFlow();
await verifyReadOnlyWriteBlock();

record("Isolamento por empresa", "documented", {
  reason:
    "Handlers derivam company_id do usuario autenticado; teste multiempresa requer fixture dedicada.",
});

const failed = checks.filter((check) => check.status === "failed");
console.log(JSON.stringify({ baseUrl, checks }, null, 2));

if (failed.length > 0) {
  process.exitCode = 1;
}
