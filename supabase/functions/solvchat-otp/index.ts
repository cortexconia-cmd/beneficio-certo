// OTP generated and validated server-side; delivery delegated to authenticated n8n webhook.
// Verification is stored per login session (session_verifications): required at every sign-in and before every purchase.
// Secrets: SOLVCHAT_OTP_PEPPER, N8N_SOLV_WEBHOOK_URL, N8N_SOLV_WEBHOOK_TOKEN.
// Legacy SolvChat API remains fallback until the n8n URL and token are configured.
import { createClient } from "npm:@supabase/supabase-js@2.57.0";
const client = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!, {
  auth: { persistSession: false, autoRefreshToken: false },
});
const cors = {
  "access-control-allow-origin": "*",
  "access-control-allow-methods": "POST, OPTIONS",
  "access-control-allow-headers": "authorization, apikey, x-client-info, content-type",
  "cache-control": "no-store",
};
const json = (body: unknown, status = 200) => Response.json(body, { status, headers: cors });
const encoder = new TextEncoder();
async function digest(text: string) {
  const hash = await crypto.subtle.digest("SHA-256", encoder.encode(text));
  return Array.from(new Uint8Array(hash), n => n.toString(16).padStart(2, "0")).join("");
}
const mobile = (value: string) => /^55(?:[1-9][0-9])[0-9]{8,9}$/.test(value);
function validCode(value: unknown): value is string { return typeof value === "string" && /^\d{6}$/.test(value); }
// The token was already validated by auth.getUser; only the session id claim is read from it here.
function sessionIdOf(jwt: string) {
  try {
    const payload = JSON.parse(atob(jwt.split(".")[1].replace(/-/g, "+").replace(/_/g, "/")));
    return typeof payload.session_id === "string" ? payload.session_id : "";
  } catch { return ""; }
}
const PURCHASE_WINDOW_MS = 15 * 60 * 1000;

