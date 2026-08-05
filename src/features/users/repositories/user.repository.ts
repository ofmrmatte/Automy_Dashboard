import type {
  CreateUserPayload,
  PaginatedUsers,
  PermissionMatrixRole,
  UpdateUserPasswordPayload,
  UpdateUserPayload,
  UserFilters,
  UserSession,
} from "@/features/users/types";
import { RepositoryError } from "@/shared/api/errors";

async function parseApiError(response: Response, fallback: string) {
  const payload = (await response.json().catch(() => null)) as { error?: string } | null;
  return new RepositoryError(payload?.error ?? fallback);
}

function usersUrl(filters: UserFilters) {
  const params = new URLSearchParams({
    search: filters.search,
    role: filters.role,
    status: filters.status,
    page: String(filters.page),
    pageSize: String(filters.pageSize),
  });
  return `/api/users?${params.toString()}`;
}

export const userRepository = {
  list: async (filters: UserFilters): Promise<PaginatedUsers> => {
    const response = await fetch(usersUrl(filters), { credentials: "include" });
    if (!response.ok) throw await parseApiError(response, "Não foi possível carregar usuários.");
    return (await response.json()) as PaginatedUsers;
  },

  create: async (payload: CreateUserPayload) => {
    const response = await fetch("/api/users", {
      method: "POST",
      headers: { "content-type": "application/json" },
      credentials: "include",
      body: JSON.stringify(payload),
    });
    if (!response.ok) throw await parseApiError(response, "Não foi possível criar o usuário.");
  },

  update: async (payload: UpdateUserPayload) => {
    const response = await fetch("/api/users", {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      credentials: "include",
      body: JSON.stringify(payload),
    });
    if (!response.ok) throw await parseApiError(response, "Não foi possível atualizar o usuário.");
  },

  remove: async (id: string) => {
    const response = await fetch(`/api/users?id=${encodeURIComponent(id)}`, {
      method: "DELETE",
      credentials: "include",
    });
    if (!response.ok) throw await parseApiError(response, "Não foi possível excluir o usuário.");
  },

  updatePassword: async (payload: UpdateUserPasswordPayload) => {
    const response = await fetch("/api/users/password", {
      method: "POST",
      headers: { "content-type": "application/json" },
      credentials: "include",
      body: JSON.stringify(payload),
    });
    if (!response.ok) throw await parseApiError(response, "Não foi possível alterar a senha.");
  },

  listSessions: async (id: string): Promise<UserSession[]> => {
    const response = await fetch(`/api/users/sessions?id=${encodeURIComponent(id)}`, {
      credentials: "include",
    });
    if (!response.ok) throw await parseApiError(response, "Não foi possível carregar sessões.");
    const payload = (await response.json()) as { sessions?: UserSession[] };
    return payload.sessions ?? [];
  },

  revokeSessions: async (id: string) => {
    const response = await fetch(`/api/users/sessions?id=${encodeURIComponent(id)}`, {
      method: "DELETE",
      credentials: "include",
    });
    if (!response.ok) throw await parseApiError(response, "Não foi possível revogar sessões.");
  },

  permissions: async (): Promise<PermissionMatrixRole[]> => {
    const response = await fetch("/api/permissions", { credentials: "include" });
    if (!response.ok) {
      throw await parseApiError(response, "Não foi possível carregar permissões.");
    }
    const payload = (await response.json()) as { roles?: PermissionMatrixRole[] };
    return payload.roles ?? [];
  },
};
