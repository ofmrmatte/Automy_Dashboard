import { type ReactNode, useCallback, useEffect, useMemo, useState } from "react";
import {
  IdentityContext,
  type IdentityContextValue,
} from "@/features/identity/context/identity-context";
import { identityService } from "@/features/identity/services/identity.service";
import type {
  AuthSession,
  IdentityPreferences,
  IdentityProfile,
  IdentitySessionRecord,
} from "@/features/identity/types";
import { toast } from "@/shared/components/toast";
import { detectBrowserTimeZone, FALLBACK_TIME_ZONE } from "@/shared/utils/regional-formatters";

function getIdentityErrorMessage(error: unknown) {
  return error instanceof Error ? error.message : "Não foi possível concluir a operação.";
}

export function IdentityProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<AuthSession | null>(null);
  const [profile, setProfile] = useState<IdentityProfile | null>(null);
  const [preferences, setPreferences] = useState<IdentityPreferences | null>(null);
  const [identitySessions, setIdentitySessions] = useState<IdentitySessionRecord[]>([]);
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const loadIdentity = useCallback(async (nextSession: AuthSession | null) => {
    setSession(nextSession);

    if (!nextSession) {
      setProfile(null);
      setPreferences(null);
      setIdentitySessions([]);
      setAvatarUrl(null);
      return;
    }

    await identityService.ensureIdentityRecords(nextSession);

    const [nextProfile, nextPreferences, nextSessions] = await Promise.all([
      identityService.getProfile(nextSession.user.id),
      identityService.getPreferences(nextSession.user.id),
      identityService.listSessions(),
    ]);

    setProfile(nextProfile);
    let resolvedPreferences = nextPreferences;
    if (typeof window !== "undefined") {
      const storageKey = `automy-timezone-detected:${nextSession.user.id}`;
      const browserTimeZone = detectBrowserTimeZone();
      const shouldPersistDetectedTimeZone =
        nextPreferences.timeZone === FALLBACK_TIME_ZONE &&
        browserTimeZone !== FALLBACK_TIME_ZONE &&
        !localStorage.getItem(storageKey);

      if (shouldPersistDetectedTimeZone) {
        resolvedPreferences = await identityService.updatePreferences(nextSession.user.id, {
          ...nextPreferences,
          timeZone: browserTimeZone,
        });
        localStorage.setItem(storageKey, "true");
      }
    }

    setPreferences(resolvedPreferences);
    setIdentitySessions(nextSessions);
    setAvatarUrl(await identityService.getAvatarUrl(nextProfile?.avatarPath ?? null));
  }, []);

  const refreshIdentity = useCallback(async () => {
    if (!session) return;
    await loadIdentity(session);
  }, [loadIdentity, session]);

  const refreshSessions = useCallback(async () => {
    if (!session) return;
    setIdentitySessions(await identityService.listSessions());
  }, [session]);

  useEffect(() => {
    let mounted = true;

    identityService
      .getSession()
      .then((initialSession) => {
        if (!mounted) return;
        return loadIdentity(initialSession);
      })
      .catch((error) => {
        toast.danger(getIdentityErrorMessage(error));
      })
      .finally(() => {
        if (mounted) setIsLoading(false);
      });

    const subscription = identityService.onAuthStateChange((_event, nextSession) => {
      loadIdentity(nextSession).catch((error) => {
        toast.danger(getIdentityErrorMessage(error));
      });
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, [loadIdentity]);

  const value = useMemo<IdentityContextValue>(
    () => ({
      session,
      user: session?.user ?? null,
      profile,
      preferences,
      identitySessions,
      avatarUrl,
      isLoading,
      refreshIdentity,
      signIn: async (email, password, rememberMe) => {
        const nextSession = await identityService.signIn(email, password, rememberMe);
        await loadIdentity(nextSession);
      },
      sendPasswordRecovery: (email) => identityService.sendPasswordRecovery(email),
      updatePassword: (payload) => identityService.updatePassword(payload),
      resetPassword: (password) => identityService.resetPassword(password),
      signOut: async (scope = "local") => {
        await identityService.signOut(scope);
        setSession(null);
        setProfile(null);
        setPreferences(null);
        setIdentitySessions([]);
        setAvatarUrl(null);
      },
      updateProfile: async (payload) => {
        if (!session) return;
        const nextProfile = await identityService.updateProfile(session.user.id, payload);
        setProfile(nextProfile);
      },
      updatePreferences: async (payload) => {
        if (!session) return;
        const nextPreferences = await identityService.updatePreferences(session.user.id, payload);
        setPreferences(nextPreferences);
      },
      uploadAvatar: async (file) => {
        if (!session) return;
        const nextProfile = await identityService.uploadAvatar(session.user.id, file);
        if (!nextProfile) return;
        setProfile(nextProfile);
        setAvatarUrl(await identityService.getAvatarUrl(nextProfile.avatarPath));
      },
      removeAvatar: async () => {
        if (!session) return;
        const nextProfile = await identityService.removeAvatar(session.user.id);
        setProfile(nextProfile);
        setAvatarUrl(null);
      },
      refreshSessions,
      revokeSession: async (sessionId) => {
        await identityService.revokeSession(sessionId);
        await refreshSessions();
      },
      revokeOtherSessions: async () => {
        await identityService.revokeOtherSessions();
        await refreshSessions();
      },
      revokeAllSessions: async () => {
        await identityService.revokeAllSessions();
        setSession(null);
        setProfile(null);
        setPreferences(null);
        setIdentitySessions([]);
        setAvatarUrl(null);
      },
    }),
    [
      avatarUrl,
      identitySessions,
      isLoading,
      loadIdentity,
      preferences,
      profile,
      refreshIdentity,
      refreshSessions,
      session,
    ],
  );

  return <IdentityContext.Provider value={value}>{children}</IdentityContext.Provider>;
}
