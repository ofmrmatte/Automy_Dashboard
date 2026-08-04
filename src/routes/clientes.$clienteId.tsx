import { createFileRoute } from "@tanstack/react-router";
import { ClientDetailPage } from "@/features/clients/pages/client-detail-page";

export const Route = createFileRoute("/clientes/$clienteId")({
  head: () => ({
    meta: [
      { title: "Detalhes do cliente — Automy" },
      { name: "description", content: "Visão completa do cliente." },
      { property: "og:title", content: "Detalhes do cliente — Automy" },
      { property: "og:description", content: "Visão completa do cliente." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: ClientDetail,
});

function ClientDetail() {
  const { clienteId } = Route.useParams();
  return <ClientDetailPage clientId={clienteId} />;
}
