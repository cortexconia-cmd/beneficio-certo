import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
const CONSENT="beneficio_certo_analytics_consent_v1";
const VID="beneficio_certo_visitor_v1";
const SID="beneficio_certo_session_v1";
const consent=()=>typeof window!=="undefined"&&localStorage.getItem(CONSENT)==="yes";
const uuid=()=>crypto.randomUUID();
const ids=()=>{
 let visitor=localStorage.getItem(VID), session=sessionStorage.getItem(SID);
 if(!visitor){visitor=uuid();localStorage.setItem(VID,visitor)}
 if(!session){session=uuid();sessionStorage.setItem(SID,session)}
 return {visitor_id:visitor,session_id:session};
};
const utms=()=>{
 const q=new URLSearchParams(location.search);
 const keys=["utm_source","utm_medium","utm_campaign","utm_content","utm_term","campaign_id","adset_id","ad_id","fbclid","fbc","fbp"];
 const map:Record<string,string>={};
 for(const k of keys){const v=q.get(k);if(v)map[k]=v.slice(0,120)}
 if(Object.keys(map).length)sessionStorage.setItem("beneficio_certo_utms",JSON.stringify(map));
 try{return JSON.parse(sessionStorage.getItem("beneficio_certo_utms")||"{}") as Record<string,string>}catch{return {}}
};
const send=async(action:string,params:Record<string,unknown>={})=>{
 if(!consent())return;
 const keys=ids();
 await supabase.functions.invoke("public-analytics",{body:{
  action, consent_analytics:true,consent_marketing:false,...keys,
  path:location.pathname,referrer:document.referrer,utms:utms(),...params
 }});
};
let initialized=false;
export async function initializeAnalytics(){
 if(typeof window==="undefined"||!consent())return;
 if(!initialized){initialized=true;await send("visit");}
 await trackEvent("PageView");
}
export async function trackEvent(name:"PageView"|"ViewContent"|"registration_started"|"Lead"|"InitiateCheckout"){
 if(typeof window==="undefined"||!consent())return;
 if(!initialized){initialized=true;await send("visit");}
 await send("event",{event_name:name,event_id:uuid()});
}
export function ConsentTracking(){
 const {user}=useAuth();
 const [choice,setChoice]=useState<"unknown"|"yes"|"no">("unknown");
 useEffect(()=>{
  const v=localStorage.getItem(CONSENT);
  setChoice(v==="yes"?"yes":v==="no"?"no":"unknown");
  if(v==="yes")void initializeAnalytics();
 },[]);
 useEffect(()=>{
  if(choice==="yes"&&user?.id)void send("identify");
 },[choice,user?.id]);
 const decide=(allow:boolean)=>{
  localStorage.setItem(CONSENT,allow?"yes":"no");
  setChoice(allow?"yes":"no");
  if(allow)void initializeAnalytics();
 };
 if(choice!=="unknown")return null;
 return <aside role="dialog" aria-label="Preferências de privacidade" className="fixed bottom-20 lg:bottom-4 left-3 right-3 z-[100] mx-auto max-w-xl rounded-2xl border border-border bg-white p-5 shadow-2xl">
  <p className="font-semibold text-sm">Privacidade e métricas de navegação</p>
  <p className="mt-1 text-xs text-muted-foreground">Com sua autorização, registramos visitas e origem das campanhas para melhorar o portal. Dados necessários ao login e pagamento funcionam sem esta autorização. Você pode recusar sem perder acesso.</p>
  <div className="mt-3 flex flex-wrap gap-2">
   <button onClick={()=>decide(true)} className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-white">Aceitar métricas</button>
   <button onClick={()=>decide(false)} className="rounded-lg border border-border px-4 py-2 text-sm">Recusar</button>
  </div>
 </aside>;
}
