import { createFileRoute } from "@tanstack/react-router";
import { SettingsPage } from "@/features/settings/pages/settings-page";

export const Route = createFileRoute("/configuracoes")({
  head: () => ({
    meta: [
      { title: "Configurações — Automy" },
      { name: "description", content: "Preferências e configurações da Automy." },
      { property: "og:title", content: "Configurações — Automy" },
      { property: "og:description", content: "Preferências e configurações da Automy." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: SettingsPage,
});
