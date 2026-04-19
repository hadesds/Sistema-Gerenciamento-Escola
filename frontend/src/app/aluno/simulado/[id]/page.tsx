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

  const tempoEstimado = simulado ? Math.ceil(simulado.total_questoes * 2) : 0;

  return (
    <ProtectedRoute tipo="aluno">
      <Navbar />
      <main className="container fade-in">
        <Link href="/aluno/meus-simulados" className="btn btn-secondary mb-2" style={{ display: 'inline-flex' }}>← Voltar</Link>

        {loading ? <Loading /> : !simulado ? (
          <div className="empty-state"><h2>Simulado não encontrado.</h2></div>
        ) : (
          <>
            {/* Gradient header card */}
            <div className="card mb-2" style={{ background: 'linear-gradient(135deg, var(--color-secondary), var(--color-terciaria))', color: 'white' }}>
              <h1 style={{ color: 'white', marginBottom: '0.5rem' }}>Simulado - {simulado.turma_nome}</h1>
              <p style={{ color: 'rgba(255,255,255,0.9)', margin: '0 0 1.5rem' }}>Prof. {simulado.autor_nome}</p>
              <div style={{ display: 'flex', gap: '1.5rem', flexWrap: 'wrap' }}>
                <div style={{ padding: '0.8rem 1.5rem', background: 'rgba(255,255,255,0.2)', borderRadius: '1rem', fontSize: '1.4rem' }}>
                  ❓ <strong>{simulado.total_questoes}</strong> questões
                </div>
                <div style={{ padding: '0.8rem 1.5rem', background: 'rgba(255,255,255,0.2)', borderRadius: '1rem', fontSize: '1.4rem' }}>
                  ⏱️ ~<strong>{tempoEstimado}</strong> minutos
                </div>
                <div style={{ padding: '0.8rem 1.5rem', background: 'rgba(255,255,255,0.2)', borderRadius: '1rem', fontSize: '1.4rem' }}>
                  📅 {new Date(simulado.data_criacao).toLocaleDateString('pt-BR')}
                </div>
              </div>
            </div>

            {simulado.questoes.length === 0 ? (
              <div className="empty-state">
                <p>Nenhuma questão neste simulado.</p>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
                {simulado.questoes.map((q, idx) => (
                  <div key={q.id} className="card" style={{ borderLeft: '4px solid var(--color-secondary)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                        <div className="stat-circle" style={{ flexShrink: 0 }}>{idx + 1}</div>
                        <span className="badge">{q.materia}</span>
                      </div>
                    </div>
                    <h3 style={{ marginBottom: '1rem' }}>Enunciado</h3>
                    <p style={{ fontSize: '1.6rem', color: 'var(--text-primary)', whiteSpace: 'pre-wrap', marginBottom: '1.5rem' }}>{q.enunciado}</p>

                    <button
                      className={`btn ${respostasVisiveis.has(q.id) ? 'btn-primary' : 'btn-secondary'}`}
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
                ))}
              </div>
            )}

            {/* Completion footer */}
            {simulado.questoes.length > 0 && (
              <div className="card mt-2" style={{ background: 'linear-gradient(135deg, #d4edda, #c3e6cb)', textAlign: 'center', padding: '3rem' }}>
                <div style={{ fontSize: '4rem', marginBottom: '1rem' }}>🎉</div>
                <h2 style={{ color: '#155724', marginBottom: '1rem' }}>Simulado Concluído!</h2>
                <p style={{ color: '#155724', marginBottom: '2rem' }}>Você revisou todas as {simulado.total_questoes} questões deste simulado.</p>
                <Link href="/aluno/meus-simulados" className="btn btn-submit">
                  Voltar aos Simulados
                </Link>
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
