import { zodResolver } from "@hookform/resolvers/zod";
import { Save } from "lucide-react";
import { useEffect, useMemo } from "react";
import { useForm } from "react-hook-form";
import type { Client } from "@/features/clients/types";
import type { Contract } from "@/features/contracts/types";
import type { Charge } from "@/features/finance/types";
import {
  chargeFormSchema,
  chargeMethods,
  chargeStatusLabels,
  chargeStatuses,
  type ChargeFormValues,
} from "@/features/finance/validation";
import { Button, Field, Input, Modal, Select, Textarea } from "@/shared/components/ui";

const defaultValues: ChargeFormValues = {
  id: "",
  clientId: "",
  contractId: "",
  invoice: "",
  reference: "",
  description: "",
  dueDate: "",
  amount: 0,
  method: "Boleto",
  status: "pending",
  notes: "",
};

function chargeToFormValues(charge: Charge | null | undefined): ChargeFormValues {
  if (!charge) return defaultValues;

  return {
    id: charge.id,
    clientId: charge.clientId,
    contractId: charge.contractId,
    invoice: charge.invoice,
    reference: charge.reference,
    description: charge.description,
    dueDate: charge.dueDate,
    amount: charge.amount,
    method: charge.method as ChargeFormValues["method"],
    status: charge.status,
    notes: charge.notes,
  };
}

export function ChargeCreateModal({
  open,
  charge,
  clients,
  contracts,
  saving,
  onClose,
  onSubmit,
}: {
  open: boolean;
  charge?: Charge | null;
  clients: Client[];
  contracts: Contract[];
  saving: boolean;
  onClose: () => void;
  onSubmit: (values: ChargeFormValues) => Promise<unknown>;
}) {
  const isEditing = Boolean(charge);
  const form = useForm<ChargeFormValues>({
    resolver: zodResolver(chargeFormSchema),
    defaultValues: chargeToFormValues(charge),
  });
  const selectedClientId = form.watch("clientId");
  const availableContracts = useMemo(
    () =>
      contracts.filter((contract) => !selectedClientId || contract.clientId === selectedClientId),
    [contracts, selectedClientId],
  );

  useEffect(() => {
    form.reset(chargeToFormValues(charge));
  }, [charge, form, open]);

  async function handleSubmit(values: ChargeFormValues) {
    await onSubmit(values);
    if (!isEditing) form.reset(defaultValues);
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={isEditing ? "Editar cobrança" : "Nova cobrança"}
      description="Registre cobranças reais vinculadas a clientes e contratos da operação."
      size="lg"
    >
      <form className="grid gap-5" onSubmit={form.handleSubmit(handleSubmit)}>
        <input type="hidden" {...form.register("id")} />
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Cliente">
            <Select {...form.register("clientId")}>
              <option value="">Selecione</option>
              {clients.map((client) => (
                <option key={client.id} value={client.id}>
                  {client.name}
                </option>
              ))}
            </Select>
            <FormError message={form.formState.errors.clientId?.message} />
          </Field>
          <Field label="Contrato">
            <Select {...form.register("contractId")}>
              <option value="">Sem contrato vinculado</option>
              {availableContracts.map((contract) => (
                <option key={contract.id} value={contract.id}>
                  {contract.plan || contract.product || contract.id}
                </option>
              ))}
            </Select>
            <FormError message={form.formState.errors.contractId?.message} />
          </Field>
          <Field label="Fatura">
            <Input placeholder="NF-0001" {...form.register("invoice")} />
            <FormError message={form.formState.errors.invoice?.message} />
          </Field>
          <Field label="Referência">
            <Input
              placeholder="Competência ou referência interna"
              {...form.register("reference")}
            />
            <FormError message={form.formState.errors.reference?.message} />
          </Field>
          <Field label="Vencimento">
            <Input type="date" {...form.register("dueDate")} />
            <FormError message={form.formState.errors.dueDate?.message} />
          </Field>
          <Field label="Valor">
            <Input type="number" min={0} step="0.01" {...form.register("amount")} />
            <FormError message={form.formState.errors.amount?.message} />
          </Field>
          <Field label="Método">
            <Select {...form.register("method")}>
              {chargeMethods.map((method) => (
                <option key={method}>{method}</option>
              ))}
            </Select>
            <FormError message={form.formState.errors.method?.message} />
          </Field>
          <Field label="Status">
            <Select {...form.register("status")}>
              {chargeStatuses.map((status) => (
                <option key={status} value={status}>
                  {chargeStatusLabels[status]}
                </option>
              ))}
            </Select>
            <FormError message={form.formState.errors.status?.message} />
          </Field>
        </div>
        <Field label="Descrição">
          <Textarea placeholder="Descrição da cobrança" {...form.register("description")} />
          <FormError message={form.formState.errors.description?.message} />
        </Field>
        <Field label="Observações">
          <Textarea placeholder="Notas internas de conciliação" {...form.register("notes")} />
          <FormError message={form.formState.errors.notes?.message} />
        </Field>
        <div className="flex justify-end gap-2">
          <Button type="button" variant="secondary" onClick={onClose}>
            Cancelar
          </Button>
          <Button type="submit" loading={saving}>
            <Save className="size-4" />
            {isEditing ? "Salvar alterações" : "Salvar cobrança"}
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
