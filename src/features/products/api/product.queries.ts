import { queryOptions } from "@tanstack/react-query";
import { productService } from "@/features/products/services/product.service";

export const productQueryKeys = {
  all: ["products"] as const,
};

export function productsQueryOptions() {
  return queryOptions({
    queryKey: productQueryKeys.all,
    queryFn: () => productService.listProducts(),
    enabled: typeof window !== "undefined",
  });
}
