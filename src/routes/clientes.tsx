import { createFileRoute } from "@tanstack/react-router";
import { ClientsPage } from "@/features/clients/pages/clients-page";

export const Route = createFileRoute("/clientes")({
  head: () => ({
    meta: [
      { title: "Clientes — Automy" },
      { name: "description", content: "Gestão da carteira de clientes Automy." },
      { property: "og:title", content: "Clientes — Automy" },
      { property: "og:description", content: "Gestão da carteira de clientes Automy." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: ClientsPage,
});
