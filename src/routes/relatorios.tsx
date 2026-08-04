import { createFileRoute } from "@tanstack/react-router";
import { ReportsPage } from "@/features/reports/pages/reports-page";

export const Route = createFileRoute("/relatorios")({
  head: () => ({
    meta: [
      { title: "Relatórios — Automy" },
      { name: "description", content: "Relatórios operacionais da Automy." },
      { property: "og:title", content: "Relatórios — Automy" },
      { property: "og:description", content: "Relatórios operacionais da Automy." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Reports,
});

function Reports() {
  return <ReportsPage />;
}
