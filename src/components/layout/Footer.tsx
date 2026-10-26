import { Link } from "@tanstack/react-router";
import { Plus, ShieldAlert } from "lucide-react";

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
              Conteúdos informativos privados e guias organizados para entender os benefícios do governo brasileiro.
            </p>
            <div className="mt-4 flex gap-2 rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-900"><ShieldAlert className="size-4 shrink-0"/> Os benefícios do governo são gratuitos. Não cobramos por inscrições, aprovações ou liberações governamentais.</div>
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
              Somos uma plataforma independente, sem vínculo com órgãos governamentais. Nosso produto é acesso a conteúdo explicativo. Consulte os canais oficiais como gov.br, CRAS, Caixa e INSS.
            </p>
          </div>
        </div>
        <div className="mt-10 pt-6 border-t border-border text-xs text-muted-foreground">
          © {new Date().getFullYear()} Projeto + Benefícios. Conteúdo informativo não substitui orientação ou canais oficiais.
        </div>
      </div>
    </footer>
  );
}
