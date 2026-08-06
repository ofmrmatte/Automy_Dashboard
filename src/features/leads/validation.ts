import { z } from "zod";
import { isValidCnpj, isValidCpf, onlyDigits } from "@/shared/utils/document";

const optionalText = (max: number) => z.string().trim().max(max).optional().default("");

export const leadStatusSchema = z.enum([
  "new",
  "contacted",
  "qualified",
  "proposal",
  "converted",
  "lost",
  "discarded",
]);

export const publicLeadSchema = z
  .object({
    name: z.string().trim().min(2, "Informe seu nome.").max(120),
    company: z.string().trim().min(2, "Informe a empresa.").max(160),
    email: z.email("Informe um e-mail válido.").trim().toLowerCase().max(180),
    phone: z.string().trim().min(8, "Informe um telefone.").max(30),
    document: optionalText(24).transform((value) => onlyDigits(value)),
    message: optionalText(3000),
    interest: optionalText(200),
    challenge: optionalText(200),
    source: optionalText(80),
    source_page: optionalText(1000),
    landingPath: optionalText(1000),
    referrer: optionalText(1000),
    utmSource: optionalText(160),
    utmMedium: optionalText(160),
    utmCampaign: optionalText(200),
    utmContent: optionalText(200),
    utmTerm: optionalText(200),
    utm_source: optionalText(160),
    utm_medium: optionalText(160),
    utm_campaign: optionalText(200),
    utm_content: optionalText(200),
    utm_term: optionalText(200),
    gclid: optionalText(250),
    fbclid: optionalText(250),
    consent: z.literal(true, { error: "Confirme o consentimento para contato." }),
    website: optionalText(160),
    turnstileToken: optionalText(2048),
  })
  .superRefine((value, context) => {
    if (value.document && !isValidCnpj(value.document) && !isValidCpf(value.document)) {
      context.addIssue({
        code: "custom",
        path: ["document"],
        message: "Informe um CPF ou CNPJ válido.",
      });
    }
  });

export const leadListQuerySchema = z.object({
  search: z.string().trim().max(200).optional().default(""),
  status: leadStatusSchema.or(z.literal("all")).optional().default("all"),
  page: z.coerce.number().int().min(1).max(500).optional().default(1),
  pageSize: z.coerce.number().int().min(1).max(100).optional().default(10),
});

export const leadUpdateSchema = z.object({
  id: z.uuid("Lead inválido."),
  status: leadStatusSchema.optional(),
  assignedUserId: z.uuid("Responsável inválido.").nullable().optional(),
  firstContactAt: z.string().datetime().nullable().optional(),
});

export const leadConvertSchema = z.object({
  id: z.uuid("Lead inválido."),
});

export type PublicLeadInput = z.output<typeof publicLeadSchema>;
export type LeadListQuery = z.output<typeof leadListQuerySchema>;
export type LeadUpdateInput = z.output<typeof leadUpdateSchema>;
