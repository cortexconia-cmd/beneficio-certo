import { Link, useLocation } from "@tanstack/react-router";
import { useState } from "react";
import { Menu, User, LogOut, Plus } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { SearchBar } from "@/components/benefits/SearchBar";
import { LoginDialog } from "./LoginDialog";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Sheet, SheetContent, SheetTrigger, SheetTitle, SheetHeader } from "@/components/ui/sheet";
import { cn } from "@/lib/utils";

const nav = [
  { to: "/", label: "Início" },
  { to: "/beneficios", label: "Benefícios" },
  { to: "/guia", label: "Guia 2026" },
  { to: "/favoritos", label: "Favoritos" },
  { to: "/atualizacoes", label: "Atualizações" },
] as const;

export function Header() {
  const { user, logout } = useAuth();
  const [loginOpen, setLoginOpen] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const location = useLocation();

  return (
    <header className="sticky top-0 z-40 w-full border-b border-border bg-background/85 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-7xl items-center gap-4 px-4 sm:px-6 lg:px-8">
        <Link to="/" className="flex items-center gap-1.5 shrink-0">
          <span className="font-semibold text-lg tracking-tight">Projeto</span>
          <span className="inline-flex items-center justify-center size-6 rounded-md bg-primary text-primary-foreground">
            <Plus className="size-3.5" strokeWidth={3} />
          </span>
          <span className="font-semibold text-lg tracking-tight">Benefícios</span>
        </Link>

        <div className="hidden md:block flex-1 max-w-md mx-auto">
          <SearchBar />
        </div>

        <nav className="hidden lg:flex items-center gap-1">
          {nav.map((item) => {
            const active =
              item.to === "/"
                ? location.pathname === "/"
                : location.pathname.startsWith(item.to);
            return (
              <Link
                key={item.to}
                to={item.to}
                className={cn(
                  "px-3 py-2 rounded-lg text-sm font-medium transition-colors",
                  active ? "text-primary bg-primary-soft" : "text-foreground/70 hover:text-foreground hover:bg-muted",
                )}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="flex items-center gap-2 ml-auto lg:ml-0">
          {user ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" className="gap-2">
                  <span className="inline-flex size-7 items-center justify-center rounded-full bg-primary text-primary-foreground text-xs font-semibold">
                    {user.name.charAt(0).toUpperCase()}
                  </span>
                  <span className="hidden sm:inline text-sm">{user.name}</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuLabel>
                  <div className="font-medium">{user.name}</div>
                  <div className="text-xs font-normal text-muted-foreground">{user.email}</div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
                  <Link to="/favoritos">Meus favoritos</Link>
                </DropdownMenuItem>
                <DropdownMenuItem onClick={logout}>
                  <LogOut className="size-4 mr-2" /> Sair
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <Button size="sm" onClick={() => setLoginOpen(true)} className="gap-2">
              <User className="size-4" />
              <span className="hidden sm:inline">Entrar</span>
            </Button>
          )}

          <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="lg:hidden">
                <Menu />
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-72 p-0">
              <SheetHeader className="p-6 border-b">
                <SheetTitle>Menu</SheetTitle>
              </SheetHeader>
              <div className="p-4 space-y-4">
                <SearchBar />
                <nav className="flex flex-col gap-1">
                  {nav.map((item) => (
                    <Link
                      key={item.to}
                      to={item.to}
                      onClick={() => setMobileOpen(false)}
                      className="px-3 py-2.5 rounded-lg text-sm font-medium hover:bg-muted"
                    >
                      {item.label}
                    </Link>
                  ))}
                </nav>
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>

      <LoginDialog open={loginOpen} onOpenChange={setLoginOpen} />
    </header>
  );
}
