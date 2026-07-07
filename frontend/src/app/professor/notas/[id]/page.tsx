'use client';

import { useEffect, useState, useCallback } from 'react';
import { apiFetch } from '@/lib/api';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import Navbar from '@/components/Navbar';
import ProtectedRoute from '@/components/ProtectedRoute';
import Loading from '@/components/Loading';
import Alert from '@/components/Alert';

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

interface Consolidado {
  aluno: { id: number; nome: string; turma: string };
  notas: Record<string, LinhaNota[]>;
}

const EPOCAS = [
  { key: '1B', label: '1° Bimestre' },
  { key: '2B', label: '2° Bimestre' },
  { key: '3B', label: '3° Bimestre' },
  { key: '4B', label: '4° Bimestre' },
];

function notaColor(n: number) {
  if (n >= 7) return 'var(--color-success)';
  if (n >= 5) return 'var(--color-warning)';
  return 'var(--color-danger)';
}

function calcFinal(av1: string, av2: string, av3: string): number {
  const n = (v: string) => (v === '' || isNaN(parseFloat(v)) ? 0 : parseFloat(v));
  return Math.round(((n(av1) + n(av2) + n(av3)) / 3) * 100) / 100;
}

export default function GerenciarNotasPage() {
  const params = useParams();
  const alunoId = params.id as string;
  const [data, setData] = useState<Consolidado | null>(null);
  const [loading, setLoading] = useState(true);
  const [bimestre, setBimestre] = useState('1B');
  const [edits, setEdits] = useState<Record<string, { av1: string; av2: string; av3: string }>>({});
  const [salvando, setSalvando] = useState<string | null>(null);
  const [alert, setAlert] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const carregar = useCallback(() => {
    setLoading(true);
    apiFetch<Consolidado>(`/professor/consolidado/${alunoId}/`)
      .then((d) => {
        setData(d);
        // inicializa edits com os valores atuais
        const init: Record<string, { av1: string; av2: string; av3: string }> = {};
        Object.entries(d.notas).forEach(([ep, linhas]) => {
          linhas.forEach((l) => {
            init[`${ep}:${l.sigla}`] = {
              av1: l.av1 != null ? String(l.av1) : '',
              av2: l.av2 != null ? String(l.av2) : '',
              av3: l.av3 != null ? String(l.av3) : '',
            };
          });
        });
        setEdits(init);
      })
      .finally(() => setLoading(false));
  }, [alunoId]);

  useEffect(() => {
    carregar();
  }, [carregar]);

  function setEdit(sigla: string, campo: 'av1' | 'av2' | 'av3', valor: string) {
    const k = `${bimestre}:${sigla}`;
    setEdits((prev) => ({ ...prev, [k]: { ...prev[k], [campo]: valor } }));
  }

  async function salvarLinha(linha: LinhaNota) {
    const k = `${bimestre}:${linha.sigla}`;
    const e = edits[k];
    if (!e) return;
    setSalvando(linha.sigla);
    try {
      // AV1 / AV2 → nota-area (override manual)
      const reqs: Promise<unknown>[] = [];
      if (e.av1 !== '' && linha.area_av1) {
        reqs.push(
          apiFetch(`/professor/nota-area/${alunoId}/`, {
            method: 'POST',
            body: JSON.stringify({ epoca: bimestre, av_tipo: 'AV1', area: linha.area_av1, nota: parseFloat(e.av1) }),
          }),
        );
      }
      if (e.av2 !== '' && linha.area_av2) {
        reqs.push(
          apiFetch(`/professor/nota-area/${alunoId}/`, {
            method: 'POST',
            body: JSON.stringify({ epoca: bimestre, av_tipo: 'AV2', area: linha.area_av2, nota: parseFloat(e.av2) }),
          }),
        );
      }
      // AV3 → nota-qualitativa
      if (e.av3 !== '' && linha.materia_id) {
        reqs.push(
          apiFetch(`/professor/nota-qualitativa/${alunoId}/`, {
            method: 'POST',
            body: JSON.stringify({ epoca: bimestre, materia_id: linha.materia_id, nota: parseFloat(e.av3) }),
          }),
        );
      }
      await Promise.all(reqs);
      setAlert({ type: 'success', message: `Notas de ${linha.nome} salvas.` });
      carregar();
    } catch {
      setAlert({ type: 'error', message: 'Erro ao salvar as notas.' });
    } finally {
      setSalvando(null);
    }
  }

  const linhas = data?.notas[bimestre] ?? [];

  return (
    <ProtectedRoute tipo="professor">
      <Navbar />
      <main className="container fade-in">
        <style>{`
          .notas-header { display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:1.2rem; margin-bottom:2rem; }
          .bim-tabs { display:flex; gap:0.8rem; flex-wrap:wrap; margin-bottom:2rem; }
          .nota-input { width:6.5rem; padding:0.5rem 0.7rem; border:2px solid #d0daea; border-radius:0.8rem; font-size:1.4rem; text-align:center; font-family:'Poppins',sans-serif; }
          .nota-input:focus { outline:none; border-color:#1a73c7; }
          .origem-tag { font-size:1.1rem; color:var(--text-secondary); display:block; margin-top:0.2rem; }
          .table-scroll { overflow-x:auto; border-radius:1.2rem; }
        `}</style>

        {alert && <Alert type={alert.type} message={alert.message} onClose={() => setAlert(null)} />}

        <div className="notas-header">
          <h1>Gerenciar Notas</h1>
          <Link href={`/professor/relatorio/${alunoId}`} className="btn btn-secondary">← Relatório</Link>
        </div>

        {loading ? (
          <Loading />
        ) : !data ? (
          <div className="empty-state"><h2>Aluno não encontrado.</h2></div>
        ) : (
          <>
            <div className="card" style={{ marginBottom: '2rem' }}>
              <h2 style={{ marginBottom: '0.4rem' }}>{data.aluno.nome}</h2>
              <p><strong>Turma:</strong> {data.aluno.turma}</p>
            </div>

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
                AV1/AV2 são geradas automaticamente pelos simulados. Editar aqui grava um override
                manual (para correção ou recuperação). AV3 é a nota qualitativa da disciplina.
                Nota ausente conta como 0 na média (soma ÷ 3).
              </p>
              <div className="table-scroll">
                <table className="feedback-table">
                  <thead>
                    <tr>
                      <th>Disciplina</th>
                      <th>AV1</th>
                      <th>AV2</th>
                      <th>AV3 (Qualit.)</th>
                      <th>Média Final</th>
                      <th></th>
                    </tr>
                  </thead>
                  <tbody>
                    {linhas.map((l) => {
                      const k = `${bimestre}:${l.sigla}`;
                      const e = edits[k] ?? { av1: '', av2: '', av3: '' };
                      const finalCalc = calcFinal(e.av1, e.av2, e.av3);
                      return (
                        <tr key={l.sigla}>
                          <td><strong>{l.nome}</strong></td>
                          <td>
                            <input
                              className="nota-input"
                              type="number" min={0} max={10} step={0.1}
                              value={e.av1}
                              onChange={(ev) => setEdit(l.sigla, 'av1', ev.target.value)}
                            />
                          </td>
                          <td>
                            <input
                              className="nota-input"
                              type="number" min={0} max={10} step={0.1}
                              value={e.av2}
                              onChange={(ev) => setEdit(l.sigla, 'av2', ev.target.value)}
                            />
                          </td>
                          <td>
                            <input
                              className="nota-input"
                              type="number" min={0} max={10} step={0.1}
                              value={e.av3}
                              onChange={(ev) => setEdit(l.sigla, 'av3', ev.target.value)}
                            />
                          </td>
                          <td>
                            <strong style={{ color: notaColor(finalCalc), fontSize: '1.5rem' }}>
                              {finalCalc.toFixed(2)}
                            </strong>
                          </td>
                          <td>
                            <button
                              className="btn btn-primary"
                              style={{ fontSize: '1.25rem', padding: '0.5rem 1rem' }}
                              onClick={() => salvarLinha(l)}
                              disabled={salvando === l.sigla}
                            >
                              {salvando === l.sigla ? '...' : 'Salvar'}
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
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
