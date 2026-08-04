import { createFileRoute } from "@tanstack/react-router";
import { LoginPage } from "@/features/identity/pages/login-page";

export const Route = createFileRoute("/login")({
  head: () => ({
    meta: [
      { title: "Login — Automy" },
      { name: "description", content: "Acesso seguro à plataforma Automy." },
      { property: "og:title", content: "Login — Automy" },
      { property: "og:description", content: "Acesso seguro à plataforma Automy." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: LoginPage,
});
