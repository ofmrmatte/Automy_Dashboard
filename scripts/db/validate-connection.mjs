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

const parsedUrl = new URL(databaseUrl);
const pool = new Pool({
  connectionString: databaseUrl,
  ssl: process.env.PGSSLMODE === "require" ? { rejectUnauthorized: false } : undefined,
  connectionTimeoutMillis: 10_000,
});

try {
  const result = await pool.query(`
    select
      current_database() as database,
      inet_server_port() as port,
      current_setting('ssl', true) as ssl
  `);

  console.log(
    JSON.stringify({
      host: parsedUrl.hostname,
      port: parsedUrl.port || "default",
      database: result.rows[0]?.database,
      ssl: process.env.PGSSLMODE === "require" ? "required" : (result.rows[0]?.ssl ?? "unset"),
      pool: "ok",
    }),
  );
} finally {
  await pool.end();
}
