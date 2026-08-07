import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Ban,
  BadgeCheck,
  Eye,
  FileDown,
  FileSignature,
  FileText,
  PauseCircle,
  Pencil,
  PlayCircle,
  Plus,
  RotateCcw,
  Send,
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
import { formatCurrency, formatDate } from "@/shared/utils/formatters";

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
  const [pdfAction, setPdfAction] = useState<"preview" | "download" | null>(null);
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

  const generateVersion = useMutation({
    mutationFn: (contractId: string) => contractService.generateContractVersion(contractId),
    onSuccess: async (contract) => {
      await queryClient.invalidateQueries({ queryKey: contractQueryKeys.all });
      setViewingContract(contract);
      toast.success("Nova versão do contrato gerada.");
    },
    onError: (mutationError) => {
      toast.danger(
        mutationError instanceof Error
          ? mutationError.message
          : "Não foi possível gerar nova versão.",
      );
    },
  });

  const sendToSignature = useMutation({
    mutationFn: (contractId: string) => contractService.sendContractToSignature(contractId),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: contractQueryKeys.all });
      toast.success("Envio para assinatura preparado.");
    },
    onError: (mutationError) => {
      toast.danger(
        mutationError instanceof Error
          ? mutationError.message
          : "Não foi possível enviar para assinatura.",
      );
    },
  });

  const markSigned = useMutation({
    mutationFn: (contractId: string) => contractService.markContractSigned(contractId),
    onSuccess: async (result) => {
      await queryClient.invalidateQueries({ queryKey: contractQueryKeys.all });
      toast.success(result.message ?? "Contrato formalizado.");
    },
    onError: (mutationError) => {
      toast.danger(
        mutationError instanceof Error
          ? mutationError.message
          : "Não foi possível formalizar o contrato.",
      );
    },
  });

  const openPdf = async (contract: Contract, download = false) => {
    if (!contract.contractText) {
      toast.danger("Contrato ainda não possui dados suficientes.");
      return;
    }

    setPdfAction(download ? "download" : "preview");
    try {
      const { blob, filename } = await contractService.getContractPdf(contract.id, download);
      const url = URL.createObjectURL(blob);
      if (download) {
        const anchor = document.createElement("a");
        anchor.href = url;
        anchor.download = filename;
        document.body.append(anchor);
        anchor.click();
        anchor.remove();
        URL.revokeObjectURL(url);
        toast.success("Download do contrato iniciado.");
        return;
      }

      const opened = window.open(url, "_blank", "noopener,noreferrer");
      if (!opened) {
        const anchor = document.createElement("a");
        anchor.href = url;
        anchor.target = "_blank";
        anchor.rel = "noopener noreferrer";
        document.body.append(anchor);
        anchor.click();
        anchor.remove();
      }
      window.setTimeout(() => URL.revokeObjectURL(url), 60_000);
    } catch (error) {
      toast.danger(error instanceof Error ? error.message : "Não foi possível gerar o contrato.");
    } finally {
      setPdfAction(null);
    }
  };

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
        header: "Fim da permanência",
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
      <ContractViewModal
        contract={viewingContract}
        formalizing={markSigned.isPending}
        generatingVersion={generateVersion.isPending}
        pdfAction={pdfAction}
        sendingToSignature={sendToSignature.isPending}
        onClose={() => setViewingContract(null)}
        onDownloadPdf={(contract) => openPdf(contract, true)}
        onGenerateVersion={(contract) => generateVersion.mutate(contract.id)}
        onMarkSigned={(contract) => markSigned.mutate(contract.id)}
        onSendToSignature={(contract) => sendToSignature.mutate(contract.id)}
        onViewPdf={(contract) => openPdf(contract)}
      />
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
  formalizing,
  generatingVersion,
  pdfAction,
  sendingToSignature,
  onClose,
  onDownloadPdf,
  onGenerateVersion,
  onMarkSigned,
  onSendToSignature,
  onViewPdf,
}: {
  contract: Contract | null;
  formalizing: boolean;
  generatingVersion: boolean;
  pdfAction: "preview" | "download" | null;
  sendingToSignature: boolean;
  onClose: () => void;
  onDownloadPdf: (contract: Contract) => void;
  onGenerateVersion: (contract: Contract) => void;
  onMarkSigned: (contract: Contract) => void;
  onSendToSignature: (contract: Contract) => void;
  onViewPdf: (contract: Contract) => void;
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
          <div className="flex flex-wrap gap-2">
            <Button
              type="button"
              variant="outline"
              loading={pdfAction === "preview"}
              disabled={!contract.contractText}
              onClick={() => onViewPdf(contract)}
            >
              <FileText className="size-4" />
              Visualizar PDF
            </Button>
            <Button
              type="button"
              variant="outline"
              loading={pdfAction === "download"}
              disabled={!contract.contractText}
              onClick={() => onDownloadPdf(contract)}
            >
              <FileDown className="size-4" />
              Baixar PDF
            </Button>
            <Button
              type="button"
              variant="secondary"
              loading={generatingVersion}
              onClick={() => onGenerateVersion(contract)}
            >
              <FileSignature className="size-4" />
              Gerar nova versão
            </Button>
            <Button
              type="button"
              variant="secondary"
              loading={sendingToSignature}
              disabled={
                !contract.contractText ||
                !contract.contractHash ||
                !contract.automyRepresentative ||
                !contract.signerEmail ||
                !contract.startsAt ||
                !contract.endsAt ||
                contract.monthlyValue <= 0
              }
              onClick={() => onSendToSignature(contract)}
            >
              <Send className="size-4" />
              Enviar para assinatura
            </Button>
            <Button
              type="button"
              variant="secondary"
              loading={formalizing}
              disabled={contract.signatureStatus === "signed"}
              onClick={() => onMarkSigned(contract)}
            >
              <BadgeCheck className="size-4" />
              Formalizar contrato
            </Button>
            <Button type="button" variant="ghost" disabled={!contract.signedDocumentPath}>
              <FileDown className="size-4" />
              Baixar contrato assinado
            </Button>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <Info label="Plano" value={contract.plan} />
            <Info label="Preço-base" value={formatCurrency(contract.basePriceReference)} />
            <Info label="Valor mensal" value={formatCurrency(contract.monthlyValue)} />
            <Info label="Implantação" value={formatCurrency(contract.implementationValue)} />
            <Info label="Forma de pagamento" value={contract.paymentMethod || "Não informado"} />
            <Info
              label="Cronograma"
              value={
                contract.installmentDueDays.length
                  ? `${contract.installmentsCount} parcelas (${contract.installmentDueDays.join(", ")} dias)`
                  : contract.paymentTerms?.description || "Não informado"
              }
            />
            <Info label="Usuários incluídos" value={String(contract.includedUsers)} />
            <Info label="Permanência mínima" value={`${contract.loyaltyMonths} meses`} />
            <Info
              label="Frequência da mensalidade"
              value={contract.billingPeriod || "Não informado"}
            />
            <Info label="Início" value={contract.start || "Não informado"} />
            <Info label="Fim da permanência" value={contract.renewal || "Não informado"} />
            <Info
              label="Próxima renovação"
              value={contract.renewalAt ? formatDate(contract.renewalAt) : "Não informado"}
            />
            <Info label="Versão documental" value={`v${contract.contractVersion}`} />
            <Info label="Hash" value={contract.contractHash?.slice(0, 16) || "Ainda não gerado"} />
          </div>
          <div>
            <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
              Observações
            </p>
            <p className="mt-2 rounded-card border border-border bg-muted/30 p-4 text-sm text-foreground">
              {contract.notes || "Nenhuma observação cadastrada."}
            </p>
          </div>
          <div>
            <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
              Escopo e entregáveis
            </p>
            <p className="mt-2 whitespace-pre-wrap rounded-card border border-border bg-muted/30 p-4 text-sm text-foreground">
              {[contract.scope, contract.deliverables].filter(Boolean).join("\n\n") ||
                "Nenhum escopo cadastrado."}
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
