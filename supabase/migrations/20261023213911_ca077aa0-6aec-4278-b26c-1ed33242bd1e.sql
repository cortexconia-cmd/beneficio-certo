CREATE OR REPLACE FUNCTION public.handle_new_beneficio_user()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = '' AS $$
BEGIN
 INSERT INTO public.profiles(id,full_name,whatsapp,email)
 VALUES(new.id,coalesce(nullif(trim(new.raw_user_meta_data->>'full_name'),''),''),nullif(new.raw_user_meta_data->>'whatsapp',''),new.email)
 ON CONFLICT(id) DO NOTHING;
 RETURN new;
END;
$$;
REVOKE EXECUTE ON FUNCTION public.handle_new_beneficio_user() FROM PUBLIC, anon, authenticated;
DO $$
BEGIN
 IF NOT EXISTS (
 SELECT 1 FROM pg_trigger t JOIN pg_proc p ON p.oid=t.tgfoid
 WHERE t.tgrelid='auth.users'::regclass AND NOT t.tgisinternal
 AND (t.tgtype & 4)=4 AND (t.tgtype & 1)=1 AND (t.tgtype & 2)=0
 AND (p.proname='handle_new_beneficio_user' OR pg_get_functiondef(p.oid) ~* 'insert\s+into\s+(public\.)?profiles')
 ) THEN
 CREATE TRIGGER on_beneficio_user_created AFTER INSERT ON auth.users
 FOR EACH ROW EXECUTE FUNCTION public.handle_new_beneficio_user();
 END IF;
END;
$$;
REVOKE INSERT ON public.profiles FROM anon, authenticated;
REVOKE INSERT (id, full_name, whatsapp, email, created_at, updated_at) ON public.profiles FROM anon, authenticated;
REVOKE UPDATE ON public.profiles FROM authenticated;
REVOKE UPDATE (id, full_name, whatsapp, email, created_at, updated_at) ON public.profiles FROM authenticated;
GRANT UPDATE (full_name, whatsapp, updated_at) ON public.profiles TO authenticated;