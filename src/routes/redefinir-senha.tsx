import { createFileRoute } from "@tanstack/react-router";
import { ResetPasswordPage } from "@/features/identity/pages/reset-password-page";

export const Route = createFileRoute("/redefinir-senha")({
  head: () => ({
    meta: [
      { title: "Redefinir senha — Automy" },
      { name: "description", content: "Redefinição segura de senha da Automy." },
      { property: "og:title", content: "Redefinir senha — Automy" },
      { property: "og:description", content: "Redefinição segura de senha da Automy." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: ResetPasswordPage,
});
