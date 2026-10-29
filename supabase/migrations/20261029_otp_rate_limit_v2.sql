-- OTP request limits: 60s between sends; after 5 requests wait 1 hour; 3 more are allowed (8 in total),
-- then blocked until midnight the next day (America/Sao_Paulo). Apply BEFORE deploying the solvchat-otp function.
-- Returns {ok, reason, retry_at}; reason is one of: cooldown, hourly_limit, daily_limit, verified, invalid.
create or replace function public.solvchat_reserve_code_v2(
  p_user_id uuid, p_phone text, p_hash text
) returns jsonb language plpgsql security invoker set search_path = ''
as $$
declare
  v public.phone_verifications%rowtype;
  v_today date := (now() at time zone 'America/Sao_Paulo')::date;
  v_new_day boolean;
  v_count integer;
begin
  if p_phone !~ '^55[0-9]{10,11}$' or length(p_hash) != 64 then
    return jsonb_build_object('ok', false, 'reason', 'invalid');
  end if;
  insert into public.phone_verifications(user_id, phone) values (p_user_id, p_phone)
    on conflict (user_id) do nothing;
  select * into v from public.phone_verifications where user_id = p_user_id for update;
  if v.verified_at is not null and v.phone = p_phone then
    return jsonb_build_object('ok', false, 'reason', 'verified');
  end if;
  v_new_day := (v.window_started_at at time zone 'America/Sao_Paulo')::date < v_today;
  v_count := case when v_new_day then 0 else v.sends_in_window end;
  if v_count >= 8 then
    return jsonb_build_object('ok', false, 'reason', 'daily_limit',
      'retry_at', ((v_today + 1)::timestamp at time zone 'America/Sao_Paulo'));
  end if;
  if v_count = 5 and v.sent_at is not null and v.sent_at > now() - interval '1 hour' then
    return jsonb_build_object('ok', false, 'reason', 'hourly_limit', 'retry_at', v.sent_at + interval '1 hour');
  end if;
  if v.sent_at is not null and v.sent_at > now() - interval '60 seconds' then
    return jsonb_build_object('ok', false, 'reason', 'cooldown', 'retry_at', v.sent_at + interval '60 seconds');
  end if;
  update public.phone_verifications set
    phone = p_phone, code_hash = p_hash, expires_at = now() + interval '5 minutes',
    attempts = 0, sent_at = now(), verified_at = null, updated_at = now(),
    window_started_at = case when v_new_day then now() else v.window_started_at end,
    sends_in_window = v_count + 1
  where user_id = p_user_id;
  return jsonb_build_object('ok', true);
end;
$$;

revoke all on function public.solvchat_reserve_code_v2(uuid, text, text) from public, anon, authenticated;
grant execute on function public.solvchat_reserve_code_v2(uuid, text, text) to service_role;
