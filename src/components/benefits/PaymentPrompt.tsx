import { useState } from "react";
import { LockKeyhole, CreditCard, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { LoginDialog } from "@/components/layout/LoginDialog";
import { useAuth } from "@/hooks/use-auth";
import { CheckoutDialog } from "@/components/benefits/CheckoutDialog";

export function PaymentPrompt({ open, onOpenChange, benefitName }: { open: boolean; onOpenChange: (open: boolean) => void; benefitName?: string }) {
  const { user, phoneVerified } = useAuth();
  const [loginOpen, setLoginOpen] = useState(false);
  const [checkoutOpen, setCheckoutOpen] = useState(false);
  // The purchase happens inside the site (CheckoutDialog); nothing redirects to Asaas.
  function checkout() {
    if (!user || !phoneVerified) { onOpenChange(false); setLoginOpen(true); return; }
    onOpenChange(false);
    setCheckoutOpen(true);
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
          <p className="flex gap-2"><CreditCard className="size-5 shrink-0 text-primary" /> Pix ou cartão de crédito, sem sair do site.</p>
          <p className="text-xs text-muted-foreground">Somos uma plataforma privada de orientações. Os benefícios do governo são gratuitos e podem ser solicitados diretamente pelos canais oficiais.</p>
        </div>
        <Button onClick={checkout} className="w-full">{user ? (phoneVerified ? "Desbloquear conteúdo" : "Confirmar celular para continuar") : "Cadastre-se para desbloquear"}</Button>
        <Button variant="ghost" onClick={() => onOpenChange(false)}>Agora não</Button>
      </DialogContent>
    </Dialog>
    <CheckoutDialog open={checkoutOpen} onOpenChange={setCheckoutOpen} />
    <LoginDialog open={loginOpen} onOpenChange={setLoginOpen} initialMode={user ? "verificar" : "cadastrar"} />
  </>;
}
