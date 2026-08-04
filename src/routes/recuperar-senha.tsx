import { createFileRoute } from "@tanstack/react-router";
import { PasswordRecoveryPage } from "@/features/identity/pages/password-recovery-page";

export const Route = createFileRoute("/recuperar-senha")({
  head: () => ({
    meta: [
      { title: "Recuperar senha — Automy" },
      { name: "description", content: "Recuperação de senha da Automy." },
      { property: "og:title", content: "Recuperar senha — Automy" },
      { property: "og:description", content: "Recuperação de senha da Automy." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: PasswordRecoveryPage,
});
