import type { AuthChangeEvent, Session, SignOut } from "@supabase/supabase-js";
import type {
  IdentityPreferences,
  IdentityProfile,
  NotificationPreferences,
  PreferencesUpdatePayload,
  ProfileUpdatePayload,
} from "@/features/identity/types";
import {
  detectBrowserLanguage,
  detectTimeZone,
  getSiteUrl,
} from "@/features/identity/utils/environment";
import { RepositoryError } from "@/shared/api/errors";
import { getSupabaseClient } from "@/shared/lib/supabase/client";
import type { Database, Json } from "@/shared/types/database";

type UserProfileRow = Database["public"]["Tables"]["user_profiles"]["Row"];
type UserPreferencesRow = Database["public"]["Tables"]["user_preferences"]["Row"];

const AVATAR_BUCKET = "avatars";

function requireSupabase() {
  const supabase = getSupabaseClient();

  if (!supabase) {
    throw new RepositoryError("Supabase não está configurado para autenticação.");
  }

  return supabase;
}

function defaultNotifications(): NotificationPreferences {
  return {
    productUpdates: true,
    securityAlerts: true,
    operationalReports: false,
  };
}

function mapProfile(row: UserProfileRow): IdentityProfile {
  return {
    id: row.id,
    authUserId: row.auth_user_id,
    firstName: row.first_name ?? "",
    lastName: row.last_name ?? "",
    phone: row.phone ?? "",
    jobTitle: row.job_title ?? "",
    companyName: row.company_name ?? "",
    avatarPath: row.avatar_path,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    deletedAt: row.deleted_at,
    createdBy: row.created_by,
    updatedBy: row.updated_by,
  };
}

function mapNotifications(value: Json): NotificationPreferences {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return defaultNotifications();
  }

  return {
    productUpdates: Boolean(value["productUpdates"]),
    securityAlerts: Boolean(value["securityAlerts"]),
    operationalReports: Boolean(value["operationalReports"]),
  };
}

function mapPreferences(row: UserPreferencesRow): IdentityPreferences {
  return {
    id: row.id,
    authUserId: row.auth_user_id,
    theme: row.theme,
    language: row.language,
    timeZone: row.time_zone,
    dateFormat: row.date_format,
    timeFormat: row.time_format,
    currency: row.currency,
    notifications: mapNotifications(row.notifications),
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    deletedAt: row.deleted_at,
    createdBy: row.created_by,
    updatedBy: row.updated_by,
  };
}

function safeFileName(fileName: string) {
  return fileName
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-zA-Z0-9._-]/g, "-")
    .toLowerCase();
}

