import { createContext, useContext } from "react";
import type {
  AuthSession,
  AuthUser,
  IdentityPreferences,
  IdentityProfile,
  IdentitySessionRecord,
  PasswordUpdatePayload,
  PreferencesUpdatePayload,
  ProfileUpdatePayload,
} from "@/features/identity/types";

export type IdentityContextValue = {
  session: AuthSession | null;
  user: AuthUser | null;
  profile: IdentityProfile | null;
  preferences: IdentityPreferences | null;
  identitySessions: IdentitySessionRecord[];
  avatarUrl: string | null;
  isLoading: boolean;
  refreshIdentity: () => Promise<void>;
  signIn: (email: string, password: string, rememberMe?: boolean) => Promise<void>;
  sendPasswordRecovery: (email: string) => Promise<void>;
  updatePassword: (payload: PasswordUpdatePayload) => Promise<void>;
  resetPassword: (password: string) => Promise<void>;
  signOut: (scope?: "global" | "local" | "others") => Promise<void>;
  updateProfile: (payload: ProfileUpdatePayload) => Promise<void>;
  updatePreferences: (payload: PreferencesUpdatePayload) => Promise<void>;
  uploadAvatar: (file: File) => Promise<void>;
  removeAvatar: () => Promise<void>;
  refreshSessions: () => Promise<void>;
  revokeSession: (sessionId: string) => Promise<void>;
  revokeOtherSessions: () => Promise<void>;
  revokeAllSessions: () => Promise<void>;
};

export const IdentityContext = createContext<IdentityContextValue | null>(null);

export function useIdentity() {
  const context = useContext(IdentityContext);

  if (!context) {
    throw new Error("useIdentity deve ser usado dentro de IdentityProvider.");
  }

  return context;
}
