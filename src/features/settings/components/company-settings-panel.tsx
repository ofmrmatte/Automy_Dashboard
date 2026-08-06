import { zodResolver } from "@hookform/resolvers/zod";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Building2, Save } from "lucide-react";
import { useEffect } from "react";
import { useForm } from "react-hook-form";
import {
  companySettingsQueryOptions,
  settingsQueryKeys,
} from "@/features/settings/api/settings.queries";
import { settingsService } from "@/features/settings/services/settings.service";
import {
  companySettingsSchema,
  type CompanySettingsFormValues,
} from "@/features/settings/validation";
import { FormError } from "@/features/identity/components/form-error";
import { EmptyState } from "@/shared/components/empty-state";
import { toast } from "@/shared/components/toast";
import {
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
  Textarea,
} from "@/shared/components/ui";

export function CompanySettingsPanel() {
  const queryClient = useQueryClient();
  const { data, error, isLoading } = useQuery(companySettingsQueryOptions());
  const canEdit = Boolean(data?.access.canManageSettings);
  const form = useForm<CompanySettingsFormValues>({
    resolver: zodResolver(companySettingsSchema),
    defaultValues: getEmptyCompanyValues(),
  });

  useEffect(() => {
    if (!data?.company) return;
    form.reset(data.company);
  }, [data?.company, form]);

  useEffect(() => {
    if (!form.formState.isDirty) return;
    const onBeforeUnload = (event: BeforeUnloadEvent) => {
      event.preventDefault();
      event.returnValue = "";
    };
    window.addEventListener("beforeunload", onBeforeUnload);
    return () => window.removeEventListener("beforeunload", onBeforeUnload);
  }, [form.formState.isDirty]);

  const onSubmit = form.handleSubmit(async (values) => {
    try {
      const result = await settingsService.updateCompany({
        ...values,
        firstDayOfWeek: Number(values.firstDayOfWeek),
        defaultContractTermDays: Number(values.defaultContractTermDays),
        defaultBillingTermDays: Number(values.defaultBillingTermDays),
      });
      form.reset(result.company);
      await queryClient.invalidateQueries({ queryKey: settingsQueryKeys.company });
      toast.success("Empresa atualizada.");
    } catch (error) {
      toast.danger(error instanceof Error ? error.message : "Não foi possível salvar a empresa.");
    }
  });

  if (isLoading) return <Loader />;
  if (error) {
    return (
      <Card>
        <EmptyState title="Não foi possível carregar a empresa" description={error.message} />
      </Card>
    );
  }

  return (
    <form className="grid gap-6" onSubmit={onSubmit}>
      <Card>
        <CardHeader>
          <CardTitle>Empresa</CardTitle>
          <CardDescription>
            Dados institucionais derivados da empresa vinculada à sessão atual.
          </CardDescription>
        </CardHeader>
        <CardBody className="grid gap-5">
          {!canEdit && (
            <div className="rounded-lg border border-border bg-muted/40 p-3 text-sm text-muted-foreground">
              Seu perfil permite visualizar estes dados, mas não editar informações da empresa.
            </div>
          )}
          <div className="grid gap-5 md:grid-cols-2">
            <Field label="Nome fantasia">
              <Input disabled={!canEdit} {...form.register("tradeName")} />
              <FormError message={form.formState.errors.tradeName?.message} />
            </Field>
            <Field label="Razão social">
              <Input disabled={!canEdit} {...form.register("legalName")} />
              <FormError message={form.formState.errors.legalName?.message} />
            </Field>
            <Field label="CNPJ">
              <Input disabled={!canEdit} {...form.register("document")} />
              <FormError message={form.formState.errors.document?.message} />
            </Field>
            <Field label="Status">
              <Select disabled={!canEdit} {...form.register("status")}>
                <option value="active">Ativa</option>
                <option value="inactive">Inativa</option>
                <option value="pending">Pendente</option>
                <option value="blocked">Bloqueada</option>
              </Select>
            </Field>
            <Field label="Inscrição estadual">
              <Input disabled={!canEdit} {...form.register("stateRegistration")} />
            </Field>
            <Field label="Inscrição municipal">
              <Input disabled={!canEdit} {...form.register("municipalRegistration")} />
            </Field>
            <Field label="E-mail">
              <Input disabled={!canEdit} {...form.register("email")} />
              <FormError message={form.formState.errors.email?.message} />
            </Field>
            <Field label="Telefone">
              <Input disabled={!canEdit} {...form.register("phone")} />
              <FormError message={form.formState.errors.phone?.message} />
            </Field>
            <Field label="Website">
              <Input disabled={!canEdit} {...form.register("website")} />
              <FormError message={form.formState.errors.website?.message} />
            </Field>
            <Field label="Segmento">
              <Input disabled={!canEdit} {...form.register("segment")} />
            </Field>
          </div>
          <Field label="Descrição">
            <Textarea disabled={!canEdit} {...form.register("description")} />
            <FormError message={form.formState.errors.description?.message} />
          </Field>
        </CardBody>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Endereço</CardTitle>
          <CardDescription>Localização fiscal e operacional da empresa.</CardDescription>
        </CardHeader>
        <CardBody className="grid gap-5 md:grid-cols-3">
          <Field label="CEP">
            <Input disabled={!canEdit} {...form.register("postalCode")} />
            <FormError message={form.formState.errors.postalCode?.message} />
          </Field>
          <Field label="Logradouro">
            <Input disabled={!canEdit} {...form.register("street")} />
          </Field>
          <Field label="Número">
            <Input disabled={!canEdit} {...form.register("number")} />
          </Field>
          <Field label="Complemento">
            <Input disabled={!canEdit} {...form.register("complement")} />
          </Field>
          <Field label="Bairro">
            <Input disabled={!canEdit} {...form.register("district")} />
          </Field>
          <Field label="Cidade">
            <Input disabled={!canEdit} {...form.register("city")} />
          </Field>
          <Field label="Estado">
            <Input disabled={!canEdit} maxLength={2} {...form.register("state")} />
            <FormError message={form.formState.errors.state?.message} />
          </Field>
          <Field label="País">
            <Input disabled={!canEdit} {...form.register("country")} />
          </Field>
        </CardBody>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Preferências organizacionais</CardTitle>
          <CardDescription>Padrões aplicados aos novos fluxos da empresa.</CardDescription>
        </CardHeader>
        <CardBody className="grid gap-5 md:grid-cols-3">
          <Field label="Fuso horário padrão">
            <Input disabled={!canEdit} {...form.register("timeZone")} />
          </Field>
          <Field label="Idioma padrão">
            <Input disabled={!canEdit} {...form.register("defaultLanguage")} />
          </Field>
          <Field label="Moeda padrão">
            <Input disabled={!canEdit} {...form.register("defaultCurrency")} />
          </Field>
          <Field label="Formato de data">
            <Select disabled={!canEdit} {...form.register("dateFormat")}>
              <option value="dd/MM/yyyy">dd/MM/yyyy</option>
              <option value="MM/dd/yyyy">MM/dd/yyyy</option>
              <option value="yyyy-MM-dd">yyyy-MM-dd</option>
            </Select>
          </Field>
          <Field label="Formato de hora">
            <Select disabled={!canEdit} {...form.register("timeFormat")}>
              <option value="24h">24 horas</option>
              <option value="12h">12 horas</option>
            </Select>
          </Field>
          <Field label="Primeiro dia da semana">
            <Select disabled={!canEdit} {...form.register("firstDayOfWeek")}>
              <option value={1}>Segunda-feira</option>
              <option value={0}>Domingo</option>
              <option value={6}>Sábado</option>
            </Select>
          </Field>
          <Field label="Horário inicial">
            <Input disabled={!canEdit} type="time" {...form.register("businessHours.start")} />
          </Field>
          <Field label="Horário final">
            <Input disabled={!canEdit} type="time" {...form.register("businessHours.end")} />
          </Field>
          <Field label="Prazo padrão de contratos">
            <Input
              disabled={!canEdit}
              type="number"
              {...form.register("defaultContractTermDays")}
            />
          </Field>
          <Field label="Prazo padrão de cobranças">
            <Input disabled={!canEdit} type="number" {...form.register("defaultBillingTermDays")} />
          </Field>
        </CardBody>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Identidade e faturamento</CardTitle>
          <CardDescription>
            URLs públicas de marca e dados financeiros da organização.
          </CardDescription>
        </CardHeader>
        <CardBody className="grid gap-5 md:grid-cols-2">
          <Field label="Nome exibido no sistema">
            <Input disabled={!canEdit} {...form.register("displayName")} />
          </Field>
          <Field label="Logo da empresa por URL">
            <Input disabled={!canEdit} {...form.register("logoUrl")} />
            <FormError message={form.formState.errors.logoUrl?.message} />
          </Field>
          <Field label="Ícone organizacional por URL">
            <Input disabled={!canEdit} {...form.register("faviconUrl")} />
            <FormError message={form.formState.errors.faviconUrl?.message} />
          </Field>
          <Field label="Razão social de cobrança">
            <Input disabled={!canEdit} {...form.register("billingLegalName")} />
          </Field>
          <Field label="CNPJ/CPF de cobrança">
            <Input disabled={!canEdit} {...form.register("billingDocument")} />
            <FormError message={form.formState.errors.billingDocument?.message} />
          </Field>
          <Field label="E-mail financeiro">
            <Input disabled={!canEdit} {...form.register("billingEmail")} />
            <FormError message={form.formState.errors.billingEmail?.message} />
          </Field>
          <Field label="Telefone financeiro">
            <Input disabled={!canEdit} {...form.register("billingPhone")} />
            <FormError message={form.formState.errors.billingPhone?.message} />
          </Field>
          <Field label="CEP de cobrança">
            <Input disabled={!canEdit} {...form.register("billingAddress.postalCode")} />
          </Field>
          <Field label="Endereço de cobrança">
            <Input disabled={!canEdit} {...form.register("billingAddress.street")} />
          </Field>
          <Field label="Número">
            <Input disabled={!canEdit} {...form.register("billingAddress.number")} />
          </Field>
          <Field label="Cidade">
            <Input disabled={!canEdit} {...form.register("billingAddress.city")} />
          </Field>
          <Field label="Estado">
            <Input disabled={!canEdit} maxLength={2} {...form.register("billingAddress.state")} />
          </Field>
        </CardBody>
      </Card>

      {canEdit && (
        <div className="sticky bottom-4 flex justify-end">
          <Button
            type="submit"
            loading={form.formState.isSubmitting}
            disabled={!form.formState.isDirty}
          >
            <Save className="size-4" />
            Salvar empresa
          </Button>
        </div>
      )}
    </form>
  );
}

function getEmptyCompanyValues(): CompanySettingsFormValues {
  return {
    legalName: "",
    tradeName: "",
    document: "",
    stateRegistration: "",
    municipalRegistration: "",
    email: "",
    phone: "",
    website: "",
    description: "",
    segment: "",
    status: "active",
    postalCode: "",
    street: "",
    number: "",
    complement: "",
    district: "",
    city: "",
    state: "",
    country: "BR",
    timeZone: "America/Sao_Paulo",
    defaultLanguage: "pt-BR",
    defaultCurrency: "BRL",
    dateFormat: "dd/MM/yyyy",
    timeFormat: "24h",
    firstDayOfWeek: 1,
    businessHours: { start: "08:00", end: "18:00" },
    defaultContractTermDays: 365,
    defaultBillingTermDays: 7,
    logoUrl: "",
    faviconUrl: "",
    displayName: "",
    billingLegalName: "",
    billingDocument: "",
    billingEmail: "",
    billingPhone: "",
    billingAddress: {
      postalCode: "",
      street: "",
      number: "",
      complement: "",
      district: "",
      city: "",
      state: "",
      country: "BR",
    },
  };
}
