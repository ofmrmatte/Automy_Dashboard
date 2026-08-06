import { zodResolver } from "@hookform/resolvers/zod";
import {
  Camera,
  KeyRound,
  Monitor,
  Save,
  ShieldCheck,
  Smartphone,
  Trash2,
  UserCircle,
} from "lucide-react";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { FormError } from "@/features/identity/components/form-error";
import { useIdentity } from "@/features/identity/context/identity-context";
import {
  passwordChangeSchema,
  preferencesSchema,
  profileSchema,
  type PasswordChangeFormValues,
  type PreferencesFormValues,
  type ProfileFormValues,
} from "@/features/identity/validation";
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
  Select,
} from "@/shared/components/ui";
import { formatDateTime as formatRegionalDateTime } from "@/shared/utils/regional-formatters";

const roleLabels = {
  admin: "Administrador",
  manager: "Gestor",
  operator: "Operador",
  read_only: "Leitura",
} as const;

const statusLabels = {
  active: "Ativo",
  inactive: "Inativo",
  invited: "Convidado",
  suspended: "Suspenso",
} as const;

export function ProfileSettingsPanel() {
  const {
    avatarUrl,
    identitySessions,
    preferences,
    profile,
    refreshSessions,
    revokeAllSessions,
    revokeOtherSessions,
    revokeSession,
    session,
    signOut,
    updatePassword,
    updatePreferences,
    updateProfile,
    removeAvatar: removeAvatarFromStorage,
    uploadAvatar,
    user,
  } = useIdentity();
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const regionalPreferences = {
    currency: preferences?.currency,
    locale: preferences?.language,
    timeFormat: preferences?.timeFormat,
    timeZone: preferences?.timeZone,
  };

  const profileForm = useForm<ProfileFormValues>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      firstName: "",
      lastName: "",
      phone: "",
      jobTitle: "",
    },
  });

  const preferencesForm = useForm<PreferencesFormValues>({
    resolver: zodResolver(preferencesSchema) as never,
    defaultValues: {
      theme: "system",
      language: "pt-BR",
      timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      dateFormat: "dd/MM/yyyy",
      timeFormat: "24h",
      currency: "BRL",
      firstDayOfWeek: 1,
      notifications: {
        productUpdates: true,
        securityAlerts: true,
        operationalReports: false,
      },
    },
  });

  const passwordForm = useForm<PasswordChangeFormValues>({
    resolver: zodResolver(passwordChangeSchema),
    defaultValues: {
      currentPassword: "",
      password: "",
      confirmPassword: "",
      revokeOtherSessions: true,
    },
  });

  useEffect(() => {
    if (!profile) return;
    profileForm.reset({
      firstName: profile.firstName,
      lastName: profile.lastName,
      phone: profile.phone,
      jobTitle: profile.jobTitle,
    });
    setAvatarPreview(profile.avatarPath);
  }, [profile, profileForm]);

  useEffect(() => {
    if (!preferences) return;
    preferencesForm.reset({
      theme: preferences.theme,
      language: preferences.language,
      timeZone: preferences.timeZone,
      dateFormat: preferences.dateFormat,
      timeFormat: preferences.timeFormat,
      currency: preferences.currency,
      firstDayOfWeek: preferences.firstDayOfWeek,
      notifications: preferences.notifications,
    });
  }, [preferences, preferencesForm]);

  const onProfileSubmit = profileForm.handleSubmit(async (values) => {
    try {
      await updateProfile(values);
      toast.success("Perfil atualizado.");
    } catch (error) {
      toast.danger(error instanceof Error ? error.message : "Não foi possível salvar o perfil.");
    }
  });

  const onPreferencesSubmit = preferencesForm.handleSubmit(async (values) => {
    try {
      await updatePreferences({
        ...values,
        firstDayOfWeek: Number(values.firstDayOfWeek),
      });
      toast.success("Preferências salvas.");
    } catch (error) {
      toast.danger(
        error instanceof Error ? error.message : "Não foi possível salvar as preferências.",
      );
    }
  });

  const onPasswordSubmit = passwordForm.handleSubmit(async (values) => {
    try {
      await updatePassword({
        currentPassword: values.currentPassword,
        password: values.password,
        revokeOtherSessions: values.revokeOtherSessions,
      });
      passwordForm.reset();
      toast.success("Senha alterada.");
    } catch (error) {
      toast.danger(error instanceof Error ? error.message : "Não foi possível alterar a senha.");
    }
  });

  const onAvatarChange = (file: File | undefined) => {
    if (!file) return;

    const previewUrl = URL.createObjectURL(file);
    setAvatarPreview(previewUrl);
    uploadAvatar(file).catch((error) => {
      toast.danger(error instanceof Error ? error.message : "Não foi possível enviar o avatar.");
    });
  };

  const removeAvatar = async () => {
    try {
      await removeAvatarFromStorage();
      setAvatarPreview(null);
      toast.success("Foto removida.");
    } catch (error) {
      toast.danger(error instanceof Error ? error.message : "Não foi possível remover o avatar.");
    }
  };

  async function handleRevokeSession(sessionId: string, current: boolean) {
    if (current && !window.confirm("Revogar a sessão atual vai encerrar seu acesso. Continuar?")) {
      return;
    }
    await revokeSession(sessionId);
    toast.success("Sessão revogada.");
  }

  return (
    <div className="grid gap-6">
      <Card>
        <CardHeader>
          <CardTitle>Perfil</CardTitle>
          <CardDescription>Dados pessoais vinculados à sua conta Automy.</CardDescription>
        </CardHeader>
        <CardBody>
          <div className="mb-6 flex flex-wrap items-center gap-4">
            <div className="grid size-16 place-items-center overflow-hidden rounded-card bg-accent text-lg font-semibold">
              {avatarPreview || avatarUrl ? (
                <img
                  src={avatarPreview ?? avatarUrl ?? ""}
                  alt=""
                  className="size-16 object-cover"
                />
              ) : (
                <UserCircle className="size-8" />
              )}
            </div>
            <label className="inline-flex cursor-pointer items-center gap-2 rounded-button border border-border bg-background px-4 py-2 text-sm font-medium shadow-xs hover:bg-muted">
              <Camera className="size-4" />
              Alterar foto
              <input
                type="file"
                accept="image/png,image/jpeg,image/webp"
                className="sr-only"
                onChange={(event) => onAvatarChange(event.target.files?.[0])}
              />
            </label>
            <Button type="button" variant="ghost" onClick={() => void removeAvatar()}>
              <Trash2 className="size-4" />
              Remover foto
            </Button>
          </div>
          <form className="grid max-w-3xl gap-5" onSubmit={onProfileSubmit}>
            <div className="grid gap-5 sm:grid-cols-2">
              <Field label="Nome">
                <Input autoComplete="given-name" {...profileForm.register("firstName")} />
                <FormError message={profileForm.formState.errors.firstName?.message} />
              </Field>
              <Field label="Sobrenome">
                <Input autoComplete="family-name" {...profileForm.register("lastName")} />
                <FormError message={profileForm.formState.errors.lastName?.message} />
              </Field>
              <Field label="Telefone">
                <Input autoComplete="tel" {...profileForm.register("phone")} />
                <FormError message={profileForm.formState.errors.phone?.message} />
              </Field>
              <Field label="Cargo">
                <Input autoComplete="organization-title" {...profileForm.register("jobTitle")} />
                <FormError message={profileForm.formState.errors.jobTitle?.message} />
              </Field>
              <Field label="E-mail">
                <Input value={user?.email ?? ""} readOnly />
              </Field>
              <Field label="Empresa">
                <Input value={profile?.companyName ?? ""} readOnly />
              </Field>
              <Field label="Perfil de acesso">
                <Input value={profile ? roleLabels[profile.role] : ""} readOnly />
              </Field>
              <Field label="Status">
                <Input value={profile ? statusLabels[profile.status] : ""} readOnly />
              </Field>
            </div>
            <div className="grid gap-3 text-sm text-muted-foreground sm:grid-cols-2">
              <div>
                Criada em:{" "}
                {profile?.authCreatedAt
                  ? formatRegionalDateTime(profile.authCreatedAt, {
                      locale: preferences?.language,
                      timeZone: preferences?.timeZone,
                      currency: preferences?.currency,
                      timeFormat: preferences?.timeFormat,
                    })
                  : ""}
              </div>
              <div>
                Último acesso:{" "}
                {profile?.lastLogin
                  ? formatRegionalDateTime(profile.lastLogin, {
                      locale: preferences?.language,
                      timeZone: preferences?.timeZone,
                      currency: preferences?.currency,
                      timeFormat: preferences?.timeFormat,
                    })
                  : "Nunca acessou"}
              </div>
            </div>
            <div>
              <Button type="submit" loading={profileForm.formState.isSubmitting}>
                <Save className="size-4" />
                Salvar perfil
              </Button>
            </div>
          </form>
        </CardBody>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Preferências</CardTitle>
          <CardDescription>Preferências pessoais aplicadas somente à sua conta.</CardDescription>
        </CardHeader>
        <CardBody>
          <form className="grid max-w-3xl gap-5" onSubmit={onPreferencesSubmit}>
            <div className="grid gap-5 sm:grid-cols-2">
              <Field label="Tema">
                <Select {...preferencesForm.register("theme")}>
                  <option value="system">Sistema</option>
                  <option value="light">Claro</option>
                  <option value="dark">Escuro</option>
                </Select>
              </Field>
              <Field label="Idioma">
                <Input {...preferencesForm.register("language")} />
                <FormError message={preferencesForm.formState.errors.language?.message} />
              </Field>
              <Field label="Fuso horário">
                <Input {...preferencesForm.register("timeZone")} />
                <FormError message={preferencesForm.formState.errors.timeZone?.message} />
              </Field>
              <Field label="Formato de data">
                <Select {...preferencesForm.register("dateFormat")}>
                  <option value="dd/MM/yyyy">dd/MM/yyyy</option>
                  <option value="MM/dd/yyyy">MM/dd/yyyy</option>
                  <option value="yyyy-MM-dd">yyyy-MM-dd</option>
                </Select>
              </Field>
              <Field label="Formato de hora">
                <Select {...preferencesForm.register("timeFormat")}>
                  <option value="24h">24 horas</option>
                  <option value="12h">12 horas</option>
                </Select>
              </Field>
              <Field label="Moeda">
                <Select {...preferencesForm.register("currency")}>
                  <option value="BRL">BRL</option>
                  <option value="USD">USD</option>
                  <option value="EUR">EUR</option>
                </Select>
              </Field>
              <Field label="Primeiro dia da semana">
                <Select {...preferencesForm.register("firstDayOfWeek")}>
                  <option value={1}>Segunda-feira</option>
                  <option value={0}>Domingo</option>
                  <option value={6}>Sábado</option>
                </Select>
              </Field>
            </div>
            <div className="grid gap-3">
              <label className="flex items-center gap-3 text-sm">
                <Checkbox {...preferencesForm.register("notifications.securityAlerts")} />
                Alertas de segurança
              </label>
              <label className="flex items-center gap-3 text-sm">
                <Checkbox {...preferencesForm.register("notifications.productUpdates")} />
                Atualizações do produto
              </label>
              <label className="flex items-center gap-3 text-sm">
                <Checkbox {...preferencesForm.register("notifications.operationalReports")} />
                Relatórios operacionais
              </label>
            </div>
            <div>
              <Button type="submit" loading={preferencesForm.formState.isSubmitting}>
                <Save className="size-4" />
                Salvar preferências
              </Button>
            </div>
          </form>
        </CardBody>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Senha</CardTitle>
          <CardDescription>Altere sua senha mantendo a sessão atual protegida.</CardDescription>
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
          <CardTitle>Sessões ativas</CardTitle>
          <CardDescription>Controle o acesso conectado à sua conta.</CardDescription>
        </CardHeader>
        <CardBody>
          <div className="grid gap-4">
            {identitySessions.map((identitySession) => (
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
                    {identitySession.current && (
                      <span className="inline-flex items-center gap-1 text-xs text-success">
                        <ShieldCheck className="size-3.5" />
                        Sessão atual
                      </span>
                    )}
                  </div>
                  <div className="mt-1 text-sm text-muted-foreground">
                    {identitySession.device} · IP{" "}
                    {identitySession.maskedIpAddress ?? "não informado"}
                  </div>
                  <div className="mt-1 text-xs text-muted-foreground">
                    Criada em{" "}
                    {formatRegionalDateTime(identitySession.createdAt, regionalPreferences)} ·
                    Última atividade{" "}
                    {formatRegionalDateTime(identitySession.updatedAt, regionalPreferences)}
                  </div>
                </div>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => handleRevokeSession(identitySession.id, identitySession.current)}
                >
                  Revogar
                </Button>
              </div>
            ))}
            <div className="flex flex-wrap gap-2">
              <Button variant="ghost" onClick={() => refreshSessions()}>
                Atualizar sessões
              </Button>
              <Button variant="secondary" onClick={() => signOut("local")}>
                <Smartphone className="size-4" />
                Sair desta sessão
              </Button>
              <Button
                variant="outline"
                onClick={() =>
                  revokeOtherSessions().then(() => toast.success("Outras sessões encerradas."))
                }
              >
                Encerrar outras sessões
              </Button>
              <Button
                variant="danger"
                onClick={() => {
                  if (
                    window.confirm("Encerrar todas as sessões vai exigir novo login. Continuar?")
                  ) {
                    revokeAllSessions().then(() => toast.success("Sessões encerradas."));
                  }
                }}
              >
                Sair de todos os dispositivos
              </Button>
            </div>
          </div>
        </CardBody>
      </Card>
    </div>
  );
}
