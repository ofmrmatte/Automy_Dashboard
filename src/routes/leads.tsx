import { createFileRoute } from "@tanstack/react-router";
import { LeadsPage } from "@/features/leads/pages/leads-page";

export const Route = createFileRoute("/leads")({
  head: () => ({
    meta: [
      { title: "Leads — Automy" },
      { name: "description", content: "CRM de leads recebidos pela Automy." },
      { property: "og:title", content: "Leads — Automy" },
      { property: "og:description", content: "CRM de leads recebidos pela Automy." },
    ],
  }),
  component: LeadsPage,
});
