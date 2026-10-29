import { useEffect, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { CheckCircle2, Copy, CreditCard, Loader2, Lock, QrCode } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useAuth } from "@/hooks/use-auth";
import { supabase } from "@/integrations/supabase/client";
import { syncAsaasAccess } from "@/lib/sync-asaas-access";
import { trackEvent } from "@/components/ConsentTracking";
import {
  formatCardNumber, formatCep, formatCpfCnpj, formatExpiry, isFutureExpiry, isValidCardNumber, isValidCpfCnpj, onlyDigits, parseExpiry,
} from "@/lib/payment-validators";

type Method = "PIX" | "CREDIT_CARD";
type Step = "verify" | "form" | "pix" | "wait" | "done";
const POLL_MS = 4000;
const POLL_LIMIT_MS = 15 * 60 * 1000;

async function readFailure(result: { data: { error?: string } | null; error: unknown }, fallback: string) {
  const context = (result.error as { context?: Response } | null)?.context;
  if (context && typeof context.clone === "function") {
    try {
      const body = await context.clone().json();
      if (typeof body?.error === "string") return { message: body.error as string, code: typeof body?.code === "string" ? body.code as string : "" };
    } catch { /* non-JSON body */ }
  }
  return { message: result.data?.error ?? fallback, code: "" };
}

