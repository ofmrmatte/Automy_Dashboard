import type { Lead, LeadListResponse, LeadStatus } from "@/features/leads/types";
import { RepositoryError } from "@/shared/api/errors";

export const leadRepository = {
  list: async ({
    search,
    status,
    page,
    pageSize,
  }: {
    search: string;
    status: LeadStatus | "all";
    page: number;
    pageSize: number;
  }): Promise<LeadListResponse> => {
    const params = new URLSearchParams({
      search,
      status,
      page: String(page),
      pageSize: String(pageSize),
    });
    const response = await fetch(`/api/leads?${params.toString()}`, { credentials: "include" });
    if (!response.ok) {
      const payload = (await response.json().catch(() => null)) as { error?: string } | null;
      throw new RepositoryError(payload?.error ?? "Não foi possível carregar leads.");
    }

    return (await response.json()) as LeadListResponse;
  },
  update: async (payload: {
    id: string;
    status?: LeadStatus;
    assignedUserId?: string | null;
    firstContactAt?: string | null;
  }) => {
    const response = await fetch("/api/leads", {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      credentials: "include",
      body: JSON.stringify(payload),
    });
    if (!response.ok) {
      const result = (await response.json().catch(() => null)) as { error?: string } | null;
      throw new RepositoryError(result?.error ?? "Não foi possível atualizar o lead.");
    }

    return (await response.json()) as { lead: Lead };
  },
  convert: async (id: string) => {
    const response = await fetch("/api/leads/convert", {
      method: "POST",
      headers: { "content-type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ id }),
    });
    if (!response.ok) {
      const result = (await response.json().catch(() => null)) as { error?: string } | null;
      throw new RepositoryError(result?.error ?? "Não foi possível converter o lead.");
    }

    return (await response.json()) as { lead: Lead; clientId: string };
  },
};
