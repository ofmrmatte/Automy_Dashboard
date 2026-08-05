import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  CalendarPlus,
  ChevronLeft,
  ChevronRight,
  Clock,
  Link as LinkIcon,
  Save,
} from "lucide-react";
import { useMemo, useState, type FormEvent } from "react";
import {
  scheduledCallsQueryOptions,
  schedulingQueryKeys,
} from "@/features/scheduling/api/scheduling.queries";
import { schedulingService } from "@/features/scheduling/services/scheduling.service";
import type { ScheduledCall } from "@/features/scheduling/types";
import { PageHeader } from "@/shared/components/page-header";
import { toast } from "@/shared/components/toast";
import { Badge, Button, Card, Field, Input, Textarea } from "@/shared/components/ui";

const monthFormatter = new Intl.DateTimeFormat("pt-BR", { month: "long", year: "numeric" });
const weekdayLabels = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];

function dateKey(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
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

function callsForDate(calls: ScheduledCall[], selectedDate: string) {
  return calls
    .filter((call) => call.scheduledDate === selectedDate)
    .sort((a, b) => a.scheduledTime.localeCompare(b.scheduledTime));
}

export function SchedulingPage() {
  const queryClient = useQueryClient();
  const [month, setMonth] = useState(() => startOfMonth(new Date()));
  const [selectedDate, setSelectedDate] = useState(() => dateKey(new Date()));
  const [saving, setSaving] = useState(false);
  const { data: calls = [], error, isLoading } = useQuery(scheduledCallsQueryOptions());
  const days = useMemo(() => buildCalendarDays(month), [month]);
  const selectedCalls = useMemo(() => callsForDate(calls, selectedDate), [calls, selectedDate]);
  const callCountByDate = useMemo(() => {
    const count = new Map<string, number>();
    for (const call of calls)
      count.set(call.scheduledDate, (count.get(call.scheduledDate) ?? 0) + 1);
    return count;
  }, [calls]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const formData = new FormData(form);

    try {
      setSaving(true);
      await schedulingService.createCall({
        scheduledDate: selectedDate,
        scheduledTime: String(formData.get("scheduledTime") || "").trim(),
        title: String(formData.get("title") || "").trim(),
        clientName: String(formData.get("clientName") || "").trim(),
        contactName: String(formData.get("contactName") || "").trim(),
        contactEmail: String(formData.get("contactEmail") || "").trim(),
        contactPhone: String(formData.get("contactPhone") || "").trim(),
        meetingLink: String(formData.get("meetingLink") || "").trim(),
        notes: String(formData.get("notes") || "").trim(),
        status: "Agendada",
      });
      form.reset();
      await queryClient.invalidateQueries({ queryKey: schedulingQueryKeys.calls });
      toast.success("Call agendada e salva no banco.");
    } catch (error) {
      toast.danger(error instanceof Error ? error.message : "Não foi possível agendar a call.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div>
      <PageHeader
        title="Call de agendamento"
        description="Calendário interativo para marcar calls com clientes e registrar detalhes."
      />

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_420px]">
        <Card className="overflow-hidden">
          <div className="flex items-center justify-between border-b border-border p-4">
            <Button variant="ghost" size="icon" onClick={() => setMonth(addMonths(month, -1))}>
              <ChevronLeft className="size-4" />
            </Button>
            <h2 className="text-lg font-semibold capitalize">{monthFormatter.format(month)}</h2>
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
              const key = dateKey(day);
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

        <div className="grid content-start gap-6">
          <Card className="p-5">
            <div className="mb-4 flex items-center gap-2">
              <CalendarPlus className="size-5 text-primary" />
              <h2 className="font-semibold">Agendar call</h2>
            </div>
            <form className="grid gap-4" onSubmit={handleSubmit}>
              <div className="rounded-lg bg-muted px-3 py-2 text-sm">
                Data selecionada: <span className="font-medium">{selectedDate}</span>
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="Horário">
                  <Input name="scheduledTime" type="time" required />
                </Field>
                <Field label="Cliente">
                  <Input name="clientName" required placeholder="Empresa" />
                </Field>
              </div>
              <Field label="Título da call">
                <Input name="title" required placeholder="Ex: Demonstração do sistema" />
              </Field>
              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="Contato">
                  <Input name="contactName" placeholder="Nome" />
                </Field>
                <Field label="Telefone">
                  <Input name="contactPhone" placeholder="WhatsApp" />
                </Field>
              </div>
              <Field label="E-mail">
                <Input name="contactEmail" type="email" placeholder="contato@empresa.com" />
              </Field>
              <Field label="Link da reunião">
                <Input name="meetingLink" placeholder="Google Meet, Zoom ou WhatsApp" />
              </Field>
              <Field label="Detalhes">
                <Textarea
                  name="notes"
                  placeholder="Objetivo, pauta, necessidades e próximos passos."
                />
              </Field>
              <Button loading={saving}>
                <Save className="size-4" />
                Salvar agendamento
              </Button>
            </form>
          </Card>

          <Card className="p-5">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="font-semibold">Calls do dia</h2>
              <Badge variant="info">{selectedCalls.length}</Badge>
            </div>
            {isLoading && <p className="text-sm text-muted-foreground">Carregando...</p>}
            {error && <p className="text-sm text-destructive">{error.message}</p>}
            {!isLoading && selectedCalls.length === 0 && (
              <p className="text-sm text-muted-foreground">Nenhuma call agendada para este dia.</p>
            )}
            <div className="grid gap-3">
              {selectedCalls.map((call) => (
                <div key={call.id} className="rounded-lg border border-border p-3">
                  <div className="flex items-center justify-between gap-3">
                    <div className="font-medium">{call.title}</div>
                    <Badge variant="success">{call.status}</Badge>
                  </div>
                  <div className="mt-2 flex flex-wrap gap-3 text-sm text-muted-foreground">
                    <span className="inline-flex items-center gap-1">
                      <Clock className="size-3.5" />
                      {call.scheduledTime}
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
                  {call.notes && <p className="mt-2 text-sm text-muted-foreground">{call.notes}</p>}
                </div>
              ))}
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
