import type { PoolClient, QueryResultRow } from "pg";
import {
  companySettingsSchema,
  integrationProviderSchema,
  integrationUpdateSchema,
  notificationSettingsSchema,
  securitySettingsSchema,
} from "@/features/settings/validation";
import type {
  CompanyIntegration,
  CompanySettings,
  CompanySettingsPayload,
  CompanyStatus,
  IntegrationStatus,
  LoginHistoryRecord,
  NotificationRecord,
  SettingsAccess,
} from "@/features/settings/types";
import { getRailwayPostgresPool, isRailwayPostgresConfigured } from "@/shared/server/postgres";
import {
  hasPermission,
  jsonResponse,
  requireAuthenticatedUser,
  requirePermission,
  type AuthenticatedUserContext,
} from "@/shared/server/authz";

const SETTINGS_API_PREFIXES = [
  "/api/settings/company",
  "/api/settings/security",
  "/api/settings/integrations",
  "/api/settings/notifications",
  "/api/notifications",
];

type ApiErrorCode = "bad_request" | "database_unavailable" | "not_found" | "forbidden";

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

type CompanyRow = QueryResultRow & {
  id: string;
  legal_name: string;
  trade_name: string | null;
  document: string | null;
  state_registration: string | null;
  municipal_registration: string | null;
  email: string | null;
  phone: string | null;
  website: string | null;
  description: string | null;
  segment: string | null;
  status: CompanyStatus;
  postal_code: string | null;
  street: string | null;
  number: string | null;
  complement: string | null;
  district: string | null;
  city: string | null;
  state: string | null;
  country: string | null;
  time_zone: string | null;
  default_language: string | null;
  default_currency: string | null;
  date_format: string | null;
  time_format: "24h" | "12h" | null;
  first_day_of_week: number | null;
  business_hours: { start?: string; end?: string } | null;
  default_contract_term_days: number | null;
  default_billing_term_days: number | null;
  logo_url: string | null;
  favicon_url: string | null;
  display_name: string | null;
  billing_legal_name: string | null;
  billing_document: string | null;
  billing_email: string | null;
  billing_phone: string | null;
  billing_address: Record<string, unknown> | null;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
  created_by: string | null;
  updated_by: string | null;
};

type SecurityPolicyRow = QueryResultRow & {
  id: string;
  company_id: string;
  session_duration_days: number;
  require_password_change_on_first_login: boolean;
  min_password_length: number;
  lockout_attempts: number;
  lockout_duration_minutes: number;
  allow_multiple_sessions: boolean;
  require_email_verified: boolean;
  mfa_status: "not_configured" | "prepared" | "enabled";
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
  created_by: string | null;
  updated_by: string | null;
};

type IntegrationRow = QueryResultRow & {
  id: string;
  company_id: string;
  provider: CompanyIntegration["provider"];
  type: CompanyIntegration["type"];
  status: IntegrationStatus;
  environment: string;
  public_config: Record<string, unknown>;
  last_checked_at: string | null;
  last_success_at: string | null;
  last_error: string | null;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
  created_by: string | null;
  updated_by: string | null;
};

type NotificationPreferenceRow = QueryResultRow & {
  id: string;
  company_id: string;
  auth_user_id: string;
  in_app: boolean;
  email: boolean;
  contracts: boolean;
  billing: boolean;
  tickets: boolean;
  agenda: boolean;
  security: boolean;
  admin_updates: boolean;
  daily_summary: boolean;
  weekly_summary: boolean;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
  created_by: string | null;
  updated_by: string | null;
};

type CompanyNotificationRow = QueryResultRow & {
  id: string;
  company_id: string;
  in_app_enabled: boolean;
  email_enabled: boolean;
  default_sender: string | null;
  contract_notice_days: number;
  billing_notice_days: number;
  agenda_reminder_minutes: number;
  sla_warning_hours: number;
  critical_alerts_enabled: boolean;
  quiet_hours: { enabled?: boolean; start?: string; end?: string } | null;
  timezone: string;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
  created_by: string | null;
  updated_by: string | null;
};

type LoginHistoryRow = QueryResultRow & {
  id: string;
  success: boolean;
  ip_address: string | null;
  user_agent: string | null;
  origin: string | null;
  failure_reason: string | null;
  created_at: string;
};

type NotificationRow = QueryResultRow & {
  id: string;
  title: string;
  description: string | null;
  type: NotificationRecord["type"];
  status: NotificationRecord["status"];
  related_entity_type: string | null;
  related_entity_id: string | null;
  href: string | null;
  read_at: string | null;
  created_at: string;
};

