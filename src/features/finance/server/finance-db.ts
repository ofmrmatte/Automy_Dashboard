import type {
  Charge,
  ChargeStatus,
  FinancePayload,
  FinanceSummary,
} from "@/features/finance/types";
import type { ChargeFormData, ChargePatchData } from "@/features/finance/validation";
import { chargeStatusLabels } from "@/features/finance/validation";
import type { AuthenticatedUserContext } from "@/shared/server/authz";
import { getRailwayPostgresPool, isRailwayPostgresConfigured } from "@/shared/server/postgres";
import { formatCurrency, formatDate } from "@/shared/utils/formatters";
import type { QueryResultRow } from "pg";

type QueryableConnection = {
  query: (sql: string, values?: unknown[]) => Promise<{ rows: QueryResultRow[] }>;
};

type ChargeRow = {
  id: string;
  invoice: string;
  reference: string | null;
  client_id: string | null;
  contract_id: string | null;
  client_name: string;
  client_trade_name: string | null;
  client_legal_name: string | null;
  contract_name: string | null;
  due_date: string | null;
  amount: string | number | null;
  paid_value: string | number | null;
  method: string;
  provider: string;
  effective_status: ChargeStatus;
  description: string | null;
  notes: string | null;
  paid_at: string | null;
  canceled_at: string | null;
  failed_at: string | null;
  reconciliation_status: string;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
  created_by: string | null;
  updated_by: string | null;
};

type ChargeUpsertInput = {
  invoice: string;
  clientName: string;
  dueDate: string | null;
  amount: number;
  method: string;
  status: ChargeStatus;
  providerTopic: string;
  providerAction: string | null;
  providerPaymentId: string;
  providerSubscriptionId: string | null;
  providerStatus: string | null;
  externalReference: string | null;
  paidAt: string | null;
  pendingAt: string | null;
  payload: unknown;
};

type WebhookEventInput = {
  eventId: string;
  requestId: string | null;
  signatureTimestamp: string | null;
  topic: string;
  dataId: string;
  action: string | null;
  status: "received" | "processed" | "ignored" | "failed";
  error?: string | null;
  payload: unknown;
  chargeId?: string | null;
  companyId?: string | null;
};

export function isFinanceDatabaseConfigured() {
  return isRailwayPostgresConfigured();
}

async function ensureFinanceSchema() {
  if (!isFinanceDatabaseConfigured()) return;

  const db = await getRailwayPostgresPool();
  await db.query("select 1 from public.charges limit 1");
}

function mapCharge(row: ChargeRow): Charge {
  const status = row.effective_status;
  const amount = Number(row.amount ?? 0);

  return {
    id: row.id,
    invoice: row.invoice,
    reference: row.reference ?? "",
    clientId: row.client_id ?? "",
    contractId: row.contract_id ?? "",
    client: row.client_trade_name ?? row.client_legal_name ?? row.client_name,
    contract: row.contract_name ?? "",
    dueDate: row.due_date ?? "",
    due: row.due_date ? formatDate(row.due_date) : "-",
    amount,
    value: formatCurrency(amount),
    paidValue: Number(row.paid_value ?? 0),
    method: row.method,
    provider: row.provider,
    status,
    statusLabel: chargeStatusLabels[status],
    description: row.description ?? "",
    notes: row.notes ?? "",
    paidAt: row.paid_at,
    canceledAt: row.canceled_at,
    failedAt: row.failed_at,
    reconciliationStatus: row.reconciliation_status,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    deletedAt: row.deleted_at,
    createdBy: row.created_by,
    updatedBy: row.updated_by,
  };
}

const CHARGE_SELECT = `
  select
    charges.id,
    charges.invoice,
    charges.reference,
    charges.client_id,
    charges.contract_id,
    charges.client_name,
    clients.trade_name as client_trade_name,
    clients.legal_name as client_legal_name,
    contracts.name as contract_name,
    charges.due_date,
    charges.amount,
    charges.paid_value,
    charges.method,
    charges.provider,
    case
      when charges.status = 'pending'
        and charges.due_date is not null
        and charges.due_date < current_date
      then 'overdue'
      else charges.status
    end as effective_status,
    charges.description,
    charges.notes,
    charges.paid_at,
    charges.canceled_at,
    charges.failed_at,
    charges.reconciliation_status,
    charges.created_at,
    charges.updated_at,
    charges.deleted_at,
    charges.created_by,
    charges.updated_by
  from public.charges
  left join public.clients
    on clients.id = charges.client_id
    and clients.company_id = charges.company_id
    and clients.deleted_at is null
  left join public.contracts
    on contracts.id = charges.contract_id
    and contracts.company_id = charges.company_id
    and contracts.deleted_at is null
`;

