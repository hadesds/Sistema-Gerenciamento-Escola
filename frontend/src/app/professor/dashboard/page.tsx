'use client';

import { useEffect, useState } from 'react';
import { apiFetch } from '@/lib/api';
import Navbar from '@/components/Navbar';
import ProtectedRoute from '@/components/ProtectedRoute';
import Loading from '@/components/Loading';
import NotaBadge from '@/components/NotaBadge';

interface DashboardData {
  total_alunos: number;
  total_turmas: number;
  total_questoes: number;
  total_simulados: number;
  avaliacoes_recentes: Array<{
    id: number;
    aluno_nome: string;
    aluno_turma: string;
    media: number;
    data: string;
  }>;
  top_alunos: Array<{
    id: number;
    nome: string;
    media_geral: number;
    turma: string;
    foto_url: string | null;
  }>;
  desempenho_turmas: Array<{
    turma: string;
    media: number;
    total_alunos: number;
    total_avaliacoes: number;
  }>;
}

export default function ProfessorDashboardPage() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    apiFetch<DashboardData>('/professor/dashboard/')
      .then(setData)
      .finally(() => setLoading(false));
  }, []);

  return (
    <ProtectedRoute tipo="professor">
      <Navbar />
      <main className="container fade-in">
        <h1>Dashboard do Professor</h1>

        {loading ? <Loading /> : data && (
          <>
            <div className="stats-grid">
              <div className="stat-card">
                <div className="stat-icon">
                  <span className="material-icons-outlined">groups</span>
                </div>
                <div className="stat-info">
                  <h3>{data.total_alunos}</h3>
                  <p>Total de Alunos</p>
                </div>
              </div>
              <div className="stat-card">
                <div className="stat-icon">
                  <span className="material-icons-outlined">class</span>
                </div>
                <div className="stat-info">
                  <h3>{data.total_turmas}</h3>
                  <p>Turmas</p>
                </div>
              </div>
              <div className="stat-card">
                <div className="stat-icon">
                  <span className="material-icons-outlined">quiz</span>
                </div>
                <div className="stat-info">
                  <h3>{data.total_questoes}</h3>
                  <p>Questões</p>
                </div>
              </div>
              <div className="stat-card">
                <div className="stat-icon">
                  <span className="material-icons-outlined">assignment</span>
                </div>
                <div className="stat-info">
                  <h3>{data.total_simulados}</h3>
                  <p>Simulados</p>
                </div>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem' }}>
              {/* Top Alunos */}
              <div className="card">
                <h2>🏆 Top Alunos</h2>
                {data.top_alunos.length === 0 ? (
                  <p>Nenhuma avaliação registrada ainda.</p>
                ) : (
                  <div>
                    {data.top_alunos.map((aluno, idx) => (
                      <div key={aluno.id} style={{ display: 'flex', alignItems: 'center', gap: '1.5rem', padding: '1rem 0', borderBottom: '1px solid var(--border-light)' }}>
                        <div className={`stat-circle ${idx === 0 ? 'first-place' : idx === 1 ? 'second-place' : idx === 2 ? 'third-place' : ''}`}>
                          {idx + 1}
                        </div>
                        <div style={{ flex: 1 }}>
                          <strong style={{ fontSize: '1.5rem' }}>{aluno.nome}</strong>
                          <p style={{ margin: 0 }}>{aluno.turma}</p>
                        </div>
                        <NotaBadge nota={aluno.media_geral} />
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Desempenho por Turma */}
              <div className="card">
                <h2>📊 Desempenho por Turma</h2>
                {data.desempenho_turmas.length === 0 ? (
                  <p>Nenhuma avaliação registrada ainda.</p>
                ) : (
                  data.desempenho_turmas.map((t) => (
                    <div key={t.turma} style={{ marginBottom: '1.5rem' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                        <strong style={{ fontSize: '1.5rem' }}>{t.turma}</strong>
                        <NotaBadge nota={t.media} />
                      </div>
                      <div className="progress-bar">
                        <div
                          className="progress-fill"
                          style={{ width: `${(t.media / 5) * 100}%`, background: 'linear-gradient(135deg, var(--color-primary), var(--color-terciaria))' }}
                        />
                      </div>
                      <p style={{ margin: 0 }}>{t.total_alunos} alunos · {t.total_avaliacoes} avaliações</p>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Avaliações Recentes */}
            <div className="card mt-2">
              <h2>📋 Avaliações Recentes (últimos 7 dias)</h2>
              {data.avaliacoes_recentes.length === 0 ? (
                <p>Nenhuma avaliação nos últimos 7 dias.</p>
              ) : (
                <table className="feedback-table">
                  <thead>
                    <tr>
                      <th>Aluno</th>
                      <th>Turma</th>
                      <th>Média</th>
                      <th>Data</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.avaliacoes_recentes.map((av) => (
                      <tr key={av.id}>
                        <td>{av.aluno_nome}</td>
                        <td>{av.aluno_turma}</td>
                        <td><NotaBadge nota={av.media} /></td>
                        <td>{new Date(av.data).toLocaleDateString('pt-BR')}</td>
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
