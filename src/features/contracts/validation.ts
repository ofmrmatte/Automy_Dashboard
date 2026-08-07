import { z } from "zod";
import { isValidCpfOrCnpj, onlyDigits } from "@/shared/utils/document";
import { parseBrazilianCurrency } from "@/shared/utils/formatters";

export const contractStatuses = [
  "Ativo",
  "Implantação",
  "Renovação",
  "Pendente",
  "Suspenso",
  "Cancelado",
  "Encerrado",
] as const;

export const contractBillingPeriods = ["Mensal", "Trimestral", "Semestral", "Anual"] as const;

export const contractPaymentMethods = [
  "À vista",
  "Boleto",
  "Boleto parcelado",
  "Entrada + parcelamento",
  "PIX",
  "Cartão",
  "Transferência",
  "Recorrência",
  "Outro",
] as const;

const optionalUuid = z.preprocess(
  (value) => (value === "" ? undefined : value),
  z.string().uuid().optional(),
);

const moneySchema = z.preprocess(
  (value) => parseBrazilianCurrency(value as string | number | null | undefined),
  z.number().min(0, "Informe um valor válido."),
);
const integerSchema = z.coerce.number().int().min(0, "Informe um número válido.");
const optionalDocumentSchema = z
  .string()
  .trim()
  .optional()
  .default("")
  .transform((value) => onlyDigits(value))
  .refine((value) => !value || isValidCpfOrCnpj(value), "Informe um CPF ou CNPJ válido.");

function dueDaysFromPayload(value: unknown) {
  if (Array.isArray(value)) return value;
  if (typeof value !== "string") return [];
  return value
    .split(/[,;\s]+/)
    .map((part) => Number(part.trim()))
    .filter((part) => Number.isInteger(part) && part > 0);
}

const contractFormBaseSchema = z.object({
  id: optionalUuid,
  clientId: z.string().uuid("Selecione o cliente."),
  productId: z.string().uuid("Selecione o produto."),
  name: z.string().trim().min(2, "Informe o plano ou nome do contrato."),
  description: z.string().trim().optional().default(""),
  scope: z.string().trim().optional().default(""),
  deliverables: z.string().trim().optional().default(""),
  includedUsers: integerSchema.min(1, "Informe ao menos 1 usuário.").default(1),
  additionalUsers: integerSchema.default(0),
  additionalUserAmount: moneySchema.default(0),
  hostedByAutomy: z.coerce.boolean().default(true),
  customUrlEnabled: z.coerce.boolean().default(false),
  implementationDays: integerSchema.default(0),
  databaseCost: moneySchema.default(0),
  databaseQuantity: integerSchema.default(0),
  operationalNotes: z.string().trim().optional().default(""),
  basePriceReference: moneySchema.default(0),
  monthlyValue: moneySchema.default(0),
  implementationValue: moneySchema.default(0),
  discountPercent: z.coerce.number().min(0).max(100).default(0),
  paymentMethod: z.enum(contractPaymentMethods).default("Boleto"),
  installmentsCount: integerSchema.min(1, "Informe ao menos 1 parcela.").default(1),
  firstDueInDays: integerSchema.default(30),
  paymentDueInDays: integerSchema.default(30),
  installmentIntervalDays: integerSchema.default(30),
  installmentDueDays: z.preprocess(
    dueDaysFromPayload,
    z.array(z.coerce.number().int().positive()).default([]),
  ),
  specificDueDates: z.preprocess(
    (value) => (Array.isArray(value) ? value : []),
    z.array(z.string()).default([]),
  ),
  downPaymentAmount: moneySchema.default(0),
  recurrenceDueDay: integerSchema.default(1),
  recurrenceStartDate: z.string().trim().optional().default(""),
  gatewayInstallments: integerSchema.min(1, "Informe ao menos 1 parcela.").default(1),
  customPaymentDescription: z.string().trim().optional().default(""),
  loyaltyMonths: integerSchema.default(0),
  currency: z.string().trim().min(3, "Informe a moeda.").default("BRL"),
  startsAt: z.string().trim().min(1, "Informe a data de início."),
  endsAt: z.string().trim().min(1, "Informe a data de vencimento."),
  renewalAt: z.string().trim().optional().default(""),
  billingPeriod: z.enum(contractBillingPeriods).default("Mensal"),
  status: z.enum(contractStatuses).default("Pendente"),
  signerName: z.string().trim().min(2, "Informe o responsável pela assinatura."),
  signerDocument: optionalDocumentSchema,
  signerEmail: z
    .string()
    .trim()
    .email("Informe um e-mail válido.")
    .optional()
    .or(z.literal(""))
    .default(""),
  signerPhone: z.string().trim().optional().default(""),
  automyRepresentative: z.string().trim().optional().default(""),
  witnessName: z.string().trim().optional().default(""),
  witnessDocument: optionalDocumentSchema,
  notes: z.string().trim().optional().default(""),
  contractText: z.string().trim().optional().default(""),
});