export async function listFinanceCharges(companyId: string): Promise<FinancePayload> {
  if (!isFinanceDatabaseConfigured()) {
    return { charges: [], summary: emptyFinanceSummary };
  }

  await ensureFinanceSchema();
  const db = await getRailwayPostgresPool();
  const [chargesResult, summaryResult] = await Promise.all([
    db.query<ChargeRow>(
      `
      ${CHARGE_SELECT}
      where charges.deleted_at is null
        and charges.company_id = $1
      order by charges.due_date nulls last, charges.created_at desc
      limit 500
    `,
      [companyId],
    ),
    db.query<{
      monthly_revenue: string | number | null;
      annual_revenue: string | number | null;
      overdue_amount: string | number | null;
      expected_receipts: string | number | null;
      paid_amount: string | number | null;
      open_amount: string | number | null;
      delinquent_clients: number;
    }>(
      `
      with visible_charges as (
        select
          *,
          case
            when status = 'pending' and due_date is not null and due_date < current_date
            then 'overdue'
            else status
          end as effective_status
        from public.charges
        where deleted_at is null
          and company_id = $1
      )
      select
        coalesce(sum(amount) filter (
          where status = 'paid'
            and paid_at >= date_trunc('month', now())
        ), 0) as monthly_revenue,
        coalesce(sum(amount) filter (
          where status = 'paid'
            and paid_at >= date_trunc('year', now())
        ), 0) as annual_revenue,
        coalesce(sum(amount) filter (where effective_status = 'overdue'), 0) as overdue_amount,
        coalesce(sum(amount) filter (
          where effective_status = 'pending'
            and (due_date is null or due_date >= current_date)
        ), 0) as expected_receipts,
        coalesce(sum(amount) filter (where status = 'paid'), 0) as paid_amount,
        coalesce(sum(amount) filter (where effective_status in ('pending', 'overdue')), 0) as open_amount,
        count(distinct client_id) filter (where effective_status = 'overdue')::int as delinquent_clients
      from visible_charges
    `,
      [companyId],
    ),
  ]);

  const summary = summaryResult.rows[0];

  return {
    charges: chargesResult.rows.map(mapCharge),
    summary: {
      monthlyRevenue: Number(summary?.monthly_revenue ?? 0),
      annualRevenue: Number(summary?.annual_revenue ?? 0),
      overdueAmount: Number(summary?.overdue_amount ?? 0),
      expectedReceipts: Number(summary?.expected_receipts ?? 0),
      paidAmount: Number(summary?.paid_amount ?? 0),
      openAmount: Number(summary?.open_amount ?? 0),
      delinquentClients: Number(summary?.delinquent_clients ?? 0),
    },
  };
}

export async function createFinanceCharge(
  payload: ChargeFormData,
  context: AuthenticatedUserContext,
) {
  const db = await getRailwayPostgresPool();
  const client = await db.connect();

  try {
    await client.query("begin");
    const result = await client.query<{ id: string }>(
      `
      insert into public.charges (
        company_id,
        contract_id,
        client_id,
        invoice,
        reference,
        client_name,
        due_date,
        amount,
        method,
        status,
        provider,
        description,
        notes,
        paid_value,
        paid_at,
        canceled_at,
        failed_at,
        reconciliation_status,
        payload,
        created_by,
        updated_by
      )
      select
        $1,
        nullif($3, '')::uuid,
        clients.id,
        $4,
        nullif($5, ''),
        coalesce(clients.trade_name, clients.legal_name),
        $6::date,
        $7::numeric,
        $8,
        $9,
        'manual',
        nullif($10, ''),
        nullif($11, ''),
        case when $9 = 'paid' then $7::numeric else null end,
        case when $9 = 'paid' then now() else null end,
        case when $9 = 'canceled' then now() else null end,
        case when $9 = 'failed' then now() else null end,
        case when $9 = 'paid' then 'reconciled' else 'open' end,
        '{}'::jsonb,
        $12,
        $12
      from public.clients
      where clients.id = $2
        and clients.company_id = $1
        and clients.deleted_at is null
        and (
          nullif($3, '') is null
          or exists (
            select 1
            from public.contracts
            where contracts.id = nullif($3, '')::uuid
              and contracts.client_id = clients.id
              and contracts.company_id = $1
              and contracts.deleted_at is null
          )
        )
      returning id
    `,
      chargeQueryValues(payload, context),
    );

    const created = result.rows[0];
    if (!created) {
      await client.query("rollback");
      throw new FinanceDomainError("Cliente ou contrato não encontrado.", 404);
    }

    await recordFinanceAudit(client, context, "charge.create", created.id, {
      invoice: payload.invoice,
      status: payload.status,
      amount: payload.amount,
    });
    await client.query("commit");

    return getFinanceChargeById(created.id, context.companyId);
  } catch (error) {
    await client.query("rollback");
    throw normalizeFinanceError(error);
  } finally {
    client.release();
  }
}

