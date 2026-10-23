import { createFileRoute, Link } from "@tanstack/react-router";
import { Calendar, AlertCircle, Sparkles, FileEdit } from "lucide-react";
import { updates } from "@/data/updates";
import { Badge } from "@/components/ui/badge";

const typeConfig = {
  "nova-regra": { label: "Nova regra", icon: FileEdit, className: "bg-blue-100 text-blue-700" },
  "calendario": { label: "Calendário", icon: Calendar, className: "bg-violet-100 text-violet-700" },
  "aviso": { label: "Aviso", icon: AlertCircle, className: "bg-amber-100 text-amber-700" },
  "novo-beneficio": { label: "Novo benefício", icon: Sparkles, className: "bg-emerald-100 text-emerald-700" },
};

export const Route = createFileRoute("/atualizacoes")({
  head: () => ({
    meta: [
      { title: "Atualizações — Projeto+Benefícios" },
      { name: "description", content: "Mudanças em benefícios, novas regras, calendário e avisos importantes." },
    ],
  }),
  component: UpdatesPage,
});

function UpdatesPage() {
  return (
    <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8 py-10 animate-[fade-in_0.4s_ease-out]">
      <div className="mb-8">
        <h1 className="text-3xl sm:text-4xl font-bold tracking-tight">Atualizações</h1>
        <p className="text-muted-foreground mt-2">Mudanças em benefícios, novas regras e avisos importantes.</p>
      </div>

      <div className="space-y-4">
        {updates.map((u) => {
          const cfg = typeConfig[u.type];
          const Icon = cfg.icon;
          return (
            <article
              key={u.id}
              className="rounded-2xl border border-border bg-card p-6 shadow-card hover-lift"
            >
              <div className="flex flex-wrap items-center gap-3 mb-3">
                <Badge className={`gap-1.5 border-0 ${cfg.className}`}>
                  <Icon className="size-3.5" />
                  {cfg.label}
                </Badge>
                <span className="text-xs text-muted-foreground">
                  {new Date(u.date).toLocaleDateString("pt-BR", { day: "2-digit", month: "long", year: "numeric" })}
                </span>
              </div>
              <h2 className="text-xl font-semibold">{u.title}</h2>
              <p className="text-muted-foreground mt-2">{u.summary}</p>
              {u.benefitSlug && (
                <Link
                  to="/beneficios/$slug"
                  params={{ slug: u.benefitSlug }}
                  className="inline-flex items-center mt-4 text-sm font-medium text-primary hover:underline"
                >
                  Ver benefício relacionado →
                </Link>
              )}
            </article>
          );
        })}
      </div>
    </div>
  );
}
