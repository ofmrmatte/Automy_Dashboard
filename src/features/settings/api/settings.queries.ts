import { queryOptions } from "@tanstack/react-query";
import { settingsService } from "@/features/settings/services/settings.service";

export const settingsQueryKeys = {
  company: ["settings", "company"] as const,
  security: ["settings", "security"] as const,
  integrations: ["settings", "integrations"] as const,
  notificationSettings: ["settings", "notifications"] as const,
  notifications: ["notifications"] as const,
};

export function companySettingsQueryOptions() {
  return queryOptions({
    queryKey: settingsQueryKeys.company,
    queryFn: () => settingsService.getCompany(),
    enabled: typeof window !== "undefined",
  });
}

export function securitySettingsQueryOptions() {
  return queryOptions({
    queryKey: settingsQueryKeys.security,
    queryFn: () => settingsService.getSecurity(),
    enabled: typeof window !== "undefined",
  });
}

export function integrationsSettingsQueryOptions() {
  return queryOptions({
    queryKey: settingsQueryKeys.integrations,
    queryFn: () => settingsService.listIntegrations(),
    enabled: typeof window !== "undefined",
  });
}

export function notificationSettingsQueryOptions() {
  return queryOptions({
    queryKey: settingsQueryKeys.notificationSettings,
    queryFn: () => settingsService.getNotificationSettings(),
    enabled: typeof window !== "undefined",
  });
}

export function notificationsQueryOptions() {
  return queryOptions({
    queryKey: settingsQueryKeys.notifications,
    queryFn: () => settingsService.listNotifications(),
    enabled: typeof window !== "undefined",
    refetchInterval: 60_000,
  });
}
