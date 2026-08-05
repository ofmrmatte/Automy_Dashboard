import { Link } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Edit3, Eye, PauseCircle, PlayCircle, Plus, SlidersHorizontal, Trash2 } from "lucide-react";
import { useMemo, useState } from "react";
import { clientsQueryOptions, clientQueryKeys } from "@/features/clients/api/client.queries";
import { ClientCreateModal } from "@/features/clients/components/client-create-modal";
import { clientService } from "@/features/clients/services/client.service";
import type { Client, ClientFilter } from "@/features/clients/types";
import { clientFormSchema, type ClientFormValues } from "@/features/clients/validation";
import { DataTable, type DataTableColumn } from "@/shared/components/data-table";
import { EmptyState } from "@/shared/components/empty-state";
import { FilterBar } from "@/shared/components/filter-bar";
import { PageHeader } from "@/shared/components/page-header";
import { toast } from "@/shared/components/toast";
import { Badge, Button, Modal, Pagination, Select } from "@/shared/components/ui";
import { toneForStatus } from "@/shared/types/status";

const PAGE_SIZE = 10;

function clientToFormValues(client: Client, status = client.status): ClientFormValues {
  return {
    id: client.id,
    tradeName: client.name,
    legalName: client.legal,
    document: client.cnpj,
    stateRegistration: client.stateRegistration,
    municipalRegistration: client.municipalRegistration,
    segment: client.segment,
    email: client.email,
    phone: client.phone,
    website: client.website,
    notes: client.notes,
    logoUrl: client.logoUrl,
    owner: client.owner,
    ownerEmail: client.ownerEmail,
    ownerPhone: client.ownerPhone,
    plan: client.plan,
    status,
    postalCode: client.address.postalCode,
    street: client.address.street,
    number: client.address.number,
    complement: client.address.complement,
    district: client.address.district,
    city: client.address.city || client.city,
    state: client.address.state || client.state,
    country: client.address.country || "BR",
  };
}

