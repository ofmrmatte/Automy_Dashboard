import { createContext, useContext } from "react";
import type { Session, User } from "@supabase/supabase-js";
import type {
  IdentityPreferences,
  IdentityProfile,
  PreferencesUpdatePayload,
  ProfileUpdatePayload,
} from "@/features/identity/types";

export type IdentityContextValue = {
  session: Session | null;
  user: User | null;
  profile: IdentityProfile | null;
  preferences: IdentityPreferences | null;
  avatarUrl: string | null;
  isLoading: boolean;
  refreshIdentity: () => Promise<void>;
  signIn: (email: string, password: string) => Promise<void>;
  sendPasswordRecovery: (email: string) => Promise<void>;
  updatePassword: (password: string, currentPassword?: string) => Promise<void>;
  signOut: (scope?: "global" | "local" | "others") => Promise<void>;
  updateProfile: (payload: ProfileUpdatePayload) => Promise<void>;
  updatePreferences: (payload: PreferencesUpdatePayload) => Promise<void>;
  uploadAvatar: (file: File) => Promise<void>;
};

export const IdentityContext = createContext<IdentityContextValue | null>(null);

export function useIdentity() {
  const context = useContext(IdentityContext);

  if (!context) {
    throw new Error("useIdentity deve ser usado dentro de IdentityProvider.");
  }

  return context;
}
