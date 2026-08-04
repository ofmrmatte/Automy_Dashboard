import { useQueryClient } from "@tanstack/react-query";
import { Save } from "lucide-react";
import { useState, type FormEvent } from "react";
import { clientQueryKeys } from "@/features/clients/api/client.queries";
import { clientService } from "@/features/clients/services/client.service";
import type { ClientStatus } from "@/features/clients/types";
import { Button, Field, Input, Modal, Select } from "@/shared/components/ui";
import { toast } from "@/shared/components/toast";

export function ClientCreateModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const queryClient = useQueryClient();
  const [saving, setSaving] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);

    try {
      setSaving(true);
      await clientService.createClient({
        tradeName: String(formData.get("tradeName") || "").trim(),
        legalName: String(formData.get("legalName") || "").trim(),
        document: String(formData.get("document") || "").trim(),
        city: String(formData.get("city") || "").trim(),
        state: String(formData.get("state") || "").trim().toUpperCase(),
        owner: String(formData.get("owner") || "").trim(),
        plan: String(formData.get("plan") || "").trim(),
        status: String(formData.get("status") || "Pendente") as ClientStatus,
      });
      await queryClient.invalidateQueries({ queryKey: clientQueryKeys.all });
      toast.success("Cliente salvo no banco da Railway.");
      onClose();
    } catch (error) {
      toast.danger(error instanceof Error ? error.message : "Não foi possível salvar o cliente.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Novo cliente"
      description="Cadastre a empresa e salve no banco permanente."
      size="lg"
    >
      <form className="grid gap-4" onSubmit={handleSubmit}>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Nome fantasia">
            <Input name="tradeName" required placeholder="Nome da empresa" />
          </Field>
          <Field label="Razão social">
            <Input name="legalName" placeholder="Razão social completa" />
          </Field>
          <Field label="CNPJ">
            <Input name="document" required placeholder="00.000.000/0000-00" />
          </Field>
          <Field label="Responsável">
            <Input name="owner" placeholder="Nome completo" />
          </Field>
          <Field label="Cidade">
            <Input name="city" placeholder="Cidade" />
          </Field>
          <Field label="UF">
            <Input name="state" maxLength={2} placeholder="SP" />
          </Field>
          <Field label="Plano">
            <Select name="plan">
              <option>Growth</option>
              <option>Scale</option>
              <option>Enterprise</option>
              <option>Personalizado</option>
            </Select>
          </Field>
          <Field label="Status">
            <Select name="status">
              <option>Pendente</option>
              <option>Implantação</option>
              <option>Ativo</option>
            </Select>
          </Field>
        </div>
        <div className="flex justify-end gap-2 pt-2">
          <Button type="button" variant="secondary" onClick={onClose}>
            Cancelar
          </Button>
          <Button type="submit" loading={saving}>
            <Save className="size-4" />
            Salvar cliente
          </Button>
        </div>
      </form>
    </Modal>
  );
}
