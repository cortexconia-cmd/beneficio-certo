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

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function LoginDialog({ open, onOpenChange }: Props) {
  const { login } = useAuth();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Entrar na sua conta</DialogTitle>
          <DialogDescription>
            Acesse para salvar seus benefícios favoritos e acompanhar atualizações.
          </DialogDescription>
        </DialogHeader>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            if (!name || !email) return;
            login({ name, email });
            onOpenChange(false);
            setName("");
            setEmail("");
          }}
          className="space-y-4"
        >
          <div className="space-y-2">
            <Label htmlFor="login-name">Nome</Label>
            <Input id="login-name" value={name} onChange={(e) => setName(e.target.value)} placeholder="Seu nome" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="login-email">E-mail</Label>
            <Input
              id="login-email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="voce@email.com"
            />
          </div>
          <DialogFooter>
            <Button type="submit" className="w-full">Entrar</Button>
          </DialogFooter>
          <p className="text-xs text-muted-foreground text-center">
            Demonstração — autenticação real será adicionada em breve.
          </p>
        </form>
      </DialogContent>
    </Dialog>
  );
}
