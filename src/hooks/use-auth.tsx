import { createContext, useContext, useEffect, useRef, useState, type ReactNode } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { Session } from "@supabase/supabase-js";
import type { Database } from "@/integrations/supabase/types";
import type { User } from "@/lib/types";

type Profile = Database["public"]["Tables"]["profiles"]["Row"];
type Grant = Pick<Database["public"]["Tables"]["access_grants"]["Row"], "revoked_at" | "starts_at" | "expires_at">;
export function normalizeWhatsapp(input: string) {
  if (/[^\d\s()+.-]/.test(input)) throw new Error("Informe um WhatsApp brasileiro com DDD válido.");
  let digits = input.replace(/\D/g, "");
  if ((digits.length === 12 || digits.length === 13) && digits.startsWith("55")) digits = digits.slice(2);
  const ddds = [11,12,13,14,15,16,17,18,19,21,22,24,27,28,31,32,33,34,35,37,38,41,42,43,44,45,46,47,48,49,51,53,54,55,61,62,63,64,65,66,67,68,69,71,73,74,75,77,79,81,82,83,84,85,86,87,88,89,91,92,93,94,95,96,97,98,99];
  if (!/^\d{10,11}$/.test(digits) || !ddds.includes(Number(digits.slice(0, 2))) || !/^[2-9]/.test(digits.slice(2)) || (digits.length === 11 && digits[2] !== "9")) throw new Error("Informe um WhatsApp brasileiro com DDD válido.");
  return `55${digits}`;
}
export function validatePassword(password: string) {
  if (password.length < 8) throw new Error("A senha deve ter no mínimo 8 caracteres.");
}
export function isActiveGrant(grant: Grant, now: number) {
  return grant.revoked_at === null && Date.parse(grant.starts_at) <= now && (grant.expires_at === null || Date.parse(grant.expires_at) > now);
}
interface AuthState {
  // Only set once the WhatsApp is verified: until then the person is not considered signed in.
  user: (User & { id: string; whatsapp: string }) | null;
  // Credentials accepted, phone not verified yet. Used only by the verification step.
  pendingUser: { id: string; whatsapp: string } | null;
  session: Session | null;
  profile: Profile | null;
  loading: boolean;
  error: string | null;
  recoveryReady: boolean;
  phoneVerified: boolean;
  sendPhoneCode: (number?: string) => Promise<void>;
  verifyPhoneCode: (number: string, code: string) => Promise<void>;
  login: (email: string, password: string) => Promise<boolean>;
  signup: (name: string, whatsapp: string, email: string, password: string) => Promise<boolean>;
  resetPassword: (email: string) => Promise<void>;
  updatePassword: (password: string) => Promise<void>;
  updateProfile: (name: string, whatsapp: string) => Promise<void>;
  logout: () => Promise<void>;
}
const AuthContext = createContext<AuthState | null>(null);
export function AuthProvider({ children }: { children: ReactNode }) {
  const queryClient = useQueryClient();
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [recoveryReady, setRecoveryReady] = useState(false);
  const [verifiedWhatsApp, setVerifiedWhatsApp] = useState(false);
  const version = useRef(0);
  const profileReady = useRef<Promise<void>>(Promise.resolve());
  const recovery = useRef(false);

  useEffect(() => {
    let alive = true;
    const recoveryLink = new URLSearchParams(window.location.hash.slice(1));
    const requestedRecovery = window.location.pathname === "/redefinir-senha" && recoveryLink.get("type") === "recovery" && !recoveryLink.has("error");
    const apply = (next: Session | null) => {
      const current = ++version.current;
      setSession(next);
      setProfile(null);
      setVerifiedWhatsApp(false);
      setLoading(true);
      // Start profile I/O outside the synchronous Auth callback to avoid auth-lock races.
      profileReady.current = Promise.resolve().then(async () => {
        try {
          if (!next) return;
          const result = await supabase.from("profiles").select("*").eq("id", next.user.id).maybeSingle();
          if (result.error) throw result.error;
          if (alive && version.current === current) {
            setProfile(result.data);
            const status = await supabase.functions.invoke("solvchat-otp", { body: { action: "status" } });
            if (alive && version.current === current) setVerifiedWhatsApp(!status.error && status.data?.verified === true);
            setError(result.data ? null : "Seu perfil não foi encontrado. Não é possível editar seus dados.");
          }
        } catch {
          if (alive && version.current === current) setError("Não foi possível carregar seus dados. Tente novamente.");
        } finally {
          if (alive && version.current === current) setLoading(false);
        }
      });
    };
    const subscription = supabase.auth.onAuthStateChange((event, next) => {
      if (event === "PASSWORD_RECOVERY" && requestedRecovery && next) {
        recovery.current = true;
        setRecoveryReady(true);
      }
      if (event === "SIGNED_OUT") {
        recovery.current = false;
        setRecoveryReady(false);
      }
      if (event === "TOKEN_REFRESHED") { setSession(next); return; }
      apply(next);
    });
    const initialVersion = version.current;
    void supabase.auth.getSession().then(({ data, error: sessionError }) => {
      if (!alive || version.current !== initialVersion) return;
      if (sessionError) setError("Não foi possível verificar sua sessão.");
      apply(data.session);
    }).catch(() => { if (alive) { setError("Não foi possível verificar sua sessão."); setLoading(false); } });
    return () => { alive = false; version.current++; subscription.data.subscription.unsubscribe(); };
  }, []);

  async function perform<T>(action: () => Promise<T>): Promise<T> {
    setLoading(true);
    setError(null);
    try { return await action(); }
    catch (failure) {
      const message = failure instanceof Error ? failure.message : "Não foi possível concluir. Tente novamente.";
      setError(message);
      throw new Error(message);
    } finally { setLoading(false); }
  }
  // On non-2xx, supabase-js returns data=null and keeps the function's JSON body in error.context.
  async function functionMessage(result: { data: { error?: string } | null; error: unknown }, fallback: string) {
    const context = (result.error as { context?: Response } | null)?.context;
    if (context && typeof context.json === "function") {
      try { const body = await context.clone().json(); if (typeof body?.error === "string") return body.error; } catch { /* non-JSON body */ }
    }
    return result.data?.error ?? fallback;
  }
  const sendPhoneCode: AuthState["sendPhoneCode"] = () => perform(async () => {
    const result = await supabase.functions.invoke("solvchat-otp", { body: { action: "send" } });
    if (result.error || !result.data?.sent) throw new Error(await functionMessage(result, "Não foi possível enviar o código pelo WhatsApp."));
  });
  const verifyPhoneCode: AuthState["verifyPhoneCode"] = (_number, code) => perform(async () => {
    if (!/^\d{6}$/.test(code.trim())) throw new Error("Informe o código de 6 dígitos.");
    const result = await supabase.functions.invoke("solvchat-otp", { body: { action: "verify", code: code.trim() } });
    if (result.error || result.data?.verified !== true) throw new Error(await functionMessage(result, "Código inválido ou expirado."));
    setVerifiedWhatsApp(true);
  });
  const login: AuthState["login"] = (email, password) => perform(async () => {
    const result = await supabase.auth.signInWithPassword({ email: email.trim(), password });
    if (result.error) throw new Error(result.error.message.toLowerCase().includes("email not confirmed") ? "Confirme seu e-mail pelo link recebido antes de entrar e validar o WhatsApp." : "Não foi possível entrar. Verifique seu e-mail e senha.");
    await profileReady.current;
    const check = await supabase.functions.invoke("solvchat-otp", { body: { action: "status" } });
    const verified = !check.error && check.data?.verified === true;
    setVerifiedWhatsApp(verified);
    return verified;
  });
  const signup: AuthState["signup"] = (name, whatsapp, email, password) => perform(async () => {
    if (!name.trim()) throw new Error("Informe seu nome completo.");
    validatePassword(password);
    const phone = normalizeWhatsapp(whatsapp);
    const result = await supabase.auth.signUp({
      email: email.trim(), password,
      options: { data: { full_name: name.trim(), whatsapp: phone } },
    });
    if (result.error) throw new Error("Não foi possível cadastrar. Verifique seus dados.");
    if (!result.data.session) return false; // Hosted Supabase may require email verification before phone OTP.
    // The auth trigger can finish after signUp returns. Keep the newly created
    // session and allow the profile a short time to become visible instead of
    // asking the customer to create their account twice.
    let profileFound = false;
    for (let attempt = 0; attempt < 6; attempt++) {
      const { data, error: profileError } = await supabase.from("profiles")
        .select("id").eq("id", result.data.user?.id ?? "").maybeSingle();
      if (!profileError && data) { profileFound = true; break; }
      if (attempt < 5) await new Promise(resolve => setTimeout(resolve, 250));
    }
    if (!profileFound) throw new Error("Conta criada, mas o perfil ainda está sendo preparado. Aguarde um instante e entre com seu e-mail e senha; não é necessário criar outra conta.");
    // The code is requested by the caller so a delivery failure does not look like a failed signup.
    return true;
  });
  const resetPassword: AuthState["resetPassword"] = (email) => perform(async () => {
    const result = await supabase.auth.resetPasswordForEmail(email.trim(), { redirectTo: `${window.location.origin}/redefinir-senha` });
    if (result.error) throw new Error("Não foi possível enviar o link. Tente novamente.");
  });
  const updatePassword: AuthState["updatePassword"] = (password) => perform(async () => {
    validatePassword(password);
    if (!recovery.current) throw new Error("Link de recuperação ausente ou inválido. Solicite um novo link.");
    const verified = await supabase.auth.getUser();
    if (verified.error || !verified.data.user) throw new Error("Sua sessão de recuperação expirou. Solicite um novo link.");
    const result = await supabase.auth.updateUser({ password });
    if (result.error) throw new Error("Não foi possível atualizar a senha. Solicite um novo link e tente novamente.");
    recovery.current = false;
    setRecoveryReady(false);
  });
  const updateProfile: AuthState["updateProfile"] = (name, whatsapp) => perform(async () => {
    if (!name.trim()) throw new Error("Informe seu nome completo.");
    const verified = await supabase.auth.getUser();
    if (verified.error || !verified.data.user) throw new Error("Entre novamente para editar seus dados.");
    const current = version.current;
    const result = await supabase.from("profiles").update({ full_name: name.trim(), whatsapp: normalizeWhatsapp(whatsapp), updated_at: new Date().toISOString() }).eq("id", verified.data.user.id).select("*").single();
    if (result.error) throw new Error("Não foi possível salvar seus dados. Tente novamente.");
    if (current === version.current) setProfile(result.data);
  });
  const logout = () => perform(async () => {
    await queryClient.cancelQueries();
    queryClient.clear();
    const result = await supabase.auth.signOut();
    if (result.error) throw new Error("Não foi possível sair. Tente novamente.");
    version.current++;
    setSession(null);
    setProfile(null);
    setVerifiedWhatsApp(false);
  });
  const phoneVerified = Boolean(session && verifiedWhatsApp);
  const user = session && verifiedWhatsApp ? { id: session.user.id, name: profile?.full_name || session.user.email?.split("@")[0] || "Minha conta", email: session.user.email || "", whatsapp: profile?.whatsapp || "" } : null;
  const pendingUser = session && !verifiedWhatsApp ? { id: session.user.id, whatsapp: profile?.whatsapp || "" } : null;
  return <AuthContext.Provider value={{ user, pendingUser, session, profile, loading, error, recoveryReady, phoneVerified, sendPhoneCode, verifyPhoneCode, login, signup, resetPassword, updatePassword, updateProfile, logout }}>{children}</AuthContext.Provider>;
}
export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth requer AuthProvider.");
  return context;
}
