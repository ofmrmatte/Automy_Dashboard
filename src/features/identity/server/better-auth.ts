import { betterAuth, type BetterAuthPlugin } from "better-auth";
import { dash } from "@better-auth/infra";
import { tanstackStartCookies } from "better-auth/tanstack-start";
import { PostgresDialect } from "kysely";
import { Pool } from "pg";
import { APP_NAME } from "@/shared/constants/app";
import { sendPasswordResetEmail } from "@/features/email/transactional-email";
import { resolveBetterAuthBaseURL, resolveTrustedAppOrigins } from "@/shared/server/app-urls";
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
  const plugins: BetterAuthPlugin[] = [];
  const betterAuthApiKey = process.env["BETTER_AUTH_API_KEY"];

  if (betterAuthApiKey) {
    plugins.push(
      dash({
        apiKey: betterAuthApiKey,
        ...(process.env["BETTER_AUTH_API_URL"]
          ? { apiUrl: process.env["BETTER_AUTH_API_URL"] }
          : {}),
        ...(process.env["BETTER_AUTH_KV_URL"] ? { kvUrl: process.env["BETTER_AUTH_KV_URL"] } : {}),
      }),
    );
  }

  plugins.push(tanstackStartCookies());

  return betterAuth({
    appName: APP_NAME,
    baseURL: resolveBetterAuthBaseURL(),
    basePath: BETTER_AUTH_PATH,
    secret: process.env["BETTER_AUTH_SECRET"],
    database: {
      dialect: new PostgresDialect({ pool }),
      type: "postgres",
      casing: "snake",
    },
    trustedOrigins: resolveTrustedAppOrigins(),
    emailAndPassword: {
      enabled: true,
      disableSignUp: true,
      minPasswordLength: 8,
      revokeSessionsOnPasswordReset: true,
      sendResetPassword: async ({ user, url }) => {
        await sendPasswordResetEmail({
          to: user.email,
          name: user.name || user.email,
          resetUrl: url,
          authUserId: user.id,
        });
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
        deletedAt: {
          type: "date",
          required: false,
          input: false,
          fieldName: "deleted_at",
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
            await pool.query(
              `
                insert into public.login_history (
                  company_id,
                  auth_user_id,
                  success,
                  ip_address,
                  user_agent,
                  origin,
                  created_by,
                  updated_by
                )
                select users.company_id, $1, true, $2, $3, $4, $1, $1
                from public.users
                where users.auth_user_id = $1
                  and users.deleted_at is null
                limit 1
              `,
              [
                session.userId,
                "ipAddress" in session ? session.ipAddress : null,
                "userAgent" in session ? session.userAgent : null,
                resolveBetterAuthBaseURL(),
              ],
            );
          },
        },
      },
    },
    plugins,
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
