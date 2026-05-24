import Cookies from 'js-cookie';

// String vazia → URLs relativas (/api/...) — nginx roteia para o Django
// Valor explícito (ex.: http://localhost:5433) → acesso direto sem nginx
export const API_URL = (process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:5433').replace(/\/$/, '');

// Em produção (HTTPS), cookies cross-origin precisam de SameSite=None; Secure
const isSecure = typeof window !== 'undefined' && window.location.protocol === 'https:';

const COOKIE_OPTS_ACCESS:  Cookies.CookieAttributes = {
  expires: 1,
  sameSite: isSecure ? 'None' : 'Lax',
  secure:   isSecure,
};
const COOKIE_OPTS_REFRESH: Cookies.CookieAttributes = {
  expires: 7,
  sameSite: isSecure ? 'None' : 'Lax',
  secure:   isSecure,
};

export async function apiFetch<T>(
  path: string,
  options: RequestInit = {}
): Promise<T> {
  const token = Cookies.get('access_token');

  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...((options.headers as Record<string, string>) || {}),
  };

  const res = await fetch(`${API_URL}/api${path}`, { ...options, headers });

  if (res.status === 401) {
    const refreshed = await tryRefreshToken();
    if (refreshed) {
      const newToken = Cookies.get('access_token');
      const retryHeaders: HeadersInit = {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${newToken}`,
        ...((options.headers as Record<string, string>) || {}),
      };
      const retryRes = await fetch(`${API_URL}/api${path}`, { ...options, headers: retryHeaders });
      if (!retryRes.ok) throw new Error(await retryRes.text());
      return retryRes.json();
    } else {
      Cookies.remove('access_token');
      Cookies.remove('refresh_token');
      throw new Error('Sessão expirada');
    }
  }

  if (!res.ok) throw new Error(await res.text());
  if (res.status === 204) return {} as T;
  return res.json();
}

async function tryRefreshToken(): Promise<boolean> {
  const refresh = Cookies.get('refresh_token');
  if (!refresh) return false;
  try {
    const res = await fetch(`${API_URL}/api/token/refresh/`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refresh }),
    });
    if (!res.ok) return false;
    const data = await res.json();
    Cookies.set('access_token', data.access, COOKIE_OPTS_ACCESS);
    return true;
  } catch {
    return false;
  }
}

export async function login(username: string, password: string) {
  const res = await fetch(`${API_URL}/api/token/`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username, password }),
  });
  if (!res.ok) throw new Error('Credenciais inválidas');
  const data = await res.json();
  Cookies.set('access_token',  data.access,  COOKIE_OPTS_ACCESS);
  Cookies.set('refresh_token', data.refresh, COOKIE_OPTS_REFRESH);
  return data;
}

export function logout() {
  Cookies.remove('access_token');
  Cookies.remove('refresh_token');
}

export function isAuthenticated(): boolean {
  return !!Cookies.get('access_token');
}