import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import * as Icons from "lucide-react";
import { ArrowLeft, Check, AlertTriangle, Lightbulb, FileText } from "lucide-react";
import { getBenefit, benefits } from "@/data/benefits";
import { getCategory } from "@/data/categories";
import type { Benefit } from "@/types/benefit";
import { FavoriteButton } from "@/components/FavoriteButton";
import { Badge } from "@/components/ui/badge";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { cn } from "@/lib/utils";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useBenefitAccess } from "@/hooks/use-benefit-access";
import { PaymentPrompt } from "@/components/benefits/PaymentPrompt";
import { LockKeyhole } from "lucide-react";

export const Route = createFileRoute("/beneficios/$slug")({
  loader: ({ params }) => {
    const b = getBenefit(params.slug);
    if (!b) throw notFound();
    return { benefit: b };
  },
  head: ({ loaderData }) => ({
    meta: loaderData
      ? [
          { title: `${loaderData.benefit.nome} — Projeto + Benefícios` },
          { name: "description", content: loaderData.benefit.descricaoCurta },
          { property: "og:title", content: loaderData.benefit.nome },
          { property: "og:description", content: loaderData.benefit.descricaoCurta },
        ]
      : [],
  }),
  notFoundComponent: () => (
    <div className="mx-auto max-w-3xl px-4 py-20 text-center">
      <h1 className="text-3xl font-bold">Benefício não encontrado</h1>
      <Link to="/beneficios" className="mt-4 inline-block text-primary">
        Ver catálogo
      </Link>
    </div>
  ),
  errorComponent: ({ error }) => (
    <div className="mx-auto max-w-3xl px-4 py-20 text-center">
      <p className="text-muted-foreground">{error.message}</p>
    </div>
  ),
  component: BenefitPage,
});

