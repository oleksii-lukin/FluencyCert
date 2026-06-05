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
      certificate_claims: {
        Row: {
          admin_feedback: string | null
          background_template: string | null
          club_id: string | null
          created_at: string
          english_level: string | null
          hours_participated: number | null
          id: string
          pdf_template_id: string | null
          slug: string
          speaking_clubs_count: number | null
          status: string
          updated_at: string
          user_id: string
        }
        Insert: {
          admin_feedback?: string | null
          background_template?: string | null
          club_id?: string | null
          created_at?: string
          english_level?: string | null
          hours_participated?: number | null
          id?: string
          pdf_template_id?: string | null
          slug: string
          speaking_clubs_count?: number | null
          status?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          admin_feedback?: string | null
          background_template?: string | null
          club_id?: string | null
          created_at?: string
          english_level?: string | null
          hours_participated?: number | null
          id?: string
          pdf_template_id?: string | null
          slug?: string
          speaking_clubs_count?: number | null
          status?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "certificate_claims_club_id_fkey"
            columns: ["club_id"]
            isOneToOne: false
            referencedRelation: "speaking_clubs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "certificate_claims_pdf_template_id_fkey"
            columns: ["pdf_template_id"]
            isOneToOne: false
            referencedRelation: "pdf_templates"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "certificate_claims_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      certificate_feedback: {
        Row: {
          certificate_id: string
          created_at: string
          display_name_preference: string
          feedback_text: string
          id: string
          is_visible: boolean
          linkedin_url: string | null
          reviewer_id: string
          sort_order: number
          status: string
          updated_at: string
        }
        Insert: {
          certificate_id: string
          created_at?: string
          display_name_preference?: string
          feedback_text: string
          id?: string
          is_visible?: boolean
          linkedin_url?: string | null
          reviewer_id: string
          sort_order?: number
          status?: string
          updated_at?: string
        }
        Update: {
          certificate_id?: string
          created_at?: string
          display_name_preference?: string
          feedback_text?: string
          id?: string
          is_visible?: boolean
          linkedin_url?: string | null
          reviewer_id?: string
          sort_order?: number
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "certificate_feedback_certificate_id_fkey"
            columns: ["certificate_id"]
            isOneToOne: false
            referencedRelation: "certificate_claims"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "certificate_feedback_reviewer_id_fkey"
            columns: ["reviewer_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      certificate_upvotes: {
        Row: {
          certificate_id: string
          created_at: string
          id: string
          user_id: string
        }
        Insert: {
          certificate_id: string
          created_at?: string
          id?: string
          user_id: string
        }
        Update: {
          certificate_id?: string
          created_at?: string
          id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "certificate_upvotes_certificate_id_fkey"
            columns: ["certificate_id"]
            isOneToOne: false
            referencedRelation: "certificate_claims"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "certificate_upvotes_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      club_memberships: {
        Row: {
          club_id: string
          created_at: string
          id: string
          role: string
          user_id: string
        }
        Insert: {
          club_id: string
          created_at?: string
          id?: string
          role?: string
          user_id: string
        }
        Update: {
          club_id?: string
          created_at?: string
          id?: string
          role?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "club_memberships_club_id_fkey"
            columns: ["club_id"]
            isOneToOne: false
            referencedRelation: "speaking_clubs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "club_memberships_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      pdf_custom_values: {
        Row: {
          claim_id: string
          created_at: string
          field_id: string
          id: string
          updated_at: string
          value: string
        }
        Insert: {
          claim_id: string
          created_at?: string
          field_id: string
          id?: string
          updated_at?: string
          value: string
        }
        Update: {
          claim_id?: string
          created_at?: string
          field_id?: string
          id?: string
          updated_at?: string
          value?: string
        }
        Relationships: [
          {
            foreignKeyName: "pdf_custom_values_claim_id_fkey"
            columns: ["claim_id"]
            isOneToOne: false
            referencedRelation: "certificate_claims"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pdf_custom_values_field_id_fkey"
            columns: ["field_id"]
            isOneToOne: false
            referencedRelation: "pdf_template_fields"
            referencedColumns: ["id"]
          },
        ]
      }
      pdf_template_fields: {
        Row: {
          created_at: string
          custom_default_value: string | null
          custom_overridable: boolean
          date_format: string | null
          display_label: string
          font_family: string
          font_size: number
          font_source: string
          id: string
          is_enabled: boolean
          level_format: string | null
          pdf_field_name: string
          qr_bg_color: string
          qr_corners_color: string
          qr_corners_type: string
          qr_dots_color: string
          qr_dots_type: string
          sort_order: number
          source_key: string | null
          source_type: string
          template_id: string
          text_color: string | null
          updated_at: string
          uploaded_font_key: string | null
        }
        Insert: {
          created_at?: string
          custom_default_value?: string | null
          custom_overridable?: boolean
          date_format?: string | null
          display_label: string
          font_family?: string
          font_size?: number
          font_source?: string
          id?: string
          is_enabled?: boolean
          level_format?: string | null
          pdf_field_name: string
          qr_bg_color?: string
          qr_corners_color?: string
          qr_corners_type?: string
          qr_dots_color?: string
          qr_dots_type?: string
          sort_order?: number
          source_key?: string | null
          source_type: string
          template_id: string
          text_color?: string | null
          updated_at?: string
          uploaded_font_key?: string | null
        }
        Update: {
          created_at?: string
          custom_default_value?: string | null
          custom_overridable?: boolean
          date_format?: string | null
          display_label?: string
          font_family?: string
          font_size?: number
          font_source?: string
          id?: string
          is_enabled?: boolean
          level_format?: string | null
          pdf_field_name?: string
          qr_bg_color?: string
          qr_corners_color?: string
          qr_corners_type?: string
          qr_dots_color?: string
          qr_dots_type?: string
          sort_order?: number
          source_key?: string | null
          source_type?: string
          template_id?: string
          text_color?: string | null
          updated_at?: string
          uploaded_font_key?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "pdf_template_fields_template_id_fkey"
            columns: ["template_id"]
            isOneToOne: false
            referencedRelation: "pdf_templates"
            referencedColumns: ["id"]
          },
        ]
      }
      pdf_templates: {
        Row: {
          club_id: string | null
          created_at: string
          description: string | null
          file_key: string
          file_url: string
          id: string
          name: string
          updated_at: string
        }
        Insert: {
          club_id?: string | null
          created_at?: string
          description?: string | null
          file_key: string
          file_url: string
          id?: string
          name: string
          updated_at?: string
        }
        Update: {
          club_id?: string | null
          created_at?: string
          description?: string | null
          file_key?: string
          file_url?: string
          id?: string
          name?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "pdf_templates_club_id_fkey"
            columns: ["club_id"]
            isOneToOne: false
            referencedRelation: "speaking_clubs"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          email: string
          first_name: string | null
          id: string
          is_admin: boolean
          last_name: string | null
          linkedin_url: string | null
          phone_number: string | null
          updated_at: string
          username: string | null
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          email: string
          first_name?: string | null
          id: string
          is_admin?: boolean
          last_name?: string | null
          linkedin_url?: string | null
          phone_number?: string | null
          updated_at?: string
          username?: string | null
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          email?: string
          first_name?: string | null
          id?: string
          is_admin?: boolean
          last_name?: string | null
          linkedin_url?: string | null
          phone_number?: string | null
          updated_at?: string
          username?: string | null
        }
        Relationships: []
      }
      speaking_clubs: {
        Row: {
          created_at: string
          description: string | null
          id: string
          name: string
          slug: string
          translations: Json
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          name: string
          slug: string
          translations?: Json
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          name?: string
          slug?: string
          translations?: Json
          updated_at?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      generate_certificate_slug: { Args: never; Returns: string }
    }
    Enums: {
      [_ in never]: never
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
    Enums: {},
  },
} as const
