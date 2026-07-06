'use client';

import { useEffect, useState } from 'react';
import { apiFetch, API_URL } from '@/lib/api';
import Cookies from 'js-cookie';
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
  // novo sistema: notas consolidadas por bimestre × disciplina
  consolidado: Record<string, Array<{
    sigla: string;
    nome: string;
    av1: number | null;
    av2: number | null;
    av3: number | null;
    final: number;
  }>>;
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

function notaColor(nota: number) {
  if (nota >= 7) return 'var(--color-success)';
  if (nota >= 5) return 'var(--color-warning)';
  return 'var(--color-danger)';
}

function fmtNota(v: number | null): string {
  return v == null ? '–' : v.toFixed(1);
}

// Converte 0–5 (step 0.5) para pontuação 0–2.5 pts (÷ 2)
function escalaComportamento(nota: number): number {
  return parseFloat((nota / 2).toFixed(1));
}

export default function RelatorioAlunoPage() {
  const params = useParams();
  const alunoId = params.id as string;
  const [data, setData] = useState<RelatorioData | null>(null);
  const [loading, setLoading] = useState(true);
  const [exportando, setExportando] = useState(false);

  async function exportarPDF() {
    setExportando(true);
    try {
      const res = await fetch(`${API_URL}/api/professor/relatorio/${alunoId}/pdf/`, {
        headers: { Authorization: `Bearer ${Cookies.get('access_token') ?? ''}` },
      });
      if (!res.ok) throw new Error('Erro ao gerar PDF');
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `relatorio_aluno_${alunoId}.pdf`;
      a.click();
      URL.revokeObjectURL(url);
    } finally {
      setExportando(false);
    }
  }

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

          @media screen { .no-print { display: inline-flex; } .print-only { display: none; } }
          @media print {
            .print-only { display: block; font-size: 10pt; color: #666; margin-top: 0.2rem; }
            .no-print { display: none !important; }
            /* Esconde glifos de ícone para não virarem texto literal no PDF */
            .material-icons-outlined { display: none !important; }
            body { background: white !important; font-size: 12pt; line-height: 1.4 !important; }
            .relatorio-page-header { display: block !important; margin-bottom: 1rem; }
            .stat-card, .card { break-inside: avoid; }
            .stat-info h3 { font-size: 14pt !important; }
            .stat-info p { font-size: 9pt !important; }
            .comportamento-row strong { font-size: 11pt !important; }
            .comportamento-row span { font-size: 10pt !important; }
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
            .feedback-table td { word-break: break-word; }
          }
        `}</style>

        {loading ? <Loading /> : !data ? (
          <div className="empty-state"><h2>Relatório não encontrado.</h2></div>
        ) : (
          <>
            <div className="relatorio-page-header">
              <div>
                <h1>Relatório do Aluno</h1>
                <div className="print-only">Gerado em {new Date().toLocaleString('pt-BR')}</div>
              </div>
              <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
                <Link href={`/professor/notas/${alunoId}`} className="btn btn-secondary no-print" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <span className="material-icons-outlined">edit_note</span>
                  Gerenciar Notas
                </Link>
                <button className="btn btn-primary" onClick={exportarPDF} disabled={exportando} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <span className="material-icons-outlined">picture_as_pdf</span>
                  {exportando ? 'Gerando…' : 'Exportar PDF'}
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
              {(() => {
                // média geral do ano: média das médias finais das disciplinas com alguma nota
                const finais: number[] = [];
                Object.values(data.consolidado).forEach(linhas =>
                  linhas.forEach(l => {
                    if (l.av1 != null || l.av2 != null || l.av3 != null) finais.push(l.final);
                  }),
                );
                if (!finais.length) return null;
                const media = finais.reduce((a, b) => a + b, 0) / finais.length;
                return (
                  <div className="stat-card">
                    <div className="stat-icon" style={{ background: 'linear-gradient(135deg,#27ae60,#229954)' }}>
                      <span className="material-icons-outlined">school</span>
                    </div>
                    <div className="stat-info"><h3>{media.toFixed(2)}</h3><p>Média Geral (Notas)</p></div>
                  </div>
                );
              })()}
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

            {/* Notas por Disciplina (AV1/AV2/AV3) */}
            {(() => {
              const bimestresComNota = EPOCAS.filter(ep =>
                (data.consolidado[ep.key] ?? []).some(
                  l => l.av1 != null || l.av2 != null || l.av3 != null,
                ),
              );
              return (
                <div className="card mb-2">
                  <h2 style={{ marginBottom: '1.5rem' }}>
                    <span className="material-icons-outlined" style={{ verticalAlign: 'middle', marginRight: '0.5rem' }}>menu_book</span>
                    Notas por Disciplina
                  </h2>
                  {bimestresComNota.length === 0 ? (
                    <p style={{ color: 'var(--text-secondary)', fontSize: '1.4rem' }}>
                      Nenhuma nota lançada até o momento.
                    </p>
                  ) : (
                    bimestresComNota.map(ep => (
                      <div key={ep.key} style={{ marginBottom: '2rem' }}>
                        <h3 style={{ marginBottom: '1rem' }}>{ep.label}</h3>
                        <div className="table-scroll">
                          <table className="feedback-table">
                            <thead>
                              <tr>
                                <th>Disciplina</th><th>AV1</th><th>AV2</th><th>AV3</th><th>Média Final</th>
                              </tr>
                            </thead>
                            <tbody>
                              {(data.consolidado[ep.key] ?? []).map(l => (
                                <tr key={l.sigla}>
                                  <td><strong>{l.nome}</strong></td>
                                  <td>{fmtNota(l.av1)}</td>
                                  <td>{fmtNota(l.av2)}</td>
                                  <td>{fmtNota(l.av3)}</td>
                                  <td>
                                    <strong style={{ color: notaColor(l.final) }}>{l.final.toFixed(2)}</strong>
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    ))
                  )}
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
                          <td style={{ fontSize: '1.2rem', color: 'var(--text-secondary)', wordBreak: 'break-word' }}>
                            {av.observacao || '–'}
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
