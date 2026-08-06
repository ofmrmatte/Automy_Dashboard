import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Building2, CheckCircle2, Eye, SlidersHorizontal } from "lucide-react";
import { useMemo, useState } from "react";
import { leadsQueryOptions, leadQueryKeys } from "@/features/leads/api/lead.queries";
import {
  leadService,
  leadStatusLabels,
  toneForLeadStatus,
} from "@/features/leads/services/lead.service";
import type { Lead, LeadStatus } from "@/features/leads/types";
import { useIdentity } from "@/features/identity/context/identity-context";
import { DataTable, type DataTableColumn } from "@/shared/components/data-table";
import { EmptyState } from "@/shared/components/empty-state";
import { FilterBar } from "@/shared/components/filter-bar";
import { PageHeader } from "@/shared/components/page-header";
import { toast } from "@/shared/components/toast";
import {
  Badge,
  Button,
  Card,
  CardBody,
  Field,
  Modal,
  Pagination,
  Select,
} from "@/shared/components/ui";
import { formatDateTime, formatPhone } from "@/shared/utils/formatters";

const PAGE_SIZE = 10;
const statusOptions: Array<{ value: LeadStatus | "all"; label: string }> = [
  { value: "all", label: "Todos" },
  { value: "new", label: leadStatusLabels.new },
  { value: "contacted", label: leadStatusLabels.contacted },
  { value: "qualified", label: leadStatusLabels.qualified },
  { value: "proposal", label: leadStatusLabels.proposal },
  { value: "converted", label: leadStatusLabels.converted },
  { value: "lost", label: leadStatusLabels.lost },
  { value: "discarded", label: leadStatusLabels.discarded },
];

function leadLabel(lead: Lead) {
  return [lead.companyName, lead.name].filter(Boolean).join(" · ");
}

