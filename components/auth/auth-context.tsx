"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";

export type RoleSummary = {
  id: number;
  name: string;
  slug: string;
};

export type AuthUser = {
  id: number;
  name: string;
  email: string;
  username: string | null;
  phone: string | null;
  avatar: string | null;
  is_active: boolean;
  must_change_password: boolean;
  student: { id: number } | null;
  teacher: { id: number } | null;
  role: RoleSummary | null;
};

type AuthState =
  | { status: "loading"; user: null }
  | { status: "authed"; user: AuthUser }
  | { status: "guest"; user: null };

type AuthContextValue = AuthState & {
  refresh: () => Promise<void>;
  /** Clears session cookie server-side, then you should navigate (e.g. `window.location.replace("/login")`). */
  logout: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<AuthState>({
    status: "loading",
    user: null,
  });

  const refresh = useCallback(async () => {
    try {
      const res = await fetch("/api/auth/me", { cache: "no-store" });
      if (!res.ok) {
        setState({ status: "guest", user: null });
        return;
      }
      let body: unknown;
      try {
        body = await res.json();
      } catch {
        setState({ status: "guest", user: null });
        return;
      }
      const user = (body as { data?: { user?: AuthUser } } | null)?.data?.user;
      if (user) {
        setState({ status: "authed", user });
        return;
      }
      setState({ status: "guest", user: null });
    } catch {
      setState({ status: "guest", user: null });
    }
  }, []);

  const logout = useCallback(async () => {
    setState({ status: "guest", user: null });
    await fetch("/api/auth/logout", {
      method: "POST",
      credentials: "include",
      keepalive: true,
    });
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const value = useMemo<AuthContextValue>(
    () => ({
      ...state,
      refresh,
      logout,
    }),
    [state, refresh, logout]
  );

  return (
    <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error("useAuth must be used within AuthProvider");
  }
  return ctx;
}
