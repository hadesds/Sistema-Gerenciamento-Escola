'use client';

import { useEffect, useState } from 'react';
import { apiFetch } from '@/lib/api';
import Navbar from '@/components/Navbar';
import ProtectedRoute from '@/components/ProtectedRoute';
import Loading from '@/components/Loading';
import NotaBadge from '@/components/NotaBadge';

interface LinhaNota {
  sigla: string;
  nome: string;
  av1: number | null;
  av2: number | null;
  av3: number | null;
  final: number;
}

interface PendenteQuestao {
  questao_enunciado: string;
}

interface ResultadoSimuladoFeedback {
  resultado_id: number;
  simulado_id: number;
  titulo: string;
  av_tipo: string;
  av_tipo_display: string;
  area: string;
  area_display: string;
  epoca: string;
  epoca_display: string;
  nota: number | null;
  status: 'pendente_correcao' | 'corrigido';
  status_display: string;
  enviado_em: string | null;
  pendentes: PendenteQuestao[];
}

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
  consolidado: Record<string, LinhaNota[]>;
  resultados_simulados: ResultadoSimuladoFeedback[];
}

const CRITERIOS = [
  { key: 'assiduidade'      as const, label: 'Assiduidade' },
  { key: 'participacao'     as const, label: 'Participação' },
  { key: 'responsabilidade' as const, label: 'Responsabilidade' },
  { key: 'sociabilidade'    as const, label: 'Sociabilidade' },
];

const EPOCAS = [
  { key: '1B', label: '1° Bimestre' },
  { key: '2B', label: '2° Bimestre' },
  { key: '3B', label: '3° Bimestre' },
  { key: '4B', label: '4° Bimestre' },
];

function notaColor(nota: number) {
  if (nota >= 7) return 'var(--color-success)';
  if (nota >= 5) return 'var(--color-warning)';
  return 'var(--color-danger)';
}

function fmt(v: number | null) {
  return v == null ? '–' : v.toFixed(1);
}

