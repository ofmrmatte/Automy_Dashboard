import { productsMock } from "@/features/products/mocks/products.mock";

export const productRepository = {
  listSnapshot: () => productsMock,
  list: async () => productsMock,
};
