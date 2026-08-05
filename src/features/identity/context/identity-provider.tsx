import { type ReactNode, useCallback, useEffect, useMemo, useState } from "react";
import {
  IdentityContext,
  type IdentityContextValue,
} from "@/features/identity/context/identity-context";
import { identityService } from "@/features/identity/services/identity.service";
import type { AuthSession, IdentityPreferences, IdentityProfile } from "@/features/identity/types";
import { toast } from "@/shared/components/toast";

function getIdentityErrorMessage(error: unknown) {
  return error instanceof Error ? error.message : "Não foi possível concluir a operação.";
}

export function IdentityProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<AuthSession | null>(null);
  const [profile, setProfile] = useState<IdentityProfile | null>(null);
  const [preferences, setPreferences] = useState<IdentityPreferences | null>(null);
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const loadIdentity = useCallback(async (nextSession: AuthSession | null) => {
    setSession(nextSession);

    if (!nextSession) {
      setProfile(null);
      setPreferences(null);
      setAvatarUrl(null);
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
        if (!nextProfile) return;
        setProfile(nextProfile);
        setAvatarUrl(await identityService.getAvatarUrl(nextProfile.avatarPath));
      },
    }),
    [avatarUrl, isLoading, loadIdentity, preferences, profile, refreshIdentity, session],
  );

  return <IdentityContext.Provider value={value}>{children}</IdentityContext.Provider>;
}