type ContractRefinementValue = {
  paymentMethod?: (typeof contractPaymentMethods)[number] | undefined;
  installmentsCount?: number | undefined;
  firstDueInDays?: number | undefined;
  paymentDueInDays?: number | undefined;
  downPaymentAmount?: number | undefined;
  implementationValue?: number | undefined;
  monthlyValue?: number | undefined;
  recurrenceDueDay?: number | undefined;
  recurrenceStartDate?: string | undefined;
  gatewayInstallments?: number | undefined;
  customPaymentDescription?: string | undefined;
  startsAt?: string | undefined;
  endsAt?: string | undefined;
  renewalAt?: string | undefined;
};

function refineContractDatesAndPayment(value: ContractRefinementValue, ctx: z.RefinementCtx) {
  const totalAmount = Number(value.implementationValue ?? value.monthlyValue ?? 0);

  if (value.paymentMethod === "Boleto parcelado" && (value.installmentsCount ?? 0) < 2) {
    ctx.addIssue({
      code: "custom",
      message: "Informe pelo menos 2 parcelas para boleto parcelado.",
      path: ["installmentsCount"],
    });
  }
  if (
    value.paymentMethod === "Boleto parcelado" &&
    value.firstDueInDays !== undefined &&
    value.firstDueInDays < 0
  ) {
    ctx.addIssue({
      code: "custom",
      message: "Informe um primeiro vencimento válido.",
      path: ["firstDueInDays"],
    });
  }
  if (
    (value.paymentMethod === "À vista" ||
      value.paymentMethod === "Boleto" ||
      value.paymentMethod === "PIX" ||
      value.paymentMethod === "Transferência") &&
    value.paymentDueInDays !== undefined &&
    value.paymentDueInDays < 0
  ) {
    ctx.addIssue({
      code: "custom",
      message: "Informe um prazo de pagamento válido.",
      path: ["paymentDueInDays"],
    });
  }
  if (value.paymentMethod === "Entrada + parcelamento") {
    if ((value.downPaymentAmount ?? 0) < 0) {
      ctx.addIssue({
        code: "custom",
        message: "A entrada deve ser maior ou igual a zero.",
        path: ["downPaymentAmount"],
      });
    }
    if (totalAmount > 0 && (value.downPaymentAmount ?? 0) >= totalAmount) {
      ctx.addIssue({
        code: "custom",
        message: "A entrada deve ser menor que o valor total negociado.",
        path: ["downPaymentAmount"],
      });
    }
    if ((value.installmentsCount ?? 0) < 2) {
      ctx.addIssue({
        code: "custom",
        message: "Informe pelo menos 2 parcelas para o saldo.",
        path: ["installmentsCount"],
      });
    }
    if ((value.firstDueInDays ?? 0) < 0) {
      ctx.addIssue({
        code: "custom",
        message: "Informe um primeiro vencimento válido.",
        path: ["firstDueInDays"],
      });
    }
  }
  if (value.paymentMethod === "Cartão" && (value.gatewayInstallments ?? 0) < 1) {
    ctx.addIssue({
      code: "custom",
      message: "Informe ao menos 1 parcela.",
      path: ["gatewayInstallments"],
    });
  }
  if (value.paymentMethod === "Recorrência") {
    if ((value.recurrenceDueDay ?? 0) < 1 || (value.recurrenceDueDay ?? 0) > 31) {
      ctx.addIssue({
        code: "custom",
        message: "Informe um dia de vencimento entre 1 e 31.",
        path: ["recurrenceDueDay"],
      });
    }
    if (!value.recurrenceStartDate) {
      ctx.addIssue({
        code: "custom",
        message: "Informe a data de início da cobrança.",
        path: ["recurrenceStartDate"],
      });
    }
  }
  if (value.paymentMethod === "Outro" && !value.customPaymentDescription?.trim()) {
    ctx.addIssue({
      code: "custom",
      message: "Informe as condições de pagamento.",
      path: ["customPaymentDescription"],
    });
  }
  if (value.startsAt && value.endsAt && new Date(value.endsAt) <= new Date(value.startsAt)) {
    ctx.addIssue({
      code: "custom",
      message: "O vencimento deve ser posterior ao início.",
      path: ["endsAt"],
    });
  }
  if (value.startsAt && value.renewalAt && new Date(value.renewalAt) < new Date(value.startsAt)) {
    ctx.addIssue({
      code: "custom",
      message: "A renovação deve ser posterior ao início.",
      path: ["renewalAt"],
    });
  }
}

export const contractFormSchema = contractFormBaseSchema.superRefine(refineContractDatesAndPayment);

export const contractPatchSchema = contractFormBaseSchema
  .partial()
  .extend({
    id: z.string().uuid("Contrato não informado."),
  })
  .superRefine(refineContractDatesAndPayment);

export type ContractFormValues = z.input<typeof contractFormSchema>;
export type ContractFormData = z.output<typeof contractFormSchema>;
