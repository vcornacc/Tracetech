import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { Tables, TablesInsert, TablesUpdate } from "@/integrations/supabase/types";

// ============================================================
// MATERIALS
// ============================================================

export type Material = Tables<"materials">;
export type MaterialInsert = TablesInsert<"materials">;

export function useMaterials() {
  return useQuery({
    queryKey: ["materials"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("materials")
        .select("*")
        .order("yale_score", { ascending: false });
      if (error) throw error;
      return data as Material[];
    },
  });
}

export function useMaterial(id: string | undefined) {
  return useQuery({
    queryKey: ["materials", id],
    enabled: !!id,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("materials")
        .select("*")
        .eq("id", id!)
        .single();
      if (error) throw error;
      return data as Material;
    },
  });
}

export function useMaterialByName(name: string | undefined) {
  return useQuery({
    queryKey: ["materials", "name", name],
    enabled: !!name,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("materials")
        .select("*")
        .eq("name", name!)
        .single();
      if (error) throw error;
      return data as Material;
    },
  });
}

// ============================================================
// CLUSTER DISTRIBUTION (VIEW)
// ============================================================

export function useClusterDistribution() {
  return useQuery({
    queryKey: ["cluster-distribution"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("v_cluster_distribution")
        .select("*");
      if (error) throw error;
      return data;
    },
  });
}

// ============================================================
// MATERIAL EXPOSURE (VIEW)
// ============================================================

export function useMaterialExposure() {
  return useQuery({
    queryKey: ["material-exposure"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("v_material_exposure")
        .select("*")
        .order("total_value_exposed", { ascending: false });
      if (error) throw error;
      return data;
    },
  });
}

// ============================================================
// ECU MODELS
// ============================================================

export type EcuModel = Tables<"ecu_models">;

export function useEcuModels() {
  return useQuery({
    queryKey: ["ecu-models"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("ecu_models")
        .select("*")
        .order("model_code");
      if (error) throw error;
      return data as EcuModel[];
    },
  });
}

// ============================================================
// ECUs
// ============================================================

export type Ecu = Tables<"ecus">;

export function useEcus() {
  return useQuery({
    queryKey: ["ecus"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("ecus")
        .select("*, ecu_models(model_code, description)")
        .order("ecu_code");
      if (error) throw error;
      return data;
    },
  });
}

export function useEcu(id: string | undefined) {
  return useQuery({
    queryKey: ["ecus", id],
    enabled: !!id,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("ecus")
        .select("*, ecu_models(model_code, description)")
        .eq("id", id!)
        .single();
      if (error) throw error;
      return data;
    },
  });
}

export function useEcuByCode(code: string | undefined) {
  return useQuery({
    queryKey: ["ecus", "code", code],
    enabled: !!code,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("ecus")
        .select("*, ecu_models(model_code, description)")
        .eq("ecu_code", code!)
        .single();
      if (error) throw error;
      return data;
    },
  });
}

// ============================================================
// ECU MATERIALS (BOM composition)
// ============================================================

export type EcuMaterial = Tables<"ecu_materials">;

export function useEcuMaterials(ecuId: string | undefined) {
  return useQuery({
    queryKey: ["ecu-materials", ecuId],
    enabled: !!ecuId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("ecu_materials")
        .select("*, materials(name, cluster, yale_score, price_per_kg, recycle_rate)")
        .eq("ecu_id", ecuId!);
      if (error) throw error;
      return data;
    },
  });
}

// ============================================================
// ECU LIFECYCLE EVENTS
// ============================================================

export function useEcuLifecycleEvents(ecuId: string | undefined) {
  return useQuery({
    queryKey: ["ecu-lifecycle", ecuId],
    enabled: !!ecuId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("ecu_lifecycle_events")
        .select("*")
        .eq("ecu_id", ecuId!)
        .order("event_date", { ascending: true });
      if (error) throw error;
      return data;
    },
  });
}

// ============================================================
// ECU RISK EXPOSURE (VIEW)
// ============================================================

export function useEcuRiskExposure() {
  return useQuery({
    queryKey: ["ecu-risk-exposure"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("v_ecu_risk_exposure")
        .select("*");
      if (error) throw error;
      return data;
    },
  });
}

// ============================================================
// CIRCULAR TRIGGERS
// ============================================================

export type CircularTriggerRow = Tables<"circular_triggers">;

export function useCircularTriggers(status?: string) {
  return useQuery({
    queryKey: ["circular-triggers", status],
    queryFn: async () => {
      let query = supabase
        .from("circular_triggers")
        .select("*")
        .order("triggered_at", { ascending: false });
      if (status) {
        query = query.eq("status", status);
      }
      const { data, error } = await query;
      if (error) throw error;
      return data as CircularTriggerRow[];
    },
  });
}

// ============================================================
// SIMULATION SCENARIOS
// ============================================================

export type SimulationScenario = Tables<"simulation_scenarios">;

export function useSimulationScenarios() {
  return useQuery({
    queryKey: ["simulation-scenarios"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("simulation_scenarios")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data as SimulationScenario[];
    },
  });
}

export function useCreateSimulation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (scenario: TablesInsert<"simulation_scenarios">) => {
      const { data, error } = await supabase
        .from("simulation_scenarios")
        .insert(scenario)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["simulation-scenarios"] });
    },
  });
}

export function useUpdateSimulation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...updates }: TablesUpdate<"simulation_scenarios"> & { id: string }) => {
      const { data, error } = await supabase
        .from("simulation_scenarios")
        .update(updates)
        .eq("id", id)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["simulation-scenarios"] });
    },
  });
}

// ============================================================
// PRICE HISTORY
// ============================================================

export function useMaterialPriceHistory(materialId: string | undefined) {
  return useQuery({
    queryKey: ["price-history", materialId],
    enabled: !!materialId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("material_price_history")
        .select("*")
        .eq("material_id", materialId!)
        .order("recorded_date", { ascending: true });
      if (error) throw error;
      return data;
    },
  });
}

// ============================================================
// FINANCIAL SCENARIOS
// ============================================================

export type FinancialScenarioRow = Tables<"financial_scenarios">;

export function useFinancialScenarios() {
  return useQuery({
    queryKey: ["financial-scenarios"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("financial_scenarios")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data as FinancialScenarioRow[];
    },
  });
}

export function useCreateFinancialScenario() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (scenario: TablesInsert<"financial_scenarios">) => {
      const { data, error } = await supabase
        .from("financial_scenarios")
        .insert(scenario)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["financial-scenarios"] });
    },
  });
}
