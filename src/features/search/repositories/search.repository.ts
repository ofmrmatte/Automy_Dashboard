import type { SearchPayload } from "@/features/search/types";
import { RepositoryError } from "@/shared/api/errors";

async function readError(response: Response, fallback: string) {
  const result = (await response.json().catch(() => null)) as { error?: string } | null;
  return result?.error ?? fallback;
}

export const searchRepository = {
  global: async (query: string): Promise<SearchPayload> => {
    if (typeof window === "undefined" || query.trim().length < 2) {
      return { query, results: [] };
    }

    const params = new URLSearchParams({ q: query.trim(), limit: "6" });
    const response = await fetch(`/api/search?${params.toString()}`);

    if (!response.ok) {
      throw new RepositoryError(await readError(response, "Não foi possível pesquisar."));
    }

    return (await response.json()) as SearchPayload;
  },
};
