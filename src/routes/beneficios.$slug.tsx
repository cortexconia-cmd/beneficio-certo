import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import * as Icons from "lucide-react";
import { ArrowLeft, AlertTriangle } from "lucide-react";
import { getBenefit, benefits } from "@/data/benefits";
import { getCategory } from "@/data/categories";
import { FavoriteButton } from "@/components/benefits/FavoriteButton";
import { Badge } from "@/components/ui/badge";

export const Route = createFileRoute("/beneficios/$slug")({
  loader: ({ params }) => {
    const benefit = getBenefit(params.slug);
    if (!benefit) throw notFound();
    return { benefit };
  },
  head: ({ loaderData }) => ({
    meta: loaderData
      ? [
          { title: `${loaderData.benefit.name} — Projeto+Benefícios` },
          { name: "description", content: loaderData.benefit.shortDescription },
          { property: "og:title", content: loaderData.benefit.name },
          { property: "og:description", content: loaderData.benefit.shortDescription },
        ]
      : [],
  }),
  notFoundComponent: () => (
    <div className="mx-auto max-w-2xl px-4 py-20 text-center">
      <h1 className="text-3xl font-bold">Benefício não encontrado</h1>
      <p className="mt-2 text-muted-foreground">O benefício que você procura não existe ou foi removido.</p>
      <Link to="/beneficios" className="mt-6 inline-block text-primary font-medium">Ver todos os benefícios</Link>
    </div>
  ),
  errorComponent: ({ error }) => (
    <div className="mx-auto max-w-2xl px-4 py-20 text-center">
      <h1 className="text-2xl font-bold">Erro ao carregar</h1>
      <p className="mt-2 text-muted-foreground">{(error as Error).message}</p>
    </div>
  ),
  component: BenefitPage,
});

function BenefitPage() {
  const { benefit } = Route.useLoaderData() as { benefit: import("@/lib/types").Benefit };
  const category = getCategory(benefit.category);
  const Icon = (Icons as unknown as Record<string, React.ComponentType<{ className?: string }>>)[benefit.icon] ?? Icons.Sparkles;
  const related = benefits.filter((b) => b.category === benefit.category && b.slug !== benefit.slug).slice(0, 3);

  return (
    <div className="animate-[fade-in_0.4s_ease-out]">
      {/* Hero */}
      <section className={`relative overflow-hidden bg-gradient-to-br ${benefit.gradient}`}>
        <div className="absolute inset-0 bg-black/10" />
        <div className="relative mx-auto max-w-5xl px-4 sm:px-6 lg:px-8 py-16 lg:py-20 text-white">
          <Link to="/beneficios" className="inline-flex items-center gap-1.5 text-sm text-white/90 hover:text-white mb-6">
            <ArrowLeft className="size-4" /> Voltar ao catálogo
          </Link>
          <div className="flex items-start gap-6">
            <div className="hidden sm:flex size-20 shrink-0 items-center justify-center rounded-2xl bg-white/15 backdrop-blur">
              <Icon className="size-10" />
            </div>
            <div className="flex-1">
              {category && (
                <Badge className="bg-white/20 text-white border-0 hover:bg-white/25 mb-3">{category.name}</Badge>
              )}
              <div className="flex items-start gap-3">
                <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight flex-1">{benefit.name}</h1>
                <FavoriteButton slug={benefit.slug} className="mt-2" />
              </div>
              <p className="mt-4 text-lg text-white/90 max-w-2xl">{benefit.shortDescription}</p>
            </div>
          </div>
        </div>
      </section>

      <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 py-12 space-y-10">
        <Section emoji="📌" title="O que é">
          <p className="text-foreground/80 leading-relaxed">{benefit.whatIs}</p>
        </Section>

        <Section emoji="👨‍👩‍👧" title="Quem pode receber">
          <BulletList items={benefit.whoQualifies} />
        </Section>

        <Section emoji="💵" title="Qual o valor em 2026">
          <BulletList items={benefit.value2026} accent="success" />
        </Section>

        <Section emoji="📝" title="Como pedir">
          <BulletList items={benefit.howToApply} />
        </Section>

        <Section emoji="📑" title="Documentos necessários">
          <BulletList items={benefit.documents} />
        </Section>

        <Section emoji="⚠️" title="Importante">
          <div className="rounded-2xl border-l-4 border-l-warning border border-border bg-warning/5 p-6">
            <ul className="space-y-3">
              {benefit.important.map((item, i) => (
                <li key={i} className="flex items-start gap-3 text-foreground/90">
                  <AlertTriangle className="mt-0.5 size-4 shrink-0 text-warning" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>
        </Section>

        {related.length > 0 && (
          <Section emoji="🔗" title="Benefícios relacionados">
            <div className="grid gap-3 sm:grid-cols-3">
              {related.map((r) => (
                <Link
                  key={r.slug}
                  to="/beneficios/$slug"
                  params={{ slug: r.slug }}
                  className="rounded-xl border border-border bg-card p-4 hover:border-primary/40 transition-colors"
                >
                  <h4 className="font-semibold text-sm">{r.name}</h4>
                  <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{r.shortDescription}</p>
                </Link>
              ))}
            </div>
          </Section>
        )}
      </div>
    </div>
  );
}

function Section({ emoji, title, children }: { emoji: string; title: string; children: React.ReactNode }) {
  return (
    <section>
      <h2 className="text-2xl font-bold tracking-tight mb-5 flex items-center gap-2">
        <span aria-hidden>{emoji}</span>
        <span>{title}</span>
      </h2>
      {children}
    </section>
  );
}

function BulletList({ items, accent = "primary" }: { items: string[]; accent?: "primary" | "success" }) {
  const dot = accent === "success" ? "bg-success" : "bg-primary";
  return (
    <ul className="space-y-3">
      {items.map((item, i) => (
        <li key={i} className="flex items-start gap-3">
          <span className={`mt-2 size-2 shrink-0 rounded-full ${dot}`} />
          <span className="text-foreground/85 leading-relaxed">{item}</span>
        </li>
      ))}
    </ul>
  );
}
