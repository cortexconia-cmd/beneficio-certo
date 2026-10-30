import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { Heart } from "lucide-react";
import { useFavorites } from "@/hooks/use-favorites";
import { useLiveBenefits } from "@/hooks/use-live-benefits";
import { BenefitCard } from "@/components/BenefitCard";
import { LoginDialog } from "@/components/layout/LoginDialog";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/favoritos")({
  head: () => ({
    meta: [
      { title: "Favoritos — Projeto + Benefícios" },
      { name: "description", content: "Sua lista de benefícios salvos para consultar quando quiser." },
    ],
  }),
  component: FavoritesPage,
});

function FavoritesPage() {
  const { favorites, loggedIn, loading } = useFavorites();
  const { benefits } = useLiveBenefits();
  const [loginOpen, setLoginOpen] = useState(false);
  const saved = loggedIn ? benefits.filter((b) => favorites.includes(b.slug)) : [];

  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 py-6 sm:py-10 md:py-14">
      <header className="mb-6 sm:mb-10">
        <h1 className="text-2xl sm:text-4xl font-bold tracking-tight">Seus favoritos</h1>
        {loggedIn && !loading && (
          <p className="mt-1 sm:mt-2 text-sm sm:text-base text-muted-foreground">
            {saved.length} {saved.length === 1 ? "benefício salvo" : "benefícios salvos"}
          </p>
        )}
      </header>

      {!loggedIn ? (
        <div className="rounded-3xl border border-dashed border-border bg-secondary/30 p-12 text-center">
          <h2 className="text-xl font-semibold">Entre para ver seus favoritos</h2>
          <p className="mt-2 text-muted-foreground max-w-md mx-auto">Os favoritos são salvos na sua conta e aparecem sempre que você entrar.</p>
          <Button className="mt-6 rounded-full" onClick={() => setLoginOpen(true)}>Entrar ou criar conta</Button>
          <LoginDialog open={loginOpen} onOpenChange={setLoginOpen} />
        </div>
      ) : loading ? (
        <p role="status" className="text-muted-foreground">Carregando seus favoritos…</p>
      ) : saved.length === 0 ? (
        <div className="rounded-3xl border border-dashed border-border bg-secondary/30 p-12 text-center">
          <div className="mx-auto grid h-16 w-16 place-items-center rounded-full bg-primary-soft text-primary mb-4">
            <Heart className="h-7 w-7" />
          </div>
          <h2 className="text-xl font-semibold">Nenhum favorito ainda</h2>
          <p className="mt-2 text-muted-foreground max-w-md mx-auto">
            Salve benefícios para acessar facilmente. Toque no coração em qualquer benefício do catálogo.
          </p>
          <Button asChild className="mt-6 rounded-full">
            <Link to="/beneficios">Explorar benefícios</Link>
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
          {saved.map((b) => (
            <BenefitCard key={b.id} benefit={b} />
          ))}
        </div>
      )}
    </div>
  );
}
