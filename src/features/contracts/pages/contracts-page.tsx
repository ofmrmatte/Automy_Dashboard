import { FileText, Plus } from "lucide-react";
import { useMemo, useState } from "react";
import { contractService } from "@/features/contracts/services/contract.service";
import type { Contract, ContractFilter } from "@/features/contracts/types";
import { DataTable, type DataTableColumn } from "@/shared/components/data-table";
import { FilterBar } from "@/shared/components/filter-bar";
import { PageHeader } from "@/shared/components/page-header";
import { Badge, Button, Select } from "@/shared/components/ui";
import { toneForStatus } from "@/shared/types/status";

const contractColumns: Array<DataTableColumn<Contract>> = [
  {
    key: "client",
    header: "Cliente",
    cell: (contract) => (
      <div className="flex items-center gap-3">
        <div className="grid size-8 place-items-center rounded-lg bg-accent">
          <FileText className="size-4" />
        </div>
        <span className="font-medium">{contract.client}</span>
      </div>
    ),
  },
  { key: "plan", header: "Plano", cell: (contract) => contract.plan },
  {
    key: "value",
    header: "Valor mensal",
    cell: (contract) => <span className="font-medium">{contract.value}</span>,
  },
  { key: "start", header: "Início", cell: (contract) => contract.start },
  { key: "renewal", header: "Renovação", cell: (contract) => contract.renewal },
  {
    key: "status",
    header: "Status",
    cell: (contract) => <Badge tone={toneForStatus(contract.status)}>{contract.status}</Badge>,
  },
];

export function ContractsPage() {
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState<ContractFilter["status"]>("Todos");
  const contracts = contractService.getContractsSnapshot();
  const rows = useMemo(
    () => contractService.filterContracts(contracts, { search, status }),
    [contracts, search, status],
  );

  return (
    <div>
      <PageHeader
        title="Contratos"
        description="Acompanhe valores, vigências e renovações da carteira."
        action={
          <Button>
            <Plus className="size-4" />
            Novo contrato
          </Button>
        }
      />
      <FilterBar search={search} onSearchChange={setSearch} searchPlaceholder="Buscar contrato...">
        <Select
          value={status}
          onChange={(event) => setStatus(event.target.value as ContractFilter["status"])}
        >
          <option>Todos</option>
          <option>Ativo</option>
          <option>Implantação</option>
          <option>Renovação</option>
          <option>Pendente</option>
        </Select>
      </FilterBar>
      <DataTable columns={contractColumns} data={rows} getRowKey={(contract) => contract.client} />
    </div>
  );
}
