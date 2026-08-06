export type SearchResultType =
  "clients" | "products" | "contracts" | "finance" | "scheduling" | "support" | "users" | "audit";

export type SearchResult = {
  id: string;
  type: SearchResultType;
  title: string;
  description: string;
  url: string;
  meta: string;
  created_at: string;
};

export type SearchPayload = {
  query: string;
  results: SearchResult[];
};
