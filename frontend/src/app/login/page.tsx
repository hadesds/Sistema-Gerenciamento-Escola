'use client';

import { useState } from 'react';
import Image from 'next/image';
import { useAuth } from '@/context/AuthContext';

export default function LoginPage() {
  const { login } = useAuth();
  const [username, setUsername]   = useState('');
  const [password, setPassword]   = useState('');
  const [showPass, setShowPass]   = useState(false);
  const [error, setError]         = useState('');
  const [loading, setLoading]     = useState(false);
  const [userFocus, setUserFocus] = useState(false);
  const [passFocus, setPassFocus] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await login(username, password);
    } catch {
      setError('Usuário ou senha inválidos. Tente novamente.');
    } finally {
      setLoading(false);
    }
  }

  const inputBase: React.CSSProperties = {
    width: '100%',
    border: 'none',
    outline: 'none',
    background: 'transparent',
    fontSize: '1.55rem',
    color: '#1a2a4a',
    fontFamily: "'Poppins', sans-serif",
    padding: '0.2rem 0',
  };

  const wrapStyle = (focused: boolean): React.CSSProperties => ({
    display: 'flex',
    alignItems: 'center',
    gap: '1rem',
    border: `2px solid ${focused ? '#1a73c7' : '#d0daea'}`,
    borderRadius: '1.2rem',
    padding: '1.2rem 1.6rem',
    background: focused ? '#f5f9ff' : '#fafbfd',
    transition: 'border-color 0.2s, background 0.2s',
    boxShadow: focused ? '0 0 0 4px rgba(26,115,199,0.1)' : 'none',
  });

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #0d2d6b 0%, #1a4fa0 50%, #1a73c7 100%)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '2rem',
      fontFamily: "'Poppins', sans-serif",
      position: 'relative',
      overflow: 'hidden',
    }}>

      {/* Círculos decorativos */}
      <div style={{
        position: 'absolute', top: '-12rem', right: '-12rem',
        width: '50rem', height: '50rem', borderRadius: '50%',
        background: 'rgba(255,255,255,0.05)', pointerEvents: 'none',
      }} />
      <div style={{
        position: 'absolute', bottom: '-10rem', left: '-10rem',
        width: '38rem', height: '38rem', borderRadius: '50%',
        background: 'rgba(255,255,255,0.04)', pointerEvents: 'none',
      }} />
      <div style={{
        position: 'absolute', top: '35%', left: '4%',
        width: '18rem', height: '18rem', borderRadius: '50%',
        background: 'rgba(255,255,255,0.03)', pointerEvents: 'none',
      }} />

      {/* Card */}
      <div style={{
        background: '#ffffff',
        borderRadius: '2.4rem',
        padding: '4rem 4.5rem 4.5rem',
        width: '100%',
        maxWidth: '46rem',
        boxShadow: '0 24px 60px rgba(13,45,107,0.4)',
        position: 'relative',
        zIndex: 1,
      }}>

        {/* Logo */}
        <div style={{ textAlign: 'center', marginBottom: '3.2rem' }}>
          <div style={{
            display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
            width: '9rem', height: '9rem', borderRadius: '2rem',
            background: 'linear-gradient(135deg, #0d2d6b, #1a73c7)',
            marginBottom: '1.8rem',
            boxShadow: '0 8px 24px rgba(13,45,107,0.3)',
          }}>
            <Image
              src="/logo_escola.png"
              alt="Logo CARA"
              width={60}
              height={60}
              style={{ width: '6rem', height: '6rem', objectFit: 'contain', borderRadius: '1rem' }}
            />
          </div>
          <h1 style={{
            fontSize: '2.8rem', fontWeight: 800,
            color: '#0d2d6b', letterSpacing: '0.06em',
            marginBottom: '0.4rem',
          }}>
            CARA
          </h1>
          <p style={{ fontSize: '1.4rem', color: '#4a6080', fontWeight: 500 }}>
            Gestão Escolar Inteligente
          </p>
        </div>

        <h2 style={{
          fontSize: '2rem', fontWeight: 700, color: '#0d2d6b',
          marginBottom: '2.8rem', textAlign: 'center',
        }}>
          Acesse sua conta
        </h2>

        {/* Alerta de erro */}
        {error && (
          <div style={{
            background: '#fef0f0', border: '1.5px solid #fca5a5',
            borderRadius: '1rem', padding: '1.2rem 1.6rem',
            marginBottom: '2rem', display: 'flex', alignItems: 'center', gap: '1rem',
            color: '#b91c1c', fontSize: '1.4rem', fontWeight: 500,
          }}>
            <span className="material-icons-outlined" style={{ fontSize: '2rem', color: '#ef4444', flexShrink: 0 }}>
              error_outline
            </span>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>

          {/* Campo usuário */}
          <div>
            <label style={{
              display: 'block', fontSize: '1.4rem',
              fontWeight: 600, color: '#0d2d6b', marginBottom: '0.8rem',
            }}>
              Usuário
            </label>
            <div style={wrapStyle(userFocus)}>
              <span className="material-icons-outlined" style={{
                fontSize: '2.2rem',
                color: userFocus ? '#1a73c7' : '#94a3b8',
                flexShrink: 0,
                transition: 'color 0.2s',
              }}>
                person_outline
              </span>
              <input
                id="username"
                type="text"
                value={username}
                onChange={e => setUsername(e.target.value)}
                onFocus={() => setUserFocus(true)}
                onBlur={() => setUserFocus(false)}
                placeholder="Digite seu usuário"
                required
                autoComplete="username"
                style={inputBase}
              />
            </div>
          </div>

          {/* Campo senha */}
          <div>
            <label style={{
              display: 'block', fontSize: '1.4rem',
              fontWeight: 600, color: '#0d2d6b', marginBottom: '0.8rem',
            }}>
              Senha
            </label>
            <div style={wrapStyle(passFocus)}>
              <span className="material-icons-outlined" style={{
                fontSize: '2.2rem',
                color: passFocus ? '#1a73c7' : '#94a3b8',
                flexShrink: 0,
                transition: 'color 0.2s',
              }}>
                lock_outline
              </span>
              <input
                id="password"
                type={showPass ? 'text' : 'password'}
                value={password}
                onChange={e => setPassword(e.target.value)}
                onFocus={() => setPassFocus(true)}
                onBlur={() => setPassFocus(false)}
                placeholder="Digite sua senha"
                required
                autoComplete="current-password"
                style={inputBase}
              />
              <button
                type="button"
                onClick={() => setShowPass(v => !v)}
                title={showPass ? 'Ocultar senha' : 'Mostrar senha'}
                style={{
                  background: 'none', border: 'none', cursor: 'pointer',
                  padding: '0.2rem', display: 'flex', alignItems: 'center',
                  color: '#94a3b8', flexShrink: 0, transition: 'color 0.2s',
                }}
                onMouseEnter={e => (e.currentTarget.style.color = '#1a73c7')}
                onMouseLeave={e => (e.currentTarget.style.color = '#94a3b8')}
              >
                <span className="material-icons-outlined" style={{ fontSize: '2.2rem' }}>
                  {showPass ? 'visibility_off' : 'visibility'}
                </span>
              </button>
            </div>
          </div>

          {/* Botão entrar */}
          <button
            type="submit"
            disabled={loading}
            style={{
              marginTop: '0.4rem',
              background: loading
                ? '#a8c4e8'
                : 'linear-gradient(135deg, #0d2d6b, #1a73c7)',
              color: '#fff',
              border: 'none',
              borderRadius: '1.2rem',
              padding: '1.5rem',
              fontSize: '1.65rem',
              fontWeight: 700,
              fontFamily: "'Poppins', sans-serif",
              cursor: loading ? 'not-allowed' : 'pointer',
              width: '100%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '0.8rem',
              boxShadow: loading ? 'none' : '0 6px 20px rgba(13,45,107,0.35)',
              transition: 'opacity 0.2s, box-shadow 0.2s',
            }}
          >
            {loading ? (
              <>
                <span className="material-icons-outlined" style={{ fontSize: '2rem', animation: 'spin 1s linear infinite' }}>
                  autorenew
                </span>
                Entrando...
              </>
            ) : (
              <>
                Entrar
                <span className="material-icons-outlined" style={{ fontSize: '2rem' }}>arrow_forward</span>
              </>
            )}
          </button>
        </form>

        <p style={{ textAlign: 'center', marginTop: '3rem', color: '#94a3b8', fontSize: '1.3rem' }}>
          &copy; 2025 Sistema CARA — Gestão Escolar Inteligente
        </p>
      </div>

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
