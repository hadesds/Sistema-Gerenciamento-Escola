'use client';

import { useEffect, useState } from 'react';
import { apiFetch } from '@/lib/api';
import Image from 'next/image';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import Navbar from '@/components/Navbar';
import ProtectedRoute from '@/components/ProtectedRoute';
import Loading from '@/components/Loading';
import NotaBadge from '@/components/NotaBadge';

interface RelatorioData {
  aluno: {
    id: number;
    nome: string;
    matricula: string | null;
    turma: string;
    foto_url: string | null;
  };
  medias: {
    assiduidade: number;
    participacao: number;
    responsabilidade: number;
    sociabilidade: number;
    assiduidade_percentual: number;
    participacao_percentual: number;
    responsabilidade_percentual: number;
    sociabilidade_percentual: number;
  };
  media_geral: number;
  total_avaliacoes: number;
  avaliacoes: Array<{
    id: number;
    assiduidade: number;
    participacao: number;
    responsabilidade: number;
    sociabilidade: number;
    media: number;
    data: string;
    materia_nome: string;
    observacao: string;
  }>;
  // provas individuais por matéria e bimestre
  provas_por_materia: Record<string, Record<string, number[]>>;
  medias_provas: Record<string, number>;
  media_geral_provas: number | null;
  // legado (NotaMateria)
  notas_por_epoca: Record<string, Record<string, number>>;
  medias_materias: Record<string, number>;
  media_geral_materias: number | null;
}

const CRITERIOS = [
  { key: 'assiduidade'      as const, label: 'Assiduidade',     pct: 'assiduidade_percentual'     as const },
  { key: 'participacao'     as const, label: 'Participação',    pct: 'participacao_percentual'    as const },
  { key: 'responsabilidade' as const, label: 'Responsabilidade', pct: 'responsabilidade_percentual' as const },
  { key: 'sociabilidade'    as const, label: 'Sociabilidade',   pct: 'sociabilidade_percentual'   as const },
];

const EPOCAS = [
  { key: '1B', label: '1° Bimestre' },
  { key: '2B', label: '2° Bimestre' },
  { key: '3B', label: '3° Bimestre' },
  { key: '4B', label: '4° Bimestre' },
];

const EPOCAS_ORDER = ['1° Bimestre', '2° Bimestre', '3° Bimestre', '4° Bimestre'];

function notaColor(nota: number) {
  if (nota >= 7) return 'var(--color-success)';
  if (nota >= 5) return 'var(--color-warning)';
  return 'var(--color-danger)';
}

function avg(arr: number[]): number | null {
  if (!arr.length) return null;
  return arr.reduce((a, b) => a + b, 0) / arr.length;
}

function escalaComportamento(nota: number): number {
  return parseFloat(((nota - 1) * (2.5 / 4)).toFixed(1));
}

