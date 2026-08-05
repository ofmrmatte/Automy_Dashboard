import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  CalendarPlus,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Clock,
  Eye,
  Link as LinkIcon,
  Pencil,
  Plus,
  SlidersHorizontal,
  Trash2,
  XCircle,
} from "lucide-react";
import { useMemo, useState } from "react";
import { clientsQueryOptions } from "@/features/clients/api/client.queries";
import { useIdentity } from "@/features/identity/context/identity-context";
import {
  scheduledCallsQueryOptions,
  schedulingQueryKeys,
} from "@/features/scheduling/api/scheduling.queries";
import { ScheduledCallModal } from "@/features/scheduling/components/scheduled-call-modal";
import { schedulingService } from "@/features/scheduling/services/scheduling.service";
import type { ScheduledCall, ScheduledCallFilter } from "@/features/scheduling/types";
import { dateKeyInTimeZone, timeInTimeZone } from "@/features/scheduling/utils/timezone";
import {
  scheduledCallFormSchema,
  scheduledCallStatusLabels,
  type ScheduledCallFormValues,
} from "@/features/scheduling/validation";
import { usersQueryOptions } from "@/features/users/api/user.queries";
import { DataTable, type DataTableColumn } from "@/shared/components/data-table";
import { EmptyState } from "@/shared/components/empty-state";
import { FilterBar } from "@/shared/components/filter-bar";
import { PageHeader } from "@/shared/components/page-header";
import { toast } from "@/shared/components/toast";
import { Badge, Button, Card, Modal, Pagination, Select } from "@/shared/components/ui";
import { toneForStatus } from "@/shared/types/status";
import {
  FALLBACK_TIME_ZONE,
  detectBrowserTimeZone,
  formatDateTime,
  formatLongDate,
  resolveTimeZone,
  type RegionalFormatPreferences,
} from "@/shared/utils/regional-formatters";

const PAGE_SIZE = 10;
const EMPTY_CALLS: ScheduledCall[] = [];
const weekdayLabels = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];

