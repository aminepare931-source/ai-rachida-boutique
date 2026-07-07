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
      abandoned_carts: {
        Row: {
          cart: Json
          conversation_id: string | null
          created_at: string
          customer_contact: string | null
          customer_name: string | null
          id: string
          recovered: boolean
          reminded_at: string | null
          shop_id: string
          total: number
          updated_at: string
        }
        Insert: {
          cart?: Json
          conversation_id?: string | null
          created_at?: string
          customer_contact?: string | null
          customer_name?: string | null
          id?: string
          recovered?: boolean
          reminded_at?: string | null
          shop_id: string
          total?: number
          updated_at?: string
        }
        Update: {
          cart?: Json
          conversation_id?: string | null
          created_at?: string
          customer_contact?: string | null
          customer_name?: string | null
          id?: string
          recovered?: boolean
          reminded_at?: string | null
          shop_id?: string
          total?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "abandoned_carts_shop_id_fkey"
            columns: ["shop_id"]
            isOneToOne: false
            referencedRelation: "shops"
            referencedColumns: ["id"]
          },
        ]
      }
      campaigns: {
        Row: {
          channel: string
          created_at: string
          id: string
          message: string
          name: string
          scheduled_at: string | null
          sent_at: string | null
          sent_count: number
          shop_id: string
          status: string
          target_filter: Json
          updated_at: string
        }
        Insert: {
          channel?: string
          created_at?: string
          id?: string
          message: string
          name: string
          scheduled_at?: string | null
          sent_at?: string | null
          sent_count?: number
          shop_id: string
          status?: string
          target_filter?: Json
          updated_at?: string
        }
        Update: {
          channel?: string
          created_at?: string
          id?: string
          message?: string
          name?: string
          scheduled_at?: string | null
          sent_at?: string | null
          sent_count?: number
          shop_id?: string
          status?: string
          target_filter?: Json
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "campaigns_shop_id_fkey"
            columns: ["shop_id"]
            isOneToOne: false
            referencedRelation: "shops"
            referencedColumns: ["id"]
          },
        ]
      }
      conversations: {
        Row: {
          client_contact: string | null
          client_name: string | null
          created_at: string
          emotion: string | null
          human_requested: boolean
          id: string
          shop_id: string
          updated_at: string
        }
        Insert: {
          client_contact?: string | null
          client_name?: string | null
          created_at?: string
          emotion?: string | null
          human_requested?: boolean
          id?: string
          shop_id: string
          updated_at?: string
        }
        Update: {
          client_contact?: string | null
          client_name?: string | null
          created_at?: string
          emotion?: string | null
          human_requested?: boolean
          id?: string
          shop_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "conversations_shop_id_fkey"
            columns: ["shop_id"]
            isOneToOne: false
            referencedRelation: "shops"
            referencedColumns: ["id"]
          },
        ]
      }
      customer_profiles: {
        Row: {
          budget_max: number | null
          created_at: string
          customer_contact: string
          customer_name: string | null
          id: string
          language: string | null
          last_seen_at: string | null
          notes: string | null
          preferences: Json | null
          shop_id: string
          total_conversations: number | null
          updated_at: string
        }
        Insert: {
          budget_max?: number | null
          created_at?: string
          customer_contact: string
          customer_name?: string | null
          id?: string
          language?: string | null
          last_seen_at?: string | null
          notes?: string | null
          preferences?: Json | null
          shop_id: string
          total_conversations?: number | null
          updated_at?: string
        }
        Update: {
          budget_max?: number | null
          created_at?: string
          customer_contact?: string
          customer_name?: string | null
          id?: string
          language?: string | null
          last_seen_at?: string | null
          notes?: string | null
          preferences?: Json | null
          shop_id?: string
          total_conversations?: number | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "customer_profiles_shop_id_fkey"
            columns: ["shop_id"]
            isOneToOne: false
            referencedRelation: "shops"
            referencedColumns: ["id"]
          },
        ]
      }
      daily_reports: {
        Row: {
          conversations_count: number | null
          created_at: string
          emotions_breakdown: Json | null
          id: string
          orders_count: number | null
          report_date: string
          revenue: number | null
          shop_id: string
          summary: string | null
          top_products: Json | null
        }
        Insert: {
          conversations_count?: number | null
          created_at?: string
          emotions_breakdown?: Json | null
          id?: string
          orders_count?: number | null
          report_date: string
          revenue?: number | null
          shop_id: string
          summary?: string | null
          top_products?: Json | null
        }
        Update: {
          conversations_count?: number | null
          created_at?: string
          emotions_breakdown?: Json | null
          id?: string
          orders_count?: number | null
          report_date?: string
          revenue?: number | null
          shop_id?: string
          summary?: string | null
          top_products?: Json | null
        }
        Relationships: [
          {
            foreignKeyName: "daily_reports_shop_id_fkey"
            columns: ["shop_id"]
            isOneToOne: false
            referencedRelation: "shops"
            referencedColumns: ["id"]
          },
        ]
      }
      faq: {
        Row: {
          answer: string
          created_at: string
          id: string
          keywords: string | null
          question: string
          shop_id: string
          updated_at: string
        }
        Insert: {
          answer: string
          created_at?: string
          id?: string
          keywords?: string | null
          question: string
          shop_id: string
          updated_at?: string
        }
        Update: {
          answer?: string
          created_at?: string
          id?: string
          keywords?: string | null
          question?: string
          shop_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "faq_shop_id_fkey"
            columns: ["shop_id"]
            isOneToOne: false
            referencedRelation: "shops"
            referencedColumns: ["id"]
          },
        ]
      }
      lead_scores: {
        Row: {
          conversation_id: string
          created_at: string
          id: string
          reasons: string | null
          score: number
          shop_id: string
          status: string | null
          updated_at: string
        }
        Insert: {
          conversation_id: string
          created_at?: string
          id?: string
          reasons?: string | null
          score?: number
          shop_id: string
          status?: string | null
          updated_at?: string
        }
        Update: {
          conversation_id?: string
          created_at?: string
          id?: string
          reasons?: string | null
          score?: number
          shop_id?: string
          status?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "lead_scores_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: true
            referencedRelation: "conversations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lead_scores_shop_id_fkey"
            columns: ["shop_id"]
            isOneToOne: false
            referencedRelation: "shops"
            referencedColumns: ["id"]
          },
        ]
      }
      loyalty: {
        Row: {
          created_at: string
          customer_contact: string
          id: string
          last_order_at: string | null
          orders_count: number | null
          shop_id: string
          total_spent: number | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          customer_contact: string
          id?: string
          last_order_at?: string | null
          orders_count?: number | null
          shop_id: string
          total_spent?: number | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          customer_contact?: string
          id?: string
          last_order_at?: string | null
          orders_count?: number | null
          shop_id?: string
          total_spent?: number | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "loyalty_shop_id_fkey"
            columns: ["shop_id"]
            isOneToOne: false
            referencedRelation: "shops"
            referencedColumns: ["id"]
          },
        ]
      }
      messages: {
        Row: {
          content: string
          conversation_id: string
          created_at: string
          id: string
          role: string
        }
        Insert: {
          content: string
          conversation_id: string
          created_at?: string
          id?: string
          role: string
        }
        Update: {
          content?: string
          conversation_id?: string
          created_at?: string
          id?: string
          role?: string
        }
        Relationships: [
          {
            foreignKeyName: "messages_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "conversations"
            referencedColumns: ["id"]
          },
        ]
      }
      mirrors: {
        Row: {
          cached_html: string | null
          created_at: string
          id: string
          last_error: string | null
          shop_id: string
          slug: string
          source_url: string
          status: string
          title: string | null
          updated_at: string
        }
        Insert: {
          cached_html?: string | null
          created_at?: string
          id?: string
          last_error?: string | null
          shop_id: string
          slug: string
          source_url: string
          status?: string
          title?: string | null
          updated_at?: string
        }
        Update: {
          cached_html?: string | null
          created_at?: string
          id?: string
          last_error?: string | null
          shop_id?: string
          slug?: string
          source_url?: string
          status?: string
          title?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "mirrors_shop_id_fkey"
            columns: ["shop_id"]
            isOneToOne: false
            referencedRelation: "shops"
            referencedColumns: ["id"]
          },
        ]
      }
      orders: {
        Row: {
          cart: Json
          client_contact: string | null
          client_name: string | null
          conversation_id: string | null
          created_at: string
          id: string
          notes: string | null
          shop_id: string
          status: string
          total: number
          updated_at: string
        }
        Insert: {
          cart?: Json
          client_contact?: string | null
          client_name?: string | null
          conversation_id?: string | null
          created_at?: string
          id?: string
          notes?: string | null
          shop_id: string
          status?: string
          total?: number
          updated_at?: string
        }
        Update: {
          cart?: Json
          client_contact?: string | null
          client_name?: string | null
          conversation_id?: string | null
          created_at?: string
          id?: string
          notes?: string | null
          shop_id?: string
          status?: string
          total?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "orders_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "conversations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "orders_shop_id_fkey"
            columns: ["shop_id"]
            isOneToOne: false
            referencedRelation: "shops"
            referencedColumns: ["id"]
          },
        ]
      }
      payment_proofs: {
        Row: {
          amount_detected: number | null
          analysis: Json | null
          conversation_id: string | null
          created_at: string
          id: string
          image_url: string | null
          order_id: string | null
          shop_id: string
          status: string | null
        }
        Insert: {
          amount_detected?: number | null
          analysis?: Json | null
          conversation_id?: string | null
          created_at?: string
          id?: string
          image_url?: string | null
          order_id?: string | null
          shop_id: string
          status?: string | null
        }
        Update: {
          amount_detected?: number | null
          analysis?: Json | null
          conversation_id?: string | null
          created_at?: string
          id?: string
          image_url?: string | null
          order_id?: string | null
          shop_id?: string
          status?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "payment_proofs_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "conversations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payment_proofs_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payment_proofs_shop_id_fkey"
            columns: ["shop_id"]
            isOneToOne: false
            referencedRelation: "shops"
            referencedColumns: ["id"]
          },
        ]
      }
      product_views: {
        Row: {
          conversation_id: string | null
          created_at: string
          id: string
          product_id: string | null
          shop_id: string
        }
        Insert: {
          conversation_id?: string | null
          created_at?: string
          id?: string
          product_id?: string | null
          shop_id: string
        }
        Update: {
          conversation_id?: string | null
          created_at?: string
          id?: string
          product_id?: string | null
          shop_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "product_views_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "conversations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "product_views_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "product_views_shop_id_fkey"
            columns: ["shop_id"]
            isOneToOne: false
            referencedRelation: "shops"
            referencedColumns: ["id"]
          },
        ]
      }
      products: {
        Row: {
          category: string | null
          color: string | null
          created_at: string
          description: string | null
          gender: string | null
          id: string
          image_url: string | null
          is_active: boolean
          keywords: string | null
          name: string
          price: number
          shop_id: string
          stock: number
          updated_at: string
        }
        Insert: {
          category?: string | null
          color?: string | null
          created_at?: string
          description?: string | null
          gender?: string | null
          id?: string
          image_url?: string | null
          is_active?: boolean
          keywords?: string | null
          name: string
          price?: number
          shop_id: string
          stock?: number
          updated_at?: string
        }
        Update: {
          category?: string | null
          color?: string | null
          created_at?: string
          description?: string | null
          gender?: string | null
          id?: string
          image_url?: string | null
          is_active?: boolean
          keywords?: string | null
          name?: string
          price?: number
          shop_id?: string
          stock?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "products_shop_id_fkey"
            columns: ["shop_id"]
            isOneToOne: false
            referencedRelation: "shops"
            referencedColumns: ["id"]
          },
        ]
      }
      promo_codes: {
        Row: {
          active: boolean
          code: string
          created_at: string
          expires_at: string | null
          id: string
          kind: string
          max_uses: number | null
          shop_id: string
          updated_at: string
          used_count: number
          value: number
        }
        Insert: {
          active?: boolean
          code: string
          created_at?: string
          expires_at?: string | null
          id?: string
          kind?: string
          max_uses?: number | null
          shop_id: string
          updated_at?: string
          used_count?: number
          value?: number
        }
        Update: {
          active?: boolean
          code?: string
          created_at?: string
          expires_at?: string | null
          id?: string
          kind?: string
          max_uses?: number | null
          shop_id?: string
          updated_at?: string
          used_count?: number
          value?: number
        }
        Relationships: [
          {
            foreignKeyName: "promo_codes_shop_id_fkey"
            columns: ["shop_id"]
            isOneToOne: false
            referencedRelation: "shops"
            referencedColumns: ["id"]
          },
        ]
      }
      rate_limits: {
        Row: {
          count: number
          endpoint: string
          id: string
          ip: string
          window_start: string
        }
        Insert: {
          count?: number
          endpoint: string
          id?: string
          ip: string
          window_start?: string
        }
        Update: {
          count?: number
          endpoint?: string
          id?: string
          ip?: string
          window_start?: string
        }
        Relationships: []
      }
      referrals: {
        Row: {
          code: string
          created_at: string
          id: string
          invited_contact: string | null
          referrer_contact: string
          reward_points: number
          shop_id: string
          status: string
          updated_at: string
        }
        Insert: {
          code: string
          created_at?: string
          id?: string
          invited_contact?: string | null
          referrer_contact: string
          reward_points?: number
          shop_id: string
          status?: string
          updated_at?: string
        }
        Update: {
          code?: string
          created_at?: string
          id?: string
          invited_contact?: string | null
          referrer_contact?: string
          reward_points?: number
          shop_id?: string
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "referrals_shop_id_fkey"
            columns: ["shop_id"]
            isOneToOne: false
            referencedRelation: "shops"
            referencedColumns: ["id"]
          },
        ]
      }
      shops: {
        Row: {
          business_hours: Json
          color: string
          created_at: string
          currency: string
          delivery_zones: Json
          greeting: string
          id: string
          logo_url: string | null
          max_remise: number
          name: string
          onboarding_done: boolean
          onboarding_step: number
          owner_id: string
          payment_methods: Json
          rachida_name: string
          slug: string
          system_prompt_extra: string | null
          updated_at: string
          whatsapp: string | null
        }
        Insert: {
          business_hours?: Json
          color?: string
          created_at?: string
          currency?: string
          delivery_zones?: Json
          greeting?: string
          id?: string
          logo_url?: string | null
          max_remise?: number
          name: string
          onboarding_done?: boolean
          onboarding_step?: number
          owner_id: string
          payment_methods?: Json
          rachida_name?: string
          slug: string
          system_prompt_extra?: string | null
          updated_at?: string
          whatsapp?: string | null
        }
        Update: {
          business_hours?: Json
          color?: string
          created_at?: string
          currency?: string
          delivery_zones?: Json
          greeting?: string
          id?: string
          logo_url?: string | null
          max_remise?: number
          name?: string
          onboarding_done?: boolean
          onboarding_step?: number
          owner_id?: string
          payment_methods?: Json
          rachida_name?: string
          slug?: string
          system_prompt_extra?: string | null
          updated_at?: string
          whatsapp?: string | null
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
