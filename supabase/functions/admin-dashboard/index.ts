import { createClient } from "npm:@supabase/supabase-js@2.57.0";
const db = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!, {auth:{persistSession:false,autoRefreshToken:false}});
const cors={"access-control-allow-origin":"*","access-control-allow-headers":"authorization,apikey,x-client-info,content-type","access-control-allow-methods":"POST, OPTIONS"};
const reply=(body:unknown,status=200)=>Response.json(body,{status,headers:{"cache-control":"no-store",...cors}});
const uuid=/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
type Params={action?:string;period?:number;page?:number;search?:string;id?:string;status?:string;payload?:Record<string,unknown>;cents?:number;userId?:string;decision?:string;reason?:string;expiry?:string|null;email?:string;staffRole?:string;reason?:string;targetUserId?:string};
async function paged(table:"profiles"|"orders"|"audit_logs",fields:string,page:number,search:string,orderColumn="created_at"){
  let query=db.from(table).select(fields,{count:"exact"}).order(orderColumn,{ascending:false}).range(page*30,page*30+29);
  if(search && table==="profiles")query=query.or(`full_name.ilike.%${search}%,email.ilike.%${search}%,whatsapp.ilike.%${search}%`);
  if(search && table==="orders")query=query.ilike("order_number",`%${search}%`);
  const {data,error,count}=await query;
  if(error)throw error;return {rows:data??[],total:count??0,page};
}
Deno.serve(async req=>{
  if(req.method==="OPTIONS")return new Response(null,{status:204,headers:cors});
  if(req.method!=="POST")return reply({error:"Método não permitido"},405);
  const bearer=req.headers.get("authorization")?.match(/^Bearer\s+(.+)$/i)?.[1];
  if(!bearer)return reply({error:"Autenticação necessária"},401);
  const {data:identity,error:identityError}=await db.auth.getUser(bearer);
  if(identityError||!identity.user)return reply({error:"Sessão inválida"},401);
  const actor=identity.user.id;
  if(!identity.user.email_confirmed_at)return reply({error:"Confirme seu e-mail para acessar a administração"},403);
  const {data:roles,error:roleError}=await db.from("user_roles").select("role").eq("user_id",actor).in("role",["admin","admin_master"]);
  if(roleError)return reply({error:"Falha na verificação de acesso"},500);
  const isMaster=Boolean(roles?.some(r=>r.role==="admin_master"));
  const canAdmin=Boolean(roles?.some(r=>r.role==="admin"||r.role==="admin_master"));
  if(!canAdmin)return reply({error:"Acesso reservado aos administradores"},403);
  let input:Params;
  try{input=await req.json()}catch{return reply({error:"Requisição inválida"},400)}
  const action=input.action??"";
  const allowed=["overview","users","orders","benefits","categories","acquisition","audit","setting","save-benefit","save-price","manual-access","staff-list","staff-invite","staff-role"];
  if(!allowed.includes(action))return reply({error:"Ação não permitida"},400);
  const page=Math.max(0,Math.min(10000,Number.isInteger(input.page)?input.page!:0));
  const search=typeof input.search==="string"?input.search.trim().slice(0,90).replace(/[,()]/g,""):"";
  const period=[7,30,90,365].includes(input.period??30)?input.period!:30;
  const since=new Date(Date.now()-period*86400000).toISOString();
  try{
    if(action==="staff-list"){
      if(!isMaster)return reply({error:"Somente AdminMaster"},403);
      const {data:members,error:membersError}=await db.from("user_roles").select("user_id,role,created_at").in("role",["admin","admin_master"]).order("created_at");
      if(membersError)throw membersError;
      const uniqueIds=[...new Set((members??[]).map(m=>m.user_id))].slice(0,250);
      const {data:profiles,error:profileError}=uniqueIds.length?await db.from("profiles").select("id,full_name,email,created_at").in("id",uniqueIds):{data:[],error:null};
      if(profileError)throw profileError;
      const result=await Promise.all(uniqueIds.map(async id=>{
        const {data,error}=await db.auth.admin.getUserById(id);
        if(error)throw error;
        return {id,email:data.user.email??"",confirmed:Boolean(data.user.email_confirmed_at),name:profiles?.find(p=>p.id===id)?.full_name??"",
          role:members?.some(m=>m.user_id===id&&m.role==="admin_master")?"admin_master":"admin"};
      }));
      return reply({data:result});
    }
    if(action==="staff-role"){
      if(!isMaster)return reply({error:"Somente AdminMaster"},403);
      if(!input.targetUserId||!uuid.test(input.targetUserId)||!["admin","admin_master","none"].includes(input.staffRole??""))
        return reply({error:"Conta ou cargo inválido"},400);
      if(input.targetUserId===actor)return reply({error:"Você não pode alterar seu próprio cargo"},400);
      const reason=typeof input.reason==="string"?input.reason.trim():"";
      if(reason.length<8||reason.length>500)return reply({error:"Justificativa de 8 a 500 caracteres é obrigatória"},400);
      const {data:changed,error:changeError}=await db.rpc("admin_set_staff_role",
        {p_actor:actor,p_target:input.targetUserId,p_role:input.staffRole,p_reason:reason});
      if(changeError)throw changeError;
      return reply({success:changed});
    }
    if(action==="staff-invite"){
      if(!isMaster)return reply({error:"Somente AdminMaster"},403);
      const email=typeof input.email==="string"?input.email.trim().toLowerCase():"";
      if(!/^[^\\s@]+@[^\\s@]+\\.[^\\s@]+$/.test(email)||email.length>250||
        !["admin","admin_master"].includes(input.staffRole??""))return reply({error:"E-mail ou cargo inválido"},400);
      const appUrl=Deno.env.get("APP_URL");
      if(!appUrl)return reply({error:"Configure APP_URL nos secrets do Supabase antes de convidar"},503);
      let redirect:URL;
      try{redirect=new URL(appUrl)}catch{return reply({error:"APP_URL inválida"},503)}
      if(redirect.protocol!=="https:"||redirect.username||redirect.password)return reply({error:"APP_URL deve ser HTTPS"},503);
      const {count,error:limitError}=await db.from("audit_logs").select("id",{count:"exact",head:true})
        .eq("actor_user_id",actor).eq("action","admin_staff_invited")
        .gte("created_at",new Date(Date.now()-86400000).toISOString());
      if(limitError)throw limitError;
      if((count??0)>=20)return reply({error:"Limite diário de 20 convites atingido"},429);
      const {data:invited,error:inviteError}=await db.auth.admin.inviteUserByEmail(email,{
        redirectTo:redirect.origin+"/ativar-conta"
      });
      if(inviteError||!invited.user)return reply({error:"Não foi possível enviar o convite. Se a pessoa já tem conta, utilize a lista de usuários para promover o cadastro existente."},409);
      const uid=invited.user.id;
      const {data:assigned,error:assignError}=await db.rpc("admin_set_staff_role",{
        p_actor:actor,p_target:uid,p_role:input.staffRole,
        p_reason:"Conta administrativa convidada pelo painel"});
      if(assignError||!assigned){
        console.error("invitation role assignment failed",uid,assignError?.message);
        return reply({error:"O convite foi criado, mas a atribuição de cargo falhou. Não envie outro convite sem verificar a equipe."},500);
      }
      const {error:auditError}=await db.from("audit_logs").insert({
        actor_user_id:actor,action:"admin_staff_invited",entity_type:"user",entity_id:uid,
        changes:{email,role:input.staffRole}
      });
      if(auditError)console.error("invite audit failed",uid,auditError.message);
      return reply({success:true,email,role:input.staffRole});
    }
    if(action==="overview"){
      const {data,error}=await db.rpc("admin_dashboard_stats",{p_since:since});
      if(error)throw error;
      return reply({data,role:isMaster?"admin_master":"admin"});
    }
    if(action==="acquisition"){
      const {data,error}=await db.rpc("admin_acquisition_report",{p_since:since});
      if(error)throw error;return reply({data});
    }
    if(action==="users"){
      // Only 30 users per request. Verify access and recent paid orders through service-only lookups.
      const people=await paged("profiles","id,full_name,email,whatsapp,created_at",page,search);
      const ids=(people.rows as {id:string}[]).map(x=>x.id);
      if(!ids.length)return reply({...people,grants:[],orders:[],verified:[]});
      const [grants,orders,verified]=await Promise.all([
        db.from("access_grants").select("user_id,access_scope,starts_at,expires_at,revoked_at,order_id").in("user_id",ids),
        db.from("orders").select("user_id,status,amount_cents,created_at").in("user_id",ids).order("created_at",{ascending:false}).limit(300),
        db.from("phone_verifications").select("user_id,verified_at").in("user_id",ids)
      ]);
      if(grants.error||orders.error||verified.error)throw new Error("Falha ao consultar o status dos usuários");
      return reply({...people,grants:grants.data,orders:orders.data,verified:verified.data});
    }
    if(action==="orders"){
      let query=db.from("orders").select("id,order_number,user_id,amount_cents,status,external_checkout_id,created_at,updated_at",{count:"exact"}).order("created_at",{ascending:false}).range(page*30,page*30+29);
      if(input.status&&["pending","checkout_created","paid","cancelled","expired","refunded","chargeback"].includes(input.status))query=query.eq("status",input.status);
      if(search)query=query.ilike("order_number",`%${search}%`);
      const {data,error,count}=await query;if(error)throw error;
      const ids=[...new Set((data??[]).map(row=>row.user_id))];
      const profiles=ids.length?await db.from("profiles").select("id,full_name,email,whatsapp").in("id",ids):{data:[],error:null};
      if(profiles.error)throw profiles.error;
      return reply({rows:data??[],profiles:profiles.data??[],total:count??0,page});
    }
    if(action==="categories"){
      const {data,error}=await db.from("categories").select("id,slug,name,description,is_active,sort_order").order("sort_order");
      if(error)throw error;return reply({data});
    }
    if(action==="benefits"){
      const {data,error}=await db.from("benefits").select("id,slug,name,short_description,category_id,is_published,sort_order,benefit_contents(what_is,who_qualifies,value_info,how_to_apply,documents,important,is_restricted)").order("sort_order");
      if(error)throw error;return reply({data});
    }
    if(action==="audit"){
      return reply(await paged("audit_logs","id,actor_user_id,action,entity_type,entity_id,changes,created_at",page,""));
    }
    if(action==="setting"){
      const {data,error}=await db.from("platform_settings").select("value").eq("key","catalog_price_cents").maybeSingle();
      if(error)throw error;return reply({data:{priceCents:data?.value??null}});
    }
    if(action==="save-benefit"){
      if(!input.id||!uuid.test(input.id)||!input.payload)return reply({error:"Benefício inválido"},400);
      const {data,error}=await db.rpc("admin_save_benefit",{p_actor:actor,p_benefit:input.id,p_payload:input.payload});
      if(error)throw error;return reply({success:data});
    }
    if(action==="save-price"){
      if(!Number.isInteger(input.cents)||input.cents!<100||input.cents!>100000)return reply({error:"Preço inválido"},400);
      const {data,error}=await db.rpc("admin_update_price",{p_actor:actor,p_cents:input.cents});
      if(error)throw error;return reply({success:data});
    }
    if(action==="manual-access"){
      if(!input.userId||!uuid.test(input.userId)||!["grant","revoke"].includes(input.decision??"")||!input.reason)return reply({error:"Solicitação incompleta"},400);
      const expiry=input.expiry&&typeof input.expiry==="string"?new Date(input.expiry).toISOString():null;
      const {data,error}=await db.rpc("admin_manual_access",{p_actor:actor,p_user:input.userId,p_action:input.decision,p_reason:input.reason,p_expiry:expiry});
      if(error)throw error;return reply({success:data,changed:data});
    }
    return reply({error:"Ação inválida"},400);
  }catch(e){console.error("admin operation failed",action,e instanceof Error?e.message:"error");return reply({error:"Não foi possível concluir a operação. Verifique os campos ou tente novamente."},500)}
});
