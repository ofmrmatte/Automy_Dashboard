import type { Charge } from "@/features/finance/types";
import { getRailwayPostgresPool, isRailwayPostgresConfigured } from "@/shared/server/postgres";

type ChargeRow = {
  id: string;
  invoice: string;
  client_name: string;
  due_date: string | null;
  amount: string | number | null;
  method: string;
  status: Charge["status"];
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
  status: Charge["status"];
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

export function isFinanceDatabaseConfigured() {
  return isRailwayPostgresConfigured();
}

async function ensureFinanceSchema() {
  if (!isFinanceDatabaseConfigured()) return;

  const db = await getRailwayPostgresPool();
  await db.query(`
    create extension if not exists pgcrypto;

    create table if not exists public.charges (
      id uuid primary key default gen_random_uuid(),
      company_id uuid,
      contract_id uuid,
      client_id uuid,
      invoice text not null,
      client_name text not null default '',
      due_date date,
      amount numeric(14, 2) not null default 0,
      method text not null default 'Mercado Pago',
      status text not null default 'Pendente',
      provider text not null,
      provider_topic text,
      provider_action text,
      provider_payment_id text not null,
      provider_subscription_id text,
      provider_status text,
      external_reference text,
      paid_at timestamptz,
      pending_at timestamptz,
      last_notification_at timestamptz not null default now(),
      payload jsonb not null default '{}'::jsonb,
      created_at timestamptz not null default now(),
      updated_at timestamptz not null default now(),
      deleted_at timestamptz,
      created_by uuid,
      updated_by uuid,
      unique (provider, provider_payment_id)
    );

    create index if not exists charges_due_date_idx
      on public.charges (due_date)
      where deleted_at is null;
  `);
}

function mapCharge(row: ChargeRow): Charge {
  return {
    id: row.id,
    invoice: row.invoice,
    client: row.client_name,
    due: row.due_date ?? "-",
    value: new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(Number(row.amount ?? 0)),
    method: row.method,
    status: row.status,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    deletedAt: row.deleted_at,
    createdBy: row.created_by,
    updatedBy: row.updated_by,
  };
}

export async function listFinanceCharges() {
  if (!isFinanceDatabaseConfigured()) return [];

  await ensureFinanceSchema();
  const db = await getRailwayPostgresPool();
  const result = await db.query<ChargeRow>(`
    select
      id,
      invoice,
      client_name,
      due_date,
      amount,
      method,
      status,
      created_at,
      updated_at,
      deleted_at,
      created_by,
      updated_by
    from public.charges
    where deleted_at is null
    order by due_date nulls last, last_notification_at desc
    limit 200
  `);

  return result.rows.map(mapCharge);
}

export async function upsertMercadoPagoCharge(input: ChargeUpsertInput) {
  await ensureFinanceSchema();
  const db = await getRailwayPostgresPool();

  await db.query(
    `
      insert into public.charges (
        invoice,
        client_name,
        due_date,
        amount,
        method,
        status,
        provider,
        provider_topic,
        provider_action,
        provider_payment_id,
        provider_subscription_id,
        provider_status,
        external_reference,
        paid_at,
        pending_at,
        last_notification_at,
        payload
      )
      values (
        $1, $2, $3, $4, $5, $6, 'mercado_pago', $7, $8, $9, $10, $11, $12, $13, $14, now(), $15
      )
      on conflict (provider, provider_payment_id)
      do update set
        invoice = excluded.invoice,
        client_name = excluded.client_name,
        due_date = excluded.due_date,
        amount = excluded.amount,
        method = excluded.method,
        status = excluded.status,
        provider_topic = excluded.provider_topic,
        provider_action = excluded.provider_action,
        provider_subscription_id = excluded.provider_subscription_id,
        provider_status = excluded.provider_status,
        external_reference = excluded.external_reference,
        paid_at = excluded.paid_at,
        pending_at = excluded.pending_at,
        last_notification_at = now(),
        payload = excluded.payload
    `,
    [
      input.invoice,
      input.clientName,
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
}
