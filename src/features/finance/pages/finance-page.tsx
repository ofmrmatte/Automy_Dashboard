import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  CalendarCheck,
  CheckCircle2,
  CircleDollarSign,
  CreditCard,
  Eye,
  Pencil,
  Plus,
  SlidersHorizontal,
  Trash2,
  TriangleAlert,
  XCircle,
} from "lucide-react";
import { useMemo, useState } from "react";
import { clientsQueryOptions } from "@/features/clients/api/client.queries";
import { contractsQueryOptions } from "@/features/contracts/api/contract.queries";
import { financeQueryKeys, chargesQueryOptions } from "@/features/finance/api/finance.queries";
import { ChargeCreateModal } from "@/features/finance/components/charge-create-modal";
import { financeService } from "@/features/finance/services/finance.service";
import type { Charge, ChargeFilter } from "@/features/finance/types";
import {
  chargeFormSchema,
  chargeStatusLabels,
  type ChargeFormValues,
} from "@/features/finance/validation";
import { DataTable, type DataTableColumn } from "@/shared/components/data-table";
import { EmptyState } from "@/shared/components/empty-state";
import { FilterBar } from "@/shared/components/filter-bar";
import { MetricCard } from "@/shared/components/metric-card";
import { PageHeader } from "@/shared/components/page-header";
import { toast } from "@/shared/components/toast";
import { Badge, Button, Modal, Pagination, Select } from "@/shared/components/ui";
import { toneForStatus } from "@/shared/types/status";
import { formatCurrency, formatDateTime } from "@/shared/utils/formatters";

const PAGE_SIZE = 10;
const EMPTY_CHARGES: Charge[] = [];

