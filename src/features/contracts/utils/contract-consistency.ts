import type { ContractPaymentTerms } from "@/features/contracts/types";
import {
  formatDueDaysList,
  normalizeLegacyPaymentTerms,
} from "@/features/contracts/utils/payment-terms";
import { formatCurrency, formatDate } from "@/shared/utils/formatters";

export type ContractConsistencySnapshot = {
  monthlyValue: number;
  implementationValue: number;
  implementationDays: number;
  basePriceReference?: number | null | undefined;
  additionalUserAmount?: number | null | undefined;
  databaseCost?: number | null | undefined;
  downPaymentAmount?: number | null | undefined;
  includedUsers: number;
  hostedByAutomy: boolean;
  customUrlEnabled: boolean;
  paymentMethod?: string | null | undefined;
  installmentsCount?: number | null | undefined;
  installmentDueDays?: number[] | null | undefined;
  paymentTerms?: unknown | undefined;
  loyaltyMonths?: number | null | undefined;
  startsAt?: string | null | undefined;
  endsAt?: string | null | undefined;
  renewalAt?: string | null | undefined;
};

export class ContractConsistencyError extends Error {
  details: string[];

  constructor(details: string[]) {
    super(
      "Existem informações inconsistentes neste contrato. Revise as condições comerciais antes de gerar o documento.",
    );
    this.name = "ContractConsistencyError";
    this.details = details;
  }
}