export default function RelatorioAlunoPage() {
  const params = useParams();
  const alunoId = params.id as string;
  const [data, setData] = useState<RelatorioData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    apiFetch<RelatorioData>(`/professor/relatorio/${alunoId}/`)
      .then(setData)
      .finally(() => setLoading(false));
  }, [alunoId]);

  return (
    <ProtectedRoute tipo="professor">
      <Navbar />
      <main className="container fade-in">
        <style>{`
          .relatorio-page-header {
            display: flex; justify-content: space-between; align-items: center;
            flex-wrap: wrap; gap: 1.2rem; margin-bottom: 2rem;
          }
          .relatorio-page-header h1 { margin: 0; }
          @media (max-width: 900px) { .stats-grid { grid-template-columns: repeat(2, 1fr) !important; } }
          @media (max-width: 480px) { .stats-grid { grid-template-columns: 1fr !important; } }
          .stat-card { min-width: 0; overflow: hidden; }
          .stat-info { min-width: 0; overflow: hidden; }
          .stat-info h3 { white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
          .comportamento-row {
            display: flex; justify-content: space-between; align-items: baseline;
            flex-wrap: wrap; gap: 0.4rem; margin-bottom: 0.5rem;
          }
          .comportamento-row strong { font-size: 1.5rem; }
          .comportamento-row span  { font-size: 1.3rem; color: var(--text-secondary); white-space: nowrap; }
          .table-scroll {
            overflow-x: auto; -webkit-overflow-scrolling: touch; border-radius: 1.2rem;
          }
          .table-scroll .feedback-table { margin-top: 0; }
          @media (max-width: 480px) { .perfil-header { flex-direction: column; align-items: flex-start; } }

          /* Provas por matéria */
          .provas-materia-card { margin-bottom: 1.6rem; }
          .provas-materia-nome {
            font-size: 1.5rem; font-weight: 700; color: var(--color-primary);
            margin-bottom: 1rem; display: flex; align-items: center; gap: 0.6rem;
          }
          .provas-bim-grid {
            display: grid; grid-template-columns: repeat(4, 1fr); gap: 1rem;
          }
          @media (max-width: 700px) { .provas-bim-grid { grid-template-columns: repeat(2, 1fr); } }
          @media (max-width: 420px) { .provas-bim-grid { grid-template-columns: 1fr; } }
          .provas-bim-col {
            background: var(--bg-card-add); border-radius: 1rem; padding: 1rem;
          }
          .provas-bim-label {
            font-size: 1.3rem; font-weight: 700; color: var(--text-secondary); margin-bottom: 0.6rem;
          }
          .prova-item {
            display: flex; justify-content: space-between; align-items: center;
            font-size: 1.3rem; padding: 0.2rem 0; border-bottom: 1px solid var(--border-light);
          }
          .prova-item:last-of-type { border-bottom: none; }
          .prova-media-row {
            display: flex; justify-content: space-between; align-items: center;
            margin-top: 0.8rem; padding-top: 0.6rem; border-top: 2px solid var(--border-color);
          }
          .prova-media-label { font-size: 1.2rem; font-weight: 600; color: var(--text-secondary); }
          .provas-sem-dados { font-size: 1.2rem; color: var(--text-secondary); }

          /* Resumo semestral */
          .resumo-table td, .resumo-table th { padding: 0.8rem 1.2rem; }

          @media screen { .no-print { display: inline-flex; } }
          @media print {
            .no-print { display: none !important; }
            body { background: white !important; font-size: 12pt; }
            .container { max-width: 100% !important; padding: 0 !important; }
            nav, footer { display: none !important; }
            .card { box-shadow: none !important; border: 1px solid #ddd !important; break-inside: avoid; margin-bottom: 1rem !important; }
            .feedback-table, .resumo-table { font-size: 10pt; }
            .feedback-table th, .feedback-table td,
            .resumo-table th, .resumo-table td { padding: 4pt 6pt; }
            .progress-bar { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
            .progress-fill { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
            h1 { font-size: 16pt; } h2 { font-size: 13pt; }
            .provas-bim-grid { grid-template-columns: repeat(4,1fr) !important; }
            .provas-bim-col { background: #f8f8f8 !important; border: 1px solid #ddd; }
          }
        `}</style>

        {loading ? <Loading /> : !data ? (
          <div className="empty-state"><h2>Relatório não encontrado.</h2></div>
        ) : (
          <>
            <div className="relatorio-page-header">
              <h1>Relatório do Aluno</h1>
              <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
                <button className="btn btn-primary no-print" onClick={() => window.print()} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <span className="material-icons-outlined">picture_as_pdf</span>
                  Exportar PDF
                </button>
                <Link href="/professor/turmas" className="btn btn-secondary no-print">← Voltar</Link>
              </div>
            </div>

            {/* Perfil */}
            <div className="card" style={{ marginBottom: '2rem' }}>
              <div className="perfil-header">
                {data.aluno.foto_url ? (
                  <Image src={data.aluno.foto_url} alt={data.aluno.nome} width={120} height={120} className="perfil-foto" unoptimized />
                ) : (
                  <div className="perfil-foto-placeholder">{data.aluno.nome.charAt(0).toUpperCase()}</div>
                )}
                <div className="perfil-info">
                  <h2>{data.aluno.nome}</h2>
                  {data.aluno.matricula && <p><strong>Matrícula:</strong> {data.aluno.matricula}</p>}
                  <p><strong>Turma:</strong> {data.aluno.turma}</p>
                  <p><strong>Total de avaliações:</strong> {data.total_avaliacoes}</p>
                </div>
              </div>
            </div>

            {/* Stats */}
            <div className="stats-grid" style={{ marginBottom: '2rem' }}>
              <div className="stat-card">
                <div className="stat-icon" style={{ background: 'linear-gradient(135deg,#0d2d6b,#1a4fa0)' }}>
                  <span className="material-icons-outlined">psychology</span>
                </div>
                <div className="stat-info"><h3>{escalaComportamento(data.media_geral).toFixed(1)} / 2.5</h3><p>Média Comportamental</p></div>
              </div>
              {data.media_geral_provas !== null && (
                <div className="stat-card">
                  <div className="stat-icon" style={{ background: 'linear-gradient(135deg,#27ae60,#229954)' }}>
                    <span className="material-icons-outlined">school</span>
                  </div>
                  <div className="stat-info"><h3>{data.media_geral_provas.toFixed(2)}</h3><p>Média Geral das Provas</p></div>
                </div>
              )}
              {data.media_geral_provas === null && data.media_geral_materias !== null && (
                <div className="stat-card">
                  <div className="stat-icon" style={{ background: 'linear-gradient(135deg,#27ae60,#229954)' }}>
                    <span className="material-icons-outlined">school</span>
                  </div>
                  <div className="stat-info"><h3>{data.media_geral_materias.toFixed(2)}</h3><p>Média Geral Matérias</p></div>
                </div>
              )}
            </div>

            {/* Comportamento */}
            <div className="card mb-2">
              <h2 style={{ marginBottom: '2rem' }}>
                <span className="material-icons-outlined" style={{ verticalAlign: 'middle', marginRight: '0.5rem' }}>bar_chart</span>
                Comportamento
              </h2>
              {CRITERIOS.map(c => (
                <div key={c.key} style={{ marginBottom: '2rem' }}>
                  <div className="comportamento-row">
                    <strong>{c.label}</strong>
                    <span>{escalaComportamento(data.medias[c.key]).toFixed(1)} / 2.5 &nbsp;({data.medias[c.pct]}%)</span>
                  </div>
                  <div className="progress-bar" style={{ height: '1.8rem' }}>
                    <div className="progress-fill" style={{
                      width: `${data.medias[c.pct]}%`,
                      background: 'linear-gradient(135deg, var(--color-bar-light), var(--color-bar-accent))',
                    }} />
                  </div>
                </div>
              ))}
            </div>

            {/* Provas por Matéria – seção principal */}
            {Object.keys(data.provas_por_materia).length > 0 && (
              <div className="card mb-2">
                <h2 style={{ marginBottom: '2rem' }}>
                  <span className="material-icons-outlined" style={{ verticalAlign: 'middle', marginRight: '0.5rem' }}>menu_book</span>
                  Provas por Matéria e Bimestre
                </h2>

                {Object.entries(data.provas_por_materia).map(([matNome, epocas]) => {
                  const todasNotas = Object.values(epocas).flat();
                  const mediaAno = avg(todasNotas);

                  return (
                    <div className="provas-materia-card" key={matNome}>
                      <div className="provas-materia-nome">
                        <span className="material-icons-outlined" style={{ fontSize: '1.8rem' }}>subject</span>
                        {matNome}
                        {mediaAno !== null && (
                          <span style={{ marginLeft: 'auto', fontSize: '1.4rem', fontWeight: 700, color: notaColor(mediaAno) }}>
                            Média do Ano: {mediaAno.toFixed(2)}
                          </span>
                        )}
                      </div>
                      <div className="provas-bim-grid">
                        {EPOCAS.map(ep => {
                          const notas = epocas[ep.key] || [];
                          const mediaEp = avg(notas);
                          return (
                            <div className="provas-bim-col" key={ep.key}>
                              <div className="provas-bim-label">{ep.label}</div>
                              {notas.length === 0 ? (
                                <p className="provas-sem-dados">Sem provas</p>
                              ) : (
                                notas.map((n, i) => (
                                  <div className="prova-item" key={i}>
                                    <span style={{ color: 'var(--text-secondary)' }}>P{i + 1}</span>
                                    <strong style={{ color: notaColor(n) }}>{n.toFixed(1)}</strong>
                                  </div>
                                ))
                              )}
                              {notas.length > 0 && mediaEp !== null && (
                                <div className="prova-media-row">
                                  <span className="prova-media-label">Média</span>
                                  <strong style={{ color: notaColor(mediaEp) }}>{mediaEp.toFixed(2)}</strong>
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}

                {/* Resumo Semestral */}
                {Object.keys(data.provas_por_materia).length > 1 && (
                  <>
                    <h3 style={{ margin: '2rem 0 1rem', borderTop: '2px solid var(--border-light)', paddingTop: '1.5rem' }}>
                      Resumo Semestral
                    </h3>
                    <div className="table-scroll">
                      <table className="feedback-table resumo-table">
                        <thead>
                          <tr>
                            <th>Matéria</th>
                            {EPOCAS.map(ep => <th key={ep.key}>{ep.label}</th>)}
                            <th>Média Anual</th>
                          </tr>
                        </thead>
                        <tbody>
                          {Object.entries(data.provas_por_materia).map(([matNome, epocas]) => {
                            const mediaAno = avg(Object.values(epocas).flat());
                            return (
                              <tr key={matNome}>
                                <td><strong>{matNome}</strong></td>
                                {EPOCAS.map(ep => {
                                  const m = avg(epocas[ep.key] || []);
                                  return (
                                    <td key={ep.key}>
                                      {m !== null
                                        ? <span style={{ fontWeight: 600, color: notaColor(m) }}>{m.toFixed(2)}</span>
                                        : <span style={{ color: 'var(--text-secondary)' }}>–</span>}
                                    </td>
                                  );
                                })}
                                <td>
                                  {mediaAno !== null
                                    ? <strong style={{ color: notaColor(mediaAno) }}>{mediaAno.toFixed(2)}</strong>
                                    : '–'}
                                </td>
                              </tr>
                            );
                          })}
                          {/* Linha de média geral */}
                          <tr style={{ background: 'var(--bg-card-add)', fontWeight: 700 }}>
                            <td>Média Geral</td>
                            {EPOCAS.map(ep => {
                              const vals = Object.values(data.provas_por_materia)
                                .map(epocas => avg(epocas[ep.key] || []))
                                .filter((v): v is number => v !== null);
                              const m = avg(vals);
                              return (
                                <td key={ep.key}>
                                  {m !== null
                                    ? <strong style={{ color: notaColor(m) }}>{m.toFixed(2)}</strong>
                                    : '–'}
                                </td>
                              );
                            })}
                            <td>
                              {data.media_geral_provas !== null && (
                                <strong style={{ color: notaColor(data.media_geral_provas) }}>
                                  {data.media_geral_provas.toFixed(2)}
                                </strong>
                              )}
                            </td>
                          </tr>
                        </tbody>
                      </table>
                    </div>
                  </>
                )}
              </div>
            )}

            {/* Notas legado (NotaMateria) – exibido apenas se não há provas individuais */}
            {Object.keys(data.provas_por_materia).length === 0 && Object.keys(data.notas_por_epoca).length > 0 && (() => {
              const epocasPresentes = EPOCAS_ORDER.filter(e => data.notas_por_epoca[e]);
              const materias = Object.keys(data.medias_materias);
              return (
                <div className="card mb-2">
                  <h2 style={{ marginBottom: '1.5rem' }}>
                    <span className="material-icons-outlined" style={{ verticalAlign: 'middle', marginRight: '0.5rem' }}>menu_book</span>
                    Notas por Matéria
                  </h2>
                  <div className="table-scroll">
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
                            const a = vals.length ? vals.reduce((x, y) => x + y, 0) / vals.length : null;
                            return (
                              <td key={e}>
                                {a !== null ? <strong style={{ color: notaColor(a) }}>{a.toFixed(2)}</strong> : '–'}
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
              );
            })()}

            {/* Histórico Comportamental */}
            {data.avaliacoes.length > 0 && (
              <div className="card">
                <h2 style={{ marginBottom: '1.5rem' }}>
                  <span className="material-icons-outlined" style={{ verticalAlign: 'middle', marginRight: '0.5rem' }}>history</span>
                  Histórico Comportamental
                </h2>
                <div className="table-scroll">
                  <table className="feedback-table">
                    <thead>
                      <tr>
                        <th>Data</th><th>Matéria</th><th>Assid.</th><th>Part.</th><th>Resp.</th><th>Soc.</th><th>Média</th><th>Observação</th>
                      </tr>
                    </thead>
                    <tbody>
                      {data.avaliacoes.map(av => (
                        <tr key={av.id}>
                          <td style={{ whiteSpace: 'nowrap' }}>{new Date(av.data).toLocaleDateString('pt-BR')}</td>
                          <td style={{ whiteSpace: 'nowrap' }}>{av.materia_nome || '–'}</td>
                          <td>{escalaComportamento(av.assiduidade)}</td>
                          <td>{escalaComportamento(av.participacao)}</td>
                          <td>{escalaComportamento(av.responsabilidade)}</td>
                          <td>{escalaComportamento(av.sociabilidade)}</td>
                          <td><NotaBadge nota={av.media} /></td>
                          <td style={{ fontSize: '1.2rem', color: 'var(--text-secondary)', maxWidth: '20rem' }}>
                            {av.observacao ? av.observacao.slice(0, 60) + (av.observacao.length > 60 ? '…' : '') : '–'}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
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
