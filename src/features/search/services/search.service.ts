import { searchRepository } from "@/features/search/repositories/search.repository";

export const searchService = {
  global: (query: string) => searchRepository.global(query),
};
