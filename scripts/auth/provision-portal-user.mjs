import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { betterAuth } from "better-auth";
import { PostgresDialect } from "kysely";
import { Pool } from "pg";

const workspaceRoot = resolve(fileURLToPath(new URL("../..", import.meta.url)));

function loadEnvFile(fileName) {
  const filePath = resolve(workspaceRoot, fileName);
  if (!existsSync(filePath)) return;
  for (const line of readFileSync(filePath, "utf8").split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const separator = trimmed.indexOf("=");
    if (separator === -1) continue;
    const key = trimmed.slice(0, separator).trim();
    const value = trimmed
      .slice(separator + 1)
      .trim()
      .replace(/^['"]|['"]$/g, "");
    if (key && process.env[key] === undefined) process.env[key] = value;
  }
}

function requireEnv(name) {
  const value = process.env[name]?.trim();
  if (!value) throw new Error(`${name} não está configurada.`);
  return value;
}

loadEnvFile(".env.local");
loadEnvFile(".env");

const databaseUrl = requireEnv("DATABASE_URL");
if (databaseUrl.includes(".railway.internal") && !process.env.RAILWAY_ENVIRONMENT) {
  throw new Error("DATABASE_URL interna da Railway só pode ser usada dentro da Railway.");
}

const clientId = requireEnv("PORTAL_CLIENT_ID");
const email = requireEnv("PORTAL_USER_EMAIL").toLowerCase();
const password = requireEnv("PORTAL_USER_PASSWORD");
const name = process.env.PORTAL_USER_NAME?.trim() || email;
const phone = process.env.PORTAL_USER_PHONE?.trim() || null;
const portalRole = process.env.PORTAL_USER_ROLE?.trim() || "customer";
const betterAuthSecret = requireEnv("BETTER_AUTH_SECRET");
const betterAuthUrl = process.env.BETTER_AUTH_URL?.trim() || "http://localhost:8080";

if (password.length < 8) throw new Error("PORTAL_USER_PASSWORD deve ter pelo menos 8 caracteres.");
if (!new Set(["customer", "billing", "technical"]).has(portalRole)) {
  throw new Error("PORTAL_USER_ROLE inválida. Use customer, billing ou technical.");
}

const pool = new Pool({
  connectionString: databaseUrl,
  ssl: process.env.PGSSLMODE === "require" ? { rejectUnauthorized: false } : undefined,
});

let createdAuthUserId = null;
try {
  const clientResult = await pool.query(
    `
      select id, company_id, status, coalesce(trade_name, legal_name) as name
      from public.clients
      where id = $1::uuid and deleted_at is null
      limit 1
    `,
    [clientId],
  );
  const client = clientResult.rows[0];
  if (!client) throw new Error("Cliente não encontrado.");
  if (client.status === "blocked")
    throw new Error("Cliente bloqueado não pode receber acesso ao Portal.");

  const existing = await pool.query(
    `select id from public."user" where lower(email) = lower($1) and deleted_at is null limit 1`,
    [email],
  );
  if (existing.rowCount) {
    throw new Error(
      "Já existe uma conta de autenticação com esse e-mail. Não foi feita nenhuma alteração.",
    );
  }

  const auth = betterAuth({
    appName: "Automy",
    baseURL: betterAuthUrl,
    basePath: "/api/auth",
    secret: betterAuthSecret,
    database: {
      dialect: new PostgresDialect({ pool }),
      type: "postgres",
      casing: "snake",
    },
    emailAndPassword: {
      enabled: true,
      disableSignUp: false,
      minPasswordLength: 8,
      autoSignIn: false,
    },
    user: {
      additionalFields: {
        role: { type: "string", required: true, defaultValue: "read_only", input: false },
        status: { type: "string", required: true, defaultValue: "active", input: false },
        lastLogin: { type: "date", required: false, input: false, fieldName: "last_login" },
        deletedAt: { type: "date", required: false, input: false, fieldName: "deleted_at" },
      },
    },
    advanced: {
      database: { generateId: "uuid" },
      cookiePrefix: "automy",
    },
  });

  const signUp = await auth.api.signUpEmail({
    body: { name, email, password, rememberMe: false },
    headers: new Headers({ origin: betterAuthUrl }),
  });
  createdAuthUserId = signUp?.user?.id ?? null;
  if (!createdAuthUserId) {
    const created = await pool.query(
      `select id from public."user" where lower(email) = lower($1) and deleted_at is null limit 1`,
      [email],
    );
    createdAuthUserId = created.rows[0]?.id ?? null;
  }
  if (!createdAuthUserId) throw new Error("Better Auth não retornou o usuário criado.");

  // Defense-in-depth: Portal users are auth-only and are never inserted into public.users.
  await pool.query(
    `update public."user" set role = 'read_only', status = 'active', updated_at = now() where id = $1`,
    [createdAuthUserId],
  );

  const internalUser = await pool.query(
    `select id from public.users where auth_user_id = $1 and deleted_at is null limit 1`,
    [createdAuthUserId],
  );
  if (internalUser.rowCount)
    throw new Error("Proteção acionada: usuário de Portal não pode existir em public.users.");

  await pool.query(
    `
      insert into public.client_portal_users (
        company_id, client_id, auth_user_id, name, email, phone, role, status,
        is_primary, created_by, updated_by
      ) values ($1, $2, $3, $4, $5, $6, $7, 'active', true, $3, $3)
    `,
    [client.company_id, client.id, createdAuthUserId, name, email, phone, portalRole],
  );

  console.log(
    JSON.stringify(
      {
        ok: true,
        clientId: client.id,
        client: client.name,
        authUserId: createdAuthUserId,
        email,
        role: portalRole,
      },
      null,
      2,
    ),
  );
} catch (error) {
  if (createdAuthUserId) {
    // Clean up only the auth user created during THIS run. FK cascades remove credential account/mapping.
    await pool
      .query(
        `delete from public."user" where id = $1 and not exists (select 1 from public.users where auth_user_id = $1)`,
        [createdAuthUserId],
      )
      .catch(() => undefined);
  }
  throw error;
} finally {
  await pool.end();
}
