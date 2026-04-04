'use client';

import { useEffect, useState } from 'react';
import { apiFetch } from '@/lib/api';
import Navbar from '@/components/Navbar';
import ProtectedRoute from '@/components/ProtectedRoute';
import Loading from '@/components/Loading';
import NotaBadge from '@/components/NotaBadge';

interface FeedbackData {
  aluno: { id: number; nome: string; foto_url: string | null };
  medias: {
    assiduidade: number;
    participacao: number;
    responsabilidade: number;
    sociabilidade: number;
  };
  media_geral: number;
  avaliacoes: Array<{
    id: number;
    assiduidade: number;
    participacao: number;
    responsabilidade: number;
    sociabilidade: number;
    media: number;
    data: string;
  }>;
}

const CRITERIOS = [
  { key: 'assiduidade' as const, label: 'Assiduidade' },
  { key: 'participacao' as const, label: 'Participação' },
  { key: 'responsabilidade' as const, label: 'Responsabilidade' },
  { key: 'sociabilidade' as const, label: 'Sociabilidade' },
];

export default function MeuFeedbackPage() {
  const [data, setData] = useState<FeedbackData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    apiFetch<FeedbackData>('/aluno/meu-feedback/')
      .then(setData)
      .finally(() => setLoading(false));
  }, []);

  return (
    <ProtectedRoute tipo="aluno">
      <Navbar />
      <main className="container fade-in">
        <h1>Meu Feedback</h1>

        {loading ? <Loading /> : !data ? null : (
          <>
            {/* Médias gerais */}
            <div className="stats-grid">
              <div className="stat-card">
                <div className="stat-icon"><span className="material-icons-outlined">grade</span></div>
                <div className="stat-info">
                  <h3>{data.media_geral.toFixed(2)}</h3>
                  <p>Média Geral</p>
                </div>
              </div>
              {CRITERIOS.map(c => (
                <div key={c.key} className="stat-card">
                  <div className="stat-icon"><span className="material-icons-outlined">analytics</span></div>
                  <div className="stat-info">
                    <h3>{data.medias[c.key].toFixed(2)}</h3>
                    <p>{c.label}</p>
                  </div>
                </div>
              ))}
            </div>

            {/* Barras de progresso */}
            <div className="card mb-2">
              <h2>Desempenho por Critério</h2>
              {CRITERIOS.map(c => (
                <div key={c.key} style={{ marginBottom: '2rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                    <strong style={{ fontSize: '1.5rem' }}>{c.label}</strong>
                    <span>{data.medias[c.key].toFixed(2)} / 5.00 ({Math.round((data.medias[c.key] / 5) * 100)}%)</span>
                  </div>
                  <div className="progress-bar" style={{ height: '1.8rem' }}>
                    <div
                      className="progress-fill"
                      style={{
                        width: `${(data.medias[c.key] / 5) * 100}%`,
                        background: 'linear-gradient(135deg, var(--color-bar-light), var(--color-bar-accent))',
                      }}
                    />
                  </div>
                </div>
              ))}
            </div>

            {/* Histórico */}
            <div className="card">
              <h2>Histórico de Avaliações</h2>
              {data.avaliacoes.length === 0 ? (
                <div className="empty-state">
                  <div className="empty-icon">📊</div>
                  <p>Nenhuma avaliação registrada ainda.</p>
                </div>
              ) : (
                <table className="feedback-table">
                  <thead>
                    <tr>
                      <th>Data</th>
                      <th>Assiduidade</th>
                      <th>Participação</th>
                      <th>Responsabilidade</th>
                      <th>Sociabilidade</th>
                      <th>Média</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.avaliacoes.map(av => (
                      <tr key={av.id}>
                        <td>{new Date(av.data).toLocaleDateString('pt-BR')}</td>
                        <td>{av.assiduidade}/5</td>
                        <td>{av.participacao}/5</td>
                        <td>{av.responsabilidade}/5</td>
                        <td>{av.sociabilidade}/5</td>
                        <td><NotaBadge nota={av.media} /></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </>
        )}
      </main>
      <footer style={{ textAlign: 'center', padding: '3rem 2rem', color: 'var(--text-secondary)', fontSize: '1.4rem' }}>
        <p>&copy; 2025 Sistema CARA - Gestão Escolar Inteligente</p>
      </footer>
    </ProtectedRoute>
  );
}
