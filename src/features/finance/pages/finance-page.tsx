import { CalendarCheck, CircleDollarSign, CreditCard, TriangleAlert } from "lucide-react";
import { useMemo, useState } from "react";
import { financeService } from "@/features/finance/services/finance.service";
import type { Charge, ChargeFilter } from "@/features/finance/types";
import { DataTable, type DataTableColumn } from "@/shared/components/data-table";
import { FilterBar } from "@/shared/components/filter-bar";
import { MetricCard } from "@/shared/components/metric-card";
import { PageHeader } from "@/shared/components/page-header";
import { Badge, Select } from "@/shared/components/ui";
import { toneForStatus } from "@/shared/types/status";

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
  const charges = financeService.getChargesSnapshot();
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
          value="R$ 428 mil"
          change="6,4%"
          helper="vs. mês anterior"
          icon={CircleDollarSign}
        />
        <MetricCard
          label="Receita anual"
          value="R$ 4,8 mi"
          change="12,1%"
          helper="vs. ano anterior"
          icon={CreditCard}
        />
        <MetricCard
          label="Clientes inadimplentes"
          value="4"
          change="1 cliente"
          positive={false}
          helper="este mês"
          icon={TriangleAlert}
        />
        <MetricCard
          label="Recebimentos previstos"
          value="R$ 186 mil"
          helper="próximos 15 dias"
          icon={CalendarCheck}
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
      <DataTable columns={chargeColumns} data={rows} getRowKey={(charge) => charge.invoice} />
    </div>
  );
}
