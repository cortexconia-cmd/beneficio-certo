import { Link, useRouterState } from "@tanstack/react-router";
import { Home, LayoutGrid, Heart, LifeBuoy } from "lucide-react";
import { cn } from "@/lib/utils";

const items = [
  { to: "/", label: "Início", icon: Home, exact: true },
  { to: "/beneficios", label: "Benefícios", icon: LayoutGrid, exact: false },
  { to: "/favoritos", label: "Favoritos", icon: Heart, exact: false },
  { to: "/ajuda", label: "Ajuda", icon: LifeBuoy, exact: false },
] as const;

export function MobileBottomNav() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });

  return (
    <nav
      aria-label="Navegação principal"
      className="lg:hidden fixed bottom-0 inset-x-0 z-40 border-t border-border bg-white/95 backdrop-blur-xl pb-[env(safe-area-inset-bottom)]"
    >
      <ul className="grid grid-cols-4">
        {items.map((item) => {
          const Icon = item.icon;
          const active = item.exact
            ? pathname === item.to
            : pathname === item.to || pathname.startsWith(`${item.to}/`);
          return (
            <li key={item.to}>
              <Link
                to={item.to}
                className={cn(
                  "flex flex-col items-center justify-center gap-1 py-2.5 min-h-14 text-[11px] font-medium transition-colors",
                  active ? "text-primary" : "text-muted-foreground hover:text-foreground",
                )}
              >
                <Icon
                  className={cn("h-5 w-5", active && "fill-primary/10")}
                  strokeWidth={active ? 2.4 : 2}
                />
                <span>{item.label}</span>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}