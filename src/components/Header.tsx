import { Link, useNavigate, useRouterState } from "@tanstack/react-router";
import { Search, Heart, Home, LayoutGrid, Bell, LifeBuoy, X, UserRound } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { LoginDialog } from "@/components/layout/LoginDialog";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { cn } from "@/lib/utils";

const navItems = [
  { to: "/", label: "Início", icon: Home },
  { to: "/beneficios", label: "Benefícios", icon: LayoutGrid },
  { to: "/favoritos", label: "Favoritos", icon: Heart },
  { to: "/atualizacoes", label: "Atualizações", icon: Bell },
  { to: "/ajuda", label: "Ajuda", icon: LifeBuoy },
] as const;

export function Header() {
  const navigate = useNavigate();
  const [query, setQuery] = useState("");
  const [searchOpen, setSearchOpen] = useState(false);
  const [loginOpen, setLoginOpen] = useState(false);
  const { user } = useAuth();
  const location = useRouterState({ select: (s) => s.location.pathname });

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    navigate({ to: "/beneficios", search: { q: query || undefined } as never });
    setSearchOpen(false);
  };

  return (
    <header className="sticky top-0 z-40 w-full border-b border-border bg-white/90 backdrop-blur-xl pt-[env(safe-area-inset-top)]">
      <div className="mx-auto flex h-14 sm:h-16 max-w-7xl items-center gap-2 sm:gap-4 px-3 sm:px-6">
        <Link to="/" className="flex items-center gap-2 shrink-0">
          <div className="grid h-9 w-9 place-items-center rounded-xl gradient-primary text-white font-bold">
            +
          </div>
          <span className="font-semibold tracking-tight text-foreground text-[15px] sm:text-base">
            <span className="hidden sm:inline">Projeto </span>
            <span className="text-primary">+ Benefícios</span>
          </span>
        </Link>

        <form
          onSubmit={submit}
          className="hidden md:flex flex-1 max-w-md mx-auto relative"
        >
          <Search className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Buscar benefícios, categorias..."
            className="w-full rounded-full border border-border bg-secondary/60 pl-10 pr-4 py-2 text-sm outline-none transition focus:border-primary focus:bg-white focus:ring-2 focus:ring-primary/20"
          />
        </form>

        <nav className="hidden lg:flex items-center gap-1">
          {navItems.map((item) => {
            const active =
              item.to === "/"
                ? location === "/"
                : location.startsWith(item.to);
            return (
              <Link
                key={item.to}
                to={item.to}
                className={cn(
                  "px-3 py-2 rounded-lg text-sm font-medium transition-colors",
                  active
                    ? "bg-primary-soft text-primary"
                    : "text-muted-foreground hover:text-foreground hover:bg-secondary",
                )}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="flex items-center gap-1 ml-auto">
          {user ? <Link to="/minha-conta" aria-label="Minha conta" className="inline-flex items-center gap-1 rounded-full border border-primary/20 px-3 py-2 text-sm font-medium text-primary hover:bg-primary-soft"><UserRound className="size-4"/> <span className="hidden sm:inline">Minha conta</span></Link>
          : <Button type="button" variant="outline" size="sm" className="rounded-full" onClick={() => setLoginOpen(true)}><UserRound className="mr-1 size-4"/> Entrar</Button>}
          <Sheet open={searchOpen} onOpenChange={setSearchOpen}>
            <SheetTrigger asChild>
              <Button
                size="icon"
                variant="ghost"
                className="md:hidden rounded-full h-11 w-11"
                aria-label="Buscar"
              >
                <Search className="h-5 w-5" />
              </Button>
            </SheetTrigger>
            <SheetContent side="top" className="p-4 pt-6">
              <form onSubmit={submit} className="relative mt-2">
                <Search className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <input
                  autoFocus
                  type="search"
                  inputMode="search"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Buscar benefícios..."
                  className="w-full rounded-full border border-border bg-white pl-11 pr-12 py-3 text-base outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
                />
                {query && (
                  <button
                    type="button"
                    onClick={() => setQuery("")}
                    aria-label="Limpar"
                    className="absolute right-3 top-1/2 -translate-y-1/2 h-7 w-7 grid place-items-center rounded-full text-muted-foreground hover:bg-secondary"
                  >
                    <X className="h-4 w-4" />
                  </button>
                )}
              </form>
              <Button type="submit" onClick={submit} className="mt-3 w-full rounded-full">
                Buscar
              </Button>
            </SheetContent>
          </Sheet>
        </div>
      </div>
      <LoginDialog open={loginOpen} onOpenChange={setLoginOpen} />
    </header>
  );
}