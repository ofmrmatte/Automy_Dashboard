import { createHash, randomBytes } from "node:crypto";
import type { PoolClient, QueryResultRow } from "pg";
import {
  classifyProviderError,
  EmailProviderError,
  type EmailProvider,
} from "@/features/email/server/email-provider";
import { createEmailRepository } from "@/features/email/server/email.repository";
import { renderEmailTemplate } from "@/features/email/server/email-templates";
import { NoopEmailProvider } from "@/features/email/server/noop-email-provider";
import { ResendEmailProvider } from "@/features/email/server/resend-email-provider";
import type {
  EmailConfigurationStatus,
  EmailTemplateId,
  TransactionalEmailInput,
} from "@/features/email/types";
import { loadLocalServerEnv } from "@/shared/server/env";
import { getRailwayPostgresPool } from "@/shared/server/postgres";

type EmailRuntimeConfig = {
  provider: "resend" | "noop";
  apiKey: string | null;
  from: string;
  replyTo: string | null;
  appUrl: string;
  siteUrl: string;
  domain: string;
};

type Queryable = {
  query: <T extends QueryResultRow = QueryResultRow>(
    sql: string,
    values?: unknown[],
  ) => Promise<{ rows: T[] }>;
};

type UserInvitationInput = {
  companyId: string;
  authUserId: string;
  domainUserId: string;
  roleId: string;
  email: string;
  name: string;
  roleLabel: string;
  companyName: string;
  invitedBy: string;
};

const DEFAULT_FROM = "Automy <noreply@automy.dev.br>";
const DEFAULT_REPLY_TO = "contato@automy.dev.br";
const INVITATION_TTL_HOURS = 48;

function runtimeConfig(): EmailRuntimeConfig {
  loadLocalServerEnv();
  const provider = process.env["EMAIL_PROVIDER"] === "noop" ? "noop" : "resend";
  const appUrl = (
    process.env["EMAIL_APP_URL"] ??
    process.env["BETTER_AUTH_URL"] ??
    "https://app.automy.dev.br"
  )
    .trim()
    .replace(/\/$/, "");
  const siteUrl = (process.env["EMAIL_SITE_URL"] ?? "https://automy.dev.br")
    .trim()
    .replace(/\/$/, "");
  const from = (
    process.env["EMAIL_FROM"] ??
    process.env["RESEND_FROM_EMAIL"] ??
    DEFAULT_FROM
  ).trim();
  const replyTo = (process.env["EMAIL_REPLY_TO"] ?? DEFAULT_REPLY_TO).trim() || null;
  return {
    provider,
    apiKey: process.env["RESEND_API_KEY"]?.trim() || null,
    from,
    replyTo,
    appUrl,
    siteUrl,
    domain: new URL(siteUrl).hostname.replace(/^www\./, ""),
  };
}

function providerFor(config = runtimeConfig()): EmailProvider {
  if (config.provider === "noop") {
    return new NoopEmailProvider(config);
  }
  return new ResendEmailProvider(config);
}

