// In-site payment: creates the Asaas customer and charge (PIX or credit card) server-side, so the buyer never leaves the site.
// Card data is forwarded straight to Asaas: never stored, never logged, never sent through n8n.
// Secrets: ASAAS_API_KEY, ASAAS_ENV (production | sandbox, default sandbox), APP_URL.
import { createClient } from "npm:@supabase/supabase-js@2.57.0";
const db = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!, {
  auth: { persistSession: false, autoRefreshToken: false },
});
const appUrl = (Deno.env.get("APP_URL") ?? "https://beneficio-compass-guide.lovable.app").replace(/\/$/, "");
const origins = new Set([new URL(appUrl).origin, "https://beneficio-compass-guide.lovable.app"]);
const apiBase = Deno.env.get("ASAAS_ENV") === "production" ? "https://api.asaas.com" : "https://api-sandbox.asaas.com";
const PAID_STATUSES = new Set(["RECEIVED", "CONFIRMED", "RECEIVED_IN_CASH"]);

function answer(body: unknown, code: number, origin: string) {
  return new Response(JSON.stringify(body), { status: code, headers: { "content-type": "application/json", "cache-control": "no-store", "access-control-allow-origin": origin, "access-control-allow-headers": "authorization, apikey, x-client-info, content-type", "access-control-allow-methods": "POST, OPTIONS" } });
}
type Row = Record<string, unknown>;
async function asaas(method: "GET" | "POST", path: string, apiKey: string, body?: unknown): Promise<{ status: number; data: Row | null }> {
  try {
    const res = await fetch(apiBase + path, {
      method,
      headers: { accept: "application/json", "content-type": "application/json", access_token: apiKey, "user-agent": "BeneficioCerto/1.0" },
      body: body === undefined ? undefined : JSON.stringify(body),
      signal: AbortSignal.timeout(20000),
    });
    let data: Row | null = null;
    try { data = await res.json(); } catch { /* empty or non-JSON body */ }
    return { status: res.status, data };
  } catch { return { status: 0, data: null }; }
}
// Asaas validation messages are written for end users (e.g. "Transação não autorizada").
function asaasReason(data: Row | null): string {
  const errors = Array.isArray(data?.errors) ? data!.errors as Row[] : [];
  const text = errors.map(e => e.description).find((d): d is string => typeof d === "string");
  return text ? text.slice(0, 200) : "";
}
const digits = (value: unknown) => String(value ?? "").replace(/\D/g, "");
function validCpf(value: string) {
  if (!/^\d{11}$/.test(value) || /^(\d)\1{10}$/.test(value)) return false;
  for (const size of [9, 10]) {
    let sum = 0;
    for (let i = 0; i < size; i++) sum += Number(value[i]) * (size + 1 - i);
    if (((sum * 10) % 11) % 10 !== Number(value[size])) return false;
  }
  return true;
}
function validCnpj(value: string) {
  if (!/^\d{14}$/.test(value) || /^(\d)\1{13}$/.test(value)) return false;
  for (const size of [12, 13]) {
    const weights = size === 12 ? [5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2] : [6, 5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2];
    const sum = weights.reduce((total, weight, i) => total + Number(value[i]) * weight, 0);
    const check = sum % 11 < 2 ? 0 : 11 - (sum % 11);
    if (check !== Number(value[size])) return false;
  }
  return true;
}
const todayInBrazil = () => new Intl.DateTimeFormat("en-CA", { timeZone: "America/Sao_Paulo" }).format(new Date());