function isSettingsPath(pathname: string) {
  return SETTINGS_API_PREFIXES.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`),
  );
}

function accessFromContext(context: AuthenticatedUserContext): SettingsAccess {
  return {
    role: context.role,
    canReadSettings:
      hasPermission(context, "settings.read") || hasPermission(context, "settings.manage"),
    canManageSettings: hasPermission(context, "settings.manage"),
  };
}

function maskIpAddress(ip: string | null) {
  if (!ip) return null;
  if (ip.includes(":")) return ip.replace(/:[^:]*:[^:]*$/, ":****:****");
  return ip.replace(/\.\d+$/, ".***");
}

function readString(value: unknown) {
  return typeof value === "string" ? value : "";
}

function requireRow<T>(row: T | undefined, message: string): T {
  if (!row) throw new ApiError(message, 404, "not_found");
  return row;
}

function mapCompany(row: CompanyRow): CompanySettings {
  const billing = row.billing_address ?? {};
  return {
    id: row.id,
    legalName: row.legal_name,
    tradeName: row.trade_name ?? "",
    document: row.document ?? "",
    stateRegistration: row.state_registration ?? "",
    municipalRegistration: row.municipal_registration ?? "",
    email: row.email ?? "",
    phone: row.phone ?? "",
    website: row.website ?? "",
    description: row.description ?? "",
    segment: row.segment ?? "",
    status: row.status,
    postalCode: row.postal_code ?? "",
    street: row.street ?? "",
    number: row.number ?? "",
    complement: row.complement ?? "",
    district: row.district ?? "",
    city: row.city ?? "",
    state: row.state ?? "",
    country: row.country ?? "BR",
    timeZone: row.time_zone ?? "America/Sao_Paulo",
    defaultLanguage: row.default_language ?? "pt-BR",
    defaultCurrency: row.default_currency ?? "BRL",
    dateFormat: row.date_format ?? "dd/MM/yyyy",
    timeFormat: row.time_format ?? "24h",
    firstDayOfWeek: row.first_day_of_week ?? 1,
    businessHours: {
      start: row.business_hours?.start ?? "08:00",
      end: row.business_hours?.end ?? "18:00",
    },
    defaultContractTermDays: row.default_contract_term_days ?? 365,
    defaultBillingTermDays: row.default_billing_term_days ?? 7,
    logoUrl: row.logo_url ?? "",
    faviconUrl: row.favicon_url ?? "",
    displayName: row.display_name ?? row.trade_name ?? "Automy",
    billingLegalName: row.billing_legal_name ?? "",
    billingDocument: row.billing_document ?? "",
    billingEmail: row.billing_email ?? "",
    billingPhone: row.billing_phone ?? "",
    billingAddress: {
      postalCode: readString(billing["postalCode"]),
      street: readString(billing["street"]),
      number: readString(billing["number"]),
      complement: readString(billing["complement"]),
      district: readString(billing["district"]),
      city: readString(billing["city"]),
      state: readString(billing["state"]),
      country: readString(billing["country"]) || "BR",
    },
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    deletedAt: row.deleted_at,
    createdBy: row.created_by,
    updatedBy: row.updated_by,
  };
}

function mapSecurityPolicy(row: SecurityPolicyRow) {
  return {
    id: row.id,
    companyId: row.company_id,
    sessionDurationDays: row.session_duration_days,
    requirePasswordChangeOnFirstLogin: row.require_password_change_on_first_login,
    minPasswordLength: row.min_password_length,
    lockoutAttempts: row.lockout_attempts,
    lockoutDurationMinutes: row.lockout_duration_minutes,
    allowMultipleSessions: row.allow_multiple_sessions,
    requireEmailVerified: row.require_email_verified,
    mfaStatus: row.mfa_status,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    deletedAt: row.deleted_at,
    createdBy: row.created_by,
    updatedBy: row.updated_by,
  };
}

function getIntegrationName(provider: CompanyIntegration["provider"]) {
  return {
    better_auth: "Better Auth Dashboard",
    mercado_pago: "Mercado Pago",
    transactional_email: "E-mail transacional",
    storage: "Storage",
    railway: "Railway",
  }[provider];
}

function hasEnv(...keys: string[]) {
  return keys.some((key) => Boolean(process.env[key]));
}

function providerRuntimeStatus(provider: CompanyIntegration["provider"]): {
  status: IntegrationStatus;
  environment: string;
  maskedConfig: Record<string, string>;
  publicConfig: Record<string, unknown>;
} {
  if (provider === "better_auth") {
    const configured = hasEnv("BETTER_AUTH_API_KEY");
    return {
      status: configured ? "connected" : "not_configured",
      environment: process.env["NODE_ENV"] === "production" ? "production" : "development",
      maskedConfig: { apiKey: configured ? "Configurada" : "Não configurada" },
      publicConfig: { dashboard: configured },
    };
  }
  if (provider === "mercado_pago") {
    const configured = hasEnv("MERCADO_PAGO_ACCESS_TOKEN", "MP_ACCESS_TOKEN");
    return {
      status: configured ? "connected" : "not_configured",
      environment: process.env["MERCADO_PAGO_ENVIRONMENT"] ?? "not_configured",
      maskedConfig: {
        accessToken: configured ? "Configurado" : "Não configurado",
        webhookSecret: hasEnv("MERCADO_PAGO_WEBHOOK_SECRET") ? "Configurado" : "Não configurado",
      },
      publicConfig: {
        webhookConfigured: hasEnv("MERCADO_PAGO_WEBHOOK_SECRET"),
        publicKey: process.env["MERCADO_PAGO_PUBLIC_KEY"] ? "Configurada" : "Não configurada",
      },
    };
  }
  if (provider === "transactional_email") {
    const configured = hasEnv("RESEND_API_KEY", "EMAIL_API_KEY");
    return {
      status: configured ? "connected" : "not_configured",
      environment: process.env["EMAIL_PROVIDER"] ?? "not_configured",
      maskedConfig: { apiKey: configured ? "Configurada" : "Não configurada" },
      publicConfig: {
        provider: process.env["EMAIL_PROVIDER"] ?? "Não definido",
        sender: process.env["EMAIL_FROM"] ?? "",
      },
    };
  }
  if (provider === "storage") {
    const configured = hasEnv("STORAGE_PROVIDER", "S3_BUCKET", "R2_BUCKET");
    return {
      status: configured ? "connected" : "not_configured",
      environment: process.env["STORAGE_PROVIDER"] ?? "not_configured",
      maskedConfig: { credentials: configured ? "Configuradas" : "Não configuradas" },
      publicConfig: {
        provider: process.env["STORAGE_PROVIDER"] ?? "Pendente",
        bucket:
          process.env["STORAGE_BUCKET"] ??
          process.env["S3_BUCKET"] ??
          process.env["R2_BUCKET"] ??
          "",
      },
    };
  }
  return {
    status: process.env["DATABASE_URL"] ? "connected" : "not_configured",
    environment: process.env["RAILWAY_ENVIRONMENT"] ?? process.env["NODE_ENV"] ?? "development",
    maskedConfig: { databaseUrl: process.env["DATABASE_URL"] ? "Configurada" : "Não configurada" },
    publicConfig: {
      runtime: process.env["RAILWAY_ENVIRONMENT"] ? "Railway" : "Local/Vercel",
      ssl: process.env["PGSSLMODE"] ?? "disable",
    },
  };
}

function mapIntegration(row: IntegrationRow): CompanyIntegration {
  const runtime = providerRuntimeStatus(row.provider);
  return {
    id: row.id,
    companyId: row.company_id,
    provider: row.provider,
    type: row.type,
    name: getIntegrationName(row.provider),
    status: runtime.status === "not_configured" ? row.status : runtime.status,
    environment: runtime.environment !== "not_configured" ? runtime.environment : row.environment,
    publicConfig: { ...row.public_config, ...runtime.publicConfig },
    maskedConfig: runtime.maskedConfig,
    lastCheckedAt: row.last_checked_at,
    lastSuccessAt: row.last_success_at,
    lastError: row.last_error,
    editable: !["better_auth", "railway"].includes(row.provider),
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    deletedAt: row.deleted_at,
    createdBy: row.created_by,
    updatedBy: row.updated_by,
  };
}

function mapNotification(row: NotificationRow): NotificationRecord {
  return {
    id: row.id,
    title: row.title,
    description: row.description,
    type: row.type,
    status: row.status,
    relatedEntityType: row.related_entity_type,
    relatedEntityId: row.related_entity_id,
    href: row.href,
    readAt: row.read_at,
    createdAt: row.created_at,
  };
}

async function ensureSettingsSchema() {
  if (!isRailwayPostgresConfigured()) {
    throw new ApiError("Banco Railway não configurado.", 503, "database_unavailable");
  }
  const db = await getRailwayPostgresPool();
  await db.query("select 1 from public.company_security_settings limit 1");
}

async function ensureCompanyRows(client: PoolClient, context: AuthenticatedUserContext) {
  await client.query(
    `
      insert into public.company_security_settings (company_id, created_by, updated_by)
      values ($1, $2, $2)
      on conflict (company_id) do nothing
    `,
    [context.companyId, context.authUserId],
  );
  await client.query(
    `
      insert into public.company_notification_settings (company_id, timezone, created_by, updated_by)
      select $1, coalesce(time_zone, 'America/Sao_Paulo'), $2, $2
      from public.companies
      where id = $1
      on conflict (company_id) do nothing
    `,
    [context.companyId, context.authUserId],
  );
  await client.query(
    `
      insert into public.notification_preferences (company_id, auth_user_id, created_by, updated_by)
      values ($1, $2, $2, $2)
      on conflict (company_id, auth_user_id) do nothing
    `,
    [context.companyId, context.authUserId],
  );

  const integrations = [
    ["better_auth", "auth"],
    ["mercado_pago", "payments"],
    ["transactional_email", "email"],
    ["storage", "storage"],
    ["railway", "infrastructure"],
  ];
  for (const [provider, type] of integrations) {
    await client.query(
      `
        insert into public.company_integrations (company_id, provider, type, created_by, updated_by)
        values ($1, $2, $3, $4, $4)
        on conflict (company_id, provider) do nothing
      `,
      [context.companyId, provider, type, context.authUserId],
    );
  }
}

async function withClient<T>(
  context: AuthenticatedUserContext,
  callback: (client: PoolClient) => Promise<T>,
) {
  await ensureSettingsSchema();
  const db = await getRailwayPostgresPool();
  const client = await db.connect();
  try {
    await ensureCompanyRows(client, context);
    return await callback(client);
  } finally {
    client.release();
  }
}

async function writeAuditLog(
  client: PoolClient,
  context: AuthenticatedUserContext,
  action: string,
  resourceType: string,
  resourceId: string | null,
  metadata: Record<string, unknown> = {},
) {
  await client.query(
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
      values ($1, $2, $3, $4, $5, $6, $7, $2, $2)
    `,
    [
      context.companyId,
      context.authUserId,
      context.domainUserId,
      action,
      resourceType,
      resourceId,
      JSON.stringify(metadata),
    ],
  );
}

