import { hashPassword } from "better-auth/crypto";
import type { PoolClient, QueryResultRow } from "pg";
import {
  createUserSchema,
  updateUserPasswordSchema,
  updateUserSchema,
} from "@/features/users/validation";
import type { UserRole, UserStatus } from "@/features/users/types";
import { getRailwayPostgresPool, isRailwayPostgresConfigured } from "@/shared/server/postgres";
import {
  jsonResponse,
  requireAuthenticatedUser,
  requirePermission,
  type AuthenticatedUserContext,
  type PermissionKey,
} from "@/shared/server/authz";

const USER_API_PATHS = new Set([
  "/api/users",
  "/api/users/password",
  "/api/users/sessions",
  "/api/permissions",
]);

type ApiErrorCode =
  "bad_request" | "not_found" | "conflict" | "last_admin" | "database_unavailable";

class ApiError extends Error {
  constructor(
    message: string,
    public readonly status: number,
    public readonly code: ApiErrorCode,
  ) {
    super(message);
    this.name = "ApiError";
  }
}

type UserRow = QueryResultRow & {
  id: string;
  auth_user_id: string;
  company_id: string;
  name: string;
  email: string;
  status: UserStatus | "pending" | "blocked";
  role: UserRole;
  role_name: string;
  email_verified: boolean;
  last_login: string | null;
  active_sessions: number;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
  created_by: string | null;
  updated_by: string | null;
};

type RoleRow = QueryResultRow & {
  id: string;
  key: UserRole;
  name: string;
};

type UserSessionRow = QueryResultRow & {
  id: string;
  created_at: string;
  expires_at: string;
  ip_address: string | null;
  user_agent: string | null;
};

function normalizeStatus(status: string): UserStatus {
  if (status === "pending") return "invited";
  if (status === "blocked") return "suspended";
  if (
    status === "active" ||
    status === "inactive" ||
    status === "invited" ||
    status === "suspended"
  ) {
    return status;
  }
  return "inactive";
}

function mapUserRow(row: UserRow) {
  return {
    id: row.id,
    authUserId: row.auth_user_id,
    companyId: row.company_id,
    name: row.name,
    email: row.email,
    role: row.role,
    roleName: row.role_name,
    status: normalizeStatus(row.status),
    emailVerified: row.email_verified,
    lastLogin: row.last_login,
    activeSessions: Number(row.active_sessions ?? 0),
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    deletedAt: row.deleted_at,
    createdBy: row.created_by,
    updatedBy: row.updated_by,
  };
}

function permissionFor(pathname: string, method: string): PermissionKey {
  if (pathname === "/api/permissions") return "settings.read";
  if (pathname === "/api/users" && method === "GET") return "users.read";
  if (pathname === "/api/users/sessions" && method === "GET") return "users.read";
  return "users.manage";
}

async function ensureUserSchema() {
  if (!isRailwayPostgresConfigured()) {
    throw new ApiError("Banco Railway não configurado.", 503, "database_unavailable");
  }

  const db = await getRailwayPostgresPool();
  await db.query("select 1 from public.users limit 1");
}

async function readJson(request: Request) {
  try {
    return await request.json();
  } catch {
    throw new ApiError("Payload inválido.", 400, "bad_request");
  }
}

async function findRole(client: PoolClient, role: UserRole): Promise<RoleRow> {
  const result = await client.query<RoleRow>(
    `
      select id, key, name
      from public.roles
      where key = $1
        and company_id is null
        and deleted_at is null
      limit 1
    `,
    [role],
  );

  const row = result.rows[0];
  if (!row) throw new ApiError("Perfil de acesso não encontrado.", 400, "bad_request");
  return row;
}

async function countActiveAdmins(client: PoolClient, companyId: string) {
  const result = await client.query<{ total: string }>(
    `
      select count(*)::text as total
      from public.users
      join public.roles on roles.id = users.role_id and roles.deleted_at is null
      where users.company_id = $1
        and users.status = 'active'
        and users.deleted_at is null
        and roles.key = 'admin'
    `,
    [companyId],
  );

  return Number(result.rows[0]?.total ?? 0);
}

async function getTargetUser(client: PoolClient, id: string, companyId: string) {
  const result = await client.query<{ auth_user_id: string; role: UserRole; status: UserStatus }>(
    `
      select users.auth_user_id, roles.key as role, users.status
      from public.users
      join public.roles on roles.id = users.role_id and roles.deleted_at is null
      where users.id = $1
        and users.company_id = $2
        and users.deleted_at is null
      limit 1
    `,
    [id, companyId],
  );

  return result.rows[0] ?? null;
}

