import type { PoolClient, QueryResultRow } from "pg";
import type { EmailDeliveryStatus, TransactionalEmailInput } from "@/features/email/types";
import { getRailwayPostgresPool, isRailwayPostgresConfigured } from "@/shared/server/postgres";

type EmailRow = QueryResultRow & {
  id: string;
  status: EmailDeliveryStatus;
  provider_message_id: string | null;
};

type Queryable = {
  query: <T extends QueryResultRow = QueryResultRow>(
    sql: string,
    values?: unknown[],
  ) => Promise<{ rows: T[] }>;
};

type ConnectableQueryable = Queryable & {
  connect: () => Promise<PoolClient>;
};

export type EmailRepository = {
  reserve(input: TransactionalEmailInput, subject: string, provider: string): Promise<EmailRow>;
  markSent(id: string, providerMessageId: string | null): Promise<void>;
  markFailed(id: string, code: string, message: string): Promise<void>;
  recordWebhookEvent(input: {
    providerEventId: string;
    providerMessageId: string | null;
    eventType: string;
    payload: Record<string, unknown>;
    occurredAt: string | null;
    status: EmailDeliveryStatus | null;
  }): Promise<"processed" | "duplicate">;
  checkRateLimit(
    scope: string,
    identifier: string,
    limit: number,
    windowMinutes: number,
  ): Promise<boolean>;
};

function asNullableUuid(value: string | null | undefined) {
  return value &&
    /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value)
    ? value
    : null;
}

function hasConnect(value: Queryable): value is ConnectableQueryable {
  return typeof (value as { connect?: unknown }).connect === "function";
}

async function getDb(): Promise<Queryable> {
  if (!isRailwayPostgresConfigured()) {
    throw new Error("Banco Railway não configurado para logs de e-mail.");
  }
  return getRailwayPostgresPool();
}

export function createEmailRepository(dbOverride?: Queryable): EmailRepository {
  async function db() {
    return dbOverride ?? getDb();
  }

  return {
    reserve: async (input, subject, provider) => {
      const database = await db();
      const result = await database.query<EmailRow>(
        `
          insert into public.transactional_emails (
            company_id,
            auth_user_id,
            recipient,
            template,
            subject,
            provider,
            status,
            idempotency_key,
            related_entity_type,
            related_entity_id,
            created_by,
            updated_by
          )
          values ($1, $2, $3, $4, $5, $6, 'queued', $7, $8, $9, $10, $10)
          on conflict (idempotency_key) where deleted_at is null
          do update set updated_at = public.transactional_emails.updated_at
          returning id, status, provider_message_id
        `,
        [
          asNullableUuid(input.companyId),
          asNullableUuid(input.authUserId),
          input.to.trim().toLowerCase(),
          input.template,
          subject,
          provider,
          input.idempotencyKey,
          input.relatedEntityType ?? null,
          asNullableUuid(input.relatedEntityId),
          asNullableUuid(input.createdBy),
        ],
      );

      const row = result.rows[0];
      if (!row) throw new Error("Não foi possível reservar log transacional de e-mail.");
      return row;
    },

    markSent: async (id, providerMessageId) => {
      const database = await db();
      await database.query(
        `
          update public.transactional_emails
          set status = 'sent',
              provider_message_id = $2,
              sent_at = coalesce(sent_at, now()),
              failure_code = null,
              failure_message_safe = null,
              failed_at = null,
              updated_at = now()
          where id = $1
        `,
        [id, providerMessageId],
      );
    },

    markFailed: async (id, code, message) => {
      const database = await db();
      await database.query(
        `
          update public.transactional_emails
          set status = 'failed',
              failure_code = $2,
              failure_message_safe = $3,
              failed_at = now(),
              updated_at = now()
          where id = $1
        `,
        [id, code, message],
      );
    },

    recordWebhookEvent: async (input) => {
      const database = await db();
      const client = hasConnect(database) ? await database.connect() : null;
      const connection = client ?? database;
      try {
        if (client) await client.query("begin");
        const event = await connection.query<{ id: string }>(
          `
            insert into public.transactional_email_events (
              email_id,
              provider,
              provider_event_id,
              provider_message_id,
              event_type,
              payload,
              occurred_at
            )
            select email.id, 'resend', $1, $2, $3, $4, $5
            from public.transactional_emails email
            where email.provider_message_id = $2
              and email.deleted_at is null
            order by email.created_at desc
            limit 1
            on conflict (provider, provider_event_id) do nothing
            returning id
          `,
          [
            input.providerEventId,
            input.providerMessageId,
            input.eventType,
            JSON.stringify(input.payload),
            input.occurredAt,
          ],
        );
        if (!event.rows[0]) {
          if (client) await client.query("commit");
          return "duplicate";
        }

        if (input.status && input.providerMessageId) {
          await connection.query(
            `
              update public.transactional_emails
              set status = $2,
                  delivered_at = case when $2 = 'delivered' then coalesce(delivered_at, now()) else delivered_at end,
                  failed_at = case when $2 in ('failed', 'bounced', 'complained', 'suppressed') then coalesce(failed_at, now()) else failed_at end,
                  updated_at = now()
              where provider_message_id = $1
                and deleted_at is null
            `,
            [input.providerMessageId, input.status],
          );
        }
        if (client) await client.query("commit");
        return "processed";
      } catch (error) {
        if (client) await client.query("rollback");
        throw error;
      } finally {
        client?.release();
      }
    },

    checkRateLimit: async (scope, identifier, limit, windowMinutes) => {
      const database = await db();
      const result = await database.query<{ attempts: number }>(
        `
          insert into public.email_rate_limits (scope, identifier, window_start, attempts)
          values (
            $1,
            $2,
            date_trunc('minute', now()) - make_interval(mins => mod(extract(minute from now())::int, $3::int)),
            1
          )
          on conflict (scope, identifier, window_start)
          do update set attempts = public.email_rate_limits.attempts + 1,
                        updated_at = now()
          returning attempts
        `,
        [scope, identifier, windowMinutes],
      );
      return Number(result.rows[0]?.attempts ?? 0) <= limit;
    },
  };
}
