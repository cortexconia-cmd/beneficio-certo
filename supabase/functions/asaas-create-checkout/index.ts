// Supabase Edge Function. Secrets: ASAAS_API_KEY, ASAAS_ENV (sandbox|production), APP_URL.
import { createClient } from "npm:@supabase/supabase-js@2.57.0";
const url = Deno.env.get("SUPABASE_URL")!;
const service = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const appUrl = (Deno.env.get("APP_URL") ?? "").replace(/\/$/, "");
const checkoutHost = "https://asaas.com/checkoutSession/show?id=";
function answer(body: unknown, code: number, origin: string) {
  return new Response(JSON.stringify(body), { status: code, headers: { "content-type": "application/json", "access-control-allow-origin": origin, "access-control-allow-headers": "authorization, apikey, content-type", "access-control-allow-methods": "POST, OPTIONS" } });
}
Deno.serve(async req => {
  const origin = req.headers.get("origin") || "";
  const allowed = appUrl && origin === new URL(appUrl).origin ? origin : "";
  if (req.method === "OPTIONS") return new Response(null, { status: allowed ? 204 : 403, headers: allowed ? { "access-control-allow-origin": allowed, "access-control-allow-headers": "authorization, apikey, content-type", "access-control-allow-methods": "POST, OPTIONS" } : {} });
  if (req.method !== "POST" || !allowed) return answer({ error: "Origem ou método inválido" }, 403, allowed);
  const apiKey = Deno.env.get("ASAAS_API_KEY");
  if (!apiKey || !appUrl) return answer({ error: "Checkout ainda não configurado" }, 503, allowed);
  const token = req.headers.get("authorization")?.replace(/^Bearer\s+/i, "");
  if (!token) return answer({ error: "Faça login para continuar" }, 401, allowed);
  const db = createClient(url, service, { auth: { autoRefreshToken: false, persistSession: false } });
  const { data: identity, error: authError } = await db.auth.getUser(token);
  const user = identity.user;
  if (authError || !user || !user.email) return answer({ error: "Sessão inválida" }, 401, allowed);
  if (!user.phone_confirmed_at || !user.phone) return answer({ error: "Confirme seu celular por SMS antes de comprar." }, 403, allowed);
  const { data: grants } = await db.from("access_grants").select("id,starts_at,expires_at,revoked_at").eq("user_id", user.id).eq("access_scope", "catalog");
  if (grants?.some(g => !g.revoked_at && Date.parse(g.starts_at) <= Date.now() && (!g.expires_at || Date.parse(g.expires_at) > Date.now()))) return answer({ error: "Seu acesso já está liberado" }, 409, allowed);
  // Reuse a still-pending checkout if one exists.
  const { data: existing } = await db.from("orders").select("external_checkout_id, created_at").eq("user_id", user.id).eq("status", "checkout_created").order("created_at", { ascending: false }).limit(1).maybeSingle();
  if (existing?.external_checkout_id && Date.now() - Date.parse(existing.created_at) < 55 * 60 * 1000) return answer({ url: checkoutHost + encodeURIComponent(existing.external_checkout_id) }, 200, allowed);
  const { data: setting } = await db.from("platform_settings").select("value").eq("key", "catalog_price_cents").maybeSingle();
  const amount = setting?.value;
  if (!Number.isSafeInteger(amount) || amount < 100 || amount > 10000000) return answer({ error: "Preço não configurado" }, 503, allowed);
  const { data: order, error: orderError } = await db.from("orders").insert({ user_id: user.id, order_number: crypto.randomUUID(), description: "Acesso ao conteúdo informativo do Benefício Certo", amount_cents: amount, status: "pending" }).select("id").single();
  if (orderError || !order) return answer({ error: "Não foi possível criar o pedido" }, 500, allowed);
  const apiBase = Deno.env.get("ASAAS_ENV") === "production" ? "https://api.asaas.com" : "https://api-sandbox.asaas.com";
  try {
    const res = await fetch(apiBase + "/v3/checkouts", {
      method: "POST", headers: { "accept": "application/json", "content-type": "application/json", "access_token": apiKey, "user-agent": "BeneficioCerto/1.0" },
      body: JSON.stringify({
        billingTypes: ["PIX", "CREDIT_CARD"], chargeTypes: ["DETACHED"], minutesToExpire: 60,
        externalReference: order.id,
        items: [{ name: "Acesso ao guia informativo Benefício Certo", description: "Conteúdos digitais privados, sem vínculo governamental", quantity: 1, value: amount / 100 }],
        callback: { successUrl: appUrl + "/minha-conta?retorno=checkout", cancelUrl: appUrl + "/beneficios?retorno=cancelado", expiredUrl: appUrl + "/beneficios?retorno=expirado" },
      }),
    });
    const payload = await res.json();
    if (!res.ok || typeof payload.id !== "string") throw new Error("Asaas rejeitou a cobrança");
    const saved = await db.from("orders").update({ status: "checkout_created", external_checkout_id: payload.id, updated_at: new Date().toISOString() }).eq("id", order.id);
    if (saved.error) throw saved.error;
    return answer({ url: checkoutHost + encodeURIComponent(payload.id) }, 200, allowed);
  } catch (err) {
    await db.from("orders").update({ status: "cancelled", updated_at: new Date().toISOString() }).eq("id", order.id);
    console.error("Checkout failure", err);
    return answer({ error: "Não foi possível iniciar o pagamento. Tente novamente." }, 502, allowed);
  }
});
