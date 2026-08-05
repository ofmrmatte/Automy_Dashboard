import { identityRepository } from "@/features/identity/repositories/identity.repository";
import type {
  AuthSession,
  PreferencesUpdatePayload,
  ProfileUpdatePayload,
} from "@/features/identity/types";

export const identityService = {
  getSession: () => identityRepository.getSession(),
  onAuthStateChange: identityRepository.onAuthStateChange,
  signIn: (email: string, password: string, rememberMe?: boolean) =>
    identityRepository.signInWithPassword(email, password, rememberMe),
  sendPasswordRecovery: (email: string) => identityRepository.sendPasswordRecovery(email),
  updatePassword: (password: string, currentPassword?: string) =>
    identityRepository.updatePassword(password, currentPassword),
  signOut: (scope: "global" | "local" | "others" = "local") => identityRepository.signOut(scope),
  ensureIdentityRecords: (session: AuthSession) =>
    identityRepository.ensureIdentityRecords(session),
  getProfile: (authUserId: string) => identityRepository.getProfile(authUserId),
  getPreferences: (authUserId: string) => identityRepository.getPreferences(authUserId),
  getAvatarUrl: (avatarPath: string | null) => identityRepository.getAvatarUrl(avatarPath),
  updateProfile: (authUserId: string, payload: ProfileUpdatePayload) =>
    identityRepository.updateProfile(authUserId, payload),
  updatePreferences: (authUserId: string, payload: PreferencesUpdatePayload) =>
    identityRepository.updatePreferences(authUserId, payload),
  uploadAvatar: (authUserId: string, file: File) =>
    identityRepository.uploadAvatar(authUserId, file),
};
