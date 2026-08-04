import type { Session, User } from "@supabase/supabase-js";
import type { AuditableEntity } from "@/shared/types/entity";

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
  session: Session | null;
  user: User | null;
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
