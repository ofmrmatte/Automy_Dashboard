const DEFAULT_RAILWAY_ORIGIN = "https://automydashboard-production.up.railway.app";
const ROLLBACK_VERCEL_ORIGIN = "https://automy-dashboard.vercel.app";
const FINAL_CUSTOM_ORIGIN = "https://automy.dev.br";

function splitOriginList(value: string | undefined) {
  return (value ?? "")
    .split(",")
    .map((origin) => origin.trim())
    .filter(Boolean);
}

function normalizeOrigin(value: string | undefined) {
  if (!value) return null;

  try {
    return new URL(value).origin;
  } catch {
    return null;
  }
}

function originFromHost(host: string | undefined) {
  if (!host) return null;
  return normalizeOrigin(`https://${host}`);
}

function uniqueValues<T>(values: T[]) {
  return [...new Set(values)];
}

export function resolveCanonicalAppOrigin() {
  const explicit = normalizeOrigin(process.env["BETTER_AUTH_URL"]);
  if (explicit) return explicit;

  const railway = originFromHost(process.env["RAILWAY_PUBLIC_DOMAIN"]);
  if (railway) return railway;

  if (process.env["NODE_ENV"] !== "production") {
    return "http://localhost:5173";
  }

  return DEFAULT_RAILWAY_ORIGIN;
}

export function resolveTrustedAppOrigins() {
  const configured = splitOriginList(
    process.env["AUTOMY_TRUSTED_ORIGINS"] ?? process.env["BETTER_AUTH_TRUSTED_ORIGINS"],
  )
    .map(normalizeOrigin)
    .filter((origin): origin is string => Boolean(origin));

  const vercelDeployment = originFromHost(process.env["VERCEL_URL"]);
  const developmentOrigins =
    process.env["NODE_ENV"] !== "production"
      ? [
          "http://localhost:5173",
          "http://127.0.0.1:5173",
          "http://localhost:4173",
          "http://127.0.0.1:4173",
        ]
      : [];

  return uniqueValues([
    resolveCanonicalAppOrigin(),
    FINAL_CUSTOM_ORIGIN,
    ROLLBACK_VERCEL_ORIGIN,
    ...configured,
    ...(vercelDeployment ? [vercelDeployment] : []),
    ...developmentOrigins,
  ]);
}

export function resolveBetterAuthBaseURL() {
  const origins = resolveTrustedAppOrigins();
  const allowedHosts = origins.map((origin) => new URL(origin).host);

  return {
    allowedHosts,
    protocol: process.env["NODE_ENV"] !== "production" ? "auto" : "https",
    fallback: resolveCanonicalAppOrigin(),
  } as const;
}
