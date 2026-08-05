import { useQuery } from "@tanstack/react-query";
import { LogOut } from "lucide-react";
import { userSessionsQueryOptions } from "@/features/users/api/user.queries";
import type { ManagedUser } from "@/features/users/types";
import { EmptyState } from "@/shared/components/empty-state";
import { Button, Loader, Modal } from "@/shared/components/ui";
import { formatDateTime } from "@/shared/utils/formatters";

export function UserSessionsModal({
  user,
  loading,
  onClose,
  onRevoke,
}: {
  user: ManagedUser | null;
  loading: boolean;
  onClose: () => void;
  onRevoke: (userId: string) => Promise<void>;
}) {
  const { data = [], isLoading, error } = useQuery(userSessionsQueryOptions(user?.id ?? ""));

  return (
    <Modal
      open={Boolean(user)}
      onClose={onClose}
      title="Sessões ativas"
      {...(user ? { description: `Sessões persistentes de ${user.name}.` } : {})}
      size="lg"
    >
      {isLoading ? (
        <Loader />
      ) : error ? (
        <EmptyState title="Não foi possível carregar sessões" description={error.message} />
      ) : data.length === 0 ? (
        <EmptyState
          title="Nenhuma sessão ativa"
          description="Este usuário não possui sessões persistentes ativas no momento."
        />
      ) : (
        <div className="grid gap-3">
          {data.map((session) => (
            <div
              key={session.id}
              className="grid gap-1 rounded-card border border-border bg-muted/20 p-4 text-sm"
            >
              <span className="font-medium text-foreground">
                Criada em {formatDateTime(session.createdAt)}
              </span>
              <span className="text-muted-foreground">
                Expira em {formatDateTime(session.expiresAt)}
              </span>
              <span className="truncate text-xs text-muted-foreground">
                {session.userAgent ?? "Agente não informado"}
              </span>
            </div>
          ))}
        </div>
      )}
      <div className="mt-5 flex justify-end gap-2">
        <Button type="button" variant="secondary" onClick={onClose}>
          Fechar
        </Button>
        {user && (
          <Button
            type="button"
            variant="danger"
            loading={loading}
            onClick={() => onRevoke(user.id)}
          >
            <LogOut className="size-4" />
            Revogar sessões
          </Button>
        )}
      </div>
    </Modal>
  );
}