export const identityRepository = {
  getSession: async () => {
    const supabase = requireSupabase();
    const { data, error } = await supabase.auth.getSession();

    if (error) {
      throw new RepositoryError("Não foi possível carregar a sessão.", { cause: error });
    }

    return data.session;
  },

  onAuthStateChange: (callback: (event: AuthChangeEvent, session: Session | null) => void) => {
    const supabase = requireSupabase();
    return supabase.auth.onAuthStateChange(callback).data.subscription;
  },

  signInWithPassword: async (email: string, password: string) => {
    const supabase = requireSupabase();
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });

    if (error) {
      throw new RepositoryError("Não foi possível entrar com estes dados.", { cause: error });
    }

    return data.session;
  },

  sendPasswordRecovery: async (email: string) => {
    const supabase = requireSupabase();
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${getSiteUrl()}/redefinir-senha`,
    });

    if (error) {
      throw new RepositoryError("Não foi possível enviar a recuperação de senha.", {
        cause: error,
      });
    }
  },

  updatePassword: async (password: string, currentPassword?: string) => {
    const supabase = requireSupabase();
    const { error } = await supabase.auth.updateUser({
      password,
      ...(currentPassword ? { current_password: currentPassword } : {}),
    });

    if (error) {
      throw new RepositoryError("Não foi possível alterar a senha.", { cause: error });
    }
  },

  signOut: async (scope: SignOut["scope"] = "local") => {
    const supabase = requireSupabase();
    const { error } = await supabase.auth.signOut({ scope });

    if (error) {
      throw new RepositoryError("Não foi possível encerrar a sessão.", { cause: error });
    }
  },

  ensureIdentityRecords: async (session: Session) => {
    const supabase = requireSupabase();
    const authUserId = session.user.id;
    const metadata = session.user.user_metadata;
    const firstName = typeof metadata["first_name"] === "string" ? metadata["first_name"] : "";
    const lastName = typeof metadata["last_name"] === "string" ? metadata["last_name"] : "";

    const [profileResult, preferencesResult] = await Promise.all([
      supabase.from("user_profiles").upsert(
        {
          auth_user_id: authUserId,
          first_name: firstName,
          last_name: lastName,
          created_by: authUserId,
          updated_by: authUserId,
        },
        { onConflict: "auth_user_id", ignoreDuplicates: true },
      ),
      supabase.from("user_preferences").upsert(
        {
          auth_user_id: authUserId,
          language: detectBrowserLanguage(),
          time_zone: detectTimeZone(),
          notifications: defaultNotifications(),
          created_by: authUserId,
          updated_by: authUserId,
        },
        { onConflict: "auth_user_id", ignoreDuplicates: true },
      ),
    ]);

    if (profileResult.error) {
      throw new RepositoryError("Não foi possível preparar o perfil do usuário.", {
        cause: profileResult.error,
      });
    }

    if (preferencesResult.error) {
      throw new RepositoryError("Não foi possível preparar as preferências do usuário.", {
        cause: preferencesResult.error,
      });
    }
  },

  getProfile: async (authUserId: string) => {
    const supabase = requireSupabase();
    const { data, error } = await supabase
      .from("user_profiles")
      .select("*")
      .eq("auth_user_id", authUserId)
      .is("deleted_at", null)
      .maybeSingle();

    if (error) {
      throw new RepositoryError("Não foi possível carregar o perfil.", { cause: error });
    }

    return data ? mapProfile(data) : null;
  },

  getPreferences: async (authUserId: string) => {
    const supabase = requireSupabase();
    const { data, error } = await supabase
      .from("user_preferences")
      .select("*")
      .eq("auth_user_id", authUserId)
      .is("deleted_at", null)
      .maybeSingle();

    if (error) {
      throw new RepositoryError("Não foi possível carregar as preferências.", { cause: error });
    }

    return data ? mapPreferences(data) : null;
  },

  updateProfile: async (authUserId: string, payload: ProfileUpdatePayload) => {
    const supabase = requireSupabase();
    const { data, error } = await supabase
      .from("user_profiles")
      .update({
        first_name: payload.firstName,
        last_name: payload.lastName,
        phone: payload.phone,
        job_title: payload.jobTitle,
        company_name: payload.companyName,
        updated_by: authUserId,
      })
      .eq("auth_user_id", authUserId)
      .is("deleted_at", null)
      .select("*")
      .single();

    if (error) {
      throw new RepositoryError("Não foi possível salvar o perfil.", { cause: error });
    }

    await supabase.auth.updateUser({
      data: {
        first_name: payload.firstName,
        last_name: payload.lastName,
      },
    });

    return mapProfile(data);
  },

  updatePreferences: async (authUserId: string, payload: PreferencesUpdatePayload) => {
    const supabase = requireSupabase();
    const { data, error } = await supabase
      .from("user_preferences")
      .update({
        theme: payload.theme,
        language: payload.language,
        time_zone: payload.timeZone,
        date_format: payload.dateFormat,
        time_format: payload.timeFormat,
        currency: payload.currency,
        notifications: payload.notifications,
        updated_by: authUserId,
      })
      .eq("auth_user_id", authUserId)
      .is("deleted_at", null)
      .select("*")
      .single();

    if (error) {
      throw new RepositoryError("Não foi possível salvar as preferências.", { cause: error });
    }

    return mapPreferences(data);
  },

  uploadAvatar: async (authUserId: string, file: File) => {
    const supabase = requireSupabase();
    const path = `${authUserId}/${crypto.randomUUID()}-${safeFileName(file.name)}`;
    const { error: uploadError } = await supabase.storage
      .from(AVATAR_BUCKET)
      .upload(path, file, { upsert: true });

    if (uploadError) {
      throw new RepositoryError("Não foi possível enviar a foto.", { cause: uploadError });
    }

    const { data, error } = await supabase
      .from("user_profiles")
      .update({ avatar_path: path, updated_by: authUserId })
      .eq("auth_user_id", authUserId)
      .is("deleted_at", null)
      .select("*")
      .single();

    if (error) {
      throw new RepositoryError("Não foi possível salvar a foto no perfil.", { cause: error });
    }

    return mapProfile(data);
  },

  getAvatarUrl: async (avatarPath: string | null) => {
    if (!avatarPath) return null;

    const supabase = requireSupabase();
    const { data, error } = await supabase.storage
      .from(AVATAR_BUCKET)
      .createSignedUrl(avatarPath, 60 * 60);

    if (error) {
      throw new RepositoryError("Não foi possível carregar a foto do perfil.", { cause: error });
    }

    return data.signedUrl;
  },
};
