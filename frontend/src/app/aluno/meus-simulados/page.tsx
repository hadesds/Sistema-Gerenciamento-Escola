'use client';

import { useEffect, useState } from 'react';
import { apiFetch } from '@/lib/api';
import Link from 'next/link';
import Navbar from '@/components/Navbar';
import ProtectedRoute from '@/components/ProtectedRoute';
import Loading from '@/components/Loading';

interface Simulado {
  id: number;
  turma_nome: string;
  autor_nome: string;
  total_questoes: number;
  data_criacao: string;
  questoes: Array<{ id: number; materia: string }>;
}

export default function MeusSimuladosPage() {
  const [simulados, setSimulados] = useState<Simulado[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    apiFetch<Simulado[]>('/aluno/meus-simulados/')
      .then(setSimulados)
      .finally(() => setLoading(false));
  }, []);

  return (
    <ProtectedRoute tipo="aluno">
      <Navbar />
      <main className="container fade-in">
        <Link href="/aluno/dashboard" className="btn btn-secondary mb-2" style={{ display: 'inline-flex' }}>← Voltar ao Dashboard</Link>
        <h1>Simulados Disponíveis</h1>

        {loading ? <Loading /> : simulados.length === 0 ? (
          <div className="empty-state card">
            <div className="empty-icon">📚</div>
            <h2>Nenhum simulado disponível</h2>
            <p>No momento não há simulados disponíveis para sua turma.</p>
            <p>Aguarde os professores criarem novos simulados!</p>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))', gap: '1.5rem', marginTop: '2rem' }}>
            {simulados.map(s => {
              const materias = Array.from(new Set(s.questoes.map(q => q.materia)));
              return (
                <div key={s.id} className="card" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', padding: '2rem' }}>
                  <div style={{ fontSize: '4rem', marginBottom: '1rem' }}>📝</div>

                  <div style={{ width: '100%', marginBottom: '1.5rem' }}>
                    <h3 style={{ color: 'var(--color-primary)', marginBottom: '0.75rem' }}>Simulado - {s.turma_nome}</h3>
                    <p style={{ color: 'var(--text-secondary)', marginBottom: '1rem' }}>
                      <strong>Professor:</strong> {s.autor_nome}
                    </p>

                    {/* Stats box */}
                    <div style={{ display: 'flex', justifyContent: 'center', gap: '2rem', margin: '1.5rem 0', padding: '1rem', background: '#f8f9fa', borderRadius: '1rem' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <span style={{ fontSize: '1.5rem' }}>❓</span>
                        <span><strong>{s.total_questoes}</strong> questões</span>
                      </div>
                    </div>

                    {/* Materia tags */}
                    {materias.length > 0 && (
                      <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'center', gap: '0.5rem', marginTop: '1rem' }}>
                        {materias.map(m => (
                          <span key={m} style={{ display: 'inline-block', background: 'var(--color-secondary)', color: 'rgb(51,51,51)', padding: '0.35rem 0.85rem', borderRadius: '12px', fontSize: '1.3rem', fontWeight: 600 }}>
                            {m}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>

                  <Link href={`/aluno/simulado/${s.id}`} className="btn btn-primary" style={{ width: '100%', textAlign: 'center', justifyContent: 'center' }}>
                    Fazer Simulado
                  </Link>
                </div>
              );
            })}
          </div>
        )}
      </main>
      <footer style={{ textAlign: 'center', padding: '3rem 2rem', color: 'var(--text-secondary)', fontSize: '1.4rem' }}>
        <p>&copy; 2025 Sistema CARA - Gestão Escolar Inteligente</p>
      </footer>
    </ProtectedRoute>
  );
}
