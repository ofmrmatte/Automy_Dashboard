import { sendTransactionalEmail as sendTransactionalEmailService } from "@/features/email/server/transactional-email.service";

export {
  sendCatalogEmail,
  sendEmailTest,
  sendPasswordChangedEmail,
  sendPasswordResetEmail,
  sendUserInvitationEmail,
  upsertBetterAuthResetToken,
  validateTransactionalEmailConfiguration,
} from "@/features/email/server/transactional-email.service";

export { sendTransactionalEmailService as sendTransactionalEmail };

export type { EmailTemplateId, TransactionalEmailInput } from "@/features/email/types";

export async function sendPortalInvitationEmail(input: {
  to: string;
  name: string;
  activationUrl: string;
  companyId?: string | null;
  authUserId?: string | null;
  relatedEntityId?: string | null;
  idempotencyKey?: string;
}) {
  return sendTransactionalEmailService({
    to: input.to,
    template: "user-invitation",
    data: {
      firstName: input.name,
      companyName: "Portal do Cliente Automy",
      roleLabel: "Cliente",
      expirationDate: "48 horas",
      actionUrl: input.activationUrl,
    },
    companyId: input.companyId ?? null,
    authUserId: input.authUserId ?? null,
    createdBy: input.authUserId ?? null,
    idempotencyKey:
      input.idempotencyKey ?? `portal-invite:${input.relatedEntityId ?? input.to}:latest`,
    relatedEntityType: "client",
    relatedEntityId: input.relatedEntityId ?? null,
  });
}
