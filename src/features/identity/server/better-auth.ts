import { betterAuth } from "better-auth";
import { tanstackStartCookies } from "better-auth/tanstack-start";
import { PostgresDialect } from "kysely";
import { Pool } from "pg";
import { APP_NAME } from "@/shared/constants/app";
import { loadLocalServerEnv } from "@/shared/server/env";

const BETTER_AUTH_PATH = "/api/auth";

let authInstance: ReturnType<typeof createAutomyAuth> | undefined;

function createPgPool() {
  loadLocalServerEnv();

  const databaseUrl = process.env["DATABASE_URL"];
  if (!databaseUrl) {
    throw new Error("DATABASE_URL não está configurado para o Better Auth.");
  }

  if (databaseUrl.includes(".railway.internal") && !process.env["RAILWAY_ENVIRONMENT"]) {
    throw new Error(
      "DATABASE_URL interna da Railway só pode ser usada dentro da rede privada Railway.",
    );
  }

  return new Pool({
    connectionString: databaseUrl,
    ssl: process.env["PGSSLMODE"] === "require" ? { rejectUnauthorized: false } : undefined,
  });
}

function createAutomyAuth() {
  const pool = createPgPool();
  const baseURL = process.env["BETTER_AUTH_URL"];
  const vercelURL = process.env["VERCEL_URL"] ? `https://${process.env["VERCEL_URL"]}` : undefined;

  return betterAuth({
    appName: APP_NAME,
    baseURL,
    basePath: BETTER_AUTH_PATH,
    secret: process.env["BETTER_AUTH_SECRET"],
    database: {
      dialect: new PostgresDialect({ pool }),
      type: "postgres",
      casing: "snake",
    },
    trustedOrigins: [baseURL, vercelURL].filter(Boolean) as string[],
    emailAndPassword: {
      enabled: true,
      disableSignUp: true,
      minPasswordLength: 8,
      revokeSessionsOnPasswordReset: true,
      sendResetPassword: async () => {
        // Email delivery will be connected when Automy's transactional email provider is approved.
      },
    },
    emailVerification: {
      sendOnSignUp: false,
      sendOnSignIn: false,
      sendVerificationEmail: async () => {
        // Email verification is structurally ready; delivery is intentionally disabled for now.
      },
    },
    session: {
      expiresIn: 60 * 60 * 24 * 30,
      updateAge: 60 * 60 * 24,
      freshAge: 60 * 60 * 24,
      cookieCache: {
        enabled: true,
        maxAge: 60 * 5,
      },
    },
    user: {
      additionalFields: {
        role: {
          type: "string",
          required: true,
          defaultValue: "admin",
          input: false,
        },
        status: {
          type: "string",
          required: true,
          defaultValue: "active",
          input: false,
        },
        lastLogin: {
          type: "date",
          required: false,
          input: false,
          fieldName: "last_login",
        },
      },
    },
    rateLimit: {
      enabled: true,
      storage: "database",
      modelName: "rate_limit",
      fields: {
        lastRequest: "last_request",
      },
    },
    advanced: {
      database: {
        generateId: "uuid",
      },
      cookiePrefix: "automy",
      defaultCookieAttributes: {
        httpOnly: true,
        sameSite: "lax",
        secure: process.env["NODE_ENV"] === "production",
      },
    },
    databaseHooks: {
      session: {
        create: {
          after: async (session) => {
            await pool.query(`update public."user" set last_login = now() where id = $1`, [
              session.userId,
            ]);
          },
        },
      },
    },
    plugins: [tanstackStartCookies()],
  });
}

export function getAutomyAuth() {
  if (!authInstance) {
    authInstance = createAutomyAuth();
  }

  return authInstance;
}

export async function getBetterAuthSessionFromRequest(request: Request) {
  const auth = getAutomyAuth();
  return auth.api.getSession({
    headers: request.headers,
  });
}

export function handleBetterAuthRequest(request: Request) {
  const url = new URL(request.url);
  if (!url.pathname.startsWith(`${BETTER_AUTH_PATH}/`)) return null;

  return getAutomyAuth().handler(request);
}
