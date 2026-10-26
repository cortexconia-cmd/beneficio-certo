import { useEffect, useState, useCallback } from "react";

const STORAGE_KEY = "pb:favorites";

function read(): string[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function emitChange() {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new Event("pb:favorites-changed"));
}

export function useFavorites() {
  const [favorites, setFavorites] = useState<string[]>([]);

  useEffect(() => {
    setFavorites(read());
    const sync = () => setFavorites(read());
    window.addEventListener("pb:favorites-changed", sync);
    window.addEventListener("storage", sync);
    return () => {
      window.removeEventListener("pb:favorites-changed", sync);
      window.removeEventListener("storage", sync);
    };
  }, []);

  const toggle = useCallback((slug: string) => {
    const current = read();
    const next = current.includes(slug)
      ? current.filter((s) => s !== slug)
      : [...current, slug];
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    emitChange();
  }, []);

  const isFavorite = useCallback(
    (slug: string) => favorites.includes(slug),
    [favorites],
  );

  return { favorites, toggle, isFavorite };
}