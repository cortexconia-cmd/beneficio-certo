import { createFileRoute, Link } from "@tanstack/react-router";
import * as Icons from "lucide-react";
import { BookOpen, ArrowRight, Clock } from "lucide-react";
import { guideChapters } from "@/data/guide";
import { Badge } from "@/components/ui/badge";

export const Route = createFileRoute("/guia")({
  head: () => ({
    meta: [
      { title: "Guia 2026 — Projeto+Benefícios" },
      { name: "description", content: "Guia completo sobre benefícios sociais do governo brasileiro em 2026." },
    ],
  }),
  component: GuideIndex,
});

function GuideIndex() {
  return (
    <div className="animate-[fade-in_0.4s_ease-out]">
      <section className="relative overflow-hidden border-b border-border">
        <div className="absolute inset-0 bg-gradient-to-br from-primary-soft via-background to-background" />
        <div className="relative mx-auto max-w-5xl px-4 sm:px-6 lg:px-8 py-16">
          <Badge variant="secondary" className="mb-4 gap-1.5 bg-card border border-border">
            <BookOpen className="size-3.5 text-primary" />
            Guia 2026
          </Badge>
          <h1 className="text-4xl sm:text-5xl font-bold tracking-tight">
            Guia completo de benefícios sociais
          </h1>
          <p className="mt-5 text-lg text-muted-foreground max-w-2xl">
            Tudo que você precisa saber para conhecer seus direitos, se cadastrar corretamente e acessar os benefícios
            do governo de forma segura.
          </p>
        </div>
      </section>

      <section className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8 py-12">
        <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground mb-5">
          Capítulos
        </h2>
        <div className="space-y-3">
          {guideChapters.map((ch) => {
            const Icon =
              (Icons as unknown as Record<string, React.ComponentType<{ className?: string }>>)[ch.icon] ?? BookOpen;
            return (
              <Link
                key={ch.slug}
                to="/guia/$slug"
                params={{ slug: ch.slug }}
                className="group flex items-start gap-5 rounded-2xl border border-border bg-card p-5 sm:p-6 shadow-card hover-lift"
              >
                <div className="inline-flex size-12 shrink-0 items-center justify-center rounded-xl bg-primary-soft text-primary group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
                  <Icon className="size-6" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-xs font-semibold text-muted-foreground">
                      Capítulo {ch.number.toString().padStart(2, "0")}
                    </span>
                    <span className="text-muted-foreground">·</span>
                    <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
                      <Clock className="size-3" /> {ch.readTime}
                    </span>
                  </div>
                  <h3 className="font-semibold text-lg group-hover:text-primary transition-colors">{ch.title}</h3>
                  <p className="text-sm text-muted-foreground mt-1">{ch.summary}</p>
                </div>
                <ArrowRight className="size-5 text-muted-foreground group-hover:text-primary group-hover:translate-x-1 transition-all self-center hidden sm:block" />
              </Link>
            );
          })}
        </div>
      </section>
    </div>
  );
}
