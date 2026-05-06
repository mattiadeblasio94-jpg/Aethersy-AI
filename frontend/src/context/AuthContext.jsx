import React, { createContext, useContext, useEffect, useState } from "react";
import { api } from "../lib/api";

const AuthCtx = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    const raw = localStorage.getItem("e360_user");
    return raw ? JSON.parse(raw) : null;
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Skip auth check during OAuth callback — AuthCallback handles it
    if (window.location.hash?.includes("session_id=")) {
      setLoading(false);
      return;
    }
    const token = localStorage.getItem("e360_token");
    if (!token) { setLoading(false); return; }
    api.get("/auth/me").then((r) => {
      setUser(r.data);
      localStorage.setItem("e360_user", JSON.stringify(r.data));
    }).catch(() => {
      localStorage.removeItem("e360_token");
      localStorage.removeItem("e360_user");
      setUser(null);
    }).finally(() => setLoading(false));
  }, []);

  const login = async (email, password) => {
    const r = await api.post("/auth/login", { email, password });
    localStorage.setItem("e360_token", r.data.token);
    localStorage.setItem("e360_user", JSON.stringify(r.data.user));
    setUser(r.data.user);
    return r.data.user;
  };

  const register = async (email, password, name) => {
    const r = await api.post("/auth/register", { email, password, name });
    localStorage.setItem("e360_token", r.data.token);
    localStorage.setItem("e360_user", JSON.stringify(r.data.user));
    setUser(r.data.user);
    return r.data.user;
  };

  const logout = () => {
    localStorage.removeItem("e360_token");
    localStorage.removeItem("e360_user");
    setUser(null);
    window.location.href = "/login";
  };

  return (
    <AuthCtx.Provider value={{ user, login, register, logout, loading }}>
      {children}
    </AuthCtx.Provider>
  );
}

export const useAuth = () => useContext(AuthCtx);
