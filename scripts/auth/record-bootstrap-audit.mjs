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

const adminEmail = process.env.BOOTSTRAP_ADMIN_EMAIL?.trim().toLowerCase();
if (!adminEmail) throw new Error("BOOTSTRAP_ADMIN_EMAIL não está configurado.");

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
  const admin = (
    await pool.query(
      `
        select "user".id, "user".email, users.company_id
        from public."user"
        left join public.users on users.auth_user_id = "user".id
          and users.deleted_at is null
        where lower("user".email) = lower($1)
          and "user".role = 'admin'
          and "user".status = 'active'
          and "user".deleted_at is null
        limit 1
      `,
      [adminEmail],
    )
  ).rows[0];

  if (!admin) throw new Error("Administrador ativo não encontrado para auditoria.");

  await pool.query(
    `
      insert into public.audit_logs (
        company_id,
        actor_auth_user_id,
        action,
        resource_type,
        resource_id,
        metadata,
        created_by,
        updated_by
      )
      select
        $1,
        $2,
        'bootstrap.admin.created',
        'user',
        $2,
        jsonb_build_object('email', $3::text, 'role', 'admin'),
        $2,
        $2
      where not exists (
        select 1
        from public.audit_logs
        where actor_auth_user_id = $2
          and action = 'bootstrap.admin.created'
          and deleted_at is null
      )
    `,
    [admin.company_id, admin.id, admin.email],
  );

  console.log(JSON.stringify({ status: "recorded", email: admin.email }));
} finally {
  await pool.end();
}
