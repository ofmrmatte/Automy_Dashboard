import type { Client, ClientFilter } from "@/features/clients/types";
import { clientRepository } from "@/features/clients/repositories/client.repository";
import { normalizeSearch } from "@/shared/utils/formatters";

function matchesClientFilter(client: Client, filter: ClientFilter) {
  const term = normalizeSearch(filter.search);
  const searchable = normalizeSearch(`${client.name} ${client.legal} ${client.cnpj}`);
  return (
    searchable.includes(term) && (filter.status === "Todos" || client.status === filter.status)
  );
}

export const clientService = {
  listClients: () => clientRepository.list(),
  getClientById: (clientId: string) => clientRepository.findById(clientId),
  filterClients: (clients: Client[], filter: ClientFilter) =>
    clients.filter((client) => matchesClientFilter(client, filter)),
};
