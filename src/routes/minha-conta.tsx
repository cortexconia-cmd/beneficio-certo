import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { LogOut } from "lucide-react";
import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useAuth, isActiveGrant } from "@/hooks/use-auth";
import { supabase } from "@/integrations/supabase/client";
import { LoginDialog } from "@/components/layout/LoginDialog";
import { useBenefitAccess } from "@/hooks/use-benefit-access";
import { syncAsaasAccess } from "@/lib/sync-asaas-access";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export const Route = createFileRoute("/minha-conta")({
  head: () => ({ meta: [
    { title: "Minha conta — Projeto+Benefícios" },
    { name: "description", content: "Consulte seus dados e seu status de acesso no Projeto+Benefícios." },
    { property: "og:title", content: "Minha conta — Projeto+Benefícios" },
    { property: "og:description", content: "Consulte seus dados e seu status de acesso no Projeto+Benefícios." },
    { property: "og:type", content: "website" }, { name: "twitter:card", content: "summary" },
    { name: "robots", content: "noindex" },
  ] }),
  component: AccountPage,
});

function AccountPage() {
  const { user, profile, loading, error: authError, updateProfile, logout } = useAuth();
  const navigate = useNavigate();
  const [signingOut, setSigningOut] = useState(false);
  const { hasCatalog, isStaff, refresh } = useBenefitAccess();
  const [loginOpen, setLoginOpen] = useState(false);
  const [name, setName] = useState("");
  const [whatsapp, setWhatsapp] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [now, setNow] = useState(0);
  useEffect(() => { setNow(Date.now()); const timer = window.setInterval(() => setNow(Date.now()), 1000); return () => window.clearInterval(timer); }, []);
  useEffect(() => { setName(profile?.full_name || ""); setWhatsapp(profile?.whatsapp || ""); setSuccess(""); setError(""); }, [profile]);
  const adminRole = useQuery({ queryKey:["admin-role",user?.id], enabled:!!user, queryFn: async()=>{const {data,error}=await supabase.from("user_roles").select("role").eq("user_id",user!.id).eq("role","admin").maybeSingle();if(error)throw error;return Boolean(data)} });
  const grants = useQuery({
    queryKey: ["account-access-grants", user?.id],
    enabled: Boolean(user),
    queryFn: async () => {
      const verified = await supabase.auth.getUser();
      if (verified.error || !verified.data.user || verified.data.user.id !== user?.id) throw new Error("Entre novamente para consultar seu acesso.");
      const rows = [];
      // Retrieve every owner row rather than silently truncating at the Data API's row limit.
      for (let offset = 0; ; offset += 1000) {
        const result = await supabase.from("access_grants").select("id,access_scope,revoked_at,starts_at,expires_at")
          .eq("user_id", verified.data.user.id).order("id").range(offset, offset + 999);
        if (result.error) throw new Error("Não foi possível consultar seu acesso. Tente novamente.");
        rows.push(...result.data);
        if (result.data.length < 1000) break;
      }
      return rows;
    },
  });
  // Back from the Asaas checkout the confirmation can lag by seconds: keep checking for up to two minutes.
  useEffect(() => {
    const userId = user?.id;
    if (!userId || hasCatalog || new URLSearchParams(window.location.search).get("retorno") !== "checkout") return;
    let tries = 0;
    const timer = window.setInterval(async () => {
      tries += 1;
      if (await syncAsaasAccess(userId, true)) { await Promise.all([grants.refetch(), refresh()]); }
      if (tries >= 24) window.clearInterval(timer);
    }, 5000);
    return () => window.clearInterval(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id, hasCatalog]);
  const active = grants.data?.filter((grant) => isActiveGrant(grant, now)) || [];
  return <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8 py-10">
    <h1 className="text-3xl sm:text-4xl font-bold mb-8">Minha conta</h1>
    {loading && !user ? <p role="status" className="text-muted-foreground">Carregando…</p> : !user ? <>
      <p className="text-muted-foreground mb-4">Entre para acessar sua conta.</p>
      <Button onClick={() => setLoginOpen(true)}>Entrar</Button>
    </> : <>
      <form className="space-y-5" onSubmit={async (event) => {
        event.preventDefault(); setError(""); setSuccess("");
        try { await updateProfile(name, whatsapp); setSuccess("Dados atualizados."); }
        catch (failure) { setError(failure instanceof Error ? failure.message : "Não foi possível salvar."); }
      }}>
        <div className="space-y-2"><Label htmlFor="account-name">Nome completo</Label><Input id="account-name" required autoComplete="name" disabled={loading || !profile} value={name} onChange={(event) => setName(event.target.value)} /></div>
        <div className="space-y-2"><Label htmlFor="account-email">E-mail</Label><Input id="account-email" type="email" readOnly value={user.email} /></div>
        <div className="space-y-2"><Label htmlFor="account-whatsapp">WhatsApp com DDD</Label><Input id="account-whatsapp" type="tel" required autoComplete="tel" disabled={loading || !profile} value={whatsapp} onChange={(event) => setWhatsapp(event.target.value)} /></div>
        {(error || authError) && <p role="alert" className="text-sm text-destructive">{error || authError}</p>}
        {success && <p role="status" className="text-sm text-primary">{success}</p>}
        <Button type="submit" disabled={loading || !profile}>{loading ? "Aguarde…" : "Salvar alterações"}</Button>
      </form>
      {adminRole.data && <Link to="/admin" className="mt-8 inline-flex items-center rounded-xl bg-primary px-5 py-3 text-sm font-semibold text-primary-foreground">Abrir painel administrativo</Link>}
      <section className="mt-10 border-t border-border pt-6">
        <h2 className="text-xl font-semibold mb-3">Status de acesso</h2>
        {grants.isPending ? <p role="status" className="text-muted-foreground">Consultando acesso…</p> : grants.isError ? <>
          <p role="alert" className="text-destructive">{grants.error.message}</p><Button variant="outline" className="mt-3" onClick={() => void grants.refetch()}>Tentar novamente</Button>
        </> : <><p className="font-medium text-primary">{hasCatalog ? "Acesso Premium liberado" : "Acesso gratuito"}</p>
          {isStaff && <p className="mt-1 text-sm text-muted-foreground">Premium automático por função administrativa.</p>}
          {active.length > 0 && <ul className="list-disc pl-5 mt-2 text-sm text-muted-foreground">{active.map((grant) => <li key={grant.id}>{grant.access_scope === "catalog" ? "Catálogo" : grant.access_scope === "guide" ? "Guia" : grant.access_scope === "benefit" ? "Benefício" : grant.access_scope}{grant.expires_at ? ` — válido até ${new Date(grant.expires_at).toLocaleString("pt-BR")}` : " — sem vencimento"}</li>)}</ul>}
        </>}
      </section>
      <section className="mt-10 border-t border-border pt-6">
        <h2 className="text-xl font-semibold mb-2">Sessão</h2>
        <p className="mb-4 text-sm text-muted-foreground">Ao sair, será necessário entrar novamente para acessar seus dados e benefícios exclusivos.</p>
        <Button type="button" variant="outline" className="gap-2" disabled={signingOut} onClick={async () => {
          if (signingOut) return;
          setError("");
          setSigningOut(true);
          try {
            await logout();
            await navigate({ to: "/" });
          } catch (failure) {
            setError(failure instanceof Error ? failure.message : "Não foi possível encerrar sua sessão.");
          } finally {
            setSigningOut(false);
          }
        }}>
          <LogOut className="size-4" /> {signingOut ? "Saindo…" : "Sair da conta"}
        </Button>
      </section>
    </>}
    <LoginDialog open={loginOpen} onOpenChange={setLoginOpen} />
  </div>;
}