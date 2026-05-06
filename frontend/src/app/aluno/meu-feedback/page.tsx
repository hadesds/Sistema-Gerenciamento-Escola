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
            {/* Gradient summary card */}
            <div className="card mb-2" style={{ background: 'linear-gradient(135deg, var(--color-secondary), var(--color-terciaria))', color: 'white', textAlign: 'center', padding: '2.5rem' }}>
              <h3 style={{ color: 'white', marginBottom: '1.5rem', fontSize: '1.8rem' }}>Desempenho Geral</h3>
              <div style={{ display: 'flex', justifyContent: 'space-around', gap: '1.5rem', flexWrap: 'wrap' }}>
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                  <span style={{ fontSize: '4rem', fontWeight: 700, lineHeight: 1, marginBottom: '0.5rem' }}>{data.media_geral.toFixed(2)}</span>
                  <span style={{ fontSize: '1.5rem', color: 'rgba(255,255,255,0.8)' }}>Média Geral (Max: 5.0)</span>
                </div>
                {data.media_geral_materias !== null && (
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                    <span style={{ fontSize: '4rem', fontWeight: 700, lineHeight: 1, marginBottom: '0.5rem' }}>{data.media_geral_materias.toFixed(2)}</span>
                    <span style={{ fontSize: '1.5rem', color: 'rgba(255,255,255,0.8)' }}>Média Matérias (Max: 10.0)</span>
                  </div>
                )}
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                  <span style={{ fontSize: '3rem', fontWeight: 700, lineHeight: 1, marginBottom: '0.5rem' }}>{data.avaliacoes.length}</span>
                  <span style={{ fontSize: '1.5rem', color: 'rgba(255,255,255,0.8)' }}>Avaliações Recebidas</span>
                </div>
              </div>
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
                  <h2 style={{ color: 'var(--color-primary)' }}>Histórico de Avaliações</h2>
                  {data.avaliacoes.length === 0 ? (
                    <div className="empty-state">
                      <div className="empty-icon"><span className="material-icons-outlined" style={{ fontSize: '5rem' }}>bar_chart</span></div>
                      <p>Nenhuma avaliação registrada ainda.</p>
                    </div>
                  ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                      {data.avaliacoes.map(av => (
                        <div key={av.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1.5rem', border: '1px solid var(--border-light)', borderLeft: '4px solid var(--color-primary)', borderRadius: '1rem', flexWrap: 'wrap', gap: '1rem' }}>
                          <div style={{ minWidth: '12rem' }}>
                            <div style={{ fontWeight: 600, color: 'var(--color-primary)', fontSize: '1.5rem' }}>{new Date(av.data).toLocaleDateString('pt-BR')}</div>
                          </div>
                          <div style={{ display: 'flex', gap: '1.5rem', fontSize: '1.3rem', flex: 1, flexWrap: 'wrap' }}>
                            <span>A: <strong>{av.assiduidade}</strong></span>
                            <span>P: <strong>{av.participacao}</strong></span>
                            <span>R: <strong>{av.responsabilidade}</strong></span>
                            <span>S: <strong>{av.sociabilidade}</strong></span>
                          </div>
                          <NotaBadge nota={av.media} />
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </>
            )}

            {/* Aba Notas por Matéria */}
            {abaAtiva === 'notas' && (
              <>
                {Object.keys(data.notas_por_epoca).length === 0 ? (
                  <div className="empty-state">
                    <div className="empty-icon"><span className="material-icons-outlined" style={{ fontSize: '5rem' }}>menu_book</span></div>
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