async function getCompanySettings(context: AuthenticatedUserContext) {
  return withClient(context, async (client) => {
    const result = await client.query<CompanyRow>(
      `select * from public.companies where id = $1 and deleted_at is null limit 1`,
      [context.companyId],
    );
    const company = result.rows[0];
    if (!company) throw new ApiError("Empresa não encontrada.", 404, "not_found");
    return jsonResponse({ company: mapCompany(company), access: accessFromContext(context) });
  });
}

async function updateCompanySettings(request: Request, context: AuthenticatedUserContext) {
  const parsed = companySettingsSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    throw new ApiError(parsed.error.issues[0]?.message ?? "Dados inválidos.", 400, "bad_request");
  }
  return withClient(context, async (client) => {
    await client.query("begin");
    try {
      const before = await client.query<CompanyRow>(
        `select * from public.companies where id = $1 and deleted_at is null for update`,
        [context.companyId],
      );
      if (!before.rows[0]) throw new ApiError("Empresa não encontrada.", 404, "not_found");
      const data: CompanySettingsPayload = parsed.data;
      const result = await client.query<CompanyRow>(
        `
          update public.companies
          set legal_name = $2,
              trade_name = $3,
              document = nullif($4, ''),
              state_registration = nullif($5, ''),
              municipal_registration = nullif($6, ''),
              email = nullif($7, ''),
              phone = nullif($8, ''),
              website = nullif($9, ''),
              description = nullif($10, ''),
              segment = nullif($11, ''),
              status = $12,
              postal_code = nullif($13, ''),
              street = nullif($14, ''),
              number = nullif($15, ''),
              complement = nullif($16, ''),
              district = nullif($17, ''),
              city = nullif($18, ''),
              state = nullif($19, ''),
              country = $20,
              time_zone = $21,
              default_language = $22,
              default_currency = $23,
              date_format = $24,
              time_format = $25,
              first_day_of_week = $26,
              business_hours = $27,
              default_contract_term_days = $28,
              default_billing_term_days = $29,
              logo_url = nullif($30, ''),
              favicon_url = nullif($31, ''),
              display_name = nullif($32, ''),
              billing_legal_name = nullif($33, ''),
              billing_document = nullif($34, ''),
              billing_email = nullif($35, ''),
              billing_phone = nullif($36, ''),
              billing_address = $37,
              updated_by = $38,
              updated_at = now()
          where id = $1 and deleted_at is null
          returning *
        `,
        [
          context.companyId,
          data.legalName,
          data.tradeName,
          data.document,
          data.stateRegistration,
          data.municipalRegistration,
          data.email,
          data.phone,
          data.website,
          data.description,
          data.segment,
          data.status,
          data.postalCode,
          data.street,
          data.number,
          data.complement,
          data.district,
          data.city,
          data.state,
          data.country,
          data.timeZone,
          data.defaultLanguage,
          data.defaultCurrency,
          data.dateFormat,
          data.timeFormat,
          data.firstDayOfWeek,
          JSON.stringify(data.businessHours),
          data.defaultContractTermDays,
          data.defaultBillingTermDays,
          data.logoUrl,
          data.faviconUrl,
          data.displayName,
          data.billingLegalName,
          data.billingDocument,
          data.billingEmail,
          data.billingPhone,
          JSON.stringify(data.billingAddress),
          context.authUserId,
        ],
      );
      const beforeCompany = before.rows[0];
      const afterCompany = result.rows[0];
      if (!beforeCompany || !afterCompany)
        throw new ApiError("Empresa não encontrada.", 404, "not_found");
      await writeAuditLog(
        client,
        context,
        "settings.company.updated",
        "company",
        context.companyId,
        {
          before: mapCompany(beforeCompany),
          after: mapCompany(afterCompany),
        },
      );
      await client.query("commit");
      return jsonResponse({ company: mapCompany(afterCompany) });
    } catch (error) {
      await client.query("rollback");
      throw error;
    }
  });
}

