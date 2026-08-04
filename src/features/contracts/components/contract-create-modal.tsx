import { useQuery, useQueryClient } from "@tanstack/react-query";
import { BadgeCheck, Building2, FileSignature, Save, ShieldCheck, Users } from "lucide-react";
import { useMemo, useState, type FormEvent } from "react";
import { contractsQueryOptions } from "@/features/contracts/api/contract.queries";
import { contractService } from "@/features/contracts/services/contract.service";
import { buildContractDraft } from "@/features/contracts/utils/contract-template";
import { productsQueryOptions } from "@/features/products/api/product.queries";
import { Button, Checkbox, Field, Input, Modal, Select, Textarea } from "@/shared/components/ui";
import { toast } from "@/shared/components/toast";

export function ContractCreateModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const queryClient = useQueryClient();
  const { data: products = [] } = useQuery(productsQueryOptions());
  const [saving, setSaving] = useState(false);
  const [productId, setProductId] = useState("");
  const [companyName, setCompanyName] = useState("");
  const [document, setDocument] = useState("");
  const [signerName, setSignerName] = useState("");
  const [hasWitness, setHasWitness] = useState(false);
  const [witnessName, setWitnessName] = useState("");

  const selectedProduct = products.find((product) => product.id === productId) ?? products[0];
  const selectedProductId = productId || selectedProduct?.id || "";
  const draft = useMemo(() => {
    if (!selectedProduct) {
      return "Cadastre um produto primeiro para gerar o contrato pré-preenchido.";
    }

    return buildContractDraft(selectedProduct, {
      companyName: companyName || "Razão social da contratante",
      document: document || "CNPJ da contratante",
      signerName: signerName || "Responsável pela assinatura",
      witnessName: hasWitness ? witnessName || "Nome da testemunha" : undefined,
    });
  }, [companyName, document, hasWitness, selectedProduct, signerName, witnessName]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!selectedProductId) {
      toast.warning("Cadastre um produto antes de gerar o contrato.");
      return;
    }

    try {
      setSaving(true);
      await contractService.createContract({
        productId: selectedProductId,
        companyName,
        document,
        signerName,
        hasWitness,
        witnessName,
        contractText: draft,
      });
      await queryClient.invalidateQueries({ queryKey: contractsQueryOptions().queryKey });
      toast.success("Contrato gerado e salvo.");
      onClose();
    } catch (error) {
      toast.danger(error instanceof Error ? error.message : "Não foi possível salvar o contrato.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Novo contrato"
      description="Selecione o produto e complete apenas os dados da contratante."
      size="xl"
    >
      <form className="grid gap-5 lg:grid-cols-[minmax(0,0.8fr)_minmax(420px,1fr)]" onSubmit={handleSubmit}>
        <div className="grid content-start gap-5">
          <section className="grid gap-4">
            <h3 className="text-sm font-semibold text-foreground">Produto vendido</h3>
            <Field label="Sistema/produto">
              <Select
                value={selectedProductId}
                onChange={(event) => setProductId(event.target.value)}
                required
              >
                {products.length === 0 && <option value="">Cadastre um produto primeiro</option>}
                {products.map((product) => (
                  <option key={product.id} value={product.id}>
                    {product.name}
                  </option>
                ))}
              </Select>
            </Field>
          </section>

          <section className="grid gap-4">
            <h3 className="text-sm font-semibold text-foreground">Contratante</h3>
            <Field label="Nome da empresa vendida">
              <Input
                required
                value={companyName}
                onChange={(event) => setCompanyName(event.target.value)}
                placeholder="Razão social"
              />
            </Field>
            <Field label="CNPJ">
              <Input
                required
                value={document}
                onChange={(event) => setDocument(event.target.value)}
                placeholder="00.000.000/0000-00"
              />
            </Field>
            <Field label="Responsável pela assinatura">
              <Input
                required
                value={signerName}
                onChange={(event) => setSignerName(event.target.value)}
                placeholder="Nome completo"
              />
            </Field>
            <label className="flex items-center gap-2 text-sm text-foreground">
              <Checkbox checked={hasWitness} onChange={(event) => setHasWitness(event.target.checked)} />
              Tem testemunha
            </label>
            {hasWitness && (
              <Field label="Nome da testemunha">
                <Input
                  required
                  value={witnessName}
                  onChange={(event) => setWitnessName(event.target.value)}
                  placeholder="Nome completo da testemunha"
                />
              </Field>
            )}
          </section>

          <div className="flex justify-end gap-2">
            <Button type="button" variant="secondary" onClick={onClose}>
              Cancelar
            </Button>
            <Button loading={saving} disabled={!selectedProductId}>
              <Save className="size-4" />
              Salvar contrato
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

