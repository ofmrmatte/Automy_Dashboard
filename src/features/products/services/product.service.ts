import { productRepository } from "@/features/products/repositories/product.repository";
import type { Product, ProductFilter } from "@/features/products/types";
import { normalizeSearch } from "@/shared/utils/formatters";

export const productService = {
  listProducts: () => productRepository.list(),
  createProduct: (payload: Parameters<typeof productRepository.create>[0]) =>
    productRepository.create(payload),
  updateProduct: (payload: Parameters<typeof productRepository.update>[0]) =>
    productRepository.update(payload),
  pauseProduct: (productId: string) => productRepository.pause(productId),
  removeProduct: (productId: string) => productRepository.remove(productId),
  filterProducts: (products: Product[], filter: ProductFilter) => {
    const term = normalizeSearch(filter.search);
    return products.filter((product) => normalizeSearch(product.name).includes(term));
  },
};
