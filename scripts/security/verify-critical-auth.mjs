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
    "/api/dashboard/charts",
    "/api/dashboard/recent-clients",
    "/api/dashboard/activity",
    "/api/reports?kind=clients&period=all",
    "/api/search?q=matheus",
    "/api/finance/charges",
    "/api/identity/profile",
    "/api/identity/preferences",
    "/api/identity/sessions",
    "/api/users",
    "/api/users/sessions?id=test",
    "/api/permissions",
    "/api/settings/company",
    "/api/settings/security",
    "/api/settings/integrations",
    "/api/settings/notifications",
    "/api/notifications",
  ];

  for (const endpoint of internalEndpoints) {
    const response = await request(endpoint);
    assertStatus(`GET ${endpoint} sem sessao`, response.status, 401);
  }

  const writeResponse = await request("/api/finance/charges", { method: "POST", body: "{}" });
  assertStatus("POST /api/finance/charges sem sessao", writeResponse.status, 401);

  const updateFinanceResponse = await request("/api/finance/charges", {
    method: "PATCH",
    body: "{}",
  });
  assertStatus("PATCH /api/finance/charges sem sessao", updateFinanceResponse.status, 401);

  const deleteFinanceResponse = await request("/api/finance/charges?id=test", {
    method: "DELETE",
  });
  assertStatus("DELETE /api/finance/charges sem sessao", deleteFinanceResponse.status, 401);

  const createUserResponse = await request("/api/users", { method: "POST", body: "{}" });
  assertStatus("POST /api/users sem sessao", createUserResponse.status, 401);

  const updateClientResponse = await request("/api/clients", { method: "PATCH", body: "{}" });
  assertStatus("PATCH /api/clients sem sessao", updateClientResponse.status, 401);

  const deleteClientResponse = await request("/api/clients?id=test", { method: "DELETE" });
  assertStatus("DELETE /api/clients sem sessao", deleteClientResponse.status, 401);

  const updateProductResponse = await request("/api/products", { method: "PATCH", body: "{}" });
  assertStatus("PATCH /api/products sem sessao", updateProductResponse.status, 401);

  const deleteProductResponse = await request("/api/products?id=test", { method: "DELETE" });
  assertStatus("DELETE /api/products sem sessao", deleteProductResponse.status, 401);

  const updateContractResponse = await request("/api/contracts", { method: "PATCH", body: "{}" });
  assertStatus("PATCH /api/contracts sem sessao", updateContractResponse.status, 401);

  const deleteContractResponse = await request("/api/contracts?id=test", { method: "DELETE" });
  assertStatus("DELETE /api/contracts sem sessao", deleteContractResponse.status, 401);

  const updateSupportResponse = await request("/api/support/tickets", {
    method: "PATCH",
    body: "{}",
  });
  assertStatus("PATCH /api/support/tickets sem sessao", updateSupportResponse.status, 401);

  const deleteSupportResponse = await request("/api/support/tickets?id=test", {
    method: "DELETE",
  });
  assertStatus("DELETE /api/support/tickets sem sessao", deleteSupportResponse.status, 401);

  const updateScheduledCallResponse = await request("/api/scheduled-calls", {
    method: "PATCH",
    body: "{}",
  });
  assertStatus("PATCH /api/scheduled-calls sem sessao", updateScheduledCallResponse.status, 401);

  const deleteScheduledCallResponse = await request("/api/scheduled-calls?id=test", {
    method: "DELETE",
  });
  assertStatus("DELETE /api/scheduled-calls sem sessao", deleteScheduledCallResponse.status, 401);

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

  const updateCompanyResponse = await request("/api/settings/company", {
    method: "PATCH",
    body: "{}",
  });
  assertStatus("PATCH /api/settings/company sem sessao", updateCompanyResponse.status, 401);

  const testIntegrationResponse = await request("/api/settings/integrations/railway/test", {
    method: "POST",
  });
  assertStatus(
    "POST /api/settings/integrations/:provider/test sem sessao",
    testIntegrationResponse.status,
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
  assertStatus("Admin autorizado antes da validacao financeira", writeResponse.status, 400);

  const profileResponse = await request("/api/identity/profile", {
    headers: { cookie },
  });
  record("Sessao persistente admin", profileResponse.status !== 401 ? "passed" : "failed", {
    actual: profileResponse.status,
  });

  const companySettingsResponse = await request("/api/settings/company", {
    headers: { cookie },
  });
  assertStatus("Admin lendo /api/settings/company", companySettingsResponse.status, 200);

  const notificationSettingsResponse = await request("/api/settings/notifications", {
    headers: { cookie },
  });
  assertStatus("Admin lendo /api/settings/notifications", notificationSettingsResponse.status, 200);

  const reportResponse = await request("/api/reports?kind=clients&period=all", {
    headers: { cookie },
  });
  assertStatus("Admin lendo /api/reports", reportResponse.status, 200);

  const searchResponse = await request("/api/search?q=matheus", {
    headers: { cookie },
  });
  assertStatus("Admin pesquisando /api/search", searchResponse.status, 200);
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
