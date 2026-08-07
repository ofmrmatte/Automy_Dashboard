import type { ContractPaymentMethod, ContractPaymentTerms } from "@/features/contracts/types";
import { formatCurrency } from "@/shared/utils/formatters";

const DEFAULT_INSTALLMENT_INTERVAL_DAYS = 30;

type PaymentTermsInput = {
  method?: ContractPaymentMethod | string | null | undefined;
  installments?: number | null | undefined;
  firstDueInDays?: number | null | undefined;
  paymentDueInDays?: number | null | undefined;
  installmentDueDays?: number[] | null | undefined;
  specificDates?: string[] | null | undefined;
  downPaymentAmount?: number | null | undefined;
  totalAmount?: number | null | undefined;
  recurrenceFrequency?: string | null | undefined;
  recurrenceDueDay?: number | null | undefined;
  recurrenceStartDate?: string | null | undefined;
  gateway?: string | null | undefined;
  gatewayInstallments?: number | null | undefined;
  customDescription?: string | null | undefined;
};

type LegacyPaymentTerms = Partial<ContractPaymentTerms> & {
  calculated_due_days?: number[];
  calculatedDueDays?: number[];
  custom_description?: string | null;
  customDescription?: string | null;
  down_payment_amount?: number | null;
  downPaymentAmount?: number | null;
  first_due_in_days?: number | null;
  firstDueInDays?: number | null;
  gateway_installments?: number | null;
  gatewayInstallments?: number | null;
  payment_due_in_days?: number | null;
  paymentDueInDays?: number | null;
  recurrence_due_day?: number | null;
  recurrenceDueDay?: number | null;
  recurrence_frequency?: string | null;
  recurrenceFrequency?: string | null;
  recurrence_start_date?: string | null;
  recurrenceStartDate?: string | null;
};

function asNumber(value: unknown, fallback = 0) {
  const number = Number(value);
  return Number.isFinite(number) ? number : fallback;
}

function toCents(value: number) {
  return Math.round(value * 100);
}

function fromCents(value: number) {
  return value / 100;
}

function numberWord(value: number) {
  const words = [
    "zero",
    "uma",
    "duas",
    "três",
    "quatro",
    "cinco",
    "seis",
    "sete",
    "oito",
    "nove",
    "dez",
    "onze",
    "doze",
  ];
  return words[value] ?? String(value);
}

function dayText(days: number) {
  if (days === 0) return "na formalização deste instrumento";
  if (days === 1) return "em 1 dia";
  return `em ${days} dias`;
}

export function formatDueDaysList(days: number[]) {
  if (!days.length) return "";
  if (days.length === 1) return `${days[0]}`;
  if (days.length === 2) return `${days[0]} e ${days[1]}`;
  return `${days.slice(0, -1).join(", ")} e ${days.at(-1)}`;
}

export function calculateInstallmentDueDays(installments: number, firstDueInDays: number) {
  const count = Math.max(1, Math.trunc(asNumber(installments, 1)));
  const firstDue = Math.max(0, Math.trunc(asNumber(firstDueInDays, 30)));
  return Array.from(
    { length: count },
    (_, index) => firstDue + index * DEFAULT_INSTALLMENT_INTERVAL_DAYS,
  );
}

export function calculateDownPaymentSchedule(
  totalAmount: number,
  downPaymentAmount: number,
  installments: number,
) {
  const totalCents = Math.max(0, toCents(asNumber(totalAmount, 0)));
  const downPaymentCents = Math.max(0, toCents(asNumber(downPaymentAmount, 0)));
  const remainingCents = Math.max(0, totalCents - downPaymentCents);
  const count = Math.max(1, Math.trunc(asNumber(installments, 1)));
  const baseInstallmentCents = Math.floor(remainingCents / count);
  const lastInstallmentCents = remainingCents - baseInstallmentCents * (count - 1);

  return {
    remainingAmount: fromCents(remainingCents),
    installmentAmount: fromCents(baseInstallmentCents),
    lastInstallmentAmount: fromCents(lastInstallmentCents),
  };
}

