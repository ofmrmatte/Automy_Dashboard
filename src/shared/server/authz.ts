import { getBetterAuthSessionFromRequest } from "@/features/identity/server/better-auth";
import { getRailwayPostgresPool, isRailwayPostgresConfigured } from "@/shared/server/postgres";

export type AuthRole = "admin" | "manager" | "operator" | "read_only";
export type PermissionKey =
  | "users.read"
  | "users.manage"
  | "clients.read"
  | "clients.manage"
  | "products.read"
  | "products.manage"
  | "contracts.read"
  | "contracts.manage"
  | "finance.read"
  | "finance.manage"
  | "schedule.read"
  | "schedule.manage"
  | "support.read"
  | "support.manage"
  | "settings.read"
  | "settings.manage"
  | "audit.read";

export type AuthenticatedUserContext = {
  authUserId: string;
  domainUserId: string;
  companyId: string;
  role: AuthRole;
  status: string;
};

type AuthUserRow = {
  domain_user_id: string | null;
  company_id: string | null;
  role: string | null;
  status: string | null;
};

const ROLE_PERMISSIONS: Record<AuthRole, PermissionKey[]> = {
  admin: [
    "users.read",
    "users.manage",
    "clients.read",
    "clients.manage",
    "products.read",
    "products.manage",
    "contracts.read",
    "contracts.manage",
    "finance.read",
    "finance.manage",
    "schedule.read",
    "schedule.manage",
    "support.read",
    "support.manage",
    "settings.read",
    "settings.manage",
    "audit.read",
  ],
  manager: [
    "clients.read",
    "clients.manage",
    "products.read",
    "products.manage",
    "contracts.read",
    "contracts.manage",
    "finance.read",
    "finance.manage",
    "schedule.read",
    "schedule.manage",
    "support.read",
    "support.manage",
    "settings.read",
  ],
  operator: [
    "clients.read",
    "products.read",
    "contracts.read",
    "finance.read",
    "schedule.read",
    "schedule.manage",
    "support.read",
    "support.manage",
  ],
  read_only: [
    "clients.read",
    "products.read",
    "contracts.read",
    "finance.read",
    "schedule.read",
    "support.read",
    "settings.read",
    "audit.read",
  ],
};

export function jsonResponse(payload: unknown, init?: ResponseInit) {
  return new Response(JSON.stringify(payload), {
    ...init,
    headers: {
      "content-type": "application/json; charset=utf-8",
      ...init?.headers,
    },
  });
}

function normalizeRole(role: string | null | undefined): AuthRole {
  if (role === "admin" || role === "manager" || role === "operator" || role === "read_only") {
    return role;
  }

  return "read_only";
}

export function hasPermission(context: AuthenticatedUserContext, permission: PermissionKey) {
  return ROLE_PERMISSIONS[context.role].includes(permission);
}

export function requirePermission(
  context: AuthenticatedUserContext,
  permission: PermissionKey,
): Response | null {
  if (hasPermission(context, permission)) return null;
  return jsonResponse({ error: "Permissão insuficiente." }, { status: 403 });
}

export async function requireAuthenticatedUser(
  request: Request,
): Promise<
  { context: AuthenticatedUserContext; error?: never } | { context?: never; error: Response }
> {
  const session = await getBetterAuthSessionFromRequest(request);
  const authUserId = session?.user.id;

  if (!authUserId) {
    return { error: jsonResponse({ error: "Sessão inválida ou expirada." }, { status: 401 }) };
  }

  if (!isRailwayPostgresConfigured()) {
    return { error: jsonResponse({ error: "Banco Railway não configurado." }, { status: 503 }) };
  }

  const db = await getRailwayPostgresPool();
  const result = await db.query<AuthUserRow>(
    `
      select
        users.id as domain_user_id,
        users.company_id,
        coalesce(roles.key, auth_user.role) as role,
        coalesce(users.status, auth_user.status) as status
      from public."user" as auth_user
      left join public.users
        on users.auth_user_id = auth_user.id
        and users.deleted_at is null
      left join public.roles
        on roles.id = users.role_id
        and roles.deleted_at is null
      where auth_user.id = $1
        and auth_user.deleted_at is null
      limit 1
    `,
    [authUserId],
  );

  const user = result.rows[0];
  if (!user?.domain_user_id || !user.company_id) {
    return { error: jsonResponse({ error: "Permissão insuficiente." }, { status: 403 }) };
  }

  if (user.status !== "active") {
    return { error: jsonResponse({ error: "Usuário inativo." }, { status: 403 }) };
  }

  return {
    context: {
      authUserId,
      domainUserId: user.domain_user_id,
      companyId: user.company_id,
      role: normalizeRole(user.role),
      status: user.status,
    },
  };
}
