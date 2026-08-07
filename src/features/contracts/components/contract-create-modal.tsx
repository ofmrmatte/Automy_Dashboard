import { zodResolver } from "@hookform/resolvers/zod";
import { BadgeCheck, Building2, FileSignature, Save, ShieldCheck, Users } from "lucide-react";
import { useEffect, useMemo, type ReactNode } from "react";
import { Controller, type Control, useForm, useWatch } from "react-hook-form";
import type { Contract } from "@/features/contracts/types";
import {
  buildContractDraft,
  normalizeProductTerms,
} from "@/features/contracts/utils/contract-template";
import {
  contractBillingPeriods,
  contractFormSchema,
  contractPaymentMethods,
  contractStatuses,
  type ContractFormValues,
} from "@/features/contracts/validation";
import { clientsQueryOptions } from "@/features/clients/api/client.queries";
import { productsQueryOptions } from "@/features/products/api/product.queries";
import { useQuery } from "@tanstack/react-query";
import { CurrencyInput, DocumentInput } from "@/shared/components/masked-inputs";
import { Button, Checkbox, Field, Input, Modal, Select, Textarea } from "@/shared/components/ui";

const defaultValues: ContractFormValues = {
  id: "",
  clientId: "",
  productId: "",
  name: "",
  description: "",
  scope: "",
  deliverables: "",
  includedUsers: 1,
  additionalUsers: 0,
  additionalUserAmount: 0,
  hostedByAutomy: true,
  customUrlEnabled: false,
  implementationDays: 0,
  databaseCost: 0,
  databaseQuantity: 0,
  operationalNotes: "",
  basePriceReference: 0,
  monthlyValue: 0,
  implementationValue: 0,
  discountPercent: 0,
  paymentMethod: "Boleto",
  installmentsCount: 1,
  firstDueInDays: 30,
  installmentIntervalDays: 30,
  installmentDueDays: [],
  specificDueDates: [],
  loyaltyMonths: 0,
  currency: "BRL",
  startsAt: new Date().toISOString().slice(0, 10),
  endsAt: "",
  renewalAt: "",
  billingPeriod: "Mensal",
  status: "Pendente",
  signerName: "",
  signerDocument: "",
  signerEmail: "",
  signerPhone: "",
  automyRepresentative: "",
  witnessName: "",
  witnessDocument: "",
  notes: "",
  contractText: "",
};

