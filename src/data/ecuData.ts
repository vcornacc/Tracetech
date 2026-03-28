// ECU mock data for Bosch Circular Digital Platform
import { criticalMaterials } from "./materialsData";

export interface ECUMaterial {
  name: string;
  weightGrams: number;
  recoverable: boolean;
  recoveryMethod: string;
  valuePerKg: number; // €/kg
}

export interface ECULifecycleEvent {
  date: string;
  type: "production" | "installation" | "maintenance" | "replacement" | "eol" | "recovery";
  description: string;
  location?: string;
}

export interface ECU {
  id: string;
  model: string;
  partNumber: string;
  vehicleModel: string;
  vin: string;
  productionDate: string;
  installationDate: string;
  status: "active" | "maintenance" | "eol" | "recovered" | "in_recovery";
  circularPath: "repair" | "reuse" | "refurbish" | "selective_recovery" | "pending";
  totalWeightGrams: number;
  crmContentGrams: number;
  crmValueEuro: number;
  riskScore: number;
  recoveryRate: number;
  materials: ECUMaterial[];
  lifecycle: ECULifecycleEvent[];
  dppId: string;
  digitalTwinId: string;
  location: string;
  mileageKm: number;
  healthScore: number;
  remainingLifeMonths: number;
}

export type TriggerType = "eol_vehicle" | "component_replacement" | "geopolitical_shock" | "price_volatility" | "regulatory_update";

export interface CircularTrigger {
  id: string;
  type: TriggerType;
  label: string;
  description: string;
  timestamp: string;
  severity: "low" | "medium" | "high" | "critical";
  affectedECUs: number;
  affectedMaterials: string[];
  status: "active" | "resolved" | "monitoring";
}

const ecuModels = [
  { model: "ECU-MDG1", desc: "Motor Drive Gateway" },
  { model: "ECU-ESP9", desc: "Electronic Stability Program" },
  { model: "ECU-ACC4", desc: "Adaptive Cruise Control" },
  { model: "ECU-BMS3", desc: "Battery Management System" },
  { model: "ECU-TCU2", desc: "Transmission Control Unit" },
  { model: "ECU-BCM5", desc: "Body Control Module" },
  { model: "ECU-ADAS7", desc: "Advanced Driver Assistance" },
  { model: "ECU-EPS6", desc: "Electric Power Steering" },
];

const vehicles = [
  "BMW 3 Series", "Mercedes C-Class", "Audi A4", "VW Golf", "Porsche Taycan",
  "BMW iX", "Mercedes EQS", "Audi e-tron", "VW ID.4", "Porsche Cayenne",
  "Volvo XC90", "Toyota Camry", "Ford Mustang Mach-E", "Hyundai Ioniq 5",
];

const locations = [
  "Stuttgart, DE", "Munich, DE", "Wolfsburg, DE", "Ingolstadt, DE",
  "Gothenburg, SE", "Milan, IT", "Paris, FR", "Barcelona, ES",
  "Detroit, US", "Seoul, KR", "Tokyo, JP", "Shanghai, CN",
];

const statuses: ECU["status"][] = ["active", "active", "active", "active", "maintenance", "eol", "recovered", "in_recovery"];
const paths: ECU["circularPath"][] = ["repair", "reuse", "refurbish", "selective_recovery", "pending", "pending"];

function generateECUs(): ECU[] {
  const ecus: ECU[] = [];
  for (let i = 0; i < 24; i++) {
    const ecuModel = ecuModels[i % ecuModels.length];
    const vehicle = vehicles[i % vehicles.length];
    const status = statuses[i % statuses.length];
    const path = status === "active" ? "pending" : paths[i % paths.length];
    const totalWeight = 180 + Math.random() * 320;
    const crmContent = totalWeight * (0.02 + Math.random() * 0.08);
    const riskScore = 30 + Math.random() * 60;
    const healthScore = status === "eol" ? 10 + Math.random() * 20 : status === "maintenance" ? 40 + Math.random() * 30 : 60 + Math.random() * 35;
    const remainingLife = status === "eol" ? 0 : status === "maintenance" ? Math.floor(Math.random() * 12) : Math.floor(12 + Math.random() * 84);
    const year = 2019 + Math.floor(Math.random() * 6);
    const month = String(1 + Math.floor(Math.random() * 12)).padStart(2, "0");

    // Select 8-12 random materials for this ECU
    const numMats = 8 + Math.floor(Math.random() * 5);
    const shuffled = [...criticalMaterials].sort(() => Math.random() - 0.5).slice(0, numMats);
    const materials: ECUMaterial[] = shuffled.map((m) => ({
      name: m.name,
      weightGrams: m.gramsPerCircuit * (0.5 + Math.random() * 2),
      recoverable: m.recycleRate > 20,
      recoveryMethod: m.recycleRate > 40 ? "Hydrometallurgy" : m.recycleRate > 20 ? "Pyrometallurgy" : "Selective Leaching",
      valuePerKg: 5 + Math.random() * 500,
    }));

    const lifecycle: ECULifecycleEvent[] = [
      { date: `${year}-${month}-15`, type: "production", description: `Production ${ecuModel.model}`, location: "Reutlingen, DE" },
      { date: `${year}-${String(Number(month) + 1 > 12 ? 1 : Number(month) + 1).padStart(2, "0")}-10`, type: "installation", description: `Installed on ${vehicle}`, location: locations[i % locations.length] },
    ];
    if (status === "maintenance" || status === "eol" || status === "recovered") {
      lifecycle.push({ date: `${year + 2}-06-20`, type: "maintenance", description: "Scheduled maintenance", location: locations[i % locations.length] });
    }
    if (status === "eol" || status === "recovered") {
      lifecycle.push({ date: `${year + 4}-03-12`, type: "eol", description: "End of vehicle life", location: locations[i % locations.length] });
    }
    if (status === "recovered") {
      lifecycle.push({ date: `${year + 4}-05-01`, type: "recovery", description: `Recovery via ${path}`, location: "Reutlingen, DE" });
    }

    ecus.push({
      id: `ECU-${String(i + 1).padStart(4, "0")}`,
      model: ecuModel.model,
      partNumber: `0 ${261 + i} ${100 + Math.floor(Math.random() * 900)} ${Math.floor(Math.random() * 100)}`,
      vehicleModel: vehicle,
      vin: `WBA${String.fromCharCode(65 + i)}${Math.random().toString(36).substring(2, 14).toUpperCase()}`,
      productionDate: `${year}-${month}-15`,
      installationDate: `${year}-${String(Number(month) + 1 > 12 ? 1 : Number(month) + 1).padStart(2, "0")}-10`,
      status,
      circularPath: path,
      totalWeightGrams: Math.round(totalWeight * 10) / 10,
      crmContentGrams: Math.round(crmContent * 100) / 100,
      crmValueEuro: Math.round(crmContent * (0.5 + Math.random() * 2) * 100) / 100,
      riskScore: Math.round(riskScore),
      recoveryRate: Math.round(20 + Math.random() * 50),
      materials,
      lifecycle,
      dppId: `DPP-BOSCH-${String(i + 1).padStart(6, "0")}`,
      digitalTwinId: `DT-${ecuModel.model}-${String(i + 1).padStart(4, "0")}`,
      location: locations[i % locations.length],
      mileageKm: Math.round(5000 + Math.random() * 250000),
      healthScore: Math.round(healthScore),
      remainingLifeMonths: remainingLife,
    });
  }
  return ecus;
}

