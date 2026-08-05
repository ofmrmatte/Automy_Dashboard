export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

type AuditColumns = {
  id: string;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
  created_by: string | null;
  updated_by: string | null;
};

type AuditInsertColumns = {
  id?: string;
  created_at?: string;
  updated_at?: string;
  deleted_at?: string | null;
  created_by?: string | null;
  updated_by?: string | null;
};

type AuditUpdateColumns = Partial<AuditInsertColumns>;

export type Database = {
  public: {
    Tables: {
      user: {
        Row: {
          id: string;
          name: string;
          email: string;
          emailVerified: boolean;
          image: string | null;
          role: "admin" | "manager" | "operator" | "read_only";
          status: "active" | "inactive" | "invited" | "suspended";
          last_login: string | null;
          createdAt: string;
          updatedAt: string;
          deleted_at: string | null;
        };
        Insert: {
          id?: string;
          name: string;
          email: string;
          emailVerified?: boolean;
          image?: string | null;
          role?: "admin" | "manager" | "operator" | "read_only";
          status?: "active" | "inactive" | "invited" | "suspended";
          last_login?: string | null;
          createdAt?: string;
          updatedAt?: string;
          deleted_at?: string | null;
        };
        Update: {
          id?: string;
          name?: string;
          email?: string;
          emailVerified?: boolean;
          image?: string | null;
          role?: "admin" | "manager" | "operator" | "read_only";
          status?: "active" | "inactive" | "invited" | "suspended";
          last_login?: string | null;
          createdAt?: string;
          updatedAt?: string;
          deleted_at?: string | null;
        };
        Relationships: [];
      };
      companies: {
        Row: AuditColumns & {
          legal_name: string;
          trade_name: string | null;
          document: string | null;
          email: string | null;
          phone: string | null;
          status: string;
          time_zone: string;
          state_registration: string | null;
          municipal_registration: string | null;
          website: string | null;
          description: string | null;
          segment: string | null;
          postal_code: string | null;
          street: string | null;
          number: string | null;
          complement: string | null;
          district: string | null;
          city: string | null;
          state: string | null;
          country: string;
          default_language: string;
          default_currency: string;
          date_format: string;
          time_format: "24h" | "12h";
          first_day_of_week: number;
          business_hours: Json;
          default_contract_term_days: number;
          default_billing_term_days: number;
          logo_url: string | null;
          favicon_url: string | null;
          display_name: string | null;
          billing_legal_name: string | null;
          billing_document: string | null;
          billing_email: string | null;
          billing_phone: string | null;
          billing_address: Json;
        };
        Insert: AuditInsertColumns & {
          legal_name: string;
          trade_name?: string | null;
          document?: string | null;
          email?: string | null;
          phone?: string | null;
          status?: string;
          time_zone?: string;
          state_registration?: string | null;
          municipal_registration?: string | null;
          website?: string | null;
          description?: string | null;
          segment?: string | null;
          postal_code?: string | null;
          street?: string | null;
          number?: string | null;
          complement?: string | null;
          district?: string | null;
          city?: string | null;
          state?: string | null;
          country?: string;
          default_language?: string;
          default_currency?: string;
          date_format?: string;
          time_format?: "24h" | "12h";
          first_day_of_week?: number;
          business_hours?: Json;
          default_contract_term_days?: number;
          default_billing_term_days?: number;
          logo_url?: string | null;
          favicon_url?: string | null;
          display_name?: string | null;
          billing_legal_name?: string | null;
          billing_document?: string | null;
          billing_email?: string | null;
          billing_phone?: string | null;
          billing_address?: Json;
        };
        Update: AuditUpdateColumns & {
          legal_name?: string;
          trade_name?: string | null;
          document?: string | null;
          email?: string | null;
          phone?: string | null;
          status?: string;
          time_zone?: string;
          state_registration?: string | null;
          municipal_registration?: string | null;
          website?: string | null;
          description?: string | null;
          segment?: string | null;
          postal_code?: string | null;
          street?: string | null;
          number?: string | null;
          complement?: string | null;
          district?: string | null;
          city?: string | null;
          state?: string | null;
          country?: string;
          default_language?: string;
          default_currency?: string;
          date_format?: string;
          time_format?: "24h" | "12h";
          first_day_of_week?: number;
          business_hours?: Json;
          default_contract_term_days?: number;
          default_billing_term_days?: number;
          logo_url?: string | null;
          favicon_url?: string | null;
          display_name?: string | null;
          billing_legal_name?: string | null;
          billing_document?: string | null;
          billing_email?: string | null;
          billing_phone?: string | null;
          billing_address?: Json;
        };
        Relationships: [];
      };
      users: {
        Row: AuditColumns & {
          company_id: string;
          auth_user_id: string | null;
          role_id: string | null;
          name: string;
          email: string;
          status: string;
        };
        Insert: AuditInsertColumns & {
          company_id: string;
          auth_user_id?: string | null;
          role_id?: string | null;
          name: string;
          email: string;
          status?: string;
        };
        Update: AuditUpdateColumns & {
          company_id?: string;
          auth_user_id?: string | null;
          role_id?: string | null;
          name?: string;
          email?: string;
          status?: string;
        };
        Relationships: [];
      };
      roles: {
        Row: AuditColumns & {
          company_id: string | null;
          key: string;
          name: string;
          description: string | null;
          is_system: boolean;
        };
        Insert: AuditInsertColumns & {
          company_id?: string | null;
          key: string;
          name: string;
          description?: string | null;
          is_system?: boolean;
        };
        Update: AuditUpdateColumns & {
          company_id?: string | null;
          key?: string;
          name?: string;
          description?: string | null;
          is_system?: boolean;
        };
        Relationships: [];
      };
      permissions: {
        Row: AuditColumns & {
          key: string;
          name: string;
          description: string | null;
        };
        Insert: AuditInsertColumns & {
          key: string;
          name: string;
          description?: string | null;
        };
        Update: AuditUpdateColumns & {
          key?: string;
          name?: string;
          description?: string | null;
        };
        Relationships: [];
      };
      role_permissions: {
        Row: AuditColumns & {
          role_id: string;
          permission_id: string;
        };
        Insert: AuditInsertColumns & {
          role_id: string;
          permission_id: string;
        };
        Update: AuditUpdateColumns & {
          role_id?: string;
          permission_id?: string;
        };
        Relationships: [];
      };
      user_profiles: {
        Row: AuditColumns & {
          auth_user_id: string;
          first_name: string | null;
          last_name: string | null;
          phone: string | null;
          job_title: string | null;
          company_name: string | null;
          avatar_path: string | null;
          avatar_mime_type: string | null;
          avatar_size: number | null;
          avatar_updated_at: string | null;
        };
        Insert: AuditInsertColumns & {
          auth_user_id: string;
          first_name?: string | null;
          last_name?: string | null;
          phone?: string | null;
          job_title?: string | null;
          company_name?: string | null;
          avatar_path?: string | null;
          avatar_mime_type?: string | null;
          avatar_size?: number | null;
          avatar_updated_at?: string | null;
        };
        Update: AuditUpdateColumns & {
          auth_user_id?: string;
          first_name?: string | null;
          last_name?: string | null;
          phone?: string | null;
          job_title?: string | null;
          company_name?: string | null;
          avatar_path?: string | null;
          avatar_mime_type?: string | null;
          avatar_size?: number | null;
          avatar_updated_at?: string | null;
        };
        Relationships: [];
      };
      user_preferences: {
        Row: AuditColumns & {
          auth_user_id: string;
          theme: "system" | "light" | "dark";
          language: string;
          time_zone: string;
          date_format: string;
          time_format: "24h" | "12h";
          currency: string;
          first_day_of_week: number;
          notifications: Json;
        };
        Insert: AuditInsertColumns & {
          auth_user_id: string;
          theme?: "system" | "light" | "dark";
          language?: string;
          time_zone?: string;
          date_format?: string;
          time_format?: "24h" | "12h";
          currency?: string;
          first_day_of_week?: number;
          notifications?: Json;
        };
        Update: AuditUpdateColumns & {
          auth_user_id?: string;
          theme?: "system" | "light" | "dark";
          language?: string;
          time_zone?: string;
          date_format?: string;
          time_format?: "24h" | "12h";
          currency?: string;
          first_day_of_week?: number;
          notifications?: Json;
        };
        Relationships: [];
      };
      company_security_settings: {
        Row: AuditColumns & {
          company_id: string;
          session_duration_days: number;
          require_password_change_on_first_login: boolean;
          min_password_length: number;
          lockout_attempts: number;
          lockout_duration_minutes: number;
          allow_multiple_sessions: boolean;
          require_email_verified: boolean;
          mfa_status: string;
        };
        Insert: AuditInsertColumns & {
          company_id: string;
          session_duration_days?: number;
          require_password_change_on_first_login?: boolean;
          min_password_length?: number;
          lockout_attempts?: number;
          lockout_duration_minutes?: number;
          allow_multiple_sessions?: boolean;
          require_email_verified?: boolean;
          mfa_status?: string;
        };
        Update: AuditUpdateColumns &
          Partial<
            Omit<
              Database["public"]["Tables"]["company_security_settings"]["Insert"],
              keyof AuditInsertColumns
            >
          >;
        Relationships: [];
      };
      login_history: {
        Row: AuditColumns & {
          company_id: string | null;
          auth_user_id: string | null;
          success: boolean;
          ip_address: string | null;
          user_agent: string | null;
          origin: string | null;
          failure_reason: string | null;
        };
        Insert: AuditInsertColumns & {
          company_id?: string | null;
          auth_user_id?: string | null;
          success: boolean;
          ip_address?: string | null;
          user_agent?: string | null;
          origin?: string | null;
          failure_reason?: string | null;
        };
        Update: AuditUpdateColumns &
          Partial<
            Omit<Database["public"]["Tables"]["login_history"]["Insert"], keyof AuditInsertColumns>
          >;
        Relationships: [];
      };
      company_integrations: {
        Row: AuditColumns & {
          company_id: string;
          provider: string;
          type: string;
          status: string;
          environment: string;
          public_config: Json;
          encrypted_config_ref: string | null;
          last_checked_at: string | null;
          last_success_at: string | null;
          last_error: string | null;
        };
        Insert: AuditInsertColumns & {
          company_id: string;
          provider: string;
          type: string;
          status?: string;
          environment?: string;
          public_config?: Json;
          encrypted_config_ref?: string | null;
          last_checked_at?: string | null;
          last_success_at?: string | null;
          last_error?: string | null;
        };
        Update: AuditUpdateColumns &
          Partial<
            Omit<
              Database["public"]["Tables"]["company_integrations"]["Insert"],
              keyof AuditInsertColumns
            >
          >;
        Relationships: [];
      };
      company_notification_settings: {
        Row: AuditColumns & {
          company_id: string;
          in_app_enabled: boolean;
          email_enabled: boolean;
          default_sender: string | null;
          contract_notice_days: number;
          billing_notice_days: number;
          agenda_reminder_minutes: number;
          sla_warning_hours: number;
          critical_alerts_enabled: boolean;
          quiet_hours: Json;
          timezone: string;
        };
        Insert: AuditInsertColumns & {
          company_id: string;
          in_app_enabled?: boolean;
          email_enabled?: boolean;
          default_sender?: string | null;
          contract_notice_days?: number;
          billing_notice_days?: number;
          agenda_reminder_minutes?: number;
          sla_warning_hours?: number;
          critical_alerts_enabled?: boolean;
          quiet_hours?: Json;
          timezone?: string;
        };
        Update: AuditUpdateColumns &
          Partial<
            Omit<
              Database["public"]["Tables"]["company_notification_settings"]["Insert"],
              keyof AuditInsertColumns
            >
          >;
        Relationships: [];
      };
      notification_preferences: {
        Row: AuditColumns & {
          company_id: string;
          auth_user_id: string;
          in_app: boolean;
          email: boolean;
          contracts: boolean;
          billing: boolean;
          tickets: boolean;
          agenda: boolean;
          security: boolean;
          admin_updates: boolean;
          daily_summary: boolean;
          weekly_summary: boolean;
        };
        Insert: AuditInsertColumns & {
          company_id: string;
          auth_user_id: string;
          in_app?: boolean;
          email?: boolean;
          contracts?: boolean;
          billing?: boolean;
          tickets?: boolean;
          agenda?: boolean;
          security?: boolean;
          admin_updates?: boolean;
          daily_summary?: boolean;
          weekly_summary?: boolean;
        };
        Update: AuditUpdateColumns &
          Partial<
            Omit<
              Database["public"]["Tables"]["notification_preferences"]["Insert"],
              keyof AuditInsertColumns
            >
          >;
        Relationships: [];
      };
      notifications: {
        Row: AuditColumns & {
          company_id: string;
          auth_user_id: string | null;
          title: string;
          description: string | null;
          type: string;
          status: "unread" | "read" | "archived";
          related_entity_type: string | null;
          related_entity_id: string | null;
          href: string | null;
          read_at: string | null;
          archived_at: string | null;
        };
        Insert: AuditInsertColumns & {
          company_id: string;
          auth_user_id?: string | null;
          title: string;
          description?: string | null;
          type?: string;
          status?: "unread" | "read" | "archived";
          related_entity_type?: string | null;
          related_entity_id?: string | null;
          href?: string | null;
          read_at?: string | null;
          archived_at?: string | null;
        };
        Update: AuditUpdateColumns &
          Partial<
            Omit<Database["public"]["Tables"]["notifications"]["Insert"], keyof AuditInsertColumns>
          >;
        Relationships: [];
      };
      notification_deliveries: {
        Row: AuditColumns & {
          notification_id: string;
          channel: "in_app" | "email";
          status: "pending" | "sent" | "failed" | "skipped";
          provider: string | null;
          provider_message_id: string | null;
          last_error: string | null;
          sent_at: string | null;
        };
        Insert: AuditInsertColumns & {
          notification_id: string;
          channel: "in_app" | "email";
          status?: "pending" | "sent" | "failed" | "skipped";
          provider?: string | null;
          provider_message_id?: string | null;
          last_error?: string | null;
          sent_at?: string | null;
        };
        Update: AuditUpdateColumns &
          Partial<
            Omit<
              Database["public"]["Tables"]["notification_deliveries"]["Insert"],
              keyof AuditInsertColumns
            >
          >;
        Relationships: [];
      };
      clients: {
        Row: AuditColumns & {
          company_id: string;
          legal_name: string;
          trade_name: string | null;
          document: string | null;
          state_registration: string | null;
          municipal_registration: string | null;
          segment: string | null;
          email: string | null;
          phone: string | null;
          website: string | null;
          notes: string | null;
          logo_url: string | null;
          city: string | null;
          state: string | null;
          owner_user_id: string | null;
          status: string;
        };
        Insert: AuditInsertColumns & {
          company_id: string;
          legal_name: string;
          trade_name?: string | null;
          document?: string | null;
          state_registration?: string | null;
          municipal_registration?: string | null;
          segment?: string | null;
          email?: string | null;
          phone?: string | null;
          website?: string | null;
          notes?: string | null;
          logo_url?: string | null;
          city?: string | null;
          state?: string | null;
          owner_user_id?: string | null;
          status?: string;
        };
        Update: AuditUpdateColumns & {
          company_id?: string;
          legal_name?: string;
          trade_name?: string | null;
          document?: string | null;
          state_registration?: string | null;
          municipal_registration?: string | null;
          segment?: string | null;
          email?: string | null;
          phone?: string | null;
          website?: string | null;
          notes?: string | null;
          logo_url?: string | null;
          city?: string | null;
          state?: string | null;
          owner_user_id?: string | null;
          status?: string;
        };
        Relationships: [];
      };
      contacts: {
        Row: AuditColumns & {
          company_id: string;
          client_id: string | null;
          name: string;
          email: string | null;
          phone: string | null;
          role: string | null;
          is_primary: boolean;
        };
        Insert: AuditInsertColumns & {
          company_id: string;
          client_id?: string | null;
          name: string;
          email?: string | null;
          phone?: string | null;
          role?: string | null;
          is_primary?: boolean;
        };
        Update: AuditUpdateColumns & {
          company_id?: string;
          client_id?: string | null;
          name?: string;
          email?: string | null;
          phone?: string | null;
          role?: string | null;
          is_primary?: boolean;
        };
        Relationships: [];
      };
      addresses: {
        Row: AuditColumns & {
          company_id: string;
          client_id: string | null;
          label: string | null;
          street: string | null;
          number: string | null;
          complement: string | null;
          district: string | null;
          city: string | null;
          state: string | null;
          postal_code: string | null;
          country: string;
        };
        Insert: AuditInsertColumns & {
          company_id: string;
          client_id?: string | null;
          label?: string | null;
          street?: string | null;
          number?: string | null;
          complement?: string | null;
          district?: string | null;
          city?: string | null;
          state?: string | null;
          postal_code?: string | null;
          country?: string;
        };
        Update: AuditUpdateColumns & {
          company_id?: string;
          client_id?: string | null;
          label?: string | null;
          street?: string | null;
          number?: string | null;
          complement?: string | null;
          district?: string | null;
          city?: string | null;
          state?: string | null;
          postal_code?: string | null;
          country?: string;
        };
        Relationships: [];
      };
      products: {
        Row: AuditColumns & {
          company_id: string;
          name: string;
          category: string | null;
          version: string | null;
          description: string | null;
          status: string;
          base_price: number | null;
          billing_mode: string | null;
          notes: string | null;
          commercial_terms: Json | null;
          contract_template: string | null;
        };
        Insert: AuditInsertColumns & {
          company_id: string;
          name: string;
          category?: string | null;
          version?: string | null;
          description?: string | null;
          status?: string;
          base_price?: number | null;
          billing_mode?: string | null;
          notes?: string | null;
          commercial_terms?: Json | null;
          contract_template?: string | null;
        };
        Update: AuditUpdateColumns & {
          company_id?: string;
          name?: string;
          category?: string | null;
          version?: string | null;
          description?: string | null;
          status?: string;
          base_price?: number | null;
          billing_mode?: string | null;
          notes?: string | null;
          commercial_terms?: Json | null;
          contract_template?: string | null;
        };
        Relationships: [];
      };
      contracts: {
        Row: AuditColumns & {
          company_id: string;
          client_id: string;
          product_id: string | null;
          name: string | null;
          monthly_value: number | null;
          implementation_value: number | null;
          starts_at: string | null;
          ends_at: string | null;
          renewal_at: string | null;
          billing_period: string | null;
          status: string;
          client: { trade_name: string | null; legal_name: string } | null;
          product: { name: string } | null;
          signer_name: string | null;
          witness_name: string | null;
          contract_text: string | null;
          notes: string | null;
          cancelled_at: string | null;
          ended_at: string | null;
        };
        Insert: AuditInsertColumns & {
          company_id: string;
          client_id: string;
          product_id?: string | null;
          name?: string | null;
          monthly_value?: number | null;
          implementation_value?: number | null;
          starts_at?: string | null;
          ends_at?: string | null;
          renewal_at?: string | null;
          billing_period?: string | null;
          status?: string;
          signer_name?: string | null;
          witness_name?: string | null;
          contract_text?: string | null;
          notes?: string | null;
          cancelled_at?: string | null;
          ended_at?: string | null;
        };
        Update: AuditUpdateColumns & {
          company_id?: string;
          client_id?: string;
          product_id?: string | null;
          name?: string | null;
          monthly_value?: number | null;
          implementation_value?: number | null;
          starts_at?: string | null;
          ends_at?: string | null;
          renewal_at?: string | null;
          billing_period?: string | null;
          status?: string;
          signer_name?: string | null;
          witness_name?: string | null;
          contract_text?: string | null;
          notes?: string | null;
          cancelled_at?: string | null;
          ended_at?: string | null;
        };
        Relationships: [];
      };
      contract_items: {
        Row: AuditColumns & {
          company_id: string;
          contract_id: string;
          product_id: string | null;
          name: string;
          quantity: number;
          unit_price: number;
          monthly_value: number;
        };
        Insert: AuditInsertColumns & {
          company_id: string;
          contract_id: string;
          product_id?: string | null;
          name: string;
          quantity?: number;
          unit_price?: number;
          monthly_value?: number;
        };
        Update: AuditUpdateColumns & {
          company_id?: string;
          contract_id?: string;
          product_id?: string | null;
          name?: string;
          quantity?: number;
          unit_price?: number;
          monthly_value?: number;
        };
        Relationships: [];
      };
      charges: {
        Row: AuditColumns & {
          company_id: string | null;
          contract_id: string | null;
          client_id: string | null;
          invoice: string;
          client_name: string;
          due_date: string | null;
          amount: number;
          method: string;
          status: "Pago" | "Pendente" | "Atrasado";
          provider: string;
          provider_topic: string | null;
          provider_action: string | null;
          provider_payment_id: string | null;
          provider_subscription_id: string | null;
          provider_status: string | null;
          external_reference: string | null;
          paid_at: string | null;
          pending_at: string | null;
          last_notification_at: string;
          payload: Json;
        };
        Insert: AuditInsertColumns & {
          company_id?: string | null;
          contract_id?: string | null;
          client_id?: string | null;
          invoice: string;
          client_name?: string;
          due_date?: string | null;
          amount?: number;
          method?: string;
          status?: "Pago" | "Pendente" | "Atrasado";
          provider?: string;
          provider_topic?: string | null;
          provider_action?: string | null;
          provider_payment_id?: string | null;
          provider_subscription_id?: string | null;
          provider_status?: string | null;
          external_reference?: string | null;
          paid_at?: string | null;
          pending_at?: string | null;
          last_notification_at?: string;
          payload?: Json;
        };
        Update: AuditUpdateColumns & {
          company_id?: string | null;
          contract_id?: string | null;
          client_id?: string | null;
          invoice?: string;
          client_name?: string;
          due_date?: string | null;
          amount?: number;
          method?: string;
          status?: "Pago" | "Pendente" | "Atrasado";
          provider?: string;
          provider_topic?: string | null;
          provider_action?: string | null;
          provider_payment_id?: string | null;
          provider_subscription_id?: string | null;
          provider_status?: string | null;
          external_reference?: string | null;
          paid_at?: string | null;
          pending_at?: string | null;
          last_notification_at?: string;
          payload?: Json;
        };
        Relationships: [];
      };
      activity_logs: {
        Row: AuditColumns & {
          company_id: string;
          actor_user_id: string | null;
          entity_type: string;
          entity_id: string | null;
          action: string;
          metadata: Json;
        };
        Insert: AuditInsertColumns & {
          company_id: string;
          actor_user_id?: string | null;
          entity_type: string;
          entity_id?: string | null;
          action: string;
          metadata?: Json;
        };
        Update: AuditUpdateColumns & {
          company_id?: string;
          actor_user_id?: string | null;
          entity_type?: string;
          entity_id?: string | null;
          action?: string;
          metadata?: Json;
        };
        Relationships: [];
      };
      audit_logs: {
        Row: AuditColumns & {
          company_id: string | null;
          actor_auth_user_id: string | null;
          action: string;
          resource_type: string;
          resource_id: string | null;
          metadata: Json;
        };
        Insert: AuditInsertColumns & {
          company_id?: string | null;
          actor_auth_user_id?: string | null;
          action: string;
          resource_type: string;
          resource_id?: string | null;
          metadata?: Json;
        };
        Update: AuditUpdateColumns & {
          company_id?: string | null;
          actor_auth_user_id?: string | null;
          action?: string;
          resource_type?: string;
          resource_id?: string | null;
          metadata?: Json;
        };
        Relationships: [];
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
};
