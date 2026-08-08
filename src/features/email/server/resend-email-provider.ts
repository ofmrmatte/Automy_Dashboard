import { Resend } from "resend";
import {
  classifyProviderError,
  EmailProviderError,
  type EmailProvider,
} from "@/features/email/server/email-provider";
import type {
  EmailConfigurationStatus,
  EmailProviderSendInput,
  EmailProviderSendResult,
} from "@/features/email/types";

type ResendProviderConfig = {
  apiKey: string | null;
  from: string;
  replyTo: string | null;
  appUrl: string;
  siteUrl: string;
  domain: string;
};

export class ResendEmailProvider implements EmailProvider {
  readonly name = "resend" as const;

  constructor(private readonly config: ResendProviderConfig) {}

  private client() {
    if (!this.config.apiKey) {
      throw new EmailProviderError("RESEND_API_KEY não configurada.", "missing_resend_api_key");
    }
    return new Resend(this.config.apiKey);
  }

  async send(input: EmailProviderSendInput): Promise<EmailProviderSendResult> {
    try {
      const result = await this.client().emails.send(
        {
          from: input.from,
          to: input.to,
          subject: input.subject,
          html: input.html,
          text: input.text,
          ...(input.replyTo?.length ? { replyTo: input.replyTo } : {}),
          ...(input.tags?.length ? { tags: input.tags } : {}),
        },
        { idempotencyKey: input.idempotencyKey },
      );

      if (result.error) {
        throw new EmailProviderError(
          result.error.message,
          result.error.name ?? "resend_error",
          false,
        );
      }

      return { providerMessageId: result.data?.id ?? null };
    } catch (error) {
      if (error instanceof EmailProviderError) throw error;
      throw classifyProviderError(error);
    }
  }

  async validateConfiguration(): Promise<EmailConfigurationStatus> {
    if (!this.config.apiKey) {
      return {
        provider: "resend",
        status: "not_configured",
        sender: this.config.from,
        replyTo: this.config.replyTo,
        appUrl: this.config.appUrl,
        siteUrl: this.config.siteUrl,
        domain: this.config.domain,
        message: "RESEND_API_KEY não configurada nas variáveis de ambiente.",
      };
    }

    try {
      const domains = await this.client().domains.list({ limit: 100 });
      const domain = domains.data?.data.find((item) => item.name === this.config.domain);
      const connected = domain?.status === "verified" && domain.capabilities?.sending === "enabled";

      return {
        provider: "resend",
        status: connected ? "connected" : "error",
        sender: this.config.from,
        replyTo: this.config.replyTo,
        appUrl: this.config.appUrl,
        siteUrl: this.config.siteUrl,
        domain: this.config.domain,
        message: connected
          ? "Resend configurado com domínio verificado e envio habilitado."
          : "Resend configurado, mas o domínio não está verificado para envio.",
      };
    } catch (error) {
      const providerError = classifyProviderError(error);
      return {
        provider: "resend",
        status: "error",
        sender: this.config.from,
        replyTo: this.config.replyTo,
        appUrl: this.config.appUrl,
        siteUrl: this.config.siteUrl,
        domain: this.config.domain,
        message: providerError.message,
      };
    }
  }
}
