'use client';

import { useEffect, useState } from 'react';
import { apiFetch } from '@/lib/api';
import Link from 'next/link';
import Navbar from '@/components/Navbar';
import ProtectedRoute from '@/components/ProtectedRoute';
import Loading from '@/components/Loading';

interface Questao {
  id: number;
  materia: string;
  enunciado: string;
}

interface Simulado {
  id: number;
  turma_nome: string;
  autor_nome: string;
  data_criacao: string;
  total_questoes: number;
  questoes: Questao[];
}

export default function ListaSimuladosPage() {
  const [simulados, setSimulados] = useState<Simulado[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    apiFetch<Simulado[]>('/professor/simulados/')
      .then(setSimulados)
      .finally(() => setLoading(false));
  }, []);

  return (
    <ProtectedRoute tipo="professor">
      <Navbar />
      <main className="container fade-in">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
          <h1>Meus Simulados</h1>
          <Link href="/professor/criar-simulado" className="btn btn-primary">
            <span className="material-icons-outlined">add</span>
            Criar Novo Simulado
          </Link>
        </div>

        {loading ? <Loading /> : simulados.length === 0 ? (
          <div className="card empty-state">
            <div className="empty-icon">📝</div>
            <h2>Nenhum simulado criado</h2>
            <p>Você ainda não criou nenhum simulado. Crie seu primeiro simulado agora!</p>
            <Link href="/professor/criar-simulado" className="btn btn-primary mt-2">
              Criar Primeiro Simulado
            </Link>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))', gap: '1.5rem' }}>
            {simulados.map(s => {
              const preview = s.questoes?.slice(0, 3) ?? [];
              const extra = s.total_questoes - preview.length;
              return (
                <div key={s.id} className="card" style={{ display: 'flex', flexDirection: 'column', gap: '1rem', borderLeft: '4px solid var(--color-secondary)' }}>

                  {/* Header */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingBottom: '0.75rem', borderBottom: '2px solid var(--border-light)' }}>
                    <h3 style={{ margin: 0, color: 'var(--color-primary)' }}>Simulado - {s.turma_nome}</h3>
                    <span className="badge">{s.total_questoes} questões</span>
                  </div>

                  {/* Info */}
                  <div>
                    <p style={{ margin: '0.5rem 0' }}><strong>Turma:</strong> {s.turma_nome}</p>
                    <p style={{ margin: '0.5rem 0' }}><strong>Criação:</strong> {new Date(s.data_criacao).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })}</p>
                  </div>

                  {/* Questions preview */}
                  {preview.length > 0 && (
                    <div style={{ background: '#f8f9fa', padding: '1rem', borderRadius: '1rem' }}>
                      <strong style={{ display: 'block', marginBottom: '0.5rem', color: 'var(--color-primary)' }}>Questões incluídas:</strong>
                      <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
                        {preview.map(q => (
                          <li key={q.id} style={{ padding: '0.5rem 0', fontSize: '1.4rem', borderBottom: '1px solid var(--border-light)' }}>
                            {q.materia} — {q.enunciado.split(' ').slice(0, 8).join(' ')}{q.enunciado.split(' ').length > 8 ? '...' : ''}
                          </li>
                        ))}
                        {extra > 0 && (
                          <li style={{ padding: '0.5rem 0', fontSize: '1.4rem', color: 'var(--color-secondary)', fontWeight: 600 }}>
                            + {extra} mais...
                          </li>
                        )}
                      </ul>
                    </div>
                  )}

                  {/* Action */}
                  <div style={{ marginTop: 'auto', paddingTop: '0.75rem', borderTop: '1px solid var(--border-light)' }}>
                    <Link href={`/professor/simulados`} className="btn btn-secondary" style={{ fontSize: '1.4rem', padding: '0.8rem 1.5rem' }}>
                      Ver Detalhes
                    </Link>
                  </div>
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
