// Reconciles the signed-in user's unpaid orders directly with Asaas, so a lost or late webhook never leaves a paid user without access.
// Secrets: ASAAS_API_KEY, ASAAS_ENV (production | sandbox, default sandbox).
// Grants go through the same process_asaas_webhook RPC as the real webhook, so they are idempotent.
import { createClient } from "npm:@supabase/supabase-js@2.57.0";
const db = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!, {
  auth: { persistSession: false, autoRefreshToken: false },
});
const cors = {
  "access-control-allow-origin": "*",
  "access-control-allow-methods": "POST, OPTIONS",
  "access-control-allow-headers": "authorization, apikey, x-client-info, content-type",
  "cache-control": "no-store",
};
const json = (body: unknown, status = 200) => Response.json(body, { status, headers: cors });
const PAID_STATUSES = new Set(["RECEIVED", "CONFIRMED", "RECEIVED_IN_CASH"]);
const apiBase = Deno.env.get("ASAAS_ENV") === "production" ? "https://api.asaas.com" : "https://api-sandbox.asaas.com";

async function asaasGet(path: string, apiKey: string): Promise<Record<string, unknown> | null> {
  try {
    const res = await fetch(apiBase + path, {
      headers: { accept: "application/json", access_token: apiKey, "user-agent": "BeneficioCerto/1.0" },
      signal: AbortSignal.timeout(8000),
    });
    if (!res.ok) { console.error("Asaas lookup HTTP status", res.status); return null; }
    return await res.json();
  } catch { console.error("Asaas lookup unavailable"); return null; }
}

// Asaas is the source of truth: the checkout itself reports PAID, or a payment tied to this exact order/checkout is received.
async function isPaid(order: { id: string; external_checkout_id: string }, apiKey: string) {
  const checkout = await asaasGet("/v3/checkouts/" + encodeURIComponent(order.external_checkout_id), apiKey);
  if (checkout?.status === "PAID") return true;
  const list = await asaasGet("/v3/payments?limit=20&externalReference=" + encodeURIComponent(order.id), apiKey);
  const payments = Array.isArray(list?.data) ? list.data as Record<string, unknown>[] : [];
  // Re-check each row: an ignored filter must never turn someone else's payment into this user's access.
  return payments.some(p => PAID_STATUSES.has(String(p.status)) &&
    (p.externalReference === order.id || p.checkoutSession === order.external_checkout_id));
}

Deno.serve(async req => {
  if (req.method === "OPTIONS") return new Response(null, { status: 204, headers: cors });
  if (req.method !== "POST") return json({ error: "Método não permitido" }, 405);
  const bearer = req.headers.get("authorization")?.replace(/^Bearer\s+/i, "");
  if (!bearer) return json({ error: "Entre para consultar seu acesso." }, 401);
  const { data: identity, error: identityError } = await db.auth.getUser(bearer);
  if (identityError || !identity.user) return json({ error: "Sessão inválida." }, 401);
  const apiKey = Deno.env.get("ASAAS_API_KEY");
  if (!apiKey) return json({ checked: 0, activated: 0, reason: "not_configured" });

  const since = new Date(Date.now() - 14 * 24 * 3600 * 1000).toISOString();
  const { data: orders, error } = await db.from("orders").select("id,external_checkout_id")
    .eq("user_id", identity.user.id).in("status", ["checkout_created", "expired", "cancelled"])
    .not("external_checkout_id", "is", null).gte("created_at", since)
    .order("created_at", { ascending: false }).limit(5);
  if (error) return json({ error: "Não foi possível consultar seus pedidos." }, 500);

  let activated = 0;
  for (const order of orders ?? []) {
    const checkoutId = order.external_checkout_id as string;
    if (!(await isPaid({ id: order.id, external_checkout_id: checkoutId }, apiKey))) continue;
    const { data: processed, error: rpcError } = await db.rpc("process_asaas_webhook", {
      p_event_id: "sync:" + checkoutId,
      p_event_type: "CHECKOUT_PAID",
      p_checkout_id: checkoutId,
      p_order_reference: order.id,
      p_payload: { source: "asaas-sync-access", checkout: { id: checkoutId, status: "PAID" } },
    });
    if (rpcError) { console.error("Sync reconciliation failed", rpcError.message); continue; }
    if (processed === true) activated++;
  }
  return json({ checked: orders?.length ?? 0, activated });
});
