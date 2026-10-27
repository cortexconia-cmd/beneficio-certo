-- Launch hardening: do not expose internal event-trigger function over PostgREST.
REVOKE EXECUTE ON FUNCTION public.rls_auto_enable() FROM PUBLIC, anon, authenticated;
-- Tracking records are written exclusively by the validated Edge Function with service_role.
-- This preserves existing RLS with no direct anonymous INSERT grants.
CREATE UNIQUE INDEX IF NOT EXISTS ux_tracking_events_event_id
ON public.tracking_events (event_id) WHERE event_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_tracking_events_visitor_time ON public.tracking_events(visitor_id,occurred_at DESC);
CREATE INDEX IF NOT EXISTS idx_attributions_visitor_time ON public.attributions(visitor_id,captured_at DESC);
CREATE INDEX IF NOT EXISTS idx_sessions_visitor_time ON public.visitor_sessions(visitor_id,started_at DESC);
