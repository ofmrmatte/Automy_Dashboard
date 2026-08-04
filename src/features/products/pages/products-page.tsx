import { useQuery } from "@tanstack/react-query";
import { Plus } from "lucide-react";
import { useMemo, useState } from "react";
import { productsQueryOptions } from "@/features/products/api/product.queries";
import { ProductCreateModal } from "@/features/products/components/product-create-modal";
import { productService } from "@/features/products/services/product.service";
import type { Product } from "@/features/products/types";
import { DataTable, type DataTableColumn } from "@/shared/components/data-table";
import { EmptyState } from "@/shared/components/empty-state";
import { FilterBar } from "@/shared/components/filter-bar";
import { PageHeader } from "@/shared/components/page-header";
import { Badge, Button } from "@/shared/components/ui";
import { toneForStatus } from "@/shared/types/status";

const productColumns: Array<DataTableColumn<Product>> = [
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
];

export function ProductsPage() {
  const [search, setSearch] = useState("");
  const [open, setOpen] = useState(false);
  const { data: products = [], error, isLoading } = useQuery(productsQueryOptions());
  const rows = useMemo(
    () => productService.filterProducts(products, { search }),
    [products, search],
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
    </div>
  );
}
