import { z } from "zod";
import { parseBrazilianCurrency } from "@/shared/utils/formatters";

export const productStatuses = ["Ativo", "Beta", "Inativo", "Descontinuando"] as const;

export const productCategories = [
  "Logística",
  "WhatsApp",
  "Automação",
  "CRM",
  "Financeiro",
  "Atendimento",
  "Analytics",
  "Operacional",
  "Outra ferramenta",
] as const;

export const productBillingModes = [
  "Mensal",
  "Anual",
  "Implantação",
  "Uso",
  "Projeto",
  "Sem cobrança recorrente",
] as const;

const moneySchema = z.preprocess(
  (value) => parseBrazilianCurrency(value as string | number | null | undefined),
  z.number().min(0, "Informe um valor válido."),
);

export const productFormSchema = z.object({
  id: z.preprocess((value) => (value === "" ? undefined : value), z.string().uuid().optional()),
  name: z.string().trim().min(2, "Informe o nome do produto."),
  description: z.string().trim().optional().default(""),
  category: z.string().trim().min(2, "Informe a categoria."),
  version: z.string().trim().min(1, "Informe a versão."),
  status: z.enum(productStatuses).default("Ativo"),
  basePrice: moneySchema.default(0),
  billingMode: z.string().trim().min(2, "Informe a modalidade."),
  contractTemplate: z.string().trim().optional().default(""),
});

export const productPatchSchema = productFormSchema.partial().extend({
  id: z.string().uuid("Produto não informado."),
});

export type ProductFormValues = z.input<typeof productFormSchema>;
export type ProductFormData = z.output<typeof productFormSchema>;