async function ensureLastAdminSurvives(
  client: PoolClient,
  context: AuthenticatedUserContext,
  targetId: string,
  nextRole: UserRole | null,
  nextStatus: UserStatus | null,
) {
  const target = await getTargetUser(client, targetId, context.companyId);
  if (!target) throw new ApiError("Usuário não encontrado.", 404, "not_found");

  const removesActiveAdmin =
    target.role === "admin" &&
    target.status === "active" &&
    (nextRole !== null || nextStatus !== null) &&
    (nextRole !== "admin" || nextStatus !== "active");

  if (!removesActiveAdmin) return target;

  const activeAdmins = await countActiveAdmins(client, context.companyId);
  if (activeAdmins <= 1) {
    throw new ApiError("Mantenha pelo menos um administrador ativo.", 409, "last_admin");
  }

  return target;
}

async function writeAuditLog(
  client: PoolClient,
  context: AuthenticatedUserContext,
  action: string,
  resourceId: string,
  metadata: Record<string, unknown> = {},
) {
  await client.query(
    `
      insert into public.audit_logs (
        company_id,
        actor_auth_user_id,
        action,
        resource_type,
        resource_id,
        metadata,
        created_by,
        updated_by
      )
      values ($1, $2, $3, 'user', $4, $5, $6, $6)
    `,
    [
      context.companyId,
      context.authUserId,
      action,
      resourceId,
      JSON.stringify(metadata),
      context.domainUserId,
    ],
  );
}

async function handleListUsers(url: URL, context: AuthenticatedUserContext) {
  await ensureUserSchema();
  const db = await getRailwayPostgresPool();
  const search = `%${(url.searchParams.get("search") ?? "").trim().toLowerCase()}%`;
  const role = url.searchParams.get("role") ?? "all";
  const status = url.searchParams.get("status") ?? "all";
  const page = Math.max(Number(url.searchParams.get("page") ?? "1"), 1);
  const pageSize = Math.min(Math.max(Number(url.searchParams.get("pageSize") ?? "10"), 5), 50);
  const offset = (page - 1) * pageSize;

  const values = [context.companyId, search, role, status, pageSize, offset];

  const [usersResult, totalResult] = await Promise.all([
    db.query<UserRow>(
      `
        select
          users.id,
          users.auth_user_id,
          users.company_id,
          users.name,
          users.email,
          users.status,
          roles.key as role,
          roles.name as role_name,
          coalesce(auth_user."emailVerified", false) as email_verified,
          auth_user.last_login,
          count(session.id)::int as active_sessions,
          users.created_at,
          users.updated_at,
          users.deleted_at,
          users.created_by,
          users.updated_by
        from public.users
        join public.roles on roles.id = users.role_id and roles.deleted_at is null
        join public."user" as auth_user on auth_user.id = users.auth_user_id and auth_user.deleted_at is null
        left join public.session
          on session."userId" = users.auth_user_id
          and session.deleted_at is null
          and session."expiresAt" > now()
        where users.company_id = $1
          and users.deleted_at is null
          and (lower(users.name || ' ' || users.email) like $2)
          and ($3 = 'all' or roles.key = $3)
          and ($4 = 'all' or users.status = $4)
        group by users.id, roles.key, roles.name, auth_user."emailVerified", auth_user.last_login
        order by users.created_at desc
        limit $5 offset $6
      `,
      values,
    ),
    db.query<{ total: string }>(
      `
        select count(*)::text as total
        from public.users
        join public.roles on roles.id = users.role_id and roles.deleted_at is null
        where users.company_id = $1
          and users.deleted_at is null
          and (lower(users.name || ' ' || users.email) like $2)
          and ($3 = 'all' or roles.key = $3)
          and ($4 = 'all' or users.status = $4)
      `,
      values.slice(0, 4),
    ),
  ]);

  const total = Number(totalResult.rows[0]?.total ?? 0);
  return jsonResponse({
    users: usersResult.rows.map(mapUserRow),
    page,
    pageSize,
    total,
    totalPages: Math.max(Math.ceil(total / pageSize), 1),
  });
}

