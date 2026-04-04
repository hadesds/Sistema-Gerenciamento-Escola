'use client';

import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';

export default function Navbar() {
  const { user, logout } = useAuth();

  if (!user) return null;

  return (
    <header className="navbar">
      <div className="logo-container">
        <h1>CARA</h1>
      </div>

      <nav>
        <span className="user-greeting">
          Olá, <strong>{user.nome_completo}</strong>
        </span>

        <Link href={user.tipo === 'professor' ? '/professor/dashboard' : '/aluno/dashboard'}>
          <span className="material-icons-outlined">home</span>
          Início
        </Link>

        {user.tipo === 'professor' && (
          <>
            <Link href="/professor/turmas">
              <span className="material-icons-outlined">groups</span>
              Minhas Turmas
            </Link>
            <Link href="/professor/banco-questoes">
              <span className="material-icons-outlined">quiz</span>
              Questões
            </Link>
            <Link href="/professor/criar-simulado">
              <span className="material-icons-outlined">assignment</span>
              Criar Simulado
            </Link>
          </>
        )}

        {user.tipo === 'aluno' && (
          <>
            <Link href="/aluno/meu-feedback">
              <span className="material-icons-outlined">assessment</span>
              Meu Feedback
            </Link>
            <Link href="/aluno/meus-simulados">
              <span className="material-icons-outlined">quiz</span>
              Simulados
            </Link>
          </>
        )}

        <button onClick={logout} className="btn btn-secondary" style={{ marginLeft: '1rem' }}>
          <span className="material-icons-outlined">logout</span>
          Sair
        </button>
      </nav>
    </header>
  );
}
