import { productRepository } from "@/features/products/repositories/product.repository";
import type { Product, ProductFilter } from "@/features/products/types";
import { normalizeSearch } from "@/shared/utils/formatters";

export const productService = {
  listProducts: () => productRepository.list(),
  createProduct: (payload: Parameters<typeof productRepository.create>[0]) =>
    productRepository.create(payload),
  updateProduct: (payload: Parameters<typeof productRepository.update>[0]) =>
    productRepository.update(payload),
  activateProduct: (productId: string) => productRepository.activate(productId),
  inactivateProduct: (productId: string) => productRepository.inactivate(productId),
  pauseProduct: (productId: string) => productRepository.pause(productId),
  removeProduct: (productId: string) => productRepository.remove(productId),
  filterProducts: (products: Product[], filter: ProductFilter) => {
    const term = normalizeSearch(filter.search);
    return products.filter((product) => {
      const matchesSearch = [
        product.name,
        product.description,
        product.category,
        product.version,
        product.billingMode,
        product.notes,
      ].some((value) => normalizeSearch(value ?? "").includes(term));
      const matchesStatus = filter.status === "Todos" || product.status === filter.status;
      const matchesCategory = filter.category === "Todas" || product.category === filter.category;

      return matchesSearch && matchesStatus && matchesCategory;
    });
  },
};
