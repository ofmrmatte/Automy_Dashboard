import { Button, Field, Input, Modal, Select } from "@/shared/components/ui";

export function ClientCreateModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Novo cliente"
      description="Cadastre os dados iniciais da empresa."
    >
      <form
        className="grid gap-4"
        onSubmit={(event) => {
          event.preventDefault();
          onClose();
        }}
      >
        <Field label="Nome fantasia">
          <Input required placeholder="Ex.: Acme Tecnologia" />
        </Field>
        <Field label="CNPJ">
          <Input required placeholder="00.000.000/0000-00" />
        </Field>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Plano">
            <Select>
              <option>Growth</option>
              <option>Scale</option>
              <option>Enterprise</option>
            </Select>
          </Field>
          <Field label="Responsável">
            <Input placeholder="Nome completo" />
          </Field>
        </div>
        <div className="flex justify-end gap-2 pt-2">
          <Button type="button" variant="secondary" onClick={onClose}>
            Cancelar
          </Button>
          <Button type="submit">Salvar cliente</Button>
        </div>
      </form>
    </Modal>
  );
}
