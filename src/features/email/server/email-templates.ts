import type { EmailTemplateId, RenderedEmail } from "@/features/email/types";

type TemplateConfig = {
  appUrl: string;
  siteUrl: string;
};

type TemplateDefinition = {
  title: string;
  subject: string;
  preheader: string;
  body: string[];
  ctaLabel?: string;
  ctaUrl?: string;
  secondaryCtaLabel?: string;
  secondaryCtaUrl?: string;
  info?: string[];
  securityNotice?: string;
};

const AUTOMY_BLUE = "#2563EB";
const AUTOMY_NAVY = "#0F172A";
const AUTOMY_TEAL = "#14B8A6";
const BACKGROUND = "#F8FAFC";
const BORDER = "#E2E8F0";
const TEXT = "#0F172A";
const MUTED = "#475569";

function escapeHtml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function value(data: Record<string, unknown>, key: string, fallback = "") {
  const item = data[key];
  if (item === null || item === undefined) return fallback;
  const text = String(item).trim();
  return text || fallback;
}

function urlValue(data: Record<string, unknown>, key: string, fallback: string) {
  const raw = value(data, key, fallback);
  try {
    const parsed = new URL(raw);
    return parsed.protocol === "https:" || parsed.hostname === "localhost"
      ? parsed.toString()
      : fallback;
  } catch {
    return fallback;
  }
}

function paragraph(text: string) {
  return `<p style="margin:0 0 14px;font-size:15px;line-height:24px;color:${TEXT};font-family:Arial,Helvetica,sans-serif;">${escapeHtml(text)}</p>`;
}

function textLines(definition: TemplateDefinition) {
  const lines = [definition.title, "", ...definition.body, ""];
  if (definition.ctaLabel && definition.ctaUrl) {
    lines.push(`${definition.ctaLabel}:`, definition.ctaUrl, "");
  }
  if (definition.secondaryCtaLabel && definition.secondaryCtaUrl) {
    lines.push(`${definition.secondaryCtaLabel}:`, definition.secondaryCtaUrl, "");
  }
  if (definition.info?.length) {
    lines.push(...definition.info, "");
  }
  if (definition.securityNotice) {
    lines.push(definition.securityNotice, "");
  }
  lines.push("Automy", "TECNOLOGIA QUE SIMPLIFICA OPERAÇÕES", "https://automy.dev.br");
  return lines.join("\n");
}

