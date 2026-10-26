-- Atomic, idempotent Asaas webhook reconciliation.
-- Callable solely by service_role; authorization must be verified by webhook Edge Function first.
create or replace function public.process_asaas_webhook(
  p_event_id text,
  p_event_type text,
  p_checkout_id text,
  p_order_reference text,
  p_payload jsonb
) returns boolean
language plpgsql security invoker set search_path = ''
as $$
declare
  v_order public.orders%rowtype;
  v_event uuid;
begin
  if p_event_id is null or length(p_event_id) < 3 then raise exception 'invalid event id'; end if;
  if p_event_type not in ('CHECKOUT_PAID','CHECKOUT_CANCELED','CHECKOUT_EXPIRED','PAYMENT_REFUNDED','PAYMENT_CHARGEBACK_REQUESTED','PAYMENT_CHARGEBACK_DISPUTE') then
    return false;
  end if;
  if p_event_type like 'CHECKOUT_%' then
    select * into v_order from public.orders
    where external_checkout_id = p_checkout_id for update;
  elsif p_order_reference ~* '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$' then
    select * into v_order from public.orders where id = p_order_reference::uuid for update;
  end if;
  if v_order.id is null then raise exception 'unrecognized order'; end if;
  insert into public.webhook_events(provider,external_event_id,event_type,payload)
  values ('asaas', p_event_id, p_event_type, p_payload)
  on conflict (provider,external_event_id) do nothing
  returning id into v_event;
  if v_event is null then return false; end if;

  if p_event_type = 'CHECKOUT_PAID' then
    -- A prior refund or chargeback takes precedence over stale payment retries.
    if v_order.status not in ('refunded','chargeback') then
      update public.orders set status='paid', updated_at=now() where id=v_order.id;
      insert into public.payments(order_id,provider,provider_payment_id,method,status,amount_cents,confirmed_at)
      values(v_order.id,'asaas','checkout:'||p_checkout_id,'other','paid',v_order.amount_cents,now())
      on conflict(provider_payment_id) do update set status='paid', confirmed_at=excluded.confirmed_at;
      insert into public.access_grants(user_id,order_id,access_scope,starts_at)
      values(v_order.user_id,v_order.id,'catalog',now()) on conflict do nothing;
    end if;
  elsif p_event_type in ('CHECKOUT_CANCELED','CHECKOUT_EXPIRED') then
    if v_order.status not in ('paid','refunded','chargeback') then
      update public.orders set status = case when p_event_type='CHECKOUT_EXPIRED' then 'expired' else 'cancelled' end,updated_at=now()
      where id=v_order.id;
    end if;
  elsif p_event_type in ('PAYMENT_REFUNDED','PAYMENT_CHARGEBACK_REQUESTED','PAYMENT_CHARGEBACK_DISPUTE') then
    update public.orders set status=case when p_event_type='PAYMENT_REFUNDED' then 'refunded' else 'chargeback' end,updated_at=now() where id=v_order.id;
    update public.payments set status=case when p_event_type='PAYMENT_REFUNDED' then 'refunded' else 'chargeback' end where order_id=v_order.id;
    update public.access_grants set revoked_at=coalesce(revoked_at,now()) where order_id=v_order.id;
  end if;
  update public.webhook_events set processing_status='processed', processed_at=now() where id=v_event;
  return true;
end;
$$;
revoke all on function public.process_asaas_webhook(text,text,text,text,jsonb) from public,anon,authenticated;
grant execute on function public.process_asaas_webhook(text,text,text,text,jsonb) to service_role;
