// WhatsApp OTP via SolvChat API. Deploy with verify_jwt=true.
// Secrets (Supabase Edge Functions): SOLVCHAT_TOKEN, SOLVCHAT_OTP_PEPPER.
// Supply SOLVCHAT_SEND_URL (exact verified API endpoint); no endpoint is assumed.
import { createClient } from "npm:@supabase/supabase-js@2.57.0";
const client = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!, {
  auth: { persistSession: false, autoRefreshToken: false },
});
const json = (body: unknown, status = 200) => Response.json(body, { status, headers: { "cache-control": "no-store" } });
const encoder = new TextEncoder();
async function digest(text: string) {
  const hash = await crypto.subtle.digest("SHA-256", encoder.encode(text));
  return Array.from(new Uint8Array(hash), n => n.toString(16).padStart(2, "0")).join("");
}
const mobile = (value: string) => /^55(?:[1-9][0-9])[0-9]{8,9}$/.test(value);
function validCode(value: unknown): value is string { return typeof value === "string" && /^\d{6}$/.test(value); }

Deno.serve(async req => {
  if (req.method !== "POST") return json({ error: "Método não permitido" }, 405);
  const bearer = req.headers.get("authorization")?.replace(/^Bearer\s+/i, "");
  if (!bearer) return json({ error: "Entre para confirmar o celular." }, 401);
  const { data: identity, error: identityError } = await client.auth.getUser(bearer);
  if (identityError || !identity.user) return json({ error: "Sessão inválida." }, 401);
  let payload: { action?: string; code?: string };
  try { payload = await req.json(); } catch { return json({ error: "Solicitação inválida." }, 400); }
  if (!["send", "verify", "status"].includes(payload.action ?? "")) return json({ error: "Ação inválida." }, 400);
  const userId = identity.user.id;
  const { data: profile, error: profileError } = await client.from("profiles").select("whatsapp").eq("id", userId).maybeSingle();
  if (profileError || !profile || !mobile(profile.whatsapp ?? "")) return json({ error: "Informe um WhatsApp com DDD válido em sua conta." }, 422);
  const phone = profile.whatsapp as string;
  const { data: record, error: stateError } = await client.from("phone_verifications")
    .select("phone,verified_at").eq("user_id", userId).maybeSingle();
  if (stateError) return json({ error: "Não foi possível consultar o cadastro." }, 500);
  const verified = Boolean(record?.verified_at && record?.phone === phone);
  if (payload.action === "status") return json({ verified });
  if (verified) return json({ verified: true });
  const pepper = Deno.env.get("SOLVCHAT_OTP_PEPPER");
  if (!pepper || pepper.length < 32) return json({ error: "Verificação por WhatsApp não configurada." }, 503);

  if (payload.action === "send") {
    const token = Deno.env.get("SOLVCHAT_TOKEN");
    const endpoint = Deno.env.get("SOLVCHAT_SEND_URL");
    if (!token || !endpoint) return json({ error: "Endpoint e token do SolvChat ainda não configurados." }, 503);
    let endpointUrl: URL;
    try { endpointUrl = new URL(endpoint); }
    catch { return json({ error: "URL do SolvChat inválida." }, 503); }
    if (endpointUrl.protocol !== "https:" || !endpointUrl.hostname.includes(".")) return json({ error: "O SolvChat precisa de um endpoint HTTPS válido." }, 503);
    const code = String(crypto.getRandomValues(new Uint32Array(1))[0] % 1000000).padStart(6, "0");
    const hash = await digest(pepper + ":" + userId + ":" + phone + ":" + code);
    const { data: reserved, error: limitError } = await client.rpc("solvchat_reserve_code",
      { p_user_id: userId, p_phone: phone, p_hash: hash });
    if (limitError) return json({ error: "Não foi possível solicitar código." }, 500);
    if (!reserved) return json({ error: "Aguarde antes de solicitar outro código. O limite é de 5 envios por dia." }, 429);
    try {
      const response = await fetch(endpointUrl.toString(), {
        method: "POST",
        headers: { "Content-Type": "application/json", "Authorization": "Bearer " + token },
        body: JSON.stringify({
          number: phone,
          body: "Benefício Certo: seu código de confirmação é " + code +
            ". Ele expira em 5 minutos. Não compartilhe esse código.",
        }),
      });
      if (!response.ok) {
        console.error("SolvChat send status", response.status);
        return json({ error: "Não foi possível enviar a mensagem pelo WhatsApp. Tente novamente." }, 502);
      }
      return json({ sent: true, expiresInSeconds: 300 });
    } catch (err) {
      console.error("SolvChat network error", err instanceof Error ? err.message : "network");
      return json({ error: "WhatsApp temporariamente indisponível." }, 502);
    }
  }
  if (!validCode(payload.code)) return json({ error: "Digite o código de 6 dígitos." }, 400);
  const hash = await digest(pepper + ":" + userId + ":" + phone + ":" + payload.code);
  const { data: accepted, error: verifyError } = await client.rpc("solvchat_verify_code",
    { p_user_id: userId, p_phone: phone, p_hash: hash });
  if (verifyError) return json({ error: "Não foi possível validar o código." }, 500);
  if (!accepted) return json({ error: "Código inválido, vencido ou limite de tentativas atingido." }, 400);
  return json({ verified: true });
});
