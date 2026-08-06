import { zodResolver } from "@hookform/resolvers/zod";
import { FileText, Save } from "lucide-react";
import { useEffect, useMemo } from "react";
import { useForm, useWatch } from "react-hook-form";
import {
  buildProductContractTemplate,
  normalizeProductTerms,
} from "@/features/contracts/utils/contract-template";
import type { Product, ProductCommercialTerms } from "@/features/products/types";
import {
  productBillingModes,
  productCategories,
  productFormSchema,
  productStatuses,
  type ProductFormValues,
} from "@/features/products/validation";
import { Button, Checkbox, Field, Input, Modal, Select, Textarea } from "@/shared/components/ui";

const paymentMethods = ["Boleto à vista", "Boleto parcelado", "Pix", "Pix + boleto", "Cartão"];

const defaultValues: ProductFormValues = {
  id: "",
  name: "",
  category: productCategories[0],
  version: "1.0",
  description: "",
  status: "Ativo",
  basePrice: 0,
  billingMode: productBillingModes[0],
  notes: "",
  hostedOnAutomyUrl: true,
  customUrl: false,
  userLimit: 5,
  segment: "",
  implementationDays: 30,
  implementationFee: 0,
  paymentMethod: paymentMethods[0] ?? "Boleto à vista",
  installments: 1,
  discountPercent: 0,
  hasMonthlyFee: true,
  monthlyFee: 0,
  hasDatabaseCost: false,
  databaseCost: 0,
  extraUserPrice: 0,
  loyaltyMonths: 12,
  deliverables:
    "Implantação, configuração do sistema, treinamento inicial, suporte operacional e ajustes previstos na proposta.",
  contractTemplate: "",
};

function productToFormValues(product: Product | null | undefined): ProductFormValues {
  if (!product) return defaultValues;

  const terms = normalizeProductTerms(product);

  return {
    id: product.id,
    name: product.name,
    category: product.category,
    version: product.version,
    description: product.description ?? "",
    status: product.status,
    basePrice: product.basePrice,
    billingMode: product.billingMode || productBillingModes[0],
    notes: product.notes ?? "",
    hostedOnAutomyUrl: terms.hostedOnAutomyUrl,
    customUrl: terms.customUrl,
    userLimit: terms.userLimit,
    segment: terms.segment,
    implementationDays: terms.implementationDays,
    implementationFee: terms.implementationFee,
    paymentMethod: terms.paymentMethod,
    installments: terms.installments,
    discountPercent: terms.discountPercent,
    hasMonthlyFee: terms.hasMonthlyFee,
    monthlyFee: terms.monthlyFee,
    hasDatabaseCost: terms.hasDatabaseCost,
    databaseCost: terms.databaseCost,
    extraUserPrice: terms.extraUserPrice,
    loyaltyMonths: terms.loyaltyMonths,
    deliverables: terms.deliverables,
    contractTemplate: product.contractTemplate ?? "",
  };
}

function buildTerms(values: ProductFormValues): ProductCommercialTerms {
  return {
    hostedOnAutomyUrl: Boolean(values.hostedOnAutomyUrl),
    customUrl: Boolean(values.customUrl),
    userLimit: Number(values.userLimit || 0),
    segment: values.segment || values.category,
    implementationDays: Number(values.implementationDays || 0),
    implementationFee: Number(values.implementationFee || 0),
    paymentMethod: values.paymentMethod,
    installments: Number(values.installments || 1),
    discountPercent: Number(values.discountPercent || 0),
    hasMonthlyFee: Boolean(values.hasMonthlyFee),
    monthlyFee: Number(values.monthlyFee || 0),
    hasDatabaseCost: Boolean(values.hasDatabaseCost),
    databaseCost: Number(values.databaseCost || 0),
    extraUserPrice: Number(values.extraUserPrice || 0),
    loyaltyMonths: Number(values.loyaltyMonths || 0),
    deliverables: values.deliverables,
  };
}

