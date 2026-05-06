'use client';

import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { API_URL, apiFetch, login as apiLogin, logout as apiLogout, isAuthenticated } from '@/lib/api';
import { useRouter } from 'next/navigation';

interface User {
  id: number;
  username: string;
  first_name: string;
  last_name: string;
  email: string;
  tipo: 'admin' | 'professor' | 'aluno' | 'unknown';
  nome_completo: string;
  papel: 'lider' | 'vice' | null;
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (username: string, password: string) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    if (isAuthenticated()) {
      apiFetch<User>('/me/')
        .then(setUser)
        .catch(() => setUser(null))
        .finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, []);

  async function login(username: string, password: string) {
    await apiLogin(username, password);
    const userData = await apiFetch<User>('/me/');
    setUser(userData);
    if (userData.tipo === 'admin') {
      window.location.href = `${API_URL}/admin/`;
    } else if (userData.tipo === 'professor') {
      router.push('/professor/dashboard');
    } else if (userData.tipo === 'aluno') {
      router.push('/aluno/dashboard');
    } else {
      router.push('/login');
    }
  }

  function logout() {
    apiLogout();
    setUser(null);
    router.push('/');
  }

  return (
    <AuthContext.Provider value={{ user, loading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth deve ser usado dentro de AuthProvider');
  return ctx;
}
