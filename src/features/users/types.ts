import type { AuditableEntity } from "@/shared/types/entity";

export type UserRole = "admin" | "manager" | "operator" | "read_only";
export type UserStatus = "active" | "inactive" | "invited" | "suspended";

export type ManagedUser = AuditableEntity & {
  id: string;
  authUserId: string;
  companyId: string;
  name: string;
  email: string;
  role: UserRole;
  roleName: string;
  status: UserStatus;
  emailVerified: boolean;
  lastLogin: string | null;
  activeSessions: number;
};

export type UserFilters = {
  search: string;
  role: "all" | UserRole;
  status: "all" | UserStatus;
  page: number;
  pageSize: number;
};

export type PaginatedUsers = {
  users: ManagedUser[];
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
};

export type CreateUserPayload = {
  name: string;
  email: string;
  role: UserRole;
  status?: UserStatus | undefined;
};

export type UpdateUserPayload = {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  status: UserStatus;
};

export type UpdateUserPasswordPayload = {
  id: string;
  password: string;
};

export type UserSession = {
  id: string;
  createdAt: string;
  expiresAt: string;
  ipAddress: string | null;
  userAgent: string | null;
};

export type PermissionMatrixRole = {
  role: UserRole;
  roleName: string;
  permissions: Array<{
    key: string;
    name: string;
    description: string | null;
    enabled: boolean;
  }>;
};

export const USER_ROLE_LABELS: Record<UserRole, string> = {
  admin: "Administrador",
  manager: "Gestor",
  operator: "Operador",
  read_only: "Leitura",
};

export const USER_STATUS_LABELS: Record<UserStatus, string> = {
  active: "Ativo",
  inactive: "Inativo",
  invited: "Convidado",
  suspended: "Suspenso",
};