Deno.serve(async req => {
  if (req.method === "OPTIONS") return new Response(null, { status: 204, headers: cors });
  if (req.method !== "POST") return json({ error: "Método não permitido" }, 405);
  const bearer = req.headers.get("authorization")?.replace(/^Bearer\s+/i, "");
  if (!bearer) return json({ error: "Entre para confirmar o celular." }, 401);
  const { data: identity, error: identityError } = await client.auth.getUser(bearer);
  if (identityError || !identity.user) return json({ error: "Sessão inválida." }, 401);
  let payload: { action?: string; code?: string; purpose?: string };
  try { payload = await req.json(); } catch { return json({ error: "Solicitação inválida." }, 400); }
  if (!["send", "verify", "status"].includes(payload.action ?? "")) return json({ error: "Ação inválida." }, 400);
  const userId = identity.user.id;
  const { data: profile, error: profileError } = await client.from("profiles").select("whatsapp").eq("id", userId).maybeSingle();
  if (profileError || !profile || !mobile(profile.whatsapp ?? "")) return json({ error: "Informe um WhatsApp com DDD válido em sua conta." }, 422);
  const phone = profile.whatsapp as string;
  // Verification belongs to this login session: every new sign-in needs a fresh code, and so does every purchase.
  const sessionId = sessionIdOf(bearer);
  if (!sessionId) return json({ error: "Sessão inválida." }, 401);
  const { data: session, error: stateError } = await client.from("session_verifications")
    .select("verified_at,purchase_verified_at").eq("user_id", userId).eq("session_id", sessionId).maybeSingle();
  if (stateError) return json({ error: "Não foi possível consultar o cadastro." }, 500);
  if (payload.action === "status") return json({
    verified: Boolean(session?.verified_at),
    purchaseVerified: Boolean(session?.purchase_verified_at && Date.now() - Date.parse(session.purchase_verified_at) < PURCHASE_WINDOW_MS),
  });
  const pepper = Deno.env.get("SOLVCHAT_OTP_PEPPER");
  if (!pepper || pepper.length < 32) return json({ error: "Verificação por WhatsApp não configurada." }, 503);

  if (payload.action === "send") {
    const n8nUrl = Deno.env.get("N8N_SOLV_WEBHOOK_URL")?.trim();
    const n8nToken = Deno.env.get("N8N_SOLV_WEBHOOK_TOKEN")?.trim();
    const legacyToken = Deno.env.get("SOLVCHAT_TOKEN");
    const legacyUrl = Deno.env.get("SOLVCHAT_SEND_URL");
    if (Boolean(n8nUrl) !== Boolean(n8nToken))
      return json({ error: "Integração n8n incompleta: configure URL e token juntos." }, 503);
    const viaN8n = Boolean(n8nUrl && n8nToken);
    const targetUrl = viaN8n ? n8nUrl! : legacyUrl;
    if (!targetUrl || (!viaN8n && !legacyToken))
      return json({ error: "Transporte de mensagens não configurado." }, 503);
    let endpointUrl: URL;
    try { endpointUrl = new URL(targetUrl); }
    catch { return json({ error: "URL de envio inválida." }, 503); }
    if (endpointUrl.protocol !== "https:" || !endpointUrl.hostname.includes(".") ||
        endpointUrl.username || endpointUrl.password || endpointUrl.search || endpointUrl.hash)
      return json({ error: "Endpoint HTTPS de envio inválido." }, 503);
    const code = String(crypto.getRandomValues(new Uint32Array(1))[0] % 1000000).padStart(6, "0");
    const hash = await digest(pepper + ":" + userId + ":" + phone + ":" + code);
    // Limits: 60s between sends; after 5 requests wait 1 hour; 3 more are allowed, then blocked until the next day (Brasília).
    const { data: reserved, error: limitError } = await client.rpc("solvchat_reserve_code_v2",
      { p_user_id: userId, p_phone: phone, p_hash: hash });
    if (limitError) return json({ error: "Não foi possível solicitar código." }, 500);
    if (!reserved?.ok) {
      const minutes = Math.max(1, Math.ceil((Date.parse(String(reserved?.retry_at)) - Date.now()) / 60000));
      if (reserved?.reason === "hourly_limit")
        return json({ error: "Você pediu 5 códigos. Por segurança, aguarde " + (minutes >= 60 ? "1 hora" : minutes + " minuto" + (minutes > 1 ? "s" : "")) + " para pedir outro.", retryAt: reserved.retry_at }, 429);
      if (reserved?.reason === "daily_limit")
        return json({ error: "Limite de solicitações de código atingido por hoje. Tente novamente amanhã.", retryAt: reserved.retry_at }, 429);
      if (reserved?.reason === "cooldown")
        return json({ error: "Aguarde 1 minuto antes de pedir outro código.", retryAt: reserved.retry_at }, 429);
      return json({ error: "Não foi possível solicitar código." }, 422);
    }
    // A code that never reached the user must not burn the daily quota or the 60s cooldown.
    const release = async () => {
      const { data: current } = await client.from("phone_verifications").select("sends_in_window").eq("user_id", userId).maybeSingle();
      await client.from("phone_verifications").update({
        sends_in_window: Math.max(0, (current?.sends_in_window ?? 1) - 1),
        sent_at: null, code_hash: null, expires_at: null, updated_at: new Date().toISOString(),
      }).eq("user_id", userId);
    };
    try {
      const message = "Benefício Certo: seu código de confirmação é " + code +
        ". Ele expira em 5 minutos. Não compartilhe esse código.";
      const response = await fetch(endpointUrl.toString(), {
        method: "POST",
        headers: viaN8n
          ? { "Content-Type": "application/json", "x-bc-secret": n8nToken! }
          : { "Content-Type": "application/json", "Authorization": "Bearer " + legacyToken! },
        body: JSON.stringify(viaN8n
          ? { user_id: userId, telefone: phone, mensagem: message, tipo: "verificacao", expira_em_minutos: 5 }
          : { number: phone, body: message }),
        signal: AbortSignal.timeout(10000),
      });
      if (!response.ok) {
        console.error("OTP delivery provider HTTP status", response.status);
        await release();
        return json({ error: "Não foi possível enviar o código pelo WhatsApp. Tente novamente." }, 502);
      }
      if (viaN8n) {
        // n8n must only acknowledge success after the SolvChat node accepted sending.
        let acknowledgement: { sent?: unknown };
        try { acknowledgement = await response.json(); } catch {
          console.error("n8n returned non-JSON receipt");
          await release();
          return json({ error: "O fluxo n8n não confirmou o envio." }, 502);
        }
        if (acknowledgement?.sent !== true) {
          console.error("n8n did not acknowledge successful delivery");
          await release();
          return json({ error: "O fluxo n8n não confirmou o envio." }, 502);
        }
      }
      return json({ sent: true, expiresInSeconds: 300 });
    } catch (err) {
      console.error("SolvChat network error", err instanceof Error ? err.message : "network");
      await release();
      return json({ error: "WhatsApp temporariamente indisponível." }, 502);
    }
  }
  if (!validCode(payload.code)) return json({ error: "Digite o código de 6 dígitos." }, 400);
  // TEMPORARY TEST CODE (see docs/CODIGO_DE_TESTE_TEMPORARIO.md): accepted only while the OTP_TEST_CODE secret exists,
  // and, when OTP_TEST_EMAILS is set, only for those accounts. Delete the secret to switch it off.
  const testCode = Deno.env.get("OTP_TEST_CODE")?.trim() ?? "";
  const testEmails = (Deno.env.get("OTP_TEST_EMAILS") ?? "").split(",").map(e => e.trim().toLowerCase()).filter(Boolean);
  const usedTestCode = /^\d{6}$/.test(testCode) && payload.code === testCode &&
    (testEmails.length === 0 || testEmails.includes((identity.user.email ?? "").toLowerCase()));
  if (usedTestCode) {
    console.warn("OTP test code accepted for user", userId);
  } else {
    const hash = await digest(pepper + ":" + userId + ":" + phone + ":" + payload.code);
    const { data: accepted, error: verifyError } = await client.rpc("solvchat_verify_code",
      { p_user_id: userId, p_phone: phone, p_hash: hash });
    if (verifyError) return json({ error: "Não foi possível validar o código." }, 500);
    if (!accepted) return json({ error: "Código inválido, vencido ou limite de tentativas atingido." }, 400);
  }
  const { error: markError } = await client.from("session_verifications").upsert(
    { user_id: userId, session_id: sessionId, ...(payload.purpose === "purchase" ? { purchase_verified_at: new Date().toISOString() } : { verified_at: new Date().toISOString() }) },
    { onConflict: "user_id,session_id" });
  if (markError) { console.error("Session verification not saved", markError.message); return json({ error: "Não foi possível concluir a verificação." }, 500); }
  // Housekeeping: forget sessions created more than 30 days ago.
  await client.from("session_verifications").delete().eq("user_id", userId).lt("created_at", new Date(Date.now() - 30 * 24 * 3600 * 1000).toISOString());
  return json({ verified: true });
});
