-- Add explicit AdminMaster capability to the existing admin system.
-- Exactly one extra privilege: managing other administrative accounts.
ALTER TABLE public.user_roles DROP CONSTRAINT IF EXISTS user_roles_role_check;
ALTER TABLE public.user_roles ADD CONSTRAINT user_roles_role_check
  CHECK (role IN ('user', 'admin', 'admin_master'));

-- Browser clients may read only their own roles under existing RLS, never assign them.
REVOKE INSERT, UPDATE, DELETE ON public.user_roles FROM anon, authenticated;

CREATE OR REPLACE FUNCTION public.admin_set_staff_role(
  p_actor uuid,
  p_target uuid,
  p_role text,
  p_reason text DEFAULT 'Gestão do painel administrativo'
) RETURNS boolean LANGUAGE plpgsql SECURITY INVOKER SET search_path = ''
AS $$
DECLARE
  v_target_email text;
  v_previous text;
  v_confirmed_at timestamptz;
BEGIN
  -- Serialize changes to administrative membership, especially the last-master check.
  PERFORM pg_catalog.pg_advisory_xact_lock(427831, 992014);
  IF NOT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id=p_actor AND role='admin_master') THEN
    RAISE EXCEPTION 'Somente AdminMaster pode gerenciar administradores';
  END IF;
  IF p_target IS NULL OR p_target=p_actor OR p_role NOT IN ('admin', 'admin_master', 'none') THEN
    RAISE EXCEPTION 'Alteração de permissão inválida ou sobre a própria conta';
  END IF;
  IF char_length(coalesce(p_reason,'')) NOT BETWEEN 8 AND 500 THEN
    RAISE EXCEPTION 'Informe uma justificativa válida';
  END IF;
  SELECT email,email_confirmed_at INTO v_target_email,v_confirmed_at
    FROM auth.users WHERE id=p_target FOR UPDATE;
  IF NOT FOUND OR nullif(v_target_email,'') IS NULL THEN
    RAISE EXCEPTION 'Conta de destino inexistente';
  END IF;
  v_previous := CASE
    WHEN EXISTS (SELECT 1 FROM public.user_roles WHERE user_id=p_target AND role='admin_master') THEN 'admin_master'
    WHEN EXISTS (SELECT 1 FROM public.user_roles WHERE user_id=p_target AND role='admin') THEN 'admin'
    ELSE 'none' END;
  IF v_previous=p_role THEN RETURN false; END IF;
  IF v_previous='admin_master' AND p_role <> 'admin_master'
     AND (SELECT count(DISTINCT user_id) FROM public.user_roles WHERE role='admin_master') <= 1
  THEN RAISE EXCEPTION 'Não é possível remover o último AdminMaster'; END IF;
  -- 'user' is a separate ordinary role and is not affected.
  DELETE FROM public.user_roles WHERE user_id=p_target AND role IN ('admin','admin_master');
  IF p_role IN ('admin','admin_master') THEN
    INSERT INTO public.user_roles(user_id,role) VALUES (p_target,'admin') ON CONFLICT DO NOTHING;
  END IF;
  IF p_role='admin_master' THEN
    INSERT INTO public.user_roles(user_id,role) VALUES (p_target,'admin_master') ON CONFLICT DO NOTHING;
  END IF;
  INSERT INTO public.audit_logs(actor_user_id,action,entity_type,entity_id,changes)
  VALUES (p_actor,'admin_operator_role_changed','user',p_target::text,
    pg_catalog.jsonb_build_object(
      'previous_role',v_previous,'new_role',p_role,
      'email',v_target_email,'email_confirmed',v_confirmed_at IS NOT NULL,
      'reason',trim(p_reason)));
  RETURN true;
END;
$$;
REVOKE ALL ON FUNCTION public.admin_set_staff_role(uuid,uuid,text,text) FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.admin_set_staff_role(uuid,uuid,text,text) TO service_role;