function escapeRegExp(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

export function sanitizeContractContent(value: string | null | undefined) {
  return String(value ?? "")
    .replace(/\s+\./g, ".")
    .replace(/,{1}\s*\./g, ".")
    .replace(/([^.\s])\.{2,}(?=\s|$)/g, "$1.")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

function yesNo(value: boolean) {
  return value ? "Sim" : "Não";
}

function paymentTermsFromSnapshot(snapshot: ContractConsistencySnapshot): ContractPaymentTerms {
  return normalizeLegacyPaymentTerms(snapshot.paymentTerms, {
    method: snapshot.paymentMethod,
    installments: snapshot.installmentsCount ?? 1,
    firstDueInDays: snapshot.installmentDueDays?.[0] ?? 30,
    installmentDueDays: snapshot.installmentDueDays ?? [],
    totalAmount: snapshot.implementationValue || snapshot.monthlyValue,
  });
}

export function buildContractVariables(snapshot: ContractConsistencySnapshot) {
  const paymentTerms = paymentTermsFromSnapshot(snapshot);
  const schedule = paymentTerms.calculatedDueDays ?? paymentTerms.dueDays;

  return {
    implementation_amount: formatCurrency(snapshot.implementationValue),
    implementation_days: `${snapshot.implementationDays} dias`,
    monthly_amount: formatCurrency(snapshot.monthlyValue),
    included_users: String(snapshot.includedUsers),
    hosted_by_automy: yesNo(snapshot.hostedByAutomy),
    custom_url_enabled: yesNo(snapshot.customUrlEnabled),
    minimum_term_months: snapshot.loyaltyMonths
      ? `${snapshot.loyaltyMonths} meses`
      : "Sem permanência mínima",
    payment_terms: paymentTerms.description,
    payment_schedule: schedule.length ? `${formatDueDaysList(schedule)} dias` : "",
    starts_at: snapshot.startsAt ? formatDate(snapshot.startsAt) : "",
    minimum_term_end_date: snapshot.endsAt ? formatDate(snapshot.endsAt) : "",
    renewal_date: snapshot.renewalAt ? formatDate(snapshot.renewalAt) : "",
  };
}

export function resolveContractTemplate(template: string, snapshot: ContractConsistencySnapshot) {
  const variables = buildContractVariables(snapshot);
  return sanitizeContractContent(
    Object.entries(variables).reduce(
      (text, [key, value]) =>
        text.replace(new RegExp(`{{\\s*${escapeRegExp(key)}\\s*}}`, "gi"), value),
      template,
    ),
  );
}

function hasCommercialHardcode(text: string) {
  const normalized = text.toLowerCase();
  const hasCurrency = /r\$\s*\d/.test(normalized);
  const hasCommercialTerms =
    /(implantação|mensalidade|hospedagem|url personalizada|boleto|parcelad|permanência|fidelidade)/i.test(
      text,
    );
  const hasLegacyCommercialSection = /quadro de condições negociadas|quadro de contratação/i.test(
    text,
  );

  return hasLegacyCommercialSection || (hasCurrency && hasCommercialTerms);
}

export function shouldIgnoreLegacyCommercialTemplate(template: string | null | undefined) {
  return Boolean(template?.trim() && hasCommercialHardcode(template));
}

function expectedValues(snapshot: ContractConsistencySnapshot) {
  const variables = buildContractVariables(snapshot);
  return [
    ["mensalidade", variables.monthly_amount],
    ["implantação", variables.implementation_amount],
    ["prazo de implantação", variables.implementation_days],
    ["hospedagem", variables.hosted_by_automy],
    ["url personalizada", variables.custom_url_enabled],
    ["usuários", variables.included_users],
    ["permanência", variables.minimum_term_months],
    ["pagamento", variables.payment_terms],
  ] as const;
}

export function validateContractConsistency(input: {
  snapshot: ContractConsistencySnapshot;
  contractText: string;
}) {
  const text = sanitizeContractContent(input.contractText);
  const details: string[] = [];

  for (const [label, expected] of expectedValues(input.snapshot)) {
    if (!expected) continue;
    const hasRelatedClause = new RegExp(label, "i").test(text);
    if (hasRelatedClause && !text.includes(expected)) {
      details.push(`Campo ${label} não confere com o snapshot (${expected}).`);
    }
  }

  const allowedCurrencyValues = new Set(
    [
      input.snapshot.monthlyValue,
      input.snapshot.implementationValue,
      input.snapshot.basePriceReference,
      input.snapshot.additionalUserAmount,
      input.snapshot.databaseCost,
      input.snapshot.downPaymentAmount,
      0,
    ].map((value) => formatCurrency(Number(value ?? 0))),
  );
  const currencyValues = text.match(/R\$\s?\d{1,3}(?:\.\d{3})*(?:,\d{2})?/g) ?? [];
  const unexpectedCurrencyValues = currencyValues.filter(
    (value) => !allowedCurrencyValues.has(value),
  );
  if (unexpectedCurrencyValues.length) {
    details.push(
      `Valores monetários não pertencem ao snapshot: ${[...new Set(unexpectedCurrencyValues)].join(", ")}.`,
    );
  }

  if (details.length) throw new ContractConsistencyError(details);
}

export function validateContractReadyForSignature(input: {
  clientName: string;
  clientDocument: string;
  productName: string;
  plan: string;
  signerName: string;
  signerEmail?: string | null;
  monthlyValue: number;
  implementationValue: number;
  paymentMethod?: string | null;
  startsAt: string;
  endsAt: string;
  loyaltyMonths?: number | null;
  contractText?: string | null;
  contractHash?: string | null;
  contractVersion?: number | null;
  automyRepresentative?: string | null;
}) {
  const missing = [
    [input.clientName, "cliente"],
    [input.clientDocument, "CPF/CNPJ do cliente"],
    [input.productName, "produto"],
    [input.plan, "plano"],
    [input.signerName, "responsável"],
    [input.signerEmail, "e-mail do responsável"],
    [input.paymentMethod, "forma de pagamento"],
    [input.startsAt, "data de início"],
    [input.endsAt, "fim da permanência"],
    [input.contractText, "minuta do contrato"],
    [input.contractHash, "hash"],
    [input.contractVersion, "versão"],
    [input.automyRepresentative, "representante Automy"],
  ]
    .filter(([value]) => !String(value ?? "").trim())
    .map(([, label]) => label);

  if (!Number.isFinite(input.monthlyValue) || input.monthlyValue <= 0) {
    missing.push("valor mensal");
  }
  if (!Number.isFinite(input.implementationValue) || input.implementationValue < 0) {
    missing.push("valor de implantação");
  }
  if (!Number(input.loyaltyMonths ?? 0)) {
    missing.push("permanência mínima");
  }

  return {
    ok: missing.length === 0,
    missing,
  };
}
