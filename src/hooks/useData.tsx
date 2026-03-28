/**
 * Unified Data Provider
 *
 * Fetches data from Supabase and transforms it to match the existing
 * interface used by all pages.
 *
 * Live-data only mode: when Supabase is unavailable or empty,
 * arrays stay empty and pages render their empty states.
 */

import React, { createContext, useContext, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import {
  clusterInfo,
  type CriticalMaterial,
} from "@/data/materialsData";
import {
  type ECU,
  type CircularTrigger,
} from "@/data/ecuData";
import type { Material } from "@/hooks/useSupabaseData";

// ============================================================
// CONTEXT TYPE
// ============================================================

interface DataContextType {
  // Materials
  materials: CriticalMaterial[];
  materialsRaw: Material[];
  materialsLoading: boolean;
  // ECUs
  ecuInventory: ECU[];
  ecusLoading: boolean;
  // Triggers
  circularTriggers: CircularTrigger[];
  triggersLoading: boolean;
  // Cluster info (static)
  clusterInfo: typeof clusterInfo;
  // Source indicator
  dataSource: "supabase" | "none";
}

const DataContext = createContext<DataContextType | null>(null);

// ============================================================
// TRANSFORM SUPABASE → LEGACY INTERFACE
// ============================================================

function transformMaterial(m: Material): CriticalMaterial {
  return {
    name: m.name,
    formula: m.formula ?? undefined,
    casNumber: m.cas_number ?? "",
    gramsPerCircuit: m.grams_per_circuit,
    yaleScore: m.yale_score,
    euSRxEI: m.eu_sr_x_ei,
    cluster: m.cluster as CriticalMaterial["cluster"],
    hhi: m.hhi,
    recycleRate: m.recycle_rate,
    topProducers: m.top_producers,
    riskProfile: [
      { subject: "Supply Risk", value: m.risk_supply },
      { subject: "Geopolitical", value: m.risk_geopolitical },
      { subject: "Price Vol.", value: m.risk_price_volatility },
      { subject: "Recycling Gap", value: m.risk_recycle_gap },
      { subject: "ESG Risk", value: m.risk_esg },
      { subject: "HHI Concentration", value: m.risk_concentration_hhi },
    ],
  };
}

// ============================================================
// PROVIDER
// ============================================================

export function DataProvider({ children }: { children: React.ReactNode }) {
  // Fetch materials from Supabase
  const materialsQuery = useQuery({
    queryKey: ["data-provider-materials"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("materials")
        .select("*")
        .order("yale_score", { ascending: false });
      if (error) throw error;
      return data as Material[];
    },
    retry: 1,
    staleTime: 5 * 60 * 1000, // 5 min
  });

  // Fetch ECUs from Supabase
  const ecusQuery = useQuery({
    queryKey: ["data-provider-ecus"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("ecus")
        .select("*, ecu_models(model_code, description), ecu_materials(*, materials(name, cluster, recycle_rate, price_per_kg))")
        .order("ecu_code");
      if (error) throw error;
      return data;
    },
    retry: 1,
    staleTime: 5 * 60 * 1000,
  });

  // Fetch triggers from Supabase
  const triggersQuery = useQuery({
    queryKey: ["data-provider-triggers"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("circular_triggers")
        .select("*")
        .order("triggered_at", { ascending: false });
      if (error) throw error;
      return data;
    },
    retry: 1,
    staleTime: 5 * 60 * 1000,
  });

  const value = useMemo<DataContextType>(() => {
    const hasSupabaseMaterials = materialsQuery.data && materialsQuery.data.length > 0;
    const hasSupabaseEcus = ecusQuery.data && ecusQuery.data.length > 0;
    const hasSupabaseTriggers = triggersQuery.data && triggersQuery.data.length > 0;

    // Materials
    const materialsRaw = materialsQuery.data ?? [];
    const materials = hasSupabaseMaterials
      ? materialsQuery.data!.map(transformMaterial)
      : [];

    // ECUs - transform Supabase rows to match legacy ECU interface
    let ecuInventory: ECU[];
    if (hasSupabaseEcus) {
      ecuInventory = ecusQuery.data!.map((row: any) => {
        const ecuMaterials = row.ecu_materials ?? [];
        return {
          id: row.ecu_code,
          model: row.ecu_models?.model_code ?? "",
          partNumber: row.part_number ?? "",
          vehicleModel: row.vehicle_model ?? "",
          vin: row.vin ?? "",
          productionDate: row.production_date ?? "",
          installationDate: row.installation_date ?? "",
          status: row.status,
          circularPath: row.circular_path,
          totalWeightGrams: row.total_weight_grams ?? 0,
          crmContentGrams: row.crm_content_grams ?? 0,
          crmValueEuro: row.crm_value_euro ?? 0,
          riskScore: row.risk_score ?? 0,
          recoveryRate: row.recovery_rate ?? 0,
          materials: ecuMaterials.map((em: any) => ({
            name: em.materials?.name ?? "",
            weightGrams: em.weight_grams,
            recoverable: em.recoverable,
            recoveryMethod: em.recovery_method ?? "Unknown",
            valuePerKg: em.value_per_kg ?? 0,
          })),
          lifecycle: [], // loaded separately when needed
          dppId: row.dpp_id ?? "",
          digitalTwinId: row.digital_twin_id ?? "",
          location: row.location ?? "",
          mileageKm: row.mileage_km ?? 0,
          healthScore: row.health_score ?? 0,
          remainingLifeMonths: row.remaining_life_months ?? 0,
          _supabaseId: row.id, // keep Supabase UUID for drill-downs
        } as ECU & { _supabaseId: string };
      });
    } else {
      ecuInventory = [];
    }

    // Triggers
    let circularTriggersData: CircularTrigger[];
    if (hasSupabaseTriggers) {
      circularTriggersData = triggersQuery.data!.map((row: any) => ({
        id: row.trigger_code,
        type: row.trigger_type,
        label: row.label,
        description: row.description ?? "",
        timestamp: row.triggered_at,
        severity: row.severity,
        affectedECUs: row.affected_ecus_count ?? 0,
        affectedMaterials: row.affected_materials ?? [],
        status: row.status,
      }));
    } else {
      circularTriggersData = [];
    }

    return {
      materials,
      materialsRaw,
      materialsLoading: materialsQuery.isLoading,
      ecuInventory,
      ecusLoading: ecusQuery.isLoading,
      circularTriggers: circularTriggersData,
      triggersLoading: triggersQuery.isLoading,
      clusterInfo,
      dataSource: hasSupabaseMaterials || hasSupabaseEcus || hasSupabaseTriggers ? "supabase" : "none",
    };
  }, [materialsQuery.data, materialsQuery.isLoading, ecusQuery.data, ecusQuery.isLoading, triggersQuery.data, triggersQuery.isLoading]);

  return <DataContext.Provider value={value}>{children}</DataContext.Provider>;
}

// ============================================================
// HOOK
// ============================================================

export function useData() {
  const ctx = useContext(DataContext);
  if (!ctx) {
    throw new Error("useData must be used within a DataProvider");
  }
  return ctx;
}
