import { zodResolver } from "@hookform/resolvers/zod";
import { Save } from "lucide-react";
import { useEffect } from "react";
import { useForm } from "react-hook-form";
import type { Client } from "@/features/clients/types";
import type { Ticket } from "@/features/support/types";
import {
  ticketFormSchema,
  ticketPriorities,
  ticketStatuses,
  type TicketFormValues,
} from "@/features/support/validation";
import type { ManagedUser } from "@/features/users/types";
import { Button, Field, Input, Modal, Select, Textarea } from "@/shared/components/ui";

const defaultValues: TicketFormValues = {
  id: "",
  clientId: "",
  ownerUserId: "",
  title: "",
  description: "",
  category: "Operacional",
  priority: "Média",
  status: "Aberto",
  firstResponseDueAt: "",
  resolutionDueAt: "",
  tags: "",
  initialMessage: "",
};

function ticketToFormValues(ticket: Ticket | null | undefined): TicketFormValues {
  if (!ticket) return defaultValues;

  return {
    id: ticket.id,
    clientId: ticket.clientId,
    ownerUserId: ticket.ownerUserId,
    title: ticket.title,
    description: ticket.description,
    category: ticket.category,
    priority: ticket.priority,
    status: ticket.status,
    firstResponseDueAt: ticket.firstResponseDueAt?.slice(0, 16) ?? "",
    resolutionDueAt: ticket.resolutionDueAt?.slice(0, 16) ?? "",
    tags: ticket.tags.join(", "),
    initialMessage: "",
  };
}

export function TicketCreateModal({
  open,
  ticket,
  clients,
  users,
  saving,
  onClose,
  onSubmit,
}: {
  open: boolean;
  ticket?: Ticket | null;
  clients: Client[];
  users: ManagedUser[];
  saving: boolean;
  onClose: () => void;
  onSubmit: (values: TicketFormValues) => Promise<unknown>;
}) {
  const isEditing = Boolean(ticket);
  const form = useForm<TicketFormValues>({
    resolver: zodResolver(ticketFormSchema),
    defaultValues: ticketToFormValues(ticket),
  });

  useEffect(() => {
    form.reset(ticketToFormValues(ticket));
  }, [form, open, ticket]);

  async function handleSubmit(values: TicketFormValues) {
    await onSubmit(values);
    if (!isEditing) form.reset(defaultValues);
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={isEditing ? "Editar ticket" : "Novo ticket"}
      description="Registre o chamado com cliente, responsável, SLA e histórico operacional."
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
            <Input placeholder="Resumo do chamado" {...form.register("title")} />
            <FormError message={form.formState.errors.title?.message} />
          </Field>
          <Field label="Categoria">
            <Input placeholder="Operacional" {...form.register("category")} />
            <FormError message={form.formState.errors.category?.message} />
          </Field>
          <Field label="Prioridade">
            <Select {...form.register("priority")}>
              {ticketPriorities.map((priority) => (
                <option key={priority} value={priority}>
                  {priority}
                </option>
              ))}
            </Select>
            <FormError message={form.formState.errors.priority?.message} />
          </Field>
          <Field label="Status">
            <Select {...form.register("status")}>
              {ticketStatuses.map((status) => (
                <option key={status} value={status}>
                  {status}
                </option>
              ))}
            </Select>
            <FormError message={form.formState.errors.status?.message} />
          </Field>
          <Field label="Primeira resposta">
            <Input type="datetime-local" {...form.register("firstResponseDueAt")} />
            <FormError message={form.formState.errors.firstResponseDueAt?.message} />
          </Field>
          <Field label="Resolução">
            <Input type="datetime-local" {...form.register("resolutionDueAt")} />
            <FormError message={form.formState.errors.resolutionDueAt?.message} />
          </Field>
        </div>
        <Field label="Tags">
          <Input placeholder="Separe por vírgula" {...form.register("tags")} />
          <FormError message={form.formState.errors.tags?.message} />
        </Field>
        <Field label="Descrição">
          <Textarea
            placeholder="Detalhes do problema, impacto e próximos passos."
            {...form.register("description")}
          />
          <FormError message={form.formState.errors.description?.message} />
        </Field>
        {!isEditing && (
          <Field label="Mensagem inicial">
            <Textarea
              placeholder="Registro interno inicial do atendimento."
              {...form.register("initialMessage")}
            />
            <FormError message={form.formState.errors.initialMessage?.message} />
          </Field>
        )}
        <div className="flex justify-end gap-2">
          <Button type="button" variant="secondary" onClick={onClose}>
            Cancelar
          </Button>
          <Button type="submit" loading={saving}>
            <Save className="size-4" />
            {isEditing ? "Salvar alterações" : "Salvar ticket"}
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