export function formatPaymentTermsForContract(terms: ContractPaymentTerms) {
  const method = terms.method;
  const paymentDueInDays = Math.max(0, Number(terms.paymentDueInDays ?? terms.firstDueInDays ?? 0));
  const dueDays = terms.calculatedDueDays?.length ? terms.calculatedDueDays : (terms.dueDays ?? []);
  const formattedDueDays = formatDueDaysList(dueDays);

  if (method === "À vista") {
    if (paymentDueInDays === 0) {
      return "O pagamento será realizado à vista na formalização deste instrumento.";
    }
    return `O valor será pago à vista, com vencimento em até ${paymentDueInDays} dias.`;
  }

  if (method === "Boleto") {
    return `O pagamento será realizado por boleto bancário, com vencimento em ${paymentDueInDays} dias.`;
  }

  if (method === "Boleto parcelado") {
    return `O valor de implantação será pago por boleto bancário em ${terms.installments} parcelas, com vencimentos em ${formattedDueDays} dias contados da formalização deste instrumento.`;
  }

  if (method === "Entrada + parcelamento") {
    const installmentText =
      terms.installmentAmount === terms.lastInstallmentAmount
        ? `${terms.installments} parcelas mensais de ${formatCurrency(terms.installmentAmount ?? 0)}`
        : `${terms.installments} parcelas mensais, sendo a última de ${formatCurrency(terms.lastInstallmentAmount ?? 0)}`;

    return `O valor será pago mediante entrada de ${formatCurrency(terms.downPaymentAmount ?? 0)} na formalização deste instrumento, sendo o saldo remanescente de ${formatCurrency(terms.remainingAmount ?? 0)} dividido em ${installmentText}, com vencimentos em ${formattedDueDays} dias.`;
  }

  if (method === "PIX") {
    return paymentDueInDays === 0
      ? "O pagamento será realizado via PIX na formalização deste instrumento."
      : `O pagamento será realizado via PIX, com vencimento em até ${paymentDueInDays} dias.`;
  }

  if (method === "Transferência") {
    return paymentDueInDays === 0
      ? "O pagamento será realizado por transferência bancária na formalização deste instrumento."
      : `O pagamento será realizado por transferência bancária, com vencimento em até ${paymentDueInDays} dias.`;
  }

  if (method === "Cartão") {
    const installments = Math.max(1, Number(terms.gatewayInstallments ?? terms.installments ?? 1));
    return `O pagamento será realizado por cartão, em ${installments} ${installments === 1 ? "parcela" : "parcelas"}, sujeito ao processamento e às condições do gateway de pagamento.`;
  }

  if (method === "Recorrência") {
    const frequency = terms.recurrenceFrequency || "Mensal";
    const dueDay = terms.recurrenceDueDay
      ? `, com vencimento no dia ${terms.recurrenceDueDay}`
      : "";
    return `A cobrança será realizada em recorrência ${frequency.toLocaleLowerCase("pt-BR")}${dueDay}.`;
  }

  return (
    terms.customDescription?.trim() ||
    "As condições de pagamento serão realizadas conforme negociação formalizada entre as partes."
  );
}

