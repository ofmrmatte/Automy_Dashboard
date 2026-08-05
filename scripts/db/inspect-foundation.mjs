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

const expectedTables = [
  "user",
  "session",
  "account",
  "verification",
  "rate_limit",
  "companies",
  "users",
  "roles",
  "permissions",
  "role_permissions",
  "clients",
  "contacts",
  "addresses",
  "products",
  "contracts",
  "activities",
  "activity_logs",
  "audit_logs",
  "user_profiles",
  "user_preferences",
  "company_security_settings",
  "login_history",
  "company_integrations",
  "company_notification_settings",
  "notification_preferences",
  "notifications",
  "notification_deliveries",
  "support_tickets",
  "scheduled_calls",
  "charges",
  "payment_webhook_events",
  "app_settings",
  "schema_migrations",
];

const uuidRequiredTables = expectedTables.filter(
  (table) => !["rate_limit", "app_settings", "schema_migrations"].includes(table),
);
const softDeleteRequiredTables = expectedTables.filter(
  (table) =>
    !["account", "verification", "rate_limit", "app_settings", "schema_migrations"].includes(table),
);

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.PGSSLMODE === "require" ? { rejectUnauthorized: false } : undefined,
  connectionTimeoutMillis: 10_000,
});

try {
  const tables = await pool.query(
    `
      select table_name
      from information_schema.tables
      where table_schema = 'public'
        and table_type = 'BASE TABLE'
      order by table_name
    `,
  );
  const tableNames = tables.rows.map((row) => row.table_name);
  const missingTables = expectedTables.filter((table) => !tableNames.includes(table));
  const unexpectedDuplicateFamilies = [
    tableNames.includes("sessions") && tableNames.includes("session") ? "session/sessions" : null,
    tableNames.includes("accounts") && tableNames.includes("account") ? "account/accounts" : null,
    tableNames.includes("verifications") && tableNames.includes("verification")
      ? "verification/verifications"
      : null,
  ].filter(Boolean);

  const foreignKeys = await pool.query(`
    select count(*)::int as total
    from information_schema.table_constraints
    where constraint_schema = 'public'
      and constraint_type = 'FOREIGN KEY'
  `);

  const indexes = await pool.query(`
    select count(*)::int as total
    from pg_indexes
    where schemaname = 'public'
  `);

  const checks = await pool.query(`
    select count(*)::int as total
    from information_schema.table_constraints
    where constraint_schema = 'public'
      and constraint_type = 'CHECK'
  `);

  const triggers = await pool.query(`
    select event_object_table as table_name
    from information_schema.triggers
    where trigger_schema = 'public'
      and trigger_name like 'set_%_updated_at'
    group by event_object_table
    order by event_object_table
  `);

  const uuidTables = await pool.query(`
    select table_name
    from information_schema.columns
    where table_schema = 'public'
      and column_name = 'id'
      and udt_name = 'uuid'
    order by table_name
  `);

  const softDeleteTables = await pool.query(`
    select table_name
    from information_schema.columns
    where table_schema = 'public'
      and column_name = 'deleted_at'
    order by table_name
  `);

  const roles = await pool.query(`
    select key
    from public.roles
    where company_id is null
      and deleted_at is null
    order by key
  `);

  const rolePermissionCounts = await pool.query(`
    select roles.key, count(role_permissions.id)::int as permissions
    from public.roles
    left join public.role_permissions on role_permissions.role_id = roles.id
      and role_permissions.deleted_at is null
    where roles.company_id is null
      and roles.deleted_at is null
    group by roles.key
    order by roles.key
  `);

  const missingUuid = uuidRequiredTables.filter(
    (table) => !uuidTables.rows.some((row) => row.table_name === table),
  );
  const missingSoftDelete = softDeleteRequiredTables.filter(
    (table) => !softDeleteTables.rows.some((row) => row.table_name === table),
  );

  console.log(
    JSON.stringify({
      missingTables,
      unexpectedDuplicateFamilies,
      foreignKeys: foreignKeys.rows[0]?.total ?? 0,
      indexes: indexes.rows[0]?.total ?? 0,
      checkConstraints: checks.rows[0]?.total ?? 0,
      updatedAtTriggers: triggers.rows.length,
      uuidTables: missingUuid.length === 0,
      missingUuid,
      softDeleteTables: missingSoftDelete.length === 0,
      missingSoftDelete,
      roles: roles.rows.map((row) => row.key),
      rolePermissionCounts: rolePermissionCounts.rows,
    }),
  );
} finally {
  await pool.end();
}
