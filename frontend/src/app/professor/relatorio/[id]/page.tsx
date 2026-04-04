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
  }>;
}

const CRITERIOS = [
  { key: 'assiduidade', label: 'Assiduidade', pct: 'assiduidade_percentual' },
  { key: 'participacao', label: 'Participação', pct: 'participacao_percentual' },
  { key: 'responsabilidade', label: 'Responsabilidade', pct: 'responsabilidade_percentual' },
  { key: 'sociabilidade', label: 'Sociabilidade', pct: 'sociabilidade_percentual' },
] as const;

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
        {loading ? <Loading /> : !data ? (
          <div className="empty-state"><h2>Relatório não encontrado.</h2></div>
        ) : (
          <>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
              <h1>Relatório do Aluno</h1>
              <Link href={`/professor/turma/${data.aluno.id}`} className="btn btn-secondary">
                ← Voltar
              </Link>
            </div>

            {/* Perfil do aluno */}
            <div className="card">
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

            {/* Média Geral */}
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
                    <span>{data.medias[c.key].toFixed(2)} / 5.00 ({data.medias[c.pct]}%)</span>
                  </div>
                  <div className="progress-bar" style={{ height: '1.8rem' }}>
                    <div
                      className="progress-fill"
                      style={{
                        width: `${data.medias[c.pct]}%`,
                        background: 'linear-gradient(135deg, var(--color-bar-light), var(--color-bar-accent))',
                      }}
                    />
                  </div>
                </div>
              ))}
            </div>

            {/* Histórico de avaliações */}
            {data.avaliacoes.length > 0 && (
              <div className="card">
                <h2>Histórico de Avaliações</h2>
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
