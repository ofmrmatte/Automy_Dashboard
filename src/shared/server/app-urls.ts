const ERP_CANONICAL_ORIGIN = "https://app.automy.dev.br";
const FINAL_CUSTOM_ORIGIN = "https://automy.dev.br";
const WWW_CUSTOM_ORIGIN = "https://www.automy.dev.br";
const SECONDARY_VERCEL_ORIGIN = "https://automy-dashboard.vercel.app";

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

  if (process.env["NODE_ENV"] !== "production") {
    return "http://localhost:5173";
  }

  return ERP_CANONICAL_ORIGIN;
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
    ERP_CANONICAL_ORIGIN,
    FINAL_CUSTOM_ORIGIN,
    WWW_CUSTOM_ORIGIN,
    SECONDARY_VERCEL_ORIGIN,
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
