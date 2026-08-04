import { queryOptions } from "@tanstack/react-query";
import { clientService } from "@/features/clients/services/client.service";

export const clientQueryKeys = {
  all: ["clients"] as const,
  detail: (clientId: string) => ["clients", clientId] as const,
};

export function clientsQueryOptions() {
  return queryOptions({
    queryKey: clientQueryKeys.all,
    queryFn: () => clientService.listClients(),
  });
}

export function clientDetailQueryOptions(clientId: string) {
  return queryOptions({
    queryKey: clientQueryKeys.detail(clientId),
    queryFn: () => clientService.getClientById(clientId),
  });
}
