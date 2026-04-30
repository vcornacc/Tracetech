-- ============================================================
-- Alert snooze support: add snoozed_until column to alert_log
-- ============================================================

ALTER TABLE public.alert_log
  ADD COLUMN IF NOT EXISTS snoozed_until TIMESTAMPTZ;

-- Index to efficiently filter out snoozed rows in the alert feed
CREATE INDEX IF NOT EXISTS idx_alert_log_snoozed_until
  ON public.alert_log(snoozed_until)
  WHERE snoozed_until IS NOT NULL;