async function handleCreateUser(request: Request, context: AuthenticatedUserContext) {
  const parsed = createUserSchema.safeParse(await readJson(request));
  if (!parsed.success) {
    throw new ApiError(parsed.error.issues[0]?.message ?? "Dados inválidos.", 400, "bad_request");
  }

  await ensureUserSchema();
  const db = await getRailwayPostgresPool();
  const client = await db.connect();
  try {
    await client.query("begin");
    const role = await findRole(client, parsed.data.role);

    const existing = await client.query<{ id: string }>(
      `
        select id
        from public.users
        where company_id = $1
          and lower(email) = lower($2)
          and deleted_at is null
        limit 1
      `,
      [context.companyId, parsed.data.email],
    );
    if (existing.rows[0]) {
      throw new ApiError("Já existe um usuário com este e-mail.", 409, "conflict");
    }

    const passwordHash = await hashPassword(parsed.data.password);
    const authUserResult = await client.query<{ id: string }>(
      `
        insert into public."user" (
          name,
          email,
          "emailVerified",
          role,
          status,
          "createdAt",
          "updatedAt"
        )
        values ($1, lower($2), false, $3, $4, now(), now())
        returning id
      `,
      [parsed.data.name, parsed.data.email, parsed.data.role, parsed.data.status],
    );
    const authUserId = authUserResult.rows[0]?.id;
    if (!authUserId) throw new ApiError("Não foi possível criar o usuário.", 500, "bad_request");

    await client.query(
      `
        insert into public.account (
          "accountId",
          "providerId",
          "userId",
          password,
          "createdAt",
          "updatedAt"
        )
        values ($1, 'credential', $1, $2, now(), now())
      `,
      [authUserId, passwordHash],
    );

    const domainUserResult = await client.query<{ id: string }>(
      `
        insert into public.users (
          company_id,
          auth_user_id,
          role_id,
          name,
          email,
          status,
          created_by,
          updated_by
        )
        values ($1, $2, $3, $4, lower($5), $6, $7, $7)
        returning id
      `,
      [
        context.companyId,
        authUserId,
        role.id,
        parsed.data.name,
        parsed.data.email,
        parsed.data.status,
        context.domainUserId,
      ],
    );
    const domainUserId = domainUserResult.rows[0]?.id;
    if (!domainUserId) throw new ApiError("Não foi possível criar o usuário.", 500, "bad_request");

    await client.query(
      `
        insert into public.user_profiles (auth_user_id, first_name, last_name, created_by, updated_by)
        values ($1, split_part($2, ' ', 1), trim(substr($2, length(split_part($2, ' ', 1)) + 1)), $3, $3)
        on conflict (auth_user_id) do nothing
      `,
      [authUserId, parsed.data.name, context.domainUserId],
    );

    await client.query(
      `
        insert into public.user_preferences (auth_user_id, created_by, updated_by)
        values ($1, $2, $2)
        on conflict (auth_user_id) do nothing
      `,
      [authUserId, context.domainUserId],
    );

    await writeAuditLog(client, context, "user.created", domainUserId, {
      email: parsed.data.email,
      role: parsed.data.role,
      status: parsed.data.status,
    });
    await client.query("commit");

    return jsonResponse({ id: domainUserId }, { status: 201 });
  } catch (error) {
    await client.query("rollback");
    if (error instanceof ApiError) throw error;
    if (typeof error === "object" && error !== null && "code" in error && error.code === "23505") {
      throw new ApiError("Já existe um usuário com este e-mail.", 409, "conflict");
    }
    throw error;
  } finally {
    client.release();
  }
}

async function handleUpdateUser(request: Request, context: AuthenticatedUserContext) {
  const parsed = updateUserSchema.safeParse(await readJson(request));
  if (!parsed.success) {
    throw new ApiError(parsed.error.issues[0]?.message ?? "Dados inválidos.", 400, "bad_request");
  }

  await ensureUserSchema();
  const db = await getRailwayPostgresPool();
  const client = await db.connect();
  try {
    await client.query("begin");
    const role = await findRole(client, parsed.data.role);
    const target = await ensureLastAdminSurvives(
      client,
      context,
      parsed.data.id,
      parsed.data.role,
      parsed.data.status,
    );

    const result = await client.query<{ id: string }>(
      `
        update public.users
        set
          role_id = $3,
          name = $4,
          email = lower($5),
          status = $6,
          updated_by = $7,
          updated_at = now()
        where id = $1
          and company_id = $2
          and deleted_at is null
        returning id
      `,
      [
        parsed.data.id,
        context.companyId,
        role.id,
        parsed.data.name,
        parsed.data.email,
        parsed.data.status,
        context.domainUserId,
      ],
    );
    if (!result.rows[0]) throw new ApiError("Usuário não encontrado.", 404, "not_found");

    await client.query(
      `
        update public."user"
        set name = $2,
            email = lower($3),
            role = $4,
            status = $5,
            "updatedAt" = now()
        where id = $1
          and deleted_at is null
      `,
      [
        target.auth_user_id,
        parsed.data.name,
        parsed.data.email,
        parsed.data.role,
        parsed.data.status,
      ],
    );

    await writeAuditLog(client, context, "user.updated", parsed.data.id, {
      email: parsed.data.email,
      role: parsed.data.role,
      status: parsed.data.status,
    });
    await client.query("commit");

    return jsonResponse({ ok: true });
  } catch (error) {
    await client.query("rollback");
    if (error instanceof ApiError) throw error;
    if (typeof error === "object" && error !== null && "code" in error && error.code === "23505") {
      throw new ApiError("Já existe um usuário com este e-mail.", 409, "conflict");
    }
    throw error;
  } finally {
    client.release();
  }
}

