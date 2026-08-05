import { createHash } from "node:crypto";
import type { AuthSession } from "@/features/identity/types";
import { loadLocalServerEnv } from "@/shared/server/env";

const RAILWAY_AUTH_PATH = "/api/auth/local-login";

function jsonResponse(payload: unknown, init?: ResponseInit) {
  return new Response(JSON.stringify(payload), {
    ...init,
    headers: {
      "content-type": "application/json; charset=utf-8",
      ...init?.headers,
    },
  });
}

function uuidFromText(value: string) {
  const hash = createHash("sha256").update(`automy:${value.toLowerCase()}`).digest("hex");
  return [
    hash.slice(0, 8),
    hash.slice(8, 12),
    `4${hash.slice(13, 16)}`,
    `${((Number.parseInt(hash.slice(16, 18), 16) & 0x3f) | 0x80).toString(16)}${hash.slice(18, 20)}`,
    hash.slice(20, 32),
  ].join("-");
}

function createSession(email: string): AuthSession {
  const now = new Date().toISOString();
  const userId = process.env["AUTOMY_ADMIN_USER_ID"] || uuidFromText(email);

  return {
    access_token: crypto.randomUUID(),
    refresh_token: crypto.randomUUID(),
    expires_in: 60 * 60 * 24,
    expires_at: Math.floor(Date.now() / 1000) + 60 * 60 * 24,
    token_type: "bearer",
    user: {
      id: userId,
      app_metadata: {},
      user_metadata: {},
      aud: "authenticated",
      created_at: now,
      email,
    },
  };
}

async function handleRailwayLogin(request: Request) {
  if (request.method !== "POST") {
    return jsonResponse({ error: "Método não permitido." }, { status: 405 });
  }

  loadLocalServerEnv();

  const configuredEmail = process.env["AUTOMY_ADMIN_EMAIL"];
  const configuredPassword = process.env["AUTOMY_ADMIN_PASSWORD"];

  if (!configuredEmail || !configuredPassword) {
    return jsonResponse({ error: "Autenticação administrativa não configurada." }, { status: 503 });
  }

  const payload = (await request.json()) as { email?: unknown; password?: unknown };
  const email = typeof payload.email === "string" ? payload.email.trim().toLowerCase() : "";
  const password = typeof payload.password === "string" ? payload.password : "";

  if (email !== configuredEmail.toLowerCase() || password !== configuredPassword) {
    return jsonResponse({ error: "E-mail ou senha inválidos." }, { status: 401 });
  }

  return jsonResponse({ session: createSession(email) });
}

export function handleRailwayAuthRequest(request: Request) {
  const url = new URL(request.url);

  if (url.pathname !== RAILWAY_AUTH_PATH) {
    return null;
  }

  return handleRailwayLogin(request);
}
