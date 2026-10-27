import { Link } from "@tanstack/react-router";
import * as Icons from "lucide-react";
import type { Benefit } from "@/types/benefit";
import { getCategory } from "@/data/categories";
import { FavoriteButton } from "./FavoriteButton";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { ArrowRight, LockKeyhole } from "lucide-react";
import { useBenefitAccess } from "@/hooks/use-benefit-access";

export function BenefitCard({ benefit }: { benefit: Benefit }) {
  const { canOpen } = useBenefitAccess();
  const locked = !canOpen(benefit.slug);
  const category = getCategory(benefit.categoria);
  const Icon = category
    ? (Icons as unknown as Record<string, React.ComponentType<{ className?: string }>>)[category.icon] ?? Icons.Circle
    : Icons.Circle;

  const article = (
      <article className="overflow-hidden rounded-2xl border border-border bg-card shadow-soft transition-all active:scale-[0.99] hover:-translate-y-1 hover:shadow-card-hover">
        <div
          className={cn(
            "relative aspect-[16/9] bg-gradient-to-br overflow-hidden",
            category?.gradient ?? "from-slate-500 to-slate-700",
          )}
        >
          {benefit.imagem ? (
            <img
              src={benefit.imagem}
              alt={benefit.nome}
              loading="lazy"
              className={cn("absolute inset-0 h-full w-full object-cover", locked && "blur-md opacity-60")}
            />
          ) : (
            <div className={cn("absolute inset-0 flex items-center justify-center opacity-30", locked && "blur-md")}>
              <Icon className="h-32 w-32 text-white" />
            </div>
          )}
          <div className="absolute left-3 top-3 grid h-8 w-8 place-items-center rounded-full bg-white/90 shadow-soft backdrop-blur">
            <Icon className="h-4 w-4 text-foreground" />
          </div>
          {!locked && <div className="absolute right-3 top-3"><FavoriteButton slug={benefit.slug} /></div>}
          {locked && <div className="absolute inset-0 flex items-center justify-center bg-black/30"><span className="rounded-full bg-white/95 p-4 shadow-lg"><LockKeyhole className="size-8 text-primary" /></span></div>}
          {benefit.valor && (
            <div className="absolute bottom-3 left-3">
              <Badge className="bg-white/95 text-foreground hover:bg-white">
                {benefit.valor}
              </Badge>
            </div>
          )}
        </div>
        <div className="p-4 sm:p-5">
          <Badge variant="secondary" className="mb-2 sm:mb-3 text-xs font-medium">
            {category?.nome}
          </Badge>
          <h3 className="text-base sm:text-lg font-semibold leading-tight text-foreground group-hover:text-primary transition-colors">
            {benefit.nome}
          </h3>
          <p className="mt-1.5 sm:mt-2 text-sm text-muted-foreground line-clamp-2">
            {benefit.descricaoCurta}
          </p>
          <div className="mt-3 sm:mt-4 inline-flex items-center text-sm font-medium text-primary">
            {locked ? "Desbloquear conteúdo" : "Ver benefício"}
            <ArrowRight className="ml-1 h-4 w-4 transition-transform group-hover:translate-x-0.5" />
          </div>
        </div>
      </article>
  );
  // Every card navigates to its guide. The detail route handles free access
  // or displays the premium unlock prompt for restricted guides.
  return <Link to="/beneficios/$slug" params={{ slug: benefit.slug }} className="group block animate-fade-up">{article}</Link>;
}
