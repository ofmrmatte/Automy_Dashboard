import { createFileRoute } from "@tanstack/react-router";
import { SupportPage } from "@/features/support/pages/support-page";

export const Route = createFileRoute("/suporte")({
  head: () => ({
    meta: [
      { title: "Suporte — Automy" },
      { name: "description", content: "Central de tickets de suporte." },
      { property: "og:title", content: "Suporte — Automy" },
      { property: "og:description", content: "Central de tickets de suporte." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Support,
});

function Support() {
  return <SupportPage />;
}
