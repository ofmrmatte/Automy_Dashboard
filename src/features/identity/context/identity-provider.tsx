import type { Session, User } from "@supabase/supabase-js";
import { type ReactNode, useCallback, useEffect, useMemo, useState } from "react";
import {
  IdentityContext,
  type IdentityContextValue,
} from "@/features/identity/context/identity-context";
import { identityService } from "@/features/identity/services/identity.service";
import type { IdentityPreferences, IdentityProfile } from "@/features/identity/types";
import { toast } from "@/shared/components/toast";

function getIdentityErrorMessage(error: unknown) {
  return error instanceof Error ? error.message : "Não foi possível concluir a operação.";
}

function logIdentityDebug(event: string, payload?: Record<string, unknown>) {
  if (!import.meta.env.DEV) return;
  console.debug(`[Automy Identity] ${event}`, payload ?? {});
}

function logIdentityError(event: string, error: unknown, payload?: Record<string, unknown>) {
  if (!import.meta.env.DEV) return;
  console.error(`[Automy Identity] ${event}`, {
    ...payload,
    error: error instanceof Error ? { name: error.name, message: error.message } : error,
  });
}

export function IdentityProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<IdentityProfile | null>(null);
  const [preferences, setPreferences] = useState<IdentityPreferences | null>(null);
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const loadIdentity = useCallback(async (nextSession: Session | null) => {
    logIdentityDebug("loadIdentity started", { userId: nextSession?.user.id ?? null });
    setSession(nextSession);

    if (!nextSession) {
      setProfile(null);
      setPreferences(null);
      setAvatarUrl(null);
      logIdentityDebug("loadIdentity completed without session");
      return;
    }

    await identityService.ensureIdentityRecords(nextSession);

    const [nextProfile, nextPreferences] = await Promise.all([
      identityService.getProfile(nextSession.user.id),
      identityService.getPreferences(nextSession.user.id),
    ]);

    setProfile(nextProfile);
    setPreferences(nextPreferences);
    setAvatarUrl(await identityService.getAvatarUrl(nextProfile?.avatarPath ?? null));
    logIdentityDebug("loadIdentity completed", { userId: nextSession.user.id });
  }, []);

  const refreshIdentity = useCallback(async () => {
    if (!session) return;
    await loadIdentity(session);
  }, [loadIdentity, session]);

  useEffect(() => {
    let mounted = true;

    identityService
      .getSession()
      .then((initialSession) => {
        if (!mounted) return;
        return loadIdentity(initialSession);
      })
      .catch((error) => {
        logIdentityError("initial session load failed", error);
        toast.danger(getIdentityErrorMessage(error));
      })
      .finally(() => {
        if (mounted) setIsLoading(false);
      });

    const subscription = identityService.onAuthStateChange((event, nextSession) => {
      logIdentityDebug("auth state changed", { event, userId: nextSession?.user.id ?? null });
      loadIdentity(nextSession).catch((error) => {
        logIdentityError("auth state identity load failed", error, {
          userId: nextSession?.user.id ?? null,
        });
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
      avatarUrl,
      isLoading,
      refreshIdentity,
      signIn: async (email, password) => {
        const nextSession = await identityService.signIn(email, password);
        await loadIdentity(nextSession);
      },
      sendPasswordRecovery: (email) => identityService.sendPasswordRecovery(email),
      updatePassword: (password, currentPassword) =>
        identityService.updatePassword(password, currentPassword),
      signOut: async (scope = "local") => {
        await identityService.signOut(scope);
        setSession(null);
        setProfile(null);
        setPreferences(null);
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
        setProfile(nextProfile);
        setAvatarUrl(await identityService.getAvatarUrl(nextProfile.avatarPath));
      },
    }),
    [avatarUrl, isLoading, loadIdentity, preferences, profile, refreshIdentity, session],
  );

  return <IdentityContext.Provider value={value}>{children}</IdentityContext.Provider>;
}
