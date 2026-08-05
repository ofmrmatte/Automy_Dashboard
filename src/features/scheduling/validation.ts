import { z } from "zod";

export const scheduledCallStatuses = ["scheduled", "rescheduled", "completed", "canceled"] as const;

export const scheduledCallStatusLabels: Record<(typeof scheduledCallStatuses)[number], string> = {
  scheduled: "Agendada",
  rescheduled: "Reagendada",
  completed: "Concluída",
  canceled: "Cancelada",
};

const optionalText = z.string().trim().optional().default("");
const optionalUuid = z
  .union([z.uuid(), z.literal("")])
  .optional()
  .default("");

export const scheduledCallFormSchema = z.object({
  id: z.string().optional(),
  clientId: z.uuid("Selecione um cliente."),
  ownerUserId: optionalUuid,
  title: z.string().trim().min(2, "Informe o título."),
  description: optionalText,
  startDate: z.string().trim().min(1, "Informe a data inicial."),
  startTime: z.string().trim().min(1, "Informe o horário inicial."),
  endDate: z.string().trim().min(1, "Informe a data final."),
  endTime: z.string().trim().min(1, "Informe o horário final."),
  timezone: z.string().trim().min(1, "Informe o fuso horário."),
  meetingLink: optionalText.refine(
    (value) => !value || z.url().safeParse(value).success,
    "Informe uma URL válida.",
  ),
  contactName: optionalText,
  contactEmail: optionalText.refine(
    (value) => !value || z.email().safeParse(value).success,
    "Informe um e-mail válido.",
  ),
  contactPhone: optionalText,
  participants: optionalText,
  reminderMinutes: z.coerce.number().int().min(0).max(10080).default(30),
  notes: optionalText,
  status: z.enum(scheduledCallStatuses).default("scheduled"),
});

export const scheduledCallPatchSchema = scheduledCallFormSchema.partial().extend({
  id: z.uuid("Agendamento não informado."),
  status: z.enum(scheduledCallStatuses).optional(),
});

export type ScheduledCallFormValues = z.input<typeof scheduledCallFormSchema>;
export type ScheduledCallFormData = z.output<typeof scheduledCallFormSchema>;
export type ScheduledCallPatchData = z.output<typeof scheduledCallPatchSchema>;
