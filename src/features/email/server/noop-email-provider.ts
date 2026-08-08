import type { EmailProvider } from "@/features/email/server/email-provider";
import type {
  EmailConfigurationStatus,
  EmailProviderSendInput,
  EmailProviderSendResult,
} from "@/features/email/types";

type NoopConfig = {
  from: string;
  replyTo: string | null;
  appUrl: string;
  siteUrl: string;
  domain: string;
};

export class NoopEmailProvider implements EmailProvider {
  readonly name = "noop" as const;

  constructor(private readonly config: NoopConfig) {}

  async send(input: EmailProviderSendInput): Promise<EmailProviderSendResult> {
    if (process.env["NODE_ENV"] === "production") {
      throw new Error("NoopEmailProvider não pode enviar em produção.");
    }
    console.info("email.noop.skipped", {
      template: input.tags?.find((tag) => tag.name === "template")?.value,
      idempotencyKey: input.idempotencyKey,
    });
    return { providerMessageId: `noop_${input.idempotencyKey}` };
  }

  async validateConfiguration(): Promise<EmailConfigurationStatus> {
    return {
      provider: "noop",
      status: process.env["NODE_ENV"] === "production" ? "error" : "connected",
      sender: this.config.from,
      replyTo: this.config.replyTo,
      appUrl: this.config.appUrl,
      siteUrl: this.config.siteUrl,
      domain: this.config.domain,
      message:
        process.env["NODE_ENV"] === "production"
          ? "Provider noop bloqueado em produção."
          : "Provider noop ativo apenas para desenvolvimento controlado.",
    };
  }
}
