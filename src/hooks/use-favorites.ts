import { useCallback } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";
import { supabase } from "@/integrations/supabase/client";

// Favorites belong to the account. Without a signed-in user there are none, and nothing can be saved.
export function useFavorites() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const userId = user?.id;
  const query = useQuery({
    queryKey: ["favorites", userId],
    enabled: !!userId,
    queryFn: async () => {
      const { data, error } = await supabase.from("user_favorites").select("benefit_slug").eq("user_id", userId!);
      if (error) throw error;
      return (data ?? []).map((row) => row.benefit_slug);
    },
  });
  const favorites = userId ? query.data ?? [] : [];

  // Throws when the change is not saved, so the caller can tell the person. A duplicate insert (the list was
  // not loaded yet) means the benefit is already saved, so it is not an error.
  const toggle = useCallback(async (slug: string) => {
    if (!userId) throw new Error("Entre na sua conta para favoritar.");
    const active = favorites.includes(slug);
    const result = active
      ? await supabase.from("user_favorites").delete().eq("user_id", userId).eq("benefit_slug", slug)
      : await supabase.from("user_favorites").insert({ user_id: userId, benefit_slug: slug });
    if (result.error && !(!active && result.error.code === "23505")) {
      console.error("Favorito não salvo:", result.error.message);
      throw new Error("Não foi possível atualizar seus favoritos. Tente novamente.");
    }
    await queryClient.invalidateQueries({ queryKey: ["favorites", userId] });
  }, [userId, favorites, queryClient]);

  const isFavorite = useCallback((slug: string) => favorites.includes(slug), [favorites]);

  return { favorites, toggle, isFavorite, loggedIn: !!userId, loading: !!userId && query.isPending };
}
