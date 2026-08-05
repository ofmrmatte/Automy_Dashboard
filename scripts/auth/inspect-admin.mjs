import { existsSync, readFileSync } from "node:fs";
import { join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { Pool } from "pg";

const workspaceRoot = resolve(fileURLToPath(new URL("../..", import.meta.url)));

function loadEnvFile(fileName) {
  const filePath = join(workspaceRoot, fileName);
  if (!existsSync(filePath)) return;

  for (const line of readFileSync(filePath, "utf8").split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;

    const separatorIndex = trimmed.indexOf("=");
    if (separatorIndex === -1) continue;

    const key = trimmed.slice(0, separatorIndex).trim();
    const value = trimmed
      .slice(separatorIndex + 1)
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
  throw new Error(
    "DATABASE_URL interna da Railway só pode ser usada dentro do runtime Railway. Use DATABASE_PUBLIC_URL localmente/Vercel.",
  );
}

const pool = new Pool({
  connectionString: databaseUrl,
  ssl: process.env.PGSSLMODE === "require" ? { rejectUnauthorized: false } : undefined,
  connectionTimeoutMillis: 10_000,
});

try {
  const result = await pool.query(`
    select
      "user".email,
      "user".role,
      "user".status,
      exists (
        select 1 from public.user_profiles
        where user_profiles.auth_user_id = "user".id
          and user_profiles.deleted_at is null
      ) as profile,
      exists (
        select 1 from public.user_preferences
        where user_preferences.auth_user_id = "user".id
          and user_preferences.deleted_at is null
      ) as preferences,
      exists (
        select 1 from public.users
        where users.auth_user_id = "user".id
          and users.deleted_at is null
      ) as domain_user,
      exists (
        select 1 from public.audit_logs
        where audit_logs.actor_auth_user_id = "user".id
          and audit_logs.action = 'bootstrap.admin.created'
          and audit_logs.deleted_at is null
      ) as audit_log
    from public."user"
    where "user".role = 'admin'
      and "user".status = 'active'
      and "user".deleted_at is null
    order by "user"."createdAt" asc
    limit 5
  `);

  console.log(JSON.stringify({ admins: result.rows }));
} finally {
  await pool.end();
}
