import { userRepository } from "@/features/users/repositories/user.repository";
import type {
  CreateUserPayload,
  UpdateUserPasswordPayload,
  UpdateUserPayload,
  UserFilters,
  UserRole,
  UserStatus,
} from "@/features/users/types";
import { USER_ROLE_LABELS, USER_STATUS_LABELS } from "@/features/users/types";
import { formatDate } from "@/shared/utils/formatters";

export const userService = {
  listUsers: (filters: UserFilters) => userRepository.list(filters),
  createUser: (payload: CreateUserPayload) => userRepository.create(payload),
  updateUser: (payload: UpdateUserPayload) => userRepository.update(payload),
  removeUser: (id: string) => userRepository.remove(id),
  updatePassword: (payload: UpdateUserPasswordPayload) => userRepository.updatePassword(payload),
  listSessions: (id: string) => userRepository.listSessions(id),
  revokeSessions: (id: string) => userRepository.revokeSessions(id),
  listPermissions: () => userRepository.permissions(),
  roleLabel: (role: UserRole) => USER_ROLE_LABELS[role],
  statusLabel: (status: UserStatus) => USER_STATUS_LABELS[status],
  dateLabel: (value: string | null) => (value ? formatDate(value) : "Nunca acessou"),
};
