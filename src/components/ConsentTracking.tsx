import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
const CONSENT="beneficio_certo_analytics_consent_v1";
const MARKETING="beneficio_certo_marketing_consent_v1";
const marketing=()=>typeof window!=="undefined"&&localStorage.getItem(MARKETING)==="yes";
const VID="beneficio_certo_visitor_v1";
const SID="beneficio_certo_session_v1";
const consent=()=>typeof window!=="undefined"&&localStorage.getItem(CONSENT)==="yes";
const uuid=()=>crypto.randomUUID();
let pixelReady=false;
async function initPixel(){
 if(!consent()||!marketing()||pixelReady)return;
 const {data,error}=await supabase.functions.invoke("public-analytics",{body:{action:"config",consent_marketing:true}});
 const id=typeof data?.pixelId==="string"?data.pixelId:"";
 if(error||!/^\\d{10,20}$/.test(id))return;
 pixelReady=true;
 type MetaQueue=((...args:unknown[])=>void)&{callMethod?: (...args:unknown[])=>void;queue:unknown[][];loaded?:boolean;version?:string};
 const win=window as Window & {fbq?:MetaQueue;_fbq?:MetaQueue};
 if(!win.fbq){
  const fn=((...args:unknown[])=>{if(fn.callMethod)fn.callMethod(...args);else fn.queue.push(args)}) as MetaQueue;
  fn.queue=[];fn.loaded=true;fn.version="2.0";win.fbq=fn;win._fbq=fn;
  const script=document.createElement("script");script.async=true;script.src="https://connect.facebook.net/en_US/fbevents.js";document.head.appendChild(script);
 }
 win.fbq?.("init",id);
}
function metaTrack(name:string,eventID:string){
 const fbq=(window as Window & {fbq?:((...args:unknown[])=>void)}).fbq;
 if(pixelReady&&fbq)fbq("track",name,{}, {eventID});
}
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
  action, consent_analytics:true,...keys,
  path:location.pathname,referrer:document.referrer,utms:utms(),
  consent_marketing:marketing(),fbp:document.cookie.match(/(?:^|; )_fbp=([^;]*)/)?.[1],
  fbc:document.cookie.match(/(?:^|; )_fbc=([^;]*)/)?.[1],...params
 }});
};
let initialized=false;
export async function initializeAnalytics(){
 if(typeof window==="undefined"||!consent())return;
 if(!initialized){initialized=true;await send("visit");}
 if(marketing())await initPixel();
 await trackEvent("PageView");
}
export async function trackEvent(name:"PageView"|"ViewContent"|"registration_started"|"Lead"|"CompleteRegistration"|"InitiateCheckout"){
 if(typeof window==="undefined"||!consent())return;
 if(!initialized){initialized=true;await send("visit");}
 const id=uuid();
 await send("event",{event_name:name,event_id:id});
 if(marketing()&&name!=="registration_started")metaTrack(name,id);
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
 const decide=(analytics:boolean,ads:boolean)=>{
  const wasMarketing=marketing();
  const visitor_id=localStorage.getItem(VID),session_id=sessionStorage.getItem(SID);
  // Withdrawal is conveyed to the server *before* turning off local tracking.
  // It does not create a PageView or any other analytics event.
  if(wasMarketing&&!ads&&visitor_id&&session_id){
    void supabase.functions.invoke("public-analytics",{body:{
      action:"privacy",visitor_id,session_id,consent_analytics:false,consent_marketing:false
    }});
  }
  localStorage.setItem(CONSENT,analytics?"yes":"no");
  localStorage.setItem(MARKETING,ads?"yes":"no");
  if(!ads){
    for(const key of ["_fbp","_fbc"])document.cookie=key+"=; Max-Age=0; Path=/; SameSite=Lax";
  }
  if(!analytics){localStorage.removeItem(VID);sessionStorage.removeItem(SID);initialized=false}
  setChoice(analytics?"yes":"no");
  if(analytics){
   void initializeAnalytics();
   void send("identify");
  }
 };
 useEffect(()=>{
  const handler=()=>setChoice("unknown");
  window.addEventListener("bc:privacy",handler);
  return ()=>window.removeEventListener("bc:privacy",handler);
 },[]);
 if(choice!=="unknown")return null;
 return <aside role="dialog" aria-label="Preferências de privacidade" className="fixed bottom-20 lg:bottom-4 left-3 right-3 z-[100] mx-auto max-w-xl rounded-2xl border border-border bg-white p-5 shadow-2xl">
  <p className="font-semibold text-sm">Privacidade e métricas de navegação</p>
  <p className="mt-1 text-xs text-muted-foreground">Você escolhe se permite métricas de navegação e anúncios personalizados (Pixel/CAPI). O cadastro, o pagamento e os conteúdos funcionam mesmo sem aceitar. É possível alterar sua escolha depois.</p>
  <div className="mt-3 flex flex-wrap gap-2">
   <button onClick={()=>decide(true,true)} className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-white">Aceitar tudo</button>
   <button onClick={()=>decide(true,false)} className="rounded-lg border border-border px-4 py-2 text-sm">Só métricas</button>
   <button onClick={()=>decide(false,false)} className="rounded-lg border border-border px-4 py-2 text-sm">Recusar</button>
  </div>
 </aside>;
}
