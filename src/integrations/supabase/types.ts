export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  __InternalSupabase: {
    PostgrestVersion: "14.1"
  }
  public: {
    Tables: {
      profiles: {
        Row: {
          company: string | null
          created_at: string
          full_name: string | null
          id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          company?: string | null
          created_at?: string
          full_name?: string | null
          id?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          company?: string | null
          created_at?: string
          full_name?: string | null
          id?: string
          updated_at?: string
          user_id?: string
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
      materials: {
        Row: {
          id: string
          name: string
          formula: string | null
          cas_number: string | null
          grams_per_circuit: number
          price_per_kg: number | null
          yale_score: number
          eu_sr_x_ei: number
          cluster: Database["public"]["Enums"]["material_cluster"]
          hhi: number
          recycle_rate: number
          top_producers: string[]
          eu_crm_listed: boolean
          eu_crm_year: number | null
          risk_supply: number
          risk_geopolitical: number
          risk_price_volatility: number
          risk_recycle_gap: number
          risk_esg: number
          risk_concentration_hhi: number
          gwp_kg_co2_per_kg: number | null
          water_usage_l_per_kg: number | null
          energy_mj_per_kg: number | null
          country_risk_scores: Json | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          formula?: string | null
          cas_number?: string | null
          grams_per_circuit?: number
          price_per_kg?: number | null
          yale_score?: number
          eu_sr_x_ei?: number
          cluster?: Database["public"]["Enums"]["material_cluster"]
          hhi?: number
          recycle_rate?: number
          top_producers?: string[]
          eu_crm_listed?: boolean
          eu_crm_year?: number | null
          risk_supply?: number
          risk_geopolitical?: number
          risk_price_volatility?: number
          risk_recycle_gap?: number
          risk_esg?: number
          risk_concentration_hhi?: number
          gwp_kg_co2_per_kg?: number | null
          water_usage_l_per_kg?: number | null
          energy_mj_per_kg?: number | null
          country_risk_scores?: Json | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          formula?: string | null
          cas_number?: string | null
          grams_per_circuit?: number
          price_per_kg?: number | null
          yale_score?: number
          eu_sr_x_ei?: number
          cluster?: Database["public"]["Enums"]["material_cluster"]
          hhi?: number
          recycle_rate?: number
          top_producers?: string[]
          eu_crm_listed?: boolean
          eu_crm_year?: number | null
          risk_supply?: number
          risk_geopolitical?: number
          risk_price_volatility?: number
          risk_recycle_gap?: number
          risk_esg?: number
          risk_concentration_hhi?: number
          gwp_kg_co2_per_kg?: number | null
          water_usage_l_per_kg?: number | null
          energy_mj_per_kg?: number | null
          country_risk_scores?: Json | null
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      ecu_models: {
        Row: {
          id: string
          model_code: string
          description: string | null
          base_weight_grams: number | null
          created_at: string
        }
        Insert: {
          id?: string
          model_code: string
          description?: string | null
          base_weight_grams?: number | null
          created_at?: string
        }
        Update: {
          id?: string
          model_code?: string
          description?: string | null
          base_weight_grams?: number | null
          created_at?: string
        }
        Relationships: []
      }
      ecus: {
        Row: {
          id: string
          ecu_code: string
          model_id: string | null
          part_number: string | null
          vehicle_model: string | null
          vin: string | null
          production_date: string | null
          installation_date: string | null
          status: Database["public"]["Enums"]["ecu_status"]
          circular_path: Database["public"]["Enums"]["circular_path"]
          total_weight_grams: number | null
          crm_content_grams: number | null
          crm_value_euro: number | null
          risk_score: number | null
          recovery_rate: number | null
          dpp_id: string | null
          digital_twin_id: string | null
          location: string | null
          mileage_km: number | null
          health_score: number | null
          remaining_life_months: number | null
          owner_id: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          ecu_code: string
          model_id?: string | null
          part_number?: string | null
          vehicle_model?: string | null
          vin?: string | null
          production_date?: string | null
          installation_date?: string | null
          status?: Database["public"]["Enums"]["ecu_status"]
          circular_path?: Database["public"]["Enums"]["circular_path"]
          total_weight_grams?: number | null
          crm_content_grams?: number | null
          crm_value_euro?: number | null
          risk_score?: number | null
          recovery_rate?: number | null
          dpp_id?: string | null
          digital_twin_id?: string | null
          location?: string | null
          mileage_km?: number | null
          health_score?: number | null
          remaining_life_months?: number | null
          owner_id?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          ecu_code?: string
          model_id?: string | null
          part_number?: string | null
          vehicle_model?: string | null
          vin?: string | null
          production_date?: string | null
          installation_date?: string | null
          status?: Database["public"]["Enums"]["ecu_status"]
          circular_path?: Database["public"]["Enums"]["circular_path"]
          total_weight_grams?: number | null
          crm_content_grams?: number | null
          crm_value_euro?: number | null
          risk_score?: number | null
          recovery_rate?: number | null
          dpp_id?: string | null
          digital_twin_id?: string | null
          location?: string | null
          mileage_km?: number | null
          health_score?: number | null
          remaining_life_months?: number | null
          owner_id?: string | null
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "ecus_model_id_fkey"
            columns: ["model_id"]
            isOneToOne: false
            referencedRelation: "ecu_models"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ecus_owner_id_fkey"
            columns: ["owner_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["user_id"]
          }
        ]
      }
      ecu_materials: {
        Row: {
          id: string
          ecu_id: string
          material_id: string
          weight_grams: number
          recoverable: boolean
          recovery_method: string | null
          value_per_kg: number | null
        }
        Insert: {
          id?: string
          ecu_id: string
          material_id: string
          weight_grams?: number
          recoverable?: boolean
          recovery_method?: string | null
          value_per_kg?: number | null
        }
        Update: {
          id?: string
          ecu_id?: string
          material_id?: string
          weight_grams?: number
          recoverable?: boolean
          recovery_method?: string | null
          value_per_kg?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "ecu_materials_ecu_id_fkey"
            columns: ["ecu_id"]
            isOneToOne: false
            referencedRelation: "ecus"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ecu_materials_material_id_fkey"
            columns: ["material_id"]
            isOneToOne: false
            referencedRelation: "materials"
            referencedColumns: ["id"]
          }
        ]
      }
      ecu_lifecycle_events: {
        Row: {
          id: string
          ecu_id: string
          event_type: Database["public"]["Enums"]["lifecycle_event_type"]
          event_date: string
          description: string | null
          location: string | null
          created_at: string
        }
        Insert: {
          id?: string
          ecu_id: string
          event_type: Database["public"]["Enums"]["lifecycle_event_type"]
          event_date: string
          description?: string | null
          location?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          ecu_id?: string
          event_type?: Database["public"]["Enums"]["lifecycle_event_type"]
          event_date?: string
          description?: string | null
          location?: string | null
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "ecu_lifecycle_events_ecu_id_fkey"
            columns: ["ecu_id"]
            isOneToOne: false
            referencedRelation: "ecus"
            referencedColumns: ["id"]
          }
        ]
      }
      circular_triggers: {
        Row: {
          id: string
          trigger_code: string
          trigger_type: Database["public"]["Enums"]["trigger_type"]
          label: string
          description: string | null
          triggered_at: string
          severity: Database["public"]["Enums"]["trigger_severity"]
          affected_ecus_count: number | null
          affected_materials: string[]
          status: Database["public"]["Enums"]["trigger_status"]
          payload: Json | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          trigger_code: string
          trigger_type: Database["public"]["Enums"]["trigger_type"]
          label: string
          description?: string | null
          triggered_at?: string
          severity?: Database["public"]["Enums"]["trigger_severity"]
          affected_ecus_count?: number | null
          affected_materials?: string[]
          status?: Database["public"]["Enums"]["trigger_status"]
          payload?: Json | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          trigger_code?: string
          trigger_type?: Database["public"]["Enums"]["trigger_type"]
          label?: string
          description?: string | null
          triggered_at?: string
          severity?: Database["public"]["Enums"]["trigger_severity"]
          affected_ecus_count?: number | null
          affected_materials?: string[]
          status?: Database["public"]["Enums"]["trigger_status"]
          payload?: Json | null
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      simulation_scenarios: {
        Row: {
          id: string
          name: string
          description: string | null
          created_by: string | null
          parameters: Json
          results: Json | null
          is_baseline: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          description?: string | null
          created_by?: string | null
          parameters?: Json
          results?: Json | null
          is_baseline?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          description?: string | null
          created_by?: string | null
          parameters?: Json
          results?: Json | null
          is_baseline?: boolean
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      material_price_history: {
        Row: {
          id: string
          material_id: string
          price_per_kg: number
          recorded_date: string
          source: string | null
          created_at: string
        }
        Insert: {
          id?: string
          material_id: string
          price_per_kg: number
          recorded_date: string
          source?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          material_id?: string
          price_per_kg?: number
          recorded_date?: string
          source?: string | null
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "material_price_history_material_id_fkey"
            columns: ["material_id"]
            isOneToOne: false
            referencedRelation: "materials"
            referencedColumns: ["id"]
          }
        ]
      }
      financial_scenarios: {
        Row: {
          id: string
          label: string
          capex: number
          opex: number
          annual_capacity: number
          crm_value_per_unit: number
          discount_rate: number
          years: number
          created_by: string | null
          results: Json | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          label: string
          capex?: number
          opex?: number
          annual_capacity?: number
          crm_value_per_unit?: number
          discount_rate?: number
          years?: number
          created_by?: string | null
          results?: Json | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          label?: string
          capex?: number
          opex?: number
          annual_capacity?: number
          crm_value_per_unit?: number
          discount_rate?: number
          years?: number
          created_by?: string | null
          results?: Json | null
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
    }
    Views: {
      v_cluster_distribution: {
        Row: {
          cluster: Database["public"]["Enums"]["material_cluster"] | null
          material_count: number | null
          avg_yale_score: number | null
          avg_eu_sr_ei: number | null
          avg_risk_supply: number | null
          avg_risk_geopolitical: number | null
          avg_risk_price_volatility: number | null
          avg_risk_recycle_gap: number | null
          avg_risk_esg: number | null
          avg_risk_concentration: number | null
        }
        Relationships: []
      }
      v_ecu_risk_exposure: {
        Row: {
          ecu_id: string | null
          ecu_code: string | null
          vehicle_model: string | null
          status: Database["public"]["Enums"]["ecu_status"] | null
          circular_path: Database["public"]["Enums"]["circular_path"] | null
          crm_value_euro: number | null
          risk_score: number | null
          material_count: number | null
          total_crm_grams: number | null
          estimated_crm_value: number | null
          avg_yale_score: number | null
          max_yale_score: number | null
          clusters_present: Database["public"]["Enums"]["material_cluster"][] | null
        }
        Relationships: []
      }
      v_material_exposure: {
        Row: {
          material_id: string | null
          name: string | null
          cluster: Database["public"]["Enums"]["material_cluster"] | null
          yale_score: number | null
          eu_sr_x_ei: number | null
          price_per_kg: number | null
          ecu_count: number | null
          total_grams_in_fleet: number | null
          total_value_exposed: number | null
          risk_supply: number | null
          risk_geopolitical: number | null
          risk_price_volatility: number | null
          risk_recycle_gap: number | null
        }
        Relationships: []
      }
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
      app_role: "admin" | "analyst" | "executive"
      material_cluster: "systemic" | "product" | "sectoral" | "operational"
      ecu_status: "active" | "maintenance" | "eol" | "recovered" | "in_recovery"
      circular_path: "repair" | "reuse" | "refurbish" | "selective_recovery" | "pending"
      trigger_type: "eol_vehicle" | "component_replacement" | "geopolitical_shock" | "price_volatility" | "regulatory_update" | "supply_disruption"
      trigger_severity: "low" | "medium" | "high" | "critical"
      trigger_status: "active" | "resolved" | "monitoring"
      lifecycle_event_type: "production" | "installation" | "maintenance" | "replacement" | "eol" | "recovery"
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
      app_role: ["admin", "analyst", "executive"],
    },
  },
} as const
