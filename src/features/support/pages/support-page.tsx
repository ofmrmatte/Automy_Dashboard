import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  CheckCircle2,
  Eye,
  MessageSquarePlus,
  Pencil,
  Plus,
  RotateCcw,
  SlidersHorizontal,
  Trash2,
  XCircle,
} from "lucide-react";
import { useMemo, useState } from "react";
import { clientsQueryOptions } from "@/features/clients/api/client.queries";
import { supportQueryKeys, ticketsQueryOptions } from "@/features/support/api/support.queries";
import { TicketCreateModal } from "@/features/support/components/ticket-create-modal";
import { supportService } from "@/features/support/services/support.service";
import type { Ticket, TicketFilter } from "@/features/support/types";
import {
  ticketFormSchema,
  ticketPriorities,
  ticketStatuses,
  type TicketFormValues,
} from "@/features/support/validation";
import { usersQueryOptions } from "@/features/users/api/user.queries";
import { DataTable, type DataTableColumn } from "@/shared/components/data-table";
import { EmptyState } from "@/shared/components/empty-state";
import { FilterBar } from "@/shared/components/filter-bar";
import { PageHeader } from "@/shared/components/page-header";
import { toast } from "@/shared/components/toast";
import {
  Badge,
  Button,
  Card,
  Field,
  Modal,
  Pagination,
  Select,
  Textarea,
} from "@/shared/components/ui";
import { toneForStatus } from "@/shared/types/status";
import { formatDateTime } from "@/shared/utils/formatters";

const PAGE_SIZE = 10;
const EMPTY_TICKETS: Ticket[] = [];

