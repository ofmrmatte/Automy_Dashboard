import { z } from "zod";

const optionalText = z.string().trim();
const optionalEmail = optionalText.refine((value) => !value || z.email().safeParse(value).success, {
  message: "Informe um e-mail válido.",
});
const optionalHttpsUrl = optionalText.refine(
  (value) => !value || /^https:\/\/[^\s]+$/i.test(value),
  { message: "Informe uma URL HTTPS válida." },
);
const documentSchema = optionalText.refine((value) => {
  if (!value) return true;
  const digits = value.replace(/\D/g, "");
  return digits.length === 11 || digits.length === 14;
}, "Informe um CPF ou CNPJ válido.");
const cnpjSchema = optionalText.refine((value) => {
  if (!value) return true;
  return value.replace(/\D/g, "").length === 14;
}, "Informe um CNPJ válido.");
const postalCodeSchema = optionalText.refine((value) => {
  if (!value) return true;
  return value.replace(/\D/g, "").length === 8;
}, "Informe um CEP válido.");
const phoneSchema = optionalText.refine((value) => {
  if (!value) return true;
  const digits = value.replace(/\D/g, "");
  return digits.length >= 10 && digits.length <= 13;
}, "Informe um telefone válido.");
const timeSchema = optionalText.regex(/^\d{2}:\d{2}$/, "Informe um horário HH:mm.");

const billingAddressSchema = z.object({
  postalCode: postalCodeSchema,
  street: optionalText,
  number: optionalText,
  complement: optionalText,
  district: optionalText,
  city: optionalText,
  state: optionalText.max(2, "Use a UF com 2 letras."),
  country: optionalText.min(2, "Informe o país."),
});

export const companySettingsSchema = z.object({
  legalName: optionalText.min(2, "Informe a razão social."),
  tradeName: optionalText.min(2, "Informe o nome fantasia."),
  document: cnpjSchema,
  stateRegistration: optionalText,
  municipalRegistration: optionalText,
  email: optionalEmail,
  phone: phoneSchema,
  website: optionalHttpsUrl,
  description: optionalText.max(1000, "A descrição deve ter até 1000 caracteres."),
  segment: optionalText,
  status: z.enum(["active", "inactive", "pending", "blocked"]),
  postalCode: postalCodeSchema,
  street: optionalText,
  number: optionalText,
  complement: optionalText,
  district: optionalText,
  city: optionalText,
  state: optionalText.max(2, "Use a UF com 2 letras."),
  country: optionalText.min(2, "Informe o país."),
  timeZone: optionalText.min(1, "Informe o fuso horário."),
  defaultLanguage: optionalText.min(2, "Informe o idioma."),
  defaultCurrency: optionalText.min(3, "Informe a moeda."),
  dateFormat: optionalText.min(1, "Informe o formato de data."),
  timeFormat: z.enum(["24h", "12h"]),
  firstDayOfWeek: z.coerce.number().int().min(0).max(6),
  businessHours: z.object({
    start: timeSchema,
    end: timeSchema,
  }),
  defaultContractTermDays: z.coerce.number().int().min(1).max(3650),
  defaultBillingTermDays: z.coerce.number().int().min(0).max(365),
  logoUrl: optionalHttpsUrl,
  faviconUrl: optionalHttpsUrl,
  displayName: optionalText,
  billingLegalName: optionalText,
  billingDocument: documentSchema,
  billingEmail: optionalEmail,
  billingPhone: phoneSchema,
  billingAddress: billingAddressSchema,
});

export const securitySettingsSchema = z.object({
  sessionDurationDays: z.coerce.number().int().min(1).max(90),
  requirePasswordChangeOnFirstLogin: z.boolean(),
  minPasswordLength: z.coerce.number().int().min(8).max(128),
  lockoutAttempts: z.coerce.number().int().min(3).max(20),
  lockoutDurationMinutes: z.coerce.number().int().min(1).max(1440),
  allowMultipleSessions: z.boolean(),
  requireEmailVerified: z.boolean(),
});

export const integrationProviderSchema = z.enum([
  "better_auth",
  "mercado_pago",
  "transactional_email",
  "storage",
  "railway",
]);

export const integrationUpdateSchema = z.object({
  status: z.enum(["connected", "disconnected", "not_configured", "error", "pending"]),
  environment: optionalText.min(1, "Informe o ambiente."),
  publicConfig: z.record(z.string(), z.union([z.string(), z.number(), z.boolean(), z.null()])),
});

const quietHoursSchema = z.object({
  enabled: z.boolean(),
  start: timeSchema,
  end: timeSchema,
});

export const notificationSettingsSchema = z.object({
  userPreferences: z.object({
    inApp: z.boolean(),
    email: z.boolean(),
    contracts: z.boolean(),
    billing: z.boolean(),
    tickets: z.boolean(),
    agenda: z.boolean(),
    security: z.boolean(),
    adminUpdates: z.boolean(),
    dailySummary: z.boolean(),
    weeklySummary: z.boolean(),
  }),
  companySettings: z
    .object({
      inAppEnabled: z.boolean(),
      emailEnabled: z.boolean(),
      defaultSender: optionalEmail,
      contractNoticeDays: z.coerce.number().int().min(0).max(365),
      billingNoticeDays: z.coerce.number().int().min(0).max(365),
      agendaReminderMinutes: z.coerce.number().int().min(0).max(10080),
      slaWarningHours: z.coerce.number().int().min(1).max(720),
      criticalAlertsEnabled: z.boolean(),
      quietHours: quietHoursSchema,
      timezone: optionalText.min(1, "Informe o fuso horário."),
    })
    .optional(),
});

export type CompanySettingsFormValues = z.input<typeof companySettingsSchema>;
export type SecuritySettingsFormValues = z.input<typeof securitySettingsSchema>;
export type IntegrationUpdateFormValues = z.input<typeof integrationUpdateSchema>;
export type NotificationSettingsFormValues = z.input<typeof notificationSettingsSchema>;
