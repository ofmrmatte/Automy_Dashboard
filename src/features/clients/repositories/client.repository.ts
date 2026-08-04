import { clientsMock } from "@/features/clients/mocks/clients.mock";

export const clientRepository = {
  listSnapshot: () => clientsMock,
  list: async () => clientsMock,
  findByIdSnapshot: (clientId: string) => clientsMock.find((client) => client.id === clientId),
  findById: async (clientId: string) => clientsMock.find((client) => client.id === clientId),
};
