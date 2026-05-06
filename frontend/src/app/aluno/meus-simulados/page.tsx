'use client';

import { useEffect, useState } from 'react';
import { apiFetch } from '@/lib/api';
import Link from 'next/link';
import Navbar from '@/components/Navbar';
import ProtectedRoute from '@/components/ProtectedRoute';
import Loading from '@/components/Loading';

interface Simulado {
  id: number;
  titulo: string;
  turma_nome: string;
  autor_nome: string;
  total_questoes: number;
  data_criacao: string;
  tempo_limite: number | null;
  area_conhecimento: string;
  questoes: Array<{ id: number; materia_sigla: string; materia_nome: string; }>;
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
        <style>{`
          .sim-card { display: flex; flex-direction: column; padding: 0; overflow: hidden; transition: transform 0.18s, box-shadow 0.18s; }
          .sim-card:hover { transform: translateY(-2px); box-shadow: 0 0.6rem 2rem rgba(0,0,0,0.12); }
          .sim-card-top { background: linear-gradient(135deg, var(--color-primary), #1a6bb5); padding: 2.2rem 2.2rem 1.6rem; color: white; }
          .sim-card-body { padding: 1.8rem 2.2rem 2.2rem; flex: 1; display: flex; flex-direction: column; }
          .sim-chip { display: inline-flex; align-items: center; gap: 0.4rem; padding: 0.35rem 0.9rem; border-radius: 10rem; font-size: 1.2rem; font-weight: 600; }
          .sim-pills { display: flex; gap: 0.8rem; flex-wrap: wrap; margin-bottom: 1.4rem; }
          .mat-tag { display: inline-block; background: var(--color-secondary); color: white; padding: 0.3rem 0.8rem; border-radius: 10rem; font-size: 1.2rem; font-weight: 700; }
        `}</style>

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2.4rem', flexWrap: 'wrap', gap: '1rem' }}>
          <div>
            <h1>Meus Simulados</h1>
            <p style={{ color: 'var(--text-secondary)' }}>Simulados disponíveis para a sua turma</p>
          </div>
          <Link href="/aluno/dashboard" className="btn btn-secondary">← Dashboard</Link>
        </div>

        {loading ? <Loading /> : simulados.length === 0 ? (
          <div className="empty-state card">
            <div className="empty-icon">📚</div>
            <h2>Nenhum simulado disponível</h2>
            <p>Aguarde os professores criarem simulados para a sua turma.</p>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(32rem,1fr))', gap: '1.8rem' }}>
            {simulados.map(s => {
              const siglas = Array.from(new Set(s.questoes.map(q => q.materia_sigla).filter(Boolean)));

              return (
                <div key={s.id} className="card sim-card">
                  {/* Gradient top */}
                  <div className="sim-card-top">
                    <p style={{ color: 'rgba(255,255,255,0.7)', fontSize: '1.2rem', marginBottom: '0.3rem' }}>
                      {new Date(s.data_criacao).toLocaleDateString('pt-BR')}
                    </p>
                    <h3 style={{ color: 'white', fontSize: '1.8rem', margin: '0 0 0.4rem', wordBreak: 'break-word' }}>
                      {s.titulo || `Simulado — ${s.turma_nome}`}
                    </h3>
                    <p style={{ color: 'rgba(255,255,255,0.8)', fontSize: '1.3rem', margin: 0 }}>
                      Prof. {s.autor_nome}
                    </p>
                  </div>

                  {/* Body */}
                  <div className="sim-card-body">
                    {/* Stats chips */}
                    <div className="sim-pills">
                      <span className="sim-chip" style={{ background: '#e8f4fd', color: '#1a4fa0' }}>
                        <span className="material-icons-outlined" style={{ fontSize: '1.5rem' }}>quiz</span>
                        {s.total_questoes} questões
                      </span>
                      <span className="sim-chip" style={{ background: '#fef3e2', color: '#e67e22' }}>
                        <span className="material-icons-outlined" style={{ fontSize: '1.5rem' }}>timer</span>
                        {s.tempo_limite ? `${s.tempo_limite} min` : 'Sem limite'}
                      </span>
                      {s.area_conhecimento && (
                        <span className="sim-chip" style={{ background: '#e8f5e9', color: '#1b5e20' }}>
                          <span className="material-icons-outlined" style={{ fontSize: '1.5rem' }}>school</span>
                          {s.area_conhecimento}
                        </span>
                      )}
                    </div>

                    {/* Matérias */}
                    {siglas.length > 0 && (
                      <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', marginBottom: '1.6rem' }}>
                        {siglas.map(sigla => (
                          <span key={sigla} className="mat-tag">{sigla}</span>
                        ))}
                      </div>
                    )}

                    <div style={{ marginTop: 'auto' }}>
                      <Link
                        href={`/aluno/simulado/${s.id}`}
                        className="btn btn-primary"
                        style={{ width: '100%', textAlign: 'center', justifyContent: 'center', fontSize: '1.5rem' }}
                      >
                        <span className="material-icons-outlined">play_arrow</span>
                        Fazer Simulado
                      </Link>
                    </div>
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
