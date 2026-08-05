import type {
  Ticket,
  TicketAttachment,
  TicketEvent,
  TicketMessage,
  TicketStatus,
} from "@/features/support/types";
import type { TicketFormData, TicketPatchData } from "@/features/support/validation";
import { RepositoryError } from "@/shared/api/errors";
import { formatDate } from "@/shared/utils/formatters";

type MessageRow = {
  id: string;
  ticket_id: string;
  author_user_id: string | null;
  author_name: string;
  body: string;
  visibility: "internal" | "client";
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
  created_by: string | null;
  updated_by: string | null;
};

type AttachmentRow = {
  id: string;
  ticket_id: string;
  file_name: string;
  file_url: string;
  mime_type: string | null;
  size_bytes: number | null;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
  created_by: string | null;
  updated_by: string | null;
};

type EventRow = {
  id: string;
  ticket_id: string;
  event_type: string;
  metadata: Record<string, unknown> | null;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
  created_by: string | null;
  updated_by: string | null;
};

type TicketRow = {
  id: string;
  ticket_number: string;
  client_id: string | null;
  client_name: string;
  title: string;
  description: string | null;
  category: string;
  priority: Ticket["priority"];
  owner_user_id: string | null;
  owner: string | null;
  status: Ticket["status"];
  source: string;
  tags: string[] | null;
  first_response_due_at: string | null;
  resolution_due_at: string | null;
  first_responded_at: string | null;
  resolved_at: string | null;
  closed_at: string | null;
  reopened_at: string | null;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
  created_by: string | null;
  updated_by: string | null;
  messages?: MessageRow[] | null;
  attachments?: AttachmentRow[] | null;
  events?: EventRow[] | null;
};

async function parseApiError(response: Response, fallback: string) {
  const payload = (await response.json().catch(() => null)) as { error?: string } | null;
  return new RepositoryError(payload?.error ?? fallback);
}

function mapMessage(row: MessageRow): TicketMessage {
  return {
    id: row.id,
    ticketId: row.ticket_id,
    authorUserId: row.author_user_id ?? "",
    authorName: row.author_name,
    body: row.body,
    visibility: row.visibility,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    deletedAt: row.deleted_at,
    createdBy: row.created_by,
    updatedBy: row.updated_by,
  };
}

function mapAttachment(row: AttachmentRow): TicketAttachment {
  return {
    id: row.id,
    ticketId: row.ticket_id,
    fileName: row.file_name,
    fileUrl: row.file_url,
    mimeType: row.mime_type ?? "",
    sizeBytes: row.size_bytes,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    deletedAt: row.deleted_at,
    createdBy: row.created_by,
    updatedBy: row.updated_by,
  };
}

function mapEvent(row: EventRow): TicketEvent {
  return {
    id: row.id,
    ticketId: row.ticket_id,
    eventType: row.event_type,
    metadata: row.metadata ?? {},
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    deletedAt: row.deleted_at,
    createdBy: row.created_by,
    updatedBy: row.updated_by,
  };
}

function mapTicket(row: TicketRow): Ticket {
  return {
    id: row.id,
    number: row.ticket_number,
    clientId: row.client_id ?? "",
    client: row.client_name,
    title: row.title,
    description: row.description ?? "",
    category: row.category,
    priority: row.priority,
    ownerUserId: row.owner_user_id ?? "",
    owner: row.owner ?? "Não definido",
    status: row.status,
    source: row.source,
    tags: row.tags ?? [],
    firstResponseDueAt: row.first_response_due_at,
    resolutionDueAt: row.resolution_due_at,
    firstRespondedAt: row.first_responded_at,
    resolvedAt: row.resolved_at,
    closedAt: row.closed_at,
    reopenedAt: row.reopened_at,
    date: formatDate(row.created_at),
    messages: (row.messages ?? []).map(mapMessage),
    attachments: (row.attachments ?? []).map(mapAttachment),
    events: (row.events ?? []).map(mapEvent),
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    deletedAt: row.deleted_at,
    createdBy: row.created_by,
    updatedBy: row.updated_by,
  };
}

export const supportRepository = {
  listTickets: async (): Promise<Ticket[]> => {
    const response = await fetch("/api/support/tickets");
    if (!response.ok) {
      throw await parseApiError(response, "Não foi possível carregar tickets.");
    }

    const payload = (await response.json()) as { tickets?: TicketRow[] };
    return (payload.tickets ?? []).map(mapTicket);
  },
  createTicket: async (payload: TicketFormData) => {
    const response = await fetch("/api/support/tickets", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      throw await parseApiError(response, "Não foi possível salvar o ticket.");
    }

    const result = (await response.json()) as { ticket: TicketRow };
    return mapTicket(result.ticket);
  },
  updateTicket: async (payload: TicketPatchData) => {
    const response = await fetch("/api/support/tickets", {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      throw await parseApiError(response, "Não foi possível atualizar o ticket.");
    }

    const result = (await response.json()) as { ticket: TicketRow };
    return mapTicket(result.ticket);
  },
  updateTicketStatus: async (ticketId: string, status: TicketStatus) =>
    supportRepository.updateTicket({ id: ticketId, status }),
  removeTicket: async (ticketId: string) => {
    const response = await fetch(`/api/support/tickets?id=${encodeURIComponent(ticketId)}`, {
      method: "DELETE",
    });

    if (!response.ok) {
      throw await parseApiError(response, "Não foi possível excluir o ticket.");
    }
  },
};
