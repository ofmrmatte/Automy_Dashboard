export type EmailTemplateId =
  | "user-invitation"
  | "password-reset"
  | "password-changed"
  | "contract-ready"
  | "contract-signature-request"
  | "contract-signed"
  | "contract-renewal-reminder"
  | "charge-created"
  | "charge-due-soon"
  | "charge-overdue"
  | "payment-confirmed"
  | "appointment-created"
  | "appointment-reminder"
  | "appointment-rescheduled"
  | "appointment-cancelled"
  | "support-ticket-created"
  | "support-ticket-replied"
  | "support-ticket-status-changed"
  | "support-ticket-closed"
  | "operational-alert"
  | "email-test";

export type EmailDeliveryStatus =
  | "queued"
  | "sent"
  | "delivered"
  | "failed"
  | "bounced"
  | "complained"
  | "cancelled"
  | "suppressed";

export type EmailRelatedEntityType =
  "user" | "client" | "contract" | "charge" | "scheduled_call" | "support_ticket" | "system";

export type TransactionalEmailInput = {
  to: string;
  template: EmailTemplateId;
  data: Record<string, unknown>;
  companyId?: string | null;
  authUserId?: string | null;
  createdBy?: string | null;
  idempotencyKey: string;
  relatedEntityType?: EmailRelatedEntityType;
  relatedEntityId?: string | null;
};

export type RenderedEmail = {
  subject: string;
  preheader: string;
  html: string;
  text: string;
};

export type EmailProviderSendInput = {
  from: string;
  to: string;
  subject: string;
  html: string;
  text: string;
  replyTo?: string[];
  idempotencyKey: string;
  tags?: Array<{ name: string; value: string }>;
};

export type EmailProviderSendResult = {
  providerMessageId: string | null;
};

export type EmailConfigurationStatus = {
  provider: "resend" | "noop";
  status: "connected" | "not_configured" | "error";
  sender: string;
  replyTo: string | null;
  appUrl: string;
  siteUrl: string;
  domain: string;
  message: string;
};
