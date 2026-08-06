import type { AuthenticatedUserContext } from "@/shared/server/authz";

type NotificationDb = {
  query: (sql: string, values?: unknown[]) => Promise<{ rows: Array<Record<string, unknown>> }>;
};

type OperationalNotificationInput = {
  action: string;
  resourceType: "client" | "product" | "contract" | "charge" | "scheduled_call" | "support_ticket";
  resourceId: string;
  metadata?: Record<string, unknown>;
};

type NotificationType = "info" | "success" | "warning" | "danger";

const notificationPreferenceColumns = {
  client: "admin_updates",
  product: "admin_updates",
  contract: "contracts",
  charge: "billing",
  scheduled_call: "agenda",
  support_ticket: "tickets",
} as const satisfies Record<OperationalNotificationInput["resourceType"], string>;

const notificationHref = {
  client: "/clientes",
  product: "/produtos",
  contract: "/contratos",
  charge: "/financeiro",
  scheduled_call: "/call-de-agendamento",
  support_ticket: "/suporte",
} as const satisfies Record<OperationalNotificationInput["resourceType"], string>;

const resourceLabels = {
  client: "Cliente",
  product: "Produto",
  contract: "Contrato",
  charge: "Cobrança",
  scheduled_call: "Agendamento",
  support_ticket: "Ticket",
} as const satisfies Record<OperationalNotificationInput["resourceType"], string>;

const actionLabels = {
  create: "criado",
  update: "atualizado",
  delete: "removido",
} as const;

function readMetadataText(metadata: Record<string, unknown>, keys: string[]) {
  for (const key of keys) {
    const value = metadata[key];
    if (typeof value === "string" && value.trim()) return value.trim();
    if (typeof value === "number" && Number.isFinite(value)) return String(value);
  }
  return "";
}

function actionSuffix(action: string): keyof typeof actionLabels {
  if (action.endsWith(".create")) return "create";
  if (action.endsWith(".delete")) return "delete";
  return "update";
}

function typeForAction(action: string, metadata: Record<string, unknown>): NotificationType {
  const status = readMetadataText(metadata, ["status"]).toLowerCase();
  if (status.includes("failed") || status.includes("erro")) return "danger";
  if (status.includes("cancel") || action.endsWith(".delete")) return "warning";
  if (action.endsWith(".create") || status.includes("paid") || status.includes("resolvido")) {
    return "success";
  }
  return "info";
}

function descriptionFor(input: OperationalNotificationInput) {
  const metadata = input.metadata ?? {};
  const details = readMetadataText(metadata, [
    "legalName",
    "name",
    "title",
    "invoice",
    "document",
    "status",
    "priority",
    "startAt",
  ]);

  if (!details) return null;
  return `${resourceLabels[input.resourceType]}: ${details}`;
}

export async function createOperationalNotification(
  db: NotificationDb,
  context: AuthenticatedUserContext,
  input: OperationalNotificationInput,
) {
  const preferenceColumn = notificationPreferenceColumns[input.resourceType];
  const suffix = actionSuffix(input.action);
  const title = `${resourceLabels[input.resourceType]} ${actionLabels[suffix]}`;
  const type = typeForAction(input.action, input.metadata ?? {});

  await db.query(
    `
      insert into public.company_notification_settings (company_id, timezone, created_by, updated_by)
      select $1, coalesce(time_zone, 'America/Sao_Paulo'), $2, $2
      from public.companies
      where id = $1
      on conflict (company_id) do nothing
    `,
    [context.companyId, context.authUserId],
  );

  await db.query(
    `
      insert into public.notification_preferences (company_id, auth_user_id, created_by, updated_by)
      values ($1, $2, $2, $2)
      on conflict (company_id, auth_user_id) do nothing
    `,
    [context.companyId, context.authUserId],
  );

  const notification = await db.query(
    `
      insert into public.notifications (
        company_id,
        auth_user_id,
        title,
        description,
        type,
        status,
        related_entity_type,
        related_entity_id,
        href,
        created_by,
        updated_by
      )
      select $1, $2, $3, $4, $5, 'unread', $6, $7, $8, $2, $2
      where exists (
        select 1
        from public.company_notification_settings
        where company_id = $1
          and in_app_enabled = true
          and deleted_at is null
      )
      and exists (
        select 1
        from public.notification_preferences
        where company_id = $1
          and auth_user_id = $2
          and in_app = true
          and ${preferenceColumn} = true
          and deleted_at is null
      )
      returning id
    `,
    [
      context.companyId,
      context.authUserId,
      title,
      descriptionFor(input),
      type,
      input.resourceType,
      input.resourceId,
      notificationHref[input.resourceType],
    ],
  );

  const row = notification.rows[0];
  const notificationId = typeof row?.["id"] === "string" ? row["id"] : null;
  if (!notificationId) return null;

  await db.query(
    `
      insert into public.notification_deliveries (
        notification_id,
        channel,
        status,
        sent_at,
        created_by,
        updated_by
      )
      values ($1, 'in_app', 'sent', now(), $2, $2)
    `,
    [notificationId, context.authUserId],
  );

  return notificationId;
}
