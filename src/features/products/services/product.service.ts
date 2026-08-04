import { productRepository } from "@/features/products/repositories/product.repository";
import type { Product, ProductFilter } from "@/features/products/types";
import { normalizeSearch } from "@/shared/utils/formatters";

export const productService = {
  getProductsSnapshot: () => productRepository.listSnapshot(),
  listProducts: () => productRepository.list(),
  filterProducts: (products: Product[], filter: ProductFilter) => {
    const term = normalizeSearch(filter.search);
    return products.filter((product) => normalizeSearch(product.name).includes(term));
  },
};
