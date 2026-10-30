import { Heart } from "lucide-react";
import { useFavorites } from "@/hooks/use-favorites";
import { cn } from "@/lib/utils";

interface Props {
  slug: string;
  className?: string;
  size?: "sm" | "md";
}

// Favoriting needs a signed-in account. Signed out, the button is shown disabled.
export function FavoriteButton({ slug, className, size = "md" }: Props) {
  const { isFavorite, toggle, loggedIn } = useFavorites();
  const active = isFavorite(slug);
  const label = !loggedIn ? "Entre na sua conta para favoritar" : active ? "Remover dos favoritos" : "Adicionar aos favoritos";

  return (
    <button
      type="button"
      disabled={!loggedIn}
      title={label}
      aria-label={label}
      aria-pressed={active}
      onClick={(e) => {
        e.preventDefault();
        e.stopPropagation();
        void toggle(slug);
      }}
      className={cn(
        "inline-flex items-center justify-center rounded-full bg-white/95 backdrop-blur transition-all hover:scale-110 active:scale-95 shadow-soft",
        loggedIn ? "" : "cursor-not-allowed opacity-50 hover:scale-100",
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
