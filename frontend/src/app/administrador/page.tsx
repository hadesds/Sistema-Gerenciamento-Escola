'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Loading from '@/components/Loading';

export default function AdminIndexPage() {
  const router = useRouter();

  useEffect(() => {
    router.replace('/administrador/mural');
  }, [router]);

  return <Loading />;
}
