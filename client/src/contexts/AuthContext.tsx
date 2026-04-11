import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import api from "../lib/api.js";
import { saveToken, getToken, removeToken, parseJwt, isTokenExpired } from "../lib/auth.js";
import type { AuthPayload, UserDTO, TenantDTO } from "../../../shared/types.js";

interface AuthState {
  user: UserDTO | null;
  tenant: TenantDTO | null;
  isAuth: boolean;
  loading: boolean;
}

interface AuthContextValue extends AuthState {
  login: (email: string, password: string) => Promise<void>;
  register: (data: RegisterData) => Promise<void>;
  logout: () => void;
  updateUser: (partial: Partial<UserDTO>) => void;
}

interface RegisterData {
  nombreConsultorio: string;
  nombre: string;
  email: string;
  especialidad: string;
  password: string;
  timezone: string;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<AuthState>({
    user: null,
    tenant: null,
    isAuth: false,
    loading: true,
  });

  // Rehydrate from localStorage on mount — fetch user profile from API
  useEffect(() => {
    const token = getToken();
    if (token && !isTokenExpired(token)) {
      api.get("/auth/me")
        .then(({ data }) => {
          setState({ user: data.user, tenant: data.tenant, isAuth: true, loading: false });
        })
        .catch(() => {
          removeToken();
          setState(s => ({ ...s, isAuth: false, loading: false }));
        });
    } else {
      removeToken();
      setState(s => ({ ...s, isAuth: false, loading: false }));
    }
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    const { data } = await api.post("/auth/login", { email, password });
    saveToken(data.token);
    setState({ user: data.user, tenant: data.tenant, isAuth: true, loading: false });
  }, []);

  const register = useCallback(async (formData: RegisterData) => {
    const { data } = await api.post("/auth/register", formData);
    saveToken(data.token);
    setState({ user: data.user, tenant: data.tenant, isAuth: true, loading: false });
  }, []);

  const logout = useCallback(() => {
    removeToken();
    setState({ user: null, tenant: null, isAuth: false, loading: false });
  }, []);

  const updateUser = useCallback((partial: Partial<UserDTO>) => {
    setState(s => ({
      ...s,
      user: s.user ? { ...s.user, ...partial } : null,
    }));
  }, []);

  return (
    <AuthContext.Provider value={{ ...state, login, register, logout, updateUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
