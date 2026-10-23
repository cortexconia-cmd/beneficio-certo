import { Search } from "lucide-react";
import { useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { cn } from "@/lib/utils";

interface Props {
  size?: "sm" | "lg";
  defaultValue?: string;
  className?: string;
}

export function SearchBar({ size = "sm", defaultValue = "", className }: Props) {
  const [value, setValue] = useState(defaultValue);
  const navigate = useNavigate();

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        navigate({ to: "/beneficios", search: { q: value, category: "" } });
      }}
      className={cn("relative w-full", className)}
    >
      <Search
        className={cn(
          "absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none",
          size === "lg" ? "size-5" : "size-4",
        )}
      />
      <input
        type="search"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        placeholder="Buscar benefícios, ex: Bolsa Família, Auxílio Gás..."
        className={cn(
          "w-full rounded-full border border-border bg-card pl-12 pr-4 outline-none transition-all",
          "focus:border-primary focus:ring-4 focus:ring-primary/10",
          size === "lg" ? "h-14 text-base shadow-card" : "h-10 text-sm",
        )}
      />
    </form>
  );
}
