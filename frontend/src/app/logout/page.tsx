'use client';

import { useEffect } from 'react';
import { logout as apiLogout } from '@/lib/api';

export default function Logout() {
  useEffect(() => {
    apiLogout();                  // remove access_token e refresh_token
    window.location.replace('/'); // volta para a tela inicial
  }, []);
  return null;
}
