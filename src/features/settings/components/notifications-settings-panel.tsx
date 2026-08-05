import { zodResolver } from "@hookform/resolvers/zod";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Bell, Save } from "lucide-react";
import { useEffect } from "react";
import { useForm, type UseFormRegisterReturn } from "react-hook-form";
import {
  notificationSettingsQueryOptions,
  settingsQueryKeys,
} from "@/features/settings/api/settings.queries";
import { settingsService } from "@/features/settings/services/settings.service";
import {
  notificationSettingsSchema,
  type NotificationSettingsFormValues,
} from "@/features/settings/validation";
import { EmptyState } from "@/shared/components/empty-state";
import { toast } from "@/shared/components/toast";
import {
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
} from "@/shared/components/ui";

export function NotificationsSettingsPanel() {
  const queryClient = useQueryClient();
  const { data, error, isLoading } = useQuery(notificationSettingsQueryOptions());
  const canManage = Boolean(data?.notifications.access.canManageSettings);
  const form = useForm<NotificationSettingsFormValues>({
    resolver: zodResolver(notificationSettingsSchema),
    defaultValues: {
      userPreferences: {
        inApp: true,
        email: true,
        contracts: true,
        billing: true,
        tickets: true,
        agenda: true,
        security: true,
        adminUpdates: true,
        dailySummary: false,
        weeklySummary: true,
      },
      companySettings: {
        inAppEnabled: true,
        emailEnabled: false,
        defaultSender: "",
        contractNoticeDays: 30,
        billingNoticeDays: 7,
        agendaReminderMinutes: 60,
        slaWarningHours: 24,
        criticalAlertsEnabled: true,
        quietHours: { enabled: false, start: "22:00", end: "07:00" },
        timezone: "America/Sao_Paulo",
      },
    },
  });

  useEffect(() => {
    if (!data?.notifications) return;
    form.reset({
      userPreferences: data.notifications.userPreferences,
      companySettings: data.notifications.companySettings,
    });
  }, [data?.notifications, form]);

  const onSubmit = form.handleSubmit(async (values) => {
    try {
      const companySettings = values.companySettings
        ? {
            ...values.companySettings,
            contractNoticeDays: Number(values.companySettings.contractNoticeDays),
            billingNoticeDays: Number(values.companySettings.billingNoticeDays),
            agendaReminderMinutes: Number(values.companySettings.agendaReminderMinutes),
            slaWarningHours: Number(values.companySettings.slaWarningHours),
          }
        : undefined;
      await settingsService.updateNotificationSettings({
        userPreferences: values.userPreferences,
        ...(canManage && companySettings ? { companySettings } : {}),
      });
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: settingsQueryKeys.notificationSettings }),
        queryClient.invalidateQueries({ queryKey: settingsQueryKeys.notifications }),
      ]);
      form.reset(values);
      toast.success("Notificações atualizadas.");
    } catch (error) {
      toast.danger(
        error instanceof Error ? error.message : "Não foi possível salvar notificações.",
      );
    }
  });

  if (isLoading) return <Loader />;
  if (error) {
    return (
      <Card>
        <EmptyState title="Não foi possível carregar notificações" description={error.message} />
      </Card>
    );
  }

  return (
    <form className="grid gap-6" onSubmit={onSubmit}>
      <Card>
        <CardHeader>
          <CardTitle>Preferências do usuário</CardTitle>
          <CardDescription>Canais e assuntos persistidos somente para a sua conta.</CardDescription>
        </CardHeader>
        <CardBody className="grid gap-3 sm:grid-cols-2">
          <Toggle
            label="Notificações no sistema"
            register={form.register("userPreferences.inApp")}
          />
          <Toggle label="E-mail" register={form.register("userPreferences.email")} />
          <Toggle
            label="Avisos de contratos"
            register={form.register("userPreferences.contracts")}
          />
          <Toggle label="Cobranças" register={form.register("userPreferences.billing")} />
          <Toggle label="Tickets" register={form.register("userPreferences.tickets")} />
          <Toggle label="Agenda" register={form.register("userPreferences.agenda")} />
          <Toggle
            label="Alterações de segurança"
            register={form.register("userPreferences.security")}
          />
          <Toggle
            label="Comunicados administrativos"
            register={form.register("userPreferences.adminUpdates")}
          />
          <Toggle label="Resumo diário" register={form.register("userPreferences.dailySummary")} />
          <Toggle
            label="Resumo semanal"
            register={form.register("userPreferences.weeklySummary")}
          />
        </CardBody>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Configurações da empresa</CardTitle>
          <CardDescription>Regras corporativas para notificações in-app e e-mail.</CardDescription>
        </CardHeader>
        <CardBody className="grid gap-5">
          {!canManage && (
            <div className="rounded-lg border border-border bg-muted/40 p-3 text-sm text-muted-foreground">
              Seu perfil permite visualizar estas regras, mas não alterar configurações da empresa.
            </div>
          )}
          <div className="grid gap-3 sm:grid-cols-2">
            <Toggle
              disabled={!canManage}
              label="Canal in-app habilitado"
              register={form.register("companySettings.inAppEnabled")}
            />
            <Toggle
              disabled={!canManage}
              label="Canal de e-mail habilitado"
              register={form.register("companySettings.emailEnabled")}
            />
            <Toggle
              disabled={!canManage}
              label="Alertas críticos"
              register={form.register("companySettings.criticalAlertsEnabled")}
            />
            <Toggle
              disabled={!canManage}
              label="Horários de silêncio"
              register={form.register("companySettings.quietHours.enabled")}
            />
          </div>
          <div className="grid gap-5 md:grid-cols-3">
            <Field label="Remetente padrão">
              <Input disabled={!canManage} {...form.register("companySettings.defaultSender")} />
            </Field>
            <Field label="Contratos a vencer">
              <Input
                disabled={!canManage}
                type="number"
                {...form.register("companySettings.contractNoticeDays")}
              />
            </Field>
            <Field label="Cobranças">
              <Input
                disabled={!canManage}
                type="number"
                {...form.register("companySettings.billingNoticeDays")}
              />
            </Field>
            <Field label="Lembrete de agenda">
              <Input
                disabled={!canManage}
                type="number"
                {...form.register("companySettings.agendaReminderMinutes")}
              />
            </Field>
            <Field label="Aviso de SLA">
              <Input
                disabled={!canManage}
                type="number"
                {...form.register("companySettings.slaWarningHours")}
              />
            </Field>
            <Field label="Timezone dos envios">
              <Input disabled={!canManage} {...form.register("companySettings.timezone")} />
            </Field>
            <Field label="Início do silêncio">
              <Input
                disabled={!canManage}
                type="time"
                {...form.register("companySettings.quietHours.start")}
              />
            </Field>
            <Field label="Fim do silêncio">
              <Input
                disabled={!canManage}
                type="time"
                {...form.register("companySettings.quietHours.end")}
              />
            </Field>
          </div>
          <div className="flex items-start gap-3 rounded-lg border border-border bg-muted/40 p-3 text-sm text-muted-foreground">
            <Bell className="mt-0.5 size-4 shrink-0" />O canal de e-mail salva preferências reais,
            mas depende da configuração do provider transacional.
          </div>
        </CardBody>
      </Card>

      <div className="flex justify-end">
        <Button
          type="submit"
          loading={form.formState.isSubmitting}
          disabled={!form.formState.isDirty}
        >
          <Save className="size-4" />
          Salvar notificações
        </Button>
      </div>
    </form>
  );
}

function Toggle({
  disabled,
  label,
  register,
}: {
  disabled?: boolean;
  label: string;
  register: UseFormRegisterReturn;
}) {
  return (
    <label className="flex items-center gap-3 rounded-lg border border-border p-3 text-sm">
      <Checkbox disabled={disabled} {...register} />
      {label}
    </label>
  );
}