async function handleDeleteUser(url: URL, context: AuthenticatedUserContext) {
  const id = url.searchParams.get("id") ?? "";
  if (!id) throw new ApiError("Usuário não informado.", 400, "bad_request");

  await ensureUserSchema();
  const db = await getRailwayPostgresPool();
  const client = await db.connect();
  try {
    await client.query("begin");
    const target = await ensureLastAdminSurvives(client, context, id, "read_only", "inactive");

    await client.query(
      `
        update public.users
        set deleted_at = now(),
            status = 'inactive',
            updated_by = $3,
            updated_at = now()
        where id = $1
          and company_id = $2
          and deleted_at is null
      `,
      [id, context.companyId, context.domainUserId],
    );
    await client.query(
      `
        update public."user"
        set deleted_at = now(),
            status = 'inactive',
            "updatedAt" = now()
        where id = $1
          and deleted_at is null
      `,
      [target.auth_user_id],
    );
    await client.query(`delete from public.session where "userId" = $1`, [target.auth_user_id]);
    await writeAuditLog(client, context, "user.deleted", id);
    await client.query("commit");
    return jsonResponse({ ok: true });
  } catch (error) {
    await client.query("rollback");
    if (error instanceof ApiError) throw error;
    throw error;
  } finally {
    client.release();
  }
}

async function handleUpdatePassword(request: Request, context: AuthenticatedUserContext) {
  const parsed = updateUserPasswordSchema.safeParse(await readJson(request));
  if (!parsed.success) {
    throw new ApiError(parsed.error.issues[0]?.message ?? "Dados inválidos.", 400, "bad_request");
  }

  await ensureUserSchema();
  const db = await getRailwayPostgresPool();
  const client = await db.connect();
  try {
    await client.query("begin");
    const target = await getTargetUser(client, parsed.data.id, context.companyId);
    if (!target) throw new ApiError("Usuário não encontrado.", 404, "not_found");

    const passwordHash = await hashPassword(parsed.data.password);
    await client.query(
      `
        update public.account
        set password = $2,
            "updatedAt" = now()
        where "userId" = $1
          and "providerId" = 'credential'
      `,
      [target.auth_user_id, passwordHash],
    );
    await client.query(`delete from public.session where "userId" = $1`, [target.auth_user_id]);
    await writeAuditLog(client, context, "user.password.updated", parsed.data.id);
    await client.query("commit");

    return jsonResponse({ ok: true });
  } catch (error) {
    await client.query("rollback");
    if (error instanceof ApiError) throw error;
    throw error;
  } finally {
    client.release();
  }
}

async function handleListSessions(url: URL, context: AuthenticatedUserContext) {
  const id = url.searchParams.get("id") ?? "";
  if (!id) throw new ApiError("Usuário não informado.", 400, "bad_request");

  await ensureUserSchema();
  const db = await getRailwayPostgresPool();
  const target = await db.query<{ auth_user_id: string }>(
    `
      select auth_user_id
      from public.users
      where id = $1
        and company_id = $2
        and deleted_at is null
      limit 1
    `,
    [id, context.companyId],
  );
  const authUserId = target.rows[0]?.auth_user_id;
  if (!authUserId) throw new ApiError("Usuário não encontrado.", 404, "not_found");

  const sessions = await db.query<UserSessionRow>(
    `
      select
        id,
        "createdAt" as created_at,
        "expiresAt" as expires_at,
        "ipAddress" as ip_address,
        "userAgent" as user_agent
      from public.session
      where "userId" = $1
        and deleted_at is null
        and "expiresAt" > now()
      order by "createdAt" desc
      limit 20
    `,
    [authUserId],
  );

  return jsonResponse({
    sessions: sessions.rows.map((session) => ({
      id: session.id,
      createdAt: session.created_at,
      expiresAt: session.expires_at,
      ipAddress: session.ip_address,
      userAgent: session.user_agent,
    })),
  });
}

