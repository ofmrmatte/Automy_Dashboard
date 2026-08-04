import { useState } from "react";
import { ProfileSettingsPanel } from "@/features/identity/components/profile-settings-panel";
import { SETTINGS_SECTIONS } from "@/features/settings/constants/settings";
import type { SettingsSectionId } from "@/features/settings/types";
import { EmptyState } from "@/shared/components/empty-state";
import { PageHeader } from "@/shared/components/page-header";
import { Card } from "@/shared/components/ui";

export function SettingsPage() {
  const [active, setActive] = useState<SettingsSectionId>("Perfil");

  return (
    <div>
      <PageHeader
        title="Configurações"
        description="Gerencie preferências da empresa, acesso e integrações."
      />
      <div className="grid gap-6 lg:grid-cols-[220px_minmax(0,1fr)]">
        <nav className="flex gap-1 overflow-x-auto lg:flex-col">
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
        {active === "Perfil" ? (
          <ProfileSettingsPanel />
        ) : (
          <Card>
            <EmptyState
              title={`${active} sem configuração ativa`}
              description="Esta área será conectada quando as regras reais do módulo forem implementadas."
            />
          </Card>
        )}
      </div>
    </div>
  );
}
