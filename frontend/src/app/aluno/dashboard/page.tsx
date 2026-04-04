'use client';

import { useEffect, useState } from 'react';
import { apiFetch } from '@/lib/api';
import Link from 'next/link';
import Image from 'next/image';
import Navbar from '@/components/Navbar';
import ProtectedRoute from '@/components/ProtectedRoute';
import Loading from '@/components/Loading';
import NotaBadge from '@/components/NotaBadge';

interface AlunoDashboard {
  aluno: {
    id: number;
    nome: string;
    matricula: string | null;
    turma: string;
    foto_url: string | null;
  };
  media_geral: number;
  medias: {
    assiduidade: number;
    participacao: number;
    responsabilidade: number;
    sociabilidade: number;
  };
  avaliacoes_recentes: Array<{
    id: number;
    assiduidade: number;
    participacao: number;
    responsabilidade: number;
    sociabilidade: number;
    media: number;
    data: string;
  }>;
  total_avaliacoes: number;
  evolucao: number;
  simulados: Array<{
    id: number;
    turma_nome: string;
    autor_nome: string;
    total_questoes: number;
    data_criacao: string;
  }>;
}

export default function AlunoDashboardPage() {
  const [data, setData] = useState<AlunoDashboard | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    apiFetch<AlunoDashboard>('/aluno/dashboard/')
      .then(setData)
      .finally(() => setLoading(false));
  }, []);

  return (
    <ProtectedRoute tipo="aluno">
      <Navbar />
      <main className="container fade-in">
        {loading ? <Loading /> : !data ? null : (
          <>
            {/* Perfil */}
            <div className="card">
              <div className="perfil-header">
                {data.aluno.foto_url ? (
                  <Image src={data.aluno.foto_url} alt={data.aluno.nome} width={120} height={120} className="perfil-foto" unoptimized />
                ) : (
                  <div className="perfil-foto-placeholder">{data.aluno.nome.charAt(0).toUpperCase()}</div>
                )}
                <div className="perfil-info">
                  <h2>Olá, {data.aluno.nome}!</h2>
                  {data.aluno.matricula && <p><strong>Matrícula:</strong> {data.aluno.matricula}</p>}
                  <p><strong>Turma:</strong> {data.aluno.turma}</p>
                  {data.evolucao !== 0 && (
                    <p style={{ color: data.evolucao > 0 ? 'var(--color-success)' : 'var(--color-danger)' }}>
                      {data.evolucao > 0 ? '↑' : '↓'} {Math.abs(data.evolucao).toFixed(2)} em relação à média
                    </p>
                  )}
                </div>
              </div>
            </div>

            {/* Stats */}
            <div className="stats-grid">
              <div className="stat-card">
                <div className="stat-icon"><span className="material-icons-outlined">grade</span></div>
                <div className="stat-info">
                  <h3>{data.media_geral.toFixed(2)}</h3>
                  <p>Média Geral</p>
                </div>
              </div>
              <div className="stat-card">
                <div className="stat-icon"><span className="material-icons-outlined">event_available</span></div>
                <div className="stat-info">
                  <h3>{data.medias.assiduidade.toFixed(1)}</h3>
                  <p>Assiduidade</p>
                </div>
              </div>
              <div className="stat-card">
                <div className="stat-icon"><span className="material-icons-outlined">record_voice_over</span></div>
                <div className="stat-info">
                  <h3>{data.medias.participacao.toFixed(1)}</h3>
                  <p>Participação</p>
                </div>
              </div>
              <div className="stat-card">
                <div className="stat-icon"><span className="material-icons-outlined">assignment_turned_in</span></div>
                <div className="stat-info">
                  <h3>{data.medias.responsabilidade.toFixed(1)}</h3>
                  <p>Responsabilidade</p>
                </div>
              </div>
              <div className="stat-card">
                <div className="stat-icon"><span className="material-icons-outlined">people</span></div>
                <div className="stat-info">
                  <h3>{data.medias.sociabilidade.toFixed(1)}</h3>
                  <p>Sociabilidade</p>
                </div>
              </div>
              <div className="stat-card">
                <div className="stat-icon"><span className="material-icons-outlined">assessment</span></div>
                <div className="stat-info">
                  <h3>{data.total_avaliacoes}</h3>
                  <p>Avaliações</p>
                </div>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem' }}>
              {/* Avaliações recentes */}
              <div className="card">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                  <h2>Últimas Avaliações</h2>
                  <Link href="/aluno/meu-feedback" className="btn btn-secondary" style={{ fontSize: '1.3rem', padding: '0.6rem 1.2rem' }}>
                    Ver todas
                  </Link>
                </div>
                {data.avaliacoes_recentes.length === 0 ? (
                  <p>Nenhuma avaliação registrada ainda.</p>
                ) : (
                  <table className="feedback-table">
                    <thead>
                      <tr>
                        <th>Data</th>
                        <th>Média</th>
                      </tr>
                    </thead>
                    <tbody>
                      {data.avaliacoes_recentes.map(av => (
                        <tr key={av.id}>
                          <td>{new Date(av.data).toLocaleDateString('pt-BR')}</td>
                          <td><NotaBadge nota={av.media} /></td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>

              {/* Simulados disponíveis */}
              <div className="card">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                  <h2>Simulados Disponíveis</h2>
                  <Link href="/aluno/meus-simulados" className="btn btn-secondary" style={{ fontSize: '1.3rem', padding: '0.6rem 1.2rem' }}>
                    Ver todos
                  </Link>
                </div>
                {data.simulados.length === 0 ? (
                  <p>Nenhum simulado disponível para sua turma.</p>
                ) : (
                  data.simulados.map(s => (
                    <div key={s.id} style={{ padding: '1rem', borderRadius: '1rem', background: 'var(--bg-card-add)', marginBottom: '1rem' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div>
                          <strong style={{ fontSize: '1.5rem' }}>Simulado #{s.id}</strong>
                          <p style={{ margin: 0 }}>{s.total_questoes} questões · Prof. {s.autor_nome}</p>
                        </div>
                        <Link href={`/aluno/simulado/${s.id}`} className="btn btn-primary" style={{ fontSize: '1.3rem', padding: '0.6rem 1.2rem' }}>
                          Abrir
                        </Link>
                      </div>
                    </div>
                  ))
                )}
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
