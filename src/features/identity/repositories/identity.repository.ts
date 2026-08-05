import { authClient } from "@/features/identity/auth-client";
import type {
  AuthSession,
  AuthUser,
  IdentityPreferences,
  IdentityProfile,
  NotificationPreferences,
  PreferencesUpdatePayload,
  ProfileUpdatePayload,
} from "@/features/identity/types";
import { detectBrowserLanguage, detectTimeZone } from "@/features/identity/utils/environment";
import { RepositoryError } from "@/shared/api/errors";

type AuthChangeEvent = "SIGNED_IN" | "SIGNED_OUT" | "TOKEN_REFRESHED" | "USER_UPDATED";
type Subscription = { unsubscribe: () => void };
type SignOutScope = "global" | "local" | "others";

type BetterAuthSessionPayload = {
  session: {
    id: string;
    token: string;
    userId: string;
    expiresAt: Date | string;
    createdAt: Date | string;
    updatedAt: Date | string;
  };
  user: {
    id: string;
    name: string;
    email: string;
    emailVerified: boolean;
    image?: string | null;
    createdAt: Date | string;
    updatedAt: Date | string;
    role?: AuthUser["role"];
    status?: AuthUser["status"];
    lastLogin?: Date | string | null;
  };
};

function defaultNotifications(): NotificationPreferences {
  return {
    productUpdates: true,
    securityAlerts: true,
    operationalReports: false,
  };
}

function toIsoDate(value: Date | string | number | null | undefined) {
  if (!value) return new Date().toISOString();
  return value instanceof Date ? value.toISOString() : new Date(value).toISOString();
}

function optionalIsoDate(value: Date | string | number | null | undefined) {
  if (!value) return null;
  return toIsoDate(value);
}

function splitName(name: string) {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  const firstName = parts.shift() ?? "";
  return {
    firstName,
    lastName: parts.join(" "),
  };
}

function fullName(payload: ProfileUpdatePayload) {
  return [payload.firstName, payload.lastName]
    .map((part) => part.trim())
    .filter(Boolean)
    .join(" ");
}

function createRecordId() {
  return crypto.randomUUID();
}

function mapAuthSession(payload: BetterAuthSessionPayload | null): AuthSession | null {
  if (!payload) return null;

  const expiresAt = new Date(payload.session.expiresAt);
  const user: AuthUser = {
    id: payload.user.id,
    app_metadata: {},
    user_metadata: {},
    aud: "authenticated",
    created_at: toIsoDate(payload.user.createdAt),
    updated_at: toIsoDate(payload.user.updatedAt),
    last_sign_in_at: optionalIsoDate(payload.user.lastLogin),
    email: payload.user.email,
    email_verified: payload.user.emailVerified,
    name: payload.user.name,
    image: payload.user.image ?? null,
    role: payload.user.role ?? "admin",
    status: payload.user.status ?? "active",
  };

  return {
    access_token: payload.session.token,
    refresh_token: "",
    expires_in: Math.max(0, Math.floor((expiresAt.getTime() - Date.now()) / 1000)),
    expires_at: Math.floor(expiresAt.getTime() / 1000),
    token_type: "bearer",
    user,
  };
}

function createProfile(session: AuthSession): IdentityProfile {
  const now = new Date().toISOString();
  const names = splitName(session.user.name ?? "");

  return {
    id: createRecordId(),
    authUserId: session.user.id,
    firstName: names.firstName,
    lastName: names.lastName,
    phone: "",
    jobTitle: "",
    companyName: "Automy",
    avatarPath: session.user.image ?? null,
    createdAt: session.user.created_at,
    updatedAt: session.user.updated_at ?? now,
    deletedAt: null,
    createdBy: session.user.id,
    updatedBy: session.user.id,
  };
}

function createPreferences(authUserId: string): IdentityPreferences {
  const now = new Date().toISOString();

  return {
    id: createRecordId(),
    authUserId,
    theme: "system",
    language: detectBrowserLanguage(),
    timeZone: detectTimeZone(),
    dateFormat: "dd/MM/yyyy",
    timeFormat: "24h",
    currency: "BRL",
    notifications: defaultNotifications(),
    createdAt: now,
    updatedAt: now,
    deletedAt: null,
    createdBy: authUserId,
    updatedBy: authUserId,
  };
}

async function readServerSetting<T>(path: string, authUserId: string) {
  const response = await fetch(`${path}?authUserId=${encodeURIComponent(authUserId)}`, {
    credentials: "include",
  });
  if (!response.ok) return null;

  const payload = (await response.json()) as { value?: T | null };
  return payload.value ?? null;
}

async function writeServerSetting<T>(path: string, authUserId: string, value: T) {
  const response = await fetch(path, {
    method: "PUT",
    headers: { "content-type": "application/json" },
    credentials: "include",
    body: JSON.stringify({ authUserId, value }),
  });

  if (!response.ok) {
    throw new RepositoryError("Não foi possível salvar no banco da Railway.");
  }

  const payload = (await response.json()) as { value?: T | null };
  return payload.value ?? value;
}

function getBetterAuthErrorMessage(error: unknown, fallback: string) {
  if (error instanceof Error) return error.message;
  if (typeof error === "object" && error !== null && "message" in error) {
    const message = (error as { message?: unknown }).message;
    if (typeof message === "string" && message.trim()) return message;
  }
  return fallback;
}

