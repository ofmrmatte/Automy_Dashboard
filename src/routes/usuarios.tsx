import { createFileRoute } from "@tanstack/react-router";
import { UsersPage } from "@/features/users/pages/users-page";

export const Route = createFileRoute("/usuarios")({
  head: () => ({
    meta: [
      { title: "Usuários — Automy" },
      { name: "description", content: "Gestão de usuários e acessos da Automy." },
      { property: "og:title", content: "Usuários — Automy" },
      { property: "og:description", content: "Gestão de usuários e acessos da Automy." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: UsersPage,
});
