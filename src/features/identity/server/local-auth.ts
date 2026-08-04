import type { AuthSession } from "@/features/identity/types";
import { loadLocalServerEnv } from "@/shared/server/env";

const LOCAL_AUTH_PATH = "/api/auth/local-login";
const LOCAL_AUTH_USER_ID = "local-admin-user";

function jsonResponse(payload: unknown, init?: ResponseInit) {
  return new Response(JSON.stringify(payload), {
    ...init,
    headers: {
      "content-type": "application/json; charset=utf-8",
      ...init?.headers,
    },
  });
}

function createSession(email: string): AuthSession {
  const now = new Date().toISOString();

  return {
    access_token: "local-admin-access-token",
    refresh_token: "local-admin-refresh-token",
    expires_in: 60 * 60 * 24,
    expires_at: Math.floor(Date.now() / 1000) + 60 * 60 * 24,
    token_type: "bearer",
    user: {
      id: LOCAL_AUTH_USER_ID,
      app_metadata: {},
      user_metadata: {
        first_name: "Adrian",
        last_name: "Automy",
      },
      aud: "authenticated",
      created_at: now,
      email,
    },
  };
}

async function handleLocalLogin(request: Request) {
  if (request.method !== "POST") {
    return jsonResponse({ error: "Método não permitido." }, { status: 405 });
  }

  loadLocalServerEnv();

  const configuredEmail = process.env.AUTOMY_ADMIN_EMAIL;
  const configuredPassword = process.env.AUTOMY_ADMIN_PASSWORD;

  if (!configuredEmail || !configuredPassword) {
    return jsonResponse({ error: "Login administrativo não configurado." }, { status: 503 });
  }

  const payload = (await request.json()) as { email?: unknown; password?: unknown };
  const email = typeof payload.email === "string" ? payload.email.trim().toLowerCase() : "";
  const password = typeof payload.password === "string" ? payload.password : "";

  if (email !== configuredEmail.toLowerCase() || password !== configuredPassword) {
    return jsonResponse({ error: "E-mail ou senha inválidos." }, { status: 401 });
  }

  return jsonResponse({ session: createSession(email) });
}

export function handleLocalAuthRequest(request: Request) {
  const url = new URL(request.url);

  if (url.pathname !== LOCAL_AUTH_PATH) {
    return null;
  }

  return handleLocalLogin(request);
}
