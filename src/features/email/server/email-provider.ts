import type {
  EmailConfigurationStatus,
  EmailProviderSendInput,
  EmailProviderSendResult,
} from "@/features/email/types";

export interface EmailProvider {
  readonly name: "resend" | "noop";
  send(input: EmailProviderSendInput): Promise<EmailProviderSendResult>;
  validateConfiguration(): Promise<EmailConfigurationStatus>;
}

export class EmailProviderError extends Error {
  constructor(
    message: string,
    public readonly code = "provider_error",
    public readonly retryable = false,
  ) {
    super(message);
    this.name = "EmailProviderError";
  }
}

export function sanitizeProviderError(error: unknown) {
  const raw =
    error instanceof Error
      ? error.message
      : typeof error === "string"
        ? error
        : "Falha desconhecida no provedor de e-mail.";

  return raw
    .replace(/re_[A-Za-z0-9_-]+/g, "[resend-api-key]")
    .replace(/whsec_[A-Za-z0-9_-]+/g, "[webhook-secret]")
    .slice(0, 300);
}

export function classifyProviderError(error: unknown) {
  const message = sanitizeProviderError(error);
  const lower = message.toLowerCase();
  const retryable =
    lower.includes("timeout") ||
    lower.includes("429") ||
    lower.includes("rate") ||
    lower.includes("5xx") ||
    lower.includes("500") ||
    lower.includes("502") ||
    lower.includes("503") ||
    lower.includes("504");

  return new EmailProviderError(
    message,
    retryable ? "temporary_provider_error" : "provider_error",
    retryable,
  );
}
