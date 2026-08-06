import { z } from "zod";

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

const moneySchema = z.coerce.number().min(0, "Informe um valor válido.");
const integerSchema = z.coerce.number().int().min(0, "Informe um número válido.");

export const productFormSchema = z.object({
  id: z.preprocess((value) => (value === "" ? undefined : value), z.string().uuid().optional()),
  name: z.string().trim().min(2, "Informe o nome do produto."),
  description: z.string().trim().optional().default(""),
  category: z.string().trim().min(2, "Informe a categoria."),
  version: z.string().trim().min(1, "Informe a versão."),
  status: z.enum(productStatuses).default("Ativo"),
  basePrice: moneySchema.default(0),
  billingMode: z.string().trim().min(2, "Informe a modalidade."),
  notes: z.string().trim().optional().default(""),
  hostedOnAutomyUrl: z.coerce.boolean().default(true),
  customUrl: z.coerce.boolean().default(false),
  userLimit: integerSchema.min(1, "Informe ao menos 1 usuário.").default(5),
  segment: z.string().trim().optional().default(""),
  implementationDays: integerSchema.min(1, "Informe o prazo de implantação.").default(30),
  implementationFee: moneySchema.default(0),
  paymentMethod: z.string().trim().min(2, "Informe a forma de pagamento."),
  installments: integerSchema.min(1, "Informe ao menos 1 parcela.").default(1),
  discountPercent: z.coerce.number().min(0).max(100).default(0),
  hasMonthlyFee: z.coerce.boolean().default(true),
  monthlyFee: moneySchema.default(0),
  hasDatabaseCost: z.coerce.boolean().default(false),
  databaseCost: moneySchema.default(0),
  extraUserPrice: moneySchema.default(0),
  loyaltyMonths: integerSchema.default(12),
  deliverables: z.string().trim().min(10, "Descreva as entregas do produto."),
  contractTemplate: z.string().trim().optional().default(""),
});

export const productPatchSchema = productFormSchema.partial().extend({
  id: z.string().uuid("Produto não informado."),
});

export type ProductFormValues = z.input<typeof productFormSchema>;
export type ProductFormData = z.output<typeof productFormSchema>;
