import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Eye,
  PauseCircle,
  Pencil,
  PlayCircle,
  Plus,
  SlidersHorizontal,
  Trash2,
} from "lucide-react";
import { useMemo, useState } from "react";
import { productQueryKeys, productsQueryOptions } from "@/features/products/api/product.queries";
import { ProductCreateModal } from "@/features/products/components/product-create-modal";
import { productService } from "@/features/products/services/product.service";
import type { Product, ProductFilter } from "@/features/products/types";
import { productFormSchema, type ProductFormValues } from "@/features/products/validation";
import { DataTable, type DataTableColumn } from "@/shared/components/data-table";
import { EmptyState } from "@/shared/components/empty-state";
import { FilterBar } from "@/shared/components/filter-bar";
import { PageHeader } from "@/shared/components/page-header";
import { toast } from "@/shared/components/toast";
import { Badge, Button, Modal, Pagination, Select } from "@/shared/components/ui";
import { toneForStatus } from "@/shared/types/status";
import { formatCurrency } from "@/shared/utils/formatters";

const PAGE_SIZE = 10;

export function ProductsPage() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState<ProductFilter["status"]>("Todos");
  const [category, setCategory] = useState("Todas");
  const [page, setPage] = useState(1);
  const [modal, setModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [viewingProduct, setViewingProduct] = useState<Product | null>(null);
  const [deletingProduct, setDeletingProduct] = useState<Product | null>(null);
  const { data: products = [], error, isLoading } = useQuery(productsQueryOptions());

  const categories = useMemo(
    () => [
      "Todas",
      ...Array.from(new Set(products.map((product) => product.category).filter(Boolean))).sort(),
    ],
    [products],
  );
  const filtered = useMemo(
    () => productService.filterProducts(products, { search, status, category }),
    [category, products, search, status],
  );
  const pageCount = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const paginated = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const saveProduct = useMutation({
    mutationFn: async (values: ProductFormValues) => {
      const payload = productFormSchema.parse(values);
      return payload.id
        ? productService.updateProduct({ ...payload, id: payload.id })
        : productService.createProduct(payload);
    },
    onSuccess: async (product, values) => {
      await queryClient.invalidateQueries({ queryKey: productQueryKeys.all });
      toast.success(values.id ? "Produto atualizado." : "Produto criado.");
      setModal(false);
      setEditingProduct(null);
      setViewingProduct(product);
    },
    onError: (mutationError) => {
      toast.danger(
        mutationError instanceof Error
          ? mutationError.message
          : "Não foi possível salvar o produto.",
      );
    },
  });

  const updateStatus = useMutation({
    mutationFn: ({ product, active }: { product: Product; active: boolean }) =>
      active
        ? productService.activateProduct(product.id)
        : productService.inactivateProduct(product.id),
    onSuccess: async (_, variables) => {
      await queryClient.invalidateQueries({ queryKey: productQueryKeys.all });
      toast.success(variables.active ? "Produto ativado." : "Produto inativado.");
    },
    onError: (mutationError) => {
      toast.danger(
        mutationError instanceof Error
          ? mutationError.message
          : "Não foi possível atualizar o status.",
      );
    },
  });

  const deleteProduct = useMutation({
    mutationFn: (productId: string) => productService.removeProduct(productId),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: productQueryKeys.all });
      toast.success("Produto excluído logicamente.");
      setDeletingProduct(null);
    },
    onError: (mutationError) => {
      toast.danger(
        mutationError instanceof Error
          ? mutationError.message
          : "Não foi possível excluir o produto.",
      );
    },
  });

  const productColumns = useMemo<Array<DataTableColumn<Product>>>(
    () => [
      {
        key: "name",
        header: "Produto",
        cell: (product) => (
          <div className="min-w-0">
            <div className="truncate font-medium">{product.name}</div>
            {product.description && (
              <div className="max-w-xs truncate text-xs text-muted-foreground">
                {product.description}
              </div>
            )}
          </div>
        ),
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
        key: "basePrice",
        header: "Preço-base",
        cell: (product) => formatCurrency(product.basePrice),
      },
      {
        key: "billingMode",
        header: "Modalidade",
        cell: (product) => product.billingMode || "Não informado",
      },
      {
        key: "usage",
        header: "Uso",
        cell: (product) =>
          `${product.clients} cliente${product.clients === 1 ? "" : "s"} / ${product.contracts} contrato${product.contracts === 1 ? "" : "s"}`,
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
              aria-label={`Visualizar ${product.name}`}
              onClick={() => setViewingProduct(product)}
            >
              <Eye className="size-4" />
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              aria-label={`Editar ${product.name}`}
              onClick={() => {
                setEditingProduct(product);
                setModal(true);
              }}
            >
              <Pencil className="size-4" />
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              loading={updateStatus.isPending}
              aria-label={product.status === "Ativo" ? "Inativar produto" : "Ativar produto"}
              onClick={() => updateStatus.mutate({ product, active: product.status !== "Ativo" })}
            >
              {product.status === "Ativo" ? (
                <PauseCircle className="size-4" />
              ) : (
                <PlayCircle className="size-4" />
              )}
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              aria-label={`Excluir ${product.name}`}
              onClick={() => setDeletingProduct(product)}
            >
              <Trash2 className="size-4" />
            </Button>
          </div>
        ),
        cellClassName: "text-right",
      },
    ],
    [updateStatus],
  );

  return (
    <div>
      <PageHeader
        title="Produtos"
        description="Gerencie o portfólio de soluções oferecidas aos clientes."
        action={
          <Button
            onClick={() => {
              setEditingProduct(null);
              setModal(true);
            }}
          >
            <Plus className="size-4" />
            Novo produto
          </Button>
        }
      />
      <FilterBar
        search={search}
        onSearchChange={(value) => {
          setSearch(value);
          setPage(1);
        }}
        searchPlaceholder="Buscar produto..."
        className="sm:items-center"
      >
        <div className="flex flex-wrap items-center gap-2">
          <SlidersHorizontal className="size-4 text-muted-foreground" />
          <Select
            value={status}
            onChange={(event) => {
              setStatus(event.target.value as ProductFilter["status"]);
              setPage(1);
            }}
          >
            <option>Todos</option>
            <option>Ativo</option>
            <option>Beta</option>
            <option>Inativo</option>
            <option>Descontinuando</option>
          </Select>
          <Select
            value={category}
            onChange={(event) => {
              setCategory(event.target.value);
              setPage(1);
            }}
          >
            {categories.map((item) => (
              <option key={item}>{item}</option>
            ))}
          </Select>
        </div>
      </FilterBar>
      <DataTable
        columns={productColumns}
        data={paginated}
        getRowKey={(product) => product.id}
        loading={isLoading}
        error={error}
        emptyState={
          <EmptyState
            title="Nenhum produto cadastrado"
            description="Produtos reais aparecerão aqui quando forem cadastrados."
          />
        }
        footer={
          <Pagination
            label={`${filtered.length} produto${filtered.length === 1 ? "" : "s"} • página ${page} de ${pageCount}`}
            page={page}
            pageCount={pageCount}
            onPageChange={setPage}
          />
        }
      />
      <ProductCreateModal
        open={modal}
        product={editingProduct}
        saving={saveProduct.isPending}
        onClose={() => {
          setModal(false);
          setEditingProduct(null);
        }}
        onSubmit={(values) => saveProduct.mutateAsync(values)}
      />
      <ProductViewModal product={viewingProduct} onClose={() => setViewingProduct(null)} />
      <Modal
        open={Boolean(deletingProduct)}
        onClose={() => setDeletingProduct(null)}
        title="Excluir produto"
        description="A exclusão é lógica e preserva vínculos históricos para auditoria."
      >
        <div className="grid gap-5">
          <p className="text-sm text-muted-foreground">
            Confirme a exclusão de {deletingProduct?.name}. O produto deixará de aparecer nas
            listagens operacionais.
          </p>
          <div className="flex justify-end gap-2">
            <Button type="button" variant="secondary" onClick={() => setDeletingProduct(null)}>
              Cancelar
            </Button>
            <Button
              type="button"
              variant="danger"
              loading={deleteProduct.isPending}
              onClick={() => deletingProduct && deleteProduct.mutate(deletingProduct.id)}
            >
              <Trash2 className="size-4" />
              Excluir produto
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}

