import { useState } from "react";
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
}

export function LoginDialog({ open, onOpenChange }: Props) {
  const { login, signup, resetPassword, loading } = useAuth();
  const [mode, setMode] = useState<"entrar" | "cadastrar" | "recuperar">("entrar");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [whatsapp, setWhatsapp] = useState("");
  const [password, setPassword] = useState("");
  const [visible, setVisible] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  function changeMode(next: typeof mode) { setMode(next); setError(""); setSuccess(""); setPassword(""); }

  return (
    <Dialog open={open} onOpenChange={(next) => { if (loading) return; if (!next) { setPassword(""); setError(""); setSuccess(""); } onOpenChange(next); }}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{mode === "entrar" ? "Entrar na sua conta" : mode === "cadastrar" ? "Criar sua conta" : "Recuperar senha"}</DialogTitle>
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
              if (mode === "entrar") { await login(email, password); setPassword(""); onOpenChange(false); }
              else if (mode === "cadastrar") {
                const confirm = await signup(name, whatsapp, email, password);
                setPassword("");
                setSuccess(confirm ? "Confira seu e-mail e confirme o cadastro antes de entrar." : "Cadastro realizado. Sua sessão foi iniciada.");
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
          <div className="space-y-2">
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
          </div>
          {mode !== "recuperar" && <div className="space-y-2">
            <Label htmlFor="login-password">Senha</Label>
            <div className="relative">
              <Input id="login-password" type={visible ? "text" : "password"} required minLength={mode === "cadastrar" ? 8 : undefined} autoComplete={mode === "cadastrar" ? "new-password" : "current-password"} disabled={loading} value={password} onChange={(e) => setPassword(e.target.value)} className="pr-12" />
              <Button type="button" variant="ghost" size="icon" className="absolute right-1 top-0" aria-label={visible ? "Ocultar senha" : "Mostrar senha"} onClick={() => setVisible(!visible)}>{visible ? <EyeOff className="size-4" /> : <Eye className="size-4" />}</Button>
            </div>
          </div>}
          {error && <p role="alert" className="text-sm text-destructive">{error}</p>}
          {success && <p role="status" className="text-sm text-primary">{success}</p>}
          <DialogFooter>
            <Button type="submit" disabled={loading} className="w-full">{loading ? "Aguarde…" : mode === "entrar" ? "Entrar" : mode === "cadastrar" ? "Cadastrar" : "Enviar link"}</Button>
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
