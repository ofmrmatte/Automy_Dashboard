import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2, Save } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { useForm } from "react-hook-form";
import type { Client } from "@/features/clients/types";
import { clientFormSchema, type ClientFormValues } from "@/features/clients/validation";
import { Button, Field, Input, Modal, Select, Textarea } from "@/shared/components/ui";
import { cn } from "@/shared/utils/cn";
import { isValidCnpj, onlyDigits } from "@/shared/utils/document";

const defaultValues: ClientFormValues = {
  id: "",
  tradeName: "",
  legalName: "",
  document: "",
  stateRegistration: "",
  municipalRegistration: "",
  legalNature: "",
  cnae: "",
  registrationStatus: "",
  openedAt: "",
  segment: "",
  email: "",
  phone: "",
  website: "",
  notes: "",
  logoUrl: "",
  owner: "",
  ownerEmail: "",
  ownerPhone: "",
  plan: "",
  status: "Pendente",
  postalCode: "",
  street: "",
  number: "",
  complement: "",
  district: "",
  city: "",
  state: "",
  country: "BR",
};

function valuesFromClient(client: Client | null | undefined): ClientFormValues {
  if (!client) return defaultValues;

  return {
    id: client.id,
    tradeName: client.name,
    legalName: client.legal,
    document: client.cnpj,
    stateRegistration: client.stateRegistration,
    municipalRegistration: client.municipalRegistration,
    legalNature: client.legalNature,
    cnae: client.cnae,
    registrationStatus: client.registrationStatus,
    openedAt: client.openedAt,
    segment: client.segment,
    email: client.email,
    phone: client.phone,
    website: client.website,
    notes: client.notes,
    logoUrl: client.logoUrl,
    owner: client.owner,
    ownerEmail: client.ownerEmail,
    ownerPhone: client.ownerPhone,
    plan: client.plan,
    status: client.status,
    postalCode: client.address.postalCode,
    street: client.address.street,
    number: client.address.number,
    complement: client.address.complement,
    district: client.address.district,
    city: client.address.city || client.city,
    state: client.address.state || client.state,
    country: client.address.country || "BR",
  };
}

