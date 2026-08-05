import type {
  AuthSession,
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

const SESSION_KEY = "automy.railway.session";
const PROFILE_KEY = "automy.railway.profile";
const PREFERENCES_KEY = "automy.railway.preferences";

function canUseStorage() {
  return typeof window !== "undefined";
}

function defaultNotifications(): NotificationPreferences {
  return {
    productUpdates: true,
    securityAlerts: true,
    operationalReports: false,
  };
}

function readJson<T>(key: string) {
  if (!canUseStorage()) return null;

  const value = window.localStorage.getItem(key);
  if (!value) return null;

  try {
    return JSON.parse(value) as T;
  } catch {
    window.localStorage.removeItem(key);
    return null;
  }
}

function writeJson(key: string, value: unknown) {
  if (!canUseStorage()) return;
  window.localStorage.setItem(key, JSON.stringify(value));
}

function removeStoredIdentity() {
  if (!canUseStorage()) return;
  window.localStorage.removeItem(SESSION_KEY);
  window.localStorage.removeItem(PROFILE_KEY);
  window.localStorage.removeItem(PREFERENCES_KEY);
}

function createRecordId() {
  return crypto.randomUUID();
}

async function readServerSetting<T>(path: string, authUserId: string) {
  const response = await fetch(`${path}?authUserId=${encodeURIComponent(authUserId)}`);
  if (!response.ok) return null;

  const payload = (await response.json()) as { value?: T | null };
  return payload.value ?? null;
}

async function writeServerSetting<T>(path: string, authUserId: string, value: T) {
  const response = await fetch(path, {
    method: "PUT",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ authUserId, value }),
  });

  if (!response.ok) {
    throw new RepositoryError("Não foi possível salvar no banco da Railway.");
  }

  const payload = (await response.json()) as { value?: T | null };
  return payload.value ?? value;
}

function createProfile(session: AuthSession): IdentityProfile {
  const now = new Date().toISOString();
  const metadata = session.user.user_metadata;

  return {
    id: createRecordId(),
    authUserId: session.user.id,
    firstName: typeof metadata["first_name"] === "string" ? metadata["first_name"] : "",
    lastName: typeof metadata["last_name"] === "string" ? metadata["last_name"] : "",
    phone: "",
    jobTitle: "",
    companyName: "Automy",
    avatarPath: null,
    createdAt: now,
    updatedAt: now,
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

export const identityRepository = {
  getSession: async () => readJson<AuthSession>(SESSION_KEY),

  onAuthStateChange: (_callback: (event: AuthChangeEvent, session: AuthSession | null) => void) =>
    ({ unsubscribe: () => undefined }) satisfies Subscription,

  signInWithPassword: async (email: string, password: string) => {
    const response = await fetch("/api/auth/local-login", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ email, password }),
    });

    if (!response.ok) {
      const payload = (await response.json().catch(() => null)) as { error?: string } | null;
      throw new RepositoryError(payload?.error ?? "Não foi possível entrar com estes dados.");
    }

    const payload = (await response.json()) as { session: AuthSession };
    writeJson(SESSION_KEY, payload.session);
    return payload.session;
  },

  sendPasswordRecovery: async (_email: string) => {
    throw new RepositoryError("Recuperação de senha ainda não está disponível neste modo.");
  },

  updatePassword: async (_password: string, _currentPassword?: string) => {
    throw new RepositoryError("Alteração de senha ainda não está disponível neste modo.");
  },

  signOut: async (_scope: SignOutScope = "local") => {
    removeStoredIdentity();
  },

  ensureIdentityRecords: async (session: AuthSession) => {
    const serverProfile = await readServerSetting<IdentityProfile>(
      "/api/settings/profile",
      session.user.id,
    );
    if (serverProfile) {
      writeJson(PROFILE_KEY, serverProfile);
    } else {
      const profile = readJson<IdentityProfile>(PROFILE_KEY) ?? createProfile(session);
      const savedProfile = await writeServerSetting(
        "/api/settings/profile",
        session.user.id,
        profile,
      );
      writeJson(PROFILE_KEY, savedProfile);
    }

    const serverPreferences = await readServerSetting<IdentityPreferences>(
      "/api/settings/preferences",
      session.user.id,
    );
    if (serverPreferences) {
      writeJson(PREFERENCES_KEY, serverPreferences);
    } else {
      const preferences =
        readJson<IdentityPreferences>(PREFERENCES_KEY) ?? createPreferences(session.user.id);
      const savedPreferences = await writeServerSetting(
        "/api/settings/preferences",
        session.user.id,
        preferences,
      );
      writeJson(PREFERENCES_KEY, savedPreferences);
    }
  },

  getProfile: async (authUserId: string) => {
    const serverProfile = await readServerSetting<IdentityProfile>(
      "/api/settings/profile",
      authUserId,
    );
    if (serverProfile) {
      writeJson(PROFILE_KEY, serverProfile);
      return serverProfile;
    }

    const session = readJson<AuthSession>(SESSION_KEY);
    if (!session) {
      throw new RepositoryError("Sessão não encontrada para carregar o perfil.");
    }

    return readJson<IdentityProfile>(PROFILE_KEY) ?? createProfile(session);
  },

  getPreferences: async (authUserId: string) => {
    const serverPreferences = await readServerSetting<IdentityPreferences>(
      "/api/settings/preferences",
      authUserId,
    );
    if (serverPreferences) {
      writeJson(PREFERENCES_KEY, serverPreferences);
      return serverPreferences;
    }

    return readJson<IdentityPreferences>(PREFERENCES_KEY) ?? createPreferences(authUserId);
  },

  updateProfile: async (authUserId: string, payload: ProfileUpdatePayload) => {
    const session = readJson<AuthSession>(SESSION_KEY);
    if (!session) {
      throw new RepositoryError("Sessão não encontrada para salvar o perfil.");
    }

    const current = readJson<IdentityProfile>(PROFILE_KEY) ?? createProfile(session);
    const nextProfile: IdentityProfile = {
      ...current,
      ...payload,
      authUserId,
      updatedAt: new Date().toISOString(),
      updatedBy: authUserId,
    };
    const saved = await writeServerSetting("/api/settings/profile", authUserId, nextProfile);
    writeJson(PROFILE_KEY, saved);
    return saved;
  },

  updatePreferences: async (authUserId: string, payload: PreferencesUpdatePayload) => {
    const current = readJson<IdentityPreferences>(PREFERENCES_KEY) ?? createPreferences(authUserId);
    const nextPreferences: IdentityPreferences = {
      ...current,
      ...payload,
      authUserId,
      updatedAt: new Date().toISOString(),
      updatedBy: authUserId,
    };
    const saved = await writeServerSetting(
      "/api/settings/preferences",
      authUserId,
      nextPreferences,
    );
    writeJson(PREFERENCES_KEY, saved);
    return saved;
  },

  uploadAvatar: async (_authUserId: string, _file: File): Promise<IdentityProfile> => {
    throw new RepositoryError("Upload de avatar ainda não está disponível neste modo.");
  },

  getAvatarUrl: async (_avatarPath: string | null) => null,
};
