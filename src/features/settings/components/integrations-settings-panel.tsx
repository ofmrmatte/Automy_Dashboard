import { zodResolver } from "@hookform/resolvers/zod";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Cable, CheckCircle2, Mail, Save, ShieldAlert, Zap } from "lucide-react";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import {
  integrationsSettingsQueryOptions,
  settingsQueryKeys,
} from "@/features/settings/api/settings.queries";
import { settingsService } from "@/features/settings/services/settings.service";
import type { CompanyIntegration } from "@/features/settings/types";
import {
  integrationUpdateSchema,
  type IntegrationUpdateFormValues,
} from "@/features/settings/validation";
import { FormError } from "@/features/identity/components/form-error";
import { EmptyState } from "@/shared/components/empty-state";
import { toast } from "@/shared/components/toast";
import {
  Badge,
  Button,
  Card,
  CardBody,
  CardDescription,
  CardHeader,
  CardTitle,
  Field,
  Input,
  Loader,
  Select,
} from "@/shared/components/ui";
import { formatDateTime } from "@/shared/utils/regional-formatters";

function statusVariant(status: CompanyIntegration["status"]) {
  if (status === "connected") return "success";
  if (status === "error") return "danger";
  if (status === "pending") return "warning";
  return "inactive";
}

export function IntegrationsSettingsPanel() {
  const { data, error, isLoading } = useQuery(integrationsSettingsQueryOptions());

  if (isLoading) return <Loader />;
  if (error) {
    return (
      <Card>
        <EmptyState title="Não foi possível carregar integrações" description={error.message} />
      </Card>
    );
  }

  return (
    <div className="grid gap-6">
      <div>
        <h2 className="text-lg font-semibold text-foreground">Integrações</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Status real dos providers oficiais, sem expor tokens ou secrets no frontend.
        </p>
      </div>
      <div className="grid gap-4 xl:grid-cols-2">
        {(data?.integrations ?? []).map((integration) => (
          <IntegrationCard
            key={integration.provider}
            integration={integration}
            canManage={Boolean(data?.access.canManageSettings)}
          />
        ))}
      </div>
    </div>
  );
}

