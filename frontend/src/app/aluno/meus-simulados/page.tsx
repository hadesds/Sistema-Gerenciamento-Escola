'use client';

import { useEffect, useState } from 'react';
import { apiFetch } from '@/lib/api';
import Link from 'next/link';
import Navbar from '@/components/Navbar';
import ProtectedRoute from '@/components/ProtectedRoute';
import Loading from '@/components/Loading';

interface Simulado {
  id: number;
  turma_nome: string;
  autor_nome: string;
  total_questoes: number;
  data_criacao: string;
}

export default function MeusSimuladosPage() {
  const [simulados, setSimulados] = useState<Simulado[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    apiFetch<Simulado[]>('/aluno/meus-simulados/')
      .then(setSimulados)
      .finally(() => setLoading(false));
  }, []);

  return (
    <ProtectedRoute tipo="aluno">
      <Navbar />
      <main className="container fade-in">
        <h1>Meus Simulados</h1>

        {loading ? <Loading /> : simulados.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">📝</div>
            <h2>Nenhum simulado disponível</h2>
            <p>Seu professor ainda não criou simulados para sua turma.</p>
          </div>
        ) : (
          <div className="turmas-grid">
            {simulados.map(s => (
              <div key={s.id} className="card">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.5rem' }}>
                  <h2 style={{ marginBottom: 0 }}>Simulado #{s.id}</h2>
                  <span className="badge">{s.total_questoes} questões</span>
                </div>
                <p><strong>Professor:</strong> {s.autor_nome}</p>
                <p><strong>Turma:</strong> {s.turma_nome}</p>
                <p><strong>Publicado em:</strong> {new Date(s.data_criacao).toLocaleDateString('pt-BR')}</p>
                <Link href={`/aluno/simulado/${s.id}`} className="btn btn-primary mt-2" style={{ display: 'block', textAlign: 'center' }}>
                  <span className="material-icons-outlined">play_circle</span>
                  Abrir Simulado
                </Link>
              </div>
            ))}
          </div>
        )}
      </main>
      <footer style={{ textAlign: 'center', padding: '3rem 2rem', color: 'var(--text-secondary)', fontSize: '1.4rem' }}>
        <p>&copy; 2025 Sistema CARA - Gestão Escolar Inteligente</p>
      </footer>
    </ProtectedRoute>
  );
}
