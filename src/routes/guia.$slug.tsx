import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import * as Icons from "lucide-react";
import { ArrowLeft, ArrowRight, Check, Clock, Info, AlertTriangle, CheckCircle2 } from "lucide-react";
import { getChapter, guideChapters } from "@/data/guide";
import type { GuideSection } from "@/data/guide";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/guia/$slug")({
  loader: ({ params }) => {
    const chapter = getChapter(params.slug);
    if (!chapter) throw notFound();
    return { chapter };
  },
  head: ({ loaderData }) => ({
    meta: loaderData
      ? [
          { title: `${loaderData.chapter.title} — Guia 2026` },
          { name: "description", content: loaderData.chapter.summary },
        ]
      : [],
  }),
  notFoundComponent: () => (
    <div className="mx-auto max-w-2xl px-4 py-20 text-center">
      <h1 className="text-3xl font-bold">Capítulo não encontrado</h1>
      <Link to="/guia" className="mt-6 inline-block text-primary font-medium">Voltar ao guia</Link>
    </div>
  ),
  errorComponent: ({ error }) => (
    <div className="mx-auto max-w-2xl px-4 py-20 text-center">
      <h1 className="text-2xl font-bold">Erro ao carregar</h1>
      <p className="mt-2 text-muted-foreground">{(error as Error).message}</p>
    </div>
  ),
  component: ChapterPage,
});

function ChapterPage() {
  const { chapter } = Route.useLoaderData() as { chapter: import("@/data/guide").GuideChapter };
  const Icon =
    (Icons as unknown as Record<string, React.ComponentType<{ className?: string }>>)[chapter.icon] ?? Icons.BookOpen;

  const currentIdx = guideChapters.findIndex((c) => c.slug === chapter.slug);
  const prev = currentIdx > 0 ? guideChapters[currentIdx - 1] : null;
  const next = currentIdx < guideChapters.length - 1 ? guideChapters[currentIdx + 1] : null;

  return (
    <div className="animate-[fade-in_0.4s_ease-out]">
      <section className="border-b border-border bg-gradient-to-br from-primary-soft/60 via-background to-background">
        <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8 py-12">
          <Link to="/guia" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground mb-6">
            <ArrowLeft className="size-4" /> Voltar ao guia
          </Link>
          <div className="flex items-center gap-3 mb-4">
            <div className="inline-flex size-10 items-center justify-center rounded-xl bg-primary text-primary-foreground">
              <Icon className="size-5" />
            </div>
            <Badge variant="secondary">Capítulo {chapter.number.toString().padStart(2, "0")}</Badge>
            <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
              <Clock className="size-3" /> {chapter.readTime}
            </span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-bold tracking-tight">{chapter.title}</h1>
          <p className="mt-3 text-lg text-muted-foreground">{chapter.summary}</p>
        </div>
      </section>

      <article className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8 py-12 space-y-10">
        {chapter.sections.map((section, i) => (
          <SectionBlock key={i} section={section} />
        ))}

        <nav className="grid sm:grid-cols-2 gap-4 pt-8 border-t border-border">
          {prev ? (
            <Link
              to="/guia/$slug"
              params={{ slug: prev.slug }}
              className="group rounded-2xl border border-border bg-card p-5 hover:border-primary/40 transition-colors"
            >
              <span className="text-xs text-muted-foreground">Anterior</span>
              <div className="flex items-center gap-2 font-semibold mt-1 group-hover:text-primary">
                <ArrowLeft className="size-4" /> {prev.title}
              </div>
            </Link>
          ) : <div />}
          {next ? (
            <Link
              to="/guia/$slug"
              params={{ slug: next.slug }}
              className="group rounded-2xl border border-border bg-card p-5 hover:border-primary/40 transition-colors text-right sm:text-right"
            >
              <span className="text-xs text-muted-foreground">Próximo</span>
              <div className="flex items-center justify-end gap-2 font-semibold mt-1 group-hover:text-primary">
                {next.title} <ArrowRight className="size-4" />
              </div>
            </Link>
          ) : <div />}
        </nav>
      </article>
    </div>
  );
}

function SectionBlock({ section }: { section: GuideSection }) {
  return (
    <section className="space-y-4">
      {section.heading && (
        <h2 className="text-xl sm:text-2xl font-bold tracking-tight scroll-mt-20">{section.heading}</h2>
      )}
      {section.paragraphs?.map((p, i) => (
        <p key={i} className="text-foreground/80 leading-relaxed">{p}</p>
      ))}
      {section.bullets && (
        <ul className="space-y-2 pl-1">
          {section.bullets.map((b, i) => (
            <li key={i} className="flex items-start gap-3 text-foreground/80">
              <span className="mt-2 size-1.5 shrink-0 rounded-full bg-primary" />
              {b}
            </li>
          ))}
        </ul>
      )}
      {section.checks && (
        <ul className="space-y-2.5">
          {section.checks.map((c, i) => (
            <li key={i} className="flex items-start gap-3">
              <span className="mt-0.5 inline-flex size-6 shrink-0 items-center justify-center rounded-full bg-success/15 text-success">
                <Check className="size-3.5" strokeWidth={3} />
              </span>
              <span className="text-foreground/80">{c}</span>
            </li>
          ))}
        </ul>
      )}
      {section.callout && <Callout {...section.callout} />}
    </section>
  );
}

function Callout({ title, text, variant = "info" }: { title?: string; text: string; variant?: "info" | "warning" | "success" }) {
  const config = {
    info: { icon: Info, classes: "bg-primary-soft border-primary/15 text-primary" },
    warning: { icon: AlertTriangle, classes: "bg-amber-50 border-amber-200 text-amber-800" },
    success: { icon: CheckCircle2, classes: "bg-emerald-50 border-emerald-200 text-emerald-800" },
  }[variant];
  const Icon = config.icon;

  return (
    <div className={cn("rounded-2xl border p-5 flex gap-3", config.classes)}>
      <Icon className="size-5 shrink-0 mt-0.5" />
      <div>
        {title && <div className="font-semibold mb-1">{title}</div>}
        <p className="text-sm leading-relaxed text-foreground/85">{text}</p>
      </div>
    </div>
  );
}
