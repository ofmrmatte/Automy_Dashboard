import { createFileRoute } from "@tanstack/react-router";
import { ContractsPage } from "@/features/contracts/pages/contracts-page";

export const Route = createFileRoute("/contratos")({
  head: () => ({
    meta: [
      { title: "Contratos — Automy" },
      { name: "description", content: "Gestão de contratos e renovações." },
      { property: "og:title", content: "Contratos — Automy" },
      { property: "og:description", content: "Gestão de contratos e renovações." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Contracts,
});

function Contracts() {
  return <ContractsPage />;
}
