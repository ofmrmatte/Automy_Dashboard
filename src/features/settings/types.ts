import type { LucideIcon } from "lucide-react";

export type SettingsSectionId =
  "Empresa" | "Usuários" | "Permissões" | "Segurança" | "Integrações" | "Notificações" | "Perfil";

export type SettingsSection = {
  id: SettingsSectionId;
  icon: LucideIcon;
};
