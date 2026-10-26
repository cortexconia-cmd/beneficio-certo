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
        .select("slug,name,short_description,category_id,is_published")
        .eq("is_published", true)
        .order("sort_order");
      if (error) throw error;
      return data;
    },
  });
  if (!query.data) return { benefits: staticBenefits, loading: query.isPending, error: query.error };
  const visible = new Map(query.data.map(b => [b.slug === "bpc-loas" ? "bpc" : b.slug, b]));
  const categorySlugs = new Map(categories.map(c => [c.slug, c.slug]));
  const result = staticBenefits.filter(b => visible.has(b.slug)).map(b => {
    const live = visible.get(b.slug)!;
    // Category metadata remains compatible with the source asset package.
    return { ...b, nome: live.name, descricaoCurta: live.short_description ?? b.descricaoCurta,
      categoria: categorySlugs.has(b.categoria) ? b.categoria : b.categoria } satisfies Benefit;
  });
  return { benefits: result, loading: false, error: query.error };
}