async function getSecuritySettings(context: AuthenticatedUserContext) {
  return withClient(context, async (client) => {
    const [policy, history] = await Promise.all([
      client.query<SecurityPolicyRow>(
        `select * from public.company_security_settings where company_id = $1 and deleted_at is null limit 1`,
        [context.companyId],
      ),
      client.query<LoginHistoryRow>(
        `
          select id, success, ip_address, user_agent, origin, failure_reason, created_at
          from public.login_history
          where company_id = $1
            and (auth_user_id = $2 or $3 = true)
            and deleted_at is null
          order by created_at desc
          limit 20
        `,
        [context.companyId, context.authUserId, context.role === "admin"],
      ),
    ]);
    return jsonResponse({
      security: {
        policy: mapSecurityPolicy(requireRow(policy.rows[0], "Política não encontrada.")),
        loginHistory: history.rows.map((row): LoginHistoryRecord => ({
          id: row.id,
          success: row.success,
          ipAddress: row.ip_address,
          maskedIpAddress: maskIpAddress(row.ip_address),
          userAgent: row.user_agent,
          origin: row.origin,
          failureReason: row.failure_reason,
          createdAt: row.created_at,
        })),
        access: accessFromContext(context),
      },
    });
  });
}

async function updateSecuritySettings(request: Request, context: AuthenticatedUserContext) {
  const parsed = securitySettingsSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    throw new ApiError(parsed.error.issues[0]?.message ?? "Dados inválidos.", 400, "bad_request");
  }
  return withClient(context, async (client) => {
    await client.query("begin");
    try {
      const result = await client.query<SecurityPolicyRow>(
        `
          update public.company_security_settings
          set session_duration_days = $2,
              require_password_change_on_first_login = $3,
              min_password_length = $4,
              lockout_attempts = $5,
              lockout_duration_minutes = $6,
              allow_multiple_sessions = $7,
              require_email_verified = $8,
              updated_by = $9,
              updated_at = now()
          where company_id = $1 and deleted_at is null
          returning *
        `,
        [
          context.companyId,
          parsed.data.sessionDurationDays,
          parsed.data.requirePasswordChangeOnFirstLogin,
          parsed.data.minPasswordLength,
          parsed.data.lockoutAttempts,
          parsed.data.lockoutDurationMinutes,
          parsed.data.allowMultipleSessions,
          parsed.data.requireEmailVerified,
          context.authUserId,
        ],
      );
      const policy = result.rows[0];
      if (!policy) throw new ApiError("Política não encontrada.", 404, "not_found");
      await writeAuditLog(
        client,
        context,
        "settings.security.updated",
        "company",
        context.companyId,
        parsed.data,
      );
      await client.query("commit");
      return jsonResponse({ policy: mapSecurityPolicy(policy) });
    } catch (error) {
      await client.query("rollback");
      throw error;
    }
  });
}

