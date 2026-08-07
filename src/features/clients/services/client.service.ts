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
  createClient: (payload: Parameters<typeof clientRepository.create>[0]) =>
    clientRepository.create(payload),
  updateClient: (payload: Parameters<typeof clientRepository.update>[0]) =>
    clientRepository.update(payload),
  deleteClient: (clientId: string) => clientRepository.remove(clientId),
  portalAccessAction: (
    portalUserId: string,
    action: Parameters<typeof clientRepository.portalAccessAction>[1],
  ) => clientRepository.portalAccessAction(portalUserId, action),
  filterClients: (clients: Client[], filter: ClientFilter) =>
    clients.filter((client) => matchesClientFilter(client, filter)),
};
