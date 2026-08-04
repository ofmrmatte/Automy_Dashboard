import { Save } from "lucide-react";
import { useState } from "react";
import { SETTINGS_SECTIONS, SETTINGS_TOGGLE_LABELS } from "@/features/settings/constants/settings";
import type { SettingsSectionId } from "@/features/settings/types";
import { PageHeader } from "@/shared/components/page-header";
import { Button, Card, Checkbox, Field, Input, Select } from "@/shared/components/ui";

export function SettingsPage() {
  const [active, setActive] = useState<SettingsSectionId>("Empresa");
  const [saved, setSaved] = useState(false);

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
                onClick={() => {
                  setActive(section.id);
                  setSaved(false);
                }}
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
        <Card className="p-6">
          <div className="border-b border-border pb-5">
            <h2 className="font-semibold">{active}</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Configure as preferências de {active.toLowerCase()} da organização.
            </p>
          </div>
          {active === "Empresa" || active === "Perfil" ? (
            <form
              className="mt-6 grid max-w-2xl gap-5"
              onSubmit={(event) => {
                event.preventDefault();
                setSaved(true);
              }}
            >
              <div className="grid gap-5 sm:grid-cols-2">
                <Field label={active === "Empresa" ? "Razão social" : "Nome completo"}>
                  <Input />
                </Field>
                <Field label={active === "Empresa" ? "CNPJ" : "E-mail"}>
                  <Input />
                </Field>
              </div>
              <Field label="Fuso horário">
                <Select>
                  <option>América/São Paulo (UTC-3)</option>
                  <option>UTC</option>
                </Select>
              </Field>
              <div className="flex items-center gap-3">
                <Button>
                  <Save className="size-4" />
                  Salvar alterações
                </Button>
                {saved && <span className="text-sm text-success">Alterações salvas.</span>}
              </div>
            </form>
          ) : (
            <div className="mt-6 space-y-3">
              {SETTINGS_TOGGLE_LABELS.map((item) => (
                <label
                  key={item}
                  className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-4 rounded-lg border border-border p-4"
                >
                  <div>
                    <div className="text-sm font-medium">{item}</div>
                    <div className="text-xs text-muted-foreground">
                      Controle esta preferência para todos os usuários.
                    </div>
                  </div>
                  <Checkbox />
                </label>
              ))}
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}