export function ClientCreateModal({
  open,
  client,
  saving,
  onClose,
  onSubmit,
}: {
  open: boolean;
  client?: Client | null;
  saving: boolean;
  onClose: () => void;
  onSubmit: (values: ClientFormValues) => Promise<unknown>;
}) {
  const isEditing = Boolean(client);
  const [lookupStatus, setLookupStatus] = useState<"idle" | "loading" | "success" | "error">(
    "idle",
  );
  const [lookupMessage, setLookupMessage] = useState("");
  const [lastLookupDocument, setLastLookupDocument] = useState("");
  const [autofilledFields, setAutofilledFields] = useState<Set<keyof ClientFormValues>>(
    () => new Set(),
  );
  const lookupControllerRef = useRef<AbortController | null>(null);
  const form = useForm<ClientFormValues>({
    resolver: zodResolver(clientFormSchema),
    defaultValues: valuesFromClient(client),
  });
  const documentValue = form.watch("document");

  useEffect(() => {
    form.reset(valuesFromClient(client));
    setLastLookupDocument("");
    setAutofilledFields(new Set());
  }, [client, form, open]);

  async function handleSubmit(values: ClientFormValues) {
    await onSubmit(values);
    if (!isEditing) form.reset(defaultValues);
  }

  const lookupFieldClass = (field: keyof ClientFormValues) =>
    autofilledFields.has(field) ? "border-primary/40 bg-primary/5" : undefined;

  const lookupCnpj = useCallback(
    async (document: string, force = false) => {
      if (isEditing) return;
      if (!isValidCnpj(document)) {
        setLookupStatus("error");
        setLookupMessage("Informe um CNPJ válido.");
        return;
      }
      if (!force && document === lastLookupDocument) return;

      lookupControllerRef.current?.abort();
      const controller = new AbortController();
      lookupControllerRef.current = controller;
      setLookupStatus("loading");
      setLookupMessage("Consultando CNPJ...");

      try {
        const response = await fetch(
          `/api/company-lookup/cnpj?document=${encodeURIComponent(document)}`,
          {
            credentials: "include",
            signal: controller.signal,
          },
        );
        const payload = (await response.json().catch(() => null)) as {
          company?: Partial<ClientFormValues> & {
            legalNature?: string;
            cnae?: string;
            registrationStatus?: string;
            openedAt?: string;
            stateRegistration?: string;
          };
          error?: string;
        } | null;
        if (!response.ok) throw new Error(payload?.error ?? "Não foi possível consultar CNPJ.");
        if (!payload?.company) return;

        const company = payload.company;
        const current = form.getValues();
        const filledFields = new Set<keyof ClientFormValues>();
        const setIfEmpty = <TField extends keyof ClientFormValues>(
          field: TField,
          value: ClientFormValues[TField] | undefined,
        ) => {
          if (!value || current[field]) return;
          form.setValue(field, value as never, { shouldDirty: true, shouldValidate: true });
          filledFields.add(field);
        };

        setIfEmpty("legalName", company.legalName);
        setIfEmpty("tradeName", company.tradeName || company.legalName);
        setIfEmpty("email", company.email);
        setIfEmpty("phone", company.phone);
        setIfEmpty("stateRegistration", company.stateRegistration);
        setIfEmpty("postalCode", company.postalCode);
        setIfEmpty("street", company.street);
        setIfEmpty("number", company.number);
        setIfEmpty("complement", company.complement);
        setIfEmpty("district", company.district);
        setIfEmpty("city", company.city);
        setIfEmpty("state", company.state);
        setIfEmpty("country", company.country || "BR");
        setIfEmpty("segment", company.cnae);
        setIfEmpty("legalNature", company.legalNature);
        setIfEmpty("cnae", company.cnae);
        setIfEmpty("registrationStatus", company.registrationStatus);
        setIfEmpty("openedAt", company.openedAt);
        setAutofilledFields(filledFields);
        setLastLookupDocument(document);
        setLookupStatus("success");
        setLookupMessage("Dados cadastrais preenchidos pelo CNPJ.ws.");
      } catch (error) {
        if (controller.signal.aborted) return;
        setLookupStatus("error");
        setLookupMessage(
          error instanceof Error
            ? error.message
            : "Não foi possível consultar o CNPJ agora. O cadastro manual continua disponível.",
        );
      }
    },
    [form, isEditing, lastLookupDocument],
  );

  useEffect(() => {
    const document = onlyDigits(documentValue ?? "");
    if (isEditing || document.length !== 14) {
      setLookupStatus("idle");
      setLookupMessage("");
      return;
    }

    const timeout = window.setTimeout(() => {
      void lookupCnpj(document);
    }, 750);

    return () => {
      window.clearTimeout(timeout);
    };
  }, [documentValue, isEditing, lookupCnpj]);

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={isEditing ? "Editar cliente" : "Novo cliente"}
      description="Cadastre e mantenha os dados reais da empresa no Railway PostgreSQL."
      size="xl"
    >
      <form className="grid gap-6" onSubmit={form.handleSubmit(handleSubmit)}>
        <input type="hidden" {...form.register("id")} />
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <Field label="Nome fantasia">
            <Input
              className={lookupFieldClass("tradeName")}
              placeholder="Nome da empresa"
              {...form.register("tradeName")}
            />
            <FormError message={form.formState.errors.tradeName?.message} />
          </Field>
          <Field label="Razão social">
            <Input
              className={lookupFieldClass("legalName")}
              placeholder="Razão social completa"
              {...form.register("legalName")}
            />
            <FormError message={form.formState.errors.legalName?.message} />
          </Field>
          <Field label="CNPJ">
            <div className="flex gap-2">
              <Input placeholder="00.000.000/0000-00" {...form.register("document")} />
              {!isEditing && (
                <Button
                  type="button"
                  variant="secondary"
                  loading={lookupStatus === "loading"}
                  disabled={!isValidCnpj(documentValue ?? "")}
                  onClick={() => lookupCnpj(onlyDigits(documentValue ?? ""), true)}
                >
                  Consultar
                </Button>
              )}
            </div>
            <FormError message={form.formState.errors.document?.message} />
            {lookupMessage && (
              <span
                className={cn(
                  "inline-flex items-center gap-1 text-xs",
                  lookupStatus === "error" ? "text-destructive" : "text-muted-foreground",
                )}
              >
                {lookupStatus === "loading" && <Loader2 className="size-3 animate-spin" />}
                {lookupMessage}
              </span>
            )}
          </Field>
          <Field label="Inscrição estadual">
            <Input
              className={lookupFieldClass("stateRegistration")}
              placeholder="Opcional"
              {...form.register("stateRegistration")}
            />
            <FormError message={form.formState.errors.stateRegistration?.message} />
          </Field>
          <Field label="Inscrição municipal">
            <Input placeholder="Opcional" {...form.register("municipalRegistration")} />
            <FormError message={form.formState.errors.municipalRegistration?.message} />
          </Field>
          <Field label="Segmento">
            <Input placeholder="Logística, transporte..." {...form.register("segment")} />
            <FormError message={form.formState.errors.segment?.message} />
          </Field>
          <Field label="Natureza jurídica">
            <Input className={lookupFieldClass("legalNature")} {...form.register("legalNature")} />
            <FormError message={form.formState.errors.legalNature?.message} />
          </Field>
          <Field label="CNAE">
            <Input className={lookupFieldClass("cnae")} {...form.register("cnae")} />
            <FormError message={form.formState.errors.cnae?.message} />
          </Field>
          <Field label="Situação cadastral">
            <Input
              className={lookupFieldClass("registrationStatus")}
              {...form.register("registrationStatus")}
            />
            <FormError message={form.formState.errors.registrationStatus?.message} />
          </Field>
          <Field label="Data de abertura">
            <Input
              className={lookupFieldClass("openedAt")}
              type="date"
              {...form.register("openedAt")}
            />
            <FormError message={form.formState.errors.openedAt?.message} />
          </Field>
          <Field label="E-mail">
            <Input
              className={lookupFieldClass("email")}
              type="email"
              placeholder="contato@empresa.com"
              {...form.register("email")}
            />
            <FormError message={form.formState.errors.email?.message} />
          </Field>
          <Field label="Telefone">
            <Input
              className={lookupFieldClass("phone")}
              placeholder="(00) 00000-0000"
              {...form.register("phone")}
            />
            <FormError message={form.formState.errors.phone?.message} />
          </Field>
          <Field label="Site">
            <Input placeholder="https://empresa.com.br" {...form.register("website")} />
            <FormError message={form.formState.errors.website?.message} />
          </Field>
          <Field label="Responsável principal">
            <Input placeholder="Nome completo" {...form.register("owner")} />
            <FormError message={form.formState.errors.owner?.message} />
          </Field>
          <Field label="E-mail do responsável">
            <Input
              type="email"
              placeholder="responsavel@empresa.com"
              {...form.register("ownerEmail")}
            />
            <FormError message={form.formState.errors.ownerEmail?.message} />
          </Field>
          <Field label="Telefone do responsável">
            <Input placeholder="(00) 00000-0000" {...form.register("ownerPhone")} />
            <FormError message={form.formState.errors.ownerPhone?.message} />
          </Field>
          <Field label="Plano">
            <Input placeholder="Plano contratado" {...form.register("plan")} />
            <FormError message={form.formState.errors.plan?.message} />
          </Field>
          <Field label="Status">
            <Select {...form.register("status")}>
              <option>Ativo</option>
              <option>Implantação</option>
              <option>Pendente</option>
              <option>Inativo</option>
              <option>Bloqueado</option>
            </Select>
            <FormError message={form.formState.errors.status?.message} />
          </Field>
          <Field label="Logo URL">
            <Input placeholder="https://..." {...form.register("logoUrl")} />
            <FormError message={form.formState.errors.logoUrl?.message} />
          </Field>
        </div>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Field label="CEP">
            <Input
              className={lookupFieldClass("postalCode")}
              placeholder="00000-000"
              {...form.register("postalCode")}
            />
            <FormError message={form.formState.errors.postalCode?.message} />
          </Field>
          <Field label="Rua">
            <Input
              className={lookupFieldClass("street")}
              placeholder="Rua, avenida..."
              {...form.register("street")}
            />
            <FormError message={form.formState.errors.street?.message} />
          </Field>
          <Field label="Número">
            <Input
              className={lookupFieldClass("number")}
              placeholder="Número"
              {...form.register("number")}
            />
            <FormError message={form.formState.errors.number?.message} />
          </Field>
          <Field label="Complemento">
            <Input
              className={lookupFieldClass("complement")}
              placeholder="Complemento"
              {...form.register("complement")}
            />
            <FormError message={form.formState.errors.complement?.message} />
          </Field>
          <Field label="Bairro">
            <Input
              className={lookupFieldClass("district")}
              placeholder="Bairro"
              {...form.register("district")}
            />
            <FormError message={form.formState.errors.district?.message} />
          </Field>
          <Field label="Cidade">
            <Input
              className={lookupFieldClass("city")}
              placeholder="Cidade"
              {...form.register("city")}
            />
            <FormError message={form.formState.errors.city?.message} />
          </Field>
          <Field label="UF">
            <Input
              className={lookupFieldClass("state")}
              maxLength={2}
              placeholder="SP"
              {...form.register("state")}
            />
            <FormError message={form.formState.errors.state?.message} />
          </Field>
          <Field label="País">
            <Input
              className={lookupFieldClass("country")}
              placeholder="BR"
              {...form.register("country")}
            />
            <FormError message={form.formState.errors.country?.message} />
          </Field>
        </div>
        <Field label="Observações">
          <Textarea placeholder="Notas internas sobre o cliente" {...form.register("notes")} />
          <FormError message={form.formState.errors.notes?.message} />
        </Field>
        <div className="flex justify-end gap-2 pt-2">
          <Button type="button" variant="secondary" onClick={onClose}>
            Cancelar
          </Button>
          <Button type="submit" loading={saving}>
            <Save className="size-4" />
            {isEditing ? "Salvar alterações" : "Salvar cliente"}
          </Button>
        </div>
      </form>
    </Modal>
  );
}

function FormError({ message }: { message: string | undefined }) {
  if (!message) return null;
  return <span className="text-xs font-normal text-destructive">{message}</span>;
}
