import { useQuery } from "@tanstack/react-query";
import { benefits as staticBenefits } from "@/data/benefits";
import { supabase } from "@/integrations/supabase/client";
import type { Benefit } from "@/types/benefit";
import { categories } from "@/data/categories";

/** Keeps the original artwork/design while reflecting admin-edited public metadata.
 *  Full paid guidance is never loaded here.
 */
export function useLiveBenefits() {
  const query = useQuery({
    queryKey: ["public-benefit-metadata"],
    staleTime: 15_000,
    retry: 1,
    queryFn: async () => {
      const { data, error } = await supabase.from("benefits")
        .select("id,slug,name,short_description,category_id,is_published,categories(slug)")
        .eq("is_published", true)
        .order("sort_order");
      if (error) throw error;
      return data;
    },
  });
  if (!query.data) return { benefits: staticBenefits, loading: query.isPending, error: query.error };
  const staticBySlug = new Map(staticBenefits.map(b => [b.slug, b]));
  const result: Benefit[] = query.data.map(row => {
    const slug = row.slug === "bpc-loas" ? "bpc" : row.slug;
    const original = staticBySlug.get(slug);
    const category = row.categories as unknown as { slug?: string } | null;
    const categorySlug = categories.find(c => c.slug === category?.slug)?.slug ?? original?.categoria ?? "complementares";
    return {
      id: row.id,
      slug,
      nome: row.name,
      categoria: categorySlug,
      descricaoCurta: row.short_description ?? original?.descricaoCurta ?? "",
      valor: original?.valor,
      imagem: original?.imagem,
      destaque: original?.destaque ?? false,
      oQueE: original?.oQueE ?? "",
      quemTemDireito: original?.quemTemDireito ?? [],
      documentos: original?.documentos ?? [],
      comoSolicitar: original?.comoSolicitar ?? [],
      errosComuns: original?.errosComuns ?? [],
      dicas: original?.dicas ?? [],
      faq: original?.faq ?? [],
    } satisfies Benefit;
  });
  return { benefits: result, loading: false, error: query.error };
}
