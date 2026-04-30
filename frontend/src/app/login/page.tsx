'use client';

import { useState } from 'react';
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

  return (
    <>
      <style>{`
        html, body { margin: 0; padding: 0; height: 100%; }

        .login-page {
          min-height: 100vh;
          background: linear-gradient(135deg, #0d2d6b 0%, #1a4fa0 50%, #1a73c7 100%);
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 2rem;
          font-family: 'Poppins', sans-serif;
          position: relative;
          overflow: hidden;
          box-sizing: border-box;
        }

        .login-deco {
          position: absolute;
          border-radius: 50%;
          pointer-events: none;
        }

        .login-card {
          background: #ffffff;
          border-radius: 2rem;
          padding: 3.6rem 4rem;
          width: 100%;
          max-width: 44rem;
          box-shadow: 0 20px 56px rgba(13, 45, 107, 0.38);
          position: relative;
          z-index: 1;
          box-sizing: border-box;
        }

        .login-logo-area {
          text-align: center;
          margin-bottom: 2.8rem;
        }

        .login-logo-img {
          width: 8rem;
          height: 8rem;
          object-fit: contain;
          margin-bottom: 1.2rem;
          display: block;
          margin-left: auto;
          margin-right: auto;
        }

        .login-title {
          font-size: 2.6rem;
          font-weight: 800;
          color: #0d2d6b;
          letter-spacing: 0.06em;
          margin: 0 0 0.3rem;
        }

        .login-subtitle {
          font-size: 1.4rem;
          color: #4a6080;
          font-weight: 500;
          margin: 0;
        }

        .login-heading {
          font-size: 1.9rem;
          font-weight: 700;
          color: #0d2d6b;
          text-align: center;
          margin: 0 0 2.6rem;
        }

        .login-error {
          background: #fef0f0;
          border: 1.5px solid #fca5a5;
          border-radius: 1rem;
          padding: 1.1rem 1.4rem;
          margin-bottom: 1.8rem;
          display: flex;
          align-items: center;
          gap: 0.9rem;
          color: #b91c1c;
          font-size: 1.4rem;
          font-weight: 500;
        }

        .login-form {
          display: flex;
          flex-direction: column;
          gap: 1.8rem;
        }

        .login-field {
          display: flex;
          flex-direction: column;
          gap: 0.7rem;
        }

        .login-label {
          font-size: 1.4rem;
          font-weight: 600;
          color: #0d2d6b;
        }

        .login-input-wrap {
          display: flex;
          align-items: center;
          gap: 0.9rem;
          border: 2px solid #d0daea;
          border-radius: 1.1rem;
          padding: 1.1rem 1.4rem;
          background: #fafbfd;
          transition: border-color 0.2s, background 0.2s, box-shadow 0.2s;
          box-sizing: border-box;
        }

        .login-input-wrap.focused {
          border-color: #1a73c7;
          background: #f5f9ff;
          box-shadow: 0 0 0 3px rgba(26, 115, 199, 0.12);
        }

        .login-input-wrap .icon {
          font-size: 2.1rem;
          color: #b0bec5;
          flex-shrink: 0;
          transition: color 0.2s;
          user-select: none;
        }

        .login-input-wrap.focused .icon {
          color: #1a73c7;
        }

        .login-input-wrap input {
          flex: 1;
          min-width: 0;
          border: none;
          outline: none;
          background: transparent;
          font-size: 1.5rem;
          color: #1a2a4a;
          font-family: 'Poppins', sans-serif;
          padding: 0;
        }

        .login-input-wrap input::placeholder {
          color: #b0bec5;
        }

        .toggle-pass {
          background: none;
          border: none;
          cursor: pointer;
          padding: 0.2rem;
          display: flex;
          align-items: center;
          color: #b0bec5;
          flex-shrink: 0;
          transition: color 0.2s;
          line-height: 1;
        }

        .toggle-pass:hover {
          color: #1a73c7;
        }

        .toggle-pass .material-icons-outlined {
          font-size: 2.1rem;
        }

        .login-btn {
          margin-top: 0.4rem;
          background: linear-gradient(135deg, #0d2d6b, #1a73c7);
          color: #fff;
          border: none;
          border-radius: 1.1rem;
          padding: 1.4rem;
          font-size: 1.6rem;
          font-weight: 700;
          font-family: 'Poppins', sans-serif;
          cursor: pointer;
          width: 100%;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 0.8rem;
          box-shadow: 0 6px 18px rgba(13, 45, 107, 0.32);
          transition: opacity 0.2s;
        }

        .login-btn:disabled {
          background: #a8c4e8;
          box-shadow: none;
          cursor: not-allowed;
        }

        .login-btn .material-icons-outlined {
          font-size: 2rem;
        }

        .login-footer {
          text-align: center;
          margin-top: 2.6rem;
          color: #94a3b8;
          font-size: 1.25rem;
        }

        @keyframes spin { to { transform: rotate(360deg); } }
        .spin { animation: spin 1s linear infinite; }

        /* Tablet */
        @media (max-width: 600px) {
          .login-card {
            padding: 2.8rem 2.4rem;
            border-radius: 1.6rem;
            max-width: 100%;
          }
          .login-logo-img {
            width: 6.4rem;
            height: 6.4rem;
          }
          .login-title { font-size: 2.2rem; }
          .login-heading { font-size: 1.7rem; margin-bottom: 2rem; }
        }

        /* Mobile pequeno */
        @media (max-width: 380px) {
          .login-page { padding: 1.2rem; }
          .login-card { padding: 2.4rem 1.8rem; }
          .login-input-wrap { padding: 1rem 1.1rem; }
        }
      `}</style>

      <div className="login-page">

        {/* Círculos decorativos */}
        <div className="login-deco" style={{ top: '-12rem', right: '-12rem', width: '48rem', height: '48rem', background: 'rgba(255,255,255,0.05)' }} />
        <div className="login-deco" style={{ bottom: '-10rem', left: '-10rem', width: '36rem', height: '36rem', background: 'rgba(255,255,255,0.04)' }} />
        <div className="login-deco" style={{ top: '38%', left: '3%', width: '16rem', height: '16rem', background: 'rgba(255,255,255,0.03)' }} />

        {/* Card */}
        <div className="login-card">

          {/* Logo sem fundo */}
          <div className="login-logo-area">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/logo_escola.png" alt="Logo CARA" className="login-logo-img" />
            <h1 className="login-title">CARA</h1>
            <p className="login-subtitle">Gestão Escolar Inteligente</p>
          </div>

          <h2 className="login-heading">Acesse sua conta</h2>

          {error && (
            <div className="login-error">
              <span className="material-icons-outlined" style={{ fontSize: '2rem', color: '#ef4444', flexShrink: 0 }}>error_outline</span>
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="login-form">

            {/* Usuário */}
            <div className="login-field">
              <label htmlFor="username" className="login-label">Usuário</label>
              <div className={`login-input-wrap${userFocus ? ' focused' : ''}`}>
                <span className="material-icons-outlined icon">person_outline</span>
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
                />
              </div>
            </div>

            {/* Senha */}
            <div className="login-field">
              <label htmlFor="password" className="login-label">Senha</label>
              <div className={`login-input-wrap${passFocus ? ' focused' : ''}`}>
                <span className="material-icons-outlined icon">lock_outline</span>
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
                />
                <button
                  type="button"
                  className="toggle-pass"
                  onClick={() => setShowPass(v => !v)}
                  title={showPass ? 'Ocultar senha' : 'Mostrar senha'}
                >
                  <span className="material-icons-outlined">
                    {showPass ? 'visibility_off' : 'visibility'}
                  </span>
                </button>
              </div>
            </div>

            <button type="submit" className="login-btn" disabled={loading}>
              {loading ? (
                <>
                  <span className="material-icons-outlined spin">autorenew</span>
                  Entrando...
                </>
              ) : (
                <>
                  Entrar
                  <span className="material-icons-outlined">arrow_forward</span>
                </>
              )}
            </button>
          </form>

          <p className="login-footer">&copy; 2025 Sistema CARA — Gestão Escolar Inteligente</p>
        </div>
      </div>
    </>
  );
}
