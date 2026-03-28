-- ============================================================
-- PHASE 1: Critical Raw Materials Database Schema
-- ============================================================
-- Three data domains:
--   1. Product Data (BOM): ECUs + material compositions
--   2. Public Data: EU CRM lists, price volatility, geopolitical risk
--   3. Sustainability: GWP and environmental impact per material
-- ============================================================

-- ============================================================
-- ENUMS
-- ============================================================
CREATE TYPE public.material_cluster AS ENUM ('systemic', 'product', 'sectoral', 'operational');
CREATE TYPE public.ecu_status AS ENUM ('active', 'maintenance', 'eol', 'recovered', 'in_recovery');
CREATE TYPE public.circular_path AS ENUM ('repair', 'reuse', 'refurbish', 'selective_recovery', 'pending');
CREATE TYPE public.trigger_type AS ENUM ('eol_vehicle', 'component_replacement', 'geopolitical_shock', 'price_volatility', 'regulatory_update', 'supply_disruption');
CREATE TYPE public.trigger_severity AS ENUM ('low', 'medium', 'high', 'critical');
CREATE TYPE public.trigger_status AS ENUM ('active', 'resolved', 'monitoring');
CREATE TYPE public.lifecycle_event_type AS ENUM ('production', 'installation', 'maintenance', 'replacement', 'eol', 'recovery');