export function SupportPage() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [priority, setPriority] = useState<TicketFilter["priority"]>("Todas");
  const [status, setStatus] = useState<TicketFilter["status"]>("Todos");
  const [page, setPage] = useState(1);
  const [open, setOpen] = useState(false);
  const [editingTicket, setEditingTicket] = useState<Ticket | null>(null);
  const [viewingTicket, setViewingTicket] = useState<Ticket | null>(null);
  const [deletingTicket, setDeletingTicket] = useState<Ticket | null>(null);
  const [messageTicket, setMessageTicket] = useState<Ticket | null>(null);
  const [message, setMessage] = useState("");
  const [messageVisibility, setMessageVisibility] = useState<"internal" | "client">("internal");
  const userFilters = useMemo(
    () => ({ search: "", role: "all" as const, status: "active" as const, page: 1, pageSize: 100 }),
    [],
  );
  const { data: tickets = EMPTY_TICKETS, error, isLoading } = useQuery(ticketsQueryOptions());
  const { data: clients = [] } = useQuery(clientsQueryOptions());
  const { data: usersPayload } = useQuery(usersQueryOptions(userFilters));
  const users = useMemo(() => usersPayload?.users ?? [], [usersPayload?.users]);
  const filtered = useMemo(
    () => supportService.filterTickets(tickets, { search, priority, status }),
    [tickets, search, priority, status],
  );
  const pageCount = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const paginated = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const saveTicket = useMutation({
    mutationFn: async (values: TicketFormValues) => {
      const payload = ticketFormSchema.parse(values);
      return payload.id
        ? supportService.updateTicket({ ...payload, id: payload.id })
        : supportService.createTicket(payload);
    },
    onSuccess: async (ticket, values) => {
      await queryClient.invalidateQueries({ queryKey: supportQueryKeys.all });
      toast.success(values.id ? "Ticket atualizado." : "Ticket criado.");
      setOpen(false);
      setEditingTicket(null);
      if (ticket) setViewingTicket(ticket);
    },
    onError: (mutationError) => {
      toast.danger(
        mutationError instanceof Error
          ? mutationError.message
          : "Não foi possível salvar o ticket.",
      );
    },
  });

  const updateStatus = useMutation({
    mutationFn: ({ ticket, nextStatus }: { ticket: Ticket; nextStatus: Ticket["status"] }) =>
      supportService.updateTicketStatus(ticket.id, nextStatus),
    onSuccess: async (_, variables) => {
      await queryClient.invalidateQueries({ queryKey: supportQueryKeys.all });
      toast.success(`Ticket atualizado para ${variables.nextStatus}.`);
    },
    onError: (mutationError) => {
      toast.danger(
        mutationError instanceof Error
          ? mutationError.message
          : "Não foi possível atualizar o status.",
      );
    },
  });

  const addMessage = useMutation({
    mutationFn: ({
      ticket,
      body,
      visibility,
    }: {
      ticket: Ticket;
      body: string;
      visibility: "internal" | "client";
    }) =>
      supportService.updateTicket({ id: ticket.id, message: body, messageVisibility: visibility }),
    onSuccess: async (ticket) => {
      await queryClient.invalidateQueries({ queryKey: supportQueryKeys.all });
      toast.success("Mensagem registrada.");
      setMessage("");
      setMessageVisibility("internal");
      setMessageTicket(null);
      if (ticket) setViewingTicket(ticket);
    },
    onError: (mutationError) => {
      toast.danger(
        mutationError instanceof Error
          ? mutationError.message
          : "Não foi possível registrar a mensagem.",
      );
    },
  });

  const deleteTicket = useMutation({
    mutationFn: (ticketId: string) => supportService.removeTicket(ticketId),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: supportQueryKeys.all });
      toast.success("Ticket excluído logicamente.");
      setDeletingTicket(null);
    },
    onError: (mutationError) => {
      toast.danger(
        mutationError instanceof Error
          ? mutationError.message
          : "Não foi possível excluir o ticket.",
      );
    },
  });

  const ticketColumns = useMemo<Array<DataTableColumn<Ticket>>>(
    () => [
      {
        key: "ticket",
        header: "Ticket",
        cell: (ticket) => (
          <div className="min-w-0">
            <div className="font-mono text-xs text-primary">{ticket.number}</div>
            <div className="mt-1 max-w-xs truncate font-medium">{ticket.title}</div>
          </div>
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
      { key: "date", header: "Atualização", cell: (ticket) => formatDateTime(ticket.updatedAt) },
      {
        key: "actions",
        header: <span className="sr-only">Ações</span>,
        cell: (ticket) => (
          <div className="flex justify-end gap-1">
            <Button
              type="button"
              variant="ghost"
              size="icon"
              aria-label={`Visualizar ${ticket.number}`}
              onClick={() => setViewingTicket(ticket)}
            >
              <Eye className="size-4" />
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              aria-label={`Editar ${ticket.number}`}
              onClick={() => {
                setEditingTicket(ticket);
                setOpen(true);
              }}
            >
              <Pencil className="size-4" />
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              aria-label={`Adicionar mensagem em ${ticket.number}`}
              onClick={() => {
                setMessageVisibility("internal");
                setMessageTicket(ticket);
              }}
            >
              <MessageSquarePlus className="size-4" />
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              loading={updateStatus.isPending}
              aria-label={`Resolver ${ticket.number}`}
              disabled={ticket.status === "Resolvido" || ticket.status === "Fechado"}
              onClick={() => updateStatus.mutate({ ticket, nextStatus: "Resolvido" })}
            >
              <CheckCircle2 className="size-4" />
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              loading={updateStatus.isPending}
              aria-label={`Reabrir ${ticket.number}`}
              disabled={ticket.status === "Aberto"}
              onClick={() => updateStatus.mutate({ ticket, nextStatus: "Aberto" })}
            >
              <RotateCcw className="size-4" />
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              loading={updateStatus.isPending}
              aria-label={`Cancelar ${ticket.number}`}
              disabled={ticket.status === "Cancelado" || ticket.status === "Fechado"}
              onClick={() => updateStatus.mutate({ ticket, nextStatus: "Cancelado" })}
            >
              <XCircle className="size-4" />
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              aria-label={`Excluir ${ticket.number}`}
              onClick={() => setDeletingTicket(ticket)}
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
        title="Suporte"
        description="Priorize chamados e acompanhe o trabalho da equipe."
        action={
          <Button
            onClick={() => {
              setEditingTicket(null);
              setOpen(true);
            }}
          >
            <Plus className="size-4" />
            Novo ticket
          </Button>
        }
      />
      <FilterBar
        search={search}
        onSearchChange={(value) => {
          setSearch(value);
          setPage(1);
        }}
        searchPlaceholder="Buscar ticket..."
      >
        <div className="flex flex-wrap items-center gap-2">
          <SlidersHorizontal className="size-4 text-muted-foreground" />
          <Select
            value={priority}
            onChange={(event) => {
              setPriority(event.target.value as TicketFilter["priority"]);
              setPage(1);
            }}
          >
            <option>Todas</option>
            {ticketPriorities.map((item) => (
              <option key={item}>{item}</option>
            ))}
          </Select>
          <Select
            value={status}
            onChange={(event) => {
              setStatus(event.target.value as TicketFilter["status"]);
              setPage(1);
            }}
          >
            <option>Todos</option>
            {ticketStatuses.map((item) => (
              <option key={item}>{item}</option>
            ))}
          </Select>
        </div>
      </FilterBar>
      <DataTable
        columns={ticketColumns}
        data={paginated}
        getRowKey={(ticket) => ticket.id}
        loading={isLoading}
        error={error}
        emptyState={
          <EmptyState
            title="Nenhum ticket aberto"
            description="Tickets reais aparecerão aqui quando forem registrados."
          />
        }
        footer={
          <Pagination
            label={`${filtered.length} ticket${filtered.length === 1 ? "" : "s"} • página ${page} de ${pageCount}`}
            page={page}
            pageCount={pageCount}
            onPageChange={setPage}
          />
        }
      />
      <TicketCreateModal
        open={open}
        ticket={editingTicket}
        clients={clients}
        users={users}
        saving={saveTicket.isPending}
        onClose={() => {
          setOpen(false);
          setEditingTicket(null);
        }}
        onSubmit={(values) => saveTicket.mutateAsync(values)}
      />
      <TicketViewModal ticket={viewingTicket} onClose={() => setViewingTicket(null)} />
      <Modal
        open={Boolean(messageTicket)}
        onClose={() => {
          setMessageTicket(null);
          setMessage("");
          setMessageVisibility("internal");
        }}
        title="Adicionar mensagem"
        description="Registre uma atualização e escolha explicitamente se o cliente poderá visualizá-la."
      >
        <div className="grid gap-5">
          <Field label="Mensagem">
            <Textarea value={message} onChange={(event) => setMessage(event.target.value)} />
          </Field>
          <Field label="Visibilidade">
            <Select
              value={messageVisibility}
              onChange={(event) =>
                setMessageVisibility(event.target.value as "internal" | "client")
              }
            >
              <option value="internal">Somente equipe Automy</option>
              <option value="client">Visível ao cliente no Portal</option>
            </Select>
          </Field>
          <div className="flex justify-end gap-2">
            <Button
              type="button"
              variant="secondary"
              onClick={() => {
                setMessageTicket(null);
                setMessage("");
                setMessageVisibility("internal");
              }}
            >
              Cancelar
            </Button>
            <Button
              type="button"
              loading={addMessage.isPending}
              onClick={() =>
                messageTicket &&
                addMessage.mutate({
                  ticket: messageTicket,
                  body: message,
                  visibility: messageVisibility,
                })
              }
            >
              <MessageSquarePlus className="size-4" />
              Registrar
            </Button>
          </div>
        </div>
      </Modal>
      <Modal
        open={Boolean(deletingTicket)}
        onClose={() => setDeletingTicket(null)}
        title="Excluir ticket"
        description="A exclusão é lógica e preserva o histórico para auditoria."
      >
        <div className="grid gap-5">
          <p className="text-sm text-muted-foreground">
            Confirme a exclusão do ticket {deletingTicket?.number}. Ele deixará de aparecer nas
            listagens operacionais.
          </p>
          <div className="flex justify-end gap-2">
            <Button type="button" variant="secondary" onClick={() => setDeletingTicket(null)}>
              Cancelar
            </Button>
            <Button
              type="button"
              variant="danger"
              loading={deleteTicket.isPending}
              onClick={() => deletingTicket && deleteTicket.mutate(deletingTicket.id)}
            >
              <Trash2 className="size-4" />
              Excluir ticket
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}

function TicketViewModal({ ticket, onClose }: { ticket: Ticket | null; onClose: () => void }) {
  return (
    <Modal open={Boolean(ticket)} onClose={onClose} title="Detalhes do ticket" size="lg">
      {ticket && (
        <div className="grid gap-5">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h3 className="text-lg font-semibold text-foreground">{ticket.number}</h3>
              <p className="text-sm text-muted-foreground">{ticket.client}</p>
            </div>
            <Badge tone={toneForStatus(ticket.status)}>{ticket.status}</Badge>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <Info label="Título" value={ticket.title} />
            <Info label="Categoria" value={ticket.category} />
            <Info label="Prioridade" value={ticket.priority} />
            <Info label="Responsável" value={ticket.owner} />
            <Info
              label="Primeira resposta"
              value={ticket.firstResponseDueAt ? formatDateTime(ticket.firstResponseDueAt) : ""}
            />
            <Info
              label="Resolução"
              value={ticket.resolutionDueAt ? formatDateTime(ticket.resolutionDueAt) : ""}
            />
          </div>
          <InfoBlock label="Descrição" value={ticket.description} />
          <InfoBlock label="Tags" value={ticket.tags.join(", ")} />
          <Card className="p-4">
            <h4 className="font-semibold text-foreground">Mensagens</h4>
            <div className="mt-3 grid gap-3">
              {ticket.messages.length === 0 && (
                <p className="text-sm text-muted-foreground">Nenhuma mensagem registrada.</p>
              )}
              {ticket.messages.map((message) => (
                <div key={message.id} className="rounded-card border border-border p-3">
                  <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-muted-foreground">
                    <span>{message.authorName}</span>
                    <span>{formatDateTime(message.createdAt)}</span>
                  </div>
                  <p className="mt-2 text-sm text-foreground">{message.body}</p>
                </div>
              ))}
            </div>
          </Card>
          <Card className="p-4">
            <h4 className="font-semibold text-foreground">Anexos</h4>
            <div className="mt-3 grid gap-2">
              {ticket.attachments.length === 0 && (
                <p className="text-sm text-muted-foreground">Nenhum anexo registrado.</p>
              )}
              {ticket.attachments.map((attachment) => (
                <a
                  key={attachment.id}
                  href={attachment.fileUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="text-sm font-medium text-primary"
                >
                  {attachment.fileName}
                </a>
              ))}
            </div>
          </Card>
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

function InfoBlock({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{label}</p>
      <p className="mt-2 rounded-card border border-border bg-muted/30 p-4 text-sm text-foreground">
        {value || "Não informado"}
      </p>
    </div>
  );
}
