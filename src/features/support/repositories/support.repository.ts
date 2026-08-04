import { ticketsMock } from "@/features/support/mocks/tickets.mock";

export const supportRepository = {
  listTicketsSnapshot: () => ticketsMock,
  listTickets: async () => ticketsMock,
};
