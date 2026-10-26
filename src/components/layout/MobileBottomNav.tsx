import { Link, useRouterState } from "@tanstack/react-router";
import { Home, LayoutGrid, Heart, UserRound } from "lucide-react";
import { cn } from "@/lib/utils";
const items = [
  { to: "/", label: "Início", icon: Home },
  { to: "/beneficios", label: "Benefícios", icon: LayoutGrid },
  { to: "/favoritos", label: "Favoritos", icon: Heart },
  { to: "/minha-conta", label: "Minha conta", icon: UserRound },
] as const;
export function MobileBottomNav() {
  const pathname = useRouterState({ select: s => s.location.pathname });
  return <nav aria-label="Navegação principal" className="lg:hidden fixed bottom-0 inset-x-0 z-40 border-t border-border bg-white/95 backdrop-blur-xl pb-[env(safe-area-inset-bottom)]">
    <ul className="grid grid-cols-4">{items.map(item => {
      const active = pathname === item.to || item.to !== "/" && pathname.startsWith(item.to + "/");
      const Icon = item.icon;
      return <li key={item.to}><Link to={item.to} className={cn("flex min-h-14 flex-col items-center justify-center gap-1 py-2.5 text-[11px] font-medium transition-colors", active ? "text-primary" : "text-muted-foreground hover:text-foreground")}>
        <Icon className="size-5" strokeWidth={active ? 2.4 : 2}/><span>{item.label}</span>
      </Link></li>;
    })}</ul>
  </nav>;
}
