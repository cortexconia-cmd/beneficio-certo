-- SolvChat WhatsApp OTP: server-only state, 5-minute TTL, 5 attempts, 60-second resend, 5 sends/day.
create table if not exists public.phone_verifications (
  user_id uuid primary key references auth.users(id) on delete cascade,
  phone text not null,
  code_hash text,
  expires_at timestamptz,
  attempts integer not null default 0,
  sent_at timestamptz,
  window_started_at timestamptz not null default now(),
  sends_in_window integer not null default 0,
  verified_at timestamptz,
  updated_at timestamptz not null default now()
);
alter table public.phone_verifications enable row level security;
revoke all on public.phone_verifications from anon,authenticated;
create index if not exists phone_verifications_expiry on public.phone_verifications(expires_at);

-- Invoker-owned RPC used only by the Edge Function's service_role key.
create or replace function public.solvchat_reserve_code(
  p_user_id uuid, p_phone text, p_hash text
) returns boolean language plpgsql security invoker set search_path = ''
as $$
declare v public.phone_verifications%rowtype;
begin
  if p_phone !~ '^55[0-9]{10,11}$' or length(p_hash) != 64 then return false; end if;
  insert into public.phone_verifications(user_id,phone) values(p_user_id,p_phone)
    on conflict(user_id) do nothing;
  select * into v from public.phone_verifications where user_id=p_user_id for update;
  if v.verified_at is not null and v.phone=p_phone then return false; end if;
  if v.sent_at is not null and v.sent_at > now() - interval '60 seconds' then return false; end if;
  if v.window_started_at > now()-interval '24 hours' and v.sends_in_window>=5 then return false; end if;
  update public.phone_verifications set
    phone=p_phone, code_hash=p_hash, expires_at=now()+interval '5 minutes',
    attempts=0, sent_at=now(), verified_at=null, updated_at=now(),
    window_started_at=case when v.window_started_at <= now()-interval '24 hours' then now() else v.window_started_at end,
    sends_in_window=case when v.window_started_at <= now()-interval '24 hours' then 1 else v.sends_in_window+1 end
  where user_id=p_user_id;
  return true;
end;
$$;

create or replace function public.solvchat_verify_code(
  p_user_id uuid, p_phone text, p_hash text
) returns boolean language plpgsql security invoker set search_path = ''
as $$
declare v public.phone_verifications%rowtype;
begin
  select * into v from public.phone_verifications where user_id=p_user_id for update;
  if not found or v.phone<>p_phone or v.code_hash is null or v.expires_at<=now() or v.attempts>=5 then return false; end if;
  update public.phone_verifications set attempts=attempts+1,updated_at=now() where user_id=p_user_id;
  if v.code_hash<>p_hash then return false; end if;
  update public.phone_verifications set code_hash=null,expires_at=null,
    verified_at=now(),updated_at=now() where user_id=p_user_id;
  return true;
end;
$$;

-- Any change to profile WhatsApp invalidates previous verification (owner can update profile).
create or replace function public.invalidate_solvchat_verification()
returns trigger language plpgsql security definer set search_path = ''
as $$
begin
  if new.whatsapp is distinct from old.whatsapp then
    update public.phone_verifications set verified_at=null,code_hash=null,expires_at=null,updated_at=now() where user_id=new.id;
  end if;
  return new;
end;
$$;
drop trigger if exists trg_invalidate_solvchat_verification on public.profiles;
create trigger trg_invalidate_solvchat_verification
  after update of whatsapp on public.profiles for each row
  execute function public.invalidate_solvchat_verification();

revoke all on function public.solvchat_reserve_code(uuid,text,text) from public,anon,authenticated;
revoke all on function public.solvchat_verify_code(uuid,text,text) from public,anon,authenticated;
revoke all on function public.invalidate_solvchat_verification() from public,anon,authenticated;
grant execute on function public.solvchat_reserve_code(uuid,text,text) to service_role;
grant execute on function public.solvchat_verify_code(uuid,text,text) to service_role;