function renderLayout(definition: TemplateDefinition, config: TemplateConfig): RenderedEmail {
  const logoUrl = new URL("/automy-logo-horizontal.png", config.appUrl).toString();
  const body = definition.body.map(paragraph).join("");
  const info = definition.info?.length
    ? `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-top:18px;border:1px solid ${BORDER};border-radius:8px;background-color:#F1F5F9;" bgcolor="#F1F5F9"><tr><td style="padding-top:14px;padding-right:16px;padding-bottom:14px;padding-left:16px;">${definition.info
        .map(
          (item) =>
            `<p style="margin:0 0 8px;font-size:13px;line-height:20px;color:${MUTED};font-family:Arial,Helvetica,sans-serif;">${escapeHtml(
              item,
            )}</p>`,
        )
        .join("")}</td></tr></table>`
    : "";
  const security = definition.securityNotice
    ? `<p style="margin:18px 0 0;font-size:13px;line-height:20px;color:${MUTED};font-family:Arial,Helvetica,sans-serif;">${escapeHtml(
        definition.securityNotice,
      )}</p>`
    : "";
  const cta =
    definition.ctaLabel && definition.ctaUrl
      ? `<table role="presentation" cellpadding="0" cellspacing="0" border="0" style="margin-top:22px;margin-bottom:22px;"><tr><td bgcolor="${AUTOMY_BLUE}" style="background-color:${AUTOMY_BLUE};border-radius:8px;padding-top:13px;padding-right:20px;padding-bottom:13px;padding-left:20px;"><a href="${escapeHtml(
          definition.ctaUrl,
        )}" style="font-size:14px;line-height:18px;color:#FFFFFF;text-decoration:none;font-weight:700;font-family:Arial,Helvetica,sans-serif;">${escapeHtml(
          definition.ctaLabel,
        )}</a></td></tr></table>`
      : "";
  const secondary =
    definition.secondaryCtaLabel && definition.secondaryCtaUrl
      ? `<p style="margin:0 0 12px;font-size:13px;line-height:20px;color:${MUTED};font-family:Arial,Helvetica,sans-serif;"><a href="${escapeHtml(
          definition.secondaryCtaUrl,
        )}" style="color:${AUTOMY_BLUE};text-decoration:underline;">${escapeHtml(
          definition.secondaryCtaLabel,
        )}</a></p>`
      : "";

  return {
    subject: definition.subject,
    preheader: definition.preheader,
    html: `<!DOCTYPE html>
<html lang="pt-BR">
  <head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <meta http-equiv="X-UA-Compatible" content="IE=edge">
    <title>${escapeHtml(definition.subject)}</title>
  </head>
  <body style="margin:0;background-color:${BACKGROUND};color:${TEXT};font-family:Arial,Helvetica,sans-serif;" bgcolor="${BACKGROUND}">
    <div style="display:none;max-height:0;overflow:hidden;opacity:0;color:transparent;">${escapeHtml(definition.preheader)}</div>
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" bgcolor="${BACKGROUND}" style="width:100%;background-color:${BACKGROUND};">
      <tr>
        <td align="center" style="padding-top:32px;padding-right:12px;padding-bottom:32px;padding-left:12px;">
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="max-width:600px;width:100%;background-color:#FFFFFF;border:1px solid ${BORDER};border-radius:8px;" bgcolor="#FFFFFF">
            <tr>
              <td bgcolor="${AUTOMY_NAVY}" style="background-color:${AUTOMY_NAVY};padding-top:24px;padding-right:28px;padding-bottom:22px;padding-left:28px;border-top-left-radius:8px;border-top-right-radius:8px;">
                <img src="${escapeHtml(logoUrl)}" width="180" height="42" border="0" alt="Automy" style="display:block;width:180px;height:auto;border:0;margin-bottom:10px;">
                <p style="margin:0;font-size:12px;line-height:16px;color:${AUTOMY_TEAL};font-weight:700;letter-spacing:0;font-family:Arial,Helvetica,sans-serif;">TECNOLOGIA QUE SIMPLIFICA OPERAÇÕES</p>
              </td>
            </tr>
            <tr>
              <td style="padding-top:30px;padding-right:28px;padding-bottom:28px;padding-left:28px;">
                <h1 style="margin:0 0 16px;font-size:22px;line-height:30px;color:${TEXT};font-family:Arial,Helvetica,sans-serif;">${escapeHtml(
                  definition.title,
                )}</h1>
                ${body}
                ${cta}
                ${secondary}
                ${info}
                ${security}
              </td>
            </tr>
            <tr>
              <td style="padding-top:18px;padding-right:28px;padding-bottom:22px;padding-left:28px;border-top:1px solid ${BORDER};">
                <p style="margin:0;font-size:13px;line-height:20px;color:${TEXT};font-weight:700;font-family:Arial,Helvetica,sans-serif;">Automy</p>
                <p style="margin:2px 0 6px;font-size:12px;line-height:18px;color:${MUTED};font-family:Arial,Helvetica,sans-serif;">Tecnologia que simplifica operações</p>
                <p style="margin:0;font-size:12px;line-height:18px;color:${MUTED};font-family:Arial,Helvetica,sans-serif;"><a href="${escapeHtml(
                  config.siteUrl,
                )}" style="color:${AUTOMY_BLUE};text-decoration:underline;">${escapeHtml(
                  config.siteUrl,
                )}</a></p>
                <p style="margin:10px 0 0;font-size:11px;line-height:16px;color:#64748B;font-family:Arial,Helvetica,sans-serif;">Este e-mail foi enviado automaticamente. Não responda a esta mensagem.</p>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>`,
    text: textLines(definition),
  };
}

