import { zodResolver } from "@hookform/resolvers/zod";
import { BadgeCheck, Building2, FileSignature, Save, ShieldCheck, Users } from "lucide-react";
import { useEffect, useMemo } from "react";
import { useForm, useWatch } from "react-hook-form";
import type { Contract } from "@/features/contracts/types";
import {
  buildContractDraft,
  normalizeProductTerms,
} from "@/features/contracts/utils/contract-template";
import {
  contractBillingPeriods,
  contractFormSchema,
  contractStatuses,
  type ContractFormValues,
} from "@/features/contracts/validation";
import { clientsQueryOptions } from "@/features/clients/api/client.queries";
import { productsQueryOptions } from "@/features/products/api/product.queries";
import { useQuery } from "@tanstack/react-query";
import { Button, Field, Input, Modal, Select, Textarea } from "@/shared/components/ui";

const defaultValues: ContractFormValues = {
  id: "",
  clientId: "",
  productId: "",
  name: "",
  monthlyValue: 0,
  implementationValue: 0,
  startsAt: new Date().toISOString().slice(0, 10),
  endsAt: "",
  renewalAt: "",
  billingPeriod: "Mensal",
  status: "Pendente",
  signerName: "",
  witnessName: "",
  notes: "",
  contractText: "",
};

function contractToFormValues(contract: Contract | null | undefined): ContractFormValues {
  if (!contract) return defaultValues;
  const billingPeriod = contractBillingPeriods.find((period) => period === contract.billingPeriod);

  return {
    id: contract.id,
    clientId: contract.clientId,
    productId: contract.productId,
    name: contract.plan,
    monthlyValue: contract.monthlyValue,
    implementationValue: contract.implementationValue,
    startsAt: contract.startsAt,
    endsAt: contract.endsAt,
    renewalAt: contract.renewalAt,
    billingPeriod: billingPeriod ?? "Mensal",
    status: contract.status,
    signerName: contract.signerName ?? "",
    witnessName: contract.witnessName ?? "",
    notes: contract.notes ?? "",
    contractText: contract.contractText ?? "",
  };
}

