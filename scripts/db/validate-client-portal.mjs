import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { Pool } from "pg";

const workspaceRoot = resolve(fileURLToPath(new URL("../..", import.meta.url)));

function loadEnvFile(fileName) {
  const path = resolve(workspaceRoot, fileName);
  if (!existsSync(path)) return;
  for (const line of readFileSync(path, "utf8").split(/\r?\n/)) {
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

loadEnvFile(".env.local");
loadEnvFile(".env");
const databaseUrl = process.env.DATABASE_URL;
if (!databaseUrl) throw new Error("DATABASE_URL não está configurada.");
if (databaseUrl.includes(".railway.internal") && !process.env.RAILWAY_ENVIRONMENT) {
  throw new Error("DATABASE_URL interna da Railway não está disponível fora da Railway.");
}

const pool = new Pool({
  connectionString: databaseUrl,
  ssl: process.env.PGSSLMODE === "require" ? { rejectUnauthorized: false } : undefined,
});

try {
  const table = await pool.query(`
    select to_regclass('public.client_portal_users') as name
  `);
  if (!table.rows[0]?.name) throw new Error("Tabela public.client_portal_users ainda não existe.");

  const columns = await pool.query(`
    select column_name
    from information_schema.columns
    where table_schema = 'public' and table_name = 'client_portal_users'
  `);
  const available = new Set(columns.rows.map((row) => row.column_name));
  const required = [
    "id",
    "company_id",
    "client_id",
    "auth_user_id",
    "name",
    "email",
    "phone",
    "role",
    "status",
  ];
  const missing = required.filter((column) => !available.has(column));
  if (missing.length) throw new Error(`Colunas ausentes: ${missing.join(", ")}`);

  const crossTenant = await pool.query(`
    select count(*)::int as count
    from public.client_portal_users portal
    join public.clients clients on clients.id = portal.client_id
    where portal.deleted_at is null
      and clients.company_id <> portal.company_id
  `);
  if (Number(crossTenant.rows[0]?.count ?? 0) !== 0) {
    throw new Error("Há vínculo de Portal com company_id diferente da empresa do cliente.");
  }

  const internalUsers = await pool.query(`
    select count(*)::int as count
    from public.client_portal_users portal
    join public.users internal_user on internal_user.auth_user_id = portal.auth_user_id
    where portal.deleted_at is null
      and internal_user.deleted_at is null
  `);
  if (Number(internalUsers.rows[0]?.count ?? 0) !== 0) {
    throw new Error(
      "Proteção acionada: existe usuário de Portal também cadastrado como usuário interno do ERP.",
    );
  }

  const invalidAuth = await pool.query(`
    select count(*)::int as count
    from public.client_portal_users portal
    left join public."user" auth_user on auth_user.id = portal.auth_user_id
    where portal.deleted_at is null
      and (auth_user.id is null or auth_user.deleted_at is not null)
  `);
  if (Number(invalidAuth.rows[0]?.count ?? 0) !== 0) {
    throw new Error("Há vínculo de Portal sem usuário Better Auth válido.");
  }

  console.log(
    JSON.stringify(
      {
        ok: true,
        table: "public.client_portal_users",
        portalUsers: Number(
          (
            await pool.query(
              `select count(*)::int as count from public.client_portal_users where deleted_at is null`,
            )
          ).rows[0]?.count ?? 0,
        ),
        isolation: "ok",
        internalUserOverlap: 0,
      },
      null,
      2,
    ),
  );
} finally {
  await pool.end();
}
