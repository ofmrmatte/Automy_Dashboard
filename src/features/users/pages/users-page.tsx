import { useQuery, useQueryClient } from "@tanstack/react-query";
import { KeyRound, LogOut, Pencil, Plus, ShieldCheck, Trash2 } from "lucide-react";
import { useMemo, useState } from "react";
import { usersQueryOptions, userQueryKeys } from "@/features/users/api/user.queries";
import { ConfirmUserDeleteModal } from "@/features/users/components/confirm-user-delete-modal";
import { UserFormModal } from "@/features/users/components/user-form-modal";
import { UserPasswordModal } from "@/features/users/components/user-password-modal";
import { UserSessionsModal } from "@/features/users/components/user-sessions-modal";
import { userService } from "@/features/users/services/user.service";
import type {
  ManagedUser,
  UpdateUserPasswordPayload,
  UserFilters,
  UserRole,
  UserStatus,
} from "@/features/users/types";
import { USER_ROLE_LABELS, USER_STATUS_LABELS } from "@/features/users/types";
import type { CreateUserFormValues, UpdateUserFormValues } from "@/features/users/validation";
import { DataTable, type DataTableColumn } from "@/shared/components/data-table";
import { EmptyState } from "@/shared/components/empty-state";
import { FilterBar } from "@/shared/components/filter-bar";
import { toast } from "@/shared/components/toast";
import { Badge, Button, Select } from "@/shared/components/ui";
import { getInitials } from "@/shared/utils/formatters";

const roleOptions = Object.entries(USER_ROLE_LABELS);
const statusOptions = Object.entries(USER_STATUS_LABELS);

function statusVariant(status: UserStatus) {
  if (status === "active") return "active";
  if (status === "invited") return "warning";
  if (status === "suspended") return "danger";
  return "inactive";
}

