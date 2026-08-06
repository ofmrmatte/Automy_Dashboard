import type { LucideIcon } from "lucide-react";
import type { AuditableEntity } from "@/shared/types/entity";

export type SettingsSectionId =
  "Empresa" | "Usuários" | "Permissões" | "Segurança" | "Integrações" | "Notificações" | "Perfil";

export type SettingsSection = {
  id: SettingsSectionId;
  icon: LucideIcon;
};

export type CompanyStatus = "active" | "inactive" | "pending" | "blocked";
export type IntegrationStatus =
  "connected" | "disconnected" | "not_configured" | "error" | "pending";
export type NotificationStatus = "unread" | "read" | "archived";

export type SettingsAccess = {
  canManageSettings: boolean;
  canReadSettings: boolean;
  role: "admin" | "manager" | "operator" | "read_only";
};

export type CompanySettings = AuditableEntity & {
  id: string;
  legalName: string;
  tradeName: string;
  document: string;
  stateRegistration: string;
  municipalRegistration: string;
  email: string;
  phone: string;
  website: string;
  description: string;
  segment: string;
  status: CompanyStatus;
  postalCode: string;
  street: string;
  number: string;
  complement: string;
  district: string;
  city: string;
  state: string;
  country: string;
  timeZone: string;
  defaultLanguage: string;
  defaultCurrency: string;
  dateFormat: string;
  timeFormat: "24h" | "12h";
  firstDayOfWeek: number;
  businessHours: { start: string; end: string };
  defaultContractTermDays: number;
  defaultBillingTermDays: number;
  logoUrl: string;
  faviconUrl: string;
  displayName: string;
  billingLegalName: string;
  billingDocument: string;
  billingEmail: string;
  billingPhone: string;
  billingAddress: {
    postalCode: string;
    street: string;
    number: string;
    complement: string;
    district: string;
    city: string;
    state: string;
    country: string;
  };
};

export type CompanySettingsPayload = Omit<
  CompanySettings,
  "id" | "createdAt" | "updatedAt" | "deletedAt" | "createdBy" | "updatedBy"
>;

export type CompanySecuritySettings = AuditableEntity & {
  id: string;
  companyId: string;
  sessionDurationDays: number;
  requirePasswordChangeOnFirstLogin: boolean;
  minPasswordLength: number;
  lockoutAttempts: number;
  lockoutDurationMinutes: number;
  allowMultipleSessions: boolean;
  requireEmailVerified: boolean;
  mfaStatus: "not_configured" | "prepared" | "enabled";
};

export type LoginHistoryRecord = {
  id: string;
  success: boolean;
  ipAddress: string | null;
  maskedIpAddress: string | null;
  userAgent: string | null;
  origin: string | null;
  failureReason: string | null;
  createdAt: string;
};

export type SecuritySettings = {
  policy: CompanySecuritySettings;
  loginHistory: LoginHistoryRecord[];
  access: SettingsAccess;
};

export type SecuritySettingsPayload = Pick<
  CompanySecuritySettings,
  | "sessionDurationDays"
  | "requirePasswordChangeOnFirstLogin"
  | "minPasswordLength"
  | "lockoutAttempts"
  | "lockoutDurationMinutes"
  | "allowMultipleSessions"
  | "requireEmailVerified"
>;

export type CompanyIntegration = AuditableEntity & {
  id: string;
  companyId: string;
  provider: "better_auth" | "mercado_pago" | "transactional_email" | "storage" | "railway";
  type: "auth" | "payments" | "email" | "storage" | "infrastructure";
  name: string;
  status: IntegrationStatus;
  environment: string;
  publicConfig: Record<string, unknown>;
  maskedConfig: Record<string, string>;
  lastCheckedAt: string | null;
  lastSuccessAt: string | null;
  lastError: string | null;
  editable: boolean;
};

export type IntegrationUpdatePayload = {
  status: IntegrationStatus;
  environment: string;
  publicConfig: Record<string, unknown>;
};

export type IntegrationTestResult = {
  provider: CompanyIntegration["provider"];
  status: IntegrationStatus;
  message: string;
  checkedAt: string;
};

export type NotificationPreferenceSettings = AuditableEntity & {
  id: string;
  companyId: string;
  authUserId: string;
  inApp: boolean;
  email: boolean;
  contracts: boolean;
  billing: boolean;
  tickets: boolean;
  agenda: boolean;
  security: boolean;
  adminUpdates: boolean;
  dailySummary: boolean;
  weeklySummary: boolean;
};

export type CompanyNotificationSettings = AuditableEntity & {
  id: string;
  companyId: string;
  inAppEnabled: boolean;
  emailEnabled: boolean;
  defaultSender: string;
  contractNoticeDays: number;
  billingNoticeDays: number;
  agendaReminderMinutes: number;
  slaWarningHours: number;
  criticalAlertsEnabled: boolean;
  quietHours: { enabled: boolean; start: string; end: string };
  timezone: string;
};

export type NotificationsSettings = {
  userPreferences: NotificationPreferenceSettings;
  companySettings: CompanyNotificationSettings;
  access: SettingsAccess;
};

export type NotificationsSettingsPayload = {
  userPreferences: Omit<
    NotificationPreferenceSettings,
    | "id"
    | "companyId"
    | "authUserId"
    | "createdAt"
    | "updatedAt"
    | "deletedAt"
    | "createdBy"
    | "updatedBy"
  >;
  companySettings?: Omit<
    CompanyNotificationSettings,
    "id" | "companyId" | "createdAt" | "updatedAt" | "deletedAt" | "createdBy" | "updatedBy"
  >;
};

export type NotificationRecord = {
  id: string;
  title: string;
  description: string | null;
  type: "info" | "success" | "warning" | "danger";
  status: NotificationStatus;
  relatedEntityType: string | null;
  relatedEntityId: string | null;
  href: string | null;
  readAt: string | null;
  createdAt: string;
};

export type NotificationsPayload = {
  notifications: NotificationRecord[];
  unreadCount: number;
};
