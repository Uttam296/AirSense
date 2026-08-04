import { createContext, useContext, useState, useCallback } from "react";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [token, setToken] = useState(() => sessionStorage.getItem("token"));
  const [userId, setUserId] = useState(() => sessionStorage.getItem("userId"));

  const login = useCallback((newToken, newUserId) => {
    sessionStorage.setItem("token", newToken);
    sessionStorage.setItem("userId", newUserId);
    setToken(newToken);
    setUserId(newUserId);
  }, []);

  const logout = useCallback(() => {
    sessionStorage.removeItem("token");
    sessionStorage.removeItem("userId");
    setToken(null);
    setUserId(null);
  }, []);

  const value = { token, userId, isAuthenticated: !!token, login, logout };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