export function ProductCreateModal({
  open,
  product,
  saving,
  onClose,
  onSubmit,
}: {
  open: boolean;
  product?: Product | null;
  saving: boolean;
  onClose: () => void;
  onSubmit: (values: ProductFormValues) => Promise<unknown>;
}) {
  const isEditing = Boolean(product);
  const form = useForm<ProductFormValues>({
    resolver: zodResolver(productFormSchema),
    defaultValues: productToFormValues(product),
  });
  const values = useWatch({ control: form.control });

  useEffect(() => {
    form.reset(productToFormValues(product));
  }, [form, open, product]);

  const preview = useMemo(() => {
    const nextValues = { ...defaultValues, ...values };

    return buildProductContractTemplate({
      name: nextValues.name || "Produto",
      category: nextValues.category || productCategories[0],
      ...(nextValues.description ? { description: nextValues.description } : {}),
      commercialTerms: buildTerms(nextValues),
    });
  }, [values]);

  async function handleSubmit(values: ProductFormValues) {
    const contractTemplate = buildProductContractTemplate({
      name: values.name,
      category: values.category,
      ...(values.description ? { description: values.description } : {}),
      commercialTerms: buildTerms(values),
    });

    await onSubmit({ ...values, contractTemplate });
    if (!isEditing) form.reset(defaultValues);
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={isEditing ? "Editar produto" : "Novo produto"}
      description="Cadastre produtos reais, termos comerciais e modelo operacional de contrato."
      size="xl"
    >
      <form
        className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_minmax(360px,0.9fr)]"
        onSubmit={form.handleSubmit(handleSubmit)}
      >
        <input type="hidden" {...form.register("id")} />
        <div className="grid gap-5">
          <section className="grid gap-4">
            <h3 className="text-sm font-semibold text-foreground">Produto</h3>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Nome">
                <Input placeholder="Nome do produto" {...form.register("name")} />
                <FormError message={form.formState.errors.name?.message} />
              </Field>
              <Field label="Versão">
                <Input placeholder="1.0" {...form.register("version")} />
                <FormError message={form.formState.errors.version?.message} />
              </Field>
              <Field label="Categoria">
                <Select {...form.register("category")}>
                  {productCategories.map((item) => (
                    <option key={item}>{item}</option>
                  ))}
                </Select>
                <FormError message={form.formState.errors.category?.message} />
              </Field>
              <Field label="Status">
                <Select {...form.register("status")}>
                  {productStatuses.map((status) => (
                    <option key={status}>{status}</option>
                  ))}
                </Select>
                <FormError message={form.formState.errors.status?.message} />
              </Field>
              <Field label="Preço-base">
                <Input type="number" min={0} step="0.01" {...form.register("basePrice")} />
                <FormError message={form.formState.errors.basePrice?.message} />
              </Field>
              <Field label="Modalidade">
                <Select {...form.register("billingMode")}>
                  {productBillingModes.map((mode) => (
                    <option key={mode}>{mode}</option>
                  ))}
                </Select>
                <FormError message={form.formState.errors.billingMode?.message} />
              </Field>
            </div>
            <Field label="Descrição">
              <Textarea
                placeholder="Resumo da solução, público atendido e operação coberta."
                {...form.register("description")}
              />
              <FormError message={form.formState.errors.description?.message} />
            </Field>
            <Field label="Observações">
              <Textarea
                placeholder="Notas internas sobre comercialização, implantação ou operação."
                {...form.register("notes")}
              />
              <FormError message={form.formState.errors.notes?.message} />
            </Field>
            <div className="grid gap-3 sm:grid-cols-2">
              <label className="flex items-center gap-2 text-sm text-foreground">
                <Checkbox {...form.register("hostedOnAutomyUrl")} />
                Hospedado em URL da Automy
              </label>
              <label className="flex items-center gap-2 text-sm text-foreground">
                <Checkbox {...form.register("customUrl")} />
                Terá personalização de URL
              </label>
            </div>
          </section>

          <section className="grid gap-4">
            <h3 className="text-sm font-semibold text-foreground">Cobrança e implantação</h3>
            <div className="grid gap-4 sm:grid-cols-3">
              <Field label="Limite de usuários">
                <Input type="number" min={1} {...form.register("userLimit")} />
                <FormError message={form.formState.errors.userLimit?.message} />
              </Field>
              <Field label="Prazo de implantação">
                <Input type="number" min={1} {...form.register("implementationDays")} />
                <FormError message={form.formState.errors.implementationDays?.message} />
              </Field>
              <Field label="Valor da implantação">
                <Input type="number" min={0} step="0.01" {...form.register("implementationFee")} />
                <FormError message={form.formState.errors.implementationFee?.message} />
              </Field>
              <Field label="Forma de pagamento">
                <Select {...form.register("paymentMethod")}>
                  {paymentMethods.map((item) => (
                    <option key={item}>{item}</option>
                  ))}
                </Select>
                <FormError message={form.formState.errors.paymentMethod?.message} />
              </Field>
              <Field label="Parcelas">
                <Input type="number" min={1} {...form.register("installments")} />
                <FormError message={form.formState.errors.installments?.message} />
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
              <Field label="Mensalidade">
                <Input type="number" min={0} step="0.01" {...form.register("monthlyFee")} />
                <FormError message={form.formState.errors.monthlyFee?.message} />
              </Field>
              <Field label="Custo por banco">
                <Input type="number" min={0} step="0.01" {...form.register("databaseCost")} />
                <FormError message={form.formState.errors.databaseCost?.message} />
              </Field>
              <Field label="Valor por usuário extra">
                <Input type="number" min={0} step="0.01" {...form.register("extraUserPrice")} />
                <FormError message={form.formState.errors.extraUserPrice?.message} />
              </Field>
              <Field label="Fidelidade (meses)">
                <Input type="number" min={0} {...form.register("loyaltyMonths")} />
                <FormError message={form.formState.errors.loyaltyMonths?.message} />
              </Field>
              <Field label="Segmento">
                <Input placeholder="Segmento comercial" {...form.register("segment")} />
                <FormError message={form.formState.errors.segment?.message} />
              </Field>
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <label className="flex items-center gap-2 text-sm text-foreground">
                <Checkbox {...form.register("hasMonthlyFee")} />
                Tem mensalidade
              </label>
              <label className="flex items-center gap-2 text-sm text-foreground">
                <Checkbox {...form.register("hasDatabaseCost")} />
                Tem custo por banco de dados
              </label>
            </div>
          </section>

          <Field label="Entregas">
            <Textarea {...form.register("deliverables")} />
            <FormError message={form.formState.errors.deliverables?.message} />
          </Field>
        </div>

        <aside className="grid gap-3">
          <div className="flex items-center gap-2 text-sm font-semibold text-foreground">
            <FileText className="size-4 text-primary" />
            Contrato pré-moldado
          </div>
          <Textarea
            className="min-h-[620px] font-mono text-xs leading-relaxed"
            value={preview}
            readOnly
            aria-label="Prévia do contrato modelo"
          />
          <p className="text-xs text-muted-foreground">
            Modelo operacional sujeito a revisão jurídica antes do uso definitivo.
          </p>
          <div className="flex justify-end gap-2">
            <Button type="button" variant="secondary" onClick={onClose}>
              Cancelar
            </Button>
            <Button type="submit" loading={saving}>
              <Save className="size-4" />
              {isEditing ? "Salvar alterações" : "Salvar produto"}
            </Button>
          </div>
        </aside>
      </form>
    </Modal>
  );
}

function FormError({ message }: { message: string | undefined }) {
  if (!message) return null;
  return <span className="text-xs font-normal text-destructive">{message}</span>;
}
