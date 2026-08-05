import { z } from "zod";

export const chargeStatuses = ["pending", "paid", "overdue", "canceled", "failed"] as const;

export const chargeMethods = ["Boleto", "Pix", "Cartão", "Transferência", "Mercado Pago"] as const;

export const chargeStatusLabels: Record<(typeof chargeStatuses)[number], string> = {
  pending: "Pendente",
  paid: "Pago",
  overdue: "Atrasado",
  canceled: "Cancelado",
  failed: "Falhou",
};

const optionalText = z.string().trim().optional().default("");
const optionalUuid = z
  .union([z.uuid(), z.literal("")])
  .optional()
  .default("");

export const chargeFormSchema = z.object({
  id: z.string().optional(),
  clientId: z.uuid("Selecione um cliente."),
  contractId: optionalUuid,
  invoice: z.string().trim().min(2, "Informe a fatura."),
  reference: optionalText,
  description: optionalText,
  dueDate: z.string().trim().min(1, "Informe o vencimento."),
  amount: z.coerce.number().min(0.01, "Informe um valor maior que zero."),
  method: z.enum(chargeMethods),
  status: z.enum(chargeStatuses).default("pending"),
  notes: optionalText,
});

export const chargePatchSchema = chargeFormSchema.partial().extend({
  id: z.uuid("Cobrança não informada."),
  status: z.enum(chargeStatuses).optional(),
});

export type ChargeFormValues = z.input<typeof chargeFormSchema>;
export type ChargeFormData = z.output<typeof chargeFormSchema>;
export type ChargePatchData = z.output<typeof chargePatchSchema>;
