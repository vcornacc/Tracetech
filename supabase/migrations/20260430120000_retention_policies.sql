-- ============================================================
-- Retention Policies: auto-cleanup for audit log tables
-- ============================================================

-- Reusable cleanup function (called by pg_cron or data-refresh script)
CREATE OR REPLACE FUNCTION public.cleanup_old_logs()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Keep data_refresh_log for 90 days
  DELETE FROM public.data_refresh_log
  WHERE created_at < NOW() - INTERVAL '90 days';

  -- Keep resolved alert_log entries for 30 days after resolution
  DELETE FROM public.alert_log
  WHERE resolved_at IS NOT NULL
    AND resolved_at < NOW() - INTERVAL '30 days';
END;
$$;

-- Grant execution to service role so the ETL script can call it
GRANT EXECUTE ON FUNCTION public.cleanup_old_logs() TO service_role;

-- Schedule daily cleanup at 03:00 UTC via pg_cron (Supabase Pro / pg_cron extension).
-- If pg_cron is not enabled this block is safely skipped at apply time via DO block.
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_extension WHERE extname = 'pg_cron'
  ) THEN
    PERFORM cron.schedule(
      'cleanup-old-logs',   -- job name (idempotent)
      '0 3 * * *',          -- daily at 03:00 UTC
      $$SELECT public.cleanup_old_logs()$$
    );
  END IF;
EXCEPTION WHEN OTHERS THEN
  -- pg_cron not available; cleanup will be driven by the ETL script instead
  NULL;
END;
$$;
