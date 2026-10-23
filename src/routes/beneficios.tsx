import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { Search, X } from "lucide-react";
import { benefits } from "@/data/benefits";
import { categories } from "@/data/categories";
import { BenefitCard } from "@/components/benefits/BenefitCard";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

interface Search {
  q: string;
  category: string;
}

export const Route = createFileRoute("/beneficios")({
  validateSearch: (search: Record<string, unknown>): Search => ({
    q: typeof search.q === "string" ? search.q : "",
    category: typeof search.category === "string" ? search.category : "",
  }),
  head: () => ({
    meta: [
      { title: "Benefícios — Projeto+Benefícios" },
      { name: "description", content: "Explore todos os benefícios sociais disponíveis. Filtre por categoria e busque pelo nome." },
    ],
  }),
  component: BenefitsPage,
});

function BenefitsPage() {
  const { q, category } = Route.useSearch();
  const navigate = useNavigate();
  const [query, setQuery] = useState(q);
  const [loading, setLoading] = useState(true);

  useEffect(() => setQuery(q), [q]);
  useEffect(() => {
    const t = setTimeout(() => setLoading(false), 300);
    return () => clearTimeout(t);
  }, []);

  const filtered = useMemo(() => {
    const term = query.trim().toLowerCase();
    return benefits.filter((b) => {
      if (category && b.category !== category) return false;
      if (!term) return true;
      return (
        b.name.toLowerCase().includes(term) ||
        b.shortDescription.toLowerCase().includes(term)
      );
    });
  }, [query, category]);

  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-10 animate-[fade-in_0.4s_ease-out]">
      <div className="mb-8">
        <h1 className="text-3xl sm:text-4xl font-bold tracking-tight">Catálogo de benefícios</h1>
        <p className="text-muted-foreground mt-2">Encontre o benefício certo para você e sua família.</p>
      </div>

      <div className="relative mb-6">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 size-5 text-muted-foreground pointer-events-none" />
        <input
          type="search"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            navigate({ to: "/beneficios", search: { q: e.target.value, category }, replace: true });
          }}
          placeholder="Buscar por nome ou palavra-chave..."
          className="w-full h-14 rounded-full border border-border bg-card pl-12 pr-4 text-base outline-none shadow-card focus:border-primary focus:ring-4 focus:ring-primary/10"
        />
      </div>

      <div className="flex flex-wrap gap-2 mb-8">
        <button
          onClick={() => navigate({ to: "/beneficios", search: { q: query, category: "" } })}
          className={cn(
            "px-4 py-2 rounded-full text-sm font-medium transition-colors border",
            !category ? "bg-primary text-primary-foreground border-primary" : "bg-card border-border hover:border-primary/40",
          )}
        >
          Todos
        </button>
        {categories.map((c) => (
          <button
            key={c.id}
            onClick={() => navigate({ to: "/beneficios", search: { q: query, category: c.id } })}
            className={cn(
              "px-4 py-2 rounded-full text-sm font-medium transition-colors border",
              category === c.id ? "bg-primary text-primary-foreground border-primary" : "bg-card border-border hover:border-primary/40",
            )}
          >
            {c.name}
          </button>
        ))}
        {(category || query) && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate({ to: "/beneficios", search: { q: "", category: "" } })}
            className="gap-1"
          >
            <X className="size-4" /> Limpar
          </Button>
        )}
      </div>

      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-72 rounded-2xl" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-20 border border-dashed border-border rounded-2xl">
          <p className="text-lg font-medium">Nenhum benefício encontrado</p>
          <p className="text-muted-foreground mt-1">Tente outra busca ou remova os filtros.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {filtered.map((b) => (
            <BenefitCard key={b.slug} benefit={b} />
          ))}
        </div>
      )}
    </div>
  );
}
