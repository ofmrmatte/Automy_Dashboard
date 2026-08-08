import type {
  CompanyIntegration,
  CompanySettings,
  CompanySettingsPayload,
  IntegrationTestResult,
  IntegrationUpdatePayload,
  NotificationsPayload,
  NotificationsSettings,
  NotificationsSettingsPayload,
  SecuritySettings,
  SecuritySettingsPayload,
  SettingsAccess,
} from "@/features/settings/types";
import { RepositoryError } from "@/shared/api/errors";

async function parseApiError(response: Response, fallback: string) {
  const payload = (await response.json().catch(() => null)) as { error?: string } | null;
  return new RepositoryError(payload?.error ?? fallback);
}

async function apiRequest<T>(
  path: string,
  init?: RequestInit,
  fallback = "Não foi possível carregar.",
) {
  const response = await fetch(path, {
    credentials: "include",
    ...init,
    headers: {
      ...(init?.body ? { "content-type": "application/json" } : {}),
      ...init?.headers,
    },
  });
  if (!response.ok) throw await parseApiError(response, fallback);
  return (await response.json()) as T;
}

export const settingsRepository = {
  getCompany: async () =>
    apiRequest<{ company: CompanySettings; access: SettingsAccess }>(
      "/api/settings/company",
      undefined,
      "Não foi possível carregar a empresa.",
    ),

  updateCompany: async (payload: CompanySettingsPayload) =>
    apiRequest<{ company: CompanySettings }>(
      "/api/settings/company",
      { method: "PATCH", body: JSON.stringify(payload) },
      "Não foi possível salvar a empresa.",
    ),

  getSecurity: async () =>
    apiRequest<{ security: SecuritySettings }>(
      "/api/settings/security",
      undefined,
      "Não foi possível carregar segurança.",
    ),

  updateSecurity: async (payload: SecuritySettingsPayload) =>
    apiRequest<{ policy: SecuritySettings["policy"] }>(
      "/api/settings/security",
      { method: "PATCH", body: JSON.stringify(payload) },
      "Não foi possível salvar segurança.",
    ),

  listIntegrations: async () =>
    apiRequest<{ integrations: CompanyIntegration[]; access: SettingsAccess }>(
      "/api/settings/integrations",
      undefined,
      "Não foi possível carregar integrações.",
    ),

  updateIntegration: async (
    provider: CompanyIntegration["provider"],
    payload: IntegrationUpdatePayload,
  ) =>
    apiRequest<{ integration: CompanyIntegration }>(
      `/api/settings/integrations/${provider}`,
      { method: "PATCH", body: JSON.stringify(payload) },
      "Não foi possível salvar integração.",
    ),

  testIntegration: async (provider: CompanyIntegration["provider"]) =>
    apiRequest<{ result: IntegrationTestResult }>(
      `/api/settings/integrations/${provider}/test`,
      { method: "POST" },
      "Não foi possível testar integração.",
    ),

  sendIntegrationTestEmail: async (provider: CompanyIntegration["provider"]) =>
    apiRequest<{ result: IntegrationTestResult }>(
      `/api/settings/integrations/${provider}/test-email`,
      { method: "POST" },
      "Não foi possível enviar e-mail de teste.",
    ),

  getNotificationSettings: async () =>
    apiRequest<{ notifications: NotificationsSettings }>(
      "/api/settings/notifications",
      undefined,
      "Não foi possível carregar notificações.",
    ),

  updateNotificationSettings: async (payload: NotificationsSettingsPayload) =>
    apiRequest<{ notifications: NotificationsSettings }>(
      "/api/settings/notifications",
      { method: "PATCH", body: JSON.stringify(payload) },
      "Não foi possível salvar notificações.",
    ),

  listNotifications: async () =>
    apiRequest<NotificationsPayload>(
      "/api/notifications",
      undefined,
      "Não foi possível carregar notificações.",
    ),

  markNotificationRead: async (id: string) =>
    apiRequest<{ ok: boolean }>(
      `/api/notifications/${encodeURIComponent(id)}/read`,
      { method: "PATCH" },
      "Não foi possível marcar como lida.",
    ),

  archiveNotification: async (id: string) =>
    apiRequest<{ ok: boolean }>(
      `/api/notifications/${encodeURIComponent(id)}/archive`,
      { method: "PATCH" },
      "Não foi possível arquivar a notificação.",
    ),

  markAllNotificationsRead: async () =>
    apiRequest<{ ok: boolean }>(
      "/api/notifications/read-all",
      { method: "POST" },
      "Não foi possível marcar todas como lidas.",
    ),
};
