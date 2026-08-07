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
const provision = readFileSync(
  resolve(packageRoot, "scripts/auth/provision-portal-user.mjs"),
  "utf8",
);

const checks = [
  ["mapping de sessão usa client_portal_users", portalApi.includes("public.client_portal_users")],
  [
    "sessão de Portal rejeita sobreposição com usuário interno",
    portalApi.includes(
      "not exists (\n          select 1\n          from public.users internal_user",
    ),
  ],
  [
    "snapshot filtra company + client",
    portalApi.includes("where company_id = $1\n          and client_id = $2"),
  ],
  ["tickets filtram client_id", portalApi.includes("tickets.client_id = $2")],
  ["mensagens do Portal são client-visible", portalApi.includes("messages.visibility = 'client'")],
  ["PDF exige hash/texto prontos", portalApi.includes("!row.contract_text || !row.contract_hash")],
  ["PDF não chama persistContractSnapshot", !portalApi.includes("persistContractSnapshot")],
  ["PDF valida consistência", portalApi.includes("validateContractConsistency")],
  ["profile não permite alterar email", !profileAllowsEmail(portalApi)],
  ["migration é aditiva", !/alter\s+table\s+public\.(?!client_portal_users)/i.test(migration)],
  ["provisionamento não insere em public.users", !/insert\s+into\s+public\.users/i.test(provision)],
  ["provisionamento checa public.users por defesa", provision.includes("Proteção acionada")],
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
