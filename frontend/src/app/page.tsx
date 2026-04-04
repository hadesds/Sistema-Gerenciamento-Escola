'use client';

import { useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import Loading from '@/components/Loading';

export default function Home() {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading) {
      if (!user) {
        router.push('/login');
      } else if (user.tipo === 'professor') {
        router.push('/professor/dashboard');
      } else if (user.tipo === 'aluno') {
        router.push('/aluno/dashboard');
      } else {
        router.push('/login');
      }
    }
  }, [user, loading, router]);

  return <Loading />;
}
