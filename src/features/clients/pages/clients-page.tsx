import { Link } from "@tanstack/react-router";
import { Eye, Plus, SlidersHorizontal } from "lucide-react";
import { useMemo, useState } from "react";
import { ClientCreateModal } from "@/features/clients/components/client-create-modal";
import { clientService } from "@/features/clients/services/client.service";
import type { Client, ClientFilter } from "@/features/clients/types";
import { DataTable, type DataTableColumn } from "@/shared/components/data-table";
import { FilterBar } from "@/shared/components/filter-bar";
import { PageHeader } from "@/shared/components/page-header";
import { Badge, Button, Select } from "@/shared/components/ui";
import { toneForStatus } from "@/shared/types/status";

const clientColumns: Array<DataTableColumn<Client>> = [
  {
    key: "client",
    header: "Cliente",
    cell: (client) => (
      <div className="flex items-center gap-3">
        <div className="grid size-9 place-items-center rounded-lg bg-accent text-xs font-semibold">
          {client.initials}
        </div>
        <span className="font-medium">{client.name}</span>
      </div>
    ),
  },
  {
    key: "legal",
    header: "Razão social / CNPJ",
    cell: (client) => (
      <div>
        <div>{client.legal}</div>
        <div className="text-xs text-muted-foreground">{client.cnpj}</div>
      </div>
    ),
  },
  { key: "location", header: "Localização", cell: (client) => `${client.city}, ${client.state}` },
  { key: "owner", header: "Responsável", cell: (client) => client.owner },
  { key: "plan", header: "Plano", cell: (client) => client.plan },
  {
    key: "status",
    header: "Status",
    cell: (client) => <Badge tone={toneForStatus(client.status)}>{client.status}</Badge>,
  },
  { key: "joined", header: "Cadastro", cell: (client) => client.joined },
  {
    key: "actions",
    header: <span className="sr-only">Ações</span>,
    cell: (client) => (
      <Link
        to="/clientes/$clienteId"
        params={{ clienteId: client.id }}
        aria-label={`Visualizar ${client.name}`}
        className="grid size-8 place-items-center rounded-lg text-muted-foreground hover:bg-accent hover:text-foreground"
      >
        <Eye className="size-4" />
      </Link>
    ),
  },
];

export function ClientsPage() {
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState<ClientFilter["status"]>("Todos");
  const [modal, setModal] = useState(false);
  const clients = clientService.getClientsSnapshot();
  const filtered = useMemo(
    () => clientService.filterClients(clients, { search, status }),
    [clients, search, status],
  );

  return (
    <div>
      <PageHeader
        title="Clientes"
        description="Gerencie empresas, planos e relacionamentos da sua carteira."
        action={
          <Button onClick={() => setModal(true)}>
            <Plus className="size-4" />
            Novo cliente
          </Button>
        }
      />
      <FilterBar
        search={search}
        onSearchChange={setSearch}
        searchPlaceholder="Buscar cliente ou CNPJ..."
        className="sm:items-center"
      >
        <div className="flex items-center gap-2">
          <SlidersHorizontal className="size-4 text-muted-foreground" />
          <Select
            value={status}
            onChange={(event) => setStatus(event.target.value as ClientFilter["status"])}
          >
            <option>Todos</option>
            <option>Ativo</option>
            <option>Implantação</option>
            <option>Pendente</option>
          </Select>
        </div>
      </FilterBar>
      <DataTable columns={clientColumns} data={filtered} getRowKey={(client) => client.id} />
      <ClientCreateModal open={modal} onClose={() => setModal(false)} />
    </div>
  );
}
