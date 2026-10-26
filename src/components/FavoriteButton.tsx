import { Heart } from "lucide-react";
import { useFavorites } from "@/hooks/use-favorites";
import { cn } from "@/lib/utils";

interface Props {
  slug: string;
  className?: string;
  size?: "sm" | "md";
}

export function FavoriteButton({ slug, className, size = "md" }: Props) {
  const { isFavorite, toggle } = useFavorites();
  const active = isFavorite(slug);

  return (
    <button
      type="button"
      aria-label={active ? "Remover dos favoritos" : "Adicionar aos favoritos"}
      aria-pressed={active}
      onClick={(e) => {
        e.preventDefault();
        e.stopPropagation();
        toggle(slug);
      }}
      className={cn(
        "inline-flex items-center justify-center rounded-full bg-white/95 backdrop-blur transition-all hover:scale-110 active:scale-95 shadow-soft",
        size === "sm" ? "h-8 w-8" : "h-10 w-10",
        className,
      )}
    >
      <Heart
        className={cn(
          "transition-colors",
          size === "sm" ? "h-4 w-4" : "h-5 w-5",
          active ? "fill-red-500 stroke-red-500" : "stroke-slate-700",
        )}
      />
    </button>
  );
}