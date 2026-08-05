import {
  getAutomyAuth,
  getBetterAuthSessionFromRequest,
} from "@/features/identity/server/better-auth";
import { uploadAvatarToPersistentStorage } from "@/features/identity/server/avatar-storage";
import {
  passwordChangeSchema,
  preferencesSchema,
  profileSchema,
} from "@/features/identity/validation";
import type {
  IdentityPreferences,
  IdentityProfile,
  IdentitySessionRecord,
} from "@/features/identity/types";
import { getRailwayPostgresPool, isRailwayPostgresConfigured } from "@/shared/server/postgres";
import {
  jsonResponse,
  requireAuthenticatedUser,
  type AuthenticatedUserContext,
} from "@/shared/server/authz";

const IDENTITY_API_PATHS = new Set([
  "/api/identity/profile",
  "/api/identity/preferences",
  "/api/identity/avatar",
  "/api/identity/password",
  "/api/identity/sessions",
]);

type ApiErrorCode = "bad_request" | "database_unavailable" | "not_found";

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

type SessionPayload = Awaited<ReturnType<typeof getBetterAuthSessionFromRequest>>;

type ProfileRow = {
  id: string;
  auth_user_id: string;
  domain_user_id: string;
  company_id: string;
  first_name: string | null;
  last_name: string | null;
  phone: string | null;
  job_title: string | null;
  company_name: string | null;
  avatar_path: string | null;
  avatar_mime_type: string | null;
  avatar_size: number | null;
  avatar_updated_at: string | null;
  email: string;
  role: IdentityProfile["role"];
  role_name: string;
  status: IdentityProfile["status"];
  company_time_zone: string | null;
  auth_created_at: string;
  last_login: string | null;
  email_verified: boolean;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
  created_by: string | null;
  updated_by: string | null;
};

type PreferencesRow = {
  id: string;
  auth_user_id: string;
  theme: IdentityPreferences["theme"];
  language: string;
  time_zone: string;
  date_format: string;
  time_format: IdentityPreferences["timeFormat"];
  currency: string;
  first_day_of_week: number;
  notifications: IdentityPreferences["notifications"];
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
  created_by: string | null;
  updated_by: string | null;
};

type SessionRow = {
  id: string;
  token: string;
  created_at: string;
  updated_at: string;
  expires_at: string;
  ip_address: string | null;
  user_agent: string | null;
};

function splitName(name: string) {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  const firstName = parts.shift() ?? "";
  return { firstName, lastName: parts.join(" ") };
}

function fullName(firstName: string, lastName: string) {
  return [firstName, lastName]
    .map((part) => part.trim())
    .filter(Boolean)
    .join(" ");
}

