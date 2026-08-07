'use client';

import { useEffect, useState } from 'react';
import { apiFetch, API_URL } from '@/lib/api';
import Cookies from 'js-cookie';
import Link from 'next/link';
import Image from 'next/image';
import { useParams } from 'next/navigation';
import Navbar from '@/components/Navbar';
import ProtectedRoute from '@/components/ProtectedRoute';
import Loading from '@/components/Loading';

interface Disciplina {
  sigla: string;
  nome: string;
}

interface LinhaNota {
  sigla: string;
  nome: string;
  area_av1: string | null;
  area_av2: string | null;
  materia_id: number | null;
  av1: number | null;
  av2: number | null;
  av3: number | null;
  final: number;
}

interface FrequenciaMes {
  mes: string;
  mes_label: string;
  presentes: number;
  faltas: number;
  total: number;
  percentual: number;
}

interface AlunoRelatorio {
  id: number;
  nome: string;
  foto_url: string | null;
  cpf: string | null;
  telefone: string;
  endereco: string;
  nome_mae: string;
  email_mae: string;
  email: string;
  notas: Record<string, LinhaNota[]>;
  frequencia_mensal: FrequenciaMes[];
}

interface TurmaRelatoriosData {
  turma: { id: number; nome: string; serie: string; turno_display: string; sala: string };
  disciplinas: Disciplina[];
  alunos: AlunoRelatorio[];
}

const EPOCAS = [
  { key: '1B', label: '1° Bimestre' },
  { key: '2B', label: '2° Bimestre' },
  { key: '3B', label: '3° Bimestre' },
  { key: '4B', label: '4° Bimestre' },
];

const TIPOS_NOTA: [keyof Pick<LinhaNota, 'av1' | 'av2' | 'av3' | 'final'>, string][] = [
  ['av1', 'AV1'],
  ['av2', 'AV2'],
  ['av3', 'AV3'],
  ['final', 'Bimestral'],
];

type Aba = 'nominal' | 'dados' | 'notas' | 'frequencia';
type TipoNota = 'av1' | 'av2' | 'av3' | 'final';

function notaColor(n: number) {
  if (n >= 7) return 'var(--color-success)';
  if (n >= 5) return 'var(--color-warning)';
  return 'var(--color-danger)';
}

function freqColor(pct: number) {
  if (pct >= 75) return 'var(--color-success)';
  if (pct >= 50) return 'var(--color-warning)';
  return 'var(--color-danger)';
}

