import { createFileRoute } from "@tanstack/react-router";
import { DashboardPage } from "@/features/dashboard/pages/dashboard-page";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Dashboard — Automy" },
      { name: "description", content: "Visão executiva da operação Automy." },
      { property: "og:title", content: "Dashboard — Automy" },
      { property: "og:description", content: "Visão executiva da operação Automy." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: DashboardPage,
});
