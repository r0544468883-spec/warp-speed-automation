export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      automation_wiki: {
        Row: {
          automation_json: Json | null
          category: string | null
          created_at: string
          description: string | null
          id: string
          proof_count: number
          source_type: string | null
          source_url: string | null
          tags: string[] | null
          tool_name: string
          updated_at: string
          use_case: string
        }
        Insert: {
          automation_json?: Json | null
          category?: string | null
          created_at?: string
          description?: string | null
          id?: string
          proof_count?: number
          source_type?: string | null
          source_url?: string | null
          tags?: string[] | null
          tool_name: string
          updated_at?: string
          use_case: string
        }
        Update: {
          automation_json?: Json | null
          category?: string | null
          created_at?: string
          description?: string | null
          id?: string
          proof_count?: number
          source_type?: string | null
          source_url?: string | null
          tags?: string[] | null
          tool_name?: string
          updated_at?: string
          use_case?: string
        }
        Relationships: []
      }
      benchmarks: {
        Row: {
          architecture_json: Json | null
          company_name: string
          created_at: string
          department: string | null
          description: string | null
          id: string
          tools_used: string[] | null
          updated_at: string
        }
        Insert: {
          architecture_json?: Json | null
          company_name: string
          created_at?: string
          department?: string | null
          description?: string | null
          id?: string
          tools_used?: string[] | null
          updated_at?: string
        }
        Update: {
          architecture_json?: Json | null
          company_name?: string
          created_at?: string
          department?: string | null
          description?: string | null
          id?: string
          tools_used?: string[] | null
          updated_at?: string
        }
        Relationships: []
      }
      captured_events: {
        Row: {
          action_type: string
          app_name: string
          created_at: string
          event_data: Json | null
          fingerprint_hash: string | null
          id: string
          user_id: string
        }
        Insert: {
          action_type: string
          app_name: string
          created_at?: string
          event_data?: Json | null
          fingerprint_hash?: string | null
          id?: string
          user_id: string
        }
        Update: {
          action_type?: string
          app_name?: string
          created_at?: string
          event_data?: Json | null
          fingerprint_hash?: string | null
          id?: string
          user_id?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          display_name: string | null
          id: string
          industry_type: string | null
          onboarding_completed: boolean
          subscription_tier: Database["public"]["Enums"]["subscription_tier"]
          tool_stack: string[] | null
          total_saved_time: number
          updated_at: string
          user_id: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          display_name?: string | null
          id?: string
          industry_type?: string | null
          onboarding_completed?: boolean
          subscription_tier?: Database["public"]["Enums"]["subscription_tier"]
          tool_stack?: string[] | null
          total_saved_time?: number
          updated_at?: string
          user_id: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          display_name?: string | null
          id?: string
          industry_type?: string | null
          onboarding_completed?: boolean
          subscription_tier?: Database["public"]["Enums"]["subscription_tier"]
          tool_stack?: string[] | null
          total_saved_time?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      smart_audits: {
        Row: {
          ai_analysis_json: Json | null
          created_at: string
          id: string
          roi_projection_json: Json | null
          status: Database["public"]["Enums"]["audit_status"]
          updated_at: string
          user_id: string
          video_url: string | null
        }
        Insert: {
          ai_analysis_json?: Json | null
          created_at?: string
          id?: string
          roi_projection_json?: Json | null
          status?: Database["public"]["Enums"]["audit_status"]
          updated_at?: string
          user_id: string
          video_url?: string | null
        }
        Update: {
          ai_analysis_json?: Json | null
          created_at?: string
          id?: string
          roi_projection_json?: Json | null
          status?: Database["public"]["Enums"]["audit_status"]
          updated_at?: string
          user_id?: string
          video_url?: string | null
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
      webhook_settings: {
        Row: {
          created_at: string
          id: string
          make_webhook_url: string | null
          n8n_webhook_url: string | null
          updated_at: string
          user_id: string
          zapier_webhook_url: string | null
        }
        Insert: {
          created_at?: string
          id?: string
          make_webhook_url?: string | null
          n8n_webhook_url?: string | null
          updated_at?: string
          user_id: string
          zapier_webhook_url?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          make_webhook_url?: string | null
          n8n_webhook_url?: string | null
          updated_at?: string
          user_id?: string
          zapier_webhook_url?: string | null
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "admin" | "moderator" | "user"
      audit_status: "pending" | "processing" | "completed" | "failed"
      subscription_tier: "free" | "pro" | "enterprise"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      app_role: ["admin", "moderator", "user"],
      audit_status: ["pending", "processing", "completed", "failed"],
      subscription_tier: ["free", "pro", "enterprise"],
    },
  },
} as const