async function handleRevokeSessions(url: URL, context: AuthenticatedUserContext) {
  const id = url.searchParams.get("id") ?? "";
  if (!id) throw new ApiError("Usuário não informado.", 400, "bad_request");

  await ensureUserSchema();
  const db = await getRailwayPostgresPool();
  const client = await db.connect();
  try {
    await client.query("begin");
    const target = await getTargetUser(client, id, context.companyId);
    if (!target) throw new ApiError("Usuário não encontrado.", 404, "not_found");
    await client.query(`delete from public.session where "userId" = $1`, [target.auth_user_id]);
    await writeAuditLog(client, context, "user.sessions.revoked", id);
    await client.query("commit");
    return jsonResponse({ ok: true });
  } catch (error) {
    await client.query("rollback");
    if (error instanceof ApiError) throw error;
    throw error;
  } finally {
    client.release();
  }
}

async function handlePermissions(context: AuthenticatedUserContext) {
  await ensureUserSchema();
  const db = await getRailwayPostgresPool();
  const result = await db.query<
    QueryResultRow & {
      role: UserRole;
      role_name: string;
      permission_key: string;
      permission_name: string;
      permission_description: string | null;
      enabled: boolean;
    }
  >(
    `
      select
        roles.key as role,
        roles.name as role_name,
        permissions.key as permission_key,
        permissions.name as permission_name,
        permissions.description as permission_description,
        exists (
          select 1
          from public.role_permissions
          where role_permissions.role_id = roles.id
            and role_permissions.permission_id = permissions.id
            and role_permissions.deleted_at is null
        ) as enabled
      from public.roles
      cross join public.permissions
      where roles.company_id is null
        and roles.deleted_at is null
        and permissions.deleted_at is null
      order by roles.key, permissions.key
    `,
  );

  const matrix = result.rows.reduce<
    Record<
      string,
      {
        role: UserRole;
        roleName: string;
        permissions: Array<{
          key: string;
          name: string;
          description: string | null;
          enabled: boolean;
        }>;
      }
    >
  >((acc, row) => {
    const role = (acc[row.role] ??= { role: row.role, roleName: row.role_name, permissions: [] });
    role.permissions.push({
      key: row.permission_key,
      name: row.permission_name,
      description: row.permission_description,
      enabled: row.enabled,
    });
    return acc;
  }, {});

  return jsonResponse({ roles: Object.values(matrix) });
}

function handleApiError(error: unknown) {
  if (error instanceof ApiError) {
    return jsonResponse({ error: error.message, code: error.code }, { status: error.status });
  }

  console.error(error);
  return jsonResponse({ error: "Erro ao acessar banco." }, { status: 500 });
}

export async function handleUsersApiRequest(request: Request) {
  const url = new URL(request.url);
  if (!USER_API_PATHS.has(url.pathname)) return null;

  try {
    const auth = await requireAuthenticatedUser(request);
    if (auth.error) return auth.error;

    const permissionError = requirePermission(
      auth.context,
      permissionFor(url.pathname, request.method),
    );
    if (permissionError) return permissionError;

    if (url.pathname === "/api/users" && request.method === "GET") {
      return handleListUsers(url, auth.context);
    }
    if (url.pathname === "/api/users" && request.method === "POST") {
      return handleCreateUser(request, auth.context);
    }
    if (url.pathname === "/api/users" && request.method === "PATCH") {
      return handleUpdateUser(request, auth.context);
    }
    if (url.pathname === "/api/users" && request.method === "DELETE") {
      return handleDeleteUser(url, auth.context);
    }
    if (url.pathname === "/api/users/password" && request.method === "POST") {
      return handleUpdatePassword(request, auth.context);
    }
    if (url.pathname === "/api/users/sessions" && request.method === "GET") {
      return handleListSessions(url, auth.context);
    }
    if (url.pathname === "/api/users/sessions" && request.method === "DELETE") {
      return handleRevokeSessions(url, auth.context);
    }
    if (url.pathname === "/api/permissions" && request.method === "GET") {
      return handlePermissions(auth.context);
    }

    return jsonResponse({ error: "Método não permitido." }, { status: 405 });
  } catch (error) {
    return handleApiError(error);
  }
}
