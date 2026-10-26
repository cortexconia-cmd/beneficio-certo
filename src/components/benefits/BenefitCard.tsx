import { Link } from "@tanstack/react-router";
import { useState } from "react";
import { useBenefitAccess } from "@/hooks/use-benefit-access";
import { PaymentPrompt } from "./PaymentPrompt";
import * as Icons from "lucide-react";
import type { Benefit } from "@/lib/types";
import { getCategory } from "@/data/categories";
import { FavoriteButton } from "./FavoriteButton";
import { Badge } from "@/components/ui/badge";

interface Props {
  benefit: Benefit;
}

export function BenefitCard({ benefit }: Props) {
  const category = getCategory(benefit.category);
  const { canOpen, checking } = useBenefitAccess();
  const locked = !canOpen(benefit.slug);
  const [promptOpen, setPromptOpen] = useState(false);
  const Icon = (Icons as unknown as Record<string, React.ComponentType<{ className?: string; size?: number }>>)[benefit.icon] ?? Icons.Sparkles;

  const body = (
    <>
      <div className="group block rounded-2xl bg-card border border-border overflow-hidden shadow-card hover-lift focus:outline-none focus-visible:ring-2 focus-visible:ring-ring">
      <div className={`relative h-40 bg-gradient-to-br ${benefit.gradient} flex items-center justify-center`}>
        <div className={locked ? "blur-[6px] opacity-65" : ""}><Icon className="text-white/90 size-16 drop-shadow" /></div>
        {locked && <div className="absolute inset-0 flex items-center justify-center bg-black/25" aria-hidden="true"><span className="rounded-full bg-white/95 p-4 shadow-xl"><Icons.LockKeyhole className="size-8 text-primary" /></span></div>}
        {!locked && <FavoriteButton slug={benefit.slug} className="absolute top-3 right-3" />}
        {category && (
          <Badge className="absolute top-3 left-3 bg-white/95 text-foreground hover:bg-white border-0">
            {category.nome}
          </Badge>
        )}
      </div>
      <div className="p-5">
        <h3 className="font-semibold text-lg text-foreground group-hover:text-primary transition-colors">
          {benefit.name}
        </h3>
        <p className="mt-1.5 text-sm text-muted-foreground line-clamp-2">{benefit.shortDescription}</p>
        <div className="mt-4 inline-flex items-center text-sm font-medium text-primary">
          {locked ? "Desbloquear acesso" : "Ver benefício"}
          <Icons.ArrowRight className="ml-1 size-4 transition-transform group-hover:translate-x-1" />
        </div>
      </div>
      </div>
    </>
  );
  if (locked) return <><button type="button" disabled={checking} onClick={() => setPromptOpen(true)} className="w-full text-left rounded-2xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary" aria-label={`Desbloquear ${benefit.name}`}>{body}</button><PaymentPrompt open={promptOpen} onOpenChange={setPromptOpen} benefitName={benefit.name} /></>;
  return <Link to="/beneficios/$slug" params={{ slug: benefit.slug }} className="block">{body}</Link>;
}