export default function MeuFeedbackPage() {
  const [data, setData] = useState<FeedbackData | null>(null);
  const [loading, setLoading] = useState(true);
  const [abaAtiva, setAbaAtiva] = useState<'comportamento' | 'notas' | 'simulados'>('comportamento');
  const [bimestre, setBimestre] = useState('1B');

  useEffect(() => {
    apiFetch<FeedbackData>('/aluno/meu-feedback/')
      .then(setData)
      .finally(() => setLoading(false));
  }, []);

  const linhasBimestre = data?.consolidado[bimestre] ?? [];

  // Média geral de notas (0-10) considerando todas as disciplinas com alguma nota lançada.
  const mediaGeralNotas = (() => {
    if (!data) return null;
    const finais: number[] = [];
    Object.values(data.consolidado).forEach(linhas => {
      linhas.forEach(l => {
        if (l.av1 != null || l.av2 != null || l.av3 != null) finais.push(l.final);
      });
    });
    return finais.length ? finais.reduce((a, b) => a + b, 0) / finais.length : null;
  })();

  const pendentesTotal = data?.resultados_simulados.filter(r => r.status === 'pendente_correcao').length ?? 0;

  return (
    <ProtectedRoute tipo="aluno">
      <Navbar />
      <main className="container fade-in">
        <style>{`
          .bim-tabs { display:flex; gap:0.8rem; flex-wrap:wrap; margin-bottom:2rem; }
          .table-scroll { overflow-x:auto; border-radius:1.2rem; }
          .sim-fb-card { border:1px solid var(--border-light); border-left:4px solid var(--color-primary); border-radius:1rem; padding:1.5rem; margin-bottom:1.2rem; }
          .sim-fb-header { display:flex; justify-content:space-between; align-items:flex-start; gap:1rem; flex-wrap:wrap; }
          .sim-fb-badges { display:flex; gap:0.5rem; flex-wrap:wrap; margin-top:0.5rem; }
          .sim-fb-badge { padding:0.3rem 0.8rem; border-radius:2rem; font-size:1.15rem; font-weight:600; background:var(--bg-tab); color:var(--text-secondary); }
          .sim-fb-pendente { display:inline-flex; align-items:center; gap:0.4rem; background:#fff3cd; color:#856404; padding:0.5rem 1rem; border-radius:0.8rem; font-size:1.3rem; font-weight:600; }
        `}</style>

        <h1>Meu Feedback e Notas</h1>

        {loading ? <Loading /> : !data ? null : (
          <>
            {/* Gradient summary card */}
            <div className="card mb-2" style={{ background: 'linear-gradient(135deg, var(--color-secondary), var(--color-terciaria))', color: 'white', textAlign: 'center', padding: '2.5rem' }}>
              <h3 style={{ color: 'white', marginBottom: '1.5rem', fontSize: '1.8rem' }}>Desempenho Geral</h3>
              <div style={{ display: 'flex', justifyContent: 'space-around', gap: '1.5rem', flexWrap: 'wrap' }}>
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                  <span style={{ fontSize: '4rem', fontWeight: 700, lineHeight: 1, marginBottom: '0.5rem' }}>{data.media_geral.toFixed(2)}</span>
                  <span style={{ fontSize: '1.5rem', color: 'rgba(255,255,255,0.8)' }}>Média Comportamental (Max: 5.0)</span>
                </div>
                {mediaGeralNotas !== null && (
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                    <span style={{ fontSize: '4rem', fontWeight: 700, lineHeight: 1, marginBottom: '0.5rem' }}>{mediaGeralNotas.toFixed(2)}</span>
                    <span style={{ fontSize: '1.5rem', color: 'rgba(255,255,255,0.8)' }}>Média Geral de Notas (Max: 10.0)</span>
                  </div>
                )}
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                  <span style={{ fontSize: '3rem', fontWeight: 700, lineHeight: 1, marginBottom: '0.5rem' }}>{data.avaliacoes.length}</span>
                  <span style={{ fontSize: '1.5rem', color: 'rgba(255,255,255,0.8)' }}>Avaliações Recebidas</span>
                </div>
              </div>
            </div>

            {/* Abas */}
            <div style={{ display: 'flex', gap: '1rem', marginBottom: '2rem', flexWrap: 'wrap' }}>
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
              <button
                className={`btn ${abaAtiva === 'simulados' ? 'btn-primary' : 'btn-secondary'}`}
                onClick={() => setAbaAtiva('simulados')}
              >
                <span className="material-icons-outlined">quiz</span>
                Simulados
                {pendentesTotal > 0 && (
                  <span style={{ background: '#f39c12', color: 'white', borderRadius: '10rem', padding: '0.1rem 0.7rem', fontSize: '1.2rem', marginLeft: '0.4rem' }}>
                    {pendentesTotal}
                  </span>
                )}
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

            {/* Aba Notas por Matéria (AV1/AV2/AV3 por bimestre) */}
            {abaAtiva === 'notas' && (
              <>
                <div className="bim-tabs">
                  {EPOCAS.map((ep) => (
                    <button
                      key={ep.key}
                      className={`btn${bimestre === ep.key ? ' btn-primary' : ' btn-secondary'}`}
                      onClick={() => setBimestre(ep.key)}
                    >
                      {ep.label}
                    </button>
                  ))}
                </div>

                <div className="card">
                  <p style={{ fontSize: '1.3rem', color: 'var(--text-secondary)', marginBottom: '1.2rem' }}>
                    AV1/AV2 são geradas automaticamente pelos simulados. AV3 é a nota qualitativa da disciplina.
                    Média final por disciplina = (AV1 + AV2 + AV3) ÷ 3. Nota ausente conta como 0.
                  </p>
                  <div className="table-scroll">
                    <table className="feedback-table">
                      <thead>
                        <tr>
                          <th>Disciplina</th>
                          <th>AV1</th>
                          <th>AV2</th>
                          <th>AV3</th>
                          <th>Média Final</th>
                        </tr>
                      </thead>
                      <tbody>
                        {linhasBimestre.map((l) => (
                          <tr key={l.sigla}>
                            <td><strong>{l.nome}</strong></td>
                            <td>{fmt(l.av1)}</td>
                            <td>{fmt(l.av2)}</td>
                            <td>{fmt(l.av3)}</td>
                            <td>
                              <strong style={{ color: notaColor(l.final), fontSize: '1.5rem' }}>
                                {l.final.toFixed(2)}
                              </strong>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </>
            )}

            {/* Aba Simulados */}
            {abaAtiva === 'simulados' && (
              <div className="card">
                {data.resultados_simulados.length === 0 ? (
                  <div className="empty-state">
                    <div className="empty-icon"><span className="material-icons-outlined" style={{ fontSize: '5rem' }}>quiz</span></div>
                    <p>Você ainda não respondeu nenhum simulado.</p>
                  </div>
                ) : (
                  data.resultados_simulados.map(r => (
                    <div key={r.resultado_id} className="sim-fb-card">
                      <div className="sim-fb-header">
                        <div>
                          <strong style={{ fontSize: '1.5rem' }}>{r.titulo}</strong>
                          <div className="sim-fb-badges">
                            {r.av_tipo_display && <span className="sim-fb-badge">{r.av_tipo_display}</span>}
                            {r.area_display && <span className="sim-fb-badge">{r.area_display}</span>}
                            {r.epoca_display && <span className="sim-fb-badge">{r.epoca_display}</span>}
                          </div>
                        </div>
                        {r.status === 'corrigido' && r.nota !== null ? (
                          <strong style={{ fontSize: '2rem', color: notaColor(r.nota) }}>{r.nota.toFixed(2)}</strong>
                        ) : (
                          <span className="sim-fb-pendente">
                            <span className="material-icons-outlined" style={{ fontSize: '1.6rem' }}>pending_actions</span>
                            Aguardando correção{r.pendentes.length > 0 ? ` (${r.pendentes.length} questão${r.pendentes.length > 1 ? 'ões' : ''})` : ''}
                          </span>
                        )}
                      </div>
                    </div>
                  ))
                )}
              </div>
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
