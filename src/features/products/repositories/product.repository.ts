import type { Product, ProductCommercialTerms, ProductStatus } from "@/features/products/types";
import type { ProductFormData } from "@/features/products/validation";
import type { Database } from "@/shared/types/database";
import { RepositoryError } from "@/shared/api/errors";

type ProductRow = Omit<
  Database["public"]["Tables"]["products"]["Row"],
  "commercial_terms" | "contract_template"
> & {
  clients?: number;
  contracts?: number;
  commercial_terms?: ProductCommercialTerms | null;
  contract_template?: string | null;
};

function mapProductStatus(status: string): ProductStatus {
  if (status === "active" || status === "Ativo") return "Ativo";
  if (status === "beta" || status === "Beta") return "Beta";
  if (status === "inactive" || status === "Inativo") return "Inativo";
  return "Descontinuando";
}

function mapProduct(row: ProductRow): Product {
  return {
    id: row.id,
    name: row.name,
    category: row.category ?? "",
    version: row.version ?? "",
    clients: row.clients ?? 0,
    contracts: row.contracts ?? 0,
    status: mapProductStatus(row.status),
    basePrice: Number(row.base_price ?? 0),
    billingMode: row.billing_mode ?? "",
    description: row.description ?? "",
    notes: row.notes ?? "",
    commercialTerms: row.commercial_terms ?? null,
    contractTemplate: row.contract_template ?? null,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    deletedAt: row.deleted_at,
    createdBy: row.created_by,
    updatedBy: row.updated_by,
  };
}

export const productRepository = {
  list: async () => {
    const response = await fetch("/api/products");
    if (!response.ok) {
      throw new RepositoryError("Não foi possível carregar produtos.");
    }

    const payload = (await response.json()) as { products?: ProductRow[] };
    return (payload.products ?? []).map(mapProduct);
  },
  create: async (payload: ProductFormData) => {
    const response = await fetch("/api/products", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const result = (await response.json().catch(() => null)) as { error?: string } | null;
      throw new RepositoryError(result?.error ?? "Não foi possível salvar o produto.");
    }

    const result = (await response.json()) as { product: ProductRow };
    return mapProduct(result.product);
  },
  update: async (payload: ProductFormData & { id: string }) => {
    const response = await fetch("/api/products", {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const result = (await response.json().catch(() => null)) as { error?: string } | null;
      throw new RepositoryError(result?.error ?? "Não foi possível atualizar o produto.");
    }

    const result = (await response.json()) as { product: ProductRow };
    return mapProduct(result.product);
  },
  pause: async (productId: string) => {
    const response = await fetch("/api/products", {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ id: productId, status: "Descontinuando" }),
    });

    if (!response.ok) {
      const result = (await response.json().catch(() => null)) as { error?: string } | null;
      throw new RepositoryError(result?.error ?? "Não foi possível pausar o produto.");
    }
  },
  activate: async (productId: string) => {
    const response = await fetch("/api/products", {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ id: productId, status: "Ativo" }),
    });

    if (!response.ok) {
      const result = (await response.json().catch(() => null)) as { error?: string } | null;
      throw new RepositoryError(result?.error ?? "Não foi possível ativar o produto.");
    }
  },
  inactivate: async (productId: string) => {
    const response = await fetch("/api/products", {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ id: productId, status: "Inativo" }),
    });

    if (!response.ok) {
      const result = (await response.json().catch(() => null)) as { error?: string } | null;
      throw new RepositoryError(result?.error ?? "Não foi possível inativar o produto.");
    }
  },
  remove: async (productId: string) => {
    const response = await fetch(`/api/products?id=${encodeURIComponent(productId)}`, {
      method: "DELETE",
    });

    if (!response.ok) {
      const result = (await response.json().catch(() => null)) as { error?: string } | null;
      throw new RepositoryError(result?.error ?? "Não foi possível excluir o produto.");
    }
  },
};
