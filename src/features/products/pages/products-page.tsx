import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Pause, Pencil, Plus, Save, Trash2 } from "lucide-react";
import { useCallback, useMemo, useState, type FormEvent } from "react";
import { productQueryKeys, productsQueryOptions } from "@/features/products/api/product.queries";
import { ProductCreateModal } from "@/features/products/components/product-create-modal";
import { productService } from "@/features/products/services/product.service";
import type { Product, ProductStatus } from "@/features/products/types";
import { DataTable, type DataTableColumn } from "@/shared/components/data-table";
import { EmptyState } from "@/shared/components/empty-state";
import { FilterBar } from "@/shared/components/filter-bar";
import { PageHeader } from "@/shared/components/page-header";
import { Badge, Button, Field, Input, Modal, Select } from "@/shared/components/ui";
import { toast } from "@/shared/components/toast";
import { toneForStatus } from "@/shared/types/status";

export function ProductsPage() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Product | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);
  const { data: products = [], error, isLoading } = useQuery(productsQueryOptions());
  const rows = useMemo(
    () => productService.filterProducts(products, { search }),
    [products, search],
  );

  const pauseProduct = useCallback(
    async (product: Product) => {
      try {
        setBusyId(`${product.id}:pause`);
        await productService.pauseProduct(product.id);
        await queryClient.invalidateQueries({ queryKey: productQueryKeys.all });
        toast.success("Produto pausado.");
      } catch (error) {
        toast.danger(error instanceof Error ? error.message : "Não foi possível pausar.");
      } finally {
        setBusyId(null);
      }
    },
    [queryClient],
  );

  const removeProduct = useCallback(
    async (product: Product) => {
      const confirmed = window.confirm(`Excluir o produto "${product.name}"?`);
      if (!confirmed) return;

      try {
        setBusyId(`${product.id}:delete`);
        await productService.removeProduct(product.id);
        await queryClient.invalidateQueries({ queryKey: productQueryKeys.all });
        toast.success("Produto excluído.");
      } catch (error) {
        toast.danger(error instanceof Error ? error.message : "Não foi possível excluir.");
      } finally {
        setBusyId(null);
      }
    },
    [queryClient],
  );

  const productColumns = useMemo<Array<DataTableColumn<Product>>>(
    () => [
      {
        key: "name",
        header: "Nome",
        cell: (product) => <div className="font-medium">{product.name}</div>,
      },
      { key: "category", header: "Categoria", cell: (product) => product.category },
      {
        key: "version",
        header: "Versão",
        cell: (product) => (
          <code className="rounded bg-muted px-2 py-1 text-xs">{product.version}</code>
        ),
      },
      {
        key: "clients",
        header: "Clientes utilizando",
        cell: (product) => `${product.clients} clientes`,
      },
      {
        key: "status",
        header: "Status",
        cell: (product) => <Badge tone={toneForStatus(product.status)}>{product.status}</Badge>,
      },
      {
        key: "actions",
        header: <span className="sr-only">Ações</span>,
        cell: (product) => (
          <div className="flex justify-end gap-1">
            <Button
              type="button"
              variant="ghost"
              size="icon"
              aria-label={`Editar ${product.name}`}
              onClick={() => setEditing(product)}
            >
              <Pencil className="size-4" />
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              loading={busyId === `${product.id}:pause`}
              aria-label={`Pausar ${product.name}`}
              onClick={() => pauseProduct(product)}
            >
              <Pause className="size-4" />
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              loading={busyId === `${product.id}:delete`}
              aria-label={`Excluir ${product.name}`}
              onClick={() => removeProduct(product)}
            >
              <Trash2 className="size-4" />
            </Button>
          </div>
        ),
        cellClassName: "text-right",
      },
    ],
    [busyId, pauseProduct, removeProduct],
  );

  return (
    <div>
      <PageHeader
        title="Produtos"
        description="Gerencie o portfólio de soluções oferecidas aos clientes."
        action={
          <Button onClick={() => setOpen(true)}>
            <Plus className="size-4" />
            Novo produto
          </Button>
        }
      />
      <FilterBar
        search={search}
        onSearchChange={setSearch}
        searchPlaceholder="Buscar produto..."
        className="mb-4"
      />
      <DataTable
        columns={productColumns}
        data={rows}
        getRowKey={(product) => product.id}
        loading={isLoading}
        error={error}
        emptyState={
          <EmptyState
            title="Nenhum produto cadastrado"
            description="Produtos reais aparecerão aqui quando forem cadastrados."
          />
        }
      />
      <ProductCreateModal open={open} onClose={() => setOpen(false)} />
      <ProductEditModal product={editing} onClose={() => setEditing(null)} />
    </div>
  );
}

function ProductEditModal({ product, onClose }: { product: Product | null; onClose: () => void }) {
  const queryClient = useQueryClient();
  const [saving, setSaving] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!product) return;

    const formData = new FormData(event.currentTarget);
    try {
      setSaving(true);
      await productService.updateProduct({
        id: product.id,
        name: String(formData.get("name") || "").trim(),
        category: String(formData.get("category") || "").trim(),
        version: String(formData.get("version") || "").trim(),
        status: String(formData.get("status") || "Ativo") as ProductStatus,
      });
      await queryClient.invalidateQueries({ queryKey: productQueryKeys.all });
      toast.success("Produto atualizado.");
      onClose();
    } catch (error) {
      toast.danger(error instanceof Error ? error.message : "Não foi possível atualizar.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <Modal open={Boolean(product)} onClose={onClose} title="Editar produto" size="lg">
      {product && (
        <form className="grid gap-4" onSubmit={handleSubmit}>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Nome">
              <Input name="name" required defaultValue={product.name} />
            </Field>
            <Field label="Categoria">
              <Input name="category" required defaultValue={product.category} />
            </Field>
            <Field label="Versão">
              <Input name="version" required defaultValue={product.version} />
            </Field>
            <Field label="Status">
              <Select name="status" defaultValue={product.status}>
                <option>Ativo</option>
                <option>Beta</option>
                <option>Descontinuando</option>
              </Select>
            </Field>
          </div>
          <div className="flex justify-end gap-2">
            <Button type="button" variant="secondary" onClick={onClose}>
              Cancelar
            </Button>
            <Button loading={saving}>
              <Save className="size-4" />
              Salvar alterações
            </Button>
          </div>
        </form>
      )}
    </Modal>
  );
}
