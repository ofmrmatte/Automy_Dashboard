import { Bell, Building2, Cable, LockKeyhole, ShieldCheck, User, Users } from "lucide-react";
import type { SettingsSection } from "@/features/settings/types";

export const SETTINGS_SECTIONS: SettingsSection[] = [
  { id: "Perfil", icon: User },
  { id: "Empresa", icon: Building2 },
  { id: "Usuários", icon: Users },
  { id: "Permissões", icon: ShieldCheck },
  { id: "Segurança", icon: LockKeyhole },
  { id: "Integrações", icon: Cable },
  { id: "Notificações", icon: Bell },
];
