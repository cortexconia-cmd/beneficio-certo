import { createFileRoute, Link } from "@tanstack/react-router";
import { Heart } from "lucide-react";
import { useFavorites } from "@/hooks/use-favorites";
import { benefits } from "@/data/benefits";
import { BenefitCard } from "@/components/benefits/BenefitCard";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/favoritos")({
  head: () => ({
    meta: [
      { title: "Favoritos — Projeto+Benefícios" },
      { name: "description", content: "Seus benefícios salvos para acesso rápido." },
      { property: "og:title", content: "Favoritos — Projeto+Benefícios" },
      { property: "og:description", content: "Seus benefícios salvos para acesso rápido." },
      { property: "og:type", content: "website" }, { name: "twitter:card", content: "summary" },
    ],
  }),
  component: FavoritesPage,
});

function FavoritesPage() {
  const { favorites } = useFavorites();
  const saved = benefits.filter((b) => favorites.includes(b.slug));

  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-10 animate-[fade-in_0.4s_ease-out]">
      <div className="mb-8">
        <h1 className="text-3xl sm:text-4xl font-bold tracking-tight">Seus favoritos</h1>
        <p className="text-muted-foreground mt-2">Benefícios que você salvou para acessar depois.</p>
      </div>

      {saved.length === 0 ? (
        <div className="text-center py-20 border border-dashed border-border rounded-2xl bg-card">
          <div className="inline-flex size-14 items-center justify-center rounded-full bg-primary-soft text-primary mb-4">
            <Heart className="size-6" />
          </div>
          <p className="text-lg font-medium">Nenhum benefício salvo ainda</p>
          <p className="text-muted-foreground mt-1 max-w-sm mx-auto">
            Clique no coração nos benefícios que te interessam para salvá-los aqui.
          </p>
          <Button asChild className="mt-6">
            <Link to="/beneficios">Explorar benefícios</Link>
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {saved.map((b) => (
            <BenefitCard key={b.slug} benefit={b} />
          ))}
        </div>
      )}
    </div>
  );
}
