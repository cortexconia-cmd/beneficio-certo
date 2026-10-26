import { Link } from "@tanstack/react-router";
import * as Icons from "lucide-react";
import type { Category } from "@/lib/types";

interface Props {
  category: Category;
}

export function CategoryCard({ category }: Props) {
  const Icon = (Icons as unknown as Record<string, React.ComponentType<{ className?: string; size?: number }>>)[category.icon] ?? Icons.Sparkles;

  return (
    <Link
      to="/beneficios"
      search={{ categoria: category.id, q: "" }}
      className="group flex flex-col items-start gap-3 rounded-2xl border border-border bg-card p-5 shadow-card hover-lift focus:outline-none focus-visible:ring-2 focus-visible:ring-ring"
    >
      <div className="inline-flex size-12 items-center justify-center rounded-xl bg-primary-soft text-primary transition-colors group-hover:bg-primary group-hover:text-primary-foreground">
        <Icon className="size-6" />
      </div>
      <div>
        <h3 className="font-semibold text-foreground">{category.name}</h3>
        <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">{category.description}</p>
      </div>
    </Link>
  );
}
