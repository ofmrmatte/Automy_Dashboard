import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const packageRoot = resolve(process.argv[2] || process.cwd());
const portalApi = readFileSync(
  resolve(packageRoot, "src/features/portal/server/portal-api.ts"),
  "utf8",
);
const migration = readFileSync(
  resolve(packageRoot, "railway/migrations/20260807160000_client_portal_access.sql"),
  "utf8",
);
const provisioningMigration = readFileSync(
  resolve(packageRoot, "railway/migrations/20260807190000_client_portal_auto_provisioning.sql"),
  "utf8",
);
const provision = readFileSync(
  resolve(packageRoot, "scripts/auth/provision-portal-user.mjs"),
  "utf8",
);
const provisioning = readFileSync(
  resolve(packageRoot, "src/features/portal/server/portal-provisioning.ts"),
  "utf8",
);
const email = readFileSync(
  resolve(packageRoot, "src/features/email/transactional-email.ts"),
  "utf8",
);

const checks = [
  ["mapping de sessão usa client_portal_users", portalApi.includes("public.client_portal_users")],
  [
    "sessão de Portal rejeita sobreposição com usuário interno",
    /not\s+exists\s*\(\s*select\s+1\s+from\s+public\.users\s+internal_user/i.test(portalApi),
  ],
  [
    "snapshot filtra company + client",
    /where\s+company_id\s*=\s*\$1\s+and\s+client_id\s*=\s*\$2/i.test(portalApi),
  ],
  ["tickets filtram client_id", portalApi.includes("tickets.client_id = $2")],
  ["mensagens do Portal são client-visible", portalApi.includes("messages.visibility = 'client'")],
  ["PDF exige hash/texto prontos", portalApi.includes("!row.contract_text || !row.contract_hash")],
  ["PDF não chama persistContractSnapshot", !portalApi.includes("persistContractSnapshot")],
  ["PDF valida consistência", portalApi.includes("validateContractConsistency")],
  ["profile não permite alterar email", !profileAllowsEmail(portalApi)],
  ["migration base é aditiva", !/\bdrop\s+(table|column)\b/i.test(migration)],
  [
    "migration de provisionamento não remove dados",
    !/\bdrop\s+(table|column)\b/i.test(provisioningMigration),
  ],
  [
    "migration de provisionamento adiciona invited_at",
    provisioningMigration.includes("add column if not exists invited_at"),
  ],
  ["provisionamento não insere em public.users", !/insert\s+into\s+public\.users/i.test(provision)],
  ["provisionamento checa public.users por defesa", provision.includes("Proteção acionada")],
  [
    "usuário Portal usa role customer",
    provisioning.includes("role, status") && provisioning.includes("'customer'"),
  ],
  [
    "convite armazena hash do token",
    provisioning.includes("activation_token_hash") && provisioning.includes("sha256"),
  ],
  ["Resend usa variável server-side", email.includes('process.env["RESEND_API_KEY"]')],
  ["Resend não usa variável VITE", !email.includes("VITE_")],
  ["cadastro público não foi habilitado na app", !portalApi.includes("signUpEmail")],
];

function profileAllowsEmail(source) {
  const schemaStart = source.indexOf("const profileSchema");
  const schemaEnd = source.indexOf("function asObject", schemaStart);
  return source.slice(schemaStart, schemaEnd).includes("email:");
}

let failed = 0;
for (const [name, ok] of checks) {
  console.log(`${ok ? "PASS" : "FAIL"} ${name}`);
  if (!ok) failed++;
}
if (failed) process.exit(1);
console.log(`Safety checks concluídos: ${checks.length}/${checks.length}.`);