function ProductViewModal({ product, onClose }: { product: Product | null; onClose: () => void }) {
  return (
    <Modal open={Boolean(product)} onClose={onClose} title="Detalhes do produto" size="lg">
      {product && (
        <div className="grid gap-5">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h3 className="text-lg font-semibold text-foreground">{product.name}</h3>
              <p className="text-sm text-muted-foreground">
                {product.description || "Sem descrição"}
              </p>
            </div>
            <Badge tone={toneForStatus(product.status)}>{product.status}</Badge>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <Info label="Categoria" value={product.category} />
            <Info label="Versão" value={product.version} />
            <Info label="Preço-base" value={formatCurrency(product.basePrice)} />
            <Info label="Modalidade" value={product.billingMode || "Não informado"} />
            <Info label="Clientes vinculados" value={String(product.clients)} />
            <Info label="Contratos vinculados" value={String(product.contracts)} />
          </div>
          <div>
            <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
              Observações
            </p>
            <p className="mt-2 rounded-card border border-border bg-muted/30 p-4 text-sm text-foreground">
              {product.notes || "Nenhuma observação cadastrada."}
            </p>
          </div>
        </div>
      )}
    </Modal>
  );
}

function Info({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-card border border-border bg-card p-4">
      <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{label}</p>
      <p className="mt-2 text-sm font-medium text-foreground">{value || "Não informado"}</p>
    </div>
  );
}
