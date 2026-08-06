import type { AuditableEntity } from "@/shared/types/entity";

export type AuthUser = {
  id: string;
  app_metadata: Record<string, unknown>;
  user_metadata: Record<string, unknown>;
  aud: string;
  created_at: string;
  updated_at?: string | null;
  last_sign_in_at?: string | null;
  email?: string;
  email_verified?: boolean;
  name?: string;
  image?: string | null;
  role?: "admin" | "manager" | "operator" | "read_only";
  status?: "active" | "inactive" | "invited" | "suspended";
};

export type AuthSession = {
  id: string;
  access_token: string;
  refresh_token: string;
  expires_in: number;
  expires_at: number;
  token_type: string;
  user: AuthUser;
};

export type ThemePreference = "system" | "light" | "dark";
export type TimeFormatPreference = "24h" | "12h";

export type NotificationPreferences = {
  productUpdates: boolean;
  securityAlerts: boolean;
  operationalReports: boolean;
};

export type IdentityProfile = AuditableEntity & {
  id: string;
  authUserId: string;
  domainUserId: string;
  companyId: string;
  firstName: string;
  lastName: string;
  phone: string;
  jobTitle: string;
  companyName: string;
  avatarPath: string | null;
  avatarMimeType: string | null;
  avatarSize: number | null;
  avatarUpdatedAt: string | null;
  email: string;
  role: "admin" | "manager" | "operator" | "read_only";
  roleName: string;
  status: "active" | "inactive" | "invited" | "suspended";
  companyTimeZone: string;
  authCreatedAt: string;
  lastLogin: string | null;
  emailVerified: boolean;
};

export type IdentityPreferences = AuditableEntity & {
  id: string;
  authUserId: string;
  theme: ThemePreference;
  language: string;
  timeZone: string;
  dateFormat: string;
  timeFormat: TimeFormatPreference;
  currency: string;
  firstDayOfWeek: number;
  notifications: NotificationPreferences;
};

export type IdentitySessionRecord = {
  id: string;
  token: string;
  createdAt: string;
  updatedAt: string;
  expiresAt: string;
  ipAddress: string | null;
  maskedIpAddress: string | null;
  userAgent: string | null;
  device: string;
  browser: string;
  operatingSystem: string;
  current: boolean;
};

export type IdentitySession = {
  session: AuthSession | null;
  user: AuthUser | null;
};

export type ProfileUpdatePayload = {
  firstName: string;
  lastName: string;
  phone: string;
  jobTitle: string;
};

export type PreferencesUpdatePayload = {
  theme: ThemePreference;
  language: string;
  timeZone: string;
  dateFormat: string;
  timeFormat: TimeFormatPreference;
  currency: string;
  firstDayOfWeek: number;
  notifications: NotificationPreferences;
};

export type PasswordUpdatePayload = {
  currentPassword: string;
  password: string;
  confirmPassword: string;
  revokeOtherSessions: boolean;
};
