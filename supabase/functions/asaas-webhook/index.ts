// Asaas webhook: verify shared secret; reconcile in one PostgreSQL transaction.
// Deploy with verify_jwt=false because Asaas does not send a Supabase JWT.
import { createClient } from "npm:@supabase/supabase-js@2.57.0";
const db = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!, { auth: { persistSession: false, autoRefreshToken: false } });
function respond(status: number, message: string) {
  return new Response(JSON.stringify({ message }), { status, headers: { "content-type": "application/json" } });
}
async function sha256(raw:string){
 const bytes=await crypto.subtle.digest("SHA-256",new TextEncoder().encode(raw));
 return Array.from(new Uint8Array(bytes)).map(v=>v.toString(16).padStart(2,"0")).join("");
}
async function sendPurchaseCapi(checkoutId:string){
 const token=Deno.env.get("META_CAPI_TOKEN"), pixel=Deno.env.get("META_PIXEL_ID")??"";
 if(!token||!/^\d{10,20}$/.test(pixel))return;
 const {data:order,error:orderError}=await db.from("orders").select("id,user_id,amount_cents,status")
   .eq("external_checkout_id",checkoutId).maybeSingle();
 if(orderError||!order||order.status!=="paid")return;
 const {data:permission}=await db.from("user_privacy_preferences").select("consent_marketing").eq("user_id",order.user_id).maybeSingle();
 if(permission?.consent_marketing!==true)return;
 const [identity,profile]=await Promise.all([
  db.auth.admin.getUserById(order.user_id),
  db.from("profiles").select("whatsapp").eq("id",order.user_id).maybeSingle()
 ]);
 const email=identity.data.user?.email?.trim().toLowerCase()??"";
 const phone=profile.data?.whatsapp?.replace(/\\D/g,"")??"";
 const userdata:Record<string,unknown>={};
 if(email)userdata.em=[await sha256(email)];
 if(phone)userdata.ph=[await sha256(phone)];
 if(!Object.keys(userdata).length)return;
 const payload={data:[{
   event_name:"Purchase",event_time:Math.floor(Date.now()/1000),event_id:checkoutId,
   action_source:"website",event_source_url:"https://beneficio-compass-guide.lovable.app/minha-conta",
   user_data:userdata,custom_data:{currency:"BRL",value:order.amount_cents/100}
 }]};
 try{
  const res=await fetch("https://graph.facebook.com/v23.0/"+pixel+"/events",{
   method:"POST",headers:{"Content-Type":"application/json","Authorization":"Bearer "+token},
   body:JSON.stringify(payload),signal:AbortSignal.timeout(5000)
  });
  if(!res.ok)console.error("Meta CAPI Purchase failed",res.status);
 }catch(e){console.error("Meta CAPI Purchase temporarily unavailable",e instanceof Error?e.name:"error")}
}
function constantTimeEqual(a: string, b: string) {
  const x = new TextEncoder().encode(a), y = new TextEncoder().encode(b);
  let diff = x.length ^ y.length;
  for (let i = 0; i < Math.max(x.length, y.length); i++) diff |= (x[i] ?? 0) ^ (y[i] ?? 0);
  return diff === 0;
}
Deno.serve(async req => {
  if (req.method !== "POST") return respond(405, "Method not allowed");
  const secret = Deno.env.get("ASAAS_WEBHOOK_TOKEN");
  if (!secret || secret.length < 32) return respond(503, "Webhook not configured");
  if (!constantTimeEqual(req.headers.get("asaas-access-token") || "", secret)) return respond(401, "Unauthorized");
  let event: Record<string, unknown>;
  try {
    if (Number(req.headers.get("content-length") || 0) > 65536) return respond(413, "Too large");
    event = await req.json();
  } catch { return respond(400, "Invalid JSON"); }
  const eventId = event.id, name = event.event;
  if (typeof eventId !== "string" || typeof name !== "string" || eventId.length > 220) return respond(400, "Malformed event");
  const recognized = ["CHECKOUT_PAID","CHECKOUT_CANCELED","CHECKOUT_EXPIRED","PAYMENT_RECEIVED","PAYMENT_CONFIRMED","PAYMENT_OVERDUE","PAYMENT_DELETED","PAYMENT_REFUNDED","PAYMENT_CHARGEBACK_REQUESTED","PAYMENT_CHARGEBACK_DISPUTE"];
  if (!recognized.includes(name)) return respond(200, "Ignored");
  const checkout = event.checkout as Record<string, unknown> | undefined;
  const payment = event.payment as Record<string, unknown> | undefined;
  if (name.startsWith("CHECKOUT_") && (typeof checkout?.id !== "string" || checkout.id.length > 200)) return respond(400, "Missing checkout");
  if (name === "CHECKOUT_PAID" && checkout?.status !== "PAID") return respond(400, "Checkout not paid");
  // Ignore unlinked refund events; no access should be revoked without exact order correlation.
  const externalReference = typeof payment?.externalReference === "string" ? payment.externalReference : "";
  if (name.startsWith("PAYMENT_") && !externalReference) return respond(200, "Unmatched payment event");
  // Charges created in-site (asaas-pay) have no Asaas checkout: their orders are keyed by the payment id,
  // so PAYMENT_* lifecycle events are mapped onto the checkout events the reconciliation RPC understands.
  const lifecycle: Record<string, string> = { PAYMENT_RECEIVED: "CHECKOUT_PAID", PAYMENT_CONFIRMED: "CHECKOUT_PAID", PAYMENT_OVERDUE: "CHECKOUT_EXPIRED", PAYMENT_DELETED: "CHECKOUT_CANCELED" };
  let rpcType = name;
  let rpcCheckoutId = typeof checkout?.id === "string" ? checkout.id : "";
  if (lifecycle[name]) {
    const paymentId = typeof payment?.id === "string" ? payment.id : "";
    if (!paymentId || paymentId.length > 200) return respond(400, "Missing payment");
    if (lifecycle[name] === "CHECKOUT_PAID" && !["RECEIVED", "CONFIRMED", "RECEIVED_IN_CASH"].includes(String(payment?.status))) return respond(200, "Ignored");
    rpcType = lifecycle[name];
    rpcCheckoutId = paymentId;
  }
  const { data:processed,error } = await db.rpc("process_asaas_webhook", {
    p_event_id: eventId,
    p_event_type: rpcType,
    p_checkout_id: rpcCheckoutId,
    p_order_reference: externalReference,
    p_payload: event,
  });
  // An event for a checkout we never created can never succeed; a 5xx would only make Asaas retry and pause the webhook queue.
  if (error?.message?.includes("unrecognized order")) { console.error("Asaas event ignored: unrecognized order"); return respond(200, "Ignored"); }
  if (error) { console.error("Asaas reconciliation failed", error.message); return respond(500, "Retry event later"); }
  // Purchase conversion can only originate from the authenticated financial webhook,
  // after the order was marked paid, and only for users with marketing consent.
  if(processed===true&&rpcType==="CHECKOUT_PAID"&&rpcCheckoutId)await sendPurchaseCapi(rpcCheckoutId);
  return respond(200, "OK");
});