function templateDefinition(
  template: EmailTemplateId,
  data: Record<string, unknown>,
  config: TemplateConfig,
): TemplateDefinition {
  const appUrl = config.appUrl;
  const firstName = value(data, "firstName", value(data, "name", "Olá")).split(" ")[0];
  const companyName = value(data, "companyName", "Automy");
  const roleLabel = value(data, "roleLabel", "Usuário");
  const contract = value(data, "contractName", value(data, "contract", "Contrato Automy"));
  const client = value(data, "clientName", companyName);
  const actionUrl = urlValue(data, "actionUrl", appUrl);

  const definitions: Record<EmailTemplateId, TemplateDefinition> = {
    "user-invitation": {
      title: "Você foi convidado para acessar a Automy",
      subject: "Você foi convidado para acessar a Automy",
      preheader: "Defina sua senha para acessar a plataforma Automy.",
      body: [
        `Olá, ${firstName}.`,
        "Você recebeu acesso à plataforma Automy.",
        `Empresa: ${companyName}.`,
        `Perfil: ${roleLabel}.`,
      ],
      ctaLabel: "Definir minha senha e acessar",
      ctaUrl: actionUrl,
      info: [`Este convite é válido até ${value(data, "expirationDate", "a data informada")}.`],
      securityNotice: "Se você não esperava receber este convite, ignore esta mensagem.",
    },
    "password-reset": {
      title: "Redefinição de senha da Automy",
      subject: "Redefinição de senha da Automy",
      preheader: "Use o link seguro para redefinir sua senha.",
      body: [
        `Olá, ${firstName}.`,
        "Recebemos uma solicitação para redefinir sua senha de acesso Automy.",
      ],
      ctaLabel: "Redefinir senha",
      ctaUrl: actionUrl,
      info: [`Validade do link: ${value(data, "expiresIn", "período informado na tela")}.`],
      securityNotice:
        "Se você não solicitou a redefinição, ignore este e-mail ou entre em contato com a Automy por um canal seguro.",
    },
    "password-changed": {
      title: "Sua senha da Automy foi alterada",
      subject: "Sua senha da Automy foi alterada",
      preheader: "Aviso de segurança sobre alteração de senha.",
      body: [
        `Olá, ${firstName}.`,
        `A senha da sua conta foi alterada em ${value(data, "dateTime", "data registrada")}.`,
      ],
      securityNotice:
        "Se você não reconhece esta alteração, entre em contato com a Automy imediatamente por um canal seguro.",
    },
    "contract-ready": {
      title: "Contrato pronto para revisão",
      subject: "Contrato pronto para revisão",
      preheader: "Um contrato está pronto para revisão interna.",
      body: [`Cliente: ${client}.`, `Contrato: ${contract}.`, "Revise os dados antes do envio."],
      ctaLabel: "Abrir contrato",
      ctaUrl: actionUrl,
    },
    "contract-signature-request": {
      title: "Contrato disponível para assinatura",
      subject: "Contrato disponível para assinatura",
      preheader: "Acesse o link seguro para assinar o contrato.",
      body: [
        `Empresa: ${client}.`,
        `Contrato: ${contract}.`,
        `Produto ou plano: ${value(data, "productName", "Serviço Automy")}.`,
        `Responsável: ${value(data, "ownerName", "Automy")}.`,
      ],
      ctaLabel: "Assinar contrato",
      ctaUrl: actionUrl,
      securityNotice: "Use somente o link seguro deste e-mail para prosseguir com a assinatura.",
    },
    "contract-signed": {
      title: "Contrato assinado",
      subject: "Contrato assinado",
      preheader: "Um contrato foi assinado e está disponível para consulta.",
      body: [
        `Contrato: ${contract}.`,
        `Partes: ${value(data, "parties", client)}.`,
        `Data: ${value(data, "signedAt", "data registrada")}.`,
        `Versão: ${value(data, "version", "oficial")}.`,
        `Status: ${value(data, "status", "Assinado")}.`,
      ],
      ctaLabel: "Visualizar contrato",
      ctaUrl: actionUrl,
    },
    "contract-renewal-reminder": {
      title: "Lembrete de vencimento e renovação",
      subject: "Lembrete de renovação de contrato",
      preheader: "Há um contrato próximo do vencimento ou renovação.",
      body: [
        `Cliente: ${client}.`,
        `Contrato: ${contract}.`,
        `Data: ${value(data, "date", "data informada")}.`,
        `Permanência: ${value(data, "minimumTerm", "não informada")}.`,
        `Próxima renovação: ${value(data, "renewalDate", "não informada")}.`,
        `Responsável: ${value(data, "ownerName", "Automy")}.`,
      ],
      ctaLabel: "Abrir contrato",
      ctaUrl: actionUrl,
    },
    "charge-created": chargeTemplate("Nova cobrança emitida", "Cobrança emitida", data, actionUrl),
    "charge-due-soon": chargeTemplate(
      "Cobrança próxima do vencimento",
      "Cobrança próxima do vencimento",
      data,
      actionUrl,
    ),
    "charge-overdue": chargeTemplate("Cobrança vencida", "Cobrança vencida", data, actionUrl),
    "payment-confirmed": chargeTemplate(
      "Pagamento confirmado",
      "Pagamento confirmado",
      data,
      actionUrl,
    ),
    "appointment-created": appointmentTemplate("Agendamento criado", data, actionUrl),
    "appointment-reminder": appointmentTemplate("Lembrete de agendamento", data, actionUrl),
    "appointment-rescheduled": appointmentTemplate("Agendamento remarcado", data, actionUrl),
    "appointment-cancelled": appointmentTemplate("Agendamento cancelado", data, actionUrl),
    "support-ticket-created": supportTemplate("Chamado criado", data, actionUrl),
    "support-ticket-replied": supportTemplate("Nova resposta no chamado", data, actionUrl),
    "support-ticket-status-changed": supportTemplate(
      "Status do chamado atualizado",
      data,
      actionUrl,
    ),
    "support-ticket-closed": supportTemplate("Chamado encerrado", data, actionUrl),
    "operational-alert": {
      title: value(data, "title", "Alerta operacional"),
      subject: value(data, "subject", "Alerta operacional Automy"),
      preheader: value(data, "preheader", "Há uma notificação operacional importante."),
      body: [value(data, "message", "Há uma notificação operacional importante na Automy.")],
      ctaLabel: value(data, "ctaLabel", "Abrir Automy"),
      ctaUrl: actionUrl,
      info: [`Classificação: ${value(data, "severity", "important")}.`],
    },
    "email-test": {
      title: "Teste de e-mail transacional Automy",
      subject: "Teste de e-mail transacional Automy",
      preheader: "O envio transacional da Automy está operacional.",
      body: [
        `Olá, ${firstName}.`,
        "Este é um e-mail de teste enviado pelo painel de integrações da Automy.",
        "A configuração foi validada sem expor chaves ou segredos ao navegador.",
      ],
      ctaLabel: "Abrir Automy",
      ctaUrl: appUrl,
    },
  };

  return definitions[template];
}

