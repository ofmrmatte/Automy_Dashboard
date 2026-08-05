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
  status?: "active" | "inactive" | "pending" | "blocked";
};

export type AuthSession = {
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
  firstName: string;
  lastName: string;
  phone: string;
  jobTitle: string;
  companyName: string;
  avatarPath: string | null;
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
  notifications: NotificationPreferences;
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
  companyName: string;
};

export type PreferencesUpdatePayload = {
  theme: ThemePreference;
  language: string;
  timeZone: string;
  dateFormat: string;
  timeFormat: TimeFormatPreference;
  currency: string;
  notifications: NotificationPreferences;
};
