import { supportRepository } from "@/features/support/repositories/support.repository";
import type { Ticket, TicketFilter, TicketStatus } from "@/features/support/types";
import { normalizeSearch } from "@/shared/utils/formatters";

export const supportService = {
  listTickets: () => supportRepository.listTickets(),
  createTicket: (payload: Parameters<typeof supportRepository.createTicket>[0]) =>
    supportRepository.createTicket(payload),
  updateTicket: (payload: Parameters<typeof supportRepository.updateTicket>[0]) =>
    supportRepository.updateTicket(payload),
  updateTicketStatus: (ticketId: string, status: TicketStatus) =>
    supportRepository.updateTicketStatus(ticketId, status),
  removeTicket: (ticketId: string) => supportRepository.removeTicket(ticketId),
  filterTickets: (tickets: Ticket[], filter: TicketFilter) => {
    const term = normalizeSearch(filter.search);
    return tickets.filter((ticket) => {
      const matchesSearch = [
        ticket.number,
        ticket.client,
        ticket.title,
        ticket.description,
        ticket.category,
        ticket.owner,
        ticket.tags.join(" "),
      ].some((value) => normalizeSearch(value ?? "").includes(term));
      const matchesPriority = filter.priority === "Todas" || ticket.priority === filter.priority;
      const matchesStatus = filter.status === "Todos" || ticket.status === filter.status;

      return matchesSearch && matchesPriority && matchesStatus;
    });
  },
};
