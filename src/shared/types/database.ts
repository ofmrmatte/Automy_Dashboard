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
      companies: {
        Row: AuditColumns & {
          legal_name: string;
          trade_name: string | null;
          document: string | null;
          email: string | null;
          phone: string | null;
          status: string;
        };
        Insert: AuditInsertColumns & {
          legal_name: string;
          trade_name?: string | null;
          document?: string | null;
          email?: string | null;
          phone?: string | null;
          status?: string;
        };
        Update: AuditUpdateColumns & {
          legal_name?: string;
          trade_name?: string | null;
          document?: string | null;
          email?: string | null;
          phone?: string | null;
          status?: string;
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
          name: string;
          description: string | null;
          is_system: boolean;
        };
        Insert: AuditInsertColumns & {
          company_id?: string | null;
          name: string;
          description?: string | null;
          is_system?: boolean;
        };
        Update: AuditUpdateColumns & {
          company_id?: string | null;
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
        };
        Insert: AuditInsertColumns & {
          auth_user_id: string;
          first_name?: string | null;
          last_name?: string | null;
          phone?: string | null;
          job_title?: string | null;
          company_name?: string | null;
          avatar_path?: string | null;
        };
        Update: AuditUpdateColumns & {
          auth_user_id?: string;
          first_name?: string | null;
          last_name?: string | null;
          phone?: string | null;
          job_title?: string | null;
          company_name?: string | null;
          avatar_path?: string | null;
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
          notifications?: Json;
        };
        Relationships: [];
      };
      clients: {
        Row: AuditColumns & {
          company_id: string;
          legal_name: string;
          trade_name: string | null;
          document: string | null;
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
        };
        Insert: AuditInsertColumns & {
          company_id: string;
          name: string;
          category?: string | null;
          version?: string | null;
          description?: string | null;
          status?: string;
        };
        Update: AuditUpdateColumns & {
          company_id?: string;
          name?: string;
          category?: string | null;
          version?: string | null;
          description?: string | null;
          status?: string;
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
          starts_at: string | null;
          ends_at: string | null;
          status: string;
          client: { trade_name: string | null; legal_name: string } | null;
          product: { name: string } | null;
        };
        Insert: AuditInsertColumns & {
          company_id: string;
          client_id: string;
          product_id?: string | null;
          name?: string | null;
          monthly_value?: number | null;
          starts_at?: string | null;
          ends_at?: string | null;
          status?: string;
        };
        Update: AuditUpdateColumns & {
          company_id?: string;
          client_id?: string;
          product_id?: string | null;
          name?: string | null;
          monthly_value?: number | null;
          starts_at?: string | null;
          ends_at?: string | null;
          status?: string;
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
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
};
