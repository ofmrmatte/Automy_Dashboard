import { authClient } from "@/features/identity/auth-client";
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

function toIsoDate(value: Date | string | number | null | undefined) {
  if (!value) return new Date().toISOString();
  return value instanceof Date ? value.toISOString() : new Date(value).toISOString();
}

function optionalIsoDate(value: Date | string | number | null | undefined) {
  if (!value) return null;
  return toIsoDate(value);
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
    id: payload.session.id,
    access_token: payload.session.token,
    refresh_token: "",
    expires_in: Math.max(0, Math.floor((expiresAt.getTime() - Date.now()) / 1000)),
    expires_at: Math.floor(expiresAt.getTime() / 1000),
    token_type: "bearer",
    user,
  };
}

async function apiRequest<T>(path: string, init?: RequestInit) {
  const response = await fetch(path, {
    credentials: "include",
    ...init,
    headers: {
      ...(init?.body instanceof FormData ? {} : { "content-type": "application/json" }),
      ...init?.headers,
    },
  });

  if (!response.ok) {
    const payload = (await response.json().catch(() => null)) as { error?: string } | null;
    throw new RepositoryError(payload?.error ?? "Não foi possível acessar o banco da Railway.");
  }

  return (await response.json()) as T;
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

  updatePassword: async (payload: PasswordUpdatePayload) => {
    const token = new URLSearchParams(window.location.search).get("token");
    if (!payload.currentPassword && token) {
      const response = await authClient.resetPassword({
        newPassword: payload.password,
        token,
      });

      if (response.error) {
        throw new RepositoryError(
          getBetterAuthErrorMessage(response.error, "Não foi possível alterar a senha."),
        );
      }
      return;
    }

    await apiRequest<{ ok: boolean }>("/api/identity/password", {
      method: "POST",
      body: JSON.stringify(payload),
    });
  },

  resetPassword: async (password: string) => {
    const token = new URLSearchParams(window.location.search).get("token");
    const response = token
      ? await authClient.resetPassword({
          newPassword: password,
          token,
        })
      : await authClient.resetPassword({
          newPassword: password,
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

  ensureIdentityRecords: async (_session: AuthSession) => {
    await Promise.all([
      apiRequest<{ profile: IdentityProfile }>("/api/identity/profile"),
      apiRequest<{ preferences: IdentityPreferences }>("/api/identity/preferences"),
    ]);
  },

  getProfile: async (authUserId: string) => {
    void authUserId;
    const payload = await apiRequest<{ profile: IdentityProfile }>("/api/identity/profile");
    return payload.profile;
  },

  getPreferences: async (authUserId: string) => {
    void authUserId;
    const payload = await apiRequest<{ preferences: IdentityPreferences }>(
      "/api/identity/preferences",
    );
    return payload.preferences;
  },

  updateProfile: async (authUserId: string, payload: ProfileUpdatePayload) => {
    void authUserId;
    const result = await apiRequest<{ profile: IdentityProfile }>("/api/identity/profile", {
      method: "PATCH",
      body: JSON.stringify(payload),
    });
    return result.profile;
  },

  updatePreferences: async (authUserId: string, payload: PreferencesUpdatePayload) => {
    void authUserId;
    const result = await apiRequest<{ preferences: IdentityPreferences }>(
      "/api/identity/preferences",
      {
        method: "PATCH",
        body: JSON.stringify(payload),
      },
    );
    return result.preferences;
  },

  uploadAvatar: async (_authUserId: string, _file: File): Promise<IdentityProfile> => {
    const body = new FormData();
    body.append("avatar", _file);
    const result = await apiRequest<{ profile: IdentityProfile }>("/api/identity/avatar", {
      method: "POST",
      body,
    });
    return result.profile;
  },

  removeAvatar: async (_authUserId: string): Promise<IdentityProfile> => {
    const result = await apiRequest<{ profile: IdentityProfile }>("/api/identity/avatar", {
      method: "DELETE",
    });
    return result.profile;
  },

  getAvatarUrl: async (avatarPath: string | null) => avatarPath,
  listSessions: async (): Promise<IdentitySessionRecord[]> => {
    const result = await apiRequest<{ sessions: IdentitySessionRecord[] }>(
      "/api/identity/sessions",
    );
    return result.sessions;
  },
  revokeSession: async (sessionId: string) => {
    await apiRequest<{ ok: boolean }>(
      `/api/identity/sessions?id=${encodeURIComponent(sessionId)}`,
      { method: "DELETE" },
    );
  },
  revokeOtherSessions: async () => {
    await apiRequest<{ ok: boolean }>("/api/identity/sessions?scope=others", { method: "DELETE" });
  },
  revokeAllSessions: async () => {
    await apiRequest<{ ok: boolean }>("/api/identity/sessions?scope=global", { method: "DELETE" });
  },
};
