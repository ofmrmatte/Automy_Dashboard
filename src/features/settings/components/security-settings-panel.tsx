import { zodResolver } from "@hookform/resolvers/zod";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { KeyRound, Monitor, Save, ShieldCheck } from "lucide-react";
import { useEffect } from "react";
import { useForm } from "react-hook-form";
import {
  securitySettingsQueryOptions,
  settingsQueryKeys,
} from "@/features/settings/api/settings.queries";
import { settingsService } from "@/features/settings/services/settings.service";
import {
  securitySettingsSchema,
  type SecuritySettingsFormValues,
} from "@/features/settings/validation";
import { FormError } from "@/features/identity/components/form-error";
import { useIdentity } from "@/features/identity/context/identity-context";
import {
  passwordChangeSchema,
  type PasswordChangeFormValues,
} from "@/features/identity/validation";
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
  Checkbox,
  Field,
  Input,
  Loader,
  Select,
} from "@/shared/components/ui";
import { formatDateTime } from "@/shared/utils/regional-formatters";

export function SecuritySettingsPanel() {
  const queryClient = useQueryClient();
  const {
    identitySessions,
    preferences,
    refreshSessions,
    revokeOtherSessions,
    revokeSession,
    updatePassword,
  } = useIdentity();
  const { data, error, isLoading } = useQuery(securitySettingsQueryOptions());
  const canManage = Boolean(data?.security.access.canManageSettings);
  const regional = {
    locale: preferences?.language,
    timeZone: preferences?.timeZone,
    currency: preferences?.currency,
    timeFormat: preferences?.timeFormat,
  };

  const passwordForm = useForm<PasswordChangeFormValues>({
    resolver: zodResolver(passwordChangeSchema),
    defaultValues: {
      currentPassword: "",
      password: "",
      confirmPassword: "",
      revokeOtherSessions: true,
    },
  });
  const policyForm = useForm<SecuritySettingsFormValues>({
    resolver: zodResolver(securitySettingsSchema),
    defaultValues: {
      sessionDurationDays: 30,
      requirePasswordChangeOnFirstLogin: false,
      minPasswordLength: 8,
      lockoutAttempts: 5,
      lockoutDurationMinutes: 15,
      allowMultipleSessions: true,
      requireEmailVerified: false,
    },
  });

  useEffect(() => {
    if (!data?.security.policy) return;
    policyForm.reset(data.security.policy);
  }, [data?.security.policy, policyForm]);

  const onPasswordSubmit = passwordForm.handleSubmit(async (values) => {
    try {
      await updatePassword({
        currentPassword: values["currentPassword"],
        password: values["password"],
        confirmPassword: values["confirmPassword"],
        revokeOtherSessions: values["revokeOtherSessions"],
      });
      passwordForm.reset();
      toast.success("Senha alterada.");
    } catch (error) {
      toast.danger(error instanceof Error ? error.message : "Não foi possível alterar a senha.");
    }
  });

  const onPolicySubmit = policyForm.handleSubmit(async (values) => {
    try {
      await settingsService.updateSecurity({
        ...values,
        sessionDurationDays: Number(values.sessionDurationDays),
        minPasswordLength: Number(values.minPasswordLength),
        lockoutAttempts: Number(values.lockoutAttempts),
        lockoutDurationMinutes: Number(values.lockoutDurationMinutes),
      });
      await queryClient.invalidateQueries({ queryKey: settingsQueryKeys.security });
      policyForm.reset(values);
      toast.success("Política de segurança atualizada.");
    } catch (error) {
      toast.danger(error instanceof Error ? error.message : "Não foi possível salvar segurança.");
    }
  });

  async function handleRevoke(sessionId: string, current: boolean) {
    if (current && !window.confirm("Revogar a sessão atual vai encerrar seu acesso. Continuar?")) {
      return;
    }
    await revokeSession(sessionId);
    toast.success("Sessão revogada.");
  }

  if (isLoading) return <Loader />;
  if (error) {
    return (
      <Card>
        <EmptyState title="Não foi possível carregar segurança" description={error.message} />
      </Card>
    );
  }

  return (
    <div className="grid gap-6">
      <Card>
        <CardHeader>
          <CardTitle>Minha senha</CardTitle>
          <CardDescription>Altere sua senha usando o provedor oficial Better Auth.</CardDescription>
        </CardHeader>
        <CardBody>
          <form className="grid max-w-3xl gap-5" onSubmit={onPasswordSubmit}>
            <Field label="Senha atual">
              <Input
                type="password"
                autoComplete="current-password"
                {...passwordForm.register("currentPassword")}
              />
              <FormError message={passwordForm.formState.errors.currentPassword?.message} />
            </Field>
            <div className="grid gap-5 sm:grid-cols-2">
              <Field label="Nova senha">
                <Input
                  type="password"
                  autoComplete="new-password"
                  {...passwordForm.register("password")}
                />
                <FormError message={passwordForm.formState.errors.password?.message} />
              </Field>
              <Field label="Confirmar nova senha">
                <Input
                  type="password"
                  autoComplete="new-password"
                  {...passwordForm.register("confirmPassword")}
                />
                <FormError message={passwordForm.formState.errors.confirmPassword?.message} />
              </Field>
            </div>
            <label className="flex items-center gap-3 text-sm">
              <Checkbox {...passwordForm.register("revokeOtherSessions")} />
              Encerrar outras sessões após alterar a senha
            </label>
            <div>
              <Button type="submit" loading={passwordForm.formState.isSubmitting}>
                <KeyRound className="size-4" />
                Alterar senha
              </Button>
            </div>
          </form>
        </CardBody>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Sessões</CardTitle>
          <CardDescription>Revogue acessos ativos conectados à sua conta.</CardDescription>
        </CardHeader>
        <CardBody className="grid gap-4">
          {identitySessions.length === 0 ? (
            <EmptyState title="Nenhuma sessão ativa encontrada" />
          ) : (
            identitySessions.map((identitySession) => (
              <div
                key={identitySession.id}
                className="grid gap-3 rounded-lg border border-border p-4 sm:grid-cols-[auto_minmax(0,1fr)_auto]"
              >
                <div className="grid size-10 place-items-center rounded-lg bg-accent">
                  <Monitor className="size-5" />
                </div>
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-medium">
                      {identitySession.browser} em {identitySession.operatingSystem}
                    </span>
                    {identitySession.current && <Badge variant="success">Sessão atual</Badge>}
                  </div>
                  <div className="mt-1 text-sm text-muted-foreground">
                    {identitySession.device} · IP{" "}
                    {identitySession.maskedIpAddress ?? "não informado"}
                  </div>
                  <div className="mt-1 text-xs text-muted-foreground">
                    Criada em {formatDateTime(identitySession.createdAt, regional)} · Última
                    atividade {formatDateTime(identitySession.updatedAt, regional)}
                  </div>
                </div>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => handleRevoke(identitySession.id, identitySession.current)}
                >
                  Revogar
                </Button>
              </div>
            ))
          )}
          <div className="flex flex-wrap gap-2">
            <Button type="button" variant="ghost" onClick={() => refreshSessions()}>
              Atualizar sessões
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() =>
                revokeOtherSessions().then(() => toast.success("Outras sessões encerradas."))
              }
            >
              Encerrar outras sessões
            </Button>
          </div>
        </CardBody>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Histórico de acesso</CardTitle>
          <CardDescription>
            Eventos reais registrados para acesso à conta e à empresa.
          </CardDescription>
        </CardHeader>
        <CardBody className="grid gap-3">
          {data?.security.loginHistory.length ? (
            data.security.loginHistory.map((record) => (
              <div
                key={record.id}
                className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-border p-3 text-sm"
              >
                <div>
                  <div className="font-medium">
                    {record.success ? "Acesso bem-sucedido" : "Falha de acesso"}
                  </div>
                  <div className="text-muted-foreground">
                    {formatDateTime(record.createdAt, regional)} · IP{" "}
                    {record.maskedIpAddress ?? "não informado"}
                  </div>
                </div>
                <Badge variant={record.success ? "success" : "danger"}>
                  {record.success ? "Sucesso" : "Falha"}
                </Badge>
              </div>
            ))
          ) : (
            <EmptyState
              title="Nenhum evento de acesso registrado"
              description="Novos eventos serão exibidos quando o backend registrar histórico de autenticação."
            />
          )}
        </CardBody>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Política da empresa</CardTitle>
          <CardDescription>
            Regras corporativas persistidas para os fluxos de autenticação.
          </CardDescription>
        </CardHeader>
        <CardBody>
          <form className="grid max-w-4xl gap-5" onSubmit={onPolicySubmit}>
            {!canManage && (
              <div className="rounded-lg border border-border bg-muted/40 p-3 text-sm text-muted-foreground">
                Seu perfil permite visualizar a política, mas não alterar regras da empresa.
              </div>
            )}
            <div className="grid gap-5 md:grid-cols-3">
              <Field label="Duração de sessão">
                <Input
                  disabled={!canManage}
                  type="number"
                  {...policyForm.register("sessionDurationDays")}
                />
              </Field>
              <Field label="Comprimento mínimo de senha">
                <Input
                  disabled={!canManage}
                  type="number"
                  {...policyForm.register("minPasswordLength")}
                />
              </Field>
              <Field label="Bloqueio após tentativas">
                <Input
                  disabled={!canManage}
                  type="number"
                  {...policyForm.register("lockoutAttempts")}
                />
              </Field>
              <Field label="Duração do bloqueio">
                <Input
                  disabled={!canManage}
                  type="number"
                  {...policyForm.register("lockoutDurationMinutes")}
                />
              </Field>
              <Field label="MFA">
                <Select disabled value={data?.security.policy.mfaStatus ?? "not_configured"}>
                  <option value="not_configured">Não configurado</option>
                  <option value="prepared">Preparado</option>
                  <option value="enabled">Ativo</option>
                </Select>
              </Field>
            </div>
            <div className="grid gap-3">
              <label className="flex items-center gap-3 text-sm">
                <Checkbox
                  disabled={!canManage}
                  {...policyForm.register("requirePasswordChangeOnFirstLogin")}
                />
                Exigir troca de senha no primeiro acesso
              </label>
              <label className="flex items-center gap-3 text-sm">
                <Checkbox disabled={!canManage} {...policyForm.register("allowMultipleSessions")} />
                Permitir múltiplas sessões
              </label>
              <label className="flex items-center gap-3 text-sm">
                <Checkbox disabled={!canManage} {...policyForm.register("requireEmailVerified")} />
                Exigir e-mail verificado quando o envio transacional estiver configurado
              </label>
            </div>
            {canManage && (
              <div>
                <Button
                  type="submit"
                  loading={policyForm.formState.isSubmitting}
                  disabled={!policyForm.formState.isDirty}
                >
                  <Save className="size-4" />
                  Salvar política
                </Button>
              </div>
            )}
            <div className="flex items-start gap-3 rounded-lg border border-border bg-muted/40 p-3 text-sm text-muted-foreground">
              <ShieldCheck className="mt-0.5 size-4 shrink-0" />
              MFA e envio de e-mail estão preparados, mas permanecem dependentes de provider externo
              configurado.
            </div>
          </form>
        </CardBody>
      </Card>
    </div>
  );
}