-- ============================================================
-- 1. CRITICAL MATERIALS (Public Data + Sustainability)
-- ============================================================
CREATE TABLE public.materials (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  formula TEXT,
  cas_number TEXT,
  -- BOM data: grams per standard circuit board
  grams_per_circuit NUMERIC(12,7) NOT NULL DEFAULT 0,
  -- Price data (€/kg)
  price_per_kg NUMERIC(12,2) DEFAULT 0,
  -- Yale Criticality methodology score (0-100)
  yale_score NUMERIC(5,1) NOT NULL DEFAULT 0,
  -- EU Supply Risk × Economic Importance
  eu_sr_x_ei NUMERIC(5,2) NOT NULL DEFAULT 0,
  -- Cluster classification (Yale + EU methodology)
  cluster material_cluster NOT NULL DEFAULT 'operational',
  -- Herfindahl-Hirschman Index (supplier concentration, 0-10000)
  hhi INTEGER NOT NULL DEFAULT 0,
  -- Current recycle rate (%)
  recycle_rate NUMERIC(5,1) NOT NULL DEFAULT 0,
  -- Top producing countries (array)
  top_producers TEXT[] DEFAULT '{}',
  -- EU CRM list inclusion
  eu_crm_listed BOOLEAN NOT NULL DEFAULT false,
  eu_crm_year INTEGER,
  -- ============================================================
  -- Risk profile dimensions (0-100 each)
  -- ============================================================
  risk_supply NUMERIC(5,1) NOT NULL DEFAULT 50,
  risk_geopolitical NUMERIC(5,1) NOT NULL DEFAULT 50,
  risk_price_volatility NUMERIC(5,1) NOT NULL DEFAULT 50,
  risk_recycle_gap NUMERIC(5,1) NOT NULL DEFAULT 50,
  risk_esg NUMERIC(5,1) NOT NULL DEFAULT 50,
  risk_concentration_hhi NUMERIC(5,1) NOT NULL DEFAULT 50,
  -- ============================================================
  -- Sustainability indicators
  -- ============================================================
  gwp_kg_co2_per_kg NUMERIC(10,2),        -- Global Warming Potential (kg CO2e / kg material)
  water_usage_l_per_kg NUMERIC(10,2),       -- Water footprint (liters / kg)
  energy_mj_per_kg NUMERIC(10,2),           -- Energy intensity (MJ / kg)
  -- ============================================================
  -- Geopolitical risk data per country
  -- ============================================================
  country_risk_scores JSONB DEFAULT '{}',   -- {"DRC": 92, "China": 65, ...}
  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.materials ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated users can read materials" ON public.materials FOR SELECT TO authenticated USING (true);
CREATE POLICY "Admins can manage materials" ON public.materials FOR ALL USING (public.has_role(auth.uid(), 'admin'));

-- ============================================================
-- 2. ECU MODELS (product templates)
-- ============================================================
CREATE TABLE public.ecu_models (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  model_code TEXT NOT NULL UNIQUE,       -- e.g. "ECU-MDG1"
  description TEXT,                       -- e.g. "Motor Drive Gateway"
  base_weight_grams NUMERIC(8,1),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.ecu_models ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated users can read ecu_models" ON public.ecu_models FOR SELECT TO authenticated USING (true);
CREATE POLICY "Admins can manage ecu_models" ON public.ecu_models FOR ALL USING (public.has_role(auth.uid(), 'admin'));

-- ============================================================
-- 3. ECU INVENTORY (individual units)
-- ============================================================
CREATE TABLE public.ecus (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ecu_code TEXT NOT NULL UNIQUE,          -- "ECU-0001"
  model_id UUID REFERENCES public.ecu_models(id),
  part_number TEXT,
  vehicle_model TEXT,
  vin TEXT,
  production_date DATE,
  installation_date DATE,
  status ecu_status NOT NULL DEFAULT 'active',
  circular_path circular_path NOT NULL DEFAULT 'pending',
  total_weight_grams NUMERIC(8,1),
  crm_content_grams NUMERIC(8,2),
  crm_value_euro NUMERIC(10,2),
  risk_score NUMERIC(5,1),
  recovery_rate NUMERIC(5,1),
  dpp_id TEXT,                            -- Digital Product Passport
  digital_twin_id TEXT,
  location TEXT,
  mileage_km INTEGER,
  health_score NUMERIC(5,1),
  remaining_life_months INTEGER,
  -- Owner org (for multi-tenant)
  owner_id UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.ecus ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated users can read ecus" ON public.ecus FOR SELECT TO authenticated USING (true);
CREATE POLICY "Admins can manage ecus" ON public.ecus FOR ALL USING (public.has_role(auth.uid(), 'admin'));

-- ============================================================
-- 4. ECU-MATERIAL COMPOSITION (BOM junction)
-- ============================================================
CREATE TABLE public.ecu_materials (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ecu_id UUID NOT NULL REFERENCES public.ecus(id) ON DELETE CASCADE,
  material_id UUID NOT NULL REFERENCES public.materials(id) ON DELETE CASCADE,
  weight_grams NUMERIC(10,4) NOT NULL DEFAULT 0,
  recoverable BOOLEAN NOT NULL DEFAULT false,
  recovery_method TEXT,
  value_per_kg NUMERIC(10,2),
  UNIQUE(ecu_id, material_id)
);

ALTER TABLE public.ecu_materials ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated users can read ecu_materials" ON public.ecu_materials FOR SELECT TO authenticated USING (true);
CREATE POLICY "Admins can manage ecu_materials" ON public.ecu_materials FOR ALL USING (public.has_role(auth.uid(), 'admin'));

-- ============================================================
-- 5. ECU LIFECYCLE EVENTS
-- ============================================================
CREATE TABLE public.ecu_lifecycle_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ecu_id UUID NOT NULL REFERENCES public.ecus(id) ON DELETE CASCADE,
  event_type lifecycle_event_type NOT NULL,
  event_date DATE NOT NULL,
  description TEXT,
  location TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.ecu_lifecycle_events ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated users can read ecu_lifecycle_events" ON public.ecu_lifecycle_events FOR SELECT TO authenticated USING (true);
CREATE POLICY "Admins can manage ecu_lifecycle_events" ON public.ecu_lifecycle_events FOR ALL USING (public.has_role(auth.uid(), 'admin'));

-- ============================================================
-- 6. CIRCULAR TRIGGERS (events & alerts)
-- ============================================================
CREATE TABLE public.circular_triggers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  trigger_code TEXT NOT NULL UNIQUE,
  trigger_type trigger_type NOT NULL,
  label TEXT NOT NULL,
  description TEXT,
  triggered_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  severity trigger_severity NOT NULL DEFAULT 'medium',
  affected_ecus_count INTEGER DEFAULT 0,
  affected_materials TEXT[] DEFAULT '{}',
  status trigger_status NOT NULL DEFAULT 'active',
  -- Optional JSON payload for simulation parameters
  payload JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.circular_triggers ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated users can read circular_triggers" ON public.circular_triggers FOR SELECT TO authenticated USING (true);
CREATE POLICY "Admins can manage circular_triggers" ON public.circular_triggers FOR ALL USING (public.has_role(auth.uid(), 'admin'));

-- ============================================================
-- 7. SIMULATION SCENARIOS (What-if)
-- ============================================================
CREATE TABLE public.simulation_scenarios (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  created_by UUID REFERENCES auth.users(id),
  -- Scenario parameters as flexible JSON
  parameters JSONB NOT NULL DEFAULT '{}',
  -- Computed results stored after calculation
  results JSONB DEFAULT '{}',
  is_baseline BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.simulation_scenarios ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can read own scenarios" ON public.simulation_scenarios FOR SELECT TO authenticated USING (true);
CREATE POLICY "Users can insert own scenarios" ON public.simulation_scenarios FOR INSERT TO authenticated WITH CHECK (auth.uid() = created_by);
CREATE POLICY "Users can update own scenarios" ON public.simulation_scenarios FOR UPDATE TO authenticated USING (auth.uid() = created_by);
CREATE POLICY "Users can delete own scenarios" ON public.simulation_scenarios FOR DELETE TO authenticated USING (auth.uid() = created_by);

-- ============================================================
-- 8. PRICE HISTORY (for volatility tracking)
-- ============================================================
CREATE TABLE public.material_price_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  material_id UUID NOT NULL REFERENCES public.materials(id) ON DELETE CASCADE,
  price_per_kg NUMERIC(12,2) NOT NULL,
  recorded_date DATE NOT NULL,
  source TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(material_id, recorded_date)
);

ALTER TABLE public.material_price_history ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated users can read price_history" ON public.material_price_history FOR SELECT TO authenticated USING (true);
CREATE POLICY "Admins can manage price_history" ON public.material_price_history FOR ALL USING (public.has_role(auth.uid(), 'admin'));

-- ============================================================
-- 9. FINANCIAL SCENARIOS
-- ============================================================
CREATE TABLE public.financial_scenarios (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  label TEXT NOT NULL,
  capex NUMERIC(12,2) NOT NULL DEFAULT 2500000,
  opex NUMERIC(12,2) NOT NULL DEFAULT 450000,
  annual_capacity INTEGER NOT NULL DEFAULT 5000,
  crm_value_per_unit NUMERIC(10,2) NOT NULL DEFAULT 185,
  discount_rate NUMERIC(5,4) NOT NULL DEFAULT 0.08,
  years INTEGER NOT NULL DEFAULT 10,
  created_by UUID REFERENCES auth.users(id),
  results JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.financial_scenarios ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can read own financial scenarios" ON public.financial_scenarios FOR SELECT TO authenticated USING (true);
CREATE POLICY "Users can insert own financial scenarios" ON public.financial_scenarios FOR INSERT TO authenticated WITH CHECK (auth.uid() = created_by);
CREATE POLICY "Users can update own financial scenarios" ON public.financial_scenarios FOR UPDATE TO authenticated USING (auth.uid() = created_by);

-- ============================================================
-- INDEXES for performance
-- ============================================================
CREATE INDEX idx_materials_cluster ON public.materials(cluster);
CREATE INDEX idx_materials_yale_score ON public.materials(yale_score DESC);
CREATE INDEX idx_ecus_status ON public.ecus(status);
CREATE INDEX idx_ecus_model_id ON public.ecus(model_id);
CREATE INDEX idx_ecu_materials_ecu_id ON public.ecu_materials(ecu_id);
CREATE INDEX idx_ecu_materials_material_id ON public.ecu_materials(material_id);
CREATE INDEX idx_ecu_lifecycle_ecu_id ON public.ecu_lifecycle_events(ecu_id);
CREATE INDEX idx_triggers_status ON public.circular_triggers(status);
CREATE INDEX idx_triggers_severity ON public.circular_triggers(severity);
CREATE INDEX idx_price_history_material ON public.material_price_history(material_id, recorded_date DESC);

-- ============================================================
-- UPDATE TIMESTAMP TRIGGERS
-- ============================================================
CREATE TRIGGER update_materials_updated_at BEFORE UPDATE ON public.materials FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();
CREATE TRIGGER update_ecus_updated_at BEFORE UPDATE ON public.ecus FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();
CREATE TRIGGER update_triggers_updated_at BEFORE UPDATE ON public.circular_triggers FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();
CREATE TRIGGER update_simulation_updated_at BEFORE UPDATE ON public.simulation_scenarios FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();
CREATE TRIGGER update_financial_updated_at BEFORE UPDATE ON public.financial_scenarios FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

-- ============================================================
-- COMPUTED VIEWS for dashboard
-- ============================================================

-- Cluster distribution summary
CREATE OR REPLACE VIEW public.v_cluster_distribution AS
SELECT
  cluster,
  COUNT(*) AS material_count,
  ROUND(AVG(yale_score), 1) AS avg_yale_score,
  ROUND(AVG(eu_sr_x_ei), 2) AS avg_eu_sr_ei,
  ROUND(AVG(risk_supply), 1) AS avg_risk_supply,
  ROUND(AVG(risk_geopolitical), 1) AS avg_risk_geopolitical,
  ROUND(AVG(risk_price_volatility), 1) AS avg_risk_price_volatility,
  ROUND(AVG(risk_recycle_gap), 1) AS avg_risk_recycle_gap,
  ROUND(AVG(risk_esg), 1) AS avg_risk_esg,
  ROUND(AVG(risk_concentration_hhi), 1) AS avg_risk_concentration
FROM public.materials
GROUP BY cluster;

-- ECU risk exposure summary
CREATE OR REPLACE VIEW public.v_ecu_risk_exposure AS
SELECT
  e.id AS ecu_id,
  e.ecu_code,
  e.vehicle_model,
  e.status,
  e.circular_path,
  e.crm_value_euro,
  e.risk_score,
  COUNT(em.id) AS material_count,
  SUM(em.weight_grams) AS total_crm_grams,
  SUM(em.weight_grams * COALESCE(em.value_per_kg, 0) / 1000) AS estimated_crm_value,
  ROUND(AVG(m.yale_score), 1) AS avg_yale_score,
  MAX(m.yale_score) AS max_yale_score,
  ARRAY_AGG(DISTINCT m.cluster) AS clusters_present
FROM public.ecus e
LEFT JOIN public.ecu_materials em ON e.id = em.ecu_id
LEFT JOIN public.materials m ON em.material_id = m.id
GROUP BY e.id, e.ecu_code, e.vehicle_model, e.status, e.circular_path, e.crm_value_euro, e.risk_score;

-- Material exposure across all ECUs
CREATE OR REPLACE VIEW public.v_material_exposure AS
SELECT
  m.id AS material_id,
  m.name,
  m.cluster,
  m.yale_score,
  m.eu_sr_x_ei,
  m.price_per_kg,
  COUNT(DISTINCT em.ecu_id) AS ecu_count,
  SUM(em.weight_grams) AS total_grams_in_fleet,
  SUM(em.weight_grams * COALESCE(m.price_per_kg, 0) / 1000) AS total_value_exposed,
  m.risk_supply,
  m.risk_geopolitical,
  m.risk_price_volatility,
  m.risk_recycle_gap
FROM public.materials m
LEFT JOIN public.ecu_materials em ON m.id = em.material_id
GROUP BY m.id, m.name, m.cluster, m.yale_score, m.eu_sr_x_ei, m.price_per_kg,
         m.risk_supply, m.risk_geopolitical, m.risk_price_volatility, m.risk_recycle_gap;
