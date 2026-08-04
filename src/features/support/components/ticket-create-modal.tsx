import { useQueryClient } from "@tanstack/react-query";
import { Save } from "lucide-react";
import { useState, type FormEvent } from "react";
import { supportQueryKeys } from "@/features/support/api/support.queries";
import { supportService } from "@/features/support/services/support.service";
import type { TicketPriority, TicketStatus } from "@/features/support/types";
import { Button, Field, Input, Modal, Select, Textarea } from "@/shared/components/ui";
import { toast } from "@/shared/components/toast";

export function TicketCreateModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const queryClient = useQueryClient();
  const [saving, setSaving] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);

    try {
      setSaving(true);
      await supportService.createTicket({
        clientName: String(formData.get("clientName") || "").trim(),
        title: String(formData.get("title") || "").trim(),
        description: String(formData.get("description") || "").trim(),
        priority: String(formData.get("priority") || "Média") as TicketPriority,
        owner: String(formData.get("owner") || "Automy").trim(),
        status: String(formData.get("status") || "Aberto") as TicketStatus,
      });
      await queryClient.invalidateQueries({ queryKey: supportQueryKeys.tickets });
      toast.success("Ticket salvo no banco da Railway.");
      onClose();
    } catch (error) {
      toast.danger(error instanceof Error ? error.message : "Não foi possível salvar o ticket.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Novo ticket"
      description="Registre o chamado e acompanhe pela área de suporte."
      size="lg"
    >
      <form className="grid gap-4" onSubmit={handleSubmit}>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Cliente">
            <Input name="clientName" required placeholder="Empresa ou contato" />
          </Field>
          <Field label="Responsável">
            <Input name="owner" defaultValue="Automy" />
          </Field>
          <Field label="Título">
            <Input name="title" required placeholder="Resumo do chamado" />
          </Field>
          <Field label="Prioridade">
            <Select name="priority" defaultValue="Média">
              <option>Crítica</option>
              <option>Alta</option>
              <option>Média</option>
              <option>Baixa</option>
            </Select>
          </Field>
          <Field label="Status">
            <Select name="status" defaultValue="Aberto">
              <option>Aberto</option>
              <option>Em andamento</option>
              <option>Aguardando</option>
              <option>Resolvido</option>
            </Select>
          </Field>
        </div>
        <Field label="Descrição">
          <Textarea name="description" placeholder="Detalhes do problema, impacto e próximos passos." />
        </Field>
        <div className="flex justify-end gap-2">
          <Button type="button" variant="secondary" onClick={onClose}>
            Cancelar
          </Button>
          <Button loading={saving}>
            <Save className="size-4" />
            Salvar ticket
          </Button>
        </div>
      </form>
    </Modal>
  );
}
