import { createHash } from "node:crypto";
import { existsSync, readdirSync, readFileSync } from "node:fs";
import { basename, join, resolve } from "node:path";
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

function getSqlDirectory(kind) {
  if (kind === "migrations") return join(workspaceRoot, "railway", "migrations");
  if (kind === "seeds") return join(workspaceRoot, "railway", "seeds");
  throw new Error("Uso: node scripts/db/run-sql-directory.mjs migrations|seeds");
}

function getDatabaseUrl() {
  loadEnvFile(".env.local");
  loadEnvFile(".env");

  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) {
    throw new Error("DATABASE_URL não está configurada.");
  }

  if (databaseUrl.includes(".railway.internal") && !process.env.RAILWAY_ENVIRONMENT) {
    throw new Error(
      "DATABASE_URL interna da Railway só pode ser usada dentro do runtime Railway. Use DATABASE_PUBLIC_URL localmente/Vercel.",
    );
  }

  return databaseUrl;
}

function getChecksum(sql) {
  return createHash("sha256").update(sql).digest("hex");
}

const kind = process.argv[2];
const directory = getSqlDirectory(kind);
const files = readdirSync(directory)
  .filter((file) => file.endsWith(".sql"))
  .sort((left, right) => left.localeCompare(right));

if (!files.length) {
  console.log(`Nenhum arquivo SQL encontrado em ${directory}.`);
  process.exit(0);
}

const pool = new Pool({
  connectionString: getDatabaseUrl(),
  ssl: process.env.PGSSLMODE === "require" ? { rejectUnauthorized: false } : undefined,
});

try {
  await pool.query(`
    create table if not exists public.schema_migrations (
      version text primary key,
      name text not null,
      kind text not null,
      checksum text not null,
      applied_at timestamptz not null default now()
    );
  `);

  for (const file of files) {
    const filePath = join(directory, file);
    const sql = readFileSync(filePath, "utf8");
    const checksum = getChecksum(sql);
    const version = basename(file, ".sql");
    const applied = await pool.query(
      "select checksum from public.schema_migrations where version = $1 and kind = $2",
      [version, kind],
    );

    if (applied.rows[0]?.checksum === checksum) {
      console.log(`skip ${kind}/${file}`);
      continue;
    }

    if (applied.rows[0]) {
      throw new Error(`Checksum alterado para ${kind}/${file}. Crie uma nova migration.`);
    }

    await pool.query("begin");
    try {
      await pool.query(sql);
      await pool.query(
        "insert into public.schema_migrations (version, name, kind, checksum) values ($1, $2, $3, $4)",
        [version, file, kind, checksum],
      );
      await pool.query("commit");
      console.log(`apply ${kind}/${file}`);
    } catch (error) {
      await pool.query("rollback");
      throw error;
    }
  }
} finally {
  await pool.end();
}