async function listIntegrations(context: AuthenticatedUserContext) {
  return withClient(context, async (client) => {
    const result = await client.query<IntegrationRow>(
      `select * from public.company_integrations where company_id = $1 and deleted_at is null order by provider`,
      [context.companyId],
    );
    return jsonResponse({
      integrations: result.rows.map(mapIntegration),
      access: accessFromContext(context),
    });
  });
}

async function updateIntegration(request: Request, url: URL, context: AuthenticatedUserContext) {
  const provider = integrationProviderSchema.safeParse(url.pathname.split("/").at(-1));
  if (!provider.success) throw new ApiError("Integração inválida.", 400, "bad_request");
  if (provider.data === "better_auth" || provider.data === "railway") {
    throw new ApiError("Esta integração é gerenciada por variáveis de ambiente.", 403, "forbidden");
  }
  const parsed = integrationUpdateSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    throw new ApiError(parsed.error.issues[0]?.message ?? "Dados inválidos.", 400, "bad_request");
  }
  return withClient(context, async (client) => {
    const result = await client.query<IntegrationRow>(
      `
        update public.company_integrations
        set status = $3,
            environment = $4,
            public_config = $5,
            updated_by = $6,
            updated_at = now()
        where company_id = $1 and provider = $2 and deleted_at is null
        returning *
      `,
      [
        context.companyId,
        provider.data,
        parsed.data.status,
        parsed.data.environment,
        JSON.stringify(parsed.data.publicConfig),
        context.authUserId,
      ],
    );
    const integration = result.rows[0];
    if (!integration) throw new ApiError("Integração não encontrada.", 404, "not_found");
    await writeAuditLog(
      client,
      context,
      "settings.integration.updated",
      "company_integration",
      integration.id,
      {
        provider: provider.data,
      },
    );
    return jsonResponse({ integration: mapIntegration(integration) });
  });
}

