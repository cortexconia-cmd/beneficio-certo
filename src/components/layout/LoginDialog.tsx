import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Eye, EyeOff } from "lucide-react";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initialMode?: "entrar" | "cadastrar" | "recuperar" | "verificar";
}

export function LoginDialog({ open, onOpenChange, initialMode = "entrar" }: Props) {
  const { login, signup, resetPassword, sendPhoneCode, verifyPhoneCode, loading } = useAuth();
  const [mode, setMode] = useState<"entrar" | "cadastrar" | "recuperar" | "verificar">(initialMode);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [whatsapp, setWhatsapp] = useState("");
  const [password, setPassword] = useState("");
  const [code, setCode] = useState("");
  const [visible, setVisible] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  useEffect(() => { if (open) setMode(initialMode); }, [open, initialMode]);
  function changeMode(next: typeof mode) { setMode(next); setError(""); setSuccess(""); setPassword(""); }

  return (
    <Dialog open={open} onOpenChange={(next) => { if (loading) return; if (!next) { setPassword(""); setError(""); setSuccess(""); } onOpenChange(next); }}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{mode === "entrar" ? "Entrar na sua conta" : mode === "cadastrar" ? "Criar sua conta" : mode === "verificar" ? "Confirme seu celular" : "Recuperar senha"}</DialogTitle>
          <DialogDescription>
            Acesse para salvar seus benefícios favoritos e acompanhar atualizações.
          </DialogDescription>
        </DialogHeader>
        <form
          onSubmit={async (e) => {
            e.preventDefault();
            if (loading) return;
            setError(""); setSuccess("");
            try {
              if (mode === "entrar") { await login(email, password); setPassword(""); const verified = await supabase.auth.getUser(); if (!verified.data.user?.phone_confirmed_at) setMode("verificar"); else onOpenChange(false); }
              else if (mode === "cadastrar") {
                const confirm = await signup(name, whatsapp, email, password);
                setPassword("");
                setMode("verificar");
                setSuccess(confirm ? "Enviamos um código SMS ao celular informado." : "Digite o código SMS para confirmar seu celular.");
              } else if (mode === "verificar") {
                await verifyPhoneCode(whatsapp, code);
                setSuccess("Celular confirmado. Sua conta está pronta.");
                setCode("");
                onOpenChange(false);
              } else { await resetPassword(email); setSuccess("Se houver uma conta para este e-mail, você receberá um link para redefinir a senha."); }
            } catch (failure) { setError(failure instanceof Error ? failure.message : "Tente novamente."); }
          }}
          className="space-y-4"
        >
          {mode === "cadastrar" && <><div className="space-y-2">
            <Label htmlFor="login-name">Nome completo</Label>
            <Input id="login-name" required autoComplete="name" disabled={loading} value={name} onChange={(e) => setName(e.target.value)} placeholder="Seu nome completo" />
          </div><div className="space-y-2">
            <Label htmlFor="login-whatsapp">WhatsApp com DDD</Label>
            <Input id="login-whatsapp" type="tel" required autoComplete="tel" disabled={loading} value={whatsapp} onChange={(e) => setWhatsapp(e.target.value)} placeholder="(11) 99999-9999" />
          </div></>}
          {mode !== "verificar" && <div className="space-y-2">
            <Label htmlFor="login-email">E-mail</Label>
            <Input
              id="login-email"
              type="email"
              required
              autoComplete="email"
              disabled={loading}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="voce@email.com"
            />
          </div>}
          {mode !== "recuperar" && mode !== "verificar" && <div className="space-y-2">
            <Label htmlFor="login-password">Senha</Label>
            <div className="relative">
              <Input id="login-password" type={visible ? "text" : "password"} required minLength={mode === "cadastrar" ? 8 : undefined} autoComplete={mode === "cadastrar" ? "new-password" : "current-password"} disabled={loading} value={password} onChange={(e) => setPassword(e.target.value)} className="pr-12" />
              <Button type="button" variant="ghost" size="icon" className="absolute right-1 top-0" aria-label={visible ? "Ocultar senha" : "Mostrar senha"} onClick={() => setVisible(!visible)}>{visible ? <EyeOff className="size-4" /> : <Eye className="size-4" />}</Button>
            </div>
          </div>}
          {mode === "verificar" && <>
            <div className="space-y-2"><Label htmlFor="sms-phone">Número do celular com DDD</Label><Input id="sms-phone" type="tel" required value={whatsapp} autoComplete="tel" onChange={e => setWhatsapp(e.target.value)} placeholder="(11) 99999-9999" /></div>
            <div className="space-y-2"><Label htmlFor="sms-code">Código recebido por SMS</Label><Input id="sms-code" required inputMode="numeric" autoComplete="one-time-code" maxLength={8} pattern="[0-9]{6,8}" value={code} onChange={e => setCode(e.target.value.replace(/\D/g, ""))} placeholder="000000" /></div>
            <Button type="button" variant="outline" className="w-full" disabled={loading} onClick={async () => { setError(""); setSuccess(""); try { await sendPhoneCode(whatsapp); setSuccess("Novo código SMS solicitado."); } catch (e) { setError(e instanceof Error ? e.message : "Falha ao reenviar SMS."); } }}>Reenviar código SMS</Button>
          </>}
          {error && <p role="alert" className="text-sm text-destructive">{error}</p>}
          {success && <p role="status" className="text-sm text-primary">{success}</p>}
          <DialogFooter>
            <Button type="submit" disabled={loading} className="w-full">{loading ? "Aguarde…" : mode === "entrar" ? "Entrar" : mode === "cadastrar" ? "Cadastrar" : mode === "verificar" ? "Confirmar código" : "Enviar link"}</Button>
          </DialogFooter>
          <div className="flex flex-wrap justify-center gap-1">
            {mode !== "entrar" && <Button type="button" variant="link" disabled={loading} onClick={() => changeMode("entrar")}>Voltar para entrar</Button>}
            {mode === "entrar" && <><Button type="button" variant="link" disabled={loading} onClick={() => changeMode("cadastrar")}>Criar conta</Button><Button type="button" variant="link" disabled={loading} onClick={() => changeMode("recuperar")}>Esqueci minha senha</Button></>}
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
