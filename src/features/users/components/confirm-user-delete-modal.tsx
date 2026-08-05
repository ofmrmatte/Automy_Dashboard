import { Trash2 } from "lucide-react";
import type { ManagedUser } from "@/features/users/types";
import { Button, Modal } from "@/shared/components/ui";

export function ConfirmUserDeleteModal({
  user,
  loading,
  onClose,
  onConfirm,
}: {
  user: ManagedUser | null;
  loading: boolean;
  onClose: () => void;
  onConfirm: (userId: string) => Promise<void>;
}) {
  return (
    <Modal
      open={Boolean(user)}
      onClose={onClose}
      title="Excluir usuário"
      description="A exclusão é lógica e revoga as sessões ativas do usuário."
    >
      <div className="grid gap-5">
        <p className="text-sm text-muted-foreground">
          {user
            ? `Confirme a exclusão de ${user.name}. Esta ação não remove o histórico de auditoria.`
            : ""}
        </p>
        <div className="flex justify-end gap-2">
          <Button type="button" variant="secondary" onClick={onClose}>
            Cancelar
          </Button>
          {user && (
            <Button
              type="button"
              variant="danger"
              loading={loading}
              onClick={() => onConfirm(user.id)}
            >
              <Trash2 className="size-4" />
              Excluir
            </Button>
          )}
        </div>
      </div>
    </Modal>
  );
}
