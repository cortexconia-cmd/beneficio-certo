-- Current user choice controls whether a verified purchase may be attributed to Meta.
CREATE TABLE IF NOT EXISTS public.user_privacy_preferences(
 user_id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
 consent_marketing boolean NOT NULL DEFAULT false,
 updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.user_privacy_preferences ENABLE ROW LEVEL SECURITY;
-- Service-only writes/reads; none of these preferences are available over public Data API.
REVOKE ALL ON public.user_privacy_preferences FROM anon,authenticated;
GRANT ALL ON public.user_privacy_preferences TO service_role;