export function ContractCreateModal({
  open,
  contract,
  saving,
  onClose,
  onSubmit,
}: {
  open: boolean;
  contract?: Contract | null;
  saving: boolean;
  onClose: () => void;
  onSubmit: (values: ContractFormValues) => Promise<unknown>;
}) {
  const isEditing = Boolean(contract);
  const { data: clients = [] } = useQuery(clientsQueryOptions());
  const { data: products = [] } = useQuery(productsQueryOptions());
  const form = useForm<ContractFormValues>({
    resolver: zodResolver(contractFormSchema),
    defaultValues: contractToFormValues(contract),
  });
  const values = useWatch({ control: form.control });

  useEffect(() => {
    form.reset(contractToFormValues(contract));
  }, [contract, form, open]);

  const selectedClient = clients.find((client) => client.id === values.clientId);
  const selectedProduct = products.find((product) => product.id === values.productId);

  useEffect(() => {
    if (isEditing || !selectedProduct) return;
    const terms = normalizeProductTerms(selectedProduct);
    const current = form.getValues();
    if (Number(current.monthlyValue ?? 0) === 0) {
      form.setValue("monthlyValue", terms.monthlyFee || selectedProduct.basePrice, {
        shouldDirty: true,
        shouldValidate: true,
      });
    }
    if (Number(current.implementationValue ?? 0) === 0) {
      form.setValue("implementationValue", terms.implementationFee, {
        shouldDirty: true,
        shouldValidate: true,
      });
    }
  }, [form, isEditing, selectedProduct]);

  const draft = useMemo(() => {
    if (!selectedProduct) return "Selecione um produto para gerar a minuta.";

    return buildContractDraft(
      selectedProduct,
      {
        companyName: selectedClient?.legal || selectedClient?.name || "Cliente",
        document: selectedClient?.cnpj || "Documento",
        signerName: values.signerName || "Responsável pela assinatura",
        ...(values.witnessName ? { witnessName: values.witnessName } : {}),
      },
      {
        monthlyValue: Number(values.monthlyValue ?? 0),
        implementationValue: Number(values.implementationValue ?? 0),
        billingPeriod: values.billingPeriod,
        startsAt: values.startsAt,
        endsAt: values.endsAt,
        renewalAt: values.renewalAt,
      },
    );
  }, [
    selectedClient,
    selectedProduct,
    values.billingPeriod,
    values.endsAt,
    values.implementationValue,
    values.monthlyValue,
    values.renewalAt,
    values.signerName,
    values.startsAt,
    values.witnessName,
  ]);

  async function handleSubmit(values: ContractFormValues) {
    await onSubmit({ ...values, contractText: draft });
    if (!isEditing) form.reset(defaultValues);
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={isEditing ? "Editar contrato" : "Novo contrato"}
      description="Selecione cliente, produto e defina condições comerciais reais."
      size="xl"
    >
      <form
        className="grid gap-5 lg:grid-cols-[minmax(0,0.8fr)_minmax(420px,1fr)]"
        onSubmit={form.handleSubmit(handleSubmit)}
      >
        <input type="hidden" {...form.register("id")} />
        <div className="grid content-start gap-5">
          <section className="grid gap-4">
            <h3 className="text-sm font-semibold text-foreground">Contrato</h3>
            <Field label="Cliente">
              <Select {...form.register("clientId")}>
                <option value="">Selecione</option>
                {clients.map((client) => (
                  <option key={client.id} value={client.id}>
                    {client.name}
                  </option>
                ))}
              </Select>
              <FormError message={form.formState.errors.clientId?.message} />
            </Field>
            <Field label="Produto">
              <Select {...form.register("productId")}>
                <option value="">Selecione</option>
                {products.map((product) => (
                  <option key={product.id} value={product.id}>
                    {product.name}
                  </option>
                ))}
              </Select>
              <FormError message={form.formState.errors.productId?.message} />
            </Field>
            <Field label="Plano / nome do contrato">
              <Input placeholder="Plano contratado" {...form.register("name")} />
              <FormError message={form.formState.errors.name?.message} />
            </Field>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Valor mensal">
                <Input type="number" min={0} step="0.01" {...form.register("monthlyValue")} />
                <FormError message={form.formState.errors.monthlyValue?.message} />
              </Field>
              <Field label="Valor de implantação">
                <Input
                  type="number"
                  min={0}
                  step="0.01"
                  {...form.register("implementationValue")}
                />
                <FormError message={form.formState.errors.implementationValue?.message} />
              </Field>
              <Field label="Início">
                <Input type="date" {...form.register("startsAt")} />
                <FormError message={form.formState.errors.startsAt?.message} />
              </Field>
              <Field label="Vencimento">
                <Input type="date" {...form.register("endsAt")} />
                <FormError message={form.formState.errors.endsAt?.message} />
              </Field>
              <Field label="Renovação">
                <Input type="date" {...form.register("renewalAt")} />
                <FormError message={form.formState.errors.renewalAt?.message} />
              </Field>
              <Field label="Periodicidade">
                <Select {...form.register("billingPeriod")}>
                  {contractBillingPeriods.map((period) => (
                    <option key={period}>{period}</option>
                  ))}
                </Select>
                <FormError message={form.formState.errors.billingPeriod?.message} />
              </Field>
              <Field label="Status">
                <Select {...form.register("status")}>
                  {contractStatuses.map((status) => (
                    <option key={status}>{status}</option>
                  ))}
                </Select>
                <FormError message={form.formState.errors.status?.message} />
              </Field>
              <Field label="Responsável pela assinatura">
                <Input placeholder="Nome completo" {...form.register("signerName")} />
                <FormError message={form.formState.errors.signerName?.message} />
              </Field>
              <Field label="Testemunha">
                <Input placeholder="Opcional" {...form.register("witnessName")} />
                <FormError message={form.formState.errors.witnessName?.message} />
              </Field>
            </div>
            <Field label="Observações">
              <Textarea placeholder="Notas internas sobre o contrato" {...form.register("notes")} />
              <FormError message={form.formState.errors.notes?.message} />
            </Field>
          </section>

          <div className="flex justify-end gap-2">
            <Button type="button" variant="secondary" onClick={onClose}>
              Cancelar
            </Button>
            <Button
              type="submit"
              loading={saving}
              disabled={clients.length === 0 || products.length === 0}
            >
              <Save className="size-4" />
              {isEditing ? "Salvar alterações" : "Salvar contrato"}
            </Button>
          </div>
        </div>

        <section className="overflow-hidden rounded-card border border-border bg-background">
          <div className="border-b-4 border-primary bg-card p-5">
            <div className="flex items-start justify-between gap-4">
              <img src="/automy-logo-horizontal.svg" alt="Automy" className="h-10 w-auto" />
              <div className="text-right text-xs text-muted-foreground">
                <div>Contrato de prestação de serviços</div>
                <div>Minuta pré-preenchida</div>
              </div>
            </div>
            <div className="mt-5 grid gap-2 sm:grid-cols-4">
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <FileSignature className="size-4 text-primary" />
                Assinatura
              </div>
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <Building2 className="size-4 text-primary" />
                Contratante
              </div>
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <Users className="size-4 text-primary" />
                Usuários
              </div>
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <ShieldCheck className="size-4 text-primary" />
                LGPD
              </div>
            </div>
          </div>
          <div className="bg-white p-6 text-slate-950">
            <div className="mb-4 flex items-center gap-2 text-sm font-semibold text-blue-700">
              <BadgeCheck className="size-4" />
              Modelo Automy
            </div>
            <Textarea
              className="min-h-[620px] border-blue-100 bg-white font-mono text-xs leading-relaxed text-slate-900"
              value={draft}
              readOnly
              aria-label="Prévia do contrato"
            />
            <p className="mt-3 text-xs text-slate-500">
              A minuta deve ser revisada juridicamente antes de assinatura definitiva.
            </p>
          </div>
        </section>
      </form>
    </Modal>
  );
}

function FormError({ message }: { message: string | undefined }) {
  if (!message) return null;
  return <span className="text-xs font-normal text-destructive">{message}</span>;
}