export async function updateFinanceCharge(
  payload: ChargePatchData,
  context: AuthenticatedUserContext,
) {
  const db = await getRailwayPostgresPool();
  const client = await db.connect();

  try {
    await client.query("begin");
    const result = await client.query<{ id: string }>(
      `
      update public.charges
      set
        contract_id = coalesce(nullif($3, '')::uuid, contract_id),
        client_id = coalesce($4::uuid, client_id),
        invoice = coalesce(nullif($5, ''), invoice),
        reference = coalesce($6, reference),
        client_name = coalesce((
          select coalesce(clients.trade_name, clients.legal_name)
          from public.clients
          where clients.id = coalesce($4::uuid, charges.client_id)
            and clients.company_id = $2
            and clients.deleted_at is null
          limit 1
        ), client_name),
        due_date = coalesce($7::date, due_date),
        amount = coalesce($8::numeric, amount),
        method = coalesce(nullif($9, ''), method),
        status = coalesce(nullif($10, ''), status),
        description = coalesce($11, description),
        notes = coalesce($12, notes),
        paid_value = case
          when $10 = 'paid' then coalesce($8::numeric, amount)
          when $10 in ('pending', 'overdue', 'canceled', 'failed') then null
          else paid_value
        end,
        paid_at = case
          when $10 = 'paid' then coalesce(paid_at, now())
          when $10 in ('pending', 'overdue', 'canceled', 'failed') then null
          else paid_at
        end,
        canceled_at = case when $10 = 'canceled' then coalesce(canceled_at, now()) else canceled_at end,
        failed_at = case when $10 = 'failed' then coalesce(failed_at, now()) else failed_at end,
        reconciliation_status = case when $10 = 'paid' then 'reconciled' else reconciliation_status end,
        updated_by = $13,
        updated_at = now()
      where id = $1
        and company_id = $2
        and deleted_at is null
        and (
          $4::uuid is null
          or exists (
            select 1
            from public.clients
            where clients.id = $4::uuid
              and clients.company_id = $2
              and clients.deleted_at is null
          )
        )
        and (
          nullif($3, '') is null
          or exists (
            select 1
            from public.contracts
            where contracts.id = nullif($3, '')::uuid
              and contracts.client_id = coalesce($4::uuid, charges.client_id)
              and contracts.company_id = $2
              and contracts.deleted_at is null
          )
        )
      returning id
    `,
      [
        payload.id,
        context.companyId,
        payload.contractId ?? "",
        payload.clientId ?? null,
        payload.invoice ?? "",
        payload.reference ?? null,
        payload.dueDate ?? null,
        payload.amount ?? null,
        payload.method ?? "",
        payload.status ?? "",
        payload.description ?? null,
        payload.notes ?? null,
        context.authUserId,
      ],
    );

    const updated = result.rows[0];
    if (!updated) {
      await client.query("rollback");
      throw new FinanceDomainError("Cobrança não encontrada.", 404);
    }

    await recordFinanceAudit(client, context, "charge.update", updated.id, {
      status: payload.status,
      amount: payload.amount,
    });
    await client.query("commit");

    return getFinanceChargeById(updated.id, context.companyId);
  } catch (error) {
    await client.query("rollback");
    throw normalizeFinanceError(error);
  } finally {
    client.release();
  }
}

export async function updateFinanceChargeStatus(
  chargeId: string,
  status: ChargeStatus,
  context: AuthenticatedUserContext,
) {
  return updateFinanceCharge({ id: chargeId, status }, context);
}

export async function deleteFinanceCharge(chargeId: string, context: AuthenticatedUserContext) {
  const db = await getRailwayPostgresPool();
  const result = await db.query<{ id: string }>(
    `
    update public.charges
    set deleted_at = now(), updated_at = now(), updated_by = $3
    where id = $1
      and company_id = $2
      and deleted_at is null
    returning id
  `,
    [chargeId, context.companyId, context.authUserId],
  );

  if (!result.rows[0]) {
    throw new FinanceDomainError("Cobrança não encontrada.", 404);
  }

  await recordFinanceAudit(db, context, "charge.delete", chargeId);
}

async function getFinanceChargeById(chargeId: string, companyId: string) {
  const db = await getRailwayPostgresPool();
  const result = await db.query<ChargeRow>(
    `
    ${CHARGE_SELECT}
    where charges.id = $1
      and charges.company_id = $2
      and charges.deleted_at is null
    limit 1
  `,
    [chargeId, companyId],
  );

  const charge = result.rows[0];
  return charge ? mapCharge(charge) : null;
}

