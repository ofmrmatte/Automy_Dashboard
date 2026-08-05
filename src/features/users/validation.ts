import { z } from "zod";

export const userRoleSchema = z.enum(["admin", "manager", "operator", "read_only"]);
export const userStatusSchema = z.enum(["active", "inactive", "invited", "suspended"]);

export const createUserSchema = z.object({
  name: z.string().trim().min(2, "Informe o nome do usuário."),
  email: z.email("Informe um e-mail válido.").transform((email) => email.toLowerCase()),
  role: userRoleSchema,
  status: userStatusSchema,
  password: z.string().min(8, "A senha deve ter pelo menos 8 caracteres."),
});

export const updateUserSchema = z.object({
  id: z.uuid("Usuário inválido."),
  name: z.string().trim().min(2, "Informe o nome do usuário."),
  email: z.email("Informe um e-mail válido.").transform((email) => email.toLowerCase()),
  role: userRoleSchema,
  status: userStatusSchema,
});

export const updateUserPasswordSchema = z.object({
  id: z.uuid("Usuário inválido."),
  password: z.string().min(8, "A senha deve ter pelo menos 8 caracteres."),
});

export type CreateUserFormValues = z.input<typeof createUserSchema>;
export type UpdateUserFormValues = z.input<typeof updateUserSchema>;
export type UpdateUserPasswordFormValues = z.input<typeof updateUserPasswordSchema>;