function BenefitPage() {
  const { benefit: meta } = Route.useLoaderData() as { benefit: Benefit };
  const { user, canOpen, checking } = useBenefitAccess();
  const locked = !canOpen(meta.slug);
  const [paymentOpen, setPaymentOpen] = useState(false);
  const detail = useQuery({
    queryKey: ["original-benefit-guide", user?.id, meta.slug],
    enabled: !locked && !checking,
    retry: false,
    queryFn: async () => {
      const slug = meta.slug === "bpc" ? "bpc-loas" : meta.slug;
      const { data: found, error: lookupError } = await supabase.from("benefits")
        .select("id").eq("slug", slug).eq("is_published", true).maybeSingle();
      if (lookupError) throw lookupError;
      if (!found) return null;
      const { data, error } = await supabase.from("benefit_contents")
        .select("what_is, who_qualifies, documents, how_to_apply, important")
        .eq("benefit_id", found.id).maybeSingle();
      if (error) throw error;
      return data;
    },
  });
  const content = detail.data;
  const extras = content?.important && !Array.isArray(content.important) && typeof content.important === "object" ?
    content.important as { errosComuns?: Benefit["errosComuns"]; dicas?: string[]; faq?: Benefit["faq"] } : {};
  const benefit: Benefit = {
    ...meta,
    oQueE: typeof content?.what_is === "string" ? content.what_is : "",
    quemTemDireito: Array.isArray(content?.who_qualifies) ? content.who_qualifies.filter((x): x is string => typeof x === "string") : [],
    documentos: Array.isArray(content?.documents) ? content.documents.filter((x): x is string => typeof x === "string") : [],
    comoSolicitar: Array.isArray(content?.how_to_apply) ? content.how_to_apply as Benefit["comoSolicitar"] : [],
    errosComuns: Array.isArray(extras.errosComuns) ? extras.errosComuns : [],
    dicas: Array.isArray(extras.dicas) ? extras.dicas : [],
    faq: Array.isArray(extras.faq) ? extras.faq : [],
  };

  if (checking || locked) return <div className="mx-auto max-w-2xl px-4 py-16 text-center space-y-5">
    <div className="mx-auto grid size-20 place-items-center rounded-2xl bg-primary-soft text-primary"><LockKeyhole className="size-10"/></div>
    <h1 className="text-3xl font-bold">{meta.nome}</h1>
    <p className="text-muted-foreground">{checking ? "Verificando o acesso…" : "Este guia faz parte do conteúdo exclusivo. Os benefícios do governo podem ser solicitados gratuitamente pelos canais oficiais."}</p>
    {!checking && <button className="rounded-full bg-primary px-6 py-3 font-semibold text-primary-foreground" onClick={() => setPaymentOpen(true)}>{user ? "Desbloquear guia" : "Criar conta para desbloquear"}</button>}
    <div><Link to="/beneficios" className="text-primary underline">Voltar ao catálogo</Link></div>
    <PaymentPrompt open={paymentOpen} onOpenChange={setPaymentOpen} benefitName={meta.nome} />
  </div>;
  if (detail.isPending) return <div role="status" className="mx-auto max-w-3xl px-4 py-20 text-muted-foreground">Carregando orientações…</div>;
  if (detail.isError || !content) return <div role="alert" className="mx-auto max-w-3xl px-4 py-20 text-destructive">Não foi possível carregar o conteúdo. Tente novamente ou procure o suporte.</div>;
  const category = getCategory(benefit.categoria);
  const Icon = category
    ? (Icons as unknown as Record<string, React.ComponentType<{ className?: string }>>)[category.icon] ?? Icons.Circle
    : Icons.Circle;

  const related = benefits
    .filter((b) => b.categoria === benefit.categoria && b.slug !== benefit.slug)
    .slice(0, 3);

  return (
    <article>
      {/* Hero */}
      <section
        className={cn(
          "relative overflow-hidden bg-gradient-to-br",
          category?.gradient ?? "from-slate-600 to-slate-800",
        )}
      >
        <div className="absolute inset-0 opacity-15">
          <Icon className="absolute -right-16 -bottom-16 h-96 w-96 text-white" />
        </div>
        <div className="relative mx-auto max-w-5xl px-4 sm:px-6 py-8 sm:py-12 md:py-16 text-white">
          <Link
            to="/beneficios"
            className="inline-flex items-center gap-1 text-sm text-white/90 hover:text-white mb-4 sm:mb-6 -ml-1 py-1.5"
          >
            <ArrowLeft className="h-4 w-4" /> Voltar ao catálogo
          </Link>
          <div className="flex items-start justify-between gap-3 sm:gap-4">
            <div className="flex-1">
              <Badge className="mb-2 sm:mb-3 bg-white/20 text-white hover:bg-white/30 border-0">
                {category?.nome}
              </Badge>
              <h1 className="text-2xl sm:text-4xl lg:text-5xl font-bold leading-tight">
                {benefit.nome}
              </h1>
              <p className="mt-2 sm:mt-3 text-base sm:text-lg text-white/90 max-w-2xl">{benefit.descricaoCurta}</p>
              {benefit.valor && (
                <div className="mt-4 sm:mt-5 inline-flex items-center rounded-full bg-white/15 px-4 py-2 text-sm font-medium backdrop-blur">
                  💰 {benefit.valor}
                </div>
              )}
            </div>
            <FavoriteButton slug={benefit.slug} />
          </div>
        </div>
      </section>

      <div className="mx-auto max-w-3xl px-4 sm:px-6 py-8 sm:py-12 space-y-8 sm:space-y-12">
        {/* O que é */}
        <Section title="O que é">
          <p className="text-foreground/80 leading-relaxed">{benefit.oQueE}</p>
        </Section>

        {/* Quem tem direito */}
        <Section title="Quem tem direito">
          <ul className="space-y-3">
            {benefit.quemTemDireito.map((item, i) => (
              <li key={i} className="flex items-start gap-3">
                <span className="mt-0.5 grid h-6 w-6 shrink-0 place-items-center rounded-full bg-primary-soft text-primary">
                  <Check className="h-3.5 w-3.5" />
                </span>
                <span className="text-foreground/80">{item}</span>
              </li>
            ))}
          </ul>
        </Section>

        {/* Documentos */}
        <Section title="Documentos necessários">
          <div className="rounded-2xl border border-border bg-card p-5">
            <ul className="space-y-3">
              {benefit.documentos.map((doc, i) => (
                <li key={i} className="flex items-start gap-3">
                  <FileText className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                  <span className="text-sm text-foreground/80">{doc}</span>
                </li>
              ))}
            </ul>
          </div>
        </Section>

        {/* Como solicitar */}
        <Section title="Como solicitar">
          <ol className="space-y-4">
            {benefit.comoSolicitar.map((passo, i) => (
              <li
                key={i}
                className="flex gap-4 rounded-2xl border border-border bg-card p-5"
              >
                <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full gradient-primary text-white font-semibold">
                  {i + 1}
                </span>
                <div>
                  <h3 className="font-semibold">{passo.titulo}</h3>
                  <p className="mt-1 text-sm text-muted-foreground">{passo.descricao}</p>
                </div>
              </li>
            ))}
          </ol>
        </Section>

        {/* Erros comuns */}
        <Section title="Erros comuns">
          <div className="grid gap-3 sm:grid-cols-2">
            {benefit.errosComuns.map((erro, i) => (
              <div key={i} className="rounded-2xl border border-red-200 bg-red-50/60 p-4">
                <div className="flex items-center gap-2 text-red-700">
                  <AlertTriangle className="h-4 w-4" />
                  <h3 className="font-semibold text-sm">{erro.titulo}</h3>
                </div>
                <p className="mt-2 text-sm text-red-900/80">{erro.descricao}</p>
              </div>
            ))}
          </div>
        </Section>

        {/* Dicas */}
        <Section title="Dicas importantes">
          <div className="rounded-2xl border border-amber-200 bg-gradient-to-br from-amber-50 to-yellow-50 p-5">
            <div className="flex items-center gap-2 text-amber-700 mb-3">
              <Lightbulb className="h-5 w-5" />
              <h3 className="font-semibold">Fique de olho</h3>
            </div>
            <ul className="space-y-2">
              {benefit.dicas.map((d, i) => (
                <li key={i} className="text-sm text-amber-900/90 flex gap-2">
                  <span>•</span>
                  <span>{d}</span>
                </li>
              ))}
            </ul>
          </div>
        </Section>

        {/* FAQ */}
        <Section title="Perguntas frequentes">
          <Accordion type="single" collapsible className="rounded-2xl border border-border bg-card px-5">
            {benefit.faq.map((f, i) => (
              <AccordionItem key={i} value={`item-${i}`} className="border-border last:border-0">
                <AccordionTrigger className="text-left font-medium">
                  {f.pergunta}
                </AccordionTrigger>
                <AccordionContent className="text-muted-foreground">
                  {f.resposta}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </Section>

        {related.length > 0 && (
          <Section title="Benefícios relacionados">
            <div className="grid gap-3 grid-cols-1 sm:grid-cols-3">
              {related.map((r) => (
                <Link
                  key={r.slug}
                  to="/beneficios/$slug"
                  params={{ slug: r.slug }}
                  className="rounded-xl border border-border bg-card p-4 hover:border-primary hover:shadow-soft transition"
                >
                  <h3 className="font-semibold text-sm">{r.nome}</h3>
                  <p className="mt-1 text-xs text-muted-foreground line-clamp-2">
                    {r.descricaoCurta}
                  </p>
                </Link>
              ))}
            </div>
          </Section>
        )}
      </div>
    </article>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section>
      <h2 className="text-xl sm:text-2xl font-bold tracking-tight mb-3 sm:mb-4">{title}</h2>
      {children}
    </section>
  );
}