function localDateKey(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function dateFromKey(value: string) {
  const [year = 1970, month = 1, day = 1] = value.split("-").map(Number);
  return new Date(year, month - 1, day, 12);
}

function startOfMonth(date: Date) {
  return new Date(date.getFullYear(), date.getMonth(), 1);
}

function addMonths(date: Date, amount: number) {
  return new Date(date.getFullYear(), date.getMonth() + amount, 1);
}

function buildCalendarDays(month: Date) {
  const first = startOfMonth(month);
  const start = new Date(first);
  start.setDate(first.getDate() - first.getDay());

  return Array.from({ length: 42 }, (_, index) => {
    const day = new Date(start);
    day.setDate(start.getDate() + index);
    return day;
  });
}

function callsForDate(calls: ScheduledCall[], selectedDate: string, timezone: string) {
  return calls
    .filter((call) => dateKeyInTimeZone(call.startAt, timezone) === selectedDate)
    .sort((a, b) => new Date(a.startAt).getTime() - new Date(b.startAt).getTime());
}

export function SchedulingPage() {
  const queryClient = useQueryClient();
  const { preferences, profile } = useIdentity();
  const regionalPreferences: RegionalFormatPreferences = useMemo(
    () => ({
      locale: preferences?.language,
      timeZone: preferences?.timeZone,
      currency: preferences?.currency,
      dateFormat: preferences?.dateFormat,
      timeFormat: preferences?.timeFormat,
    }),
    [
      preferences?.currency,
      preferences?.dateFormat,
      preferences?.language,
      preferences?.timeFormat,
      preferences?.timeZone,
    ],
  );
  const timezone =
    resolveTimeZone(regionalPreferences, profile?.companyTimeZone) ||
    detectBrowserTimeZone() ||
    FALLBACK_TIME_ZONE;
  const locale = regionalPreferences.locale || "pt-BR";
  const [month, setMonth] = useState(() => startOfMonth(new Date()));
  const [selectedDate, setSelectedDate] = useState(() => dateKeyInTimeZone(new Date(), timezone));
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState<ScheduledCallFilter["status"]>("all");
  const [page, setPage] = useState(1);
  const [modal, setModal] = useState(false);
  const [editingCall, setEditingCall] = useState<ScheduledCall | null>(null);
  const [viewingCall, setViewingCall] = useState<ScheduledCall | null>(null);
  const [deletingCall, setDeletingCall] = useState<ScheduledCall | null>(null);
  const userFilters = useMemo(
    () => ({ search: "", role: "all" as const, status: "active" as const, page: 1, pageSize: 100 }),
    [],
  );
  const { data: calls = EMPTY_CALLS, error, isLoading } = useQuery(scheduledCallsQueryOptions());
  const { data: clients = [] } = useQuery(clientsQueryOptions());
  const { data: usersPayload } = useQuery(usersQueryOptions(userFilters));
  const users = useMemo(() => usersPayload?.users ?? [], [usersPayload?.users]);
  const days = useMemo(() => buildCalendarDays(month), [month]);
  const filtered = useMemo(
    () => schedulingService.filterCalls(calls, { search, status }),
    [calls, search, status],
  );
  const selectedCalls = useMemo(
    () => callsForDate(filtered, selectedDate, timezone),
    [filtered, selectedDate, timezone],
  );
  const pageCount = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const paginated = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);
  const monthLabel = new Intl.DateTimeFormat(locale, { month: "long", year: "numeric" }).format(
    month,
  );
  const selectedDateLabel = formatLongDate(dateFromKey(selectedDate), regionalPreferences);

  const callCountByDate = useMemo(() => {
    const count = new Map<string, number>();
    for (const call of calls) {
      const key = dateKeyInTimeZone(call.startAt, timezone);
      count.set(key, (count.get(key) ?? 0) + 1);
    }
    return count;
  }, [calls, timezone]);

  const saveCall = useMutation({
    mutationFn: async (values: ScheduledCallFormValues) => {
      const payload = scheduledCallFormSchema.parse(values);
      return payload.id
        ? schedulingService.updateCall({ ...payload, id: payload.id })
        : schedulingService.createCall(payload);
    },
    onSuccess: async (call, values) => {
      await queryClient.invalidateQueries({ queryKey: schedulingQueryKeys.all });
      toast.success(values.id ? "Call atualizada." : "Call agendada.");
      setModal(false);
      setEditingCall(null);
      if (call) {
        setSelectedDate(dateKeyInTimeZone(call.startAt, timezone));
        setViewingCall(call);
      }
    },
    onError: (mutationError) => {
      toast.danger(
        mutationError instanceof Error ? mutationError.message : "Não foi possível salvar a call.",
      );
    },
  });

  const updateStatus = useMutation({
    mutationFn: ({
      call,
      nextStatus,
    }: {
      call: ScheduledCall;
      nextStatus: ScheduledCall["status"];
    }) => schedulingService.updateCallStatus(call.id, nextStatus),
    onSuccess: async (_, variables) => {
      await queryClient.invalidateQueries({ queryKey: schedulingQueryKeys.all });
      toast.success(`Call atualizada para ${scheduledCallStatusLabels[variables.nextStatus]}.`);
    },
    onError: (mutationError) => {
      toast.danger(
        mutationError instanceof Error
          ? mutationError.message
          : "Não foi possível atualizar o status.",
      );
    },
  });

  const deleteCall = useMutation({
    mutationFn: (callId: string) => schedulingService.removeCall(callId),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: schedulingQueryKeys.all });
      toast.success("Call excluída logicamente.");
      setDeletingCall(null);
    },
    onError: (mutationError) => {
      toast.danger(
        mutationError instanceof Error ? mutationError.message : "Não foi possível excluir a call.",
      );
    },
  });

  const callColumns = useMemo<Array<DataTableColumn<ScheduledCall>>>(
    () => [
      {
        key: "title",
        header: "Call",
        cell: (call) => (
          <div className="min-w-0">
            <span className="block truncate font-medium">{call.title}</span>
            <span className="block truncate text-xs text-muted-foreground">{call.clientName}</span>
          </div>
        ),
      },
      {
        key: "period",
        header: "Início",
        cell: (call) => formatDateTime(call.startAt, regionalPreferences),
      },
      {
        key: "owner",
        header: "Responsável",
        cell: (call) => users.find((user) => user.id === call.ownerUserId)?.name || "Não definido",
      },
      {
        key: "status",
        header: "Status",
        cell: (call) => <Badge tone={toneForStatus(call.status)}>{call.statusLabel}</Badge>,
      },
      {
        key: "actions",
        header: <span className="sr-only">Ações</span>,
        cell: (call) => (
          <div className="flex justify-end gap-1">
            <Button
              type="button"
              variant="ghost"
              size="icon"
              aria-label={`Visualizar ${call.title}`}
              onClick={() => setViewingCall(call)}
            >
              <Eye className="size-4" />
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              aria-label={`Editar ${call.title}`}
              onClick={() => {
                setEditingCall(call);
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
              aria-label="Concluir call"
              disabled={call.status === "completed" || call.status === "canceled"}
              onClick={() => updateStatus.mutate({ call, nextStatus: "completed" })}
            >
              <CheckCircle2 className="size-4" />
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              loading={updateStatus.isPending}
              aria-label="Cancelar call"
              disabled={call.status === "canceled" || call.status === "completed"}
              onClick={() => updateStatus.mutate({ call, nextStatus: "canceled" })}
            >
              <XCircle className="size-4" />
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              aria-label={`Excluir ${call.title}`}
              onClick={() => setDeletingCall(call)}
            >
              <Trash2 className="size-4" />
            </Button>
          </div>
        ),
        cellClassName: "text-right",
      },
    ],
    [regionalPreferences, updateStatus, users],
  );

  return (
    <div>
      <PageHeader
        title="Call de agendamento"
        description="Calendário operacional para registrar calls reais com clientes."
        action={
          <Button
            onClick={() => {
              setEditingCall(null);
              setModal(true);
            }}
          >
            <Plus className="size-4" />
            Nova call
          </Button>
        }
      />

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_420px]">
        <Card className="overflow-hidden">
          <div className="flex items-center justify-between border-b border-border p-4">
            <Button variant="ghost" size="icon" onClick={() => setMonth(addMonths(month, -1))}>
              <ChevronLeft className="size-4" />
            </Button>
            <h2 className="text-lg font-semibold capitalize">{monthLabel}</h2>
            <Button variant="ghost" size="icon" onClick={() => setMonth(addMonths(month, 1))}>
              <ChevronRight className="size-4" />
            </Button>
          </div>
          <div className="grid grid-cols-7 border-b border-border bg-muted/60 text-center text-xs font-medium text-muted-foreground">
            {weekdayLabels.map((label) => (
              <div key={label} className="p-3">
                {label}
              </div>
            ))}
          </div>
          <div className="grid grid-cols-7">
            {days.map((day) => {
              const key = localDateKey(day);
              const inMonth = day.getMonth() === month.getMonth();
              const active = key === selectedDate;
              const count = callCountByDate.get(key) ?? 0;

              return (
                <button
                  key={key}
                  type="button"
                  onClick={() => setSelectedDate(key)}
                  className={
                    active
                      ? "min-h-24 border border-primary bg-primary/10 p-2 text-left text-foreground"
                      : "min-h-24 border border-border p-2 text-left text-foreground hover:bg-muted/50"
                  }
                >
                  <span
                    className={inMonth ? "text-sm font-medium" : "text-sm text-muted-foreground"}
                  >
                    {day.getDate()}
                  </span>
                  {count > 0 && (
                    <div className="mt-3 inline-flex items-center rounded-full bg-primary px-2 py-1 text-xs text-primary-foreground">
                      {count} call{count > 1 ? "s" : ""}
                    </div>
                  )}
                </button>
              );
            })}
          </div>
        </Card>

        <Card className="p-5">
          <div className="mb-4 flex items-center justify-between">
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <CalendarPlus className="size-5 text-primary" />
                <h2 className="font-semibold">Calls do dia</h2>
              </div>
              <p className="mt-1 text-sm text-muted-foreground">{selectedDateLabel}</p>
            </div>
            <Badge variant="info">{selectedCalls.length}</Badge>
          </div>
          {isLoading && <p className="text-sm text-muted-foreground">Carregando agenda...</p>}
          {error && <p className="text-sm text-destructive">{error.message}</p>}
          {!isLoading && selectedCalls.length === 0 && (
            <EmptyState
              title="Nenhuma call neste dia"
              description="Calls reais aparecerão aqui quando forem agendadas."
            />
          )}
          <div className="grid gap-3">
            {selectedCalls.map((call) => (
              <div key={call.id} className="rounded-card border border-border p-3">
                <div className="flex items-center justify-between gap-3">
                  <div className="min-w-0 font-medium">{call.title}</div>
                  <Badge tone={toneForStatus(call.status)}>{call.statusLabel}</Badge>
                </div>
                <div className="mt-2 flex flex-wrap gap-3 text-sm text-muted-foreground">
                  <span className="inline-flex items-center gap-1">
                    <Clock className="size-3.5" />
                    {timeInTimeZone(call.startAt, timezone)} -{" "}
                    {timeInTimeZone(call.endAt, timezone)}
                  </span>
                  <span>{call.clientName}</span>
                </div>
                {call.meetingLink && (
                  <a
                    href={call.meetingLink}
                    target="_blank"
                    rel="noreferrer"
                    className="mt-2 inline-flex items-center gap-1 text-sm text-primary"
                  >
                    <LinkIcon className="size-3.5" />
                    Abrir reunião
                  </a>
                )}
              </div>
            ))}
          </div>
        </Card>
      </div>

      <FilterBar
        search={search}
        onSearchChange={(value) => {
          setSearch(value);
          setPage(1);
        }}
        searchPlaceholder="Buscar call..."
        className="mt-7 sm:items-center"
      >
        <div className="flex flex-wrap items-center gap-2">
          <SlidersHorizontal className="size-4 text-muted-foreground" />
          <Select
            value={status}
            onChange={(event) => {
              setStatus(event.target.value as ScheduledCallFilter["status"]);
              setPage(1);
            }}
          >
            <option value="all">Todos</option>
            <option value="scheduled">Agendada</option>
            <option value="rescheduled">Reagendada</option>
            <option value="completed">Concluída</option>
            <option value="canceled">Cancelada</option>
          </Select>
        </div>
      </FilterBar>

      <DataTable
        columns={callColumns}
        data={paginated}
        getRowKey={(call) => call.id}
        loading={isLoading}
        error={error}
        emptyState={
          <EmptyState
            title="Nenhuma call encontrada"
            description="Agendamentos reais aparecerão aqui quando forem cadastrados."
          />
        }
        footer={
          <Pagination
            label={`${filtered.length} call${filtered.length === 1 ? "" : "s"} • página ${page} de ${pageCount}`}
            page={page}
            pageCount={pageCount}
            onPageChange={setPage}
          />
        }
      />

      <ScheduledCallModal
        open={modal}
        call={editingCall}
        clients={clients}
        users={users}
        fallbackTimezone={timezone}
        saving={saveCall.isPending}
        onClose={() => {
          setModal(false);
          setEditingCall(null);
        }}
        onSubmit={(values) => saveCall.mutateAsync(values)}
      />
      <ScheduledCallViewModal
        call={viewingCall}
        users={users}
        preferences={regionalPreferences}
        onClose={() => setViewingCall(null)}
      />
      <Modal
        open={Boolean(deletingCall)}
        onClose={() => setDeletingCall(null)}
        title="Excluir call"
        description="A exclusão é lógica e preserva o histórico para auditoria."
      >
        <div className="grid gap-5">
          <p className="text-sm text-muted-foreground">
            Confirme a exclusão da call {deletingCall?.title}. Ela deixará de aparecer nas listagens
            operacionais.
          </p>
          <div className="flex justify-end gap-2">
            <Button type="button" variant="secondary" onClick={() => setDeletingCall(null)}>
              Cancelar
            </Button>
            <Button
              type="button"
              variant="danger"
              loading={deleteCall.isPending}
              onClick={() => deletingCall && deleteCall.mutate(deletingCall.id)}
            >
              <Trash2 className="size-4" />
              Excluir call
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}

function ScheduledCallViewModal({
  call,
  users,
  preferences,
  onClose,
}: {
  call: ScheduledCall | null;
  users: Array<{ id: string; name: string }>;
  preferences: RegionalFormatPreferences;
  onClose: () => void;
}) {
  const owner = call ? users.find((user) => user.id === call.ownerUserId)?.name : "";

  return (
    <Modal open={Boolean(call)} onClose={onClose} title="Detalhes da call" size="lg">
      {call && (
        <div className="grid gap-5">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h3 className="text-lg font-semibold text-foreground">{call.title}</h3>
              <p className="text-sm text-muted-foreground">{call.clientName}</p>
            </div>
            <Badge tone={toneForStatus(call.status)}>{call.statusLabel}</Badge>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <Info label="Início" value={formatDateTime(call.startAt, preferences)} />
            <Info label="Fim" value={formatDateTime(call.endAt, preferences)} />
            <Info label="Timezone" value={call.timezone} />
            <Info label="Responsável" value={owner || "Não definido"} />
            <Info label="Contato" value={call.contactName || "Não informado"} />
            <Info label="Telefone" value={call.contactPhone || "Não informado"} />
            <Info label="E-mail" value={call.contactEmail || "Não informado"} />
            <Info label="Lembrete" value={`${call.reminderMinutes} min`} />
          </div>
          {call.meetingLink && (
            <a
              href={call.meetingLink}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-2 text-sm font-medium text-primary"
            >
              <LinkIcon className="size-4" />
              Abrir link da reunião
            </a>
          )}
          <InfoBlock label="Participantes" value={call.participants.join(", ")} />
          <InfoBlock label="Descrição" value={call.description} />
          <InfoBlock label="Observações" value={call.notes} />
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