async function testIntegration(url: URL, context: AuthenticatedUserContext) {
  const parts = url.pathname.split("/");
  const provider = integrationProviderSchema.safeParse(parts.at(-2));
  if (!provider.success) throw new ApiError("Integração inválida.", 400, "bad_request");
  const runtime = providerRuntimeStatus(provider.data);
  const checkedAt = new Date().toISOString();
  const status = runtime.status;
  const message =
    status === "connected"
      ? "Configuração operacional validada sem expor credenciais."
      : "Integração não configurada nas variáveis de ambiente oficiais.";
  return withClient(context, async (client) => {
    await client.query(
      `
        update public.company_integrations
        set last_checked_at = now(),
            last_success_at = case when $3 = 'connected' then now() else last_success_at end,
            last_error = case when $3 = 'connected' then null else $4 end,
            updated_by = $5,
            updated_at = now()
        where company_id = $1 and provider = $2 and deleted_at is null
      `,
      [
        context.companyId,
        provider.data,
        status,
        status === "connected" ? null : message,
        context.authUserId,
      ],
    );
    await writeAuditLog(
      client,
      context,
      "settings.integration.tested",
      "company",
      context.companyId,
      {
        provider: provider.data,
        status,
      },
    );
    return jsonResponse({ result: { provider: provider.data, status, message, checkedAt } });
  });
}

async function getNotificationSettings(context: AuthenticatedUserContext) {
  return withClient(context, async (client) => {
    const [userPrefs, companySettings] = await Promise.all([
      client.query<NotificationPreferenceRow>(
        `select * from public.notification_preferences where company_id = $1 and auth_user_id = $2 and deleted_at is null limit 1`,
        [context.companyId, context.authUserId],
      ),
      client.query<CompanyNotificationRow>(
        `select * from public.company_notification_settings where company_id = $1 and deleted_at is null limit 1`,
        [context.companyId],
      ),
    ]);
    const user = requireRow(userPrefs.rows[0], "Preferências de notificação não encontradas.");
    const company = requireRow(
      companySettings.rows[0],
      "Configuração de notificação não encontrada.",
    );
    return jsonResponse({
      notifications: {
        userPreferences: {
          id: user.id,
          companyId: user.company_id,
          authUserId: user.auth_user_id,
          inApp: user.in_app,
          email: user.email,
          contracts: user.contracts,
          billing: user.billing,
          tickets: user.tickets,
          agenda: user.agenda,
          security: user.security,
          adminUpdates: user.admin_updates,
          dailySummary: user.daily_summary,
          weeklySummary: user.weekly_summary,
          createdAt: user.created_at,
          updatedAt: user.updated_at,
          deletedAt: user.deleted_at,
          createdBy: user.created_by,
          updatedBy: user.updated_by,
        },
        companySettings: {
          id: company.id,
          companyId: company.company_id,
          inAppEnabled: company.in_app_enabled,
          emailEnabled: company.email_enabled,
          defaultSender: company.default_sender ?? "",
          contractNoticeDays: company.contract_notice_days,
          billingNoticeDays: company.billing_notice_days,
          agendaReminderMinutes: company.agenda_reminder_minutes,
          slaWarningHours: company.sla_warning_hours,
          criticalAlertsEnabled: company.critical_alerts_enabled,
          quietHours: {
            enabled: Boolean(company.quiet_hours?.enabled),
            start: company.quiet_hours?.start ?? "22:00",
            end: company.quiet_hours?.end ?? "07:00",
          },
          timezone: company.timezone,
          createdAt: company.created_at,
          updatedAt: company.updated_at,
          deletedAt: company.deleted_at,
          createdBy: company.created_by,
          updatedBy: company.updated_by,
        },
        access: accessFromContext(context),
      },
    });
  });
}

