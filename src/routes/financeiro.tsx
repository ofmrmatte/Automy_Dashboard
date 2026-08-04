import { createFileRoute } from "@tanstack/react-router";
import { FinancePage } from "@/features/finance/pages/finance-page";

export const Route = createFileRoute("/financeiro")({
  head: () => ({
    meta: [
      { title: "Financeiro — Automy" },
      { name: "description", content: "Receitas e cobranças da Automy." },
      { property: "og:title", content: "Financeiro — Automy" },
      { property: "og:description", content: "Receitas e cobranças da Automy." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Finance,
});

function Finance() {
  return <FinancePage />;
}
