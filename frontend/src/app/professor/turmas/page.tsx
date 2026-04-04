'use client';

import { useEffect, useState } from 'react';
import { apiFetch } from '@/lib/api';
import Link from 'next/link';
import Navbar from '@/components/Navbar';
import ProtectedRoute from '@/components/ProtectedRoute';
import Loading from '@/components/Loading';
import NotaBadge from '@/components/NotaBadge';

interface TurmaInfo {
  turma: {
    id: number;
    nome: string;
    serie: string;
    turno: string;
    turno_display: string;
    sala: string;
  };
  total_alunos: number;
  media_turma: number;
  total_avaliacoes: number;
}

export default function ListaTurmasPage() {
  const [turmas, setTurmas] = useState<TurmaInfo[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    apiFetch<TurmaInfo[]>('/professor/turmas/')
      .then(setTurmas)
      .finally(() => setLoading(false));
  }, []);

  return (
    <ProtectedRoute tipo="professor">
      <Navbar />
      <main className="container fade-in">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
          <h1>Minhas Turmas</h1>
          <span className="badge">{turmas.length} turmas</span>
        </div>

        {loading ? <Loading /> : turmas.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">🏫</div>
            <h2>Nenhuma turma associada</h2>
            <p>Você não possui turmas cadastradas. Contate o administrador.</p>
          </div>
        ) : (
          <div className="turmas-grid">
            {turmas.map(({ turma, total_alunos, media_turma, total_avaliacoes }) => (
              <div key={turma.id} className="card">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div>
                    <h2 style={{ marginBottom: '0.5rem' }}>{turma.nome}</h2>
                    {turma.serie && <p><strong>Série:</strong> {turma.serie}</p>}
                    <p><strong>Turno:</strong> {turma.turno_display}</p>
                    {turma.sala && <p><strong>Sala:</strong> {turma.sala}</p>}
                  </div>
                  <NotaBadge nota={media_turma} />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', margin: '1.5rem 0' }}>
                  <div className="stat-card" style={{ padding: '1.5rem' }}>
                    <div style={{ fontSize: '2.5rem', fontWeight: 700 }}>{total_alunos}</div>
                    <p style={{ margin: 0, fontSize: '1.3rem' }}>Alunos</p>
                  </div>
                  <div className="stat-card" style={{ padding: '1.5rem' }}>
                    <div style={{ fontSize: '2.5rem', fontWeight: 700 }}>{total_avaliacoes}</div>
                    <p style={{ margin: 0, fontSize: '1.3rem' }}>Avaliações</p>
                  </div>
                </div>

                <Link href={`/professor/turma/${turma.id}`} className="btn btn-primary" style={{ display: 'block', textAlign: 'center' }}>
                  <span className="material-icons-outlined">people</span>
                  Ver Carômetro
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