async function updateNotificationSettings(request: Request, context: AuthenticatedUserContext) {
  const parsed = notificationSettingsSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    throw new ApiError(parsed.error.issues[0]?.message ?? "Dados inválidos.", 400, "bad_request");
  }
  const wantsCompanyUpdate = Boolean(parsed.data.companySettings);
  if (wantsCompanyUpdate && !hasPermission(context, "settings.manage")) {
    throw new ApiError("Permissão insuficiente.", 403, "forbidden");
  }
  return withClient(context, async (client) => {
    await client.query("begin");
    try {
      const user = parsed.data.userPreferences;
      await client.query(
        `
          update public.notification_preferences
          set in_app = $3,
              email = $4,
              contracts = $5,
              billing = $6,
              tickets = $7,
              agenda = $8,
              security = $9,
              admin_updates = $10,
              daily_summary = $11,
              weekly_summary = $12,
              updated_by = $2,
              updated_at = now()
          where company_id = $1 and auth_user_id = $2 and deleted_at is null
        `,
        [
          context.companyId,
          context.authUserId,
          user.inApp,
          user.email,
          user.contracts,
          user.billing,
          user.tickets,
          user.agenda,
          user.security,
          user.adminUpdates,
          user.dailySummary,
          user.weeklySummary,
        ],
      );
      if (parsed.data.companySettings) {
        const company = parsed.data.companySettings;
        await client.query(
          `
            update public.company_notification_settings
            set in_app_enabled = $2,
                email_enabled = $3,
                default_sender = nullif($4, ''),
                contract_notice_days = $5,
                billing_notice_days = $6,
                agenda_reminder_minutes = $7,
                sla_warning_hours = $8,
                critical_alerts_enabled = $9,
                quiet_hours = $10,
                timezone = $11,
                updated_by = $12,
                updated_at = now()
            where company_id = $1 and deleted_at is null
          `,
          [
            context.companyId,
            company.inAppEnabled,
            company.emailEnabled,
            company.defaultSender,
            company.contractNoticeDays,
            company.billingNoticeDays,
            company.agendaReminderMinutes,
            company.slaWarningHours,
            company.criticalAlertsEnabled,
            JSON.stringify(company.quietHours),
            company.timezone,
            context.authUserId,
          ],
        );
      }
      await writeAuditLog(
        client,
        context,
        "settings.notifications.updated",
        "company",
        context.companyId,
        {
          companySettingsUpdated: wantsCompanyUpdate,
        },
      );
      await client.query("commit");
      return await getNotificationSettings(context);
    } catch (error) {
      await client.query("rollback");
      throw error;
    }
  });
}

async function listNotifications(context: AuthenticatedUserContext) {
  return withClient(context, async (client) => {
    const [rows, count] = await Promise.all([
      client.query<NotificationRow>(
        `
          select *
          from public.notifications
          where company_id = $1
            and auth_user_id = $2
            and deleted_at is null
            and status <> 'archived'
          order by created_at desc
          limit 20
        `,
        [context.companyId, context.authUserId],
      ),
      client.query<{ total: string }>(
        `
          select count(*)::text as total
          from public.notifications
          where company_id = $1
            and auth_user_id = $2
            and status = 'unread'
            and deleted_at is null
        `,
        [context.companyId, context.authUserId],
      ),
    ]);
    return jsonResponse({
      notifications: rows.rows.map(mapNotification),
      unreadCount: Number(count.rows[0]?.total ?? 0),
    });
  });
}

async function markNotificationRead(url: URL, context: AuthenticatedUserContext) {
  const id = url.pathname.split("/").at(-2);
  if (!id) throw new ApiError("Notificação não informada.", 400, "bad_request");
  return withClient(context, async (client) => {
    await client.query(
      `
        update public.notifications
        set status = 'read',
            read_at = coalesce(read_at, now()),
            updated_by = $3,
            updated_at = now()
        where id = $1
          and company_id = $2
          and auth_user_id = $3
          and deleted_at is null
      `,
      [id, context.companyId, context.authUserId],
    );
    return jsonResponse({ ok: true });
  });
}

