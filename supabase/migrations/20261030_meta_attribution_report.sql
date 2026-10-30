-- Aquisição por origem do primeiro contato (primeiro toque) com compras e receita.
-- attributions agora guarda um registro por mudança de origem: a primeira origem é o registro mais antigo do
-- visitante e a última é o mais recente. Visitantes que se cadastram ficam vinculados à conta (user_id).
-- Compras são pagamentos confirmados (status = 'paid') de usuários cujo primeiro contato está no período.
CREATE OR REPLACE FUNCTION public.admin_acquisition_report(p_since timestamptz)
RETURNS jsonb LANGUAGE sql STABLE SECURITY INVOKER SET search_path = ''
AS $$
WITH first_touch AS (
  SELECT DISTINCT ON (visitor_id)
         visitor_id, user_id,
         coalesce(nullif(utm_source,''),'Sem origem')   AS src,
         coalesce(nullif(utm_campaign,''),'Sem campanha') AS campaign
  FROM public.attributions
  WHERE captured_at >= p_since
  ORDER BY visitor_id, captured_at ASC
),
paid AS (
  SELECT user_id, sum(amount_cents) AS cents
  FROM public.orders
  WHERE status = 'paid' AND created_at >= p_since
  GROUP BY user_id
),
grouped AS (
  SELECT f.src, f.campaign,
         count(*)                         AS visitors,
         count(f.user_id)                 AS registered,
         count(DISTINCT p.user_id)        AS purchases,
         coalesce(sum(p.cents), 0)        AS revenue
  FROM first_touch f
  LEFT JOIN paid p ON p.user_id = f.user_id
  GROUP BY f.src, f.campaign
)
SELECT coalesce(jsonb_agg(jsonb_build_object(
  'source', g.src,
  'campaign', g.campaign,
  'attributions', (SELECT count(*) FROM public.attributions a
                    WHERE a.captured_at >= p_since
                      AND coalesce(nullif(a.utm_source,''),'Sem origem') = g.src
                      AND coalesce(nullif(a.utm_campaign,''),'Sem campanha') = g.campaign),
  'visitors', g.visitors,
  'registeredUsers', g.registered,
  'purchases', g.purchases,
  'revenueCents', g.revenue
) ORDER BY g.visitors DESC), '[]'::jsonb)
FROM (SELECT * FROM grouped ORDER BY visitors DESC LIMIT 30) g;
$$;
