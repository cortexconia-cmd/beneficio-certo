import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight, Sparkles } from "lucide-react";
import { categories } from "@/data/categories";
import { benefits } from "@/data/benefits";
import { updates } from "@/data/updates";
import { SearchBar } from "@/components/benefits/SearchBar";
import { CategoryCard } from "@/components/benefits/CategoryCard";
import { BenefitCard } from "@/components/benefits/BenefitCard";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Projeto+Benefícios — Descubra benefícios em 2026" },
      { name: "description", content: "Catálogo simples e organizado com explicações fáceis sobre benefícios do governo brasileiro." },
    ],
  }),
  component: Index,
});

function Index() {
  const featured = benefits.slice(0, 4);
  const recentUpdates = updates.slice(0, 3);

  return (
    <div className="animate-[fade-in_0.4s_ease-out]">
      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-primary-soft via-background to-background" />
        <div className="absolute top-0 right-0 size-[480px] rounded-full bg-primary/10 blur-3xl -translate-y-1/3 translate-x-1/4" />
        <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-20 lg:py-28">
          <div className="max-w-3xl">
            <Badge variant="secondary" className="mb-6 gap-1.5 bg-card border border-border">
              <Sparkles className="size-3.5 text-primary" />
              Atualizado para 2026
            </Badge>
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight text-foreground">
              Descubra benefícios que podem ajudar{" "}
              <span className="text-primary">você e sua família</span> em 2026
            </h1>
            <p className="mt-6 text-lg text-muted-foreground max-w-2xl">
              Um catálogo simples e organizado com explicações fáceis sobre benefícios do governo. Encontre o que você
              tem direito em poucos cliques.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Button asChild size="lg" className="gap-2 h-12 px-6 text-base">
                <Link to="/beneficios">
                  Explorar benefícios
                  <ArrowRight className="size-4" />
                </Link>
              </Button>
              <Button asChild variant="outline" size="lg" className="h-12 px-6 text-base">
                <Link to="/atualizacoes">Ver atualizações</Link>
              </Button>
            </div>
            <div className="mt-10 max-w-2xl">
              <SearchBar size="lg" />
            </div>
          </div>
        </div>
      </section>

      {/* Categorias */}
      <section className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-16">
        <div className="flex items-end justify-between mb-8">
          <div>
            <h2 className="text-2xl sm:text-3xl font-bold tracking-tight">Navegue por categoria</h2>
            <p className="text-muted-foreground mt-2">Encontre rapidamente o que você precisa.</p>
          </div>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
          {categories.map((c) => (
            <CategoryCard key={c.id} category={c} />
          ))}
        </div>
      </section>

      {/* Guia 2026 */}
      <section className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8">
        <div className="relative overflow-hidden rounded-3xl border border-border bg-gradient-to-br from-primary via-primary to-indigo-700 p-8 sm:p-12 text-primary-foreground">
          <div className="absolute -top-12 -right-12 size-64 rounded-full bg-white/10 blur-2xl" />
          <div className="relative max-w-2xl">
            <Badge className="mb-4 bg-white/15 text-white border-0 hover:bg-white/20">Guia completo 2026</Badge>
            <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold tracking-tight">
              Aprenda tudo sobre o CadÚnico e seus direitos
            </h2>
            <p className="mt-3 text-white/85 text-base sm:text-lg">
              Um guia organizado em capítulos com explicações simples sobre como se cadastrar, acumular benefícios e
              evitar bloqueios.
            </p>
            <Button asChild size="lg" variant="secondary" className="mt-6 gap-2 h-12 px-6 text-base">
              <Link to="/guia">
                Ler o guia <ArrowRight className="size-4" />
              </Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Destaques */}
      <section className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8">

        <div className="flex items-end justify-between mb-8">
          <div>
            <h2 className="text-2xl sm:text-3xl font-bold tracking-tight">Benefícios em destaque</h2>
            <p className="text-muted-foreground mt-2">Os mais procurados pelos brasileiros.</p>
          </div>
          <Link to="/beneficios" className="hidden sm:inline-flex items-center gap-1 text-sm font-medium text-primary hover:underline">
            Ver todos <ArrowRight className="size-4" />
          </Link>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {featured.map((b) => (
            <BenefitCard key={b.slug} benefit={b} />
          ))}
        </div>
      </section>

      {/* Atualizações */}
      <section className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-16">
        <div className="flex items-end justify-between mb-8">
          <div>
            <h2 className="text-2xl sm:text-3xl font-bold tracking-tight">Atualizações recentes</h2>
            <p className="text-muted-foreground mt-2">Fique por dentro das mudanças mais importantes.</p>
          </div>
          <Link to="/atualizacoes" className="hidden sm:inline-flex items-center gap-1 text-sm font-medium text-primary hover:underline">
            Ver todas <ArrowRight className="size-4" />
          </Link>
        </div>
        <div className="grid gap-4 md:grid-cols-3">
          {recentUpdates.map((u) => (
            <div key={u.id} className="rounded-2xl border border-border bg-card p-6 shadow-card hover-lift">
              <Badge variant="secondary" className="mb-3 capitalize">{u.type.replace("-", " ")}</Badge>
              <h3 className="font-semibold text-foreground">{u.title}</h3>
              <p className="text-sm text-muted-foreground mt-2">{u.summary}</p>
              <p className="text-xs text-muted-foreground mt-4">
                {new Date(u.date).toLocaleDateString("pt-BR", { day: "2-digit", month: "long", year: "numeric" })}
              </p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
