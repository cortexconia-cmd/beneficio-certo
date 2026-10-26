-- Beneficio Certo: catalog purchase, webhook deduplication and least-privilege read/write.
-- Apply to the existing Guia_beneficios database; no destructive operations.
insert into public.platform_settings(key, value)
values ('catalog_price_cents', '2990'::jsonb)
on conflict (key) do nothing;

create unique index if not exists access_grants_one_catalog_per_order
on public.access_grants(order_id)
where access_scope = 'catalog' and order_id is not null;

create index if not exists orders_checkout_lookup
on public.orders(external_checkout_id) where external_checkout_id is not null;

-- Browser users may read only their own order/grant/payment records. 
-- Order creation, price decisions, webhook writes and entitlement issuance are service-role only.
revoke insert, update, delete on public.orders from anon, authenticated;
revoke insert, update, delete on public.payments from anon, authenticated;
revoke insert, update, delete on public.access_grants from anon, authenticated;
revoke all on public.webhook_events from anon, authenticated;
revoke all on public.platform_settings from anon, authenticated;

-- The platform's free preview comes from fixed client metadata, never from paid content.
-- All full guide content must eventually be stored behind benefit_contents RLS.
