import { createFileRoute } from "@tanstack/react-router";
import { ProductsPage } from "@/features/products/pages/products-page";

export const Route = createFileRoute("/produtos")({
  head: () => ({
    meta: [
      { title: "Produtos — Automy" },
      { name: "description", content: "Portfólio de produtos Automy." },
      { property: "og:title", content: "Produtos — Automy" },
      { property: "og:description", content: "Portfólio de produtos Automy." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Products,
});

function Products() {
  return <ProductsPage />;
}