function isValidEmail(value: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

function tokenHash(token: string) {
  return createHash("sha256").update(token).digest("hex");
}

function createToken() {
  return randomBytes(32).toString("base64url");
}

function safeRecipient(value: string) {
  return value.trim().toLowerCase();
}

function fingerprint(value: string) {
  return createHash("sha256").update(value).digest("hex").slice(0, 16);
}

function setupPasswordUrl(token: string, appUrl: string) {
  const url = new URL("/redefinir-senha", appUrl);
  url.searchParams.set("token", token);
  return url.toString();
}

function logEmailEvent(event: string, metadata: Record<string, unknown>) {
  console.info(event, {
    ...metadata,
    html: undefined,
    token: undefined,
    apiKey: undefined,
  });
}

async function delay(ms: number) {
  await new Promise((resolve) => setTimeout(resolve, ms));
}

export async function sendTransactionalEmail(input: TransactionalEmailInput) {
  const config = runtimeConfig();
  const provider = providerFor(config);
  const recipient = safeRecipient(input.to);
  if (!isValidEmail(recipient)) throw new Error("Destinatário de e-mail inválido.");

  const rendered = renderEmailTemplate(input.template, input.data, {
    appUrl: config.appUrl,
    siteUrl: config.siteUrl,
  });
  const repository = createEmailRepository();
  const reserved = await repository.reserve(
    { ...input, to: recipient },
    rendered.subject,
    provider.name,
  );

  if (reserved.status !== "queued" && reserved.status !== "failed") {
    return {
      status: reserved.status,
      id: reserved.id,
      providerMessageId: reserved.provider_message_id,
      skipped: true,
    };
  }

  logEmailEvent("email.send.request", {
    template: input.template,
    idempotencyKey: input.idempotencyKey,
    recipientFingerprint: fingerprint(recipient),
  });

  let lastError: EmailProviderError | null = null;
  for (let attempt = 1; attempt <= 2; attempt += 1) {
    try {
      const providerInput = {
        from: config.from,
        to: recipient,
        subject: rendered.subject,
        html: rendered.html,
        text: rendered.text,
        idempotencyKey: input.idempotencyKey,
        tags: [
          { name: "template", value: input.template },
          {
            name: "env",
            value: process.env["NODE_ENV"] === "production" ? "production" : "development",
          },
        ],
        ...(config.replyTo ? { replyTo: [config.replyTo] } : {}),
      };
      const result = await provider.send(providerInput);
      await repository.markSent(reserved.id, result.providerMessageId);
      logEmailEvent("email.send.success", {
        template: input.template,
        idempotencyKey: input.idempotencyKey,
        providerMessageId: result.providerMessageId,
      });
      return {
        status: "sent" as const,
        id: reserved.id,
        providerMessageId: result.providerMessageId,
        skipped: false,
      };
    } catch (error) {
      lastError = error instanceof EmailProviderError ? error : classifyProviderError(error);
      if (!lastError.retryable || attempt === 2) break;
      await delay(350);
    }
  }

  const failure = lastError ?? new EmailProviderError("Falha desconhecida no envio.");
  await repository.markFailed(reserved.id, failure.code, failure.message);
  logEmailEvent("email.send.failure", {
    template: input.template,
    idempotencyKey: input.idempotencyKey,
    failureCode: failure.code,
  });
  throw failure;
}

export async function validateTransactionalEmailConfiguration(): Promise<EmailConfigurationStatus> {
  return providerFor().validateConfiguration();
}

export async function sendEmailTest(
  to: string,
  name: string,
  authUserId: string,
  companyId: string,
) {
  const allowed = await createEmailRepository().checkRateLimit("email-test", authUserId, 3, 60);
  if (!allowed) throw new Error("Limite de testes de e-mail atingido. Tente novamente mais tarde.");
  return sendTransactionalEmail({
    to,
    template: "email-test",
    data: { firstName: name, name },
    companyId,
    authUserId,
    createdBy: authUserId,
    idempotencyKey: `email-test:${authUserId}:${new Date().toISOString().slice(0, 13)}`,
    relatedEntityType: "system",
  });
}

export async function upsertBetterAuthResetToken(
  db: Queryable,
  authUserId: string,
  token: string,
  expiresAt: Date,
) {
  await db.query(
    `delete from public.verification where identifier like 'reset-password:%' and value = $1`,
    [authUserId],
  );
  await db.query(
    `
      insert into public.verification (identifier, value, "expiresAt", "createdAt", "updatedAt")
      values ($1, $2, $3, now(), now())
    `,
    [`reset-password:${token}`, authUserId, expiresAt],
  );
}

export async function createUserInvitation(
  client: PoolClient,
  input: UserInvitationInput,
): Promise<{ invitationId: string; token: string; expiresAt: Date; version: number }> {
  const token = createToken();
  const hash = tokenHash(token);
  const expiresAt = new Date(Date.now() + INVITATION_TTL_HOURS * 60 * 60 * 1000);

  await client.query(
    `
      update public.user_invitations
      set revoked_at = coalesce(revoked_at, now()),
          updated_at = now(),
          updated_by = $2
      where auth_user_id = $1
        and accepted_at is null
        and revoked_at is null
        and deleted_at is null
    `,
    [input.authUserId, input.invitedBy],
  );

  const previous = await client.query<{ version: number }>(
    `
      select coalesce(max(version), 0)::int as version
      from public.user_invitations
      where auth_user_id = $1
        and deleted_at is null
    `,
    [input.authUserId],
  );
  const version = Number(previous.rows[0]?.version ?? 0) + 1;

  const result = await client.query<{ id: string }>(
    `
      insert into public.user_invitations (
        company_id,
        auth_user_id,
        domain_user_id,
        email,
        role_id,
        token_hash,
        version,
        expires_at,
        invited_by,
        created_by,
        updated_by
      )
      values ($1, $2, $3, lower($4), $5, $6, $7, $8, $9, $9, $9)
      returning id
    `,
    [
      input.companyId,
      input.authUserId,
      input.domainUserId,
      input.email,
      input.roleId,
      hash,
      version,
      expiresAt,
      input.invitedBy,
    ],
  );

  await upsertBetterAuthResetToken(client, input.authUserId, token, expiresAt);

  return {
    invitationId: result.rows[0]?.id ?? "",
    token,
    expiresAt,
    version,
  };
}

export async function sendUserInvitationEmail(input: UserInvitationInput) {
  const pool = await getRailwayPostgresPool();
  const client = await pool.connect();
  let invitation: Awaited<ReturnType<typeof createUserInvitation>>;
  try {
    await client.query("begin");
    invitation = await createUserInvitation(client, input);
    await client.query("commit");
  } catch (error) {
    await client.query("rollback");
    throw error;
  } finally {
    client.release();
  }

  const config = runtimeConfig();
  return sendTransactionalEmail({
    to: input.email,
    template: "user-invitation",
    data: {
      firstName: input.name,
      companyName: input.companyName,
      roleLabel: input.roleLabel,
      expirationDate: invitation.expiresAt.toLocaleString("pt-BR", {
        dateStyle: "short",
        timeStyle: "short",
        timeZone: "America/Sao_Paulo",
      }),
      actionUrl: setupPasswordUrl(invitation.token, config.appUrl),
    },
    companyId: input.companyId,
    authUserId: input.authUserId,
    createdBy: input.invitedBy,
    idempotencyKey: `user-invite:${input.authUserId}:${invitation.version}`,
    relatedEntityType: "user",
    relatedEntityId: input.domainUserId,
  });
}

export async function markInvitationAcceptedByToken(token: string) {
  const hash = tokenHash(token);
  const pool = await getRailwayPostgresPool();
  await pool.query(
    `
      update public.user_invitations
      set accepted_at = coalesce(accepted_at, now()),
          updated_at = now()
      where token_hash = $1
        and accepted_at is null
        and revoked_at is null
        and deleted_at is null
    `,
    [hash],
  );
}

export async function sendPasswordResetEmail(input: {
  to: string;
  name: string;
  resetUrl: string;
  authUserId?: string | null;
}) {
  const url = new URL(input.resetUrl);
  const token = url.searchParams.get("token") ?? fingerprint(input.resetUrl);
  return sendTransactionalEmail({
    to: input.to,
    template: "password-reset",
    data: {
      firstName: input.name,
      actionUrl: input.resetUrl,
      expiresIn: "o prazo definido pela política de segurança da Automy",
    },
    authUserId: input.authUserId ?? null,
    createdBy: input.authUserId ?? null,
    idempotencyKey: `password-reset:${fingerprint(input.to)}:${fingerprint(token)}`,
    relatedEntityType: "user",
  });
}

export async function sendPasswordChangedEmail(input: {
  to: string;
  name: string;
  authUserId: string;
  companyId?: string | null;
  changedAt?: Date;
}) {
  const changedAt = input.changedAt ?? new Date();
  return sendTransactionalEmail({
    to: input.to,
    template: "password-changed",
    data: {
      firstName: input.name,
      dateTime: changedAt.toLocaleString("pt-BR", {
        dateStyle: "short",
        timeStyle: "short",
        timeZone: "America/Sao_Paulo",
      }),
    },
    authUserId: input.authUserId,
    companyId: input.companyId ?? null,
    createdBy: input.authUserId,
    idempotencyKey: `password-changed:${input.authUserId}:${changedAt.toISOString().slice(0, 16)}`,
    relatedEntityType: "user",
  });
}

export async function sendCatalogEmail(
  template: EmailTemplateId,
  input: Omit<TransactionalEmailInput, "template">,
) {
  return sendTransactionalEmail({ ...input, template });
}