export function LeadsPage() {
  const queryClient = useQueryClient();
  const { profile } = useIdentity();
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState<LeadStatus | "all">("all");
  const [page, setPage] = useState(1);
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
  const canManage = profile?.role === "admin" || profile?.role === "manager";
  const filter = useMemo(
    () => ({ search, status, page, pageSize: PAGE_SIZE }),
    [page, search, status],
  );
  const { data, error, isLoading } = useQuery(leadsQueryOptions(filter));
  const leads = data?.leads ?? [];
  const total = data?.total ?? 0;
  const pageCount = data?.pageCount ?? 1;

  const updateLead = useMutation({
    mutationFn: leadService.updateLead,
    onSuccess: async ({ lead }) => {
      await queryClient.invalidateQueries({ queryKey: leadQueryKeys.all });
      setSelectedLead(lead);
      toast.success("Lead atualizado.");
    },
    onError: (mutationError) => {
      toast.danger(
        mutationError instanceof Error
          ? mutationError.message
          : "Não foi possível atualizar o lead.",
      );
    },
  });

  const convertLead = useMutation({
    mutationFn: leadService.convertLead,
    onSuccess: async ({ lead }) => {
      await queryClient.invalidateQueries({ queryKey: leadQueryKeys.all });
      await queryClient.invalidateQueries({ queryKey: ["clients"] });
      setSelectedLead(lead);
      toast.success("Lead convertido em cliente.");
    },
    onError: (mutationError) => {
      toast.danger(
        mutationError instanceof Error
          ? mutationError.message
          : "Não foi possível converter o lead.",
      );
    },
  });

  const columns: Array<DataTableColumn<Lead>> = [
    {
      key: "lead",
      header: "Lead",
      cell: (lead) => (
        <div className="flex min-w-52 items-center gap-3">
          <div className="grid size-9 shrink-0 place-items-center rounded-lg bg-accent text-xs font-semibold">
            {lead.companyName.slice(0, 2).toUpperCase()}
          </div>
          <div className="min-w-0">
            <div className="truncate font-medium">{lead.companyName}</div>
            <div className="truncate text-xs text-muted-foreground">{lead.name}</div>
          </div>
        </div>
      ),
    },
    {
      key: "contact",
      header: "Contato",
      cell: (lead) => (
        <div>
          <div>{lead.email}</div>
          <div className="text-xs text-muted-foreground">
            {lead.phone ? formatPhone(lead.phone) : "Telefone não informado"}
          </div>
        </div>
      ),
    },
    { key: "interest", header: "Interesse", cell: (lead) => lead.interest || "Não informado" },
    {
      key: "status",
      header: "Status",
      cell: (lead) => (
        <Badge variant={toneForLeadStatus(lead.status)}>{leadStatusLabels[lead.status]}</Badge>
      ),
    },
    { key: "source", header: "Origem", cell: (lead) => lead.source },
    { key: "created", header: "Recebido", cell: (lead) => formatDateTime(lead.createdAt) },
    {
      key: "actions",
      header: <span className="sr-only">Ações</span>,
      cell: (lead) => (
        <div className="flex justify-end">
          <Button type="button" variant="ghost" size="icon" onClick={() => setSelectedLead(lead)}>
            <Eye className="size-4" />
          </Button>
        </div>
      ),
      cellClassName: "text-right",
    },
  ];

  return (
    <div>
      <PageHeader
        title="Leads"
        description="Acompanhe solicitações reais recebidas pelos canais públicos da Automy."
      />
      <FilterBar
        search={search}
        onSearchChange={(value) => {
          setSearch(value);
          setPage(1);
        }}
        searchPlaceholder="Buscar lead, empresa ou e-mail..."
        className="sm:items-center"
      >
        <div className="flex items-center gap-2">
          <SlidersHorizontal className="size-4 text-muted-foreground" />
          <Select
            value={status}
            onChange={(event) => {
              setStatus(event.target.value as LeadStatus | "all");
              setPage(1);
            }}
          >
            {statusOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </Select>
        </div>
      </FilterBar>
      <DataTable
        columns={columns}
        data={leads}
        getRowKey={(lead) => lead.id}
        loading={isLoading}
        error={error}
        emptyState={
          <EmptyState
            title="Nenhum lead encontrado"
            description="Os leads enviados pela Landing aparecerão aqui após registros reais."
          />
        }
        footer={
          <Pagination
            label={`${total} lead${total === 1 ? "" : "s"} • página ${page} de ${pageCount}`}
            page={page}
            pageCount={pageCount}
            onPageChange={setPage}
          />
        }
      />
      <Modal
        open={Boolean(selectedLead)}
        onClose={() => setSelectedLead(null)}
        title={selectedLead ? leadLabel(selectedLead) : "Lead"}
        description="Dados recebidos pelo formulário público."
        size="lg"
      >
        {selectedLead && (
          <div className="grid gap-5">
            <div className="grid gap-4 md:grid-cols-2">
              <Info label="Nome" value={selectedLead.name} />
              <Info label="Empresa" value={selectedLead.companyName} />
              <Info label="E-mail" value={selectedLead.email} />
              <Info
                label="Telefone"
                value={selectedLead.phone ? formatPhone(selectedLead.phone) : ""}
              />
              <Info label="Documento" value={selectedLead.document} />
              <Info label="Origem" value={selectedLead.source} />
              <Info label="Recebido em" value={formatDateTime(selectedLead.createdAt)} />
              <Info label="Responsável" value={selectedLead.assignedUserName} />
            </div>
            <Card>
              <CardBody>
                <div className="text-sm font-medium text-foreground">Mensagem</div>
                <p className="mt-2 whitespace-pre-wrap text-sm text-muted-foreground">
                  {selectedLead.message || "Sem mensagem adicional."}
                </p>
              </CardBody>
            </Card>
            <div className="grid gap-3 md:grid-cols-[minmax(0,1fr)_auto] md:items-end">
              <Field label="Status">
                <Select
                  value={selectedLead.status}
                  disabled={!canManage || updateLead.isPending}
                  onChange={(event) =>
                    updateLead.mutate({
                      id: selectedLead.id,
                      status: event.target.value as LeadStatus,
                      firstContactAt: selectedLead.firstContactAt ?? new Date().toISOString(),
                    })
                  }
                >
                  {statusOptions
                    .filter((option) => option.value !== "all")
                    .map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                </Select>
              </Field>
              <Button
                type="button"
                disabled={!canManage || selectedLead.status === "converted"}
                loading={convertLead.isPending}
                onClick={() => convertLead.mutate(selectedLead.id)}
              >
                <CheckCircle2 className="size-4" />
                Converter em cliente
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}

function Info({ label, value }: { label: string; value?: string | null }) {
  return (
    <div className="rounded-lg border border-border bg-muted/20 p-3">
      <div className="flex items-center gap-2 text-xs font-medium uppercase text-muted-foreground">
        <Building2 className="size-3.5" />
        {label}
      </div>
      <div className="mt-1 break-words text-sm text-foreground">{value || "Não informado"}</div>
    </div>
  );
}
