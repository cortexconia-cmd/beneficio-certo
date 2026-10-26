import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { Search, ArrowRight, Sparkles } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { CategoryCard } from "@/components/CategoryCard";
import { BenefitCard } from "@/components/BenefitCard";
import { categories } from "@/data/categories";
import { useLiveBenefits } from "@/hooks/use-live-benefits";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Projeto + Benefícios — Início" },
      {
        name: "description",
        content:
          "Descubra benefícios do governo que podem ajudar você e sua família em 2026. Catálogo simples, claro e organizado.",
      },
      { property: "og:title", content: "Projeto + Benefícios" },
      {
        property: "og:description",
        content: "Catálogo digital de benefícios do governo brasileiro.",
      },
    ],
  }),
  component: HomePage,
});

function HomePage() {
  const { benefits } = useLiveBenefits();
  const navigate = useNavigate();
  const [q, setQ] = useState("");
  const destaques = benefits.filter((b) => b.destaque).slice(0, 6);

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    navigate({ to: "/beneficios", search: { q: q || undefined } as never });
  };

  return (
    <div>
      {/* Hero */}
      <section className="relative overflow-hidden gradient-hero">
        <div className="absolute inset-0 opacity-40" aria-hidden>
          <div className="absolute top-10 -left-20 h-72 w-72 rounded-full bg-primary/20 blur-3xl" />
          <div className="absolute bottom-0 right-0 h-96 w-96 rounded-full bg-accent/40 blur-3xl" />
        </div>
        <div className="relative mx-auto max-w-7xl px-4 sm:px-6 py-12 md:py-24 lg:py-28">
          <div className="max-w-3xl">
            <div className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-white/70 px-3 py-1 text-xs font-medium text-primary backdrop-blur">
              <Sparkles className="h-3.5 w-3.5" />
              Atualizado para 2026
            </div>
            <h1 className="mt-4 text-3xl sm:text-5xl lg:text-6xl font-bold tracking-tight text-foreground">
              Descubra benefícios que podem ajudar{" "}
              <span className="bg-gradient-to-r from-primary to-blue-600 bg-clip-text text-transparent">
                você e sua família
              </span>{" "}
              em 2026
            </h1>
            <p className="mt-4 text-base sm:text-lg text-muted-foreground max-w-2xl">
              Um catálogo simples e organizado com explicações fáceis sobre benefícios do governo brasileiro.
            </p>

            <div className="mt-6 sm:mt-8 flex flex-wrap gap-3">
              <Button asChild size="lg" className="rounded-full px-6 gradient-primary border-0 text-white hover:opacity-95 h-12">
                <Link to="/beneficios">
                  Explorar benefícios
                  <ArrowRight className="ml-1 h-4 w-4" />
                </Link>
              </Button>
              <Button asChild size="lg" variant="outline" className="rounded-full px-6 h-12">
                <Link to="/ajuda">Onde buscar ajuda</Link>
              </Button>
            </div>

            <form onSubmit={submit} className="mt-8 sm:mt-10 relative max-w-2xl">
              <Search className="pointer-events-none absolute left-4 sm:left-5 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
              <input
                type="search"
                inputMode="search"
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="Procure por Bolsa Família, Auxílio Gás, Pé-de-Meia..."
                className="w-full rounded-full border border-border bg-white pl-12 sm:pl-14 pr-14 sm:pr-32 py-3.5 sm:py-4 text-base shadow-soft outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20"
              />
              <Button
                type="submit"
                aria-label="Buscar"
                className="absolute right-1.5 sm:right-2 top-1/2 -translate-y-1/2 rounded-full h-10 w-10 sm:w-auto sm:px-5 p-0 sm:p-2"
              >
                <Search className="h-4 w-4 sm:hidden" />
                <span className="hidden sm:inline">Buscar</span>
              </Button>
            </form>
          </div>
        </div>
      </section>

      {/* Categorias */}
      <section className="mx-auto max-w-7xl px-4 sm:px-6 py-10 sm:py-16">
        <div className="flex items-end justify-between flex-wrap gap-4 mb-6 sm:mb-8">
          <div>
            <h2 className="text-xl sm:text-3xl font-bold tracking-tight">Categorias</h2>
            <p className="mt-1 sm:mt-2 text-sm sm:text-base text-muted-foreground">Navegue pelos temas que mais se encaixam na sua vida.</p>
          </div>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4">
          {categories.map((c) => (
            <CategoryCard key={c.slug} category={c} />
          ))}
        </div>
      </section>

      {/* Destaques */}
      <section className="mx-auto max-w-7xl px-4 sm:px-6 pb-10 sm:pb-16">
        <div className="flex items-end justify-between flex-wrap gap-4 mb-6 sm:mb-8">
          <div>
            <h2 className="text-xl sm:text-3xl font-bold tracking-tight">Benefícios em destaque</h2>
            <p className="mt-1 sm:mt-2 text-sm sm:text-base text-muted-foreground">Os programas mais procurados pelos brasileiros.</p>
          </div>
          <Link
            to="/beneficios"
            className="inline-flex items-center text-sm font-medium text-primary hover:gap-2 transition-all gap-1"
          >
            Ver todos <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
          {destaques.map((b) => (
            <BenefitCard key={b.id} benefit={b} />
          ))}
        </div>
      </section>
    </div>
  );
}