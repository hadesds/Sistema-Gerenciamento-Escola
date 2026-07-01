'use client';

import { useEffect, useState } from 'react';
import { apiFetch } from '@/lib/api';
import Navbar from '@/components/Navbar';
import ProtectedRoute from '@/components/ProtectedRoute';
import Loading from '@/components/Loading';

interface LinhaNota {
  sigla: string;
  nome: string;
  av1: number | null;
  av2: number | null;
  av3: number | null;
  final: number;
}

interface MinhasNotas {
  aluno: { nome: string; turma: string };
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

function fmt(v: number | null) {
  return v == null ? '–' : v.toFixed(1);
}

export default function MinhasNotasPage() {
  const [data, setData] = useState<MinhasNotas | null>(null);
  const [loading, setLoading] = useState(true);
  const [bimestre, setBimestre] = useState('1B');

  useEffect(() => {
    apiFetch<MinhasNotas>('/aluno/minhas-notas/')
      .then(setData)
      .finally(() => setLoading(false));
  }, []);

  const linhas = data?.notas[bimestre] ?? [];

  return (
    <ProtectedRoute tipo="aluno">
      <Navbar />
      <main className="container fade-in">
        <style>{`
          .bim-tabs { display:flex; gap:0.8rem; flex-wrap:wrap; margin-bottom:2rem; }
          .table-scroll { overflow-x:auto; border-radius:1.2rem; }
        `}</style>

        <h1>Minhas Notas</h1>

        {loading ? (
          <Loading />
        ) : !data ? (
          <div className="empty-state"><h2>Notas não encontradas.</h2></div>
        ) : (
          <>
            <div className="card" style={{ margin: '1.5rem 0 2rem' }}>
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
                Média final por disciplina = (AV1 + AV2 + AV3) ÷ 3. Nota ainda não lançada conta como 0.
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
                    {linhas.map((l) => (
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
      </main>
      <footer style={{ textAlign: 'center', padding: '3rem 2rem', color: 'var(--text-secondary)', fontSize: '1.4rem' }}>
        <p>&copy; 2025 Sistema CARA - Gestão Escolar Inteligente</p>
      </footer>
    </ProtectedRoute>
  );
}