export function FinancePage() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState<ChargeFilter["status"]>("all");
  const [page, setPage] = useState(1);
  const [modal, setModal] = useState(false);
  const [editingCharge, setEditingCharge] = useState<Charge | null>(null);
  const [viewingCharge, setViewingCharge] = useState<Charge | null>(null);
  const [deletingCharge, setDeletingCharge] = useState<Charge | null>(null);
  const { data, error, isLoading } = useQuery(chargesQueryOptions());
  const { data: clients = [] } = useQuery(clientsQueryOptions());
  const { data: contracts = [] } = useQuery(contractsQueryOptions());
  const charges = data?.charges ?? EMPTY_CHARGES;
  const summary = data?.summary;

  const filtered = useMemo(
    () => financeService.filterCharges(charges, { search, status }),
    [charges, search, status],
  );
  const pageCount = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const paginated = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const saveCharge = useMutation({
    mutationFn: async (values: ChargeFormValues) => {
      const payload = chargeFormSchema.parse(values);
      return payload.id
        ? financeService.updateCharge({ ...payload, id: payload.id })
        : financeService.createCharge(payload);
    },
    onSuccess: async (charge, values) => {
      await queryClient.invalidateQueries({ queryKey: financeQueryKeys.all });
      toast.success(values.id ? "Cobrança atualizada." : "Cobrança criada.");
      setModal(false);
      setEditingCharge(null);
      if (charge) setViewingCharge(charge);
    },
    onError: (mutationError) => {
      toast.danger(
        mutationError instanceof Error
          ? mutationError.message
          : "Não foi possível salvar a cobrança.",
      );
    },
  });

  const updateStatus = useMutation({
    mutationFn: ({ charge, nextStatus }: { charge: Charge; nextStatus: Charge["status"] }) =>
      financeService.updateChargeStatus(charge.id, nextStatus),
    onSuccess: async (_, variables) => {
      await queryClient.invalidateQueries({ queryKey: financeQueryKeys.all });
      toast.success(`Cobrança atualizada para ${chargeStatusLabels[variables.nextStatus]}.`);
    },
    onError: (mutationError) => {
      toast.danger(
        mutationError instanceof Error
          ? mutationError.message
          : "Não foi possível atualizar o status.",
      );
    },
  });

  const deleteCharge = useMutation({
    mutationFn: (chargeId: string) => financeService.removeCharge(chargeId),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: financeQueryKeys.all });
      toast.success("Cobrança excluída logicamente.");
      setDeletingCharge(null);
    },
    onError: (mutationError) => {
      toast.danger(
        mutationError instanceof Error
          ? mutationError.message
          : "Não foi possível excluir a cobrança.",
      );
    },
  });

  const chargeColumns = useMemo<Array<DataTableColumn<Charge>>>(
    () => [
      {
        key: "invoice",
        header: "Fatura",
        cell: (charge) => (
          <div className="min-w-0">
            <span className="block font-mono text-xs">{charge.invoice}</span>
            {charge.reference && (
              <span className="block truncate text-xs text-muted-foreground">
                {charge.reference}
              </span>
            )}
          </div>
        ),
      },
      {
        key: "client",
        header: "Cliente",
        cell: (charge) => (
          <div className="min-w-0">
            <span className="block truncate font-medium">{charge.client}</span>
            {charge.contract && (
              <span className="block truncate text-xs text-muted-foreground">
                {charge.contract}
              </span>
            )}
          </div>
        ),
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
        cell: (charge) => <Badge tone={toneForStatus(charge.status)}>{charge.statusLabel}</Badge>,
      },
      {
        key: "actions",
        header: <span className="sr-only">Ações</span>,
        cell: (charge) => (
          <div className="flex justify-end gap-1">
            <Button
              type="button"
              variant="ghost"
              size="icon"
              aria-label={`Visualizar ${charge.invoice}`}
              onClick={() => setViewingCharge(charge)}
            >
              <Eye className="size-4" />
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              aria-label={`Editar ${charge.invoice}`}
              onClick={() => {
                setEditingCharge(charge);
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
              aria-label="Marcar cobrança como paga"
              disabled={charge.status === "paid"}
              onClick={() => updateStatus.mutate({ charge, nextStatus: "paid" })}
            >
              <CheckCircle2 className="size-4" />
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              loading={updateStatus.isPending}
              aria-label="Cancelar cobrança"
              disabled={charge.status === "canceled"}
              onClick={() => updateStatus.mutate({ charge, nextStatus: "canceled" })}
            >
              <XCircle className="size-4" />
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              aria-label={`Excluir ${charge.invoice}`}
              onClick={() => setDeletingCharge(charge)}
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
        title="Financeiro"
        description="Visão consolidada da receita, inadimplência e recebimentos."
        action={
          <Button
            onClick={() => {
              setEditingCharge(null);
              setModal(true);
            }}
          >
            <Plus className="size-4" />
            Nova cobrança
          </Button>
        }
      />
      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <MetricCard
          label="Receita mensal"
          value={formatCurrency(summary?.monthlyRevenue ?? 0)}
          helper="recebido no mês"
          icon={CircleDollarSign}
          loading={isLoading}
        />
        <MetricCard
          label="Receita anual"
          value={formatCurrency(summary?.annualRevenue ?? 0)}
          helper="recebido no ano"
          icon={CreditCard}
          loading={isLoading}
        />
        <MetricCard
          label="Clientes inadimplentes"
          value={String(summary?.delinquentClients ?? 0)}
          positive={false}
          helper={formatCurrency(summary?.overdueAmount ?? 0)}
          icon={TriangleAlert}
          loading={isLoading}
        />
        <MetricCard
          label="Recebimentos previstos"
          value={formatCurrency(summary?.expectedReceipts ?? 0)}
          helper={`${formatCurrency(summary?.openAmount ?? 0)} em aberto`}
          icon={CalendarCheck}
          loading={isLoading}
        />
      </section>
      <FilterBar
        search={search}
        onSearchChange={(value) => {
          setSearch(value);
          setPage(1);
        }}
        searchPlaceholder="Buscar cobrança..."
        className="mt-7 sm:items-center"
      >
        <div className="flex flex-wrap items-center gap-2">
          <SlidersHorizontal className="size-4 text-muted-foreground" />
          <Select
            value={status}
            onChange={(event) => {
              setStatus(event.target.value as ChargeFilter["status"]);
              setPage(1);
            }}
          >
            <option value="all">Todos</option>
            <option value="pending">Pendente</option>
            <option value="paid">Pago</option>
            <option value="overdue">Atrasado</option>
            <option value="canceled">Cancelado</option>
            <option value="failed">Falhou</option>
          </Select>
        </div>
      </FilterBar>
      <DataTable
        columns={chargeColumns}
        data={paginated}
        getRowKey={(charge) => charge.id}
        loading={isLoading}
        error={error}
        emptyState={
          <EmptyState
            title="Nenhuma cobrança encontrada"
            description="Cobranças reais aparecerão aqui quando forem cadastradas ou conciliadas."
          />
        }
        footer={
          <Pagination
            label={`${filtered.length} cobrança${filtered.length === 1 ? "" : "s"} • página ${page} de ${pageCount}`}
            page={page}
            pageCount={pageCount}
            onPageChange={setPage}
          />
        }
      />
      <ChargeCreateModal
        open={modal}
        charge={editingCharge}
        clients={clients}
        contracts={contracts}
        saving={saveCharge.isPending}
        onClose={() => {
          setModal(false);
          setEditingCharge(null);
        }}
        onSubmit={(values) => saveCharge.mutateAsync(values)}
      />
      <ChargeViewModal charge={viewingCharge} onClose={() => setViewingCharge(null)} />
      <Modal
        open={Boolean(deletingCharge)}
        onClose={() => setDeletingCharge(null)}
        title="Excluir cobrança"
        description="A exclusão é lógica e preserva o histórico financeiro para auditoria."
      >
        <div className="grid gap-5">
          <p className="text-sm text-muted-foreground">
            Confirme a exclusão da cobrança {deletingCharge?.invoice}. Ela deixará de aparecer nas
            listagens operacionais.
          </p>
          <div className="flex justify-end gap-2">
            <Button type="button" variant="secondary" onClick={() => setDeletingCharge(null)}>
              Cancelar
            </Button>
            <Button
              type="button"
              variant="danger"
              loading={deleteCharge.isPending}
              onClick={() => deletingCharge && deleteCharge.mutate(deletingCharge.id)}
            >
              <Trash2 className="size-4" />
              Excluir cobrança
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}

function ChargeViewModal({ charge, onClose }: { charge: Charge | null; onClose: () => void }) {
  return (
    <Modal open={Boolean(charge)} onClose={onClose} title="Detalhes da cobrança" size="lg">
      {charge && (
        <div className="grid gap-5">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h3 className="text-lg font-semibold text-foreground">{charge.invoice}</h3>
              <p className="text-sm text-muted-foreground">{charge.client}</p>
            </div>
            <Badge tone={toneForStatus(charge.status)}>{charge.statusLabel}</Badge>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <Info label="Contrato" value={charge.contract || "Sem contrato vinculado"} />
            <Info label="Referência" value={charge.reference || "Não informada"} />
            <Info label="Vencimento" value={charge.due} />
            <Info label="Valor" value={charge.value} />
            <Info label="Método" value={charge.method} />
            <Info label="Provedor" value={charge.provider} />
            <Info
              label="Pagamento"
              value={charge.paidAt ? formatDateTime(charge.paidAt) : "Não conciliado"}
            />
            <Info label="Conciliação" value={charge.reconciliationStatus} />
          </div>
          <div>
            <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
              Observações
            </p>
            <p className="mt-2 rounded-card border border-border bg-muted/30 p-4 text-sm text-foreground">
              {charge.notes || charge.description || "Nenhuma observação cadastrada."}
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
