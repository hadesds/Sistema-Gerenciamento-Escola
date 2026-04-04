'use client';

import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import Loading from './Loading';

interface ProtectedRouteProps {
  children: React.ReactNode;
  tipo?: 'professor' | 'aluno';
}

export default function ProtectedRoute({ children, tipo }: ProtectedRouteProps) {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading) {
      if (!user) {
        router.push('/login');
      } else if (tipo && user.tipo !== tipo) {
        if (user.tipo === 'professor') router.push('/professor/dashboard');
        else if (user.tipo === 'aluno') router.push('/aluno/dashboard');
        else router.push('/login');
      }
    }
  }, [user, loading, tipo, router]);

  if (loading || !user) return <Loading />;
  if (tipo && user.tipo !== tipo) return <Loading />;

  return <>{children}</>;
}
