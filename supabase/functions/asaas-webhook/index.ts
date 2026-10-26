// Asaas webhook: verify shared secret; reconcile in one PostgreSQL transaction.
// Deploy with verify_jwt=false because Asaas does not send a Supabase JWT.
import { createClient } from "npm:@supabase/supabase-js@2.57.0";
const db = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!, { auth: { persistSession: false, autoRefreshToken: false } });
function respond(status: number, message: string) {
  return new Response(JSON.stringify({ message }), { status, headers: { "content-type": "application/json" } });
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
  const recognized = ["CHECKOUT_PAID","CHECKOUT_CANCELED","CHECKOUT_EXPIRED","PAYMENT_REFUNDED","PAYMENT_CHARGEBACK_REQUESTED","PAYMENT_CHARGEBACK_DISPUTE"];
  if (!recognized.includes(name)) return respond(200, "Ignored");
  const checkout = event.checkout as Record<string, unknown> | undefined;
  const payment = event.payment as Record<string, unknown> | undefined;
  if (name.startsWith("CHECKOUT_") && (typeof checkout?.id !== "string" || checkout.id.length > 200)) return respond(400, "Missing checkout");
  if (name === "CHECKOUT_PAID" && checkout?.status !== "PAID") return respond(400, "Checkout not paid");
  // Ignore unlinked refund events; no access should be revoked without exact order correlation.
  const externalReference = typeof payment?.externalReference === "string" ? payment.externalReference : "";
  if (name.startsWith("PAYMENT_") && !externalReference) return respond(200, "Unmatched payment event");
  const { error } = await db.rpc("process_asaas_webhook", {
    p_event_id: eventId,
    p_event_type: name,
    p_checkout_id: typeof checkout?.id === "string" ? checkout.id : "",
    p_order_reference: externalReference,
    p_payload: event,
  });
  if (error) { console.error("Asaas reconciliation failed", error.message); return respond(500, "Retry event later"); }
  return respond(200, "OK");
});
