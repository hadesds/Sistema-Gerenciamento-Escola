'use client';

import { useEffect, useState } from 'react';
import { apiFetch } from '@/lib/api';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import Navbar from '@/components/Navbar';
import ProtectedRoute from '@/components/ProtectedRoute';
import Loading from '@/components/Loading';

interface SimuladoDetalhe {
  id: number;
  turma_nome: string;
  autor_nome: string;
  total_questoes: number;
  data_criacao: string;
  questoes: Array<{
    id: number;
    enunciado: string;
    resposta: string;
    materia: string;
  }>;
}

export default function VisualizarSimuladoPage() {
  const params = useParams();
  const simuladoId = params.id as string;
  const [simulado, setSimulado] = useState<SimuladoDetalhe | null>(null);
  const [loading, setLoading] = useState(true);
  const [respostasVisiveis, setRespostasVisiveis] = useState<Set<number>>(new Set());

  useEffect(() => {
    apiFetch<SimuladoDetalhe>(`/aluno/simulado/${simuladoId}/`)
      .then(setSimulado)
      .finally(() => setLoading(false));
  }, [simuladoId]);

  function toggleResposta(id: number) {
    setRespostasVisiveis(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  return (
    <ProtectedRoute tipo="aluno">
      <Navbar />
      <main className="container fade-in">
        {loading ? <Loading /> : !simulado ? (
          <div className="empty-state"><h2>Simulado não encontrado.</h2></div>
        ) : (
          <>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
              <div>
                <h1>Simulado #{simulado.id}</h1>
                <p>Professor: {simulado.autor_nome} · Turma: {simulado.turma_nome}</p>
              </div>
              <Link href="/aluno/meus-simulados" className="btn btn-secondary">
                ← Voltar
              </Link>
            </div>

            <div className="stats-grid">
              <div className="stat-card">
                <div className="stat-icon"><span className="material-icons-outlined">quiz</span></div>
                <div className="stat-info">
                  <h3>{simulado.total_questoes}</h3>
                  <p>Questões</p>
                </div>
              </div>
              <div className="stat-card">
                <div className="stat-icon"><span className="material-icons-outlined">calendar_today</span></div>
                <div className="stat-info">
                  <h3 style={{ fontSize: '2rem' }}>{new Date(simulado.data_criacao).toLocaleDateString('pt-BR')}</h3>
                  <p>Data de publicação</p>
                </div>
              </div>
            </div>

            {simulado.questoes.length === 0 ? (
              <div className="empty-state">
                <p>Nenhuma questão neste simulado.</p>
              </div>
            ) : (
              simulado.questoes.map((q, idx) => (
                <div key={q.id} className="card">
                  <div style={{ display: 'flex', gap: '1.5rem', alignItems: 'flex-start', marginBottom: '1rem' }}>
                    <div className="stat-circle" style={{ flexShrink: 0 }}>{idx + 1}</div>
                    <div style={{ flex: 1 }}>
                      <span className="badge" style={{ marginBottom: '0.8rem', display: 'inline-block' }}>{q.materia}</span>
                      <p style={{ fontSize: '1.6rem', color: 'var(--text-primary)', whiteSpace: 'pre-wrap' }}>{q.enunciado}</p>
                    </div>
                  </div>

                  <button
                    className="btn btn-secondary"
                    onClick={() => toggleResposta(q.id)}
                  >
                    <span className="material-icons-outlined">
                      {respostasVisiveis.has(q.id) ? 'visibility_off' : 'visibility'}
                    </span>
                    {respostasVisiveis.has(q.id) ? 'Ocultar Resposta' : 'Ver Resposta'}
                  </button>

                  {respostasVisiveis.has(q.id) && (
                    <div style={{ marginTop: '1.5rem', padding: '1.5rem', background: 'var(--bg-card-add)', borderRadius: '1rem', borderLeft: '4px solid var(--color-add-button)' }}>
                      <strong style={{ fontSize: '1.5rem', display: 'block', marginBottom: '0.5rem' }}>Resposta:</strong>
                      <p style={{ margin: 0, color: 'var(--text-primary)', whiteSpace: 'pre-wrap' }}>{q.resposta}</p>
                    </div>
                  )}
                </div>
              ))
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