async function currentSession() {
  const response = await authClient.getSession();
  if (response.error) {
    throw new RepositoryError(
      getBetterAuthErrorMessage(response.error, "Não foi possível carregar a sessão."),
    );
  }

  return mapAuthSession(response.data as BetterAuthSessionPayload | null);
}

export const identityRepository = {
  getSession: currentSession,

  onAuthStateChange: (_callback: (event: AuthChangeEvent, session: AuthSession | null) => void) =>
    ({ unsubscribe: () => undefined }) satisfies Subscription,

  signInWithPassword: async (email: string, password: string, rememberMe = false) => {
    const response = await authClient.signIn.email({
      email,
      password,
      rememberMe,
    });

    if (response.error) {
      throw new RepositoryError(
        getBetterAuthErrorMessage(response.error, "E-mail ou senha inválidos."),
      );
    }

    const session = await currentSession();
    if (!session) {
      throw new RepositoryError("Sessão não encontrada após autenticação.");
    }

    return session;
  },

  sendPasswordRecovery: async (email: string) => {
    const response = await authClient.requestPasswordReset({
      email,
      redirectTo: `${window.location.origin}/redefinir-senha`,
    });

    if (response.error) {
      throw new RepositoryError(
        getBetterAuthErrorMessage(response.error, "Não foi possível solicitar recuperação."),
      );
    }
  },

  updatePassword: async (password: string, currentPassword?: string) => {
    const token = new URLSearchParams(window.location.search).get("token");
    const response = currentPassword
      ? await authClient.changePassword({
          currentPassword,
          newPassword: password,
          revokeOtherSessions: true,
        })
      : await authClient.resetPassword({
          newPassword: password,
          token: token ?? undefined,
        });

    if (response.error) {
      throw new RepositoryError(
        getBetterAuthErrorMessage(response.error, "Não foi possível alterar a senha."),
      );
    }
  },

  signOut: async (scope: SignOutScope = "local") => {
    if (scope === "others" && "revokeOtherSessions" in authClient) {
      const response = await authClient.revokeOtherSessions();
      if (response.error) {
        throw new RepositoryError(
          getBetterAuthErrorMessage(response.error, "Não foi possível encerrar outras sessões."),
        );
      }
      return;
    }

    if (scope === "global" && "revokeSessions" in authClient) {
      const response = await authClient.revokeSessions();
      if (response.error) {
        throw new RepositoryError(
          getBetterAuthErrorMessage(response.error, "Não foi possível encerrar as sessões."),
        );
      }
    }

    const response = await authClient.signOut();
    if (response.error) {
      throw new RepositoryError(
        getBetterAuthErrorMessage(response.error, "Não foi possível sair."),
      );
    }
  },

  ensureIdentityRecords: async (session: AuthSession) => {
    const serverProfile = await readServerSetting<IdentityProfile>(
      "/api/settings/profile",
      session.user.id,
    );
    if (!serverProfile) {
      await writeServerSetting("/api/settings/profile", session.user.id, createProfile(session));
    }

    const serverPreferences = await readServerSetting<IdentityPreferences>(
      "/api/settings/preferences",
      session.user.id,
    );
    if (!serverPreferences) {
      await writeServerSetting(
        "/api/settings/preferences",
        session.user.id,
        createPreferences(session.user.id),
      );
    }
  },

  getProfile: async (authUserId: string) => {
    const serverProfile = await readServerSetting<IdentityProfile>(
      "/api/settings/profile",
      authUserId,
    );
    if (serverProfile) return serverProfile;

    const session = await currentSession();
    if (!session) {
      throw new RepositoryError("Sessão não encontrada para carregar o perfil.");
    }

    return createProfile(session);
  },

  getPreferences: async (authUserId: string) => {
    const serverPreferences = await readServerSetting<IdentityPreferences>(
      "/api/settings/preferences",
      authUserId,
    );
    return serverPreferences ?? createPreferences(authUserId);
  },

  updateProfile: async (authUserId: string, payload: ProfileUpdatePayload) => {
    const session = await currentSession();
    if (!session) {
      throw new RepositoryError("Sessão não encontrada para salvar o perfil.");
    }

    const current = await identityRepository.getProfile(authUserId);
    const nextProfile: IdentityProfile = {
      ...current,
      ...payload,
      authUserId,
      updatedAt: new Date().toISOString(),
      updatedBy: authUserId,
    };

    const authResponse = await authClient.updateUser({
      name: fullName(payload) || session.user.email || "Automy",
      image: nextProfile.avatarPath,
    });

    if (authResponse.error) {
      throw new RepositoryError(
        getBetterAuthErrorMessage(authResponse.error, "Não foi possível atualizar o usuário."),
      );
    }

    return writeServerSetting("/api/settings/profile", authUserId, nextProfile);
  },

  updatePreferences: async (authUserId: string, payload: PreferencesUpdatePayload) => {
    const current = await identityRepository.getPreferences(authUserId);
    const nextPreferences: IdentityPreferences = {
      ...current,
      ...payload,
      authUserId,
      updatedAt: new Date().toISOString(),
      updatedBy: authUserId,
    };

    return writeServerSetting("/api/settings/preferences", authUserId, nextPreferences);
  },

  uploadAvatar: async (_authUserId: string, _file: File): Promise<IdentityProfile> => {
    throw new RepositoryError("Upload de avatar ainda não está disponível neste modo.");
  },

  getAvatarUrl: async (avatarPath: string | null) => avatarPath,
};
