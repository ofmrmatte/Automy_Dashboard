import { settingsRepository } from "@/features/settings/repositories/settings.repository";
import type { CompanyIntegration } from "@/features/settings/types";

export const settingsService = {
  getCompany: () => settingsRepository.getCompany(),
  updateCompany: settingsRepository.updateCompany,
  getSecurity: () => settingsRepository.getSecurity(),
  updateSecurity: settingsRepository.updateSecurity,
  listIntegrations: () => settingsRepository.listIntegrations(),
  updateIntegration: settingsRepository.updateIntegration,
  testIntegration: settingsRepository.testIntegration,
  getNotificationSettings: () => settingsRepository.getNotificationSettings(),
  updateNotificationSettings: settingsRepository.updateNotificationSettings,
  listNotifications: () => settingsRepository.listNotifications(),
  markNotificationRead: settingsRepository.markNotificationRead,
  markAllNotificationsRead: settingsRepository.markAllNotificationsRead,
  integrationStatusLabel: (status: CompanyIntegration["status"]) =>
    ({
      connected: "Conectado",
      disconnected: "Desconectado",
      not_configured: "Não configurado",
      error: "Erro",
      pending: "Pendente",
    })[status],
};
