import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { ArrowLeft } from "lucide-react";
import { getCategory } from "@/data/categories";
import { getBenefitsByCategory } from "@/data/benefits";
import { BenefitCard } from "@/components/BenefitCard";
import type { Benefit, Category } from "@/types/benefit";

export const Route = createFileRoute("/categorias/$slug")({
  loader: ({ params }) => {
    const category = getCategory(params.slug);
    if (!category) throw notFound();
    return { category, benefits: getBenefitsByCategory(params.slug) };
  },
  head: ({ loaderData }) => ({
    meta: loaderData
      ? [
          { title: `${loaderData.category.nome} — Projeto + Benefícios` },
          { name: "description", content: loaderData.category.descricao },
        ]
      : [],
  }),
  notFoundComponent: () => (
    <div className="mx-auto max-w-3xl px-4 py-20 text-center">
      <h1 className="text-3xl font-bold">Categoria não encontrada</h1>
      <Link to="/beneficios" className="mt-4 inline-block text-primary">Ver catálogo</Link>
    </div>
  ),
  errorComponent: ({ error }) => (
    <div className="mx-auto max-w-3xl px-4 py-20 text-center text-muted-foreground">{(error as Error).message}</div>
  ),
  component: CategoryPage,
});

function CategoryPage() {
  const { category, benefits } = Route.useLoaderData() as {
    category: Category;
    benefits: Benefit[];
  };
  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 py-6 sm:py-10 md:py-14">
      <Link to="/" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground mb-4 sm:mb-6 py-1.5">
        <ArrowLeft className="h-4 w-4" /> Voltar
      </Link>
      <header className="mb-6 sm:mb-10">
        <p className="text-sm font-medium text-primary uppercase tracking-wide">Categoria</p>
        <h1 className="mt-1 text-2xl sm:text-4xl font-bold tracking-tight">{category.nome}</h1>
        <p className="mt-2 text-sm sm:text-base text-muted-foreground max-w-2xl">{category.descricao}</p>
      </header>
      {benefits.length === 0 ? (
        <p className="text-muted-foreground">Nenhum benefício cadastrado nesta categoria ainda.</p>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
          {benefits.map((b) => (
            <BenefitCard key={b.id} benefit={b} />
          ))}
        </div>
      )}
    </div>
  );
}