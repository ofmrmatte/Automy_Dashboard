import { zodResolver } from "@hookform/resolvers/zod";
import { Save } from "lucide-react";
import { useEffect } from "react";
import { useForm } from "react-hook-form";
import type { Client } from "@/features/clients/types";
import { clientFormSchema, type ClientFormValues } from "@/features/clients/validation";
import { Button, Field, Input, Modal, Select, Textarea } from "@/shared/components/ui";

const defaultValues: ClientFormValues = {
  id: "",
  tradeName: "",
  legalName: "",
  document: "",
  stateRegistration: "",
  municipalRegistration: "",
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
  const form = useForm<ClientFormValues>({
    resolver: zodResolver(clientFormSchema),
    defaultValues: valuesFromClient(client),
  });

  useEffect(() => {
    form.reset(valuesFromClient(client));
  }, [client, form, open]);

  async function handleSubmit(values: ClientFormValues) {
    await onSubmit(values);
    if (!isEditing) form.reset(defaultValues);
  }

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
            <Input placeholder="Nome da empresa" {...form.register("tradeName")} />
            <FormError message={form.formState.errors.tradeName?.message} />
          </Field>
          <Field label="Razão social">
            <Input placeholder="Razão social completa" {...form.register("legalName")} />
            <FormError message={form.formState.errors.legalName?.message} />
          </Field>
          <Field label="CNPJ">
            <Input placeholder="00.000.000/0000-00" {...form.register("document")} />
            <FormError message={form.formState.errors.document?.message} />
          </Field>
          <Field label="Inscrição estadual">
            <Input placeholder="Opcional" {...form.register("stateRegistration")} />
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
          <Field label="E-mail">
            <Input type="email" placeholder="contato@empresa.com" {...form.register("email")} />
            <FormError message={form.formState.errors.email?.message} />
          </Field>
          <Field label="Telefone">
            <Input placeholder="(00) 00000-0000" {...form.register("phone")} />
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
            <Input placeholder="00000-000" {...form.register("postalCode")} />
            <FormError message={form.formState.errors.postalCode?.message} />
          </Field>
          <Field label="Rua">
            <Input placeholder="Rua, avenida..." {...form.register("street")} />
            <FormError message={form.formState.errors.street?.message} />
          </Field>
          <Field label="Número">
            <Input placeholder="Número" {...form.register("number")} />
            <FormError message={form.formState.errors.number?.message} />
          </Field>
          <Field label="Complemento">
            <Input placeholder="Complemento" {...form.register("complement")} />
            <FormError message={form.formState.errors.complement?.message} />
          </Field>
          <Field label="Bairro">
            <Input placeholder="Bairro" {...form.register("district")} />
            <FormError message={form.formState.errors.district?.message} />
          </Field>
          <Field label="Cidade">
            <Input placeholder="Cidade" {...form.register("city")} />
            <FormError message={form.formState.errors.city?.message} />
          </Field>
          <Field label="UF">
            <Input maxLength={2} placeholder="SP" {...form.register("state")} />
            <FormError message={form.formState.errors.state?.message} />
          </Field>
          <Field label="País">
            <Input placeholder="BR" {...form.register("country")} />
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