function contractToFormValues(contract: Contract | null | undefined): ContractFormValues {
  if (!contract) return defaultValues;
  const billingPeriod = contractBillingPeriods.find((period) => period === contract.billingPeriod);
  const paymentMethod = contractPaymentMethods.find((method) => method === contract.paymentMethod);

  return {
    id: contract.id,
    clientId: contract.clientId,
    productId: contract.productId,
    name: contract.plan,
    description: contract.description ?? "",
    scope: contract.scope ?? "",
    deliverables: contract.deliverables ?? "",
    includedUsers: contract.includedUsers,
    additionalUsers: contract.additionalUsers,
    additionalUserAmount: contract.additionalUserAmount,
    hostedByAutomy: contract.hostedByAutomy,
    customUrlEnabled: contract.customUrlEnabled,
    implementationDays: contract.implementationDays,
    databaseCost: contract.databaseCost,
    databaseQuantity: contract.databaseQuantity,
    operationalNotes: contract.operationalNotes ?? "",
    basePriceReference: contract.basePriceReference,
    monthlyValue: contract.monthlyValue,
    implementationValue: contract.implementationValue,
    discountPercent: contract.discountPercent,
    paymentMethod: paymentMethod ?? "Boleto",
    installmentsCount: contract.installmentsCount,
    firstDueInDays: contract.paymentTerms?.firstDueInDays ?? 30,
    installmentIntervalDays: contract.paymentTerms?.intervalDays ?? 30,
    installmentDueDays: contract.installmentDueDays,
    specificDueDates: contract.paymentTerms?.specificDates ?? [],
    loyaltyMonths: contract.loyaltyMonths,
    currency: contract.currency,
    startsAt: contract.startsAt,
    endsAt: contract.endsAt,
    renewalAt: contract.renewalAt,
    billingPeriod: billingPeriod ?? "Mensal",
    status: contract.status,
    signerName: contract.signerName ?? "",
    signerDocument: contract.signerDocument ?? "",
    signerEmail: contract.signerEmail ?? "",
    signerPhone: contract.signerPhone ?? "",
    automyRepresentative: contract.automyRepresentative ?? "",
    witnessName: contract.witnessName ?? "",
    witnessDocument: contract.witnessDocument ?? "",
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
    if (Number(current.basePriceReference ?? 0) === 0) {
      form.setValue("basePriceReference", selectedProduct.basePrice, { shouldDirty: true });
    }
    if (Number(current.monthlyValue ?? 0) === 0) {
      form.setValue("monthlyValue", terms.monthlyFee || selectedProduct.basePrice, {
        shouldDirty: true,
        shouldValidate: true,
      });
    }
    if (Number(current.implementationValue ?? 0) === 0) {
      form.setValue("implementationValue", terms.implementationFee ?? 0, {
        shouldDirty: true,
        shouldValidate: true,
      });
    }
    if (!current.deliverables) {
      form.setValue("deliverables", terms.deliverables ?? "", { shouldDirty: true });
    }
    if (!current.scope) {
      form.setValue("scope", selectedProduct.description ?? "", { shouldDirty: true });
    }
    if (Number(current.includedUsers ?? 1) === 1 && terms.userLimit) {
      form.setValue("includedUsers", terms.userLimit, { shouldDirty: true });
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
        signerDocument: values.signerDocument,
        signerEmail: values.signerEmail,
        signerPhone: values.signerPhone,
        witnessName: values.witnessName,
        witnessDocument: values.witnessDocument,
      },
      {
        description: values.description,
        scope: values.scope,
        deliverables: values.deliverables,
        includedUsers: Number(values.includedUsers ?? 1),
        additionalUsers: Number(values.additionalUsers ?? 0),
        additionalUserAmount: Number(values.additionalUserAmount ?? 0),
        hostedByAutomy: Boolean(values.hostedByAutomy),
        customUrlEnabled: Boolean(values.customUrlEnabled),
        implementationDays: Number(values.implementationDays ?? 0),
        implementationValue: Number(values.implementationValue ?? 0),
        databaseCost: Number(values.databaseCost ?? 0),
        databaseQuantity: Number(values.databaseQuantity ?? 0),
        basePriceReference: Number(values.basePriceReference ?? 0),
        monthlyValue: Number(values.monthlyValue ?? 0),
        discountPercent: Number(values.discountPercent ?? 0),
        paymentMethod: values.paymentMethod,
        installmentsCount: Number(values.installmentsCount ?? 1),
        installmentDueDays: Array.isArray(values.installmentDueDays)
          ? values.installmentDueDays
          : [],
        billingPeriod: values.billingPeriod,
        loyaltyMonths: Number(values.loyaltyMonths ?? 0),
        currency: values.currency,
        startsAt: values.startsAt,
        endsAt: values.endsAt,
        renewalAt: values.renewalAt,
      },
    );
  }, [selectedClient, selectedProduct, values]);

  async function handleSubmit(values: ContractFormValues) {
    await onSubmit({ ...values, contractText: draft });
    if (!isEditing) form.reset(defaultValues);
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={isEditing ? "Editar contrato" : "Novo contrato"}
      description="Defina cliente, produto e condições comerciais efetivamente negociadas."
      size="xl"
    >
      <form
        className="grid gap-5 lg:grid-cols-[minmax(0,0.9fr)_minmax(420px,1fr)]"
        onSubmit={form.handleSubmit(handleSubmit)}
      >
        <input type="hidden" {...form.register("id")} />
        <div className="grid content-start gap-5">
          <section className="grid gap-4">
            <h3 className="text-sm font-semibold text-foreground">Cliente e produto</h3>
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
            <Field label="Descrição">
              <Textarea
                placeholder="Descrição comercial do contrato"
                {...form.register("description")}
              />
              <FormError message={form.formState.errors.description?.message} />
            </Field>
          </section>

          <section className="grid gap-4">
            <h3 className="text-sm font-semibold text-foreground">Escopo do serviço</h3>
            <Field label="Escopo">
              <Textarea placeholder="Escopo resumido contratado" {...form.register("scope")} />
              <FormError message={form.formState.errors.scope?.message} />
            </Field>
            <Field label="Entregáveis">
              <Textarea placeholder="Entregas negociadas" {...form.register("deliverables")} />
              <FormError message={form.formState.errors.deliverables?.message} />
            </Field>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Limite de usuários">
                <Input type="number" min={1} {...form.register("includedUsers")} />
                <FormError message={form.formState.errors.includedUsers?.message} />
              </Field>
              <Field label="Usuários adicionais">
                <Input type="number" min={0} {...form.register("additionalUsers")} />
                <FormError message={form.formState.errors.additionalUsers?.message} />
              </Field>
              <Field label="Valor por usuário adicional">
                <MoneyController control={form.control} name="additionalUserAmount" />
                <FormError message={form.formState.errors.additionalUserAmount?.message} />
              </Field>
              <Field label="Prazo de implantação">
                <Input type="number" min={0} {...form.register("implementationDays")} />
                <FormError message={form.formState.errors.implementationDays?.message} />
              </Field>
              <Field label="Custo por banco">
                <MoneyController control={form.control} name="databaseCost" />
                <FormError message={form.formState.errors.databaseCost?.message} />
              </Field>
              <Field label="Quantidade de bancos">
                <Input type="number" min={0} {...form.register("databaseQuantity")} />
                <FormError message={form.formState.errors.databaseQuantity?.message} />
              </Field>
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <label className="flex min-h-11 items-center gap-2 text-sm text-foreground">
                <Checkbox {...form.register("hostedByAutomy")} />
                Hospedagem em URL Automy
              </label>
              <label className="flex min-h-11 items-center gap-2 text-sm text-foreground">
                <Checkbox {...form.register("customUrlEnabled")} />
                Personalização de URL
              </label>
            </div>
          </section>

          <section className="grid gap-4">
            <h3 className="text-sm font-semibold text-foreground">Condições comerciais</h3>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Preço-base de referência">
                <MoneyController control={form.control} name="basePriceReference" />
                <FormError message={form.formState.errors.basePriceReference?.message} />
              </Field>
              <Field label="Valor mensal">
                <MoneyController control={form.control} name="monthlyValue" />
                <FormError message={form.formState.errors.monthlyValue?.message} />
              </Field>
              <Field label="Valor de implantação">
                <MoneyController control={form.control} name="implementationValue" />
                <FormError message={form.formState.errors.implementationValue?.message} />
              </Field>
              <Field label="Desconto (%)">
                <Input
                  type="number"
                  min={0}
                  max={100}
                  step="0.01"
                  {...form.register("discountPercent")}
                />
                <FormError message={form.formState.errors.discountPercent?.message} />
              </Field>
              <Field label="Forma de pagamento">
                <Select {...form.register("paymentMethod")}>
                  {contractPaymentMethods.map((method) => (
                    <option key={method}>{method}</option>
                  ))}
                </Select>
                <FormError message={form.formState.errors.paymentMethod?.message} />
              </Field>
              <Field label="Parcelas">
                <Input type="number" min={1} {...form.register("installmentsCount")} />
                <FormError message={form.formState.errors.installmentsCount?.message} />
              </Field>
              <Field label="Primeira parcela em dias">
                <Input type="number" min={0} {...form.register("firstDueInDays")} />
                <FormError message={form.formState.errors.firstDueInDays?.message} />
              </Field>
              <Field label="Intervalo entre parcelas">
                <Input type="number" min={1} {...form.register("installmentIntervalDays")} />
                <FormError message={form.formState.errors.installmentIntervalDays?.message} />
              </Field>
              <Field label="Vencimentos em dias">
                <Input placeholder="30, 60, 90" {...form.register("installmentDueDays")} />
                <FormError message={form.formState.errors.installmentDueDays?.message} />
              </Field>
              <Field label="Periodicidade">
                <Select {...form.register("billingPeriod")}>
                  {contractBillingPeriods.map((period) => (
                    <option key={period}>{period}</option>
                  ))}
                </Select>
                <FormError message={form.formState.errors.billingPeriod?.message} />
              </Field>
              <Field label="Fidelidade (meses)">
                <Input type="number" min={0} {...form.register("loyaltyMonths")} />
                <FormError message={form.formState.errors.loyaltyMonths?.message} />
              </Field>
              <Field label="Moeda">
                <Input maxLength={3} {...form.register("currency")} />
                <FormError message={form.formState.errors.currency?.message} />
              </Field>
            </div>
          </section>

          <section className="grid gap-4">
            <h3 className="text-sm font-semibold text-foreground">Datas e assinatura</h3>
            <div className="grid gap-4 sm:grid-cols-2">
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
              <Field label="Documento do responsável">
                <Controller
                  control={form.control}
                  name="signerDocument"
                  render={({ field }) => (
                    <DocumentInput value={field.value} onChange={field.onChange} />
                  )}
                />
                <FormError message={form.formState.errors.signerDocument?.message} />
              </Field>
              <Field label="E-mail do responsável">
                <Input type="email" {...form.register("signerEmail")} />
                <FormError message={form.formState.errors.signerEmail?.message} />
              </Field>
              <Field label="Telefone do responsável">
                <Input {...form.register("signerPhone")} />
                <FormError message={form.formState.errors.signerPhone?.message} />
              </Field>
              <Field label="Representante da Automy">
                <Input {...form.register("automyRepresentative")} />
                <FormError message={form.formState.errors.automyRepresentative?.message} />
              </Field>
              <Field label="Testemunha">
                <Input placeholder="Opcional" {...form.register("witnessName")} />
                <FormError message={form.formState.errors.witnessName?.message} />
              </Field>
              <Field label="Documento da testemunha">
                <Controller
                  control={form.control}
                  name="witnessDocument"
                  render={({ field }) => (
                    <DocumentInput value={field.value} onChange={field.onChange} />
                  )}
                />
                <FormError message={form.formState.errors.witnessDocument?.message} />
              </Field>
            </div>
            <Field label="Observações operacionais">
              <Textarea {...form.register("operationalNotes")} />
              <FormError message={form.formState.errors.operationalNotes?.message} />
            </Field>
            <Field label="Notas internas">
              <Textarea placeholder="Notas internas sobre o contrato" {...form.register("notes")} />
              <FormError message={form.formState.errors.notes?.message} />
            </Field>
          </section>

          <div className="sticky bottom-0 flex justify-end gap-2 border-t border-border bg-background py-4">
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
                <div>Minuta independente do produto</div>
              </div>
            </div>
            <div className="mt-5 grid gap-2 sm:grid-cols-4">
              <PreviewChip
                icon={<FileSignature className="size-4 text-primary" />}
                label="Assinatura"
              />
              <PreviewChip
                icon={<Building2 className="size-4 text-primary" />}
                label="Contratante"
              />
              <PreviewChip icon={<Users className="size-4 text-primary" />} label="Usuários" />
              <PreviewChip icon={<ShieldCheck className="size-4 text-primary" />} label="LGPD" />
            </div>
          </div>
          <div className="bg-white p-6 text-slate-950">
            <div className="mb-4 flex items-center gap-2 text-sm font-semibold text-blue-700">
              <BadgeCheck className="size-4" />
              Minuta do contrato
            </div>
            <Textarea
              className="min-h-[720px] border-blue-100 bg-white font-mono text-xs leading-relaxed text-slate-900"
              value={draft}
              readOnly
              aria-label="Prévia do contrato"
            />
            <p className="mt-3 text-xs text-slate-500">
              O PDF usa estes dados congelados no contrato e remove assinatura textual duplicada.
            </p>
          </div>
        </section>
      </form>
    </Modal>
  );
}

function MoneyController({
  control,
  name,
}: {
  control: Control<ContractFormValues>;
  name:
    | "additionalUserAmount"
    | "databaseCost"
    | "basePriceReference"
    | "monthlyValue"
    | "implementationValue";
}) {
  return (
    <Controller
      control={control}
      name={name}
      render={({ field }) => (
        <CurrencyInput value={Number(field.value ?? 0)} onChange={field.onChange} />
      )}
    />
  );
}

function PreviewChip({ icon, label }: { icon: ReactNode; label: string }) {
  return (
    <div className="flex items-center gap-2 text-xs text-muted-foreground">
      {icon}
      {label}
    </div>
  );
}

function FormError({ message }: { message: string | undefined }) {
  if (!message) return null;
  return <span className="text-xs font-normal text-destructive">{message}</span>;
}
