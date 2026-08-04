import { Button, Field, Input, Modal, Select } from "@/shared/components/ui";

export function ProductCreateModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  return (
    <Modal open={open} onClose={onClose} title="Novo produto">
      <form
        className="grid gap-4"
        onSubmit={(event) => {
          event.preventDefault();
          onClose();
        }}
      >
        <Field label="Nome">
          <Input required />
        </Field>
        <Field label="Categoria">
          <Select>
            <option>Automação</option>
            <option>Analytics</option>
            <option>Atendimento</option>
          </Select>
        </Field>
        <div className="flex justify-end gap-2">
          <Button type="button" variant="secondary" onClick={onClose}>
            Cancelar
          </Button>
          <Button>Salvar produto</Button>
        </div>
      </form>
    </Modal>
  );
}
