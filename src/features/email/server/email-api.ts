import { z } from "zod";
import { markInvitationAcceptedByToken } from "@/features/email/server/transactional-email.service";
import { jsonResponse } from "@/shared/server/authz";

const invitationAcceptedSchema = z.object({
  token: z.string().trim().min(20),
});

export async function handleEmailApiRequest(request: Request) {
  const url = new URL(request.url);
  if (url.pathname !== "/api/email/invitations/accepted") return null;
  if (request.method !== "POST") {
    return jsonResponse({ error: "Método não permitido." }, { status: 405 });
  }

  const parsed = invitationAcceptedSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return jsonResponse({ error: "Convite inválido." }, { status: 400 });
  }

  await markInvitationAcceptedByToken(parsed.data.token);
  return jsonResponse({ ok: true });
}
