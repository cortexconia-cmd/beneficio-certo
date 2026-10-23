import { useCallback, useEffect, useState } from "react";
import type { User } from "@/lib/types";

const KEY = "pb:user";
const EVENT = "pb:user-changed";

function read(): User | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(KEY);
    return raw ? (JSON.parse(raw) as User) : null;
  } catch {
    return null;
  }
}

export function useAuth() {
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    setUser(read());
    const handler = () => setUser(read());
    window.addEventListener(EVENT, handler);
    window.addEventListener("storage", handler);
    return () => {
      window.removeEventListener(EVENT, handler);
      window.removeEventListener("storage", handler);
    };
  }, []);

  const login = useCallback((u: User) => {
    window.localStorage.setItem(KEY, JSON.stringify(u));
    window.dispatchEvent(new CustomEvent(EVENT));
  }, []);

  const logout = useCallback(() => {
    window.localStorage.removeItem(KEY);
    window.dispatchEvent(new CustomEvent(EVENT));
  }, []);

  return { user, login, logout };
}