export function ClientsPage() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState<ClientFilter["status"]>("Todos");
  const [page, setPage] = useState(1);
  const [modal, setModal] = useState(false);
  const [editingClient, setEditingClient] = useState<Client | null>(null);
  const [deletingClient, setDeletingClient] = useState<Client | null>(null);
  const { data: clients = [], error, isLoading } = useQuery(clientsQueryOptions());

  const filtered = useMemo(
    () => clientService.filterClients(clients, { search, status }),
    [clients, search, status],
  );
  const pageCount = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const paginated = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const saveClient = useMutation({
    mutationFn: async (values: ClientFormValues) => {
      const payload = clientFormSchema.parse(values);
      return payload.id ? clientService.updateClient(payload) : clientService.createClient(payload);
    },
    onSuccess: async (client, values) => {
      await queryClient.invalidateQueries({ queryKey: clientQueryKeys.all });
      await queryClient.invalidateQueries({ queryKey: clientQueryKeys.detail(client.id) });
      toast.success(values.id ? "Cliente atualizado." : "Cliente criado.");
      setModal(false);
      setEditingClient(null);
    },
    onError: (mutationError) => {
      toast.danger(
        mutationError instanceof Error
          ? mutationError.message
          : "Não foi possível salvar o cliente.",
      );
    },
  });

  const deleteClient = useMutation({
    mutationFn: (clientId: string) => clientService.deleteClient(clientId),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: clientQueryKeys.all });
      toast.success("Cliente excluído logicamente.");
      setDeletingClient(null);
    },
    onError: (mutationError) => {
      toast.danger(
        mutationError instanceof Error
          ? mutationError.message
          : "Não foi possível excluir o cliente.",
      );
    },
  });

  async function updateStatus(client: Client, nextStatus: Client["status"]) {
    try {
      await saveClient.mutateAsync(clientToFormValues(client, nextStatus));
    } catch {
      // A mutação já publica o toast de erro.
    }
  }

  const clientColumns: Array<DataTableColumn<Client>> = [
    {
      key: "client",
      header: "Cliente",
      cell: (client) => (
        <div className="flex items-center gap-3">
          <div className="grid size-9 place-items-center rounded-lg bg-accent text-xs font-semibold">
            {client.initials}
          </div>
          <div className="min-w-0">
            <div className="truncate font-medium">{client.name}</div>
            {client.segment && (
              <div className="text-xs text-muted-foreground">{client.segment}</div>
            )}
          </div>
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
    { key: "owner", header: "Responsável", cell: (client) => client.owner || "Sem responsável" },
    { key: "plan", header: "Plano", cell: (client) => client.plan || "Sem plano" },
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
        <div className="flex items-center justify-end gap-1">
          <Link
            to="/clientes/$clienteId"
            params={{ clienteId: client.id }}
            aria-label={`Visualizar ${client.name}`}
            className="grid size-8 place-items-center rounded-lg text-muted-foreground hover:bg-accent hover:text-foreground"
          >
            <Eye className="size-4" />
          </Link>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            aria-label={`Editar ${client.name}`}
            onClick={() => {
              setEditingClient(client);
              setModal(true);
            }}
          >
            <Edit3 className="size-4" />
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            aria-label={client.status === "Inativo" ? "Reativar cliente" : "Inativar cliente"}
            loading={saveClient.isPending}
            onClick={() => updateStatus(client, client.status === "Inativo" ? "Ativo" : "Inativo")}
          >
            {client.status === "Inativo" ? (
              <PlayCircle className="size-4" />
            ) : (
              <PauseCircle className="size-4" />
            )}
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            aria-label={`Excluir ${client.name}`}
            onClick={() => setDeletingClient(client)}
          >
            <Trash2 className="size-4" />
          </Button>
        </div>
      ),
      cellClassName: "text-right",
    },
  ];

  return (
    <div>
      <PageHeader
        title="Clientes"
        description="Gerencie empresas, planos e relacionamentos da sua carteira."
        action={
          <Button
            onClick={() => {
              setEditingClient(null);
              setModal(true);
            }}
          >
            <Plus className="size-4" />
            Novo cliente
          </Button>
        }
      />
      <FilterBar
        search={search}
        onSearchChange={(value) => {
          setSearch(value);
          setPage(1);
        }}
        searchPlaceholder="Buscar cliente ou CNPJ..."
        className="sm:items-center"
      >
        <div className="flex items-center gap-2">
          <SlidersHorizontal className="size-4 text-muted-foreground" />
          <Select
            value={status}
            onChange={(event) => {
              setStatus(event.target.value as ClientFilter["status"]);
              setPage(1);
            }}
          >
            <option>Todos</option>
            <option>Ativo</option>
            <option>Implantação</option>
            <option>Pendente</option>
            <option>Inativo</option>
            <option>Bloqueado</option>
          </Select>
        </div>
      </FilterBar>
      <DataTable
        columns={clientColumns}
        data={paginated}
        getRowKey={(client) => client.id}
        loading={isLoading}
        error={error}
        emptyState={
          <EmptyState
            title="Sem clientes cadastrados"
            description="Os clientes cadastrados aparecerão aqui quando existirem registros reais."
          />
        }
        footer={
          <Pagination
            label={`${filtered.length} cliente${filtered.length === 1 ? "" : "s"} • página ${page} de ${pageCount}`}
          />
        }
      />
      <div className="mt-3 flex justify-end gap-2">
        <Button
          type="button"
          variant="secondary"
          disabled={page <= 1}
          onClick={() => setPage((current) => Math.max(1, current - 1))}
        >
          Anterior
        </Button>
        <Button
          type="button"
          variant="secondary"
          disabled={page >= pageCount}
          onClick={() => setPage((current) => Math.min(pageCount, current + 1))}
        >
          Próxima
        </Button>
      </div>
      <ClientCreateModal
        open={modal}
        client={editingClient}
        saving={saveClient.isPending}
        onClose={() => {
          setModal(false);
          setEditingClient(null);
        }}
        onSubmit={(values) => saveClient.mutateAsync(values)}
      />
      <Modal
        open={Boolean(deletingClient)}
        onClose={() => setDeletingClient(null)}
        title="Excluir cliente"
        description="A exclusão é lógica e mantém o histórico para auditoria."
      >
        <div className="grid gap-5">
          <p className="text-sm text-muted-foreground">
            Confirme a exclusão de {deletingClient?.name}. O cliente deixará de aparecer nas
            listagens operacionais.
          </p>
          <div className="flex justify-end gap-2">
            <Button type="button" variant="secondary" onClick={() => setDeletingClient(null)}>
              Cancelar
            </Button>
            <Button
              type="button"
              variant="danger"
              loading={deleteClient.isPending}
              onClick={() => deletingClient && deleteClient.mutate(deletingClient.id)}
            >
              <Trash2 className="size-4" />
              Excluir cliente
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
