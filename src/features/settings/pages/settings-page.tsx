import { useState } from "react";
import { ProfileSettingsPanel } from "@/features/identity/components/profile-settings-panel";
import { CompanySettingsPanel } from "@/features/settings/components/company-settings-panel";
import { IntegrationsSettingsPanel } from "@/features/settings/components/integrations-settings-panel";
import { NotificationsSettingsPanel } from "@/features/settings/components/notifications-settings-panel";
import { SecuritySettingsPanel } from "@/features/settings/components/security-settings-panel";
import { SETTINGS_SECTIONS } from "@/features/settings/constants/settings";
import type { SettingsSectionId } from "@/features/settings/types";
import { PermissionsPage } from "@/features/users/pages/permissions-page";
import { UsersPage } from "@/features/users/pages/users-page";
import { PageHeader } from "@/shared/components/page-header";

export function SettingsPage() {
  const [active, setActive] = useState<SettingsSectionId>("Perfil");

  return (
    <div className="h-[calc(100vh-6rem)] overflow-hidden sm:h-[calc(100vh-7rem)] lg:h-[calc(100vh-8rem)]">
      <div className="grid h-full min-h-0 gap-6 lg:grid-cols-[240px_minmax(0,1fr)]">
        <aside className="min-w-0 lg:sticky lg:top-24 lg:self-start">
          <PageHeader
            title="Configurações"
            description="Gerencie preferências da empresa, acesso e integrações."
          />
          <nav className="flex gap-1 overflow-x-auto lg:flex-col lg:overflow-visible">
            {SETTINGS_SECTIONS.map((section) => {
              const Icon = section.icon;
              return (
                <button
                  key={section.id}
                  onClick={() => setActive(section.id)}
                  className={
                    active === section.id
                      ? "flex shrink-0 items-center gap-3 rounded-lg bg-accent px-3 py-2.5 text-sm font-medium text-foreground"
                      : "flex shrink-0 items-center gap-3 rounded-lg px-3 py-2.5 text-sm text-muted-foreground hover:bg-accent/60 hover:text-foreground"
                  }
                >
                  <Icon className="size-4" />
                  {section.id}
                </button>
              );
            })}
          </nav>
        </aside>
        <section className="min-h-0 overflow-y-auto pr-1">
          {active === "Perfil" ? (
            <ProfileSettingsPanel />
          ) : active === "Empresa" ? (
            <CompanySettingsPanel />
          ) : active === "Usuários" ? (
            <UsersPage />
          ) : active === "Permissões" ? (
            <PermissionsPage />
          ) : active === "Segurança" ? (
            <SecuritySettingsPanel />
          ) : active === "Integrações" ? (
            <IntegrationsSettingsPanel />
          ) : active === "Notificações" ? (
            <NotificationsSettingsPanel />
          ) : null}
        </section>
      </div>
    </div>
  );
}
