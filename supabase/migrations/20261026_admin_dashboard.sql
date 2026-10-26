-- Admin console functions operate only with service_role from the authenticated Edge Function.
-- No public admin read policies are introduced; normal users retain existing RLS.
CREATE OR REPLACE FUNCTION public.admin_dashboard_stats(p_since timestamptz)
RETURNS jsonb LANGUAGE sql STABLE SECURITY INVOKER SET search_path = ''
AS $$
  SELECT pg_catalog.jsonb_build_object(
    'totalUsers',(SELECT count(*) FROM public.profiles),
    'newUsers',(SELECT count(*) FROM public.profiles WHERE created_at >= p_since),
    'sessions',(SELECT count(*) FROM public.visitor_sessions WHERE started_at >= p_since),
    'uniqueVisitors',(SELECT count(DISTINCT visitor_id) FROM public.visitor_sessions WHERE started_at >= p_since),
    'registrationStarted',(SELECT count(*) FROM public.tracking_events WHERE event_name = 'registration_started' AND occurred_at >= p_since),
    'ordersCreated',(SELECT count(*) FROM public.orders WHERE created_at >= p_since),
    'checkoutStarted',(SELECT count(*) FROM public.orders WHERE external_checkout_id IS NOT NULL AND created_at >= p_since),
    'paidOrders',(SELECT count(*) FROM public.orders WHERE status = 'paid' AND created_at >= p_since),
    'pendingOrders',(SELECT count(*) FROM public.orders WHERE status IN ('pending','checkout_created') AND created_at >= p_since),
    'revenueCents',(SELECT coalesce(sum(amount_cents),0) FROM public.orders WHERE status = 'paid' AND created_at >= p_since),
    'refundedCents',(SELECT coalesce(sum(amount_cents),0) FROM public.orders WHERE status IN ('refunded','chargeback') AND created_at >= p_since),
    'activeAccess',(SELECT count(DISTINCT user_id) FROM public.access_grants WHERE revoked_at IS NULL AND starts_at <= now() AND (expires_at IS NULL OR expires_at > now())),
    'publishedBenefits',(SELECT count(*) FROM public.benefits WHERE is_published),
    'totalBenefits',(SELECT count(*) FROM public.benefits),
    'daily',(SELECT coalesce(jsonb_agg(jsonb_build_object(
        'date', to_char(d.day,'YYYY-MM-DD'),
        'registrations',(SELECT count(*) FROM public.profiles WHERE created_at >= d.day AND created_at < d.day + interval '1 day'),
        'sessions',(SELECT count(*) FROM public.visitor_sessions WHERE started_at >= d.day AND started_at < d.day + interval '1 day'),
        'purchases',(SELECT count(*) FROM public.orders WHERE status='paid' AND created_at >= d.day AND created_at < d.day + interval '1 day')
      ) ORDER BY d.day),'[]'::jsonb)
      FROM generate_series(p_since::date, now()::date, interval '1 day') AS d(day))
  );
$$;

CREATE OR REPLACE FUNCTION public.admin_acquisition_report(p_since timestamptz)
RETURNS jsonb LANGUAGE sql STABLE SECURITY INVOKER SET search_path = ''
AS $$
SELECT coalesce(jsonb_agg(jsonb_build_object(
 'source',src,'campaign',campaign,'attributions',total,'registeredUsers',registered
) ORDER BY total DESC),'[]'::jsonb)
FROM (
  SELECT coalesce(nullif(utm_source,''),'Sem origem') AS src,
         coalesce(nullif(utm_campaign,''),'Sem campanha') AS campaign,
         count(*) AS total, count(DISTINCT user_id) AS registered
  FROM public.attributions WHERE captured_at >= p_since
  GROUP BY 1,2 ORDER BY count(*) DESC LIMIT 30
) x;
$$;

CREATE OR REPLACE FUNCTION public.admin_save_benefit(
  p_actor uuid, p_benefit uuid, p_payload jsonb
) RETURNS boolean LANGUAGE plpgsql SECURITY INVOKER SET search_path = ''
AS $$
DECLARE v_slug text;
BEGIN
  IF NOT EXISTS(SELECT 1 FROM public.user_roles WHERE user_id=p_actor AND role='admin') THEN
    RAISE EXCEPTION 'not authorized';
  END IF;
  IF jsonb_typeof(p_payload) <> 'object'
    OR length(trim(coalesce(p_payload->>'name',''))) NOT BETWEEN 3 AND 160
    OR length(coalesce(p_payload->>'short_description','')) > 600
    OR length(coalesce(p_payload->>'what_is','')) > 15000
    OR jsonb_typeof(p_payload->'who_qualifies') <> 'array'
    OR jsonb_typeof(p_payload->'value_info') <> 'array'
    OR jsonb_typeof(p_payload->'how_to_apply') <> 'array'
    OR jsonb_typeof(p_payload->'documents') <> 'array'
    OR jsonb_typeof(p_payload->'important') NOT IN ('object','array')
    OR jsonb_typeof(p_payload->'is_published') <> 'boolean'
  THEN RAISE EXCEPTION 'invalid benefit payload';
  END IF;
  SELECT slug INTO v_slug FROM public.benefits WHERE id=p_benefit FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'benefit not found'; END IF;
  IF (p_payload->>'category_id') IS NOT NULL AND NOT EXISTS(
    SELECT 1 FROM public.categories WHERE id=(p_payload->>'category_id')::uuid
  ) THEN RAISE EXCEPTION 'unknown category'; END IF;
  UPDATE public.benefits SET
    name=trim(p_payload->>'name'),
    short_description=coalesce(p_payload->>'short_description',''),
    category_id=(p_payload->>'category_id')::uuid,
    is_published=(p_payload->>'is_published')::boolean,
    updated_at=now()
  WHERE id=p_benefit;
  UPDATE public.benefit_contents SET
    what_is=p_payload->>'what_is',
    who_qualifies=p_payload->'who_qualifies',
    value_info=p_payload->'value_info',
    how_to_apply=p_payload->'how_to_apply',
    documents=p_payload->'documents',
    important=p_payload->'important',
    updated_at=now()
  WHERE benefit_id=p_benefit;
  IF NOT FOUND THEN RAISE EXCEPTION 'content record not found'; END IF;
  -- Slug and is_restricted never change here: exactly three free benefits remain free.
  INSERT INTO public.audit_logs(actor_user_id,action,entity_type,entity_id,changes)
  VALUES (p_actor,'admin_benefit_saved','benefit',p_benefit::text,
          jsonb_build_object('slug',v_slug,'published',p_payload->'is_published'));
  RETURN true;