function normalizeStatus(status: string): IdentityProfile["status"] {
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

function mapProfile(row: ProfileRow): IdentityProfile {
  return {
    id: row.id,
    authUserId: row.auth_user_id,
    domainUserId: row.domain_user_id,
    companyId: row.company_id,
    firstName: row.first_name ?? "",
    lastName: row.last_name ?? "",
    phone: row.phone ?? "",
    jobTitle: row.job_title ?? "",
    companyName: row.company_name ?? "Automy",
    avatarPath: row.avatar_path,
    avatarMimeType: row.avatar_mime_type,
    avatarSize: row.avatar_size,
    avatarUpdatedAt: row.avatar_updated_at,
    email: row.email,
    role: row.role,
    roleName: row.role_name,
    status: normalizeStatus(row.status),
    companyTimeZone: row.company_time_zone ?? "America/Sao_Paulo",
    authCreatedAt: row.auth_created_at,
    lastLogin: row.last_login,
    emailVerified: row.email_verified,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    deletedAt: row.deleted_at,
    createdBy: row.created_by,
    updatedBy: row.updated_by,
  };
}

function mapPreferences(row: PreferencesRow): IdentityPreferences {
  return {
    id: row.id,
    authUserId: row.auth_user_id,
    theme: row.theme,
    language: row.language,
    timeZone: row.time_zone,
    dateFormat: row.date_format,
    timeFormat: row.time_format,
    currency: row.currency,
    firstDayOfWeek: row.first_day_of_week,
    notifications: row.notifications,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    deletedAt: row.deleted_at,
    createdBy: row.created_by,
    updatedBy: row.updated_by,
  };
}

function maskIpAddress(ip: string | null) {
  if (!ip) return null;
  if (ip.includes(":")) return ip.replace(/:[^:]*:[^:]*$/, ":****:****");
  return ip.replace(/\.\d+$/, ".***");
}

function parseUserAgent(userAgent: string | null) {
  const source = userAgent ?? "";
  const browser = source.includes("Edg/")
    ? "Edge"
    : source.includes("Chrome/")
      ? "Chrome"
      : source.includes("Firefox/")
        ? "Firefox"
        : source.includes("Safari/")
          ? "Safari"
          : "Navegador";
  const operatingSystem = source.includes("Windows")
    ? "Windows"
    : source.includes("Mac OS")
      ? "macOS"
      : source.includes("Android")
        ? "Android"
        : source.includes("iPhone") || source.includes("iPad")
          ? "iOS"
          : "Sistema não identificado";
  const device = /Mobile|Android|iPhone/i.test(source) ? "Dispositivo móvel" : "Computador";
  return { browser, operatingSystem, device };
}

function mapSession(row: SessionRow, currentSessionId: string | undefined): IdentitySessionRecord {
  const agent = parseUserAgent(row.user_agent);
  return {
    id: row.id,
    token: row.token,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    expiresAt: row.expires_at,
    ipAddress: row.ip_address,
    maskedIpAddress: maskIpAddress(row.ip_address),
    userAgent: row.user_agent,
    ...agent,
    current: row.id === currentSessionId,
  };
}

async function ensureIdentitySchema() {
  if (!isRailwayPostgresConfigured()) {
    throw new ApiError("Banco Railway não configurado.", 503, "database_unavailable");
  }

  const db = await getRailwayPostgresPool();
  await db.query("select 1 from public.user_profiles limit 1");
}

async function ensureIdentityRows(
  context: AuthenticatedUserContext,
  session: NonNullable<SessionPayload>,
) {
  const db = await getRailwayPostgresPool();
  const name = session.user.name || session.user.email || "Automy";
  const names = splitName(name);
  await db.query(
    `
      insert into public.user_profiles (
        auth_user_id,
        first_name,
        last_name,
        company_name,
        avatar_path,
        created_by,
        updated_by
      )
      values ($1, $2, $3, 'Automy', $4, $1, $1)
      on conflict (auth_user_id) do nothing
    `,
    [context.authUserId, names.firstName, names.lastName, session.user.image ?? null],
  );

  await db.query(
    `
      insert into public.user_preferences (auth_user_id, created_by, updated_by)
      values ($1, $1, $1)
      on conflict (auth_user_id) do nothing
    `,
    [context.authUserId],
  );
}

async function writeAuditLog(
  context: AuthenticatedUserContext,
  action: string,
  resourceId: string,
  metadata: Record<string, unknown> = {},
) {
  const db = await getRailwayPostgresPool();
  await db.query(
    `
      insert into public.audit_logs (
        company_id,
        actor_auth_user_id,
        actor_user_id,
        action,
        resource_type,
        resource_id,
        metadata,
        created_by,
        updated_by
      )
      values ($1, $2, $3, $4, 'user', $5, $6, $2, $2)
    `,
    [
      context.companyId,
      context.authUserId,
      context.domainUserId,
      action,
      resourceId,
      JSON.stringify(metadata),
    ],
  );
}

async function getProfile(context: AuthenticatedUserContext, session: NonNullable<SessionPayload>) {
  await ensureIdentityRows(context, session);
  const db = await getRailwayPostgresPool();
  const result = await db.query<ProfileRow>(
    `
      select
        user_profiles.*,
        users.id as domain_user_id,
        users.company_id,
        auth_user.email,
        coalesce(roles.key, auth_user.role) as role,
        coalesce(roles.name, auth_user.role) as role_name,
        coalesce(users.status, auth_user.status) as status,
        companies.trade_name as company_name,
        companies.time_zone as company_time_zone,
        auth_user."createdAt" as auth_created_at,
        auth_user.last_login,
        auth_user."emailVerified" as email_verified
      from public.user_profiles
      join public."user" as auth_user
        on auth_user.id = user_profiles.auth_user_id
        and auth_user.deleted_at is null
      join public.users
        on users.auth_user_id = auth_user.id
        and users.deleted_at is null
      join public.companies
        on companies.id = users.company_id
        and companies.deleted_at is null
      left join public.roles
        on roles.id = users.role_id
        and roles.deleted_at is null
      where user_profiles.auth_user_id = $1
        and users.company_id = $2
        and user_profiles.deleted_at is null
      limit 1
    `,
    [context.authUserId, context.companyId],
  );

  const row = result.rows[0];
  if (!row) throw new ApiError("Perfil não encontrado.", 404, "not_found");
  return mapProfile(row);
}

async function getPreferences(
  context: AuthenticatedUserContext,
  session: NonNullable<SessionPayload>,
) {
  await ensureIdentityRows(context, session);
  const db = await getRailwayPostgresPool();
  const result = await db.query<PreferencesRow>(
    `
      select *
      from public.user_preferences
      where auth_user_id = $1
        and deleted_at is null
      limit 1
    `,
    [context.authUserId],
  );

  const row = result.rows[0];
  if (!row) throw new ApiError("Preferências não encontradas.", 404, "not_found");
  return mapPreferences(row);
}

async function handleUpdateProfile(request: Request, context: AuthenticatedUserContext) {
  const payload = await request.json().catch(() => null);
  const parsed = profileSchema.safeParse(payload);
  if (!parsed.success) {
    throw new ApiError(parsed.error.issues[0]?.message ?? "Dados inválidos.", 400, "bad_request");
  }

  const db = await getRailwayPostgresPool();
  const name = fullName(parsed.data.firstName, parsed.data.lastName);
  await db.query(
    `
      update public.user_profiles
      set
        first_name = $2,
        last_name = $3,
        phone = $4,
        job_title = $5,
        avatar_path = nullif($6, ''),
        avatar_mime_type = null,
        avatar_size = null,
        avatar_updated_at = case when coalesce(avatar_path, '') <> $6 then now() else avatar_updated_at end,
        updated_by = $1,
        updated_at = now()
      where auth_user_id = $1
        and deleted_at is null
    `,
    [
      context.authUserId,
      parsed.data.firstName,
      parsed.data.lastName,
      parsed.data.phone,
      parsed.data.jobTitle,
      parsed.data.avatarUrl,
    ],
  );

  await db.query(
    `
      update public."user"
      set name = $2,
          image = nullif($3, ''),
          "updatedAt" = now()
      where id = $1
        and deleted_at is null
    `,
    [context.authUserId, name, parsed.data.avatarUrl],
  );

  await db.query(
    `
      update public.users
      set name = $2,
          updated_by = $1,
          updated_at = now()
      where auth_user_id = $1
        and deleted_at is null
    `,
    [context.authUserId, name],
  );

  await writeAuditLog(context, "identity.profile.updated", context.domainUserId, {
    avatarChanged: Boolean(parsed.data.avatarUrl),
  });
  const session = await getBetterAuthSessionFromRequest(request);
  return jsonResponse({ profile: await getProfile(context, session!) });
}

async function handleUpdatePreferences(request: Request, context: AuthenticatedUserContext) {
  const payload = await request.json().catch(() => null);
  const parsed = preferencesSchema.safeParse(payload);
  if (!parsed.success) {
    throw new ApiError(parsed.error.issues[0]?.message ?? "Dados inválidos.", 400, "bad_request");
  }

  const db = await getRailwayPostgresPool();
  await db.query(
    `
      update public.user_preferences
      set
        theme = $2,
        language = $3,
        time_zone = $4,
        date_format = $5,
        time_format = $6,
        currency = $7,
        first_day_of_week = $8,
        notifications = $9,
        updated_by = $1,
        updated_at = now()
      where auth_user_id = $1
        and deleted_at is null
    `,
    [
      context.authUserId,
      parsed.data.theme,
      parsed.data.language,
      parsed.data.timeZone,
      parsed.data.dateFormat,
      parsed.data.timeFormat,
      parsed.data.currency,
      parsed.data.firstDayOfWeek,
      JSON.stringify(parsed.data.notifications),
    ],
  );

  await writeAuditLog(context, "identity.preferences.updated", context.domainUserId, {
    theme: parsed.data.theme,
    timeZone: parsed.data.timeZone,
    language: parsed.data.language,
  });
  const session = await getBetterAuthSessionFromRequest(request);
  return jsonResponse({ preferences: await getPreferences(context, session!) });
}

async function handleUploadAvatar(request: Request, context: AuthenticatedUserContext) {
  const formData = await request.formData();
  const file = formData.get("avatar");
  if (!(file instanceof File)) throw new ApiError("Arquivo não informado.", 400, "bad_request");

  const result = await uploadAvatarToPersistentStorage({ authUserId: context.authUserId, file });
  const db = await getRailwayPostgresPool();
  await db.query(
    `
      update public.user_profiles
      set avatar_path = $2,
          avatar_mime_type = $3,
          avatar_size = $4,
          avatar_updated_at = now(),
          updated_by = $1,
          updated_at = now()
      where auth_user_id = $1
        and deleted_at is null
    `,
    [context.authUserId, result.url, result.mimeType, result.size],
  );
  return jsonResponse({ avatarUrl: result.url });
}

async function handleChangePassword(request: Request, context: AuthenticatedUserContext) {
  const payload = await request.json().catch(() => null);
  const parsed = passwordChangeSchema.safeParse(payload);
  if (!parsed.success) {
    throw new ApiError(parsed.error.issues[0]?.message ?? "Dados inválidos.", 400, "bad_request");
  }

  const auth = getAutomyAuth();
  const response = await auth.api.changePassword({
    headers: request.headers,
    body: {
      currentPassword: parsed.data.currentPassword,
      newPassword: parsed.data.password,
      revokeOtherSessions: parsed.data.revokeOtherSessions,
    },
  });

  await writeAuditLog(context, "identity.password.updated", context.domainUserId, {
    revokeOtherSessions: parsed.data.revokeOtherSessions,
  });

  return jsonResponse({ ok: Boolean(response) });
}

async function listSessions(
  context: AuthenticatedUserContext,
  session: NonNullable<SessionPayload>,
) {
  const db = await getRailwayPostgresPool();
  const result = await db.query<SessionRow>(
    `
      select
        id,
        token,
        "createdAt" as created_at,
        "updatedAt" as updated_at,
        "expiresAt" as expires_at,
        "ipAddress" as ip_address,
        "userAgent" as user_agent
      from public.session
      where "userId" = $1
        and deleted_at is null
        and "expiresAt" > now()
      order by "updatedAt" desc, "createdAt" desc
    `,
    [context.authUserId],
  );

  return result.rows.map((row) => mapSession(row, session.session.id));
}

async function revokeSession(
  request: Request,
  context: AuthenticatedUserContext,
  session: NonNullable<SessionPayload>,
) {
  const url = new URL(request.url);
  const id = url.searchParams.get("id");
  const scope = url.searchParams.get("scope");
  const db = await getRailwayPostgresPool();

  if (scope === "others") {
    await db.query(`delete from public.session where "userId" = $1 and id <> $2`, [
      context.authUserId,
      session.session.id,
    ]);
    await writeAuditLog(context, "identity.sessions.revoked_others", context.domainUserId);
    return jsonResponse({ ok: true });
  }

  if (scope === "global") {
    await db.query(`delete from public.session where "userId" = $1`, [context.authUserId]);
    await writeAuditLog(context, "identity.sessions.revoked_global", context.domainUserId);
    return jsonResponse({ ok: true });
  }

  if (!id) throw new ApiError("Sessão não informada.", 400, "bad_request");
  await db.query(`delete from public.session where "userId" = $1 and id = $2`, [
    context.authUserId,
    id,
  ]);
  await writeAuditLog(context, "identity.session.revoked", context.domainUserId, {
    current: id === session.session.id,
  });
  return jsonResponse({ ok: true });
}

function handleApiError(error: unknown) {
  if (error instanceof ApiError) {
    return jsonResponse({ error: error.message, code: error.code }, { status: error.status });
  }

  if (error instanceof Error) {
    return jsonResponse({ error: error.message }, { status: 400 });
  }

  console.error(error);
  return jsonResponse({ error: "Erro ao acessar banco." }, { status: 500 });
}

export async function handleIdentityApiRequest(request: Request) {
  const url = new URL(request.url);
  if (!IDENTITY_API_PATHS.has(url.pathname)) return null;

  try {
    await ensureIdentitySchema();
    const auth = await requireAuthenticatedUser(request);
    if (auth.error) return auth.error;
    const session = await getBetterAuthSessionFromRequest(request);
    if (!session) return jsonResponse({ error: "Sessão inválida ou expirada." }, { status: 401 });

    if (url.pathname === "/api/identity/profile" && request.method === "GET") {
      return jsonResponse({ profile: await getProfile(auth.context, session) });
    }
    if (url.pathname === "/api/identity/profile" && request.method === "PATCH") {
      return await handleUpdateProfile(request, auth.context);
    }
    if (url.pathname === "/api/identity/preferences" && request.method === "GET") {
      return jsonResponse({ preferences: await getPreferences(auth.context, session) });
    }
    if (url.pathname === "/api/identity/preferences" && request.method === "PATCH") {
      return await handleUpdatePreferences(request, auth.context);
    }
    if (url.pathname === "/api/identity/avatar" && request.method === "POST") {
      return await handleUploadAvatar(request, auth.context);
    }
    if (url.pathname === "/api/identity/password" && request.method === "POST") {
      return await handleChangePassword(request, auth.context);
    }
    if (url.pathname === "/api/identity/sessions" && request.method === "GET") {
      return jsonResponse({ sessions: await listSessions(auth.context, session) });
    }
    if (url.pathname === "/api/identity/sessions" && request.method === "DELETE") {
      return await revokeSession(request, auth.context, session);
    }

    return jsonResponse({ error: "Método não permitido." }, { status: 405 });
  } catch (error) {
    return handleApiError(error);
  }
}
