import { queryOptions } from "@tanstack/react-query";
import { identityService } from "@/features/identity/services/identity.service";

export const identityQueryKeys = {
  profile: (authUserId: string) => ["identity", "profile", authUserId] as const,
  preferences: (authUserId: string) => ["identity", "preferences", authUserId] as const,
};

export function identityProfileQueryOptions(authUserId: string) {
  return queryOptions({
    queryKey: identityQueryKeys.profile(authUserId),
    queryFn: () => identityService.getProfile(authUserId),
    enabled: typeof window !== "undefined",
  });
}

export function identityPreferencesQueryOptions(authUserId: string) {
  return queryOptions({
    queryKey: identityQueryKeys.preferences(authUserId),
    queryFn: () => identityService.getPreferences(authUserId),
    enabled: typeof window !== "undefined",
  });
}