function chargeQueryValues(payload: ChargeFormData, context: AuthenticatedUserContext) {
  return [
    context.companyId,
    payload.clientId,
    payload.contractId,
    payload.invoice,
    payload.reference,
    payload.dueDate,
    payload.amount,
    payload.method,
    payload.status,
    payload.description,
    payload.notes,
    context.authUserId,
  ];
}

async function recordFinanceAudit(
  db: QueryableConnection,
  context: AuthenticatedUserContext,
  action: string,
  chargeId: string,
  metadata: Record<string, unknown> = {},
) {
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
    values ($1, $2, $3, $4, 'charge', $5, $6, $2, $2)
  `,
    [
      context.companyId,
      context.authUserId,
      context.domainUserId,
      action,
      chargeId,
      JSON.stringify(metadata),
    ],
  );

  await db.query(
    `
    insert into public.activity_logs (
      company_id,
      actor_user_id,
      entity_type,
      entity_id,
      action,
      metadata,
      created_by,
      updated_by
    )
    values ($1, $2, 'charge', $3, $4, $5, $6, $6)
  `,
    [
      context.companyId,
      context.domainUserId,
      chargeId,
      action,
      JSON.stringify(metadata),
      context.authUserId,
    ],
  );
}

export async function recordMercadoPagoWebhookEvent(input: WebhookEventInput) {
  await ensureFinanceSchema();
  const db = await getRailwayPostgresPool();
  await db.query(
    `
    insert into public.payment_webhook_events (
      company_id,
      charge_id,
      provider,
      event_id,
      request_id,
      signature_timestamp,
      topic,
      data_id,
      action,
      status,
      error,
      payload,
      processed_at
    )
    values ($1, $2, 'mercado_pago', $3, $4, $5::timestamptz, $6, $7, $8, $9, $10, $11, now())
    on conflict (provider, event_id)
    where deleted_at is null
    do update set
      status = excluded.status,
      error = excluded.error,
      payload = excluded.payload,
      charge_id = coalesce(excluded.charge_id, payment_webhook_events.charge_id),
      company_id = coalesce(excluded.company_id, payment_webhook_events.company_id),
      processed_at = now(),
      updated_at = now()
  `,
    [
      input.companyId ?? null,
      input.chargeId ?? null,
      input.eventId,
      input.requestId,
      input.signatureTimestamp,
      input.topic,
      input.dataId,
      input.action,
      input.status,
      input.error ?? null,
      JSON.stringify(input.payload),
    ],
  );
}

export async function upsertMercadoPagoCharge(input: ChargeUpsertInput) {
  await ensureFinanceSchema();
  const db = await getRailwayPostgresPool();

  const result = await db.query<{ id: string; company_id: string | null }>(
    `
    update public.charges
    set
      invoice = $1,
      due_date = coalesce($2::date, due_date),
      amount = $3,
      method = $4,
      status = $5,
      provider = 'mercado_pago',
      provider_topic = $6,
      provider_action = $7,
      provider_payment_id = $8,
      provider_subscription_id = $9,
      provider_status = $10,
      external_reference = $11,
      paid_value = case when $5 = 'paid' then $3 else paid_value end,
      paid_at = coalesce($12::timestamptz, paid_at),
      pending_at = coalesce($13::timestamptz, pending_at),
      last_notification_at = now(),
      reconciliation_status = case when $5 = 'paid' then 'reconciled' else reconciliation_status end,
      payload = $14,
      updated_at = now()
    where deleted_at is null
      and (
        (provider = 'mercado_pago' and provider_payment_id = $8)
        or id::text = $11
      )
    returning id, company_id
  `,
    [
      input.invoice,
      input.dueDate,
      input.amount,
      input.method,
      input.status,
      input.providerTopic,
      input.providerAction,
      input.providerPaymentId,
      input.providerSubscriptionId,
      input.providerStatus,
      input.externalReference,
      input.paidAt,
      input.pendingAt,
      JSON.stringify(input.payload),
    ],
  );

  return result.rows[0] ?? null;
}

export class FinanceDomainError extends Error {
  status: number;

  constructor(message: string, status = 400) {
    super(message);
    this.name = "FinanceDomainError";
    this.status = status;
  }
}

export function normalizeFinanceError(error: unknown) {
  if (error instanceof FinanceDomainError) return error;
  if (typeof error === "object" && error !== null && "code" in error && error.code === "23505") {
    return new FinanceDomainError("Já existe uma cobrança com esta fatura.", 409);
  }
  return error;
}

const emptyFinanceSummary: FinanceSummary = {
  monthlyRevenue: 0,
  annualRevenue: 0,
  overdueAmount: 0,
  expectedReceipts: 0,
  paidAmount: 0,
  openAmount: 0,
  delinquentClients: 0,
};