async function markAllNotificationsRead(context: AuthenticatedUserContext) {
  return withClient(context, async (client) => {
    await client.query(
      `
        update public.notifications
        set status = 'read',
            read_at = coalesce(read_at, now()),
            updated_by = $2,
            updated_at = now()
        where company_id = $1
          and auth_user_id = $2
          and status = 'unread'
          and deleted_at is null
      `,
      [context.companyId, context.authUserId],
    );
    return jsonResponse({ ok: true });
  });
}

async function archiveNotification(url: URL, context: AuthenticatedUserContext) {
  const id = url.pathname.split("/").at(-2);
  if (!id) throw new ApiError("Notificação não informada.", 400, "bad_request");
  return withClient(context, async (client) => {
    const result = await client.query<{ id: string }>(
      `
        update public.notifications
        set status = 'archived',
            archived_at = now(),
            updated_by = $3,
            updated_at = now()
        where id = $1
          and company_id = $2
          and auth_user_id = $3
          and deleted_at is null
        returning id
      `,
      [id, context.companyId, context.authUserId],
    );
    if (!result.rows[0]) throw new ApiError("Notificação não encontrada.", 404, "not_found");
    return jsonResponse({ ok: true });
  });
}

function handleApiError(error: unknown) {
  if (error instanceof ApiError) {
    return jsonResponse({ error: error.message, code: error.code }, { status: error.status });
  }
  console.error(error);
  return jsonResponse({ error: "Erro ao acessar banco." }, { status: 500 });
}

export async function handleSettingsApiRequest(request: Request) {
  const url = new URL(request.url);
  if (!isSettingsPath(url.pathname)) return null;

  try {
    const auth = await requireAuthenticatedUser(request);
    if (auth.error) return auth.error;
    const context = auth.context;

    if (url.pathname === "/api/settings/company" && request.method === "GET") {
      const permissionError = requirePermission(context, "settings.read");
      if (permissionError && !hasPermission(context, "settings.manage")) return permissionError;
      return await getCompanySettings(context);
    }
    if (url.pathname === "/api/settings/company" && request.method === "PATCH") {
      const permissionError = requirePermission(context, "settings.manage");
      if (permissionError) return permissionError;
      return await updateCompanySettings(request, context);
    }
    if (url.pathname === "/api/settings/security" && request.method === "GET") {
      return await getSecuritySettings(context);
    }
    if (url.pathname === "/api/settings/security" && request.method === "PATCH") {
      const permissionError = requirePermission(context, "settings.manage");
      if (permissionError) return permissionError;
      return await updateSecuritySettings(request, context);
    }
    if (url.pathname === "/api/settings/integrations" && request.method === "GET") {
      const permissionError = requirePermission(context, "settings.read");
      if (permissionError && !hasPermission(context, "settings.manage")) return permissionError;
      return await listIntegrations(context);
    }
    if (
      url.pathname.startsWith("/api/settings/integrations/") &&
      url.pathname.endsWith("/test") &&
      request.method === "POST"
    ) {
      const permissionError = requirePermission(context, "settings.manage");
      if (permissionError) return permissionError;
      return await testIntegration(url, context);
    }
    if (url.pathname.startsWith("/api/settings/integrations/") && request.method === "PATCH") {
      const permissionError = requirePermission(context, "settings.manage");
      if (permissionError) return permissionError;
      return await updateIntegration(request, url, context);
    }
    if (url.pathname === "/api/settings/notifications" && request.method === "GET") {
      return await getNotificationSettings(context);
    }
    if (url.pathname === "/api/settings/notifications" && request.method === "PATCH") {
      return await updateNotificationSettings(request, context);
    }
    if (url.pathname === "/api/notifications" && request.method === "GET") {
      return await listNotifications(context);
    }
    if (url.pathname.match(/^\/api\/notifications\/[^/]+\/read$/) && request.method === "PATCH") {
      return await markNotificationRead(url, context);
    }
    if (
      url.pathname.match(/^\/api\/notifications\/[^/]+\/archive$/) &&
      request.method === "PATCH"
    ) {
      return await archiveNotification(url, context);
    }
    if (url.pathname === "/api/notifications/read-all" && request.method === "POST") {
      return await markAllNotificationsRead(context);
    }

    return jsonResponse({ error: "Método não permitido." }, { status: 405 });
  } catch (error) {
    return handleApiError(error);
  }
}
