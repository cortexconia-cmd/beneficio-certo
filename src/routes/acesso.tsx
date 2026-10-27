import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { CheckCircle2, LockKeyhole, BookOpen, Search, Smartphone, ShieldCheck, ArrowRight, CircleHelp, CreditCard } from "lucide-react";
import { LoginDialog } from "@/components/layout/LoginDialog";
import { PaymentPrompt } from "@/components/benefits/PaymentPrompt";
import { useAuth } from "@/hooks/use-auth";
import { useBenefitAccess } from "@/hooks/use-benefit-access";
import { Button } from "@/components/ui/button";
import { trackEvent } from "@/components/ConsentTracking";

export const Route=createFileRoute("/acesso")({
 head:()=>({meta:[
  {title:"Conheça o Projeto + Benefícios — Guia digital"},
  {name:"description",content:"Explore 38 guias informativos sobre programas sociais, critérios e canais oficiais. Plataforma independente."},
  {property:"og:title",content:"Projeto + Benefícios — Guia digital"},
  {property:"og:description",content:"Informações organizadas sobre benefícios sociais. O acesso aos serviços públicos é gratuito."},
 ]}),
 component:SalesPage
});
function SalesPage(){
 const {user,phoneVerified}=useAuth();
 const {hasCatalog}=useBenefitAccess();
 const [loginOpen,setLoginOpen]=useState(false);
 const [checkoutOpen,setCheckoutOpen]=useState(false);
 const start=()=>{
  void trackEvent("registration_started");
  if(hasCatalog){window.location.assign("/beneficios");return}
  if(!user||!phoneVerified){setLoginOpen(true);return}
  setCheckoutOpen(true);
 };
 return <div className="bg-background">
 <section className="relative overflow-hidden gradient-hero border-b border-border">
  <div className="mx-auto max-w-6xl px-4 sm:px-6 py-16 sm:py-24 grid gap-10 lg:grid-cols-[1.3fr_1fr] items-center">
   <div>
    <p className="inline-flex rounded-full border border-primary/20 bg-white/75 px-4 py-2 text-sm text-primary font-medium">Plataforma informativa independente · Guia 2026</p>
    <h1 className="mt-6 text-4xl sm:text-5xl font-bold tracking-tight leading-tight">Conheça os benefícios sociais com informações <span className="text-primary">claras e organizadas</span></h1>
    <p className="mt-5 text-lg text-muted-foreground">Consulte um catálogo com 38 guias explicativos sobre requisitos, documentos e caminhos para solicitar programas e direitos sociais brasileiros.</p>
    <div className="mt-6 flex flex-wrap gap-3 text-sm"><span className="rounded-full bg-white/80 px-4 py-2">38 guias</span><span className="rounded-full bg-white/80 px-4 py-2">Conteúdo online</span><span className="rounded-full bg-white/80 px-4 py-2">Consulta no celular</span></div>
    <div className="mt-8 flex flex-wrap gap-3"><Button size="lg" className="rounded-full px-7" onClick={start}>{hasCatalog?"Abrir meu catálogo":"Conhecer acesso completo"} <ArrowRight className="ml-2 size-4"/></Button><Button variant="outline" size="lg" asChild className="rounded-full"><Link to="/beneficios">Ver os benefícios</Link></Button></div>
   </div>
   <div className="rounded-3xl border border-border bg-white p-7 sm:p-9 shadow-card-hover">
     <div className="flex items-center gap-3"><div className="rounded-xl bg-primary/10 p-3 text-primary"><BookOpen className="size-6"/></div><div><p className="font-semibold">Projeto + Benefícios</p><p className="text-sm text-muted-foreground">Guia digital independente</p></div></div>
     <div className="my-7 space-y-4">{[
       ["Pesquisa rápida","Encontre assuntos por palavra-chave e categoria."],
       ["Orientações detalhadas","Entenda requisitos, documentos e etapas informativas."],
       ["Acesso centralizado","Consulte seus guias quando precisar, pelo celular ou computador."]
     ].map(([title,desc])=><div key={title} className="flex gap-3"><CheckCircle2 className="mt-0.5 size-5 shrink-0 text-primary"/><div><p className="font-semibold">{title}</p><p className="text-sm text-muted-foreground">{desc}</p></div></div>)}</div>
     <div className="rounded-2xl bg-secondary p-5"><p className="text-sm text-muted-foreground">Acesso digital completo — pagamento único</p><p className="mt-1 text-4xl font-bold">R$ 29,90</p><p className="mt-2 text-xs text-muted-foreground">Valor de referência da oferta. O preço final será confirmado antes do pagamento no checkout.</p></div>
     <Button className="mt-4 w-full" size="lg" onClick={start}>{hasCatalog?"Acessar meus guias":"Quero acessar os guias"}</Button>
     <p className="mt-3 text-center text-xs text-muted-foreground">Pix e cartão pelo Asaas após cadastro e confirmação.</p>
   </div>
  </div>
 </section>
 <section className="mx-auto max-w-6xl px-4 sm:px-6 py-16">
   <div className="max-w-2xl"><h2 className="text-3xl font-bold">Como funciona</h2><p className="mt-3 text-muted-foreground">Uma experiência pensada para encontrar a informação sem depender de dezenas de buscas separadas.</p></div>
   <div className="mt-8 grid gap-4 md:grid-cols-3">{[
    {Icon:Search,title:"1. Explore o catálogo",desc:"Consulte temas gratuitos e encontre os guias de seu interesse."},
    {Icon:Smartphone,title:"2. Crie sua conta",desc:"Cadastre seus dados e confirme o telefone para proteger o acesso."},
    {Icon:LockKeyhole,title:"3. Desbloqueie os guias",desc:"Se desejar, adquira acesso ao material premium digital."},
   ].map(s=><article key={s.title} className="rounded-2xl border bg-white p-6"><s.Icon className="size-7 text-primary"/><h3 className="mt-4 font-semibold">{s.title}</h3><p className="mt-2 text-sm text-muted-foreground">{s.desc}</p></article>)}</div>
 </section>
 <section className="bg-secondary/50 py-14"><div className="mx-auto max-w-6xl px-4 sm:px-6 grid gap-8 md:grid-cols-2">
  <div><ShieldCheck className="size-7 text-primary"/><h2 className="mt-4 text-2xl font-bold">Importante sobre os benefícios</h2><p className="mt-3 text-muted-foreground">Este é um serviço privado de organização de informações, sem vínculo, aprovação ou representação de órgãos governamentais. Comprar o guia não garante elegibilidade ou recebimento de benefícios.</p></div>
  <div><CircleHelp className="size-7 text-primary"/><h2 className="mt-4 text-2xl font-bold">Os benefícios públicos continuam gratuitos</h2><p className="mt-3 text-muted-foreground">A consulta aos órgãos oficiais e a solicitação de benefícios sociais são gratuitas. O valor cobrado aqui é exclusivamente pelo acesso aos materiais digitais explicativos.</p><Button variant="link" asChild className="mt-3 px-0"><Link to="/ajuda">Onde buscar atendimento oficial <ArrowRight className="ml-2 size-4"/></Link></Button></div>
 </div></section>
 <section className="mx-auto max-w-4xl px-4 py-16 text-center"><CreditCard className="mx-auto size-8 text-primary"/><h2 className="mt-3 text-3xl font-bold">Pronto para consultar os guias?</h2><p className="mt-3 text-muted-foreground">Comece pelos conteúdos gratuitos e decida se o acesso completo faz sentido para você.</p><Button size="lg" className="mt-6 rounded-full px-8" onClick={start}>Continuar <ArrowRight className="ml-2 size-4"/></Button></section>
 <LoginDialog open={loginOpen} onOpenChange={setLoginOpen} initialMode="cadastrar"/>
 <PaymentPrompt open={checkoutOpen} onOpenChange={setCheckoutOpen}/>
 </div>;
}
