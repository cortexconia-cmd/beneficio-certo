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
    PostgrestVersion: "14.18"
  }
  public: {
    Tables: {
      access_grants: {
        Row: {
          access_scope: string
          benefit_id: string | null
          created_at: string
          expires_at: string | null
          id: string
          order_id: string | null
          revoked_at: string | null
          starts_at: string
          user_id: string
        }
        Insert: {
          access_scope: string
          benefit_id?: string | null
          created_at?: string
          expires_at?: string | null
          id?: string
          order_id?: string | null
          revoked_at?: string | null
          starts_at?: string
          user_id: string
        }
        Update: {
          access_scope?: string
          benefit_id?: string | null
          created_at?: string
          expires_at?: string | null
          id?: string
          order_id?: string | null
          revoked_at?: string | null
          starts_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "access_grants_benefit_id_fkey"
            columns: ["benefit_id"]
            isOneToOne: false
            referencedRelation: "benefits"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "access_grants_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
        ]
      }
      attributions: {
        Row: {
          ad_id: string | null
          adset_id: string | null
          campaign_id: string | null
          captured_at: string
          fbc: string | null
          fbclid: string | null
          fbp: string | null
          id: string
          session_id: string | null
          user_id: string | null
          utm_campaign: string | null
          utm_content: string | null
          utm_medium: string | null
          utm_source: string | null
          utm_term: string | null
          visitor_id: string
        }
        Insert: {
          ad_id?: string | null
          adset_id?: string | null
          campaign_id?: string | null
          captured_at?: string
          fbc?: string | null
          fbclid?: string | null
          fbp?: string | null
          id?: string
          session_id?: string | null
          user_id?: string | null
          utm_campaign?: string | null
          utm_content?: string | null
          utm_medium?: string | null
          utm_source?: string | null
          utm_term?: string | null
          visitor_id: string
        }
        Update: {
          ad_id?: string | null
          adset_id?: string | null
          campaign_id?: string | null
          captured_at?: string
          fbc?: string | null
          fbclid?: string | null
          fbp?: string | null
          id?: string
          session_id?: string | null
          user_id?: string | null
          utm_campaign?: string | null
          utm_content?: string | null
          utm_medium?: string | null
          utm_source?: string | null
          utm_term?: string | null
          visitor_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "attributions_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "visitor_sessions"
            referencedColumns: ["id"]
          },
        ]
      }
      audit_logs: {
        Row: {
          action: string
          actor_user_id: string | null
          changes: Json | null
          created_at: string
          entity_id: string | null
          entity_type: string
          id: string
        }
        Insert: {
          action: string
          actor_user_id?: string | null
          changes?: Json | null
          created_at?: string
          entity_id?: string | null
          entity_type: string
          id?: string
        }
        Update: {
          action?: string
          actor_user_id?: string | null
          changes?: Json | null
          created_at?: string
          entity_id?: string | null
          entity_type?: string
          id?: string
        }
        Relationships: []
      }
      benefit_contents: {
        Row: {
          benefit_id: string
          documents: Json
          how_to_apply: Json
          id: string
          important: Json
          is_restricted: boolean
          updated_at: string
          value_info: Json
          what_is: string | null
          who_qualifies: Json
        }
        Insert: {
          benefit_id: string
          documents?: Json
          how_to_apply?: Json
          id?: string
          important?: Json
          is_restricted?: boolean
          updated_at?: string
          value_info?: Json
          what_is?: string | null
          who_qualifies?: Json
        }
        Update: {
          benefit_id?: string
          documents?: Json
          how_to_apply?: Json
          id?: string
          important?: Json
          is_restricted?: boolean
          updated_at?: string
          value_info?: Json
          what_is?: string | null
          who_qualifies?: Json
        }
        Relationships: [
          {
            foreignKeyName: "benefit_contents_benefit_id_fkey"
            columns: ["benefit_id"]
            isOneToOne: true
            referencedRelation: "benefits"
            referencedColumns: ["id"]
          },
        ]
      }
      benefits: {
        Row: {
          category_id: string | null
          created_at: string
          gradient: string | null
          icon: string | null
          id: string
          is_published: boolean
          name: string
          short_description: string | null
          slug: string
          sort_order: number
          updated_at: string
        }
        Insert: {
          category_id?: string | null
          created_at?: string
          gradient?: string | null
          icon?: string | null
          id?: string
          is_published?: boolean
          name: string
          short_description?: string | null
          slug: string
          sort_order?: number
          updated_at?: string
        }
        Update: {
          category_id?: string | null
          created_at?: string
          gradient?: string | null
          icon?: string | null
          id?: string
          is_published?: boolean
          name?: string
          short_description?: string | null
          slug?: string
          sort_order?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "benefits_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
        ]
      }
      categories: {
        Row: {
          created_at: string
          description: string | null
          icon: string | null
          id: string
          is_active: boolean
          name: string
          slug: string
          sort_order: number
        }
        Insert: {
          created_at?: string
          description?: string | null
          icon?: string | null
          id?: string
          is_active?: boolean
          name: string
          slug: string
          sort_order?: number
        }
        Update: {
          created_at?: string
          description?: string | null
          icon?: string | null
          id?: string
          is_active?: boolean
          name?: string
          slug?: string
          sort_order?: number
        }
        Relationships: []
      }
      guide_chapters: {
        Row: {
          chapter_number: number
          created_at: string
          icon: string | null
          id: string
          is_published: boolean
          is_restricted: boolean
          read_time: string | null
          sections: Json
          slug: string
          summary: string | null
          title: string
        }
        Insert: {
          chapter_number: number
          created_at?: string
          icon?: string | null
          id?: string
          is_published?: boolean
          is_restricted?: boolean
          read_time?: string | null
          sections?: Json
          slug: string
          summary?: string | null
          title: string
        }
        Update: {
          chapter_number?: number
          created_at?: string
          icon?: string | null
          id?: string
          is_published?: boolean
          is_restricted?: boolean
          read_time?: string | null
          sections?: Json
          slug?: string
          summary?: string | null
          title?: string
        }
        Relationships: []
      }
      orders: {
        Row: {
          amount_cents: number
          created_at: string
          currency: string
          description: string | null
          external_checkout_id: string | null
          id: string
          order_number: string
          status: string
          updated_at: string
          user_id: string
        }
        Insert: {
          amount_cents: number
          created_at?: string
          currency?: string
          description?: string | null
          external_checkout_id?: string | null
          id?: string
          order_number: string
          status?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          amount_cents?: number
          created_at?: string
          currency?: string
          description?: string | null
          external_checkout_id?: string | null
          id?: string
          order_number?: string
          status?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      payments: {
        Row: {
          amount_cents: number
          confirmed_at: string | null
          created_at: string
          id: string
          method: string | null
          order_id: string
          provider: string
          provider_payment_id: string | null
          raw_metadata: Json
          status: string
        }
        Insert: {
          amount_cents: number
          confirmed_at?: string | null
          created_at?: string
          id?: string
          method?: string | null
          order_id: string
          provider?: string
          provider_payment_id?: string | null
          raw_metadata?: Json
          status?: string
        }
        Update: {
          amount_cents?: number
          confirmed_at?: string | null
          created_at?: string
          id?: string
          method?: string | null
          order_id?: string
          provider?: string
          provider_payment_id?: string | null
          raw_metadata?: Json
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "payments_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
        ]
      }
      platform_settings: {
        Row: {
          key: string
          updated_at: string
          value: Json
        }
        Insert: {
          key: string
          updated_at?: string
          value: Json
        }
        Update: {
          key?: string
          updated_at?: string
          value?: Json
        }
        Relationships: []
      }
      profiles: {
        Row: {
          created_at: string
          email: string | null
          full_name: string
          id: string
          updated_at: string
          whatsapp: string | null
        }
        Insert: {
          created_at?: string
          email?: string | null
          full_name?: string
          id: string
          updated_at?: string
          whatsapp?: string | null
        }
        Update: {
          created_at?: string
          email?: string | null
          full_name?: string
          id?: string
          updated_at?: string
          whatsapp?: string | null
        }
        Relationships: []
      }
      tracking_events: {
        Row: {
          event_id: string | null
          event_name: string
          id: string
          occurred_at: string
          page_path: string | null
          properties: Json
          session_id: string | null
          user_id: string | null
          visitor_id: string | null
        }
        Insert: {
          event_id?: string | null
          event_name: string
          id?: string
          occurred_at?: string
          page_path?: string | null
          properties?: Json
          session_id?: string | null
          user_id?: string | null
          visitor_id?: string | null
        }
        Update: {
          event_id?: string | null
          event_name?: string
          id?: string
          occurred_at?: string
          page_path?: string | null
          properties?: Json
          session_id?: string | null
          user_id?: string | null
          visitor_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "tracking_events_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "visitor_sessions"
            referencedColumns: ["id"]
          },
        ]
      }
      user_roles: {
        Row: {
          created_at: string
          role: string
          user_id: string
        }
        Insert: {
          created_at?: string
          role: string
          user_id: string
        }
        Update: {
          created_at?: string
          role?: string
          user_id?: string
        }
        Relationships: []
      }
      visitor_sessions: {
        Row: {
          consent_analytics: boolean
          consent_marketing: boolean
          id: string
          landing_path: string | null
          last_seen_at: string
          referrer: string | null
          started_at: string
          user_id: string | null
          visitor_id: string
        }
        Insert: {
          consent_analytics?: boolean
          consent_marketing?: boolean
          id?: string
          landing_path?: string | null
          last_seen_at?: string
          referrer?: string | null
          started_at?: string
          user_id?: string | null
          visitor_id: string
        }
        Update: {
          consent_analytics?: boolean
          consent_marketing?: boolean
          id?: string
          landing_path?: string | null
          last_seen_at?: string
          referrer?: string | null
          started_at?: string
          user_id?: string | null
          visitor_id?: string
        }
        Relationships: []
      }
      webhook_events: {
        Row: {
          error_message: string | null
          event_type: string | null
          external_event_id: string
          id: string
          payload: Json
          processed_at: string | null
          processing_status: string
          provider: string
          received_at: string
        }
        Insert: {
          error_message?: string | null
          event_type?: string | null
          external_event_id: string
          id?: string
          payload: Json
          processed_at?: string | null
          processing_status?: string
          provider: string
          received_at?: string
        }
        Update: {
          error_message?: string | null
          event_type?: string | null
          external_event_id?: string
          id?: string
          payload?: Json
          processed_at?: string | null
          processing_status?: string
          provider?: string
          received_at?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never) = never,
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
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never) = never,
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