END;
$$;

CREATE OR REPLACE FUNCTION public.admin_update_price(p_actor uuid, p_cents integer)
RETURNS boolean LANGUAGE plpgsql SECURITY INVOKER SET search_path = ''
AS $$
DECLARE previous jsonb;
BEGIN
  IF NOT EXISTS(SELECT 1 FROM public.user_roles WHERE user_id=p_actor AND role='admin') THEN
    RAISE EXCEPTION 'not authorized';
  END IF;
  IF p_cents < 100 OR p_cents > 100000 THEN RAISE EXCEPTION 'invalid price'; END IF;
  SELECT value INTO previous FROM public.platform_settings WHERE key='catalog_price_cents' FOR UPDATE;
  INSERT INTO public.platform_settings(key,value,updated_at)
  VALUES ('catalog_price_cents',to_jsonb(p_cents),now())
  ON CONFLICT(key) DO UPDATE SET value=excluded.value,updated_at=now();
  INSERT INTO public.audit_logs(actor_user_id,action,entity_type,entity_id,changes)
  VALUES(p_actor,'admin_price_updated','setting','catalog_price_cents',
      jsonb_build_object('previous',previous,'new',p_cents));
  RETURN true;
END;
$$;

CREATE OR REPLACE FUNCTION public.admin_manual_access(
  p_actor uuid, p_user uuid, p_action text, p_reason text, p_expiry timestamptz DEFAULT NULL
) RETURNS boolean LANGUAGE plpgsql SECURITY INVOKER SET search_path = ''
AS $$
DECLARE changed integer;
BEGIN
  IF NOT EXISTS(SELECT 1 FROM public.user_roles WHERE user_id=p_actor AND role='admin') THEN
    RAISE EXCEPTION 'not authorized';
  END IF;
  IF NOT EXISTS(SELECT 1 FROM public.profiles WHERE id=p_user) THEN RAISE EXCEPTION 'unknown user'; END IF;
  IF p_action NOT IN ('grant','revoke') OR length(trim(coalesce(p_reason,''))) < 8 OR length(p_reason)>500
    THEN RAISE EXCEPTION 'invalid access action or justification'; END IF;
  IF p_action='grant' THEN
    IF p_expiry IS NOT NULL AND p_expiry <= now() THEN RAISE EXCEPTION 'expiry must be in the future'; END IF;
    -- Prevent duplicate manual grants or redundant manual overrides when an Asaas grant is active.
    IF EXISTS(SELECT 1 FROM public.access_grants WHERE user_id=p_user AND access_scope='catalog'
       AND revoked_at IS NULL AND starts_at<=now() AND (expires_at IS NULL OR expires_at>now()))
    THEN RETURN false; END IF;
    INSERT INTO public.access_grants(user_id,access_scope,starts_at,expires_at)
      VALUES(p_user,'catalog',now(),p_expiry);
    changed:=1;
  ELSE
    -- Never revoke Asaas-owned purchases from manual access management.
    UPDATE public.access_grants SET revoked_at=now()
    WHERE user_id=p_user AND order_id IS NULL AND access_scope='catalog' AND revoked_at IS NULL;
    GET DIAGNOSTICS changed=ROW_COUNT;
    IF changed=0 THEN RETURN false; END IF;
  END IF;
  INSERT INTO public.audit_logs(actor_user_id,action,entity_type,entity_id,changes)
  VALUES(p_actor,'admin_access_'||p_action,'user',p_user::text,
    jsonb_build_object('reason',trim(p_reason),'expires_at',p_expiry,'count',changed));
  RETURN true;
END;
$$;

REVOKE ALL ON FUNCTION public.admin_dashboard_stats(timestamptz) FROM PUBLIC,anon,authenticated;
REVOKE ALL ON FUNCTION public.admin_acquisition_report(timestamptz) FROM PUBLIC,anon,authenticated;
REVOKE ALL ON FUNCTION public.admin_save_benefit(uuid,uuid,jsonb) FROM PUBLIC,anon,authenticated;
REVOKE ALL ON FUNCTION public.admin_update_price(uuid,integer) FROM PUBLIC,anon,authenticated;
REVOKE ALL ON FUNCTION public.admin_manual_access(uuid,uuid,text,text,timestamptz) FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.admin_dashboard_stats(timestamptz) TO service_role;
GRANT EXECUTE ON FUNCTION public.admin_acquisition_report(timestamptz) TO service_role;
GRANT EXECUTE ON FUNCTION public.admin_save_benefit(uuid,uuid,jsonb) TO service_role;
GRANT EXECUTE ON FUNCTION public.admin_update_price(uuid,integer) TO service_role;
GRANT EXECUTE ON FUNCTION public.admin_manual_access(uuid,uuid,text,text,timestamptz) TO service_role;
