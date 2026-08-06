import { z } from "zod";
import { isValidCnpj } from "@/shared/utils/document";

const optionalTrimmed = z.string().trim().optional().default("");
const optionalEmail = z
  .string()
  .trim()
  .optional()
  .default("")
  .refine((value) => !value || z.email().safeParse(value).success, "Informe um e-mail válido.");
const optionalUrl = z
  .string()
  .trim()
  .optional()
  .default("")
  .refine((value) => !value || z.url().safeParse(value).success, "Informe uma URL válida.");

export const clientStatusSchema = z.enum([
  "Ativo",
  "Implantação",
  "Pendente",
  "Inativo",
  "Bloqueado",
]);

export const clientFormSchema = z.object({
  id: z.string().optional(),
  tradeName: z.string().trim().min(2, "Informe o nome fantasia."),
  legalName: z.string().trim().min(2, "Informe a razão social."),
  document: z
    .string()
    .trim()
    .min(14, "Informe o CNPJ.")
    .refine((value) => isValidCnpj(value), "Informe um CNPJ válido."),
  stateRegistration: optionalTrimmed,
  municipalRegistration: optionalTrimmed,
  legalNature: optionalTrimmed,
  cnae: optionalTrimmed,
  registrationStatus: optionalTrimmed,
  openedAt: optionalTrimmed,
  segment: optionalTrimmed,
  email: optionalEmail,
  phone: optionalTrimmed,
  website: optionalUrl,
  notes: optionalTrimmed,
  logoUrl: optionalUrl,
  owner: optionalTrimmed,
  ownerEmail: optionalEmail,
  ownerPhone: optionalTrimmed,
  plan: optionalTrimmed,
  status: clientStatusSchema,
  postalCode: optionalTrimmed,
  street: optionalTrimmed,
  number: optionalTrimmed,
  complement: optionalTrimmed,
  district: optionalTrimmed,
  city: optionalTrimmed,
  state: optionalTrimmed.transform((value) => value.toUpperCase()),
  country: optionalTrimmed,
});

export type ClientFormValues = z.input<typeof clientFormSchema>;
export type ClientFormData = z.output<typeof clientFormSchema>;