export function UsersPage() {
  const queryClient = useQueryClient();
  const [filters, setFilters] = useState<UserFilters>({
    search: "",
    role: "all",
    status: "all",
    page: 1,
    pageSize: 10,
  });
  const [creating, setCreating] = useState(false);
  const [editing, setEditing] = useState<ManagedUser | null>(null);
  const [passwordUser, setPasswordUser] = useState<ManagedUser | null>(null);
  const [sessionsUser, setSessionsUser] = useState<ManagedUser | null>(null);
  const [deleteUser, setDeleteUser] = useState<ManagedUser | null>(null);
  const [busyAction, setBusyAction] = useState<string | null>(null);
  const { data, error, isLoading } = useQuery(usersQueryOptions(filters));

  const rows = data?.users ?? [];
  const columns = useMemo<Array<DataTableColumn<ManagedUser>>>(
    () => [
      {
        key: "user",
        header: "Usuário",
        cell: (user) => (
          <div className="flex items-center gap-3">
            <div className="grid size-9 place-items-center rounded-lg bg-accent text-xs font-semibold">
              {getInitials(user.name)}
            </div>
            <div>
              <div className="font-medium">{user.name}</div>
              <div className="text-xs text-muted-foreground">{user.email}</div>
            </div>
          </div>
        ),
      },
      {
        key: "role",
        header: "Perfil",
        cell: (user) => (
          <div className="inline-flex items-center gap-2">
            <ShieldCheck className="size-4 text-muted-foreground" />
            {userService.roleLabel(user.role)}
          </div>
        ),
      },
      {
        key: "status",
        header: "Status",
        cell: (user) => (
          <Badge variant={statusVariant(user.status)}>{userService.statusLabel(user.status)}</Badge>
        ),
      },
      {
        key: "lastLogin",
        header: "Último acesso",
        cell: (user) => userService.dateLabel(user.lastLogin),
      },
      {
        key: "sessions",
        header: "Sessões",
        cell: (user) => `${user.activeSessions} ativas`,
      },
      {
        key: "actions",
        header: <span className="sr-only">Ações</span>,
        cell: (user) => (
          <div className="flex justify-end gap-1">
            <Button
              type="button"
              variant="ghost"
              size="icon"
              aria-label={`Editar ${user.name}`}
              onClick={() => setEditing(user)}
            >
              <Pencil className="size-4" />
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              aria-label={`Alterar senha de ${user.name}`}
              onClick={() => setPasswordUser(user)}
            >
              <KeyRound className="size-4" />
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              aria-label={`Ver sessões de ${user.name}`}
              onClick={() => setSessionsUser(user)}
            >
              <LogOut className="size-4" />
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              aria-label={`Excluir ${user.name}`}
              onClick={() => setDeleteUser(user)}
            >
              <Trash2 className="size-4" />
            </Button>
          </div>
        ),
        cellClassName: "text-right",
      },
    ],
    [],
  );

  function updateFilters(next: Partial<UserFilters>) {
    setFilters((current) => ({ ...current, page: 1, ...next }));
  }

  async function refreshUsers() {
    await queryClient.invalidateQueries({ queryKey: userQueryKeys.all });
  }

  async function createUser(values: CreateUserFormValues | UpdateUserFormValues) {
    try {
      setBusyAction("create");
      await userService.createUser(values as CreateUserFormValues);
      await refreshUsers();
      toast.success("Usuário criado.");
      setCreating(false);
    } catch (error) {
      toast.danger(error instanceof Error ? error.message : "Não foi possível criar o usuário.");
    } finally {
      setBusyAction(null);
    }
  }

  async function updateUser(values: CreateUserFormValues | UpdateUserFormValues) {
    try {
      setBusyAction("update");
      await userService.updateUser(values as UpdateUserFormValues);
      await refreshUsers();
      toast.success("Usuário atualizado.");
      setEditing(null);
    } catch (error) {
      toast.danger(error instanceof Error ? error.message : "Não foi possível atualizar.");
    } finally {
      setBusyAction(null);
    }
  }

  async function updatePassword(values: UpdateUserPasswordPayload) {
    try {
      setBusyAction("password");
      await userService.updatePassword(values);
      await refreshUsers();
      toast.success("Senha alterada e sessões revogadas.");
      setPasswordUser(null);
    } catch (error) {
      toast.danger(error instanceof Error ? error.message : "Não foi possível alterar a senha.");
    } finally {
      setBusyAction(null);
    }
  }

  async function removeUser(userId: string) {
    try {
      setBusyAction("delete");
      await userService.removeUser(userId);
      await refreshUsers();
      toast.success("Usuário excluído.");
      setDeleteUser(null);
    } catch (error) {
      toast.danger(error instanceof Error ? error.message : "Não foi possível excluir.");
    } finally {
      setBusyAction(null);
    }
  }

  async function revokeSessions(userId: string) {
    try {
      setBusyAction("sessions");
      await userService.revokeSessions(userId);
      await refreshUsers();
      await queryClient.invalidateQueries({ queryKey: userQueryKeys.sessions(userId) });
      toast.success("Sessões revogadas.");
    } catch (error) {
      toast.danger(error instanceof Error ? error.message : "Não foi possível revogar sessões.");
    } finally {
      setBusyAction(null);
    }
  }

  return (
    <div>
      <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-lg font-semibold text-foreground">Usuários</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Controle perfis, status e sessões dos usuários da Automy.
          </p>
        </div>
        <Button type="button" onClick={() => setCreating(true)}>
          <Plus className="size-4" />
          Novo usuário
        </Button>
      </div>
      <FilterBar
        search={filters.search}
        onSearchChange={(search) => updateFilters({ search })}
        searchPlaceholder="Buscar usuário ou e-mail..."
      >
        <Select
          value={filters.role}
          onChange={(event) => updateFilters({ role: event.target.value as UserFilters["role"] })}
        >
          <option value="all">Todos os perfis</option>
          {roleOptions.map(([value, label]) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </Select>
        <Select
          value={filters.status}
          onChange={(event) =>
            updateFilters({ status: event.target.value as UserFilters["status"] })
          }
        >
          <option value="all">Todos os status</option>
          {statusOptions.map(([value, label]) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </Select>
      </FilterBar>
      <DataTable
        columns={columns}
        data={rows}
        getRowKey={(user) => user.id}
        loading={isLoading}
        error={error}
        emptyState={
          <EmptyState
            title="Nenhum usuário encontrado"
            description="Cadastre usuários reais para controlar o acesso à Automy."
          />
        }
        footer={
          <UserPagination
            page={data?.page ?? filters.page}
            pageSize={data?.pageSize ?? filters.pageSize}
            total={data?.total ?? 0}
            totalPages={data?.totalPages ?? 1}
            onPageChange={(page) => setFilters((current) => ({ ...current, page }))}
          />
        }
      />
      <UserFormModal
        open={creating}
        loading={busyAction === "create"}
        onClose={() => setCreating(false)}
        onSubmit={createUser}
      />
      <UserFormModal
        open={Boolean(editing)}
        user={editing}
        loading={busyAction === "update"}
        onClose={() => setEditing(null)}
        onSubmit={updateUser}
      />
      <UserPasswordModal
        user={passwordUser}
        loading={busyAction === "password"}
        onClose={() => setPasswordUser(null)}
        onSubmit={updatePassword}
      />
      <UserSessionsModal
        user={sessionsUser}
        loading={busyAction === "sessions"}
        onClose={() => setSessionsUser(null)}
        onRevoke={revokeSessions}
      />
      <ConfirmUserDeleteModal
        user={deleteUser}
        loading={busyAction === "delete"}
        onClose={() => setDeleteUser(null)}
        onConfirm={removeUser}
      />
    </div>
  );
}

function UserPagination({
  page,
  pageSize,
  total,
  totalPages,
  onPageChange,
}: {
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
  onPageChange: (page: number) => void;
}) {
  const start = total === 0 ? 0 : (page - 1) * pageSize + 1;
  const end = Math.min(page * pageSize, total);

  return (
    <div className="flex items-center justify-between border-t border-border px-4 py-3 text-sm text-muted-foreground">
      <span>
        {start}-{end} de {total}
      </span>
      <div className="flex items-center gap-2">
        <Button
          type="button"
          variant="ghost"
          size="sm"
          disabled={page <= 1}
          onClick={() => onPageChange(page - 1)}
        >
          Anterior
        </Button>
        <span>
          Página {page} de {totalPages}
        </span>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          disabled={page >= totalPages}
          onClick={() => onPageChange(page + 1)}
        >
          Próxima
        </Button>
      </div>
    </div>
  );
}
