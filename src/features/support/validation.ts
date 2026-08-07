import { z } from "zod";

export const ticketPriorities = ["Crítica", "Alta", "Média", "Baixa"] as const;
export const ticketStatuses = [
  "Aberto",
  "Em andamento",
  "Aguardando",
  "Resolvido",
  "Fechado",
  "Cancelado",
] as const;

const optionalText = z.string().trim().optional().default("");
const optionalPatchText = z.string().trim().optional();
const optionalUuid = z
  .union([z.uuid(), z.literal("")])
  .optional()
  .default("");

export const ticketFormSchema = z.object({
  id: z.string().optional(),
  clientId: z.uuid("Selecione um cliente."),
  ownerUserId: optionalUuid,
  title: z.string().trim().min(2, "Informe o título."),
  description: optionalText,
  category: z.string().trim().min(2, "Informe a categoria.").default("Operacional"),
  priority: z.enum(ticketPriorities).default("Média"),
  status: z.enum(ticketStatuses).default("Aberto"),
  firstResponseDueAt: optionalText,
  resolutionDueAt: optionalText,
  tags: optionalText,
  initialMessage: optionalText,
});

export const ticketPatchSchema = ticketFormSchema.partial().extend({
  id: z.uuid("Ticket não informado."),
  message: optionalPatchText,
  messageVisibility: z.enum(["internal", "client"]).optional(),
  attachmentName: optionalPatchText,
  attachmentUrl: optionalPatchText.refine(
    (value) => !value || z.url().safeParse(value).success,
    "Informe uma URL válida para o anexo.",
  ),
  attachmentMimeType: optionalPatchText,
  attachmentSizeBytes: z.coerce.number().int().nonnegative().optional(),
});

export type TicketFormValues = z.input<typeof ticketFormSchema>;
export type TicketFormData = z.output<typeof ticketFormSchema>;
export type TicketPatchData = z.output<typeof ticketPatchSchema>;