Deno.serve(async req => {
  const origin = req.headers.get("origin") || "";
  const allowed = origins.has(origin) ? origin : "";
  if (req.method === "OPTIONS") return new Response(null, { status: allowed ? 204 : 403, headers: allowed ? { "access-control-allow-origin": allowed, "access-control-allow-headers": "authorization, apikey, x-client-info, content-type", "access-control-allow-methods": "POST, OPTIONS" } : {} });
  if (req.method !== "POST" || !allowed) return answer({ error: "Origem ou método inválido" }, 403, allowed);
  const apiKey = Deno.env.get("ASAAS_API_KEY");
  if (!apiKey) return answer({ error: "Pagamento não configurado." }, 503, allowed);
  let input: Row;
  try { input = await req.json(); } catch { return answer({ error: "Solicitação inválida." }, 400, allowed); }

  const { data: setting } = await db.from("platform_settings").select("value").eq("key", "catalog_price_cents").maybeSingle();
  const amount = setting?.value;
  if (!Number.isSafeInteger(amount) || amount < 100 || amount > 10000000) return answer({ error: "Preço não configurado" }, 503, allowed);
  if (input.action === "quote") return answer({ priceCents: amount }, 200, allowed);
  if (input.action !== "create") return answer({ error: "Ação inválida." }, 400, allowed);

  const token = req.headers.get("authorization")?.replace(/^Bearer\s+/i, "");
  if (!token) return answer({ error: "Faça login para continuar" }, 401, allowed);
  const { data: identity, error: authError } = await db.auth.getUser(token);
  const user = identity.user;
  if (authError || !user || !user.email) return answer({ error: "Sessão inválida" }, 401, allowed);
  const { data: profile } = await db.from("profiles").select("whatsapp").eq("id", user.id).maybeSingle();
  const { data: verification } = await db.from("phone_verifications").select("phone,verified_at").eq("user_id", user.id).maybeSingle();
  if (!profile?.whatsapp || !verification?.verified_at || verification.phone !== profile.whatsapp)
    return answer({ error: "Confirme seu WhatsApp com o código enviado antes de comprar." }, 403, allowed);
  const { data: roles, error: rolesError } = await db.from("user_roles").select("role").eq("user_id", user.id).in("role", ["admin", "admin_master"]);
  if (rolesError) return answer({ error: "Não foi possível conferir seu acesso" }, 500, allowed);
  if (roles?.length) return answer({ error: "Sua conta administrativa já possui acesso Premium" }, 409, allowed);
  const { data: grants } = await db.from("access_grants").select("starts_at,expires_at,revoked_at").eq("user_id", user.id).eq("access_scope", "catalog");
  if (grants?.some(g => !g.revoked_at && Date.parse(g.starts_at) <= Date.now() && (!g.expires_at || Date.parse(g.expires_at) > Date.now())))
    return answer({ error: "Seu acesso já está liberado" }, 409, allowed);

  const method = input.method;
  if (method !== "PIX" && method !== "CREDIT_CARD") return answer({ error: "Escolha PIX ou cartão." }, 400, allowed);
  const name = String(input.name ?? "").trim().replace(/\s+/g, " ");
  const cpfCnpj = digits(input.cpfCnpj);
  if (name.length < 5 || name.length > 100 || !name.includes(" ")) return answer({ error: "Informe seu nome completo." }, 400, allowed);
  if (!(validCpf(cpfCnpj) || validCnpj(cpfCnpj))) return answer({ error: "CPF ou CNPJ inválido." }, 400, allowed);
  let card: Row | null = null;
  if (method === "CREDIT_CARD") {
    const c = (input.card ?? {}) as Row;
    const expiryYear = digits(c.expiryYear).length === 2 ? "20" + digits(c.expiryYear) : digits(c.expiryYear);
    card = {
      holderName: String(c.holderName ?? "").trim().slice(0, 60),
      number: digits(c.number), expiryMonth: digits(c.expiryMonth).padStart(2, "0"), expiryYear, ccv: digits(c.ccv),
    };
    const postalCode = digits(c.postalCode), addressNumber = String(c.addressNumber ?? "").trim().slice(0, 10);
    const month = Number(card.expiryMonth);
    if (!card.holderName || !/^\d{13,19}$/.test(card.number as string) || month < 1 || month > 12 || !/^\d{4}$/.test(expiryYear) ||
        !/^\d{3,4}$/.test(card.ccv as string) || !/^\d{8}$/.test(postalCode) || !addressNumber)
      return answer({ error: "Confira os dados do cartão e do endereço." }, 400, allowed);
    card.postalCode = postalCode; card.addressNumber = addressNumber;
  }

  const { count: recent } = await db.from("orders").select("id", { count: "exact", head: true })
    .eq("user_id", user.id).gte("created_at", new Date(Date.now() - 3600 * 1000).toISOString());
  if ((recent ?? 0) >= 6) return answer({ error: "Muitas tentativas. Aguarde alguns minutos e tente de novo." }, 429, allowed);

  const label = method === "PIX" ? "PIX" : "Cartão";
  // Reuse a still-valid PIX charge instead of opening a second one that could also get paid.
  if (method === "PIX") {
    const { data: open } = await db.from("orders").select("id,external_checkout_id,created_at")
      .eq("user_id", user.id).eq("status", "checkout_created").like("description", "%(PIX)").like("external_checkout_id", "pay_%")
      .gte("created_at", new Date(Date.now() - 25 * 60 * 1000).toISOString()).order("created_at", { ascending: false }).limit(1).maybeSingle();
    if (open?.external_checkout_id) {
      const qr = await asaas("GET", "/v3/payments/" + encodeURIComponent(open.external_checkout_id) + "/pixQrCode", apiKey);
      if (qr.status === 200 && typeof qr.data?.payload === "string")
        return answer({ method: "PIX", orderId: open.id, qrCode: qr.data.encodedImage, copyPaste: qr.data.payload, expiresAt: qr.data.expirationDate ?? null }, 200, allowed);
    }
  }

  const { data: order, error: orderError } = await db.from("orders").insert({
    user_id: user.id, order_number: crypto.randomUUID(), description: "Acesso ao conteúdo informativo do Benefício Certo (" + label + ")", amount_cents: amount, status: "pending",
  }).select("id").single();
  if (orderError || !order) return answer({ error: "Não foi possível criar o pedido" }, 500, allowed);
  const cancel = () => db.from("orders").update({ status: "cancelled", updated_at: new Date().toISOString() }).eq("id", order.id);

  try {
    let customerId = "";
    const found = await asaas("GET", "/v3/customers?limit=1&cpfCnpj=" + cpfCnpj, apiKey);
    const first = Array.isArray(found.data?.data) ? (found.data!.data as Row[])[0] : undefined;
    if (first && typeof first.id === "string" && digits(first.cpfCnpj) === cpfCnpj) customerId = first.id;
    if (!customerId) {
      const created = await asaas("POST", "/v3/customers", apiKey, {
        name, cpfCnpj, email: user.email, mobilePhone: String(profile.whatsapp).replace(/^55/, ""), externalReference: user.id,
      });
      if (typeof created.data?.id !== "string") {
        console.error("Asaas customer failed", created.status);
        await cancel();
        return answer({ error: asaasReason(created.data) || "Não foi possível validar seus dados. Confira o CPF e tente de novo." }, 400, allowed);
      }
      customerId = created.data.id;
    }

    const charge: Row = {
      customer: customerId, billingType: method, value: amount / 100, dueDate: todayInBrazil(),
      description: "Acesso ao conteúdo informativo do Benefício Certo", externalReference: order.id,
    };
    if (card) {
      charge.creditCard = { holderName: card.holderName, number: card.number, expiryMonth: card.expiryMonth, expiryYear: card.expiryYear, ccv: card.ccv };
      charge.creditCardHolderInfo = { name, email: user.email, cpfCnpj, postalCode: card.postalCode, addressNumber: card.addressNumber, mobilePhone: String(profile.whatsapp).replace(/^55/, "") };
      charge.remoteIp = (req.headers.get("cf-connecting-ip") || req.headers.get("x-forwarded-for") || "").split(",")[0].trim() || "127.0.0.1";
    }
    const payment = await asaas("POST", "/v3/payments", apiKey, charge);
    const paymentId = payment.data?.id;
    if (typeof paymentId !== "string" || !/^[a-zA-Z0-9_-]{8,200}$/.test(paymentId)) {
      console.error("Asaas payment failed", payment.status);
      await cancel();
      const reason = asaasReason(payment.data);
      return answer({ error: reason || "Não foi possível iniciar o pagamento. Tente novamente." }, payment.status >= 400 && payment.status < 500 ? 400 : 502, allowed);
    }
    const saved = await db.from("orders").update({ status: "checkout_created", external_checkout_id: paymentId, updated_at: new Date().toISOString() }).eq("id", order.id);
    if (saved.error) throw saved.error;

    if (method === "PIX") {
      const qr = await asaas("GET", "/v3/payments/" + encodeURIComponent(paymentId) + "/pixQrCode", apiKey);
      if (qr.status !== 200 || typeof qr.data?.payload !== "string") throw new Error("PIX sem QR Code");
      return answer({ method: "PIX", orderId: order.id, qrCode: qr.data.encodedImage, copyPaste: qr.data.payload, expiresAt: qr.data.expirationDate ?? null }, 200, allowed);
    }
    // Card: grant right away when the card was approved; otherwise the webhook or the login sync finishes it.
    if (PAID_STATUSES.has(String(payment.data?.status))) {
      const { error: rpcError } = await db.rpc("process_asaas_webhook", {
        p_event_id: "pay:" + paymentId, p_event_type: "CHECKOUT_PAID", p_checkout_id: paymentId, p_order_reference: order.id,
        p_payload: { source: "asaas-pay", checkout: { id: paymentId, status: "PAID" } },
      });
      if (rpcError) console.error("Card grant failed", rpcError.message);
      return answer({ method: "CREDIT_CARD", orderId: order.id, approved: true }, 200, allowed);
    }
    return answer({ method: "CREDIT_CARD", orderId: order.id, approved: false }, 200, allowed);
  } catch (err) {
    await cancel();
    console.error("In-site payment failure", err instanceof Error ? err.message : "error");
    return answer({ error: "Não foi possível iniciar o pagamento. Tente novamente." }, 502, allowed);
  }
});
