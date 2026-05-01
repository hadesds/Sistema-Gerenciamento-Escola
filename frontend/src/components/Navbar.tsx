'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import { usePathname } from 'next/navigation';

export default function Navbar() {
  const { user, logout } = useAuth();
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  if (!user) return null;

  const close = () => setOpen(false);

  const homeHref = user.tipo === 'professor' ? '/professor/dashboard' : '/aluno/dashboard';

  const professorLinks = [
    { href: '/professor/dashboard',    icon: 'home',          label: 'Início' },
    { href: '/professor/turmas',       icon: 'groups',        label: 'Minhas Turmas' },
    { href: '/professor/banco-questoes', icon: 'library_books', label: 'Banco de Questões' },
    { href: '/professor/criar-simulado', icon: 'edit_note',    label: 'Criar Simulado' },
    { href: '/professor/simulados',    icon: 'folder_special', label: 'Meus Simulados' },
  ];

  const alunoLinks = [
    { href: '/aluno/dashboard',        icon: 'home',          label: 'Início' },
    { href: '/aluno/meu-feedback',     icon: 'assessment',    label: 'Meu Feedback' },
    { href: '/aluno/meus-simulados',   icon: 'quiz',          label: 'Simulados' },
    ...(user.papel === 'lider' || user.papel === 'vice'
      ? [{ href: '/aluno/assiduidade', icon: 'checklist',     label: 'Assiduidade' }]
      : []),
  ];

  const links = user.tipo === 'professor' ? professorLinks : alunoLinks;

  const roleLabel =
    user.tipo === 'professor' ? 'Professor' :
    user.papel === 'lider'    ? 'Líder de Turma' :
    user.papel === 'vice'     ? 'Vice-Líder'     : 'Aluno';

  const initials = user.nome_completo
    .split(' ')
    .slice(0, 2)
    .map((n: string) => n[0])
    .join('')
    .toUpperCase();

  return (
    <>
      <style>{`
        /* ── Botão de acionar (3 pontos) ── */
        .sb-trigger {
          position: fixed;
          top: 1.6rem;
          left: 1.6rem;
          z-index: 200;
          width: 4.4rem;
          height: 4.4rem;
          border-radius: 50%;
          background: linear-gradient(135deg, #0d2d6b, #1a73c7);
          border: none;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          box-shadow: 0 4px 14px rgba(13,45,107,0.4);
          transition: transform 0.2s, box-shadow 0.2s;
        }
        .sb-trigger:hover {
          transform: scale(1.08);
          box-shadow: 0 6px 20px rgba(13,45,107,0.5);
        }
        .sb-trigger .material-icons-outlined {
          font-size: 2.2rem;
          color: #fff;
        }

        /* ── Overlay ── */
        .sb-overlay {
          position: fixed;
          inset: 0;
          background: rgba(10, 20, 50, 0.5);
          z-index: 300;
          opacity: 0;
          pointer-events: none;
          transition: opacity 0.28s ease;
          backdrop-filter: blur(2px);
        }
        .sb-overlay.open {
          opacity: 1;
          pointer-events: all;
        }

        /* ── Painel lateral ── */
        .sb-panel {
          position: fixed;
          top: 0;
          left: 0;
          width: 29rem;
          height: 100vh;
          background: #fff;
          z-index: 400;
          display: flex;
          flex-direction: column;
          box-shadow: 4px 0 32px rgba(13,45,107,0.18);
          transform: translateX(-100%);
          transition: transform 0.3s cubic-bezier(0.4, 0, 0.2, 1);
          overflow: hidden;
        }
        .sb-panel.open {
          transform: translateX(0);
        }

        /* ── Cabeçalho do painel ── */
        .sb-head {
          background: linear-gradient(135deg, #0d2d6b, #1a4fa0);
          padding: 2.4rem 2rem 2rem;
          display: flex;
          flex-direction: column;
          gap: 1.6rem;
          position: relative;
        }
        .sb-close {
          position: absolute;
          top: 1.2rem;
          right: 1.2rem;
          background: rgba(255,255,255,0.15);
          border: none;
          border-radius: 50%;
          width: 3.2rem;
          height: 3.2rem;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          color: #fff;
          transition: background 0.2s;
        }
        .sb-close:hover { background: rgba(255,255,255,0.28); }
        .sb-close .material-icons-outlined { font-size: 1.8rem; }

        .sb-brand {
          display: flex;
          align-items: center;
          gap: 1rem;
        }
        .sb-brand img {
          height: 3.6rem;
          width: auto;
          border-radius: 0.5rem;
        }
        .sb-brand-name {
          color: #fff;
          font-weight: 800;
          font-size: 1.8rem;
          letter-spacing: 0.06em;
          line-height: 1;
        }
        .sb-brand-sub {
          color: rgba(255,255,255,0.6);
          font-size: 1.1rem;
          font-weight: 500;
        }

        .sb-user {
          display: flex;
          align-items: center;
          gap: 1.2rem;
        }
        .sb-avatar {
          width: 4.4rem;
          height: 4.4rem;
          border-radius: 50%;
          background: rgba(255,255,255,0.2);
          border: 2px solid rgba(255,255,255,0.35);
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 1.6rem;
          font-weight: 700;
          color: #fff;
          flex-shrink: 0;
        }
        .sb-user-name {
          color: #fff;
          font-size: 1.45rem;
          font-weight: 600;
          line-height: 1.3;
        }
        .sb-user-role {
          color: rgba(255,255,255,0.65);
          font-size: 1.2rem;
          font-weight: 400;
        }

        /* ── Links de navegação ── */
        .sb-nav {
          flex: 1;
          overflow-y: auto;
          padding: 1.4rem 1.2rem;
          display: flex;
          flex-direction: column;
          gap: 0.3rem;
        }
        .sb-nav-section {
          font-size: 1.1rem;
          font-weight: 700;
          color: #94a3b8;
          text-transform: uppercase;
          letter-spacing: 0.08em;
          padding: 0.8rem 1rem 0.4rem;
        }
        .sb-link {
          display: flex;
          align-items: center;
          gap: 1.2rem;
          padding: 1.1rem 1.2rem;
          border-radius: 1rem;
          text-decoration: none;
          color: #1a2a4a;
          font-size: 1.45rem;
          font-weight: 500;
          transition: background 0.15s, color 0.15s;
        }
        .sb-link:hover {
          background: #f0f4fb;
          color: #0d2d6b;
        }
        .sb-link.active {
          background: #e8f0fc;
          color: #0d2d6b;
          font-weight: 700;
        }
        .sb-link .material-icons-outlined {
          font-size: 2.1rem;
          color: #4a6080;
          flex-shrink: 0;
          transition: color 0.15s;
        }
        .sb-link:hover .material-icons-outlined,
        .sb-link.active .material-icons-outlined {
          color: #1a73c7;
        }
        .sb-link-active-bar {
          display: none;
          width: 0.35rem;
          height: 1.6rem;
          background: #1a73c7;
          border-radius: 1rem;
          margin-left: auto;
        }
        .sb-link.active .sb-link-active-bar { display: block; }

        .sb-divider {
          height: 1px;
          background: #e8f0fc;
          margin: 0.8rem 1.2rem;
        }

        /* ── Rodapé do painel ── */
        .sb-foot {
          padding: 1.6rem 1.2rem;
          border-top: 1px solid #e8f0fc;
        }
        .sb-logout {
          width: 100%;
          display: flex;
          align-items: center;
          gap: 1.2rem;
          padding: 1.1rem 1.2rem;
          border-radius: 1rem;
          border: none;
          background: none;
          cursor: pointer;
          color: #e74c3c;
          font-size: 1.45rem;
          font-weight: 600;
          font-family: 'Poppins', sans-serif;
          transition: background 0.15s;
          text-align: left;
        }
        .sb-logout:hover { background: #fef0f0; }
        .sb-logout .material-icons-outlined {
          font-size: 2.1rem;
          color: #e74c3c;
        }

        /* ── Espaçador de conteúdo (compensa o botão fixo) ── */
        .sb-content-offset {
          padding-top: 0;
        }

        @media (max-width: 480px) {
          .sb-panel { width: 85vw; }
        }
      `}</style>

      {/* Botão de 3 pontos */}
      <button className="sb-trigger" onClick={() => setOpen(true)} aria-label="Abrir menu">
        <span className="material-icons-outlined">more_vert</span>
      </button>

      {/* Overlay */}
      <div className={`sb-overlay${open ? ' open' : ''}`} onClick={close} />

      {/* Painel */}
      <aside className={`sb-panel${open ? ' open' : ''}`} aria-hidden={!open}>

        {/* Cabeçalho */}
        <div className="sb-head">
          <button className="sb-close" onClick={close} aria-label="Fechar menu">
            <span className="material-icons-outlined">close</span>
          </button>

          <div className="sb-brand">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/logo_escola.png" alt="CARA" />
            <div>
              <div className="sb-brand-name">CARA</div>
              <div className="sb-brand-sub">Gestão Escolar</div>
            </div>
          </div>

          <div className="sb-user">
            <div className="sb-avatar">{initials}</div>
            <div>
              <div className="sb-user-name">{user.nome_completo}</div>
              <div className="sb-user-role">{roleLabel}</div>
            </div>
          </div>
        </div>

        {/* Links */}
        <nav className="sb-nav">
          <div className="sb-nav-section">Navegação</div>

          {links.map(l => (
            <Link
              key={l.href}
              href={l.href}
              className={`sb-link${pathname === l.href ? ' active' : ''}`}
              onClick={close}
            >
              <span className="material-icons-outlined">{l.icon}</span>
              {l.label}
              <span className="sb-link-active-bar" />
            </Link>
          ))}

          <div className="sb-divider" />
          <div className="sb-nav-section">Conta</div>

          <Link href={homeHref} className="sb-link" onClick={close}>
            <span className="material-icons-outlined">account_circle</span>
            Meu Perfil
          </Link>
        </nav>

        {/* Rodapé — logout */}
        <div className="sb-foot">
          <button className="sb-logout" onClick={() => { close(); logout(); }}>
            <span className="material-icons-outlined">logout</span>
            Sair da conta
          </button>
        </div>
      </aside>
    </>
  );
}
