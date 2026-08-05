import { z } from "zod";

export const loginSchema = z.object({
  email: z.string().email("Informe um e-mail válido."),
  password: z.string().min(1, "Informe sua senha."),
  rememberMe: z.boolean(),
});

export const passwordRecoverySchema = z.object({
  email: z.string().email("Informe um e-mail válido."),
});

export const resetPasswordSchema = z
  .object({
    password: z.string().min(8, "A senha deve ter pelo menos 8 caracteres."),
    confirmPassword: z.string().min(8, "Confirme a nova senha."),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "As senhas não conferem.",
    path: ["confirmPassword"],
  });

export const profileSchema = z.object({
  firstName: z.string().trim().min(1, "Informe o nome."),
  lastName: z.string().trim().min(1, "Informe o sobrenome."),
  phone: z.string().trim(),
  jobTitle: z.string().trim(),
  companyName: z.string().trim(),
});

export const preferencesSchema = z.object({
  theme: z.enum(["system", "light", "dark"]),
  language: z.string().trim().min(2, "Informe o idioma."),
  timeZone: z.string().trim().min(1, "Informe o fuso horário."),
  dateFormat: z.string().trim().min(1, "Informe o formato de data."),
  timeFormat: z.enum(["24h", "12h"]),
  currency: z.string().trim().min(3, "Informe a moeda."),
  notifications: z.object({
    productUpdates: z.boolean(),
    securityAlerts: z.boolean(),
    operationalReports: z.boolean(),
  }),
});

export const passwordChangeSchema = z
  .object({
    currentPassword: z.string().min(1, "Informe a senha atual."),
    password: z.string().min(8, "A nova senha deve ter pelo menos 8 caracteres."),
    confirmPassword: z.string().min(8, "Confirme a nova senha."),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "As senhas não conferem.",
    path: ["confirmPassword"],
  });

export type LoginFormValues = z.infer<typeof loginSchema>;
export type PasswordRecoveryFormValues = z.infer<typeof passwordRecoverySchema>;
export type ResetPasswordFormValues = z.infer<typeof resetPasswordSchema>;
export type ProfileFormValues = z.infer<typeof profileSchema>;
export type PreferencesFormValues = z.infer<typeof preferencesSchema>;
export type PasswordChangeFormValues = z.infer<typeof passwordChangeSchema>;
