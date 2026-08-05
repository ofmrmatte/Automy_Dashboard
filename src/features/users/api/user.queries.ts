import { queryOptions } from "@tanstack/react-query";
import { userService } from "@/features/users/services/user.service";
import type { UserFilters } from "@/features/users/types";

export const userQueryKeys = {
  all: ["users"] as const,
  list: (filters: UserFilters) => ["users", "list", filters] as const,
  sessions: (id: string) => ["users", "sessions", id] as const,
  permissions: ["users", "permissions"] as const,
};

export function usersQueryOptions(filters: UserFilters) {
  return queryOptions({
    queryKey: userQueryKeys.list(filters),
    queryFn: () => userService.listUsers(filters),
    enabled: typeof window !== "undefined",
  });
}

export function userSessionsQueryOptions(id: string) {
  return queryOptions({
    queryKey: userQueryKeys.sessions(id),
    queryFn: () => userService.listSessions(id),
    enabled: typeof window !== "undefined" && Boolean(id),
  });
}

export function permissionsQueryOptions() {
  return queryOptions({
    queryKey: userQueryKeys.permissions,
    queryFn: () => userService.listPermissions(),
    enabled: typeof window !== "undefined",
  });
}
