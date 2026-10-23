import { Link } from "@tanstack/react-router";
import { Plus } from "lucide-react";

export function Footer() {
  return (
    <footer className="border-t border-border bg-card mt-20">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid gap-8 md:grid-cols-3">
          <div>
            <div className="flex items-center gap-1.5">
              <span className="font-semibold tracking-tight">Projeto</span>
              <span className="inline-flex items-center justify-center size-5 rounded-md bg-primary text-primary-foreground">
                <Plus className="size-3" strokeWidth={3} />
              </span>
              <span className="font-semibold tracking-tight">Benefícios</span>
            </div>
            <p className="mt-3 text-sm text-muted-foreground max-w-xs">
              Catálogo simples e organizado de benefícios sociais brasileiros, com explicações fáceis para quem mais precisa.
            </p>
          </div>
          <div>
            <h4 className="font-semibold text-sm mb-3">Navegar</h4>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li><Link to="/" className="hover:text-foreground">Início</Link></li>
              <li><Link to="/beneficios" className="hover:text-foreground">Benefícios</Link></li>
              <li><Link to="/favoritos" className="hover:text-foreground">Favoritos</Link></li>
              <li><Link to="/atualizacoes" className="hover:text-foreground">Atualizações</Link></li>
            </ul>
          </div>
          <div>
            <h4 className="font-semibold text-sm mb-3">Importante</h4>
            <p className="text-sm text-muted-foreground">
              As informações deste site são demonstrativas. Para dados oficiais, consulte sempre os canais do governo federal.
            </p>
          </div>
        </div>
        <div className="mt-10 pt-6 border-t border-border text-xs text-muted-foreground">
          © 2026 Projeto+Benefícios. Plataforma demonstrativa.
        </div>
      </div>
    </footer>
  );
}
