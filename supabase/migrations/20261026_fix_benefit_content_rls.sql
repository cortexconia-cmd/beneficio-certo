-- Fix the entitlement comparison (previous policy compared g.benefit_id to itself).
drop policy if exists content_read_entitled on public.benefit_contents;
create policy content_read_entitled on public.benefit_contents
for select to anon, authenticated using (
 exists (select 1 from public.benefits b where b.id=benefit_contents.benefit_id and b.is_published)
 and (
   is_restricted = false
   or exists (
     select 1 from public.access_grants g
     where g.user_id=(select auth.uid())
       and g.revoked_at is null and g.starts_at<=now()
       and (g.expires_at is null or g.expires_at>now())
       and (g.access_scope='catalog' or (g.access_scope='benefit' and g.benefit_id=benefit_contents.benefit_id))
   )
 )
);
