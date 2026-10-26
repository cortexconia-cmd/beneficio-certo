-- Automatically entitle administrative staff to the published premium catalog.
-- Preserve the existing purchase grants, per-benefit grants and free-benefit behavior.
DROP POLICY IF EXISTS content_read_entitled ON public.benefit_contents;
CREATE POLICY content_read_entitled ON public.benefit_contents
FOR SELECT TO authenticated
USING (
  EXISTS (SELECT 1 FROM public.benefits b
          WHERE b.id=benefit_contents.benefit_id AND b.is_published)
  AND (
    NOT is_restricted
    OR EXISTS (
      SELECT 1 FROM public.user_roles r
      WHERE r.user_id=(SELECT auth.uid()) AND r.role IN ('admin','admin_master')
    )
    OR EXISTS (
      SELECT 1 FROM public.access_grants g
      WHERE g.user_id=(SELECT auth.uid()) AND g.revoked_at IS NULL
        AND g.starts_at<=now() AND (g.expires_at IS NULL OR g.expires_at>now())
        AND (g.access_scope='catalog' OR
           (g.access_scope='benefit' AND g.benefit_id=benefit_contents.benefit_id))
    )
  )
);
-- Price and payment records are intentionally not changed.
