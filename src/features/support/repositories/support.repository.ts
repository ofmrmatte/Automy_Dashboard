import type { Ticket } from "@/features/support/types";
import { RepositoryError } from "@/shared/api/errors";
import { formatDate } from "@/shared/utils/formatters";

type TicketRow = {
  id: string;
  client_name: string;
  title: string;
  priority: Ticket["priority"];
  owner: string | null;
  status: Ticket["status"];
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
  created_by: string | null;
  updated_by: string | null;
};

function mapTicket(row: TicketRow): Ticket {
  return {
    id: row.id,
    client: row.client_name,
    title: row.title,
    priority: row.priority,
    owner: row.owner ?? "Automy",
    status: row.status,
    date: formatDate(row.created_at),
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
      throw new RepositoryError("Não foi possível carregar tickets.");
    }

    const payload = (await response.json()) as { tickets?: TicketRow[] };
    return (payload.tickets ?? []).map(mapTicket);
  },
  createTicket: async (payload: {
    clientName: string;
    title: string;
    description: string;
    priority: Ticket["priority"];
    owner: string;
    status: Ticket["status"];
  }) => {
    const response = await fetch("/api/support/tickets", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const result = (await response.json().catch(() => null)) as { error?: string } | null;
      throw new RepositoryError(result?.error ?? "Não foi possível salvar o ticket.");
    }

    const result = (await response.json()) as { ticket: TicketRow };
    return mapTicket(result.ticket);
  },
};
