import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import * as Icons from "lucide-react";
import { getBenefit } from "@/data/benefits";
import { getCategory } from "@/data/categories";
import { isFreeBenefit, useBenefitAccess } from "@/hooks/use-benefit-access";
import { PaymentPrompt } from "@/components/benefits/PaymentPrompt";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/beneficios/$slug")({
  loader: ({ params }) => {
    const benefit = getBenefit(params.slug);
    if (!benefit) throw notFound();
    // Public metadata only: never place paid instructions in SSR loader output.
    return { benefit };
  },
  head: ({ loaderData }) => ({ meta: loaderData ? [
    { title: loaderData.benefit.name + " — Projeto + Benefícios" },
    { name: "description", content: loaderData.benefit.shortDescription },
  ] : [] }),
  component: BenefitPage,
});
type Step = { titulo?: string; descricao?: string };
type FAQ = { pergunta?: string; resposta?: string };
type Extra = { dicas?: string[]; errosComuns?: Step[]; faq?: FAQ[] };
function textItems(v: unknown): string[] { return Array.isArray(v) ? v.filter((x): x is string => typeof x === "string") : []; }
function stepItems(v: unknown): Step[] { return Array.isArray(v) ? v.filter((x): x is Step => !!x && typeof x === "object") : []; }
function Details({ title, items }: { title: string; items: string[] }) {
  return items.length ? <section className="space-y-4"><h2 className="text-2xl font-bold">{title}</h2>
    <ul className="space-y-3">{items.map((item, i) => <li key={i} className="flex gap-3 rounded-xl border border-border bg-card p-4"><Icons.CheckCircle2 className="size-5 shrink-0 text-primary"/><span>{item}</span></li>)}</ul>
  </section> : null;
}
function BenefitPage() {
  const { benefit } = Route.useLoaderData();
  const { user, canOpen, checking } = useBenefitAccess();
  const locked = !canOpen(benefit.slug);
  const [payOpen, setPayOpen] = useState(false);
  const category = getCategory(benefit.category);
  const Icon = (Icons as unknown as Record<string, React.ComponentType<{className?: string}>>)[benefit.icon] ?? Icons.BookOpen;
  const guide = useQuery({
    queryKey: ["benefit-guide", user?.id, benefit.slug],
    enabled: !checking && !locked,
    retry: false,
    queryFn: async () => {
      const { data: row, error: lookupError } = await supabase.from("benefits")
        .select("id").eq("slug", benefit.slug).eq("is_published", true).maybeSingle();
      if (lookupError) throw lookupError;
      if (!row) return null;
      const { data, error } = await supabase.from("benefit_contents")
        .select("what_is,who_qualifies,value_info,how_to_apply,documents,important")
        .eq("benefit_id", row.id).maybeSingle();
      if (error) throw error;
      return data;
    },
  });
  if (checking || locked) return <div className="mx-auto max-w-2xl px-4 py-16 text-center space-y-5">
    <div className="mx-auto flex size-20 items-center justify-center rounded-2xl bg-primary-soft text-primary"><Icons.LockKeyhole className="size-10"/></div>
    <h1 className="text-3xl font-bold">{benefit.name}</h1>
    <p className="text-muted-foreground">{checking ? "Conferindo suas permissões…" : "Este material é reservado aos usuários com acesso liberado. Os pedidos de benefícios do governo são gratuitos nos canais oficiais."}</p>
    {!checking && <button className="rounded-full bg-primary px-7 py-3 font-semibold text-primary-foreground" onClick={() => setPayOpen(true)}>{user ? "Desbloquear conteúdo" : "Criar conta para desbloquear"}</button>}
    <div><Link to="/beneficios" className="text-primary underline">Voltar ao catálogo</Link></div>
    <PaymentPrompt open={payOpen} onOpenChange={setPayOpen} benefitName={benefit.name}/>
  </div>;
  const d = guide.data;
  const extra = d?.important && !Array.isArray(d.important) && typeof d.important === "object" ? d.important as Extra : {};
  const steps = stepItems(d?.how_to_apply);
  return <article className="pb-16">
    <section className={`bg-gradient-to-br ${benefit.gradient} text-white`}>
      <div className="mx-auto max-w-5xl px-4 py-12 sm:py-16">
        <Link to="/beneficios" className="mb-6 inline-flex items-center gap-2 text-white/90"><Icons.ArrowLeft className="size-4"/> Voltar ao catálogo</Link>
        <div className="flex items-start gap-5"><span className="hidden sm:grid size-16 shrink-0 place-items-center rounded-2xl bg-white/15"><Icon className="size-8"/></span><div>
          <p className="mb-2 text-sm text-white/80">{category?.name}</p>
          <h1 className="text-3xl sm:text-5xl font-bold">{benefit.name}</h1>
          <p className="mt-4 max-w-2xl text-white/90">{benefit.shortDescription}</p>
        </div></div>
      </div>
    </section>
    <div className="mx-auto max-w-4xl px-4 py-10 space-y-10">
      {guide.isPending ? <p role="status">Carregando orientações…</p> :
        guide.isError ? <p role="alert" className="text-destructive">Não foi possível carregar este conteúdo. Tente novamente.</p> :
        !d ? <p className="text-muted-foreground">Este guia ainda não está disponível.</p> :
        <>
          {d.what_is && <section><h2 className="mb-4 text-2xl font-bold">O que é</h2><p className="leading-relaxed text-foreground/80">{d.what_is}</p></section>}
          <Details title="Quem tem direito" items={textItems(d.who_qualifies)}/>
          <Details title="Valores e condições" items={textItems(d.value_info)}/>
          <Details title="Documentos necessários" items={textItems(d.documents)}/>
          {steps.length ? <section><h2 className="mb-4 text-2xl font-bold">Como solicitar</h2><ol className="space-y-4">{steps.map((step,i)=><li key={i} className="flex gap-4 rounded-2xl border bg-card p-5"><span className="grid size-9 shrink-0 place-items-center rounded-full bg-primary text-primary-foreground">{i+1}</span><div><h3 className="font-semibold">{step.titulo}</h3><p className="mt-1 text-sm text-muted-foreground">{step.descricao}</p></div></li>)}</ol></section> : <Details title="Como solicitar" items={textItems(d.how_to_apply)}/>}
          <Details title="Dicas úteis" items={extra.dicas ?? []}/>
          {extra.errosComuns?.length ? <section><h2 className="mb-4 text-2xl font-bold">Erros comuns</h2><div className="grid gap-3 sm:grid-cols-2">{extra.errosComuns.map((e,i)=><div key={i} className="rounded-xl border border-red-200 bg-red-50 p-4 text-red-900"><p className="font-semibold">{e.titulo}</p><p className="mt-2 text-sm">{e.descricao}</p></div>)}</div></section> : null}
          {extra.faq?.length ? <section><h2 className="mb-4 text-2xl font-bold">Perguntas frequentes</h2><div className="space-y-3">{extra.faq.map((faq,i)=><details key={i} className="rounded-xl border bg-card p-4"><summary className="cursor-pointer font-semibold">{faq.pergunta}</summary><p className="mt-3 text-sm text-muted-foreground">{faq.resposta}</p></details>)}</div></section> : null}
        </>}
      <p className="border-t pt-5 text-xs text-muted-foreground">Plataforma informativa privada, sem vínculo com o governo. Consulte a legislação e as regras atuais nos canais oficiais. O acesso aos benefícios governamentais é gratuito.</p>
    </div>
  </article>;
}
