import { createFileRoute } from "@tanstack/react-router";
import { PermissionsPage } from "@/features/users/pages/permissions-page";

export const Route = createFileRoute("/permissoes")({
  head: () => ({
    meta: [
      { title: "Permissões — Automy" },
      { name: "description", content: "Matriz de permissões e RBAC da Automy." },
      { property: "og:title", content: "Permissões — Automy" },
      { property: "og:description", content: "Matriz de permissões e RBAC da Automy." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: PermissionsPage,
});