export const ecuInventory = generateECUs();

export const circularTriggers: CircularTrigger[] = [
  {
    id: "TRG-001", type: "eol_vehicle", label: "Vehicle End of Life",
    description: "Batch of 142 BMW 3 Series vehicles reaching scheduled end of life Q1 2026",
    timestamp: "2026-02-10T08:30:00Z", severity: "high", affectedECUs: 142,
    affectedMaterials: ["Cobalt", "Palladium", "Tantalum", "Indium"],
    status: "active",
  },
  {
    id: "TRG-002", type: "geopolitical_shock", label: "Geopolitical Shock — DRC",
    description: "Political instability in the Katanga region, Congo (DRC). Cobalt supply disruption expected +3 months",
    timestamp: "2026-02-08T14:15:00Z", severity: "critical", affectedECUs: 850,
    affectedMaterials: ["Cobalt", "Tantalum"],
    status: "active",
  },
  {
    id: "TRG-003", type: "price_volatility", label: "Palladium Price Volatility",
    description: "Palladium exceeds +25% quarterly change threshold. Hedging protocol activated",
    timestamp: "2026-02-05T10:00:00Z", severity: "high", affectedECUs: 400,
    affectedMaterials: ["Palladium"],
    status: "monitoring",
  },
  {
    id: "TRG-004", type: "regulatory_update", label: "EU Battery Regulation Update",
    description: "New minimum recycled content requirements for Cobalt (16%) and Lithium (6%) from 2027",
    timestamp: "2026-01-28T09:00:00Z", severity: "medium", affectedECUs: 1200,
    affectedMaterials: ["Cobalt", "Nickel", "Manganese"],
    status: "monitoring",
  },
  {
    id: "TRG-005", type: "component_replacement", label: "ECU-ESP9 Batch Replacement",
    description: "Recall campaign for 230 ECU-ESP9 units with firmware defect. CRM recovery opportunity",
    timestamp: "2026-01-20T11:30:00Z", severity: "medium", affectedECUs: 230,
    affectedMaterials: ["Platinum", "Gold", "Silver"],
    status: "resolved",
  },
  {
    id: "TRG-006", type: "geopolitical_shock", label: "China Export Restrictions — Germanium",
    description: "New Germanium export restrictions from China. Impact on global supply -30%",
    timestamp: "2026-02-12T16:00:00Z", severity: "critical", affectedECUs: 600,
    affectedMaterials: ["Germanium", "Indium", "Tungsten"],
    status: "active",
  },
];

// Financial simulation types
export interface FinancialScenario {
  label: string;
  capex: number;
  opex: number;
  annualCapacity: number;
  crmValuePerUnit: number;
  discountRate: number;
  years: number;
}

export const defaultFinancialScenario: FinancialScenario = {
  label: "Base Case",
  capex: 2500000,
  opex: 450000,
  annualCapacity: 5000,
  crmValuePerUnit: 185,
  discountRate: 0.08,
  years: 10,
};

// HaaS readiness metrics
export interface HaaSMetric {
  dimension: string;
  current: number;
  threshold: number;
  label: string;
}

export const haasMetrics: HaaSMetric[] = [
  { dimension: "Data Maturity", current: 62, threshold: 80, label: "Maturità dati DPP/Digital Twin" },
  { dimension: "Reverse Flow Stability", current: 45, threshold: 70, label: "Stabilità flussi inversi" },
  { dimension: "Supplier Integration", current: 38, threshold: 60, label: "Integrazione fornitori circolari" },
  { dimension: "Recovery Infrastructure", current: 55, threshold: 75, label: "Infrastruttura di recovery" },
  { dimension: "Regulatory Compliance", current: 72, threshold: 85, label: "Compliance normativa EU" },
  { dimension: "Financial Viability", current: 48, threshold: 65, label: "Sostenibilità finanziaria HaaS" },
];
