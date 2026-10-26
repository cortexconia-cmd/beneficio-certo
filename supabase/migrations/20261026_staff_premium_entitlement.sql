-- Admin / AdminMaster automatically read all published premium guides.
-- Ordinary users still require an active purchased or manually granted entitlement.
DROP POLICY IF EXISTS content_read_entitled ON public.benefit_contents;
CREATE POLICY content_read_entitled ON public.benefit_contents
FOR SELECT TO authenticated
USING (
  EXISTS (SELECT 1 FROM public.benefits b
    WHERE b.id = benefit_contents.benefit_id AND b.is_published)
  AND (
    is_restricted = false
    OR EXISTS (SELECT 1 FROM public.user_roles ur
      WHERE ur.user_id = (SELECT auth.uid()) AND ur.role IN ('admin','admin_master'))
    OR EXISTS (SELECT 1 FROM public.access_grants g
      WHERE g.user_id = (SELECT auth.uid())
        AND g.revoked_at IS NULL AND g.starts_at <= now()
        AND (g.expires_at IS NULL OR g.expires_at > now())
        AND (g.access_scope='catalog'
          OR (g.access_scope='benefit' AND g.benefit_id=benefit_contents.benefit_id)))
  )
);
