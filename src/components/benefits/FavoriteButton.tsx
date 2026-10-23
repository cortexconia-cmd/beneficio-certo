import { Heart } from "lucide-react";
import { useFavorites } from "@/hooks/use-favorites";
import { cn } from "@/lib/utils";

interface Props {
  slug: string;
  className?: string;
  size?: number;
}

export function FavoriteButton({ slug, className, size = 18 }: Props) {
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
        "inline-flex items-center justify-center rounded-full bg-white/95 backdrop-blur shadow-soft transition-all hover:scale-110 active:scale-95",
        "size-9",
        className,
      )}
    >
      <Heart
        size={size}
        className={cn("transition-colors", active ? "fill-destructive text-destructive" : "text-muted-foreground")}
      />
    </button>
  );
}
