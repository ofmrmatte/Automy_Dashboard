import { loadLocalServerEnv } from "@/shared/server/env";

type PortalInvitationEmailInput = {
  to: string;
  name: string;
  activationUrl: string;
};

type PasswordResetEmailInput = {
  to: string;
  name: string;
  resetUrl: string;
};

type EmailMessage = {
  to: string;
  subject: string;
  html: string;
  text: string;
};

const RESEND_ENDPOINT = "https://api.resend.com/emails";
const DEFAULT_FROM_EMAIL = "Automy <acesso@automy.dev.br>";

function escapeHtml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function resendConfig() {
  loadLocalServerEnv();

  const apiKey = process.env["RESEND_API_KEY"]?.trim();
  const from = process.env["RESEND_FROM_EMAIL"]?.trim() || DEFAULT_FROM_EMAIL;
  if (!apiKey) {
    throw new Error("RESEND_API_KEY nao configurada.");
  }

  return { apiKey, from };
}

function portalInvitationTemplate(input: PortalInvitationEmailInput): EmailMessage {
  const name = escapeHtml(input.name);
  const activationUrl = escapeHtml(input.activationUrl);

  return {
    to: input.to,
    subject: "Seu acesso ao Portal do Cliente Automy está pronto",
    html: `<!doctype html>
<html lang="pt-BR">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>Portal do Cliente Automy</title>
  </head>
  <body style="margin:0;background:#F8FAFC;color:#0F172A;font-family:Arial,Helvetica,sans-serif;">
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:#F8FAFC;padding:32px 12px;">
      <tr>
        <td align="center">
          <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width:560px;background:#FFFFFF;border:1px solid #E2E8F0;border-radius:12px;overflow:hidden;">
            <tr>
              <td style="background:#0F172A;padding:26px 28px;">
                <div style="font-size:22px;font-weight:700;color:#FFFFFF;">Automy</div>
                <div style="margin-top:6px;color:#14B8A6;font-size:12px;font-weight:700;letter-spacing:.08em;">TECNOLOGIA QUE SIMPLIFICA OPERAÇÕES</div>
              </td>
            </tr>
            <tr>
              <td style="padding:30px 28px;">
                <h1 style="margin:0 0 16px;font-size:22px;line-height:1.3;color:#0F172A;">Seu acesso ao Portal do Cliente está pronto</h1>
                <p style="margin:0 0 14px;font-size:15px;line-height:1.6;">Olá, ${name}.</p>
                <p style="margin:0 0 14px;font-size:15px;line-height:1.6;">Seu acesso ao Portal do Cliente Automy foi criado.</p>
                <p style="margin:0 0 24px;font-size:15px;line-height:1.6;">Por meio do Portal você poderá acompanhar seus contratos, financeiro e chamados de atendimento.</p>
                <p style="margin:0 0 28px;">
                  <a href="${activationUrl}" style="display:inline-block;background:#2563EB;color:#FFFFFF;text-decoration:none;font-weight:700;font-size:14px;border-radius:8px;padding:13px 20px;">ATIVAR MEU ACESSO</a>
                </p>
                <p style="margin:0 0 12px;font-size:13px;line-height:1.6;color:#475569;">Este link é válido por 48 horas.</p>
                <p style="margin:0;font-size:13px;line-height:1.6;color:#475569;">Caso você não reconheça esta solicitação, entre em contato com a Automy.</p>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>`,
    text: `Olá, ${input.name}.

Seu acesso ao Portal do Cliente Automy foi criado.

Por meio do Portal você poderá acompanhar seus contratos, financeiro e chamados de atendimento.

Para ativar sua conta e definir sua senha, acesse:
${input.activationUrl}

Este link é válido por 48 horas.

Caso você não reconheça esta solicitação, entre em contato com a Automy.

Automy
TECNOLOGIA QUE SIMPLIFICA OPERAÇÕES`,
  };
}

export async function sendTransactionalEmail(message: EmailMessage) {
  const { apiKey, from } = resendConfig();

  const response = await fetch(RESEND_ENDPOINT, {
    method: "POST",
    headers: {
      authorization: `Bearer ${apiKey}`,
      "content-type": "application/json",
    },
    body: JSON.stringify({
      from,
      to: [message.to],
      subject: message.subject,
      html: message.html,
      text: message.text,
    }),
  });

  if (!response.ok) {
    const payload = (await response.json().catch(() => null)) as { message?: string } | null;
    throw new Error(payload?.message ?? `Resend retornou HTTP ${response.status}.`);
  }

  return response.json() as Promise<{ id?: string }>;
}

export async function sendPortalInvitationEmail(input: PortalInvitationEmailInput) {
  return sendTransactionalEmail(portalInvitationTemplate(input));
}

export async function sendPasswordResetEmail(input: PasswordResetEmailInput) {
  const name = escapeHtml(input.name);
  const resetUrl = escapeHtml(input.resetUrl);

  return sendTransactionalEmail({
    to: input.to,
    subject: "Redefinição de senha Automy",
    html: `<!doctype html>
<html lang="pt-BR">
  <body style="margin:0;background:#F8FAFC;color:#0F172A;font-family:Arial,Helvetica,sans-serif;">
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:#F8FAFC;padding:32px 12px;">
      <tr>
        <td align="center">
          <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width:560px;background:#FFFFFF;border:1px solid #E2E8F0;border-radius:12px;overflow:hidden;">
            <tr><td style="background:#0F172A;padding:26px 28px;"><div style="font-size:22px;font-weight:700;color:#FFFFFF;">Automy</div><div style="margin-top:6px;color:#14B8A6;font-size:12px;font-weight:700;letter-spacing:.08em;">TECNOLOGIA QUE SIMPLIFICA OPERAÇÕES</div></td></tr>
            <tr>
              <td style="padding:30px 28px;">
                <h1 style="margin:0 0 16px;font-size:22px;line-height:1.3;color:#0F172A;">Redefina sua senha</h1>
                <p style="margin:0 0 14px;font-size:15px;line-height:1.6;">Olá, ${name}.</p>
                <p style="margin:0 0 24px;font-size:15px;line-height:1.6;">Recebemos uma solicitação para redefinir sua senha de acesso Automy.</p>
                <p style="margin:0 0 28px;"><a href="${resetUrl}" style="display:inline-block;background:#2563EB;color:#FFFFFF;text-decoration:none;font-weight:700;font-size:14px;border-radius:8px;padding:13px 20px;">REDEFINIR SENHA</a></p>
                <p style="margin:0;font-size:13px;line-height:1.6;color:#475569;">Caso você não tenha solicitado esta alteração, ignore este e-mail ou entre em contato com a Automy.</p>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>`,
    text: `Olá, ${input.name}.

Recebemos uma solicitação para redefinir sua senha de acesso Automy.

Redefina sua senha pelo link:
${input.resetUrl}

Caso você não tenha solicitado esta alteração, ignore este e-mail ou entre em contato com a Automy.

Automy
TECNOLOGIA QUE SIMPLIFICA OPERAÇÕES`,
  });
}
