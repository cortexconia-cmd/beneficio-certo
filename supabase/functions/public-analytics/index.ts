// Consent-based anonymous analytics and attributed conversion intake.
// No service key, IP address, or unconsented persistent identifiers are sent to the browser.
import { createClient } from "npm:@supabase/supabase-js@2.57.0";
const db=createClient(Deno.env.get("SUPABASE_URL")!,Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,{auth:{persistSession:false,autoRefreshToken:false}});
const allowedOrigins=new Set(["https://beneficio-compass-guide.lovable.app",...(Deno.env.get("APP_URL")?[new URL(Deno.env.get("APP_URL")!).origin]:[])]);
const headers=(origin:string)=>({"access-control-allow-origin":allowedOrigins.has(origin)?origin:"null","access-control-allow-headers":"authorization,apikey,content-type,x-client-info","access-control-allow-methods":"POST,OPTIONS","vary":"Origin","cache-control":"no-store"});
const response=(origin:string,obj:unknown,status=200)=>Response.json(obj,{status,headers:headers(origin)});
const isUuid=(x:unknown):x is string=>typeof x==="string"&&/^[a-f0-9]{8}-[a-f0-9]{4}-[1-8a-f][a-f0-9]{3}-[89ab][a-f0-9]{3}-[a-f0-9]{12}$/i.test(x);
const str=(x:unknown,n=150)=>typeof x==="string"?x.slice(0,n):null;
Deno.serve(async req=>{
 const origin=req.headers.get("origin")??"";
 if(req.method==="OPTIONS")return new Response(null,{status:allowedOrigins.has(origin)?204:403,headers:headers(origin)});
 if(req.method!=="POST")return response(origin,{error:"Método inválido"},405);
 if(!allowedOrigins.has(origin))return response(origin,{error:"Origem não permitida"},403);
 if(Number(req.headers.get("content-length")??0)>8192)return response(origin,{error:"Dados muito grandes"},413);
 let p:Record<string,unknown>;
 try{p=await req.json()}catch{return response(origin,{error:"Corpo inválido"},400)}
 if(p.consent_analytics!==true || !isUuid(p.visitor_id)||!isUuid(p.session_id))return response(origin,{error:"Consentimento e identificadores válidos são necessários"},400);
 const kind=p.action;
 if(!["visit","event","identify"].includes(String(kind)))return response(origin,{error:"Evento inválido"},400);
 const token=req.headers.get("authorization")?.match(/^Bearer\s+(.+)$/i)?.[1];
 let userId:string|null=null;
 if(token){const {data}=await db.auth.getUser(token);userId=data.user?.id??null;}
 if(kind==="identify"&&!userId)return response(origin,{error:"Faça login"},401);
 const {data:recent,error:recentError}=await db.from("visitor_sessions").select("id,user_id").eq("id",p.session_id).eq("visitor_id",p.visitor_id).maybeSingle();
 if(recentError)return response(origin,{error:"Falha ao consultar sessão"},500);
 if(kind!=="visit"&&!recent)return response(origin,{error:"Sessão não encontrada"},409);
 if(kind==="visit"&&!recent){
  const {error}=await db.from("visitor_sessions").insert({id:p.session_id,visitor_id:p.visitor_id,user_id:userId,landing_path:str(p.path,250),referrer:str(p.referrer,250),consent_analytics:true,consent_marketing:p.consent_marketing===true});
  if(error)return response(origin,{error:"Falha ao registrar visita"},500);
 }else if(recent&&userId&&recent.user_id!==userId){
  await db.from("visitor_sessions").update({user_id:userId,last_seen_at:new Date().toISOString()}).eq("id",p.session_id).eq("visitor_id",p.visitor_id);
 }
 if(kind==="visit"||kind==="identify"){
  const utms=isRecord(p.utms)?p.utms:{};
  if(Object.values(utms).some(x=>typeof x!=="string"&&x!==null))return response(origin,{error:"UTMs inválidas"},400);
  if(Object.keys(utms).length && Object.values(utms).some(v=>v)){
   const attrs:Record<string,unknown>={visitor_id:p.visitor_id,session_id:p.session_id,user_id:userId};
   for(const key of ["utm_source","utm_medium","utm_campaign","utm_content","utm_term","campaign_id","adset_id","ad_id","fbclid","fbc","fbp"]){
     attrs[key]=str(utms[key],120);
   }
   // Avoid duplicate attribution on retries; keep the earliest session attribution.
   const {count}=await db.from("attributions").select("id",{count:"exact",head:true}).eq("session_id",p.session_id);
   if(!count)await db.from("attributions").insert(attrs);
   else if(userId)await db.from("attributions").update({user_id:userId}).eq("session_id",p.session_id).is("user_id",null);
  }
 }
 if(kind==="event"){
  const eventName=str(p.event_name,80);
  if(!eventName||!["PageView","ViewContent","RegistrationStarted","Lead","InitiateCheckout","Purchase"].includes(eventName)||!isUuid(p.event_id))return response(origin,{error:"Evento inválido"},400);
  const {error}=await db.from("tracking_events").upsert({
   event_id:p.event_id,visitor_id:p.visitor_id,session_id:p.session_id,user_id:userId,
   event_name:eventName,page_path:str(p.path,250),properties:{source:"website"}
  },{onConflict:"event_id",ignoreDuplicates:true});
  if(error)return response(origin,{error:"Falha ao registrar evento"},500);
 }
 return response(origin,{ok:true});
});
function isRecord(v:unknown):v is Record<string,unknown>{return v!==null&&typeof v==="object"&&!Array.isArray(v)}
