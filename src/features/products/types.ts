import type { AuditableEntity } from "@/shared/types/entity";

export type ProductStatus = "Ativo" | "Beta" | "Inativo" | "Descontinuando";

export type ProductCommercialTerms = {
  schemaVersion?: number;
  source?: "catalog" | "legacy_product_terms";
  deprecated?: boolean;
  hostedOnAutomyUrl?: boolean;
  customUrl?: boolean;
  userLimit?: number;
  segment?: string;
  implementationDays?: number;
  implementationFee?: number;
  paymentMethod?: string;
  installments?: number;
  discountPercent?: number;
  hasMonthlyFee?: boolean;
  monthlyFee?: number;
  hasDatabaseCost?: boolean;
  databaseCost?: number;
  extraUserPrice?: number;
  loyaltyMonths?: number;
  deliverables?: string;
};

export type Product = AuditableEntity & {
  id: string;
  name: string;
  category: string;
  version: string;
  clients: number;
  contracts: number;
  status: ProductStatus;
  basePrice: number;
  billingMode: string;
  description?: string;
  notes?: string;
  commercialTerms?: ProductCommercialTerms | null;
  contractTemplate?: string | null;
};

export type ProductFilter = {
  search: string;
  status: ProductStatus | "Todos";
  category: string;
};
