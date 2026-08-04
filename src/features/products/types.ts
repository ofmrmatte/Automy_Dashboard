export type ProductStatus = "Ativo" | "Beta" | "Descontinuando";

export type Product = {
  name: string;
  category: string;
  version: string;
  clients: number;
  status: ProductStatus;
};

export type ProductFilter = {
  search: string;
};
