import { useQueryClient } from "@tanstack/react-query";
import { FileText, Save } from "lucide-react";
import { useMemo, useState } from "react";
import { productQueryKeys } from "@/features/products/api/product.queries";
import { productService } from "@/features/products/services/product.service";
import type { ProductCommercialTerms } from "@/features/products/types";
import { buildProductContractTemplate } from "@/features/contracts/utils/contract-template";
import { Button, Checkbox, Field, Input, Modal, Select, Textarea } from "@/shared/components/ui";
import { toast } from "@/shared/components/toast";

const categories = [
  "Logística",
  "WhatsApp",
  "Automação",
  "CRM",
  "Financeiro",
  "Atendimento",
  "Analytics",
  "Operacional",
  "Outra ferramenta",
];

const paymentMethods = ["Boleto à vista", "Boleto parcelado", "Pix", "Pix + boleto", "Cartão"];

function numberValue(formData: FormData, key: string) {
  return Number(formData.get(key) || 0);
}

function checkboxValue(formData: FormData, key: string) {
  return formData.get(key) === "on";
}

export function ProductCreateModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const queryClient = useQueryClient();
  const [saving, setSaving] = useState(false);
  const [name, setName] = useState("");
  const [category, setCategory] = useState(categories[0] ?? "Logística");
  const [description, setDescription] = useState("");
  const [deliverables, setDeliverables] = useState(
    "Implantação, configuração do sistema, treinamento inicial, suporte operacional e ajustes previstos na proposta.",
  );
  const [hostedOnAutomyUrl, setHostedOnAutomyUrl] = useState(true);
  const [customUrl, setCustomUrl] = useState(false);
  const [hasMonthlyFee, setHasMonthlyFee] = useState(true);
  const [hasDatabaseCost, setHasDatabaseCost] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState(paymentMethods[0] ?? "Boleto à vista");

  const preview = useMemo(
    () =>
      buildProductContractTemplate({
        name: name || "Nome do sistema",
        category,
        description,
        commercialTerms: {
          hostedOnAutomyUrl,
          customUrl,
          userLimit: 5,
          segment: category,
          implementationDays: 30,
          implementationFee: 0,
          paymentMethod,
          installments: paymentMethod === "Boleto parcelado" ? 3 : 1,
          discountPercent: 0,
          hasMonthlyFee,
          monthlyFee: 0,
          hasDatabaseCost,
          databaseCost: 0,
          extraUserPrice: 0,
          loyaltyMonths: 12,
          deliverables,
        },
      }),
    [
      category,
      customUrl,
      deliverables,
      description,
      hasDatabaseCost,
      hasMonthlyFee,
      hostedOnAutomyUrl,
      name,
      paymentMethod,
    ],
  );

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const terms: ProductCommercialTerms = {
      hostedOnAutomyUrl: checkboxValue(formData, "hostedOnAutomyUrl"),
      customUrl: checkboxValue(formData, "customUrl"),
      userLimit: numberValue(formData, "userLimit"),
      segment: String(formData.get("category") || category),
      implementationDays: numberValue(formData, "implementationDays"),
      implementationFee: numberValue(formData, "implementationFee"),
      paymentMethod: String(formData.get("paymentMethod") || paymentMethod),
      installments: numberValue(formData, "installments") || 1,
      discountPercent: numberValue(formData, "discountPercent"),
      hasMonthlyFee: checkboxValue(formData, "hasMonthlyFee"),
      monthlyFee: numberValue(formData, "monthlyFee"),
      hasDatabaseCost: checkboxValue(formData, "hasDatabaseCost"),
      databaseCost: numberValue(formData, "databaseCost"),
      extraUserPrice: numberValue(formData, "extraUserPrice"),
      loyaltyMonths: numberValue(formData, "loyaltyMonths"),
      deliverables: String(formData.get("deliverables") || deliverables),
    };
    const productName = String(formData.get("name") || "").trim();
    const productCategory = String(formData.get("category") || category);
    const productDescription = String(formData.get("description") || "");
    const contractTemplate = buildProductContractTemplate({
      name: productName,
      category: productCategory,
      description: productDescription,
      commercialTerms: terms,
    });

    try {
      setSaving(true);
      await productService.createProduct({
        name: productName,
        category: productCategory,
        version: String(formData.get("version") || "1.0"),
        description: productDescription,
        commercialTerms: terms,
        contractTemplate,
      });
      await queryClient.invalidateQueries({ queryKey: productQueryKeys.all });
      toast.success("Produto e modelo de contrato salvos.");
      onClose();
    } catch (error) {
      toast.danger(error instanceof Error ? error.message : "Não foi possível salvar o produto.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Novo produto"
      description="Cadastre o sistema e gere o contrato padrão usado nas vendas."
      size="xl"
    >
      <form
        className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_minmax(360px,0.9fr)]"
        onSubmit={handleSubmit}
      >
        <div className="grid gap-5">
          <section className="grid gap-4">
            <h3 className="text-sm font-semibold text-foreground">Sistema</h3>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Nome do produto ou sistema">
                <Input
                  name="name"
                  required
                  value={name}
                  onChange={(event) => setName(event.target.value)}
                />
              </Field>
              <Field label="Versão">
                <Input name="version" defaultValue="1.0" />
              </Field>
              <Field label="Categoria">
                <Select
                  name="category"
                  value={category}
                  onChange={(event) => setCategory(event.target.value)}
                >
                  {categories.map((item) => (
                    <option key={item}>{item}</option>
                  ))}
                </Select>
              </Field>
              <Field label="Limite de usuários incluídos">
                <Input name="userLimit" type="number" min={1} defaultValue={5} />
              </Field>
            </div>
            <Field label="Descrição do sistema">
              <Textarea
                name="description"
                value={description}
                onChange={(event) => setDescription(event.target.value)}
                placeholder="Resumo da ferramenta, público e operação atendida."
              />
            </Field>
            <div className="grid gap-3 sm:grid-cols-2">
              <label className="flex items-center gap-2 text-sm text-foreground">
                <Checkbox
                  name="hostedOnAutomyUrl"
                  checked={hostedOnAutomyUrl}
                  onChange={(event) => setHostedOnAutomyUrl(event.target.checked)}
                />
                Hospedado em URL da Automy
              </label>
              <label className="flex items-center gap-2 text-sm text-foreground">
                <Checkbox
                  name="customUrl"
                  checked={customUrl}
                  onChange={(event) => setCustomUrl(event.target.checked)}
                />
                Terá personalização de URL
              </label>
            </div>
          </section>

          <section className="grid gap-4">
            <h3 className="text-sm font-semibold text-foreground">Cobrança e implantação</h3>
            <div className="grid gap-4 sm:grid-cols-3">
              <Field label="Prazo de implantação">
                <Input name="implementationDays" type="number" min={1} defaultValue={30} />
              </Field>
              <Field label="Valor da implantação">
                <Input
                  name="implementationFee"
                  type="number"
                  min={0}
                  step="0.01"
                  defaultValue={0}
                />
              </Field>
              <Field label="Forma de pagamento">
                <Select
                  name="paymentMethod"
                  value={paymentMethod}
                  onChange={(event) => setPaymentMethod(event.target.value)}
                >
                  {paymentMethods.map((item) => (
                    <option key={item}>{item}</option>
                  ))}
                </Select>
              </Field>
              <Field label="Parcelas">
                <Input
                  name="installments"
                  type="number"
                  min={1}
                  defaultValue={paymentMethod === "Boleto parcelado" ? 3 : 1}
                />
              </Field>
              <Field label="Desconto (%)">
                <Input
                  name="discountPercent"
                  type="number"
                  min={0}
                  max={100}
                  step="0.01"
                  defaultValue={0}
                />
              </Field>
              <Field label="Fidelidade (meses)">
                <Input name="loyaltyMonths" type="number" min={0} defaultValue={12} />
              </Field>
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <label className="flex items-center gap-2 text-sm text-foreground">
                <Checkbox
                  name="hasMonthlyFee"
                  checked={hasMonthlyFee}
                  onChange={(event) => setHasMonthlyFee(event.target.checked)}
                />
                Tem mensalidade
              </label>
              <label className="flex items-center gap-2 text-sm text-foreground">
                <Checkbox
                  name="hasDatabaseCost"
                  checked={hasDatabaseCost}
                  onChange={(event) => setHasDatabaseCost(event.target.checked)}
                />
                Tem custo por banco de dados
              </label>
            </div>
            <div className="grid gap-4 sm:grid-cols-3">
              <Field label="Mensalidade">
                <Input name="monthlyFee" type="number" min={0} step="0.01" defaultValue={0} />
              </Field>
              <Field label="Custo por banco">
                <Input name="databaseCost" type="number" min={0} step="0.01" defaultValue={0} />
              </Field>
              <Field label="Valor por usuário extra">
                <Input name="extraUserPrice" type="number" min={0} step="0.01" defaultValue={0} />
              </Field>
            </div>
          </section>

          <Field label="O que esse sistema entrega">
            <Textarea
              name="deliverables"
              value={deliverables}
              onChange={(event) => setDeliverables(event.target.value)}
            />
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
            <Button loading={saving}>
              <Save className="size-4" />
              Salvar produto
            </Button>
          </div>
        </aside>
      </form>
    </Modal>
  );
}
