import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import * as Icons from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { LoginDialog } from "@/components/layout/LoginDialog";

export const Route = createFileRoute("/admin")({
  head: () => ({ meta: [{ title: "Painel administrativo — Projeto + Benefícios" }, { name: "robots", content: "noindex,nofollow" }] }),
  component: Admin,
});

type Row=Record<string,unknown>;
type Dashboard={totalUsers:number;newUsers:number;sessions:number;uniqueVisitors:number;registrationStarted:number;ordersCreated:number;checkoutStarted:number;paidOrders:number;pendingOrders:number;revenueCents:number;refundedCents:number;activeAccess:number;publishedBenefits:number;totalBenefits:number;daily:{date:string;registrations:number;sessions:number;purchases:number}[]};
type Section="visao"|"usuarios"|"pedidos"|"aquisicao"|"conteudos"|"preco"|"auditoria"|"equipe"|"integracoes";
const nav:{id:Section;label:string;icon:React.ComponentType<{className?:string}>}[]=[
  {id:"visao",label:"Visão geral",icon:Icons.LayoutDashboard},
  {id:"usuarios",label:"Usuários",icon:Icons.Users},
  {id:"pedidos",label:"Pedidos",icon:Icons.CreditCard},
  {id:"aquisicao",label:"Aquisição",icon:Icons.ChartNoAxesCombined},
  {id:"conteudos",label:"Benefícios",icon:Icons.BookOpen},
  {id:"preco",label:"Configurações",icon:Icons.Settings2},
  {id:"auditoria",label:"Auditoria",icon:Icons.ScrollText},
  {id:"equipe",label:"Equipe administrativa",icon:Icons.UserCog},
  {id:"integracoes",label:"Integrações",icon:Icons.PlugZap},
];
const money=(cents:number)=>new Intl.NumberFormat("pt-BR",{style:"currency",currency:"BRL"}).format(cents/100);
const date=(d:unknown)=>typeof d==="string"?new Date(d).toLocaleDateString("pt-BR"):"—";
const isRecord=(x:unknown):x is Row=>!!x&&typeof x==="object"&&!Array.isArray(x);
const toStr=(x:unknown)=>typeof x==="string"?x:"";
const toNum=(x:unknown)=>typeof x==="number"?x:0;
const isArray=(x:unknown):x is unknown[]=>Array.isArray(x);
const JsonList=({value}:{value:unknown})=><>{isArray(value)?value.length:"—"}</>;
async function api<T>(action:string,other:Row={}):Promise<T>{
  const {data,error}=await supabase.functions.invoke("admin-dashboard",{body:{action,...other}});
  if(error||data?.error)throw new Error(typeof data?.error==="string"?data.error:"Não foi possível consultar o painel. Confira sua sessão e as permissões.");
  return data as T;
}
function Status({children}:{children:React.ReactNode}){return <span className="inline-flex rounded-full border border-border bg-secondary px-2.5 py-1 text-xs font-medium">{children}</span>}
function Kpi({label,value,icon:Icon,subtitle}:{label:string;value:string|number;icon:React.ComponentType<{className?:string}>;subtitle?:string}){
  return <article className="rounded-2xl border border-border bg-white p-5 shadow-soft"><div className="flex justify-between gap-3"><p className="text-sm text-muted-foreground">{label}</p><Icon className="size-5 text-primary"/></div><p className="mt-3 font-display text-3xl font-bold">{value}</p>{subtitle&&<p className="mt-2 text-xs text-muted-foreground">{subtitle}</p>}</article>;
}
function Empty({message="Nenhum registro encontrado."}:{message?:string}){return <p className="rounded-xl border border-dashed border-border p-8 text-center text-muted-foreground">{message}</p>}
function Pages({page,total,setPage}:{page:number;total:number;setPage:(n:number)=>void}){return <div className="flex items-center justify-between gap-3 py-4"><p className="text-sm text-muted-foreground">{total} registro(s) · Página {page+1}</p><div className="flex gap-2"><Button size="sm" variant="outline" disabled={page===0} onClick={()=>setPage(page-1)}>Anterior</Button><Button size="sm" variant="outline" disabled={(page+1)*30>=total} onClick={()=>setPage(page+1)}>Próxima</Button></div></div>}
function Admin(){
 const {user,loading:authLoading}=useAuth();
 const [loginOpen,setLoginOpen]=useState(false);
 const [section,setSection]=useState<Section>("visao");
 const [period,setPeriod]=useState(30);
 const [page,setPage]=useState(0);
 const [search,setSearch]=useState("");
 const [message,setMessage]=useState("");
 const [error,setError]=useState("");
 const cache=useQueryClient();
 const authorized=useQuery({queryKey:["admin-check",user?.id],enabled:!!user&&!authLoading,queryFn:()=>api<{data:Dashboard;role:"admin"|"admin_master"}>("overview",{period}),retry:false,staleTime:60000});
 const isAdmin=!!user&&authorized.isSuccess;
 const isMaster=isAdmin&&authorized.data?.role==="admin_master";
 const visibleNav=nav.filter(n=>(n.id!=="equipe"&&n.id!=="integracoes")||isMaster);
 const data=useQuery({queryKey:["admin-view",user?.id,section,period,page,search],enabled:isAdmin,queryFn:()=>api<Row>(section==="visao"?"overview":section==="usuarios"?"users":section==="pedidos"?"orders":section==="aquisicao"?"acquisition":section==="conteudos"?"benefits":section==="preco"?"setting":section==="equipe"?"staff-list":section==="integracoes"?"integrations":"audit",{period,page,search}),staleTime:10000});
 const choose=(s:Section)=>{setSection(s);setPage(0);setSearch("");setMessage("");setError("")};
 const refresh=()=>{void cache.invalidateQueries({queryKey:["admin-view"]});void cache.invalidateQueries({queryKey:["admin-check"]})};
 const run=async (action:string,payload:Row)=>{setMessage("");setError("");try{const response=await api<{success:boolean}>(action,payload);if(!response.success)throw new Error("Nenhum registro foi modificado.");setMessage("Alteração salva com registro de auditoria.");refresh();return true}catch(e){setError(e instanceof Error?e.message:"Falha ao salvar.");return false}};
 const headline=visibleNav.find(x=>x.id===section)?.label;
 const result:Row=data.data??{};
 if(authLoading)return <div className="mx-auto max-w-6xl px-4 py-24 text-center">Verificando sessão…</div>;
 if(!user)return <main className="mx-auto max-w-lg px-4 py-20 text-center"><Icons.ShieldCheck className="mx-auto size-14 text-primary"/><h1 className="mt-4 text-3xl font-bold">Área administrativa</h1><p className="mt-3 text-muted-foreground">Entre com sua conta de administrador para acessar o painel.</p><Button className="mt-5" onClick={()=>setLoginOpen(true)}>Entrar</Button><LoginDialog open={loginOpen} onOpenChange={setLoginOpen}/></main>;
 if(authorized.isPending)return <div className="mx-auto max-w-6xl px-4 py-24 text-center" role="status">Validando permissões administrativas…</div>;
 if(authorized.isError)return <main className="mx-auto max-w-lg px-4 py-20 text-center"><Icons.LockKeyhole className="mx-auto size-14 text-muted-foreground"/><h1 className="mt-4 text-2xl font-bold">Acesso restrito</h1><p className="mt-2 text-muted-foreground">Somente administradores autorizados podem consultar esta área.</p><Link to="/" className="mt-5 inline-block text-primary underline">Voltar ao portal</Link></main>;
 return <div className="mx-auto flex min-h-[75vh] max-w-[1500px] gap-0 lg:gap-7 px-3 sm:px-6 py-6 lg:py-10">
   <aside className="hidden lg:block w-56 shrink-0"><div className="sticky top-24 rounded-2xl border border-border bg-white p-3 shadow-soft"><div className="mb-3 px-3 py-3"><p className="text-xs uppercase font-bold tracking-widest text-primary">Projeto + Benefícios</p><p className="text-lg font-bold">Administração</p></div><nav className="space-y-1">{visibleNav.map(x=><button key={x.id} onClick={()=>choose(x.id)} className={`flex w-full items-center gap-3 rounded-xl px-3 py-3 text-left text-sm font-medium transition ${section===x.id?"bg-primary text-primary-foreground":"text-muted-foreground hover:bg-secondary hover:text-foreground"}`}><x.icon className="size-4"/>{x.label}</button>)}</nav><Link to="/" className="mt-4 flex items-center gap-2 border-t px-3 pt-4 text-sm text-primary"><Icons.ArrowLeft className="size-4"/>Voltar ao portal</Link></div></aside>
   <main className="min-w-0 flex-1 space-y-6">
    <div className="flex flex-wrap items-center justify-between gap-3"><div><p className="text-sm font-medium text-primary">Painel de gestão</p><h1 className="mt-1 text-2xl sm:text-3xl font-bold">{headline}</h1></div><div className="flex items-center gap-2"><Status><Icons.ShieldCheck className="mr-1 inline size-3"/> Administrador</Status><Button variant="outline" size="sm" onClick={refresh}><Icons.RefreshCw className="mr-2 size-4"/>Atualizar</Button></div></div>
    <nav aria-label="Seções do painel" className="flex gap-2 overflow-x-auto pb-2 lg:hidden scrollbar-none">{visibleNav.map(n=><button key={n.id} onClick={()=>choose(n.id)} className={`shrink-0 rounded-full border px-4 py-2 text-sm font-medium ${section===n.id?"border-primary bg-primary text-white":"bg-white text-muted-foreground"}`}>{n.label}</button>)}</nav>
    {(section==="visao"||section==="aquisicao")&&<div className="flex flex-wrap items-center gap-2"><span className="text-sm text-muted-foreground">Período:</span>{[7,30,90,365].map(n=><button key={n} className={`rounded-full px-3 py-1.5 text-sm ${n===period?"bg-primary text-white":"bg-secondary text-foreground"}`} onClick={()=>setPeriod(n)}>{n===365?"1 ano":n+" dias"}</button>)}</div>}
    {message&&<div role="status" className="rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-900">{message}</div>}
    {error&&<div role="alert" className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-900">{error}</div>}
    {data.isPending?<p className="py-16 text-center text-muted-foreground" role="status">Carregando dados reais do Supabase…</p>:data.isError?<div role="alert" className="rounded-xl border border-red-200 bg-red-50 p-5">Erro na consulta: {data.error.message}<Button className="ml-3" size="sm" onClick={refresh}>Tentar novamente</Button></div>:
    section==="visao"?<Overview obj={result.data as Dashboard}/>:
    section==="aquisicao"?<Acquisition rows={result.data}/>:
    section==="usuarios"?<Users rows={isArray(result.rows)?result.rows:[]} grants={result.grants} staff={result.staff} verified={result.verified} orders={result.orders} search={search} setSearch={setSearch} page={page} setPage={setPage} total={toNum(result.total)} run={run}/>:
    section==="pedidos"?<Orders rows={result.rows} profiles={result.profiles} search={search} setSearch={setSearch} page={page} setPage={setPage} total={toNum(result.total)}/>:
    section==="conteudos"?<Benefits rows={result.data} run={run}/>:
    section==="preco"?<Settings data={result.data} run={run}/>:
    section==="equipe"&&isMaster?<Staff rows={result.data} actorId={user.id} run={run}/>:
    section==="integracoes"&&isMaster?<Integrations data={result.data}/>:
    <Audit rows={result.rows} page={page} total={toNum(result.total)} setPage={setPage}/>}
   </main>
 </div>;
}
function Overview({obj}:{obj:Dashboard}){
 const v=obj??({} as Dashboard);const daily=isArray(v.daily)?v.daily:[];
 const max=Math.max(1,...daily.map(d=>d.sessions));
 return <div className="space-y-6"><section className="grid grid-cols-2 xl:grid-cols-4 gap-3 sm:gap-4">
  <Kpi label="Visitantes únicos" value={v.uniqueVisitors??0} icon={Icons.Eye} subtitle="Estimativa baseada nas sessões"/>
  <Kpi label="Sessões" value={v.sessions??0} icon={Icons.MousePointer2}/>
  <Kpi label="Cadastros" value={v.newUsers??0} icon={Icons.UserPlus}/>
  <Kpi label="Cadastros iniciados" value={v.registrationStarted??0} icon={Icons.PencilLine}/>
  <Kpi label="Checkouts iniciados" value={v.checkoutStarted??0} icon={Icons.ShoppingCart}/>
  <Kpi label="Compras aprovadas" value={v.paidOrders??0} icon={Icons.BadgeCheck}/>
  <Kpi label="Receita confirmada" value={money(v.revenueCents??0)} icon={Icons.Wallet}/>
  <Kpi label="Usuários com acesso" value={v.activeAccess??0} icon={Icons.KeyRound}/>
 </section>
 <section className="grid gap-4 lg:grid-cols-[1.7fr_1fr]">
  <div className="rounded-2xl border bg-white p-5 shadow-soft"><h2 className="font-bold text-lg">Sessões por dia</h2><p className="text-xs text-muted-foreground">Dados coletados pela plataforma, quando o rastreamento estiver ativo</p>{daily.some(d=>d.sessions>0)?<div className="mt-7 flex h-44 items-end gap-1.5 overflow-x-auto">{daily.map(d=><div key={d.date} className="flex h-full min-w-2 flex-1 flex-col justify-end" title={`${d.date}: ${d.sessions} sessões`}><div className="rounded-t bg-primary/80" style={{height:`${Math.max(4,100*d.sessions/max)}%`}}/></div>)}</div>:<Empty message="Ainda não existem sessões registradas no período."/>}</div>
  <div className="space-y-3 rounded-2xl border bg-white p-5 shadow-soft"><h2 className="text-lg font-bold">Conversões</h2><div className="space-y-3 text-sm">{[["Visita → cadastro",v.uniqueVisitors?((v.newUsers/v.uniqueVisitors)*100).toFixed(1)+"%":"—"],["Cadastro → compra",v.newUsers?((v.paidOrders/v.newUsers)*100).toFixed(1)+"%":"—"],["Pedidos pendentes",v.pendingOrders??0],["Estornos",money(v.refundedCents??0)]].map(([l,x])=><div className="flex justify-between gap-2 border-b pb-2" key={String(l)}><span className="text-muted-foreground">{l}</span><b>{x}</b></div>)}</div><p className="text-xs text-muted-foreground">Indicadores estimados; não são coortes de conversão atribuídas. Investimento de anúncios ainda não integrado.</p></div>
 </section></div>;
}
function Acquisition({rows}:{rows:unknown}){
 const list=isArray(rows)?rows.filter(isRecord):[];
 return <section className="rounded-2xl border bg-white p-5 shadow-soft"><div className="mb-4"><h2 className="text-lg font-bold">Campanhas e origens</h2><p className="text-sm text-muted-foreground">Origem do primeiro contato de cada visitante (primeiro toque). Compras e receita são de pagamentos confirmados.</p></div>
 <div className="overflow-x-auto"><table className="w-full text-left text-sm"><thead className="border-b text-muted-foreground"><tr><th className="py-3">Origem</th><th>Campanha</th><th className="text-right">Visitantes</th><th className="text-right">Cadastros</th><th className="text-right">Compras</th><th className="text-right">Receita (R$)</th></tr></thead><tbody>{list.map((r,i)=><tr key={i} className="border-b"><td className="py-3">{toStr(r.source)}</td><td>{toStr(r.campaign)}</td><td className="text-right">{toNum(r.visitors)}</td><td className="text-right">{toNum(r.registeredUsers)}</td><td className="text-right">{toNum(r.purchases)}</td><td className="text-right">{(toNum(r.revenueCents)/100).toLocaleString("pt-BR",{minimumFractionDigits:2})}</td></tr>)}</tbody></table></div>{!list.length&&<Empty message="Nenhuma origem registrada. UTMs e Pixel/CAPI serão configurados no módulo de aquisição."/>}</section>;
}
function Users({rows,grants,staff,verified,orders,search,setSearch,page,setPage,total,run}:{rows:unknown[];grants:unknown;staff:unknown;verified:unknown;orders:unknown;search:string;setSearch:(s:string)=>void;page:number;setPage:(n:number)=>void;total:number;run:(action:string,payload:Row)=>Promise<boolean>}){
 const [selected,setSelected]=useState<string|null>(null),[decision,setDecision]=useState<"grant"|"revoke">("grant"),[reason,setReason]=useState(""),[expiry,setExpiry]=useState("");
 const now=Date.now();
 const st=isArray(staff)?staff.filter(isRecord):[];
 const staffRole=(id:string)=>st.some(r=>r.user_id===id&&(r.role==="admin"||r.role==="admin_master"));
 const gr=isArray(grants)?grants.filter(isRecord):[],ver=isArray(verified)?verified.filter(isRecord):[],ord=isArray(orders)?orders.filter(isRecord):[];
 const active=(id:string)=>gr.some(g=>g.user_id===id&&!g.revoked_at&&Date.parse(toStr(g.starts_at))<=now&&(!g.expires_at||Date.parse(toStr(g.expires_at))>now)&&g.access_scope==="catalog");
 const purchased=(id:string)=>gr.some(g=>g.user_id===id&&!!g.order_id&&!g.revoked_at&&Date.parse(toStr(g.starts_at))<=now&&(!g.expires_at||Date.parse(toStr(g.expires_at))>now)&&g.access_scope==="catalog");
 const manual=(id:string)=>gr.some(g=>g.user_id===id&&!g.order_id&&!g.revoked_at&&Date.parse(toStr(g.starts_at))<=now&&(!g.expires_at||Date.parse(toStr(g.expires_at))>now)&&g.access_scope==="catalog");
 const isPremium=(id:string)=>staffRole(id)||active(id);
 const selectedRow=rows.find(x=>isRecord(x)&&x.id===selected);
 return <div className="space-y-4">
 <div className="rounded-2xl border bg-white p-4 shadow-soft"><div className="flex flex-wrap justify-between gap-3"><Input aria-label="Buscar usuário" className="max-w-sm" placeholder="Pesquisar nome, e-mail ou WhatsApp" value={search} onChange={e=>{setSearch(e.target.value);setPage(0)}}/><span className="text-xs text-muted-foreground self-center">{total} usuário(s)</span></div>
 <div className="mt-4 overflow-x-auto"><table className="w-full min-w-[680px] text-left text-sm"><thead className="border-b text-muted-foreground"><tr><th className="py-3">Usuário</th><th>WhatsApp</th><th>Verificação</th><th>Acesso</th><th>Cadastro</th><th></th></tr></thead><tbody>{rows.filter(isRecord).map(u=>{const id=toStr(u.id),confirmed=ver.some(v=>v.user_id===id&&v.verified_at);return <tr key={id} className="border-b"><td className="py-3"><b>{toStr(u.full_name)||"Sem nome"}</b><p className="text-xs text-muted-foreground">{toStr(u.email)}</p></td><td>{toStr(u.whatsapp)||"—"}</td><td><Status>{confirmed?"Confirmado":"Pendente"}</Status></td><td><Status>{isPremium(id)?"Premium":"Gratuito"}</Status>{staffRole(id)?<p className="mt-1 text-xs text-muted-foreground">Cargo administrativo</p>:purchased(id)?<p className="mt-1 text-xs text-muted-foreground">Compra confirmada</p>:manual(id)?<p className="mt-1 text-xs text-muted-foreground">Liberação manual</p>:null}</td><td>{date(u.created_at)}</td><td><Button variant="outline" size="sm" onClick={()=>{setSelected(id);setDecision(manual(id)?"revoke":"grant")}}>Gerenciar</Button></td></tr>})}</tbody></table></div>{!rows.length&&<Empty/>}<Pages page={page} setPage={setPage} total={total}/></div>
 {selected&&isRecord(selectedRow)&&<section className="rounded-2xl border border-primary/20 bg-white p-5 shadow-soft space-y-4">
   <div className="flex items-center justify-between"><h3 className="text-lg font-bold">Tipo de acesso — {toStr(selectedRow.full_name)}</h3><Button size="sm" variant="ghost" onClick={()=>setSelected(null)}>Fechar</Button></div>
   <p className="text-sm text-muted-foreground">Selecione o tipo de acesso ao catálogo. Essa alteração não cria pedidos nem registra pagamentos fictícios.</p>
   <div className="grid gap-2 sm:grid-cols-2">
     <button type="button" disabled={staffRole(selected)||purchased(selected)} onClick={()=>setDecision("revoke")} className={`rounded-xl border p-4 text-left ${decision==="revoke"?"border-primary bg-primary/5":"border-border"} disabled:opacity-50`}><strong>Gratuito</strong><p className="mt-1 text-xs text-muted-foreground">Somente os conteúdos gratuitos do portal</p></button>
     <button type="button" disabled={staffRole(selected)||purchased(selected)} onClick={()=>setDecision("grant")} className={`rounded-xl border p-4 text-left ${decision==="grant"?"border-primary bg-primary/5":"border-border"} disabled:opacity-50`}><strong>Premium</strong><p className="mt-1 text-xs text-muted-foreground">Todos os guias publicados, sem cobrança manual</p></button>
   </div>
   {staffRole(selected)&&<p className="rounded-lg border border-primary/20 bg-primary/5 p-3 text-sm">Esta conta é Admin ou AdminMaster e tem acesso Premium automático. Para retirar esse acesso, altere o cargo em Equipe administrativa (somente AdminMaster).</p>}
   {!staffRole(selected)&&purchased(selected)&&<p className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm">Esta conta tem uma compra ativa. O acesso Premium não pode ser retirado por uma alteração manual. Cancelamentos e reembolsos devem seguir o Asaas.</p>}
   {!staffRole(selected)&&!purchased(selected)&&<>
     <div className="space-y-2"><Label htmlFor="admin-reason">Justificativa da alteração (mínimo 8 caracteres)</Label><Textarea id="admin-reason" maxLength={500} value={reason} onChange={e=>setReason(e.target.value)} placeholder="Ex.: acesso premium concedido pela equipe de atendimento"/></div>
     {decision==="grant"&&<div className="space-y-2"><Label htmlFor="admin-expiry">Validade opcional do Premium</Label><Input id="admin-expiry" type="date" value={expiry} onChange={e=>setExpiry(e.target.value)}/></div>}
     <Button disabled={reason.trim().length<8||(decision==="grant"&&manual(selected))||(decision==="revoke"&&!manual(selected))} onClick={async()=>{const ok=await run("manual-access",{userId:selected,decision,reason,expiry:decision==="grant"&&expiry?new Date(expiry+"T23:59:59").toISOString():null});if(ok){setSelected(null);setReason("");setExpiry("")}}}>Salvar como {decision==="grant"?"Premium":"Gratuito"}</Button>
     <p className="text-xs text-muted-foreground">Os acessos manuais são auditados. A verificação de WhatsApp continua obrigatória para contas de clientes.</p>
   </>}
 </section>}
 </div>;
}
function Orders({rows,profiles,search,setSearch,page,setPage,total}:{rows:unknown;profiles:unknown;search:string;setSearch:(x:string)=>void;page:number;setPage:(n:number)=>void;total:number}){
 const list=isArray(rows)?rows.filter(isRecord):[],people=isArray(profiles)?profiles.filter(isRecord):[];
 return <section className="rounded-2xl border bg-white p-4 shadow-soft"><div className="flex flex-wrap gap-3 justify-between"><Input aria-label="Buscar pedido" placeholder="Pesquisar número do pedido" className="max-w-sm" value={search} onChange={e=>{setSearch(e.target.value);setPage(0)}}/><p className="text-sm self-center text-muted-foreground">{total} pedidos</p></div><div className="overflow-x-auto mt-4"><table className="w-full min-w-[650px] text-left text-sm"><thead className="border-b text-muted-foreground"><tr><th className="py-3">Pedido</th><th>Cliente</th><th>Valor</th><th>Situação</th><th>Data</th></tr></thead><tbody>{list.map(o=>{const p=people.find(x=>x.id===o.user_id);return <tr key={toStr(o.id)} className="border-b"><td className="py-3 font-medium">{toStr(o.order_number).slice(0,16)}</td><td>{toStr(p?.full_name)||toStr(p?.email)||"—"}</td><td>{money(toNum(o.amount_cents))}</td><td><Status>{toStr(o.status)}</Status></td><td>{date(o.created_at)}</td></tr>})}</tbody></table></div>{!list.length&&<Empty message="Ainda não há pagamentos ou pedidos registrados."/>}<Pages page={page} setPage={setPage} total={total}/></section>;
}
function Benefits({rows,run}:{rows:unknown;run:(a:string,p:Row)=>Promise<boolean>}){
 const list=isArray(rows)?rows.filter(isRecord):[];
 const [selected,setSelected]=useState<string|null>(null);
 const [draft,setDraft]=useState<Row|null>(null);
 const [raw,setRaw]=useState("");
 const target=list.find(b=>b.id===selected);
 const start=(b:Row)=>{const c=isArray(b.benefit_contents)?b.benefit_contents[0]:b.benefit_contents;const t=isRecord(c)?c:{};const obj:Row={name:toStr(b.name),short_description:toStr(b.short_description),category_id:toStr(b.category_id),is_published:b.is_published===true,what_is:toStr(t.what_is),who_qualifies:t.who_qualifies??[],value_info:t.value_info??[],how_to_apply:t.how_to_apply??[],documents:t.documents??[],important:t.important??[]};setSelected(toStr(b.id));setDraft(obj);setRaw(JSON.stringify({who_qualifies:obj.who_qualifies,value_info:obj.value_info,how_to_apply:obj.how_to_apply,documents:obj.documents,important:obj.important},null,2))};
 const save=async()=>{if(!selected||!draft)return;let json:Row;try{json=JSON.parse(raw);if(!isRecord(json))throw Error()}catch{window.alert("JSON inválido. Corrija os campos estruturados.");return}await run("save-benefit",{id:selected,payload:{...draft,...json}})};
 return <div className="space-y-4"><div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">{list.map(b=><article key={toStr(b.id)} className="rounded-2xl border bg-white p-4 shadow-soft"><div className="mb-3 flex justify-between"><Status>{b.is_published?"Publicado":"Rascunho"}</Status><Status>{b.slug==="bolsa-familia"||b.slug==="auxilio-gas"||b.slug==="bpc-loas"?"Gratuito":"Premium"}</Status></div><h3 className="font-bold">{toStr(b.name)}</h3><p className="mt-2 line-clamp-2 min-h-10 text-sm text-muted-foreground">{toStr(b.short_description)}</p><Button className="mt-4 w-full" variant="outline" onClick={()=>start(b)}>Editar conteúdo</Button></article>)}</div>{!list.length&&<Empty/>}{selected&&draft&&<section className="rounded-2xl border border-primary/20 bg-white p-5 shadow-soft space-y-4"><div className="flex items-center justify-between"><h3 className="text-lg font-bold">Editar benefício — {toStr(target?.slug)}</h3><Button variant="ghost" onClick={()=>setSelected(null)}>Fechar</Button></div><div className="space-y-2"><Label htmlFor="b-name">Nome</Label><Input id="b-name" maxLength={160} value={toStr(draft.name)} onChange={e=>setDraft({...draft,name:e.target.value})}/></div><div className="space-y-2"><Label htmlFor="b-desc">Descrição curta</Label><Textarea id="b-desc" maxLength={600} value={toStr(draft.short_description)} onChange={e=>setDraft({...draft,short_description:e.target.value})}/></div><div className="space-y-2"><Label htmlFor="b-what">O que é</Label><Textarea id="b-what" rows={5} value={toStr(draft.what_is)} onChange={e=>setDraft({...draft,what_is:e.target.value})}/></div><div className="space-y-2"><Label htmlFor="b-json">Conteúdo estruturado (JSON): quem tem direito, valores, passos, documentos, informações</Label><Textarea id="b-json" className="font-mono text-xs" rows={14} value={raw} onChange={e=>setRaw(e.target.value)}/></div><label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={draft.is_published===true} onChange={e=>setDraft({...draft,is_published:e.target.checked})}/> Benefício publicado</label><Button onClick={()=>void save()}>Salvar alterações</Button><p className="text-xs text-muted-foreground">A regra de 3 benefícios gratuitos e os identificadores não podem ser alterados por esta tela. Os textos completos são salvos no banco.</p></section>}</div>;
}
function Settings({data,run}:{data:unknown;run:(a:string,p:Row)=>Promise<boolean>}){
 const setting=isRecord(data)?data:{};
 const [amount,setAmount]=useState<number|null>(null);
 const initial=toNum(setting.priceCents)/100;
 const current=amount===null?initial:amount;
 return <section className="max-w-2xl rounded-2xl border bg-white p-6 shadow-soft space-y-5"><div><h2 className="text-xl font-bold">Preço de acesso ao catálogo</h2><p className="mt-1 text-sm text-muted-foreground">Preço único em reais. Novos pedidos usarão o valor atualizado; os já criados mantêm o preço original.</p></div><div className="space-y-2"><Label htmlFor="catalog-price">Valor (R$)</Label><Input id="catalog-price" type="number" min="1" max="1000" step=".01" value={current} onChange={e=>setAmount(Number(e.target.value))}/></div><Button disabled={!Number.isFinite(current)||current<1||current>1000} onClick={()=>void run("save-price",{cents:Math.round(current*100)})}>Salvar novo valor</Button><p className="text-xs text-muted-foreground">A mudança é aplicada no Supabase e registrada na auditoria. A criação de checkout usa o preço do servidor.</p></section>;
}
function Audit({rows,page,total,setPage}:{rows:unknown;page:number;total:number;setPage:(n:number)=>void}){
 const list=isArray(rows)?rows.filter(isRecord):[];
 return <section className="rounded-2xl border bg-white p-5 shadow-soft"><h2 className="mb-4 font-bold text-lg">Histórico de alterações administrativas</h2><div className="space-y-3">{list.map(x=><div key={toStr(x.id)} className="border-b pb-3"><p className="font-medium text-sm">{toStr(x.action)}</p><p className="mt-1 text-xs text-muted-foreground">{date(x.created_at)} · {toStr(x.entity_type)} · {toStr(x.entity_id)}</p></div>)}</div>{!list.length&&<Empty message="Nenhuma alteração administrativa registrada."/>}<Pages page={page} total={total} setPage={setPage}/></section>;
}


function Staff({rows,actorId,run}:{rows:unknown;actorId:string;run:(action:string,payload:Row)=>Promise<boolean>}){
 const members=isArray(rows)?rows.filter(isRecord):[];
 const [inviteEmail,setInviteEmail]=useState("");
 const [inviteRole,setInviteRole]=useState<"admin"|"admin_master">("admin");
 const [selected,setSelected]=useState<string|null>(null);
 const [role,setRole]=useState<"admin"|"admin_master"|"none">("admin");
 const [reason,setReason]=useState("");
 const [lookup,setLookup]=useState("");
 const [lookupOpen,setLookupOpen]=useState(false);
 const [busy,setBusy]=useState(false);
 const findPeople=useQuery({
   queryKey:["admin-staff-find",lookup],enabled:lookupOpen&&lookup.trim().length>=3,
   queryFn:()=>api<{rows:Row[];total:number}>("users",{search:lookup.trim(),page:0}),staleTime:5000
 });
 async function invite(event:React.FormEvent) {
   event.preventDefault();
   if(busy)return;
   setBusy(true);
   try {
     const ok=await run("staff-invite",{email:inviteEmail.trim(),staffRole:inviteRole});
     if(ok)setInviteEmail("");
   } finally {setBusy(false);}
 }
 async function changeRole(){
   if(!selected||busy)return;
   setBusy(true);
   try{
     const ok=await run("staff-role",{targetUserId:selected,staffRole:role,reason:reason.trim()});
     if(ok){setSelected(null);setReason("");setLookup("");setLookupOpen(false);}
   }finally{setBusy(false);}
 }
 const choose=(id:string,current:"admin"|"admin_master"|"none")=>{setSelected(id);setRole(current);setReason("")};
 return <div className="space-y-5">
  <div className="grid gap-4 lg:grid-cols-2">
   <section className="rounded-2xl border bg-white p-5 shadow-soft space-y-4">
     <div><h2 className="text-lg font-bold">Convidar administrador</h2><p className="mt-1 text-sm text-muted-foreground">O convite é enviado ao e-mail. A pessoa define a própria senha para entrar no painel.</p></div>
     <form onSubmit={invite} className="space-y-3">
       <div className="space-y-1"><Label htmlFor="staff-email">E-mail do convidado</Label><Input required id="staff-email" type="email" autoComplete="off" maxLength={250} placeholder="pessoa@empresa.com" value={inviteEmail} onChange={e=>setInviteEmail(e.target.value)}/></div>
       <div className="space-y-1"><Label htmlFor="staff-role">Cargo</Label><select id="staff-role" className="w-full rounded-lg border border-border bg-white px-3 py-2 text-sm" value={inviteRole} onChange={e=>setInviteRole(e.target.value as "admin"|"admin_master")}><option value="admin">Admin</option><option value="admin_master">AdminMaster</option></select></div>
       <Button type="submit" className="w-full" disabled={busy||!inviteEmail.includes("@")}><Icons.MailPlus className="mr-2 size-4"/>{busy?"Aguarde…":"Enviar convite"}</Button>
       <p className="text-xs text-muted-foreground">Limite de 20 convites por dia. Não há senha compartilhada ou cadastro automático de contas já existentes.</p>
     </form>
   </section>
   <section className="rounded-2xl border bg-white p-5 shadow-soft space-y-3">
     <h2 className="text-lg font-bold">Promover conta existente</h2>
     <p className="text-sm text-muted-foreground">Busque uma pessoa já cadastrada e escolha seu novo cargo administrativo.</p>
     <Input aria-label="Buscar conta existente" placeholder="Nome ou e-mail cadastrado" value={lookup} onChange={e=>{setLookup(e.target.value);setLookupOpen(true)}}/>
     {lookupOpen && lookup.trim().length>=3 && <div className="max-h-60 overflow-y-auto rounded-xl border border-border">
       {findPeople.isPending?<p className="p-3 text-sm">Buscando…</p>:findPeople.isError?<p role="alert" className="p-3 text-sm text-destructive">Busca indisponível.</p>:!findPeople.data?.rows?.length?<p className="p-3 text-sm text-muted-foreground">Nenhuma conta encontrada.</p>:
       findPeople.data.rows.map(p=><button type="button" key={toStr(p.id)} className="block w-full border-b p-3 text-left text-sm hover:bg-secondary" onClick={()=>{choose(toStr(p.id),"admin");setLookupOpen(false)}}>
         <strong>{toStr(p.full_name)}</strong><span className="block text-xs text-muted-foreground">{toStr(p.email)}</span>
       </button>)}
     </div>}
     <p className="text-xs text-muted-foreground">A conta precisa existir no Supabase; convites de novas contas são feitos no formulário ao lado.</p>
   </section>
  </div>
  <section className="rounded-2xl border bg-white p-5 shadow-soft">
    <h2 className="mb-4 text-lg font-bold">Administradores cadastrados</h2>
    <div className="overflow-x-auto"><table className="w-full min-w-[560px] text-left text-sm"><thead className="border-b text-muted-foreground"><tr><th className="pb-3">Conta</th><th className="pb-3">Cargo</th><th className="pb-3">Convite</th><th></th></tr></thead><tbody>{members.map(m=>{
       const id=toStr(m.id);
       const current=toStr(m.role)==="admin_master"?"admin_master":"admin";
       return <tr key={id} className="border-b"><td className="py-3"><strong>{toStr(m.name)||toStr(m.email)}</strong><span className="block text-xs text-muted-foreground">{toStr(m.email)}</span></td><td><Status>{current==="admin_master"?"AdminMaster":"Admin"}</Status></td><td><Status>{m.confirmed?"Confirmado":"Aguardando aceite"}</Status></td><td>{id===actorId?<span className="text-xs text-muted-foreground">Sua conta</span>:<Button type="button" size="sm" variant="outline" onClick={()=>choose(id,current)}>Alterar cargo</Button>}</td></tr>
     })}</tbody></table></div>
    {!members.length&&<Empty message="Nenhum administrador registrado."/>}
  </section>
  {selected && <section className="rounded-2xl border border-primary/30 bg-white p-5 shadow-soft space-y-4">
    <div className="flex items-center justify-between gap-2"><h3 className="text-lg font-bold">Alterar permissões</h3><Button variant="ghost" size="sm" onClick={()=>setSelected(null)}>Cancelar</Button></div>
    <p className="text-xs text-muted-foreground">Conta selecionada: {selected}</p>
    <div className="space-y-1"><Label htmlFor="new-role">Novo cargo</Label><select id="new-role" className="w-full rounded-lg border border-border bg-white px-3 py-2 text-sm" value={role} onChange={e=>setRole(e.target.value as "admin"|"admin_master"|"none")}><option value="admin">Admin</option><option value="admin_master">AdminMaster</option><option value="none">Remover acesso ao painel</option></select></div>
    <div className="space-y-1"><Label htmlFor="role-reason">Motivo da alteração</Label><Textarea id="role-reason" required minLength={8} maxLength={500} placeholder="Informe o motivo desta alteração" value={reason} onChange={e=>setReason(e.target.value)}/></div>
    <Button onClick={()=>void changeRole()} disabled={busy||reason.trim().length<8||selected===actorId}>{busy?"Salvando…":"Confirmar alteração de cargo"}</Button>
    <p className="text-xs text-muted-foreground">Somente AdminMaster pode alterar cargos. Não é possível alterar o próprio cargo nem remover o último AdminMaster. Toda alteração é auditada.</p>
  </section>}
 </div>;
}

function Integrations({data}:{data:unknown}){
 const fields=isRecord(data)?data:{};
 const providers=[
  {title:"Asaas",rows:[["Chave API",fields.asaasApiKey],["Token Webhook",fields.asaasWebhookToken],["APP_URL",fields.appUrl]]},
  {title:"SolvChat",rows:[["Token API",fields.solvChatToken],["URL de envio",fields.solvChatSendUrl],["Segredo OTP",fields.otpPepper]]},
  {title:"Meta Ads",rows:[["ID do Pixel (servidor)",fields.metaPixelId],["Token CAPI",fields.metaCapiToken]]}
 ] as const;
 return <div className="space-y-4">
  <section className="rounded-2xl border bg-white p-5"><h2 className="text-lg font-bold">Verificação das integrações</h2><p className="mt-1 text-sm text-muted-foreground">Confirma somente a existência dos Secrets na Edge Function. Não confirma que credenciais, envios e pagamentos estejam funcionando.</p><div className="mt-4 rounded-xl bg-secondary p-3 text-sm">Ambiente Asaas: <strong>{fields.asaasEnv==="production"?"Produção — pagamentos reais":"Sandbox — testes"}</strong></div></section>
  <div className="grid gap-4 lg:grid-cols-3">{providers.map(p=><section key={p.title} className="rounded-2xl border bg-white p-5"><h3 className="font-bold">{p.title}</h3><div className="mt-4 space-y-3">{p.rows.map(([name,status])=><div key={name} className="flex items-center justify-between gap-2 border-b pb-2"><span className="text-sm text-muted-foreground">{name}</span><span className={`text-xs font-semibold ${status?"text-emerald-700":"text-amber-700"}`}>{status?"Configurado":"Pendente"}</span></div>)}</div></section>)}</div>
  <p className="text-sm text-muted-foreground">Cadastre as chaves exclusivamente em Supabase → Edge Functions → Secrets. Não compartilhe credenciais em chats e não use variáveis públicas para chaves privadas. Teste SolvChat e Asaas em ambiente controlado antes de liberar vendas.</p>
 </div>;
}
