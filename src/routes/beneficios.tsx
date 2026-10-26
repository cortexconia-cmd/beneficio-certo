import { Search, X } from "lucide-react";
import { useMemo } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { BenefitCard } from "@/components/BenefitCard";
import { benefits, searchBenefits } from "@/data/benefits";
import { categories } from "@/data/categories";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

type CatalogSearch = { q?: string; categoria?: string };

export const Route = createFileRoute("/beneficios")({
  validateSearch: (search: Record<string, unknown>): CatalogSearch => ({
    q: typeof search.q === "string" && search.q.length > 0 ? search.q : undefined,
    categoria:
      typeof search.categoria === "string" && search.categoria.length > 0
        ? search.categoria
        : undefined,
  }),
  head: () => ({
    meta: [
      { title: "Catálogo de Benefícios — Projeto + Benefícios" },
      { name: "description", content: "Explore todos os benefícios do governo organizados por categoria, com busca e filtros." },
    ],
  }),
  component: CatalogPage,
});

function CatalogPage() {
  const { q, categoria } = Route.useSearch();
  const navigate = Route.useNavigate();

  const filtered = useMemo(() => {
    let list = benefits;
    if (categoria) list = list.filter((b) => b.categoria === categoria);
    if (q) list = searchBenefits(q).filter((b) => !categoria || b.categoria === categoria);
    return list;
  }, [q, categoria]);

  const update = (patch: Record<string, string | undefined>) =>
    navigate({ search: (prev: Record<string, unknown>) => ({ ...prev, ...patch }) as never });

  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 py-6 sm:py-10 md:py-14">
      <header className="mb-5 sm:mb-8">
        <h1 className="text-2xl sm:text-4xl font-bold tracking-tight">Catálogo de Benefícios</h1>
        <p className="mt-1 sm:mt-2 text-sm sm:text-base text-muted-foreground">
          {filtered.length} {filtered.length === 1 ? "benefício encontrado" : "benefícios encontrados"}
        </p>
      </header>

      <div className="mb-4 sm:mb-6 sticky top-14 sm:top-16 z-30 -mx-4 sm:mx-0 px-4 sm:px-0 py-2 sm:py-0 bg-background/95 sm:bg-transparent backdrop-blur sm:backdrop-blur-none">
        <div className="relative">
        <Search className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <input
          type="search"
          inputMode="search"
          value={q ?? ""}
          onChange={(e) => update({ q: e.target.value || undefined })}
          placeholder="Buscar benefício..."
          className="w-full rounded-full border border-border bg-white pl-12 pr-4 py-3 text-base sm:text-sm shadow-soft outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
        />
        </div>
      </div>

      {/* Chips de categoria */}
      <div className="mb-6 sm:mb-8 flex gap-2 overflow-x-auto pb-2 -mx-4 sm:-mx-1 px-4 sm:px-1 scrollbar-none snap-x">
        <button
          onClick={() => update({ categoria: undefined })}
          className={cn(
            "shrink-0 snap-start rounded-full px-4 py-2 text-sm font-medium border transition",
            !categoria
              ? "bg-primary text-primary-foreground border-primary"
              : "border-border bg-white text-muted-foreground hover:text-foreground",
          )}
        >
          Todos
        </button>
        {categories.map((c) => (
          <button
            key={c.slug}
            onClick={() => update({ categoria: categoria === c.slug ? undefined : c.slug })}
            className={cn(
              "shrink-0 snap-start rounded-full px-4 py-2 text-sm font-medium border transition",
              categoria === c.slug
                ? "bg-primary text-primary-foreground border-primary"
                : "border-border bg-white text-muted-foreground hover:text-foreground",
            )}
          >
            {c.nome}
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-border bg-secondary/30 p-12 text-center">
          <p className="text-muted-foreground">Nenhum benefício encontrado.</p>
          <Button variant="link" onClick={() => navigate({ search: {} as never })}>
            <X className="h-4 w-4 mr-1" /> Limpar filtros
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
          {filtered.map((b) => (
            <BenefitCard key={b.id} benefit={b} />
          ))}
        </div>
      )}
    </div>
  );
}