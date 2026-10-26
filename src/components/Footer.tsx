import { Link } from "@tanstack/react-router";
import { ShieldAlert } from "lucide-react";

export function Footer() {
  return (
    <footer className="mt-20 border-t border-border bg-secondary/30">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 py-12">
        <div className="grid gap-8 md:grid-cols-4">
          <div className="md:col-span-2">
            <div className="flex items-center gap-2">
              <div className="grid h-8 w-8 place-items-center rounded-lg gradient-primary text-white font-bold">+</div>
              <span className="font-semibold">Projeto <span className="text-primary">+ Benefícios</span></span>
            </div>
            <p className="mt-3 max-w-md text-sm text-muted-foreground">
              Catálogo digital simples e organizado com explicações claras sobre benefícios do governo brasileiro.
            </p>
            <div className="mt-4 inline-flex items-start gap-2 rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-900">
              <ShieldAlert className="h-4 w-4 mt-0.5 shrink-0" />
              <span>Os benefícios do governo são gratuitos. Nosso preço cobre somente os guias e orientações desta plataforma privada; não cobramos por solicitações ou liberações oficiais.</span>
            </div>
          </div>
          <div>
            <h4 className="text-sm font-semibold mb-3">Navegar</h4>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li><Link to="/" className="hover:text-foreground">Início</Link></li>
              <li><Link to="/beneficios" className="hover:text-foreground">Benefícios</Link></li>
              <li><Link to="/favoritos" className="hover:text-foreground">Favoritos</Link></li>
              <li><Link to="/atualizacoes" className="hover:text-foreground">Atualizações</Link></li>
              <li><Link to="/ajuda" className="hover:text-foreground">Onde buscar ajuda</Link></li>
            </ul>
          </div>
          <div>
            <h4 className="text-sm font-semibold mb-3">Canais oficiais</h4>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li>121 — Desenvolvimento Social</li>
              <li>111 — Caixa</li>
              <li>135 — INSS</li>
              <li><a href="https://gov.br" className="hover:text-foreground" target="_blank" rel="noreferrer">gov.br</a></li>
            </ul>
          </div>
        </div>
        <div className="mt-10 pt-6 border-t border-border text-xs text-muted-foreground">
          © {new Date().getFullYear()} Projeto + Benefícios. Conteúdo informativo, não substitui canais oficiais.
        </div>
      </div>
    </footer>
  );
}