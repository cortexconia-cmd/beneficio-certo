DROP INDEX IF EXISTS public.ux_tracking_events_event_id;
CREATE UNIQUE INDEX IF NOT EXISTS ux_tracking_events_event_id ON public.tracking_events(event_id);
