import { createFileRoute } from "@tanstack/react-router";

import { LandingPage } from "@/features/marketing/pages/landing-page";

const TITLE = "Automy — ERP para logística e transportadoras";
const DESCRIPTION =
  "Clientes, contratos, produtos, financeiro, suporte e relatórios integrados em uma única plataforma para transportadoras.";

export const Route = createFileRoute("/solucoes")({
  head: () => ({
    meta: [
      { title: TITLE },
      { name: "description", content: DESCRIPTION },
      { property: "og:title", content: TITLE },
      { property: "og:description", content: DESCRIPTION },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: LandingPage,
});
