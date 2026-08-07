import { zodResolver } from "@hookform/resolvers/zod";
import { FileText, Save } from "lucide-react";
import { useEffect, useMemo } from "react";
import { Controller, useForm, useWatch } from "react-hook-form";
import { buildProductContractTemplate } from "@/features/contracts/utils/contract-template";
import type { Product } from "@/features/products/types";
import {
  productBillingModes,
  productCategories,
  productFormSchema,
  productStatuses,
  type ProductFormValues,
} from "@/features/products/validation";
import { CurrencyInput } from "@/shared/components/masked-inputs";
import { Button, Field, Input, Modal, Select, Textarea } from "@/shared/components/ui";

const defaultValues: ProductFormValues = {
  id: "",
  name: "",
  category: productCategories[0],
  version: "1.0",
  description: "",
  status: "Ativo",
  basePrice: 0,
  billingMode: productBillingModes[0],
  contractTemplate: "",
};

function productToFormValues(product: Product | null | undefined): ProductFormValues {
  if (!product) return defaultValues;

  return {
    id: product.id,
    name: product.name,
    category: product.category,
    version: product.version,
    description: product.description ?? "",
    status: product.status,
    basePrice: product.basePrice,
    billingMode: product.billingMode || productBillingModes[0],
    contractTemplate: product.contractTemplate ?? "",
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

  const generatedTemplate = useMemo(
    () =>
      buildProductContractTemplate({
        name: values.name || "Produto",
        category: values.category || productCategories[0],
        ...(values.description ? { description: values.description } : {}),
      }),
    [values.category, values.description, values.name],
  );

  async function handleSubmit(values: ProductFormValues) {
    await onSubmit({
      ...values,
      contractTemplate: values.contractTemplate?.trim() || generatedTemplate,
    });
    if (!isEditing) form.reset(defaultValues);
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={isEditing ? "Editar produto" : "Novo produto"}
      description="Cadastre apenas informações de catálogo e o modelo-base reutilizável."
      size="xl"
    >
      <form
        className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_minmax(360px,0.9fr)]"
        onSubmit={form.handleSubmit(handleSubmit)}
      >
        <input type="hidden" {...form.register("id")} />
        <div className="grid content-start gap-5">
          <section className="grid gap-4">
            <h3 className="text-sm font-semibold text-foreground">Catálogo</h3>
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
              <Field label="Preço-base de referência">
                <Controller
                  control={form.control}
                  name="basePrice"
                  render={({ field }) => (
                    <CurrencyInput value={Number(field.value ?? 0)} onChange={field.onChange} />
                  )}
                />
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
            <Field label="Contrato pré-moldado">
              <Textarea
                className="min-h-72 font-mono text-xs leading-relaxed"
                placeholder="Edite a minuta-base do produto. Condições comerciais serão preenchidas no contrato."
                {...form.register("contractTemplate")}
              />
              <FormError message={form.formState.errors.contractTemplate?.message} />
            </Field>
          </section>

          <div className="flex justify-end gap-2">
            <Button type="button" variant="secondary" onClick={onClose}>
              Cancelar
            </Button>
            <Button type="submit" loading={saving}>
              <Save className="size-4" />
              {isEditing ? "Salvar alterações" : "Salvar produto"}
            </Button>
          </div>
        </div>

        <aside className="grid content-start gap-3">
          <div className="flex items-center gap-2 text-sm font-semibold text-foreground">
            <FileText className="size-4 text-primary" />
            Modelo-base sugerido
          </div>
          <Textarea
            className="min-h-[520px] font-mono text-xs leading-relaxed"
            value={form.watch("contractTemplate") || generatedTemplate}
            readOnly
            aria-label="Prévia do contrato modelo"
          />
          <p className="text-xs text-muted-foreground">
            O Produto define a minuta-base. Valores, prazos, escopo e assinatura são congelados no
            Contrato.
          </p>
        </aside>
      </form>
    </Modal>
  );
}

function FormError({ message }: { message: string | undefined }) {
  if (!message) return null;
  return <span className="text-xs font-normal text-destructive">{message}</span>;
}
