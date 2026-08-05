import { zodResolver } from "@hookform/resolvers/zod";
import { Save } from "lucide-react";
import { useEffect } from "react";
import { useForm } from "react-hook-form";
import type { Client } from "@/features/clients/types";
import type { ScheduledCall } from "@/features/scheduling/types";
import { dateKeyInTimeZone, timeInTimeZone } from "@/features/scheduling/utils/timezone";
import {
  scheduledCallFormSchema,
  scheduledCallStatusLabels,
  scheduledCallStatuses,
  type ScheduledCallFormValues,
} from "@/features/scheduling/validation";
import type { ManagedUser } from "@/features/users/types";
import { Button, Field, Input, Modal, Select, Textarea } from "@/shared/components/ui";

function todayKey() {
  return new Date().toISOString().slice(0, 10);
}

const defaultValues: ScheduledCallFormValues = {
  id: "",
  clientId: "",
  ownerUserId: "",
  title: "",
  description: "",
  startDate: todayKey(),
  startTime: "09:00",
  endDate: todayKey(),
  endTime: "09:30",
  timezone: "America/Sao_Paulo",
  meetingLink: "",
  contactName: "",
  contactEmail: "",
  contactPhone: "",
  participants: "",
  reminderMinutes: 30,
  notes: "",
  status: "scheduled",
};

function callToFormValues(call: ScheduledCall | null | undefined, fallbackTimezone: string) {
  if (!call) return { ...defaultValues, timezone: fallbackTimezone };
  const timezone = call.timezone || fallbackTimezone;

  return {
    id: call.id,
    clientId: call.clientId,
    ownerUserId: call.ownerUserId,
    title: call.title,
    description: call.description,
    startDate: dateKeyInTimeZone(call.startAt, timezone),
    startTime: timeInTimeZone(call.startAt, timezone),
    endDate: dateKeyInTimeZone(call.endAt, timezone),
    endTime: timeInTimeZone(call.endAt, timezone),
    timezone,
    meetingLink: call.meetingLink,
    contactName: call.contactName,
    contactEmail: call.contactEmail,
    contactPhone: call.contactPhone,
    participants: call.participants.join(", "),
    reminderMinutes: call.reminderMinutes,
    notes: call.notes,
    status: call.status,
  };
}

export function ScheduledCallModal({
  open,
  call,
  clients,
  users,
  fallbackTimezone,
  saving,
  onClose,
  onSubmit,
}: {
  open: boolean;
  call?: ScheduledCall | null;
  clients: Client[];
  users: ManagedUser[];
  fallbackTimezone: string;
  saving: boolean;
  onClose: () => void;
  onSubmit: (values: ScheduledCallFormValues) => Promise<unknown>;
}) {
  const isEditing = Boolean(call);
  const form = useForm<ScheduledCallFormValues>({
    resolver: zodResolver(scheduledCallFormSchema),
    defaultValues: callToFormValues(call, fallbackTimezone),
  });

  useEffect(() => {
    form.reset(callToFormValues(call, fallbackTimezone));
  }, [call, fallbackTimezone, form, open]);

  async function handleSubmit(values: ScheduledCallFormValues) {
    await onSubmit(values);
    if (!isEditing) form.reset({ ...defaultValues, timezone: fallbackTimezone });
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={isEditing ? "Editar call" : "Nova call"}
      description="Registre agendamentos reais com timezone explícito e persistência em UTC."
      size="lg"
    >
      <form className="grid gap-5" onSubmit={form.handleSubmit(handleSubmit)}>
        <input type="hidden" {...form.register("id")} />
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Cliente">
            <Select {...form.register("clientId")}>
              <option value="">Selecione um cliente</option>
              {clients.map((client) => (
                <option key={client.id} value={client.id}>
                  {client.name}
                </option>
              ))}
            </Select>
            <FormError message={form.formState.errors.clientId?.message} />
          </Field>
          <Field label="Responsável">
            <Select {...form.register("ownerUserId")}>
              <option value="">Sem responsável definido</option>
              {users.map((user) => (
                <option key={user.id} value={user.id}>
                  {user.name}
                </option>
              ))}
            </Select>
            <FormError message={form.formState.errors.ownerUserId?.message} />
          </Field>
          <Field label="Título">
            <Input placeholder="Ex: Reunião de alinhamento" {...form.register("title")} />
            <FormError message={form.formState.errors.title?.message} />
          </Field>
          <Field label="Status">
            <Select {...form.register("status")}>
              {scheduledCallStatuses.map((status) => (
                <option key={status} value={status}>
                  {scheduledCallStatusLabels[status]}
                </option>
              ))}
            </Select>
            <FormError message={form.formState.errors.status?.message} />
          </Field>
          <Field label="Data inicial">
            <Input type="date" {...form.register("startDate")} />
            <FormError message={form.formState.errors.startDate?.message} />
          </Field>
          <Field label="Horário inicial">
            <Input type="time" {...form.register("startTime")} />
            <FormError message={form.formState.errors.startTime?.message} />
          </Field>
          <Field label="Data final">
            <Input type="date" {...form.register("endDate")} />
            <FormError message={form.formState.errors.endDate?.message} />
          </Field>
          <Field label="Horário final">
            <Input type="time" {...form.register("endTime")} />
            <FormError message={form.formState.errors.endTime?.message} />
          </Field>
          <Field label="Timezone">
            <Input placeholder="America/Sao_Paulo" {...form.register("timezone")} />
            <FormError message={form.formState.errors.timezone?.message} />
          </Field>
          <Field label="Lembrete (min)">
            <Input type="number" min={0} max={10080} {...form.register("reminderMinutes")} />
            <FormError message={form.formState.errors.reminderMinutes?.message} />
          </Field>
          <Field label="Contato">
            <Input placeholder="Nome do contato" {...form.register("contactName")} />
            <FormError message={form.formState.errors.contactName?.message} />
          </Field>
          <Field label="Telefone">
            <Input placeholder="WhatsApp" {...form.register("contactPhone")} />
            <FormError message={form.formState.errors.contactPhone?.message} />
          </Field>
          <Field label="E-mail">
            <Input
              type="email"
              placeholder="contato@empresa.com"
              {...form.register("contactEmail")}
            />
            <FormError message={form.formState.errors.contactEmail?.message} />
          </Field>
          <Field label="Link">
            <Input placeholder="https://meet.google.com/..." {...form.register("meetingLink")} />
            <FormError message={form.formState.errors.meetingLink?.message} />
          </Field>
        </div>
        <Field label="Participantes">
          <Textarea
            placeholder="Separe por vírgula, ponto e vírgula ou nova linha."
            {...form.register("participants")}
          />
          <FormError message={form.formState.errors.participants?.message} />
        </Field>
        <Field label="Descrição">
          <Textarea placeholder="Objetivo e pauta." {...form.register("description")} />
          <FormError message={form.formState.errors.description?.message} />
        </Field>
        <Field label="Observações">
          <Textarea placeholder="Próximos passos e notas internas." {...form.register("notes")} />
          <FormError message={form.formState.errors.notes?.message} />
        </Field>
        <div className="flex justify-end gap-2">
          <Button type="button" variant="secondary" onClick={onClose}>
            Cancelar
          </Button>
          <Button type="submit" loading={saving}>
            <Save className="size-4" />
            {isEditing ? "Salvar alterações" : "Salvar agendamento"}
          </Button>
        </div>
      </form>
    </Modal>
  );
}

function FormError({ message }: { message: string | undefined }) {
  if (!message) return null;
  return <span className="text-xs font-normal text-destructive">{message}</span>;
}
