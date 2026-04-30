-- ============================================================
-- PHASE 2: Data Refresh and Alert Audit Tables
-- ============================================================

CREATE TABLE IF NOT EXISTS public.data_refresh_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  source TEXT NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('success', 'warning', 'error')),
  started_at TIMESTAMPTZ NOT NULL,
  finished_at TIMESTAMPTZ NOT NULL,
  rows_affected INTEGER NOT NULL DEFAULT 0,
  warning_count INTEGER NOT NULL DEFAULT 0,
  error_message TEXT,
  details JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.data_refresh_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can read data_refresh_log"
  ON public.data_refresh_log
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Admins can manage data_refresh_log"
  ON public.data_refresh_log
  FOR ALL
  USING (public.has_role(auth.uid(), 'admin'));

CREATE INDEX IF NOT EXISTS idx_data_refresh_log_source_created_at
  ON public.data_refresh_log(source, created_at DESC);

CREATE TABLE IF NOT EXISTS public.alert_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  trigger_id UUID REFERENCES public.circular_triggers(id) ON DELETE SET NULL,
  material_id UUID REFERENCES public.materials(id) ON DELETE SET NULL,
  severity public.trigger_severity NOT NULL DEFAULT 'medium',
  title TEXT NOT NULL,
  description TEXT,
  acknowledged_by UUID REFERENCES auth.users(id),
  acknowledged_at TIMESTAMPTZ,
  resolved_at TIMESTAMPTZ,
  metadata JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.alert_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can read alert_log"
  ON public.alert_log
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Admins can manage alert_log"
  ON public.alert_log
  FOR ALL
  USING (public.has_role(auth.uid(), 'admin'));

CREATE INDEX IF NOT EXISTS idx_alert_log_created_at
  ON public.alert_log(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_alert_log_severity
  ON public.alert_log(severity);

CREATE TABLE IF NOT EXISTS public.scenario_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  scenario_name TEXT NOT NULL,
  source TEXT NOT NULL DEFAULT 'manual',
  parameters JSONB NOT NULL DEFAULT '{}',
  kpi_snapshot JSONB NOT NULL DEFAULT '{}',
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.scenario_history ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can read scenario_history"
  ON public.scenario_history
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can insert own scenario_history"
  ON public.scenario_history
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = created_by);

CREATE POLICY "Admins can manage scenario_history"
  ON public.scenario_history
  FOR ALL
  USING (public.has_role(auth.uid(), 'admin'));

CREATE INDEX IF NOT EXISTS idx_scenario_history_created_at
  ON public.scenario_history(created_at DESC);