function IntegrationCard({
  integration,
  canManage,
}: {
  integration: CompanyIntegration;
  canManage: boolean;
}) {
  const queryClient = useQueryClient();
  const [testing, setTesting] = useState(false);
  const [sendingTestEmail, setSendingTestEmail] = useState(false);
  const form = useForm<IntegrationUpdateFormValues>({
    resolver: zodResolver(integrationUpdateSchema),
    defaultValues: {
      status: integration.status,
      environment: integration.environment,
      publicConfig: normalizePublicConfig(integration.publicConfig),
    },
  });

  useEffect(() => {
    form.reset({
      status: integration.status,
      environment: integration.environment,
      publicConfig: normalizePublicConfig(integration.publicConfig),
    });
  }, [form, integration]);

  const canEdit = canManage && integration.editable;
  const onSubmit = form.handleSubmit(async (values) => {
    try {
      await settingsService.updateIntegration(integration.provider, values);
      await queryClient.invalidateQueries({ queryKey: settingsQueryKeys.integrations });
      form.reset(values);
      toast.success("Integração atualizada.");
    } catch (error) {
      toast.danger(error instanceof Error ? error.message : "Não foi possível salvar integração.");
    }
  });

  async function testIntegration() {
    try {
      setTesting(true);
      const { result } = await settingsService.testIntegration(integration.provider);
      await queryClient.invalidateQueries({ queryKey: settingsQueryKeys.integrations });
      if (result.status === "connected") toast.success(result.message);
      else toast.warning(result.message);
    } catch (error) {
      toast.danger(error instanceof Error ? error.message : "Não foi possível testar integração.");
    } finally {
      setTesting(false);
    }
  }

  async function sendTestEmail() {
    try {
      setSendingTestEmail(true);
      const { result } = await settingsService.sendIntegrationTestEmail(integration.provider);
      await queryClient.invalidateQueries({ queryKey: settingsQueryKeys.integrations });
      if (result.status === "connected") toast.success(result.message);
      else toast.warning(result.message);
    } catch (error) {
      toast.danger(error instanceof Error ? error.message : "Não foi possível enviar teste.");
    } finally {
      setSendingTestEmail(false);
    }
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-start justify-between gap-4">
        <div>
          <CardTitle className="flex items-center gap-2">
            <Cable className="size-4 text-muted-foreground" />
            {integration.name}
          </CardTitle>
          <CardDescription>
            {integration.type} · {integration.environment}
          </CardDescription>
        </div>
        <Badge variant={statusVariant(integration.status)}>
          {settingsService.integrationStatusLabel(integration.status)}
        </Badge>
      </CardHeader>
      <CardBody>
        <form className="grid gap-4" onSubmit={onSubmit}>
          <div className="grid gap-4 md:grid-cols-2">
            <Field label="Status">
              <Select disabled={!canEdit} {...form.register("status")}>
                <option value="connected">Conectado</option>
                <option value="disconnected">Desconectado</option>
                <option value="not_configured">Não configurado</option>
                <option value="pending">Pendente</option>
                <option value="error">Erro</option>
              </Select>
            </Field>
            <Field label="Ambiente">
              <Input disabled={!canEdit} {...form.register("environment")} />
              <FormError message={form.formState.errors.environment?.message} />
            </Field>
          </div>

          <div className="grid gap-3 rounded-lg border border-border bg-muted/30 p-3 text-sm">
            <div className="font-medium text-foreground">Metadados seguros</div>
            {Object.entries(integration.maskedConfig).map(([key, value]) => (
              <div key={key} className="flex justify-between gap-3 text-muted-foreground">
                <span>{key}</span>
                <span className="font-medium text-foreground">{value}</span>
              </div>
            ))}
            {Object.entries(integration.publicConfig).map(([key, value]) => (
              <div key={key} className="flex justify-between gap-3 text-muted-foreground">
                <span>{key}</span>
                <span className="truncate font-medium text-foreground">
                  {String(value || "Não informado")}
                </span>
              </div>
            ))}
          </div>

          {canEdit && (
            <div className="grid gap-4 md:grid-cols-2">
              <Field label="Identificação pública">
                <Input {...form.register("publicConfig.identifier")} />
              </Field>
              <Field label="URL pública ou domínio">
                <Input {...form.register("publicConfig.publicUrl")} />
              </Field>
            </div>
          )}

          {integration.lastCheckedAt && (
            <div className="text-xs text-muted-foreground">
              Última verificação: {formatDateTime(integration.lastCheckedAt)}
              {integration.lastError ? ` · ${integration.lastError}` : ""}
            </div>
          )}

          <div className="flex flex-wrap gap-2">
            {canEdit && (
              <Button
                type="submit"
                loading={form.formState.isSubmitting}
                disabled={!form.formState.isDirty}
              >
                <Save className="size-4" />
                Salvar
              </Button>
            )}
            {canManage && (
              <Button type="button" variant="outline" loading={testing} onClick={testIntegration}>
                <Zap className="size-4" />
                Testar conexão
              </Button>
            )}
            {canManage && integration.provider === "transactional_email" && (
              <Button
                type="button"
                variant="outline"
                loading={sendingTestEmail}
                onClick={sendTestEmail}
              >
                <Mail className="size-4" />
                Enviar e-mail de teste
              </Button>
            )}
          </div>

          {!integration.editable && (
            <div className="flex items-start gap-3 rounded-lg border border-border bg-muted/30 p-3 text-sm text-muted-foreground">
              {integration.status === "connected" ? (
                <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-success" />
              ) : (
                <ShieldAlert className="mt-0.5 size-4 shrink-0 text-warning" />
              )}
              Esta integração é gerenciada por variáveis de ambiente e nunca retorna secrets ao
              navegador.
            </div>
          )}
        </form>
      </CardBody>
    </Card>
  );
}

function normalizePublicConfig(value: Record<string, unknown>) {
  return Object.fromEntries(
    Object.entries({
      identifier: "",
      publicUrl: "",
      ...value,
    }).map(([key, item]) => [key, typeof item === "string" ? item : String(item ?? "")]),
  );
}
