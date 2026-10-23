import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { Eye, EyeOff } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { LoginDialog } from "@/components/layout/LoginDialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export const Route = createFileRoute("/redefinir-senha")({
  head: () => ({ meta: [
    { title: "Redefinir senha — Projeto+Benefícios" },
    { name: "description", content: "Redefina com segurança a senha da sua conta no Projeto+Benefícios." },
    { property: "og:title", content: "Redefinir senha — Projeto+Benefícios" },
    { property: "og:description", content: "Redefina com segurança a senha da sua conta no Projeto+Benefícios." },
    { property: "og:type", content: "website" }, { name: "twitter:card", content: "summary" },
    { name: "robots", content: "noindex" },
  ] }),
  component: ResetPasswordPage,
});
function ResetPasswordPage() {
  const { recoveryReady, loading, updatePassword } = useAuth();
  const [password, setPassword] = useState("");
  const [confirmation, setConfirmation] = useState("");
  const [visible, setVisible] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [loginOpen, setLoginOpen] = useState(false);
  return <div className="mx-auto max-w-xl px-4 sm:px-6 lg:px-8 py-10">
    <h1 className="text-3xl font-bold mb-8">Redefinir senha</h1>
    {success ? <><p role="status" className="text-primary mb-4">Senha atualizada com sucesso.</p><Button asChild><Link to="/minha-conta">Minha conta</Link></Button></> : loading && !recoveryReady ? <p role="status" className="text-muted-foreground">Verificando link…</p> : !recoveryReady ? <>
      <p role="alert" className="text-destructive mb-4">Link de recuperação ausente, inválido ou expirado. Solicite um novo link.</p>
      <Button onClick={() => setLoginOpen(true)}>Entrar ou recuperar senha</Button>
    </> : <form className="space-y-5" onSubmit={async (event) => {
      event.preventDefault(); setError("");
      if (password !== confirmation) { setError("As senhas não coincidem."); return; }
      try { await updatePassword(password); setPassword(""); setConfirmation(""); setSuccess(true); }
      catch (failure) { setError(failure instanceof Error ? failure.message : "Não foi possível redefinir a senha."); }
    }}>
      <div className="space-y-2"><Label htmlFor="new-password">Nova senha</Label><div className="relative">
        <Input id="new-password" type={visible ? "text" : "password"} minLength={8} required autoComplete="new-password" disabled={loading} value={password} onChange={(event) => setPassword(event.target.value)} className="pr-12" />
        <Button type="button" variant="ghost" size="icon" className="absolute right-1 top-0" aria-label={visible ? "Ocultar senha" : "Mostrar senha"} onClick={() => setVisible(!visible)}>{visible ? <EyeOff className="size-4" /> : <Eye className="size-4" />}</Button>
      </div></div>
      <div className="space-y-2"><Label htmlFor="confirm-password">Confirmar nova senha</Label><Input id="confirm-password" type={visible ? "text" : "password"} minLength={8} required autoComplete="new-password" disabled={loading} value={confirmation} onChange={(event) => setConfirmation(event.target.value)} /></div>
      {error && <p role="alert" className="text-destructive text-sm">{error}</p>}
      <Button type="submit" disabled={loading}>{loading ? "Aguarde…" : "Salvar nova senha"}</Button>
    </form>}
    <LoginDialog open={loginOpen} onOpenChange={setLoginOpen} />
  </div>;
}