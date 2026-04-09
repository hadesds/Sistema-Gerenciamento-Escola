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
  notas_por_epoca: Record<string, Record<string, number>>;
  medias_materias: Record<string, number>;
  media_geral_materias: number | null;
}

const CRITERIOS = [
  { key: 'assiduidade'      as const, label: 'Assiduidade' },
  { key: 'participacao'     as const, label: 'Participação' },
  { key: 'responsabilidade' as const, label: 'Responsabilidade' },
  { key: 'sociabilidade'    as const, label: 'Sociabilidade' },
];

const EPOCAS_ORDER = ['1° Bimestre', '2° Bimestre', '3° Bimestre', '4° Bimestre'];

function notaColor(nota: number) {
  if (nota >= 7) return 'var(--color-success)';
  if (nota >= 5) return 'var(--color-warning)';
  return 'var(--color-danger)';
}

export default function MeuFeedbackPage() {
  const [data, setData] = useState<FeedbackData | null>(null);
  const [loading, setLoading] = useState(true);
  const [abaAtiva, setAbaAtiva] = useState<'comportamento' | 'notas'>('comportamento');

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
            {/* Stats resumo */}
            <div className="stats-grid">
              <div className="stat-card">
                <div className="stat-icon"><span className="material-icons-outlined">grade</span></div>
                <div className="stat-info"><h3>{data.media_geral.toFixed(2)}</h3><p>Média Comportamental</p></div>
              </div>
              {data.media_geral_materias !== null && (
                <div className="stat-card">
                  <div className="stat-icon"><span className="material-icons-outlined">school</span></div>
                  <div className="stat-info"><h3>{data.media_geral_materias.toFixed(2)}</h3><p>Média Geral Matérias</p></div>
                </div>
              )}
              {CRITERIOS.map(c => (
                <div key={c.key} className="stat-card">
                  <div className="stat-icon"><span className="material-icons-outlined">analytics</span></div>
                  <div className="stat-info"><h3>{data.medias[c.key].toFixed(2)}</h3><p>{c.label}</p></div>
                </div>
              ))}
            </div>

            {/* Abas */}
            <div style={{ display: 'flex', gap: '1rem', marginBottom: '2rem' }}>
              <button
                className={`btn ${abaAtiva === 'comportamento' ? 'btn-primary' : 'btn-secondary'}`}
                onClick={() => setAbaAtiva('comportamento')}
              >
                <span className="material-icons-outlined">psychology</span>
                Comportamento
              </button>
              <button
                className={`btn ${abaAtiva === 'notas' ? 'btn-primary' : 'btn-secondary'}`}
                onClick={() => setAbaAtiva('notas')}
              >
                <span className="material-icons-outlined">school</span>
                Notas por Matéria
              </button>
            </div>

            {/* Aba Comportamento */}
            {abaAtiva === 'comportamento' && (
              <>
                <div className="card mb-2">
                  <h2>Desempenho Comportamental</h2>
                  {CRITERIOS.map(c => (
                    <div key={c.key} style={{ marginBottom: '2rem' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                        <strong style={{ fontSize: '1.5rem' }}>{c.label}</strong>
                        <span>{data.medias[c.key].toFixed(2)} / 5.00 ({Math.round((data.medias[c.key] / 5) * 100)}%)</span>
                      </div>
                      <div className="progress-bar" style={{ height: '1.8rem' }}>
                        <div className="progress-fill" style={{
                          width: `${(data.medias[c.key] / 5) * 100}%`,
                          background: 'linear-gradient(135deg, var(--color-bar-light), var(--color-bar-accent))',
                        }} />
                      </div>
                    </div>
                  ))}
                </div>

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

            {/* Aba Notas por Matéria */}
            {abaAtiva === 'notas' && (
              <>
                {Object.keys(data.notas_por_epoca).length === 0 ? (
                  <div className="empty-state">
                    <div className="empty-icon">📚</div>
                    <h2>Nenhuma nota lançada ainda</h2>
                    <p>Aguarde seu professor lançar as notas por matéria.</p>
                  </div>
                ) : (() => {
                  const epocasPresentes = EPOCAS_ORDER.filter(e => data.notas_por_epoca[e]);
                  const materias = Object.keys(data.medias_materias);
                  return (
                    <>
                      {/* Tabela geral */}
                      <div className="card mb-2">
                        <h2>Notas por Bimestre</h2>
                        <div style={{ overflowX: 'auto' }}>
                          <table className="feedback-table">
                            <thead>
                              <tr>
                                <th>Matéria</th>
                                {epocasPresentes.map(e => <th key={e}>{e}</th>)}
                                <th>Média</th>
                              </tr>
                            </thead>
                            <tbody>
                              {materias.map(mat => (
                                <tr key={mat}>
                                  <td><strong>{mat}</strong></td>
                                  {epocasPresentes.map(e => {
                                    const nota = data.notas_por_epoca[e]?.[mat];
                                    return (
                                      <td key={e}>
                                        {nota !== undefined
                                          ? <span style={{ fontWeight: 600, color: notaColor(nota) }}>{nota.toFixed(1)}</span>
                                          : <span style={{ color: 'var(--text-secondary)' }}>–</span>}
                                      </td>
                                    );
                                  })}
                                  <td>
                                    <span style={{ fontWeight: 700, color: notaColor(data.medias_materias[mat]) }}>
                                      {data.medias_materias[mat].toFixed(2)}
                                    </span>
                                  </td>
                                </tr>
                              ))}
                              <tr style={{ background: 'var(--bg-card-add)' }}>
                                <td><strong>Média Geral</strong></td>
                                {epocasPresentes.map(e => {
                                  const vals = Object.values(data.notas_por_epoca[e] || {}) as number[];
                                  const avg = vals.length ? vals.reduce((a, b) => a + b, 0) / vals.length : null;
                                  return (
                                    <td key={e}>
                                      {avg !== null
                                        ? <strong style={{ color: notaColor(avg) }}>{avg.toFixed(2)}</strong>
                                        : '–'}
                                    </td>
                                  );
                                })}
                                <td>
                                  {data.media_geral_materias !== null && (
                                    <strong style={{ color: notaColor(data.media_geral_materias) }}>
                                      {data.media_geral_materias.toFixed(2)}
                                    </strong>
                                  )}
                                </td>
                              </tr>
                            </tbody>
                          </table>
                        </div>
                      </div>

                      {/* Cards por bimestre */}
                      {epocasPresentes.map(ep => (
                        <div key={ep} className="card mb-2">
                          <h2>{ep}</h2>
                          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '1.5rem' }}>
                            {Object.entries(data.notas_por_epoca[ep]).map(([mat, nota]) => (
                              <div key={mat} style={{ padding: '1.5rem', borderRadius: '1.2rem', background: 'var(--bg-tab)', textAlign: 'center' }}>
                                <p style={{ margin: 0, marginBottom: '0.8rem', fontWeight: 600 }}>{mat}</p>
                                <div style={{ fontSize: '2.8rem', fontWeight: 700, color: notaColor(nota) }}>
                                  {(nota as number).toFixed(1)}
                                </div>
                                <div className="progress-bar" style={{ marginTop: '0.8rem' }}>
                                  <div className="progress-fill" style={{
                                    width: `${((nota as number) / 10) * 100}%`,
                                    background: notaColor(nota),
                                  }} />
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      ))}
                    </>
                  );
                })()}
              </>
            )}
          </>
        )}
      </main>
      <footer style={{ textAlign: 'center', padding: '3rem 2rem', color: 'var(--text-secondary)', fontSize: '1.4rem' }}>
        <p>&copy; 2025 Sistema CARA - Gestão Escolar Inteligente</p>
      </footer>
    </ProtectedRoute>
  );
}
