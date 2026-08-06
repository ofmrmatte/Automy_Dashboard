import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Ban,
  Eye,
  FileText,
  PauseCircle,
  Pencil,
  PlayCircle,
  Plus,
  RotateCcw,
  Trash2,
} from "lucide-react";
import { useMemo, useState } from "react";
import {
  contractQueryKeys,
  contractsQueryOptions,
} from "@/features/contracts/api/contract.queries";
import { ContractCreateModal } from "@/features/contracts/components/contract-create-modal";
import { contractService } from "@/features/contracts/services/contract.service";
import type { Contract, ContractFilter, ContractStatus } from "@/features/contracts/types";
import { contractFormSchema, type ContractFormValues } from "@/features/contracts/validation";
import { DataTable, type DataTableColumn } from "@/shared/components/data-table";
import { EmptyState } from "@/shared/components/empty-state";
import { FilterBar } from "@/shared/components/filter-bar";
import { PageHeader } from "@/shared/components/page-header";
import { toast } from "@/shared/components/toast";
import { Badge, Button, Modal, Pagination, Select } from "@/shared/components/ui";
import { toneForStatus } from "@/shared/types/status";
import { formatCurrency } from "@/shared/utils/formatters";

const PAGE_SIZE = 10;

export function ContractsPage() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState<ContractFilter["status"]>("Todos");
  const [page, setPage] = useState(1);
  const [open, setOpen] = useState(false);
  const [editingContract, setEditingContract] = useState<Contract | null>(null);
  const [viewingContract, setViewingContract] = useState<Contract | null>(null);
  const [deletingContract, setDeletingContract] = useState<Contract | null>(null);
  const { data: contracts = [], error, isLoading } = useQuery(contractsQueryOptions());
  const filtered = useMemo(
    () => contractService.filterContracts(contracts, { search, status }),
    [contracts, search, status],
  );
  const pageCount = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const paginated = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const saveContract = useMutation({
    mutationFn: async (values: ContractFormValues) => {
      const payload = contractFormSchema.parse(values);
      return payload.id
        ? contractService.updateContract({ ...payload, id: payload.id })
        : contractService.createContract(payload);
    },
    onSuccess: async (contract, values) => {
      await queryClient.invalidateQueries({ queryKey: contractQueryKeys.all });
      toast.success(values.id ? "Contrato atualizado." : "Contrato criado.");
      setOpen(false);
      setEditingContract(null);
      setViewingContract(contract);
    },
    onError: (mutationError) => {
      toast.danger(
        mutationError instanceof Error
          ? mutationError.message
          : "Não foi possível salvar o contrato.",
      );
    },
  });

  const updateStatus = useMutation({
    mutationFn: ({ contract, nextStatus }: { contract: Contract; nextStatus: ContractStatus }) =>
      contractService.updateContractStatus(contract.id, nextStatus),
    onSuccess: async (_, variables) => {
      await queryClient.invalidateQueries({ queryKey: contractQueryKeys.all });
      toast.success(`Contrato atualizado para ${variables.nextStatus}.`);
    },
    onError: (mutationError) => {
      toast.danger(
        mutationError instanceof Error
          ? mutationError.message
          : "Não foi possível atualizar o contrato.",
      );
    },
  });

  const deleteContract = useMutation({
    mutationFn: (contractId: string) => contractService.deleteContract(contractId),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: contractQueryKeys.all });
      toast.success("Contrato excluído logicamente.");
      setDeletingContract(null);
    },
    onError: (mutationError) => {
      toast.danger(
        mutationError instanceof Error
          ? mutationError.message
          : "Não foi possível excluir o contrato.",
      );
    },
  });

  const contractColumns = useMemo<Array<DataTableColumn<Contract>>>(
    () => [
      {
        key: "client",
        header: "Cliente",
        cell: (contract) => (
          <div className="flex items-center gap-3">
            <div className="grid size-8 place-items-center rounded-lg bg-accent">
              <FileText className="size-4" />
            </div>
            <div>
              <span className="font-medium">{contract.client}</span>
              <div className="text-xs text-muted-foreground">{contract.product}</div>
            </div>
          </div>
        ),
      },
      { key: "plan", header: "Plano", cell: (contract) => contract.plan },
      {
        key: "value",
        header: "Valor mensal",
        cell: (contract) => <span className="font-medium">{contract.value}</span>,
      },
      { key: "start", header: "Início", cell: (contract) => contract.start || "Não informado" },
      {
        key: "renewal",
        header: "Vencimento",
        cell: (contract) => contract.renewal || "Não informado",
      },
      {
        key: "status",
        header: "Status",
        cell: (contract) => <Badge tone={toneForStatus(contract.status)}>{contract.status}</Badge>,
      },
      {
        key: "actions",
        header: <span className="sr-only">Ações</span>,
        cell: (contract) => (
          <div className="flex justify-end gap-1">
            <Button
              type="button"
              variant="ghost"
              size="icon"
              onClick={() => setViewingContract(contract)}
              aria-label={`Visualizar ${contract.client}`}
            >
              <Eye className="size-4" />
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              onClick={() => {
                setEditingContract(contract);
                setOpen(true);
              }}
              aria-label={`Editar ${contract.client}`}
            >
              <Pencil className="size-4" />
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              loading={updateStatus.isPending}
              onClick={() => updateStatus.mutate({ contract, nextStatus: "Ativo" })}
              aria-label="Ativar contrato"
            >
              <PlayCircle className="size-4" />
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              loading={updateStatus.isPending}
              onClick={() => updateStatus.mutate({ contract, nextStatus: "Suspenso" })}
              aria-label="Suspender contrato"
            >
              <PauseCircle className="size-4" />
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              loading={updateStatus.isPending}
              onClick={() => updateStatus.mutate({ contract, nextStatus: "Renovação" })}
              aria-label="Renovar contrato"
            >
              <RotateCcw className="size-4" />
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              loading={updateStatus.isPending}
              onClick={() => updateStatus.mutate({ contract, nextStatus: "Cancelado" })}
              aria-label="Cancelar contrato"
            >
              <Ban className="size-4" />
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              onClick={() => setDeletingContract(contract)}
              aria-label={`Excluir ${contract.client}`}
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
        title="Contratos"
        description="Acompanhe valores, vigências e renovações da carteira."
        action={
          <Button
            onClick={() => {
              setEditingContract(null);
              setOpen(true);
            }}
          >
            <Plus className="size-4" />
            Novo contrato
          </Button>
        }
      />
      <FilterBar
        search={search}
        onSearchChange={(value) => {
          setSearch(value);
          setPage(1);
        }}
        searchPlaceholder="Buscar contrato..."
      >
        <Select
          value={status}
          onChange={(event) => {
            setStatus(event.target.value as ContractFilter["status"]);
            setPage(1);
          }}
        >
          <option>Todos</option>
          <option>Ativo</option>
          <option>Implantação</option>
          <option>Renovação</option>
          <option>Pendente</option>
          <option>Suspenso</option>
          <option>Cancelado</option>
          <option>Encerrado</option>
        </Select>
      </FilterBar>
      <DataTable
        columns={contractColumns}
        data={paginated}
        getRowKey={(contract) => contract.id}
        loading={isLoading}
        error={error}
        emptyState={
          <EmptyState
            title="Nenhum contrato encontrado"
            description="Contratos reais aparecerão aqui quando forem cadastrados."
          />
        }
        footer={
          <Pagination
            label={`${filtered.length} contrato${filtered.length === 1 ? "" : "s"} • página ${page} de ${pageCount}`}
            page={page}
            pageCount={pageCount}
            onPageChange={setPage}
          />
        }
      />
      <ContractCreateModal
        open={open}
        contract={editingContract}
        saving={saveContract.isPending}
        onClose={() => {
          setOpen(false);
          setEditingContract(null);
        }}
        onSubmit={(values) => saveContract.mutateAsync(values)}
      />
      <ContractViewModal contract={viewingContract} onClose={() => setViewingContract(null)} />
      <Modal
        open={Boolean(deletingContract)}
        onClose={() => setDeletingContract(null)}
        title="Excluir contrato"
        description="A exclusão é lógica e preserva o histórico para auditoria."
      >
        <div className="grid gap-5">
          <p className="text-sm text-muted-foreground">
            Confirme a exclusão do contrato de {deletingContract?.client}. Ele deixará de aparecer
            nas listagens operacionais.
          </p>
          <div className="flex justify-end gap-2">
            <Button type="button" variant="secondary" onClick={() => setDeletingContract(null)}>
              Cancelar
            </Button>
            <Button
              type="button"
              variant="danger"
              loading={deleteContract.isPending}
              onClick={() => deletingContract && deleteContract.mutate(deletingContract.id)}
            >
              <Trash2 className="size-4" />
              Excluir contrato
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}

function ContractViewModal({
  contract,
  onClose,
}: {
  contract: Contract | null;
  onClose: () => void;
}) {
  return (
    <Modal open={Boolean(contract)} onClose={onClose} title="Detalhes do contrato" size="lg">
      {contract && (
        <div className="grid gap-5">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h3 className="text-lg font-semibold text-foreground">{contract.client}</h3>
              <p className="text-sm text-muted-foreground">{contract.product}</p>
            </div>
            <Badge tone={toneForStatus(contract.status)}>{contract.status}</Badge>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <Info label="Plano" value={contract.plan} />
            <Info label="Valor mensal" value={formatCurrency(contract.monthlyValue)} />
            <Info label="Implantação" value={formatCurrency(contract.implementationValue)} />
            <Info label="Periodicidade" value={contract.billingPeriod || "Não informado"} />
            <Info label="Início" value={contract.start || "Não informado"} />
            <Info label="Vencimento" value={contract.renewal || "Não informado"} />
          </div>
          <div>
            <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
              Observações
            </p>
            <p className="mt-2 rounded-card border border-border bg-muted/30 p-4 text-sm text-foreground">
              {contract.notes || "Nenhuma observação cadastrada."}
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
