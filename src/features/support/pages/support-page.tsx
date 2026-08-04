import { Plus } from "lucide-react";
import { useMemo, useState } from "react";
import { supportService } from "@/features/support/services/support.service";
import type { Ticket, TicketFilter } from "@/features/support/types";
import { DataTable, type DataTableColumn } from "@/shared/components/data-table";
import { FilterBar } from "@/shared/components/filter-bar";
import { PageHeader } from "@/shared/components/page-header";
import { Badge, Button, Select } from "@/shared/components/ui";
import { toneForStatus } from "@/shared/types/status";

const ticketColumns: Array<DataTableColumn<Ticket>> = [
  {
    key: "ticket",
    header: "Ticket",
    cell: (ticket) => (
      <>
        <div className="font-mono text-xs text-primary">{ticket.id}</div>
        <div className="mt-1 max-w-xs truncate font-medium">{ticket.title}</div>
      </>
    ),
  },
  { key: "client", header: "Cliente", cell: (ticket) => ticket.client },
  {
    key: "priority",
    header: "Prioridade",
    cell: (ticket) => <Badge tone={toneForStatus(ticket.priority)}>{ticket.priority}</Badge>,
  },
  { key: "owner", header: "Responsável", cell: (ticket) => ticket.owner },
  {
    key: "status",
    header: "Status",
    cell: (ticket) => <Badge tone={toneForStatus(ticket.status)}>{ticket.status}</Badge>,
  },
  { key: "date", header: "Data", cell: (ticket) => ticket.date },
];

export function SupportPage() {
  const [search, setSearch] = useState("");
  const [priority, setPriority] = useState<TicketFilter["priority"]>("Todas");
  const tickets = supportService.getTicketsSnapshot();
  const rows = useMemo(
    () => supportService.filterTickets(tickets, { search, priority }),
    [tickets, search, priority],
  );

  return (
    <div>
      <PageHeader
        title="Suporte"
        description="Priorize chamados e acompanhe o trabalho da equipe."
        action={
          <Button>
            <Plus className="size-4" />
            Novo ticket
          </Button>
        }
      />
      <FilterBar search={search} onSearchChange={setSearch} searchPlaceholder="Buscar ticket...">
        <Select
          value={priority}
          onChange={(event) => setPriority(event.target.value as TicketFilter["priority"])}
        >
          <option>Todas</option>
          <option>Crítica</option>
          <option>Alta</option>
          <option>Média</option>
          <option>Baixa</option>
        </Select>
      </FilterBar>
      <DataTable columns={ticketColumns} data={rows} getRowKey={(ticket) => ticket.id} />
    </div>
  );
}