export function buildStructuredPaymentTerms(input: PaymentTermsInput): ContractPaymentTerms {
  const method = (input.method || "Boleto") as ContractPaymentMethod;
  const installments = Math.max(1, Math.trunc(asNumber(input.installments, 1)));
  const firstDueInDays = Math.max(0, Math.trunc(asNumber(input.firstDueInDays, 30)));
  const paymentDueInDays = Math.max(
    0,
    Math.trunc(
      asNumber(input.paymentDueInDays ?? input.firstDueInDays, method === "À vista" ? 0 : 30),
    ),
  );
  const calculatedDueDays =
    method === "Boleto parcelado" || method === "Entrada + parcelamento"
      ? calculateInstallmentDueDays(installments, firstDueInDays)
      : [];
  const dueDays = input.installmentDueDays?.length ? input.installmentDueDays : calculatedDueDays;
  const downPaymentAmount = Math.max(0, asNumber(input.downPaymentAmount, 0));
  const totalAmount = Math.max(0, asNumber(input.totalAmount, 0));
  const downPaymentSchedule = calculateDownPaymentSchedule(
    totalAmount,
    downPaymentAmount,
    installments,
  );
  const gatewayInstallments = Math.max(
    1,
    Math.trunc(asNumber(input.gatewayInstallments, installments)),
  );

  const terms: ContractPaymentTerms = {
    method,
    installments,
    firstDueInDays:
      method === "Boleto parcelado" || method === "Entrada + parcelamento" ? firstDueInDays : null,
    intervalDays:
      method === "Boleto parcelado" || method === "Entrada + parcelamento"
        ? DEFAULT_INSTALLMENT_INTERVAL_DAYS
        : null,
    dueDays,
    calculatedDueDays,
    paymentDueInDays,
    downPaymentAmount: method === "Entrada + parcelamento" ? downPaymentAmount : null,
    remainingAmount:
      method === "Entrada + parcelamento" ? downPaymentSchedule.remainingAmount : null,
    installmentAmount:
      method === "Entrada + parcelamento" ? downPaymentSchedule.installmentAmount : null,
    lastInstallmentAmount:
      method === "Entrada + parcelamento" ? downPaymentSchedule.lastInstallmentAmount : null,
    recurrenceFrequency: method === "Recorrência" ? input.recurrenceFrequency || "Mensal" : null,
    recurrenceDueDay: method === "Recorrência" ? (input.recurrenceDueDay ?? null) : null,
    recurrenceStartDate: method === "Recorrência" ? (input.recurrenceStartDate ?? null) : null,
    gateway: method === "Cartão" ? (input.gateway ?? null) : null,
    gatewayInstallments: method === "Cartão" ? gatewayInstallments : null,
    customDescription: method === "Outro" ? (input.customDescription ?? "") : null,
    specificDates: input.specificDates?.filter(Boolean) ?? [],
    description: "",
  };

  return {
    ...terms,
    description: formatPaymentTermsForContract(terms),
  };
}

export function normalizeLegacyPaymentTerms(
  value: unknown,
  fallback: PaymentTermsInput = {},
): ContractPaymentTerms {
  const raw = (value && typeof value === "object" ? value : {}) as LegacyPaymentTerms;
  const method = (raw.method ?? fallback.method ?? "Boleto") as ContractPaymentMethod;
  const installments = Number(raw.installments ?? fallback.installments ?? 1);
  const firstDueInDays = Number(
    raw.firstDueInDays ?? raw.first_due_in_days ?? fallback.firstDueInDays ?? 30,
  );
  const calculatedDueDays =
    raw.calculatedDueDays ??
    raw.calculated_due_days ??
    raw.dueDays ??
    fallback.installmentDueDays ??
    [];

  return buildStructuredPaymentTerms({
    method,
    installments,
    firstDueInDays,
    paymentDueInDays:
      raw.paymentDueInDays ??
      raw.payment_due_in_days ??
      fallback.paymentDueInDays ??
      firstDueInDays,
    installmentDueDays: calculatedDueDays,
    specificDates: raw.specificDates ?? fallback.specificDates,
    downPaymentAmount:
      raw.downPaymentAmount ?? raw.down_payment_amount ?? fallback.downPaymentAmount ?? 0,
    totalAmount: fallback.totalAmount,
    recurrenceFrequency:
      raw.recurrenceFrequency ?? raw.recurrence_frequency ?? fallback.recurrenceFrequency,
    recurrenceDueDay: raw.recurrenceDueDay ?? raw.recurrence_due_day ?? fallback.recurrenceDueDay,
    recurrenceStartDate:
      raw.recurrenceStartDate ?? raw.recurrence_start_date ?? fallback.recurrenceStartDate,
    gateway: raw.gateway ?? fallback.gateway,
    gatewayInstallments:
      raw.gatewayInstallments ?? raw.gateway_installments ?? fallback.gatewayInstallments,
    customDescription:
      raw.customDescription ?? raw.custom_description ?? fallback.customDescription,
  });
}
