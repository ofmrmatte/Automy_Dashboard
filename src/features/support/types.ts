import type { AuditableEntity } from "@/shared/types/entity";

export type TicketPriority = "Crítica" | "Alta" | "Média" | "Baixa";
export type TicketStatus =
  "Aberto" | "Em andamento" | "Aguardando" | "Resolvido" | "Fechado" | "Cancelado";

export type TicketMessage = AuditableEntity & {
  id: string;
  ticketId: string;
  authorUserId: string;
  authorName: string;
  body: string;
  visibility: "internal" | "client";
};

export type TicketAttachment = AuditableEntity & {
  id: string;
  ticketId: string;
  fileName: string;
  fileUrl: string;
  mimeType: string;
  sizeBytes: number | null;
};

export type TicketEvent = AuditableEntity & {
  id: string;
  ticketId: string;
  eventType: string;
  metadata: Record<string, unknown>;
};

export type Ticket = AuditableEntity & {
  id: string;
  number: string;
  clientId: string;
  client: string;
  title: string;
  description: string;
  category: string;
  priority: TicketPriority;
  ownerUserId: string;
  owner: string;
  status: TicketStatus;
  source: string;
  tags: string[];
  firstResponseDueAt: string | null;
  resolutionDueAt: string | null;
  firstRespondedAt: string | null;
  resolvedAt: string | null;
  closedAt: string | null;
  reopenedAt: string | null;
  date: string;
  messages: TicketMessage[];
  attachments: TicketAttachment[];
  events: TicketEvent[];
};

export type TicketFilter = {
  search: string;
  priority: TicketPriority | "Todas";
  status: TicketStatus | "Todos";
};
