import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { ShieldCheck, Eye, EyeOff } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export const Route=createFileRoute("/ativar-conta")({
 head:()=>({meta:[{title:"Ativar convite administrativo — Projeto + Benefícios"},{name:"robots",content:"noindex,nofollow"}]}),
 component:ActivateInvitation
});
function ActivateInvitation(){
 const [email,setEmail]=useState("");
 const [loading,setLoading]=useState(true);
 const [password,setPassword]=useState("");
 const [confirmation,setConfirmation]=useState("");
 const [visible,setVisible]=useState(false);
 const [pending,setPending]=useState(false);
 const [success,setSuccess]=useState(false);
 const [error,setError]=useState("");
 useEffect(()=>{
   let active=true;
   const load=async()=>{
     const {data,error}=await supabase.auth.getUser();
     if(!active)return;
     if(!error&&data.user){setEmail(data.user.email??"");}
     setLoading(false);
   };
   const {data:sub}=supabase.auth.onAuthStateChange(()=>{void load()});
   void load();
   return ()=>{active=false;sub.subscription.unsubscribe()};
 },[]);
 const submit=async(event:React.FormEvent)=>{
   event.preventDefault();
   setError("");
   if(password.length<8){setError("A senha deve conter no mínimo 8 caracteres.");return}
   if(password!==confirmation){setError("As senhas não coincidem.");return}
   setPending(true);
   try {
     const {data:identity,error:authError}=await supabase.auth.getUser();
     if(authError||!identity.user)throw new Error("Convite inválido ou expirado. Peça um novo convite ao AdminMaster.");
     const {error:changeError}=await supabase.auth.updateUser({password});
     if(changeError)throw new Error("Não foi possível ativar a senha. Solicite um novo convite.");
     setPassword("");setConfirmation("");setSuccess(true);
   }catch(e){setError(e instanceof Error?e.message:"Erro ao ativar conta.")}
   finally{setPending(false)}
 };
 return <main className="mx-auto max-w-lg px-4 py-16">
   <div className="rounded-3xl border border-border bg-white p-6 sm:p-9 shadow-soft">
     <div className="mb-5 grid size-14 place-items-center rounded-2xl bg-primary-soft text-primary"><ShieldCheck className="size-7"/></div>
     <h1 className="text-2xl font-bold">Ative sua conta administrativa</h1>
     <p className="mt-2 text-sm text-muted-foreground">Este acesso é pessoal. Crie uma senha segura para usar o painel do Projeto + Benefícios.</p>
     {loading?<p role="status" className="mt-6">Verificando convite…</p>:
     success?<div className="mt-6 space-y-4"><p role="status" className="text-sm text-emerald-700">Senha cadastrada. Seu convite foi ativado.</p><Button asChild className="w-full"><Link to="/admin">Abrir painel administrativo</Link></Button></div>:
     !email?<div className="mt-6 space-y-3"><p role="alert" className="text-sm text-destructive">Não identificamos um convite válido. Abra o link recebido no seu e-mail ou solicite um novo convite.</p><Link to="/" className="text-sm text-primary underline">Voltar ao portal</Link></div>:
     <form onSubmit={submit} className="mt-6 space-y-4">
       <p className="rounded-xl bg-secondary/50 px-4 py-3 text-sm">Conta: <strong>{email}</strong></p>
       <div className="space-y-1"><Label htmlFor="invite-password">Criar senha</Label><div className="relative"><Input id="invite-password" type={visible?"text":"password"} value={password} onChange={e=>setPassword(e.target.value)} autoComplete="new-password" minLength={8} required className="pr-12"/><Button type="button" size="icon" variant="ghost" className="absolute right-1 top-0" onClick={()=>setVisible(!visible)} aria-label={visible?"Ocultar senha":"Mostrar senha"}>{visible?<EyeOff className="size-4"/>:<Eye className="size-4"/>}</Button></div></div>
       <div className="space-y-1"><Label htmlFor="invite-confirm">Confirmar senha</Label><Input id="invite-confirm" type={visible?"text":"password"} value={confirmation} onChange={e=>setConfirmation(e.target.value)} minLength={8} required autoComplete="new-password"/></div>
       {error&&<p role="alert" className="text-sm text-destructive">{error}</p>}
       <Button type="submit" disabled={pending} className="w-full">{pending?"Ativando…":"Ativar acesso"}</Button>
     </form>}
   </div>
 </main>;
}