export function CheckoutDialog({ open, onOpenChange }: { open: boolean; onOpenChange: (open: boolean) => void }) {
  const { user, profile } = useAuth();
  const queryClient = useQueryClient();
  const [step, setStep] = useState<Step>("verify");
  const [code, setCode] = useState("");
  const [codeInfo, setCodeInfo] = useState("");
  const [codeBusy, setCodeBusy] = useState(false);
  const [method, setMethod] = useState<Method>("PIX");
  const [price, setPrice] = useState<number | null>(null);
  const [name, setName] = useState("");
  const [doc, setDoc] = useState("");
  const [cardNumber, setCardNumber] = useState("");
  const [holder, setHolder] = useState("");
  const [expiry, setExpiry] = useState("");
  const [cvv, setCvv] = useState("");
  const [cep, setCep] = useState("");
  const [addressNumber, setAddressNumber] = useState("");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");
  const [pix, setPix] = useState<{ qrCode: string; copyPaste: string; expiresAt: string | null } | null>(null);
  const [copied, setCopied] = useState(false);

  // Nothing typed here is kept once the window closes, and card fields never leave this component's state.
  useEffect(() => {
    if (!open) return;
    setStep("verify"); setCode(""); setCodeInfo(""); setMethod("PIX"); setError(""); setPix(null); setCopied(false); setPending(false);
    void requestCode();
    setDoc(""); setCardNumber(""); setHolder(""); setExpiry(""); setCvv(""); setCep(""); setAddressNumber("");
    setName(profile?.full_name ?? "");
    let alive = true;
    void supabase.functions.invoke("asaas-pay", { body: { action: "quote" } }).then(({ data }) => {
      if (alive && Number.isSafeInteger(data?.priceCents)) setPrice(data.priceCents);
    });
    return () => { alive = false; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  // Every purchase starts with a fresh WhatsApp code, even for people who already verified when they signed in.
  async function requestCode() {
    setCodeBusy(true); setError(""); setCodeInfo("");
    try {
      const result = await supabase.functions.invoke("solvchat-otp", { body: { action: "send" } });
      if (result.error || !result.data?.sent) throw new Error((await readFailure(result, "Não foi possível enviar o código pelo WhatsApp.")).message);
      setCodeInfo("Enviamos um código de 6 dígitos para o seu WhatsApp.");
    } catch (e) { setError(e instanceof Error ? e.message : "Não foi possível enviar o código."); }
    finally { setCodeBusy(false); }
  }
  async function confirmCode(event: React.FormEvent) {
    event.preventDefault();
    if (codeBusy) return;
    if (!/^\d{6}$/.test(code)) { setError("Digite o código de 6 dígitos."); return; }
    setCodeBusy(true); setError("");
    try {
      const result = await supabase.functions.invoke("solvchat-otp", { body: { action: "verify", code, purpose: "purchase" } });
      if (result.error || result.data?.verified !== true) throw new Error((await readFailure(result, "Código inválido ou expirado.")).message);
      setCode(""); setCodeInfo(""); setStep("form");
    } catch (e) { setError(e instanceof Error ? e.message : "Código inválido ou expirado."); }
    finally { setCodeBusy(false); }
  }

  function finish() {
    setStep("done");
    if (user) {
      void queryClient.invalidateQueries({ queryKey: ["benefit-access", user.id] });
      void queryClient.invalidateQueries({ queryKey: ["account-access-grants", user.id] });
    }
  }

  // Confirmation normally arrives by webhook within seconds; this asks the server to check Asaas meanwhile.
  useEffect(() => {
    if (!open || !user || (step !== "pix" && step !== "wait")) return;
    const startedAt = Date.now();
    let alive = true;
    const timer = window.setInterval(async () => {
      if (Date.now() - startedAt > POLL_LIMIT_MS) { window.clearInterval(timer); return; }
      if (await syncAsaasAccess(user.id, true) && alive) { window.clearInterval(timer); finish(); }
    }, POLL_MS);
    return () => { alive = false; window.clearInterval(timer); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, step, user?.id]);

  function validate() {
    if (name.trim().split(/\s+/).length < 2) return "Informe seu nome completo.";
    if (!isValidCpfCnpj(doc)) return "CPF ou CNPJ inválido.";
    if (method === "CREDIT_CARD") {
      if (!holder.trim()) return "Informe o nome impresso no cartão.";
      if (!isValidCardNumber(cardNumber)) return "Número do cartão inválido.";
      if (!isFutureExpiry(expiry)) return "Validade do cartão inválida ou vencida.";
      if (!/^\d{3,4}$/.test(cvv)) return "Código de segurança inválido.";
      if (onlyDigits(cep).length !== 8) return "Informe o CEP do endereço da fatura.";
      if (!addressNumber.trim()) return "Informe o número do endereço.";
    }
    return "";
  }

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    if (pending) return;
    const problem = validate();
    if (problem) { setError(problem); return; }
    setPending(true); setError("");
    try {
      const expiryParts = parseExpiry(expiry);
      const body = method === "PIX"
        ? { action: "create", method, name: name.trim(), cpfCnpj: onlyDigits(doc) }
        : { action: "create", method, name: name.trim(), cpfCnpj: onlyDigits(doc), card: {
            holderName: holder.trim(), number: onlyDigits(cardNumber), expiryMonth: expiryParts!.month, expiryYear: String(expiryParts!.year),
            ccv: cvv, postalCode: onlyDigits(cep), addressNumber: addressNumber.trim(),
          } };
      void trackEvent("InitiateCheckout");
      const result = await supabase.functions.invoke("asaas-pay", { body });
      if (result.error || !result.data) {
        const failure = await readFailure(result, "Não foi possível iniciar o pagamento. Tente novamente.");
        if (failure.code === "purchase_verification_required") { setStep("verify"); setCode(""); void requestCode(); }
        throw new Error(failure.message);
      }
      setCardNumber(""); setCvv(""); setExpiry("");
      if (result.data.method === "PIX") { setPix({ qrCode: result.data.qrCode, copyPaste: result.data.copyPaste, expiresAt: result.data.expiresAt ?? null }); setStep("pix"); }
      else if (result.data.approved) finish();
      else setStep("wait");
    } catch (e) { setError(e instanceof Error ? e.message : "Não foi possível iniciar o pagamento."); }
    finally { setPending(false); }
  }

  async function copy() {
    if (!pix) return;
    try { await navigator.clipboard.writeText(pix.copyPaste); setCopied(true); window.setTimeout(() => setCopied(false), 2500); }
    catch { setError("Não foi possível copiar. Selecione o código e copie manualmente."); }
  }

  const priceLabel = price === null ? "" : (price / 100).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
  const tab = (value: Method, label: string, icon: React.ReactNode) => (
    <button type="button" onClick={() => { setMethod(value); setError(""); }} aria-pressed={method === value}
      className={`flex flex-1 items-center justify-center gap-2 rounded-xl border px-3 py-3 text-sm font-medium transition ${method === value ? "border-primary bg-primary-soft text-primary" : "border-border text-muted-foreground hover:bg-muted/50"}`}>
      {icon}{label}
    </button>
  );

  return (
    <Dialog open={open} onOpenChange={(next) => { if (!pending) onOpenChange(next); }}>
      <DialogContent className="max-h-[92vh] overflow-y-auto sm:max-w-lg">
        {step === "verify" ? (
          <form onSubmit={(e) => void confirmCode(e)} className="space-y-4">
            <DialogHeader>
              <DialogTitle>Confirme seu WhatsApp</DialogTitle>
              <DialogDescription>Por segurança, confirmamos sua identidade antes de cada compra{profile?.whatsapp ? <> com um código enviado para o número final <strong>{profile.whatsapp.slice(-4)}</strong></> : ""}.</DialogDescription>
            </DialogHeader>
            <div className="space-y-2">
              <Label htmlFor="co-code">Código recebido no WhatsApp</Label>
              <Input id="co-code" required inputMode="numeric" autoComplete="one-time-code" maxLength={6} placeholder="000000" value={code} onChange={(e) => setCode(onlyDigits(e.target.value))} />
            </div>
            {codeInfo && <p role="status" className="text-sm text-primary">{codeInfo}</p>}
            {error && <p role="alert" className="text-sm text-destructive">{error}</p>}
            <Button type="submit" className="w-full" disabled={codeBusy}>{codeBusy ? "Aguarde…" : "Confirmar código"}</Button>
            <Button type="button" variant="outline" className="w-full" disabled={codeBusy} onClick={() => void requestCode()}>Reenviar código pelo WhatsApp</Button>
          </form>
        ) : step === "done" ? (
          <div className="space-y-4 py-4 text-center">
            <CheckCircle2 className="mx-auto size-14 text-primary" />
            <DialogTitle className="text-2xl">Pagamento confirmado</DialogTitle>
            <DialogDescription>Seu acesso ao conteúdo premium já está liberado.</DialogDescription>
            <Button className="w-full" onClick={() => onOpenChange(false)}>Começar a ler</Button>
          </div>
        ) : step === "wait" ? (
          <div className="space-y-4 py-6 text-center" role="status">
            <Loader2 className="mx-auto size-10 animate-spin text-primary" />
            <DialogTitle>Confirmando seu pagamento</DialogTitle>
            <DialogDescription>O banco está analisando a compra. Isso costuma levar alguns segundos; você pode manter esta janela aberta.</DialogDescription>
          </div>
        ) : step === "pix" && pix ? (
          <div className="space-y-4">
            <DialogHeader>
              <DialogTitle>Pague com PIX</DialogTitle>
              <DialogDescription>Abra o app do seu banco, escolha pagar com PIX e leia o QR Code ou use o código copia e cola. {priceLabel && <strong>{priceLabel}</strong>}</DialogDescription>
            </DialogHeader>
            <img src={`data:image/png;base64,${pix.qrCode}`} alt="QR Code do PIX" className="mx-auto size-56 rounded-xl border border-border bg-white p-2" />
            <div className="space-y-2">
              <Label htmlFor="pix-code">PIX copia e cola</Label>
              <Input id="pix-code" readOnly value={pix.copyPaste} onFocus={(e) => e.currentTarget.select()} className="font-mono text-xs" />
              <Button type="button" variant="outline" className="w-full gap-2" onClick={() => void copy()}><Copy className="size-4" />{copied ? "Código copiado" : "Copiar código"}</Button>
            </div>
            {error && <p role="alert" className="text-sm text-destructive">{error}</p>}
            <p className="flex items-center justify-center gap-2 text-sm text-muted-foreground" role="status"><Loader2 className="size-4 animate-spin" />Aguardando o pagamento… a confirmação é automática.</p>
          </div>
        ) : (
          <form onSubmit={(e) => void submit(e)} className="space-y-4">
            <DialogHeader>
              <DialogTitle>Finalizar compra</DialogTitle>
              <DialogDescription>Acesso completo ao conteúdo premium{priceLabel && <> por <strong>{priceLabel}</strong> (pagamento único)</>}.</DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2 sm:col-span-2"><Label htmlFor="co-name">Nome completo</Label><Input id="co-name" required autoComplete="name" value={name} onChange={(e) => setName(e.target.value)} /></div>
              <div className="space-y-2 sm:col-span-2"><Label htmlFor="co-doc">CPF ou CNPJ</Label><Input id="co-doc" required inputMode="numeric" autoComplete="off" placeholder="000.000.000-00" value={doc} onChange={(e) => setDoc(formatCpfCnpj(e.target.value))} /></div>
            </div>
            <div className="flex gap-2" role="group" aria-label="Forma de pagamento">
              {tab("PIX", "PIX", <QrCode className="size-4" />)}
              {tab("CREDIT_CARD", "Cartão de crédito", <CreditCard className="size-4" />)}
            </div>
            {method === "CREDIT_CARD" && (
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2 sm:col-span-2"><Label htmlFor="co-card">Número do cartão</Label><Input id="co-card" required inputMode="numeric" autoComplete="cc-number" placeholder="0000 0000 0000 0000" value={cardNumber} onChange={(e) => setCardNumber(formatCardNumber(e.target.value))} /></div>
                <div className="space-y-2 sm:col-span-2"><Label htmlFor="co-holder">Nome impresso no cartão</Label><Input id="co-holder" required autoComplete="cc-name" value={holder} onChange={(e) => setHolder(e.target.value.toUpperCase())} /></div>
                <div className="space-y-2"><Label htmlFor="co-exp">Validade</Label><Input id="co-exp" required inputMode="numeric" autoComplete="cc-exp" placeholder="MM/AA" value={expiry} onChange={(e) => setExpiry(formatExpiry(e.target.value))} /></div>
                <div className="space-y-2"><Label htmlFor="co-cvv">Código de segurança</Label><Input id="co-cvv" required inputMode="numeric" autoComplete="cc-csc" maxLength={4} placeholder="CVV" value={cvv} onChange={(e) => setCvv(onlyDigits(e.target.value))} /></div>
                <div className="space-y-2"><Label htmlFor="co-cep">CEP da fatura</Label><Input id="co-cep" required inputMode="numeric" autoComplete="postal-code" placeholder="00000-000" value={cep} onChange={(e) => setCep(formatCep(e.target.value))} /></div>
                <div className="space-y-2"><Label htmlFor="co-num">Número do endereço</Label><Input id="co-num" required autoComplete="off" maxLength={10} value={addressNumber} onChange={(e) => setAddressNumber(e.target.value)} /></div>
              </div>
            )}
            {error && <p role="alert" className="text-sm text-destructive">{error}</p>}
            <Button type="submit" className="w-full" disabled={pending}>{pending ? "Processando…" : method === "PIX" ? "Gerar QR Code PIX" : `Pagar${priceLabel ? " " + priceLabel : ""}`}</Button>
            <p className="flex items-center justify-center gap-2 text-center text-xs text-muted-foreground"><Lock className="size-3.5 shrink-0" />Pagamento processado com segurança pelo Asaas. Não guardamos os dados do seu cartão.</p>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}
