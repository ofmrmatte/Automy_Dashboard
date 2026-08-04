import { supportRepository } from "@/features/support/repositories/support.repository";
import type { Ticket, TicketFilter } from "@/features/support/types";
import { normalizeSearch } from "@/shared/utils/formatters";

export const supportService = {
  listTickets: () => supportRepository.listTickets(),
  filterTickets: (tickets: Ticket[], filter: TicketFilter) => {
    const term = normalizeSearch(filter.search);
    return tickets.filter(
      (ticket) =>
        normalizeSearch(`${ticket.client} ${ticket.title} ${ticket.id}`).includes(term) &&
        (filter.priority === "Todas" || ticket.priority === filter.priority),
    );
  },
};
