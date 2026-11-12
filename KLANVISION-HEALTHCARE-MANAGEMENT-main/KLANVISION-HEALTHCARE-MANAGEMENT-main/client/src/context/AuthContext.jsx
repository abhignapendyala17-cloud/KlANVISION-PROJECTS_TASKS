import { createContext, useContext, useEffect, useMemo, useState } from "react";
import api, { errorMessage } from "../services/api";
import { useToast } from "./ToastContext";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const notify = useToast();
  const [user, setUser] = useState(() => {
    const stored = localStorage.getItem("healthcare-user");
    if (!stored) return null;
    try {
      return JSON.parse(stored);
    } catch {
      localStorage.removeItem("healthcare-user");
      return null;
    }
  });
  const [loading, setLoading] = useState(Boolean(localStorage.getItem("healthcare-token")));

  useEffect(() => {
    function clearSession() {
      localStorage.removeItem("healthcare-token");
      localStorage.removeItem("healthcare-user");
      setUser(null);
      setLoading(false);
    }
    window.addEventListener("healthcare:session-expired", clearSession);
    if (!localStorage.getItem("healthcare-token")) {
      setLoading(false);
      return () => window.removeEventListener("healthcare:session-expired", clearSession);
    }
    api
      .get("/auth/me")
      .then(({ data }) => setUser(data.user))
      .catch((error) => {
        if (error.response?.status !== 401) notify(errorMessage(error), "error");
      })
      .finally(() => setLoading(false));
    return () => window.removeEventListener("healthcare:session-expired", clearSession);
  }, [notify]);

  function saveSession(data) {
    localStorage.setItem("healthcare-token", data.token);
    localStorage.setItem("healthcare-user", JSON.stringify(data.user));
    setUser(data.user);
    return data.user;
  }

  async function login(credentials) {
    const { data } = await api.post("/auth/login", credentials);
    return saveSession(data);
  }

  async function register(details) {
    const { data } = await api.post("/auth/register", details);
    return saveSession(data);
  }

  async function logout() {
    try {
      if (localStorage.getItem("healthcare-token")) await api.post("/auth/logout");
    } finally {
      localStorage.removeItem("healthcare-token");
      localStorage.removeItem("healthcare-user");
      setUser(null);
      setLoading(false);
    }
  }

  const value = useMemo(
    () => ({ user, loading, login, register, logout }),
    [user, loading]
  );
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  return useContext(AuthContext);
}
