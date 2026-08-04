import type { AuditableEntity } from "@/shared/types/entity";

export type ProductStatus = "Ativo" | "Beta" | "Descontinuando";

export type Product = AuditableEntity & {
  id: string;
  name: string;
  category: string;
  version: string;
  clients: number;
  status: ProductStatus;
};

export type ProductFilter = {
  search: string;
};
