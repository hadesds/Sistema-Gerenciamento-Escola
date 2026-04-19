'use client';

import { useEffect, useState } from 'react';
import { apiFetch } from '@/lib/api';
import Link from 'next/link';
import Image from 'next/image';
import Navbar from '@/components/Navbar';
import ProtectedRoute from '@/components/ProtectedRoute';
import Loading from '@/components/Loading';

interface AlunoPreview {
  nome: string;
  foto_url: string | null;
}

interface TurmaInfo {
  turma: {
    id: number;
    nome: string;
    serie: string;
    turno: string;
    turno_display: string;
    sala: string;
  };
  total_alunos: number;
  media_turma: number;
  total_avaliacoes: number;
  alunos_preview: AlunoPreview[];
}

function mediaColor(media: number) {
  if (media >= 4) return 'var(--color-success)';
  if (media >= 3) return 'var(--color-warning)';
  return 'var(--color-danger)';
}

export default function ListaTurmasPage() {
  const [turmas, setTurmas] = useState<TurmaInfo[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    apiFetch<TurmaInfo[]>('/professor/turmas/')
      .then(setTurmas)
      .finally(() => setLoading(false));
  }, []);

  return (
    <ProtectedRoute tipo="professor">
      <Navbar />
      <main className="container fade-in">
        <div style={{ marginBottom: '2rem' }}>
          <h1>Minhas Turmas</h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '1.6rem', margin: 0 }}>Selecione uma turma para gerenciar os alunos no carômetro.</p>
        </div>

        {loading ? <Loading /> : turmas.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">📚</div>
            <h2>Nenhuma turma associada</h2>
            <p>Você ainda não está associado a nenhuma turma. Contate o administrador.</p>
          </div>
        ) : (
          <div className="turmas-grid">
            {turmas.map(({ turma, total_alunos, media_turma, total_avaliacoes, alunos_preview }) => (
              <div key={turma.id} className="card" style={{ display: 'flex', flexDirection: 'column', borderLeft: '4px solid var(--color-secondary)' }}>

                {/* Header */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingBottom: '1rem', marginBottom: '1rem', borderBottom: '1px solid var(--border-light)' }}>
                  <h3 style={{ margin: 0, color: 'var(--color-primary)' }}>{turma.nome}</h3>
                  <span className="badge">{total_alunos} alunos</span>
                </div>

                {/* Info */}
                <div style={{ marginBottom: '1.5rem' }}>
                  {turma.serie && <p style={{ margin: '0.5rem 0' }}><strong>Série:</strong> {turma.serie}</p>}
                  <p style={{ margin: '0.5rem 0' }}><strong>Turno:</strong> {turma.turno_display}</p>
                  {turma.sala && <p style={{ margin: '0.5rem 0' }}><strong>Sala:</strong> {turma.sala}</p>}
                  <p style={{ margin: '0.5rem 0' }}>
                    <strong>Média Turma:</strong>{' '}
                    <strong style={{ color: mediaColor(media_turma) }}>{media_turma.toFixed(1)}</strong>
                  </p>
                  <p style={{ margin: '0.5rem 0' }}><strong>Avaliações:</strong> {total_avaliacoes}</p>
                </div>

                {/* Avatar preview */}
                {alunos_preview && alunos_preview.length > 0 && (
                  <div style={{ display: 'flex', marginBottom: '2rem' }}>
                    {alunos_preview.map((aluno, idx) => (
                      <div key={idx} style={{ width: '4rem', height: '4rem', borderRadius: '50%', overflow: 'hidden', marginLeft: idx === 0 ? 0 : '-1rem', border: '2px solid white', boxShadow: '0 0 0 1px var(--border-light)', zIndex: alunos_preview.length - idx, flexShrink: 0 }}>
                        {aluno.foto_url ? (
                          <Image src={aluno.foto_url} alt={aluno.nome} width={40} height={40} style={{ width: '100%', height: '100%', objectFit: 'cover' }} unoptimized />
                        ) : (
                          <div style={{ width: '100%', height: '100%', background: 'var(--color-stat-circle)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 600, fontSize: '1.4rem', color: 'var(--text-primary)' }}>
                            {aluno.nome.charAt(0).toUpperCase()}
                          </div>
                        )}
                      </div>
                    ))}
                    {total_alunos > alunos_preview.length && (
                      <div style={{ width: '4rem', height: '4rem', borderRadius: '50%', background: '#ccc', marginLeft: '-1rem', border: '2px solid white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.2rem', fontWeight: 600, color: 'var(--text-primary)', flexShrink: 0 }}>
                        +{total_alunos - alunos_preview.length}
                      </div>
                    )}
                  </div>
                )}

                {/* Action */}
                <div style={{ marginTop: 'auto' }}>
                  <Link href={`/professor/turma/${turma.id}`} className="btn btn-primary" style={{ display: 'block', textAlign: 'center' }}>
                    <span className="material-icons-outlined">people</span>
                    Ver Carômetro e Avaliar
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
      <footer style={{ textAlign: 'center', padding: '3rem 2rem', color: 'var(--text-secondary)', fontSize: '1.4rem' }}>
        <p>&copy; 2025 Sistema CARA - Gestão Escolar Inteligente</p>
      </footer>
    </ProtectedRoute>
  );
}
