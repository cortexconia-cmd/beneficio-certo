// Supabase Edge Function. Prefers authenticated n8n checkout when configured.
// Secrets: N8N_ASAAS_CHECKOUT_URL, N8N_ASAAS_CHECKOUT_TOKEN, APP_URL.
// Legacy direct Asaas checkout is supported only if n8n is not configured.
import { createClient } from "npm:@supabase/supabase-js@2.57.0";
const url = Deno.env.get("SUPABASE_URL")!;
const service = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const appUrl = (Deno.env.get("APP_URL") ?? "https://beneficio-compass-guide.lovable.app").replace(/\/$/, "");
const origins = new Set([new URL(appUrl).origin,"https://beneficio-compass-guide.lovable.app"]);
const checkoutHost = "https://asaas.com/checkoutSession/show?id=";
function answer(body: unknown, code: number, origin: string) {
  return new Response(JSON.stringify(body), { status: code, headers: { "content-type": "application/json", "access-control-allow-origin": origin, "access-control-allow-headers": "authorization, apikey, x-client-info, content-type", "access-control-allow-methods": "POST, OPTIONS" } });
}
Deno.serve(async req => {
  const origin = req.headers.get("origin") || "";
  const allowed = origins.has(origin) ? origin : "";
  if (req.method === "OPTIONS") return new Response(null, { status: allowed ? 204 : 403, headers: allowed ? { "access-control-allow-origin": allowed, "access-control-allow-headers": "authorization, apikey, x-client-info, content-type", "access-control-allow-methods": "POST, OPTIONS" } : {} });
  if (req.method !== "POST" || !allowed) return answer({ error: "Origem ou método inválido" }, 403, allowed);
  const n8nUrl = Deno.env.get("N8N_ASAAS_CHECKOUT_URL")?.trim();
  const n8nToken = Deno.env.get("N8N_ASAAS_CHECKOUT_TOKEN")?.trim();
  if (Boolean(n8nUrl) !== Boolean(n8nToken)) return answer({ error: "Configuração de pagamento incompleta: URL e token do n8n devem estar cadastrados juntos." }, 503, allowed);
  const viaN8n = Boolean(n8nUrl && n8nToken);
  const apiKey = Deno.env.get("ASAAS_API_KEY");
  if (!viaN8n && !apiKey) return answer({ error: "Pagamento não configurado. Cadastre o webhook e o token do n8n." }, 503, allowed);
  if (viaN8n) {
    let endpoint: URL;
    try { endpoint = new URL(n8nUrl!); } catch { return answer({ error: "URL do webhook n8n inválida." }, 503, allowed); }
    if (endpoint.protocol !== "https:" || !endpoint.hostname.includes(".") || endpoint.username || endpoint.password || endpoint.search || endpoint.hash)
      return answer({ error: "O webhook n8n precisa ser uma URL HTTPS de produção válida." }, 503, allowed);
  }
  const token = req.headers.get("authorization")?.replace(/^Bearer\s+/i, "");
  if (!token) return answer({ error: "Faça login para continuar" }, 401, allowed);
  const db = createClient(url, service, { auth: { autoRefreshToken: false, persistSession: false } });
  const { data: identity, error: authError } = await db.auth.getUser(token);
  const user = identity.user;
  if (authError || !user || !user.email) return answer({ error: "Sessão inválida" }, 401, allowed);
  const { data: profile, error: profileError } = await db.from("profiles").select("whatsapp").eq("id", user.id).maybeSingle();
  const { data: verification, error: verificationError } = await db.from("phone_verifications").select("phone,verified_at").eq("user_id", user.id).maybeSingle();
  if (profileError || verificationError || !profile?.whatsapp || !verification?.verified_at || verification.phone !== profile.whatsapp)
    return answer({ error: "Confirme seu WhatsApp com o código enviado pelo SolvChat antes de comprar." }, 403, allowed);
  const { data: grants } = await db.from("access_grants").select("id,starts_at,expires_at,revoked_at").eq("user_id", user.id).eq("access_scope", "catalog");
  const {data:roles,error:rolesError}=await db.from("user_roles").select("role").eq("user_id",user.id).in("role",["admin","admin_master"]);
  if (rolesError) return answer({error:"Não foi possível conferir seu acesso"},500,allowed);
  if (roles?.length) return answer({error:"Sua conta administrativa já possui acesso Premium"},409,allowed);
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
    const res = viaN8n
      ? await fetch(n8nUrl!, {
          method: "POST",
          headers: { "Content-Type": "application/json", "x-bc-secret": n8nToken! },
          body: JSON.stringify({
            pedido_id: order.id,
            usuario_id: user.id,
            valor: amount / 100,
            produto: "Acesso ao guia informativo Benefício Certo",
            success_url: appUrl + "/minha-conta?retorno=checkout",
            cancel_url: appUrl + "/beneficios?retorno=cancelado",
            expired_url: appUrl + "/beneficios?retorno=expirado",
          }),
          signal: AbortSignal.timeout(15000),
        })
      : await fetch(apiBase + "/v3/checkouts", {
          method: "POST",
          headers: { "accept": "application/json", "content-type": "application/json", "access_token": apiKey!, "user-agent": "BeneficioCerto/1.0" },
          body: JSON.stringify({
            billingTypes: ["PIX", "CREDIT_CARD"], chargeTypes: ["DETACHED"], minutesToExpire: 60,
            externalReference: order.id,
            items: [{ name: "Acesso ao guia informativo Benefício Certo", description: "Conteúdos digitais privados, sem vínculo governamental", quantity: 1, value: amount / 100 }],
            callback: { successUrl: appUrl + "/minha-conta?retorno=checkout", cancelUrl: appUrl + "/beneficios?retorno=cancelado", expiredUrl: appUrl + "/beneficios?retorno=expirado" },
          }),
          signal: AbortSignal.timeout(15000),
        });
    // The upstream webhook can respond with HTML, empty body, or non-JSON on auth/route failures.
    // Log only status and MIME, never tokens, response body, or request metadata.
    const contentType = res.headers.get("content-type") ?? "missing";
    if (!res.ok) {
      console.error("Checkout upstream HTTP failure", {provider: viaN8n ? "n8n" : "asaas",status: res.status, contentType: contentType.slice(0,90)});
      if (viaN8n && (res.status === 401 || res.status === 403)) throw new Error("Autenticação do Webhook n8n rejeitada.");
      if (viaN8n && res.status === 404) throw new Error("Webhook n8n não encontrado. Confira a Production URL e se está ativo.");
      throw new Error("Serviço de checkout retornou HTTP " + res.status);
    }
    let payload: { id?: unknown; url?: unknown; error?: unknown };
    try { payload = await res.json(); } catch {
      console.error("Checkout response is not JSON", {provider: viaN8n ? "n8n" : "asaas",status: res.status,contentType: contentType.slice(0,90)});
      throw new Error("Webhook não devolveu JSON. Confira Respond to Webhook e a URL de produção.");
    }
    if (typeof payload.id !== "string" || !/^[a-zA-Z0-9_-]{8,200}$/.test(payload.id))
      throw new Error("O serviço não retornou um ID de checkout válido");
    // n8n returns both id and url; only accept URL for the exact same checkout ID.
    const checkoutUrl = checkoutHost + encodeURIComponent(payload.id);
    const saved = await db.from("orders").update({ status: "checkout_created", external_checkout_id: payload.id, updated_at: new Date().toISOString() }).eq("id", order.id);
    if (saved.error) throw saved.error;
    return answer({ url: checkoutUrl }, 200, allowed);
  } catch (err) {
    await db.from("orders").update({ status: "cancelled", updated_at: new Date().toISOString() }).eq("id", order.id);
    console.error("Checkout failure", err);
    const safe = err instanceof Error && /^(Autenticação do Webhook|Webhook n8n não encontrado|Webhook não devolveu JSON|Serviço de checkout retornou HTTP)/.test(err.message) ? err.message : "Não foi possível iniciar o pagamento. Tente novamente.";
    return answer({ error: safe }, 502, allowed);
  }
});
