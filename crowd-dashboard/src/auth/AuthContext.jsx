import { createContext, useCallback, useContext, useMemo, useState } from "react";
import { login as apiLogin } from "../api/analytics";
import { tokenStore } from "../api/client";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [token, setToken] = useState(() => tokenStore.get());

  const login = useCallback(async (email, password) => {
    const t = await apiLogin(email, password);
    tokenStore.set(t);
    setToken(t);
  }, []);

  const logout = useCallback(() => {
    tokenStore.clear();
    setToken(null);
  }, []);

  const value = useMemo(() => ({ token, isAuthenticated: !!token, login, logout }), [token, login, logout]);
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside AuthProvider");
  return ctx;
}
