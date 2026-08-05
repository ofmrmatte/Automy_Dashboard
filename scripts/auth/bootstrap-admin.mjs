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

function requireEnv(name) {
  const value = process.env[name]?.trim();
  if (!value) throw new Error(`${name} não está configurada.`);
  return value;
}

function splitName(name) {
  const parts = name.trim().split(/\s+/);
  return {
    firstName: parts[0] ?? "",
    lastName: parts.slice(1).join(" "),
  };
}

loadEnvFile(".env.local");
loadEnvFile(".env");

const databaseUrl = requireEnv("DATABASE_URL");
if (databaseUrl.includes(".railway.internal") && !process.env.RAILWAY_ENVIRONMENT) {
  throw new Error(
    "DATABASE_URL interna da Railway só pode ser usada dentro do runtime Railway. Use DATABASE_PUBLIC_URL localmente.",
  );
}

const adminEmail = requireEnv("BOOTSTRAP_ADMIN_EMAIL").toLowerCase();
const adminPassword = requireEnv("BOOTSTRAP_ADMIN_PASSWORD");
const adminName = process.env.BOOTSTRAP_ADMIN_NAME?.trim() || adminEmail;
const betterAuthSecret = requireEnv("BETTER_AUTH_SECRET");
const betterAuthUrl = process.env.BETTER_AUTH_URL?.trim() || "http://localhost:5173";

const pool = new Pool({
  connectionString: databaseUrl,
  ssl: process.env.PGSSLMODE === "require" ? { rejectUnauthorized: false } : undefined,
});

try {
  const existingAdmin = await pool.query(
    `
      select id
      from public."user"
      where role = 'admin'
        and status = 'active'
        and deleted_at is null
      limit 1
    `,
  );

  if (existingAdmin.rowCount) {
    throw new Error("Bootstrap bloqueado: já existe um administrador ativo.");
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
    advanced: {
      database: {
        generateId: "uuid",
      },
      cookiePrefix: "automy",
    },
  });

  await auth.api.signUpEmail({
    body: {
      name: adminName,
      email: adminEmail,
      password: adminPassword,
      rememberMe: false,
    },
    headers: new Headers({ origin: betterAuthUrl }),
  });

  const userResult = await pool.query(
    `
      update public."user"
      set role = 'admin',
          status = 'active',
          "updatedAt" = now()
      where lower(email) = lower($1)
        and deleted_at is null
      returning id, name, email
    `,
    [adminEmail],
  );
  const authUser = userResult.rows[0];
  if (!authUser) throw new Error("Usuário Better Auth não encontrado após bootstrap.");

  const { firstName, lastName } = splitName(adminName);
  await pool.query(
    `
      insert into public.user_profiles (auth_user_id, first_name, last_name, created_by, updated_by)
      values ($1, $2, $3, $1, $1)
      on conflict (auth_user_id)
      do update set
        first_name = excluded.first_name,
        last_name = excluded.last_name,
        updated_by = excluded.updated_by,
        updated_at = now()
    `,
    [authUser.id, firstName, lastName],
  );

  await pool.query(
    `
      insert into public.user_preferences (auth_user_id, created_by, updated_by)
      values ($1, $1, $1)
      on conflict (auth_user_id)
      do nothing
    `,
    [authUser.id],
  );

  const companyResult = await pool.query(
    `
      insert into public.companies (legal_name, trade_name, status, created_by, updated_by)
      values ('Automy Tecnologia', 'Automy', 'active', $1, $1)
      on conflict do nothing
      returning id
    `,
    [authUser.id],
  );
  const companyId =
    companyResult.rows[0]?.id ??
    (
      await pool.query(
        `
          select id
          from public.companies
          where lower(trade_name) = 'automy'
            and deleted_at is null
          order by created_at asc
          limit 1
        `,
      )
    ).rows[0]?.id;

  const roleId = (
    await pool.query(
      `
        select id
        from public.roles
        where key = 'admin'
          and company_id is null
          and deleted_at is null
        limit 1
      `,
    )
  ).rows[0]?.id;

  if (companyId && roleId) {
    await pool.query(
      `
        insert into public.users (
          company_id,
          auth_user_id,
          role_id,
          name,
          email,
          status,
          created_by,
          updated_by
        )
        values ($1, $2, $3, $4, $5, 'active', $2, $2)
        on conflict (auth_user_id)
        do update set
          role_id = excluded.role_id,
          name = excluded.name,
          email = excluded.email,
          status = 'active',
          updated_by = excluded.updated_by,
          updated_at = now()
      `,
      [companyId, authUser.id, roleId, adminName, adminEmail],
    );
  }

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
      values (
        $1,
        $2,
        'bootstrap.admin.created',
        'user',
        $2,
        jsonb_build_object('email', $3::text, 'role', 'admin'),
        $2,
        $2
      )
    `,
    [companyId ?? null, authUser.id, adminEmail],
  );

  console.log(
    JSON.stringify({
      status: "created",
      email: authUser.email,
      role: "admin",
      accountStatus: "active",
    }),
  );
} finally {
  await pool.end();
}
