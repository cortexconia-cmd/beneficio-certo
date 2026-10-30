-- Os três benefícios gratuitos (Bolsa Família, Auxílio Gás e BPC) podem ser lidos por qualquer visitante,
-- com ou sem conta. Os demais continuam restritos às regras já existentes (conta com acesso).
-- Política permissiva: soma-se às existentes, sem alterar o que já era permitido.
drop policy if exists content_read_free_public on public.benefit_contents;
create policy content_read_free_public on public.benefit_contents
  for select to anon, authenticated
  using (
    exists (
      select 1 from public.benefits b
      where b.id = benefit_contents.benefit_id
        and b.is_published
        and b.slug in ('bolsa-familia', 'auxilio-gas', 'bpc', 'bpc-loas')
    )
  );

-- Metadados dos benefícios publicados precisam ser legíveis para o catálogo e para a página do benefício.
drop policy if exists benefits_read_published_public on public.benefits;
create policy benefits_read_published_public on public.benefits
  for select to anon, authenticated
  using (is_published);
