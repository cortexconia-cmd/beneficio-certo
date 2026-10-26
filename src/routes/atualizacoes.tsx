import { createFileRoute, Link } from "@tanstack/react-router";
import { Sparkles, Calendar, RefreshCw, ShieldAlert, ArrowRight } from "lucide-react";
import { updates } from "@/data/updates";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/atualizacoes")({
  head: () => ({
    meta: [
      { title: "Atualizações — Projeto + Benefícios" },
      { name: "description", content: "Novidades, mudanças, calendários e avisos importantes sobre benefícios do governo." },
    ],
  }),
  component: UpdatesPage,
});

const tipoMap = {
  novidade: { label: "Novidade", icon: Sparkles, color: "bg-blue-50 text-blue-700 border-blue-200" },
  mudanca: { label: "Mudança", icon: RefreshCw, color: "bg-purple-50 text-purple-700 border-purple-200" },
  calendario: { label: "Calendário", icon: Calendar, color: "bg-emerald-50 text-emerald-700 border-emerald-200" },
  alerta: { label: "Alerta", icon: ShieldAlert, color: "bg-amber-50 text-amber-800 border-amber-200" },
} as const;

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });
}

function UpdatesPage() {
  return (
    <div className="mx-auto max-w-5xl px-4 sm:px-6 py-6 sm:py-10 md:py-14">
      <header className="mb-6 sm:mb-10">
        <h1 className="text-2xl sm:text-4xl font-bold tracking-tight">Atualizações</h1>
        <p className="mt-1 sm:mt-2 text-sm sm:text-base text-muted-foreground">
          Acompanhe novidades, mudanças e avisos importantes sobre benefícios.
        </p>
      </header>

      <div className="grid gap-4">
        {updates.map((u) => {
          const meta = tipoMap[u.tipo];
          const Icon = meta.icon;
          return (
            <article
              key={u.id}
              className="rounded-2xl border border-border bg-card p-4 sm:p-5 shadow-soft transition hover:-translate-y-0.5 hover:shadow-card-hover"
            >
              <div className="flex items-start gap-4">
                <div className={cn("grid h-11 w-11 shrink-0 place-items-center rounded-xl border", meta.color)}>
                  <Icon className="h-5 w-5" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-2 text-xs">
                    <span className={cn("rounded-full border px-2 py-0.5 font-medium", meta.color)}>
                      {meta.label}
                    </span>
                    <span className="text-muted-foreground">{formatDate(u.data)}</span>
                  </div>
                  <h2 className="mt-2 text-lg font-semibold">{u.titulo}</h2>
                  <p className="mt-1 text-sm text-muted-foreground">{u.resumo}</p>
                  {u.beneficioSlug && (
                    <Link
                      to="/beneficios/$slug"
                      params={{ slug: u.beneficioSlug }}
                      className="mt-3 inline-flex items-center text-sm font-medium text-primary hover:gap-2 gap-1 transition-all"
                    >
                      Ver benefício <ArrowRight className="h-4 w-4" />
                    </Link>
                  )}
                </div>
              </div>
            </article>
          );
        })}
      </div>
    </div>
  );
}