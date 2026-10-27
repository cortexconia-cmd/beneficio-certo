import { useState } from "react";
import { LockKeyhole, CreditCard, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { LoginDialog } from "@/components/layout/LoginDialog";
import { useAuth } from "@/hooks/use-auth";
import { supabase } from "@/integrations/supabase/client";
import { trackEvent } from "@/components/ConsentTracking";

export function PaymentPrompt({ open, onOpenChange, benefitName }: { open: boolean; onOpenChange: (open: boolean) => void; benefitName?: string }) {
  const { user, phoneVerified } = useAuth();
  const [loginOpen, setLoginOpen] = useState(false);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");
  async function checkout() {
    if (!user || !phoneVerified) { onOpenChange(false); setLoginOpen(true); return; }
    setPending(true); setError("");
    try {
      const { data, error: failure } = await supabase.functions.invoke("asaas-create-checkout", { body: {} });
      if (failure || !data?.url) throw new Error("Pagamento ainda indisponível. Tente novamente mais tarde.");
      const url = new URL(data.url);
      if (url.protocol !== "https:" || !["asaas.com", "www.asaas.com", "sandbox.asaas.com", "checkout.asaas.com", "sandbox.checkout.asaas.com"].includes(url.hostname) && !url.hostname.endsWith(".asaas.com")) throw new Error("Link de pagamento inválido.");
      await trackEvent("InitiateCheckout");
      window.location.assign(url.toString());
    } catch (e) { setError(e instanceof Error ? e.message : "Falha ao abrir pagamento."); setPending(false); }
  }
  return <>
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <div className="mx-auto mb-3 flex size-14 items-center justify-center rounded-2xl bg-primary-soft text-primary"><LockKeyhole className="size-7" /></div>
          <DialogTitle className="text-center text-2xl">Conteúdo exclusivo</DialogTitle>
          <DialogDescription className="text-center">
            {benefitName ? `O guia de ${benefitName} faz parte do conteúdo premium.` : "Este benefício faz parte do conteúdo premium."}
            {" "}Desbloqueie o material informativo completo, com orientações organizadas.
          </DialogDescription>
        </DialogHeader>
        <div className="rounded-xl border border-border bg-muted/40 p-4 space-y-3 text-sm">
          <p className="flex gap-2"><ShieldCheck className="size-5 shrink-0 text-primary" /> Pagamento único para acessar os guias exclusivos.</p>
          <p className="flex gap-2"><CreditCard className="size-5 shrink-0 text-primary" /> Pix ou cartão de crédito pelo Asaas.</p>
          <p className="text-xs text-muted-foreground">Somos uma plataforma privada de orientações. Os benefícios do governo são gratuitos e podem ser solicitados diretamente pelos canais oficiais.</p>
        </div>
        {error && <p role="alert" className="text-sm text-destructive">{error}</p>}
        <Button onClick={() => void checkout()} disabled={pending} className="w-full">{pending ? "Preparando pagamento…" : user ? (phoneVerified ? "Desbloquear conteúdo" : "Confirmar celular para continuar") : "Cadastre-se para desbloquear"}</Button>
        <Button variant="ghost" onClick={() => onOpenChange(false)}>Agora não</Button>
      </DialogContent>
    </Dialog>
    <LoginDialog open={loginOpen} onOpenChange={setLoginOpen} initialMode={user ? "verificar" : "cadastrar"} />
  </>;
}
