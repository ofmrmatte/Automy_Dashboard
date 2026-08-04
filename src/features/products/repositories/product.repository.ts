import type { Product, ProductStatus } from "@/features/products/types";
import type { Database } from "@/shared/types/database";
import { RepositoryError } from "@/shared/api/errors";
import { getSupabaseClient } from "@/shared/lib/supabase/client";

type ProductRow = Database["public"]["Tables"]["products"]["Row"];

function mapProductStatus(status: string): ProductStatus {
  if (status === "active" || status === "Ativo") return "Ativo";
  if (status === "beta" || status === "Beta") return "Beta";
  return "Descontinuando";
}

function mapProduct(row: ProductRow): Product {
  return {
    id: row.id,
    name: row.name,
    category: row.category ?? "",
    version: row.version ?? "",
    clients: 0,
    status: mapProductStatus(row.status),
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    deletedAt: row.deleted_at,
    createdBy: row.created_by,
    updatedBy: row.updated_by,
  };
}

export const productRepository = {
  list: async () => {
    const supabase = getSupabaseClient();
    if (!supabase) return [];

    const { data, error } = await supabase
      .from("products")
      .select("*")
      .is("deleted_at", null)
      .order("created_at", { ascending: false });

    if (error) {
      throw new RepositoryError("Não foi possível carregar produtos.", { cause: error });
    }

    return (data ?? []).map(mapProduct);
  },
};
