import { Link } from "@tanstack/react-router";
import * as Icons from "lucide-react";
import type { Category } from "@/types/benefit";
import { cn } from "@/lib/utils";

export function CategoryCard({ category }: { category: Category }) {
  const Icon = (Icons as unknown as Record<string, React.ComponentType<{ className?: string }>>)[
    category.icon
  ] ?? Icons.Circle;

  return (
    <Link
      to="/categorias/$slug"
      params={{ slug: category.slug }}
      className="group block"
    >
      <div className="relative overflow-hidden rounded-2xl border border-border bg-card p-5 transition-all hover:-translate-y-1 hover:shadow-card-hover">
        <div
          className={cn(
            "mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br text-white",
            category.gradient,
          )}
        >
          <Icon className="h-6 w-6" />
        </div>
        <h3 className="text-base font-semibold text-foreground">{category.nome}</h3>
        <p className="mt-1 text-sm text-muted-foreground line-clamp-2">
          {category.descricao}
        </p>
      </div>
    </Link>
  );
}