function chargeTemplate(
  title: string,
  subject: string,
  data: Record<string, unknown>,
  actionUrl: string,
): TemplateDefinition {
  return {
    title,
    subject,
    preheader: "Informação financeira importante da Automy.",
    body: [
      `Cliente: ${value(data, "clientName", "cliente")}.`,
      `Referência: ${value(data, "reference", "cobrança")}.`,
      `Valor: ${value(data, "amount", "não informado")}.`,
      `Vencimento: ${value(data, "dueDate", "não informado")}.`,
      `Status: ${value(data, "status", "informado no financeiro")}.`,
    ],
    ctaLabel: "Abrir financeiro",
    ctaUrl: actionUrl,
  };
}

function appointmentTemplate(
  title: string,
  data: Record<string, unknown>,
  actionUrl: string,
): TemplateDefinition {
  return {
    title,
    subject: title,
    preheader: "Informação de agenda da Automy.",
    body: [
      `Data: ${value(data, "date", "data informada")}.`,
      `Horário: ${value(data, "time", "horário informado")}.`,
      `Timezone: ${value(data, "timezone", "America/Sao_Paulo")}.`,
      `Responsável: ${value(data, "ownerName", "Automy")}.`,
      `Local ou link: ${value(data, "location", "informado no agendamento")}.`,
      `Observação: ${value(data, "note", "sem observações")}.`,
    ],
    ctaLabel: "Abrir agenda",
    ctaUrl: actionUrl,
  };
}

function supportTemplate(
  title: string,
  data: Record<string, unknown>,
  actionUrl: string,
): TemplateDefinition {
  return {
    title,
    subject: title,
    preheader: "Atualização de suporte Automy.",
    body: [
      `Chamado: ${value(data, "ticketNumber", "não informado")}.`,
      `Assunto: ${value(data, "subject", "não informado")}.`,
      `Status: ${value(data, "status", "não informado")}.`,
    ],
    ctaLabel: "Abrir chamado",
    ctaUrl: actionUrl,
  };
}

export function renderEmailTemplate(
  template: EmailTemplateId,
  data: Record<string, unknown>,
  config: TemplateConfig,
) {
  return renderLayout(templateDefinition(template, data, config), config);
}