export default function RelatoriosTurmaPage() {
  const params = useParams();
  const turmaId = params.id as string;

  const [data, setData] = useState<TurmaRelatoriosData | null>(null);
  const [loading, setLoading] = useState(true);
  const [aba, setAba] = useState<Aba>('nominal');
  const [bimestre, setBimestre] = useState('1B');
  const [tipoNota, setTipoNota] = useState<TipoNota>('final');
  const [mes, setMes] = useState('');
  const [exportando, setExportando] = useState(false);

  async function exportarPDF() {
    setExportando(true);
    try {
      const query = new URLSearchParams({ tipo: aba });
      if (aba === 'notas') {
        query.set('bimestre', bimestre);
        query.set('nota', tipoNota);
      }
      if (aba === 'frequencia' && mes) {
        query.set('mes', mes);
      }
      const res = await fetch(
        `${API_URL}/api/professor/turma/${turmaId}/relatorios/pdf/?${query.toString()}`,
        { headers: { Authorization: `Bearer ${Cookies.get('access_token') ?? ''}` } },
      );
      if (!res.ok) throw new Error('Erro ao gerar PDF');
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `turma_${data?.turma.nome ?? turmaId}_${aba}.pdf`;
      a.click();
      URL.revokeObjectURL(url);
    } finally {
      setExportando(false);
    }
  }

  useEffect(() => {
    apiFetch<TurmaRelatoriosData>(`/professor/turma/${turmaId}/relatorios/`)
      .then(d => {
        setData(d);
        const meses = Array.from(
          new Set(d.alunos.flatMap(a => a.frequencia_mensal.map(f => f.mes))),
        ).sort();
        if (meses.length) setMes(meses[meses.length - 1]);
      })
      .finally(() => setLoading(false));
  }, [turmaId]);

  if (loading) {
    return (
      <ProtectedRoute tipo="professor">
        <Navbar />
        <Loading />
      </ProtectedRoute>
    );
  }

  if (!data) {
    return (
      <ProtectedRoute tipo="professor">
        <Navbar />
        <main className="container fade-in">
          <div className="empty-state card"><h2>Turma não encontrada.</h2></div>
        </main>
      </ProtectedRoute>
    );
  }

  const alunos = data.alunos;
  const mesesDisponiveis = Array.from(
    new Set(alunos.flatMap(a => a.frequencia_mensal.map(f => f.mes))),
  ).sort();

  function freqDoAluno(aluno: AlunoRelatorio, mesChave: string) {
    return aluno.frequencia_mensal.find(f => f.mes === mesChave) ?? null;
  }

  function notaLinha(aluno: AlunoRelatorio, sigla: string): LinhaNota | undefined {
    return aluno.notas[bimestre]?.find(l => l.sigla === sigla);
  }

  return (
    <ProtectedRoute tipo="professor">
      <Navbar />
      <style>{`
        .rel-tabs { display:flex; gap:1rem; margin-bottom: 2rem; flex-wrap: wrap; }
        .table-scroll { overflow-x:auto; border-radius:1.2rem; }
        .rel-table th, .rel-table td { white-space: nowrap; }
        .rel-foto { border-radius: 50%; object-fit: cover; }
        .rel-foto-placeholder {
          width: 4rem; height: 4rem; border-radius: 50%; background: var(--color-stat-circle);
          display:flex; align-items:center; justify-content:center; font-weight:700; font-size:1.6rem;
        }
        @media print {
          nav, footer, .no-print { display: none !important; }
          .card { box-shadow: none !important; border: 1px solid #ddd !important; }
          body { font-size: 11pt; }
        }
      `}</style>
      <main className="container fade-in">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', flexWrap: 'wrap', gap: '1rem' }}>
          <div>
            <h1>Relatórios — {data.turma.nome}</h1>
            <p style={{ color: 'var(--text-secondary)' }}>
              {data.turma.serie} · {data.turma.turno_display} · Sala {data.turma.sala} · {alunos.length} aluno(s)
            </p>
          </div>
          <div style={{ display: 'flex', gap: '1rem' }} className="no-print">
            <button className="btn btn-primary" onClick={exportarPDF} disabled={exportando}>
              <span className="material-icons-outlined">picture_as_pdf</span>
              {exportando ? 'Gerando…' : 'Exportar PDF'}
            </button>
            <Link href={`/professor/turma/${turmaId}`} className="btn btn-secondary">← Voltar</Link>
          </div>
        </div>

        <div className="rel-tabs no-print">
          <button className={`btn ${aba === 'nominal' ? 'btn-primary' : 'btn-secondary'}`} onClick={() => setAba('nominal')}>
            <span className="material-icons-outlined">badge</span> Relação Nominal
          </button>
          <button className={`btn ${aba === 'dados' ? 'btn-primary' : 'btn-secondary'}`} onClick={() => setAba('dados')}>
            <span className="material-icons-outlined">contact_page</span> Dados dos Alunos
          </button>
          <button className={`btn ${aba === 'notas' ? 'btn-primary' : 'btn-secondary'}`} onClick={() => setAba('notas')}>
            <span className="material-icons-outlined">school</span> Notas por Disciplina
          </button>
          <button className={`btn ${aba === 'frequencia' ? 'btn-primary' : 'btn-secondary'}`} onClick={() => setAba('frequencia')}>
            <span className="material-icons-outlined">event_available</span> Frequência Mensal
          </button>
        </div>

        {/* ── Relação Nominal ── */}
        {aba === 'nominal' && (
          <div className="card">
            <h2 style={{ marginBottom: '1.5rem' }}>Relação Nominal</h2>
            {alunos.length === 0 ? (
              <p style={{ color: 'var(--text-secondary)' }}>Nenhum aluno nesta turma.</p>
            ) : (
              <div className="table-scroll">
                <table className="feedback-table rel-table">
                  <thead>
                    <tr><th>#</th><th>Foto</th><th>Nome</th><th>CPF</th></tr>
                  </thead>
                  <tbody>
                    {alunos.map((a, idx) => (
                      <tr key={a.id}>
                        <td>{idx + 1}</td>
                        <td>
                          {a.foto_url ? (
                            <Image src={a.foto_url} alt={a.nome} width={40} height={40} className="rel-foto" unoptimized />
                          ) : (
                            <div className="rel-foto-placeholder">{a.nome.charAt(0).toUpperCase()}</div>
                          )}
                        </td>
                        <td><strong>{a.nome}</strong></td>
                        <td>{a.cpf || '–'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* ── Dados dos Alunos ── */}
        {aba === 'dados' && (
          <div className="card">
            <h2 style={{ marginBottom: '1.5rem' }}>Dados dos Alunos</h2>
            {alunos.length === 0 ? (
              <p style={{ color: 'var(--text-secondary)' }}>Nenhum aluno nesta turma.</p>
            ) : (
              <div className="table-scroll">
                <table className="feedback-table rel-table">
                  <thead>
                    <tr>
                      <th>Nome</th><th>CPF</th><th>E-mail</th><th>Telefone</th>
                      <th>Endereço</th><th>Nome da Mãe</th><th>E-mail da Mãe</th>
                    </tr>
                  </thead>
                  <tbody>
                    {alunos.map(a => (
                      <tr key={a.id}>
                        <td><strong>{a.nome}</strong></td>
                        <td>{a.cpf || '–'}</td>
                        <td>{a.email || '–'}</td>
                        <td>{a.telefone || '–'}</td>
                        <td>{a.endereco || '–'}</td>
                        <td>{a.nome_mae || '–'}</td>
                        <td>{a.email_mae || '–'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* ── Notas por Disciplina ── */}
        {aba === 'notas' && (
          <div className="card">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem', marginBottom: '1.5rem' }}>
              <h2 style={{ margin: 0 }}>Notas por Disciplina</h2>
              <div style={{ display: 'flex', gap: '0.6rem', flexWrap: 'wrap' }} className="no-print">
                {EPOCAS.map(ep => (
                  <button
                    key={ep.key}
                    className={`btn ${bimestre === ep.key ? 'btn-primary' : 'btn-secondary'}`}
                    style={{ fontSize: '1.3rem', padding: '0.6rem 1.2rem' }}
                    onClick={() => setBimestre(ep.key)}
                  >
                    {ep.label}
                  </button>
                ))}
              </div>
            </div>
            <div style={{ display: 'flex', gap: '0.6rem', flexWrap: 'wrap', marginBottom: '1.5rem' }} className="no-print">
              {TIPOS_NOTA.map(([key, label]) => (
                <button
                  key={key}
                  className={`btn ${tipoNota === key ? 'btn-primary' : 'btn-secondary'}`}
                  style={{ fontSize: '1.3rem', padding: '0.5rem 1.1rem' }}
                  onClick={() => setTipoNota(key)}
                >
                  {label}
                </button>
              ))}
            </div>
            {alunos.length === 0 ? (
              <p style={{ color: 'var(--text-secondary)' }}>Nenhum aluno nesta turma.</p>
            ) : (
              <div className="table-scroll">
                <table className="feedback-table rel-table">
                  <thead>
                    <tr>
                      <th>Nome</th>
                      {data.disciplinas.map(d => <th key={d.sigla} title={d.nome}>{d.sigla}</th>)}
                    </tr>
                  </thead>
                  <tbody>
                    {alunos.map(a => (
                      <tr key={a.id}>
                        <td><strong>{a.nome}</strong></td>
                        {data.disciplinas.map(d => {
                          const linha = notaLinha(a, d.sigla);
                          const valor = linha ? linha[tipoNota] : null;
                          return (
                            <td key={d.sigla}>
                              {valor != null
                                ? <span style={{ fontWeight: 600, color: notaColor(valor) }}>{valor.toFixed(1)}</span>
                                : <span style={{ color: 'var(--text-secondary)' }}>–</span>}
                            </td>
                          );
                        })}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* ── Frequência Mensal ── */}
        {aba === 'frequencia' && (
          <div className="card">
            <h2 style={{ marginBottom: '1.5rem' }}>Frequência Mensal</h2>
            {mesesDisponiveis.length === 0 ? (
              <div className="empty-state">
                <div className="empty-icon"><span className="material-icons-outlined" style={{ fontSize: '5rem' }}>event_busy</span></div>
                <p>Nenhum registro de assiduidade encontrado para esta turma.</p>
              </div>
            ) : (
              <>
                <div style={{ display: 'flex', gap: '0.6rem', flexWrap: 'wrap', marginBottom: '1.5rem' }} className="no-print">
                  {mesesDisponiveis.map(m => {
                    const label = alunos.flatMap(a => a.frequencia_mensal).find(f => f.mes === m)?.mes_label ?? m;
                    return (
                      <button
                        key={m}
                        className={`btn ${mes === m ? 'btn-primary' : 'btn-secondary'}`}
                        style={{ fontSize: '1.3rem', padding: '0.6rem 1.2rem' }}
                        onClick={() => setMes(m)}
                      >
                        {label}
                      </button>
                    );
                  })}
                </div>
                <div className="table-scroll">
                  <table className="feedback-table rel-table">
                    <thead>
                      <tr><th>Nome</th><th>Presenças</th><th>Faltas</th><th>Dias Registrados</th><th>% Frequência</th></tr>
                    </thead>
                    <tbody>
                      {alunos.map(a => {
                        const f = freqDoAluno(a, mes);
                        return (
                          <tr key={a.id}>
                            <td><strong>{a.nome}</strong></td>
                            <td>{f ? f.presentes : '–'}</td>
                            <td>{f ? f.faltas : '–'}</td>
                            <td>{f ? f.total : '–'}</td>
                            <td>
                              {f
                                ? <strong style={{ color: freqColor(f.percentual) }}>{f.percentual.toFixed(1)}%</strong>
                                : <span style={{ color: 'var(--text-secondary)' }}>–</span>}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </>
            )}
          </div>
        )}
      </main>
      <footer style={{ textAlign: 'center', padding: '3rem 2rem', color: 'var(--text-secondary)', fontSize: '1.4rem' }}>
        <p>&copy; 2025 Sistema SIGVC - Gestão Escolar Inteligente</p>
      </footer>
    </ProtectedRoute>
  );
}
