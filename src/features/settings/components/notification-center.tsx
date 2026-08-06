import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Archive, Bell, CheckCheck } from "lucide-react";
import { useState } from "react";
import {
  notificationsQueryOptions,
  settingsQueryKeys,
} from "@/features/settings/api/settings.queries";
import { settingsService } from "@/features/settings/services/settings.service";
import { EmptyState } from "@/shared/components/empty-state";
import { toast } from "@/shared/components/toast";
import { Badge, Button, Card } from "@/shared/components/ui";
import { formatDateTime } from "@/shared/utils/regional-formatters";

export function NotificationCenter() {
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const { data, error, isLoading } = useQuery(notificationsQueryOptions());
  const unreadCount = data?.unreadCount ?? 0;

  async function refresh() {
    await queryClient.invalidateQueries({ queryKey: settingsQueryKeys.notifications });
  }

  async function markRead(id: string) {
    try {
      await settingsService.markNotificationRead(id);
      await refresh();
    } catch (error) {
      toast.danger(error instanceof Error ? error.message : "Não foi possível atualizar.");
    }
  }

  async function markAllRead() {
    try {
      await settingsService.markAllNotificationsRead();
      await refresh();
      toast.success("Notificações marcadas como lidas.");
    } catch (error) {
      toast.danger(error instanceof Error ? error.message : "Não foi possível atualizar.");
    }
  }

  async function archive(id: string) {
    try {
      await settingsService.archiveNotification(id);
      await refresh();
      toast.success("Notificação arquivada.");
    } catch (error) {
      toast.danger(error instanceof Error ? error.message : "Não foi possível arquivar.");
    }
  }

  return (
    <div className="relative">
      <Button
        variant="ghost"
        size="icon"
        className="relative"
        aria-label="Notificações"
        onClick={() => setOpen((value) => !value)}
      >
        <Bell className="size-4" />
        {unreadCount > 0 && (
          <span className="absolute right-1 top-1 grid min-w-4 place-items-center rounded-full bg-destructive px-1 text-[10px] font-semibold text-destructive-foreground">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </Button>
      {open && (
        <Card className="absolute right-0 top-11 z-50 w-[min(360px,calc(100vw-2rem))] overflow-hidden shadow-modal">
          <div className="flex items-center justify-between border-b border-border p-4">
            <div>
              <div className="font-semibold text-foreground">Notificações</div>
              <div className="text-xs text-muted-foreground">{unreadCount} não lidas</div>
            </div>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              disabled={unreadCount === 0}
              onClick={markAllRead}
            >
              <CheckCheck className="size-4" />
              Marcar todas
            </Button>
          </div>
          <div className="max-h-96 overflow-y-auto">
            {isLoading ? (
              <div className="p-4 text-sm text-muted-foreground">Carregando...</div>
            ) : error ? (
              <EmptyState title="Não foi possível carregar" description={error.message} />
            ) : data?.notifications.length ? (
              data.notifications.map((notification) => (
                <div
                  key={notification.id}
                  className="grid gap-2 border-b border-border p-4 text-sm last:border-b-0"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="font-medium text-foreground">{notification.title}</div>
                    <Badge variant={notification.status === "unread" ? "info" : "inactive"}>
                      {notification.status === "unread" ? "Nova" : "Lida"}
                    </Badge>
                  </div>
                  {notification.description && (
                    <p className="text-muted-foreground">{notification.description}</p>
                  )}
                  <div className="flex items-center justify-between gap-3 text-xs text-muted-foreground">
                    <span>{formatDateTime(notification.createdAt)}</span>
                    <div className="flex items-center gap-3">
                      {notification.status === "unread" && (
                        <button
                          type="button"
                          className="font-medium text-primary"
                          onClick={() => markRead(notification.id)}
                        >
                          Marcar como lida
                        </button>
                      )}
                      <button
                        type="button"
                        className="inline-flex items-center gap-1 font-medium text-muted-foreground transition-colors hover:text-foreground"
                        onClick={() => archive(notification.id)}
                      >
                        <Archive className="size-3.5" />
                        Arquivar
                      </button>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <EmptyState
                title="Nenhuma notificação"
                description="Eventos reais aparecerão aqui quando forem gerados pelos módulos."
              />
            )}
          </div>
        </Card>
      )}
    </div>
  );
}
