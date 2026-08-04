import { useQuery } from "@tanstack/react-query";
import { CalendarCheck, CircleDollarSign, CreditCard, TriangleAlert } from "lucide-react";
import { useMemo, useState } from "react";
import { chargesQueryOptions } from "@/features/finance/api/finance.queries";
import { financeService } from "@/features/finance/services/finance.service";
import type { Charge, ChargeFilter } from "@/features/finance/types";
import { DataTable, type DataTableColumn } from "@/shared/components/data-table";
import { EmptyState } from "@/shared/components/empty-state";
import { FilterBar } from "@/shared/components/filter-bar";
import { MetricCard } from "@/shared/components/metric-card";
import { PageHeader } from "@/shared/components/page-header";
import { Badge, Select } from "@/shared/components/ui";
import { toneForStatus } from "@/shared/types/status";
import { formatCurrency } from "@/shared/utils/formatters";

const chargeColumns: Array<DataTableColumn<Charge>> = [
  {
    key: "invoice",
    header: "Fatura",
    cell: (charge) => <span className="font-mono text-xs">{charge.invoice}</span>,
  },
  {
    key: "client",
    header: "Cliente",
    cell: (charge) => <span className="font-medium">{charge.client}</span>,
  },
  { key: "due", header: "Vencimento", cell: (charge) => charge.due },
  {
    key: "value",
    header: "Valor",
    cell: (charge) => <span className="font-medium">{charge.value}</span>,
  },
  { key: "method", header: "Método", cell: (charge) => charge.method },
  {
    key: "status",
    header: "Status",
    cell: (charge) => <Badge tone={toneForStatus(charge.status)}>{charge.status}</Badge>,
  },
];

export function FinancePage() {
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState<ChargeFilter["status"]>("Todos");
  const { data: charges = [], error, isLoading } = useQuery(chargesQueryOptions());
  const rows = useMemo(
    () => financeService.filterCharges(charges, { search, status }),
    [charges, search, status],
  );

  return (
    <div>
      <PageHeader
        title="Financeiro"
        description="Visão consolidada da receita, inadimplência e recebimentos."
      />
      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <MetricCard
          label="Receita mensal"
          value={formatCurrency(0)}
          helper="sem registros financeiros"
          icon={CircleDollarSign}
          loading={isLoading}
        />
        <MetricCard
          label="Receita anual"
          value={formatCurrency(0)}
          helper="sem registros financeiros"
          icon={CreditCard}
          loading={isLoading}
        />
        <MetricCard
          label="Clientes inadimplentes"
          value="0"
          positive={false}
          helper="sem cobranças vencidas"
          icon={TriangleAlert}
          loading={isLoading}
        />
        <MetricCard
          label="Recebimentos previstos"
          value={formatCurrency(0)}
          helper="sem cobranças previstas"
          icon={CalendarCheck}
          loading={isLoading}
        />
      </section>
      <FilterBar
        search={search}
        onSearchChange={setSearch}
        searchPlaceholder="Buscar cobrança..."
        className="mt-7"
      >
        <Select
          value={status}
          onChange={(event) => setStatus(event.target.value as ChargeFilter["status"])}
        >
          <option>Todos</option>
          <option>Pago</option>
          <option>Pendente</option>
          <option>Atrasado</option>
        </Select>
      </FilterBar>
      <DataTable
        columns={chargeColumns}
        data={rows}
        getRowKey={(charge) => charge.id}
        loading={isLoading}
        error={error}
        emptyState={
          <EmptyState
            title="Nenhuma cobrança encontrada"
            description="Cobranças reais aparecerão aqui quando o módulo financeiro for integrado."
          />
        }
      />
    </div>
  );
}
