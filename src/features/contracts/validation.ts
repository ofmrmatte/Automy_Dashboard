import { z } from "zod";

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

const optionalUuid = z.preprocess(
  (value) => (value === "" ? undefined : value),
  z.string().uuid().optional(),
);

export const contractFormSchema = z.object({
  id: optionalUuid,
  clientId: z.string().uuid("Selecione o cliente."),
  productId: z.string().uuid("Selecione o produto."),
  name: z.string().trim().min(2, "Informe o plano ou nome do contrato."),
  monthlyValue: z.coerce.number().min(0, "Informe um valor mensal válido."),
  implementationValue: z.coerce.number().min(0, "Informe um valor de implantação válido."),
  startsAt: z.string().trim().min(1, "Informe a data de início."),
  endsAt: z.string().trim().min(1, "Informe a data de vencimento."),
  renewalAt: z.string().trim().optional().default(""),
  billingPeriod: z.enum(contractBillingPeriods).default("Mensal"),
  status: z.enum(contractStatuses).default("Pendente"),
  signerName: z.string().trim().min(2, "Informe o responsável pela assinatura."),
  witnessName: z.string().trim().optional().default(""),
  notes: z.string().trim().optional().default(""),
  contractText: z.string().trim().optional().default(""),
});

export const contractPatchSchema = contractFormSchema.partial().extend({
  id: z.string().uuid("Contrato não informado."),
});

export type ContractFormValues = z.input<typeof contractFormSchema>;
export type ContractFormData = z.output<typeof contractFormSchema>;
