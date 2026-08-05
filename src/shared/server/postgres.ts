import { loadLocalServerEnv } from "@/shared/server/env";

type Pool = import("pg").Pool;

let pool: Pool | undefined;

export function isRailwayPostgresConfigured() {
  loadLocalServerEnv();

  const databaseUrl = process.env["DATABASE_URL"];
  if (!databaseUrl) return false;

  if (databaseUrl.includes(".railway.internal") && !process.env["RAILWAY_ENVIRONMENT"]) {
    return false;
  }

  return true;
}

export async function getRailwayPostgresPool() {
  loadLocalServerEnv();

  if (pool) return pool;

  const databaseUrl = process.env["DATABASE_URL"];
  if (!databaseUrl) {
    throw new Error("DATABASE_URL não está configurado.");
  }

  const { Pool } = await import("pg");
  pool = new Pool({
    connectionString: databaseUrl,
    ssl: process.env["PGSSLMODE"] === "require" ? { rejectUnauthorized: false } : undefined,
  });

  return pool;
}
