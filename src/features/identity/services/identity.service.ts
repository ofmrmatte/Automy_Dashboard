import { identityRepository } from "@/features/identity/repositories/identity.repository";
import type {
  AuthSession,
  PasswordUpdatePayload,
  PreferencesUpdatePayload,
  ProfileUpdatePayload,
} from "@/features/identity/types";

export const identityService = {
  getSession: () => identityRepository.getSession(),
  onAuthStateChange: identityRepository.onAuthStateChange,
  signIn: (email: string, password: string, rememberMe?: boolean) =>
    identityRepository.signInWithPassword(email, password, rememberMe),
  sendPasswordRecovery: (email: string) => identityRepository.sendPasswordRecovery(email),
  updatePassword: (payload: PasswordUpdatePayload) => identityRepository.updatePassword(payload),
  resetPassword: (password: string) => identityRepository.resetPassword(password),
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
  removeAvatar: (authUserId: string) => identityRepository.removeAvatar(authUserId),
  listSessions: () => identityRepository.listSessions(),
  revokeSession: (sessionId: string) => identityRepository.revokeSession(sessionId),
  revokeOtherSessions: () => identityRepository.revokeOtherSessions(),
  revokeAllSessions: () => identityRepository.revokeAllSessions(),
};
