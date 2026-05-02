'use client';

import { useEffect, useState } from 'react';
import { apiFetch } from '@/lib/api';
import Link from 'next/link';
import Image from 'next/image';
import Navbar from '@/components/Navbar';
import ProtectedRoute from '@/components/ProtectedRoute';
import Loading from '@/components/Loading';
import NotaBadge from '@/components/NotaBadge';
import { useAuth } from '@/context/AuthContext';

interface DashboardData {
  total_alunos: number;
  total_turmas: number;
  total_questoes: number;
  total_simulados: number;
  avaliacoes_recentes: Array<{
    id: number;
    aluno_nome: string;
    aluno_turma: string;
    media: number;
    data: string;
  }>;
  top_alunos: Array<{
    id: number;
    nome: string;
    media_geral: number;
    turma: string;
    foto_url: string | null;
  }>;
  desempenho_turmas: Array<{
    turma: string;
    media: number;
    total_alunos: number;
    total_avaliacoes: number;
  }>;
  turmas: Array<{
    id: number;
    nome: string;
    total_alunos: number;
  }>;
}

const STAT_ICONS = [
  { icon: 'groups',     label: 'Total de Alunos',  key: 'total_alunos'    as const, bg: 'linear-gradient(135deg, #3498db, #2980b9)' },
  { icon: 'class',      label: 'Minhas Turmas',     key: 'total_turmas'    as const, bg: 'linear-gradient(135deg, #27ae60, #229954)' },
  { icon: 'quiz',       label: 'Questões no Banco', key: 'total_questoes'  as const, bg: 'linear-gradient(135deg, #f39c12, #e67e22)' },
  { icon: 'assignment', label: 'Simulados Criados', key: 'total_simulados' as const, bg: 'linear-gradient(135deg, #e74c3c, #c0392b)' },
];

const QUICK_ACTIONS = [
  { href: '/professor/turmas',         icon: 'groups',         label: 'Ver Turmas' },
  { href: '/professor/banco-questoes', icon: 'library_books',  label: 'Banco de Questões' },
  { href: '/professor/criar-simulado', icon: 'edit_note',      label: 'Criar Simulado' },
  { href: '/professor/simulados',      icon: 'folder_special', label: 'Meus Simulados' },
];

function rankBg(idx: number) {
  if (idx === 0) return 'linear-gradient(135deg, #f39c12, #e67e22)';
  if (idx === 1) return 'linear-gradient(135deg, #95a5a6, #7f8c8d)';
  if (idx === 2) return 'linear-gradient(135deg, #cd7f32, #b8722e)';
  return 'var(--color-stat-circle)';
}

export default function ProfessorDashboardPage() {
  const { user } = useAuth();
  const [data, setData]     = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [now, setNow]       = useState(new Date());
  const [search, setSearch] = useState('');

  useEffect(() => {
    apiFetch<DashboardData>('/professor/dashboard/')
      .then(setData)
      .finally(() => setLoading(false));
    const timer = setInterval(() => setNow(new Date()), 60000);
    return () => clearInterval(timer);
  }, []);

  const dateStr = now.toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
  const timeStr = now.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });

  const q = search.toLowerCase().trim();
  const hit = (...terms: string[]) => !q || terms.some(t => t.toLowerCase().includes(q));

  const showStats      = hit('estatística', 'alunos', 'turmas', 'questões', 'simulados', 'total');
  const showActions    = hit('ações', 'rápidas', 'turmas', 'questões', 'simulado', 'banco', 'criar');
  const showDesempenho = hit('desempenho', 'turma', ...(data?.desempenho_turmas.map(t => t.turma) ?? []));
  const showAvaliacoes = hit('avaliações', 'recentes', ...(data?.avaliacoes_recentes.map(a => a.aluno_nome) ?? []));
  const showTop        = hit('top', 'ranking', 'alunos', ...(data?.top_alunos.map(a => a.nome) ?? []));
  const showTurmas     = hit('minhas', 'turmas', ...(data?.turmas.map(t => t.nome) ?? []));

  return (
    <ProtectedRoute tipo="professor">
      <Navbar />
      <main className="container fade-in">
        <style>{`
          /* Grid de 2 colunas → 1 coluna no mobile */
          .dash-two-col {
            display: grid;
            grid-template-columns: 1.5fr 1fr;
            gap: 2rem;
          }
          @media (max-width: 768px) {
            .dash-two-col { grid-template-columns: 1fr; }
            .stats-grid   { grid-template-columns: repeat(2, 1fr); }
            .dash-actions-grid { grid-template-columns: repeat(2, 1fr) !important; }
          }
          @media (max-width: 400px) {
            .stats-grid   { grid-template-columns: 1fr; }
            .dash-actions-grid { grid-template-columns: 1fr !important; }
          }

          /* Barra de busca */
          .dash-search-wrap {
            display: flex;
            align-items: center;
            gap: 1rem;
            background: #fff;
            border: 2px solid #d0daea;
            border-radius: 1.2rem;
            padding: 1.1rem 1.6rem;
            margin-bottom: 2.4rem;
            box-shadow: 0 2px 8px rgba(13,45,107,0.06);
            transition: border-color 0.2s, box-shadow 0.2s;
          }
          .dash-search-wrap:focus-within {
            border-color: #1a73c7;
            box-shadow: 0 0 0 3px rgba(26,115,199,0.1);
          }
          .dash-search-wrap .material-icons-outlined { color: #94a3b8; font-size: 2.2rem; flex-shrink: 0; }
          .dash-search-input {
            flex: 1; border: none; outline: none;
            font-size: 1.5rem; font-family: 'Poppins', sans-serif;
            color: #1a2a4a; background: transparent; min-width: 0;
          }
          .dash-search-input::placeholder { color: #b0bec5; }
          .dash-search-clear {
            background: none; border: none; cursor: pointer;
            color: #94a3b8; display: flex; align-items: center;
            padding: 0; transition: color 0.2s;
          }
          .dash-search-clear:hover { color: #0d2d6b; }
          .dash-search-clear .material-icons-outlined { font-size: 2rem; }

          /* Sem resultados */
          .dash-no-results {
            text-align: center; padding: 4rem 2rem;
            color: #94a3b8; font-size: 1.5rem;
          }
          .dash-no-results .material-icons-outlined {
            font-size: 4rem; display: block; margin-bottom: 1rem; color: #d0daea;
          }

          /* Hero responsivo */
          @media (max-width: 500px) {
            .dash-hero-inner { flex-direction: column !important; align-items: flex-start !important; }
            .dash-hero-time  { text-align: left !important; }
          }
        `}</style>

        {/* Hero card */}
        <div className="card" style={{ background: 'linear-gradient(135deg, #0d2d6b, #1a73c7)', color: 'white', marginBottom: '2.4rem' }}>
          <div className="dash-hero-inner" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
            <div>
              <h1 style={{ color: 'white', marginBottom: '0.5rem' }}>Dashboard do Professor</h1>
              <p style={{ color: 'rgba(255,255,255,0.9)', fontSize: '1.6rem', margin: 0 }}>
                Bem-vindo(a), <strong>{user?.nome_completo}</strong>! 👋
              </p>
            </div>
            <div className="dash-hero-time" style={{ textAlign: 'right' }}>
              <p style={{ color: 'rgba(255,255,255,0.9)', margin: 0, fontSize: '1.4rem', textTransform: 'capitalize' }}>{dateStr}</p>
              <p style={{ color: 'rgba(255,255,255,0.9)', margin: 0, fontSize: '1.8rem', fontWeight: 600 }}>{timeStr}</p>
            </div>
          </div>
        </div>

        {/* Barra de busca */}
        <div className="dash-search-wrap">
          <span className="material-icons-outlined">search</span>
          <input
            className="dash-search-input"
            type="text"
            placeholder="Buscar seção, turma ou aluno…"
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
          {search && (
            <button className="dash-search-clear" onClick={() => setSearch('')} aria-label="Limpar busca">
              <span className="material-icons-outlined">close</span>
            </button>
          )}
        </div>

        {loading ? <Loading /> : data && (
          <>
            {/* Sem resultados */}
            {q && !showStats && !showActions && !showDesempenho && !showAvaliacoes && !showTop && !showTurmas && (
              <div className="dash-no-results">
                <span className="material-icons-outlined">search_off</span>
                Nenhuma seção encontrada para <strong>&ldquo;{search}&rdquo;</strong>
              </div>
            )}

            {/* Stats */}
            {showStats && (
              <div id="stats" className="stats-grid" style={{ marginBottom: '2rem' }}>
                {STAT_ICONS.map(s => (
                  <div key={s.key} className="stat-card">
                    <div className="stat-icon" style={{ background: s.bg }}>
                      <span className="material-icons-outlined">{s.icon}</span>
                    </div>
                    <div className="stat-info">
                      <h3>{data[s.key]}</h3>
                      <p>{s.label}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Ações Rápidas */}
            {showActions && (
              <div id="acoes" className="card mb-2">
                <h2 style={{ marginBottom: '2rem' }}>
                  <span className="material-icons-outlined" style={{ verticalAlign: 'middle', marginRight: '0.5rem' }}>bolt</span>
                  Ações Rápidas
                </h2>
                <div className="dash-actions-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(16rem, 1fr))', gap: '1.5rem' }}>
                  {QUICK_ACTIONS.map(a => (
                    <Link key={a.href} href={a.href} className="btn btn-primary"
                      style={{ padding: '2rem', textAlign: 'center', display: 'flex', flexDirection: 'column', gap: '1rem', alignItems: 'center' }}>
                      <span className="material-icons-outlined" style={{ fontSize: '3rem' }}>{a.icon}</span>
                      <span>{a.label}</span>
                    </Link>
                  ))}
                </div>
              </div>
            )}

            {/* Grid de 2 colunas (1 no mobile) */}
            <div className="dash-two-col">

              {/* Coluna esquerda */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
                {showDesempenho && (
                  <div id="desempenho" className="card">
                    <h2 style={{ marginBottom: '2rem' }}>
                      <span className="material-icons-outlined" style={{ verticalAlign: 'middle', marginRight: '0.5rem' }}>trending_up</span>
                      Desempenho por Turma
                    </h2>
                    {data.desempenho_turmas.length === 0 ? (
                      <div className="empty-state"><div className="empty-icon">📊</div><p>Nenhuma avaliação registrada ainda.</p></div>
                    ) : (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
                        {data.desempenho_turmas.map(t => (
                          <div key={t.turma} style={{ padding: '1.5rem', background: 'white', borderRadius: '1.2rem', borderLeft: '4px solid var(--color-secondary)' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                              <h3 style={{ margin: 0 }}>{t.turma}</h3>
                              <span className="badge">{t.total_alunos} alunos</span>
                            </div>
                            <div className="progress-bar" style={{ height: '1.5rem', marginBottom: '1rem' }}>
                              <div className="progress-fill" style={{ width: `${(t.media / 5) * 100}%`, background: 'linear-gradient(90deg, var(--color-primary), var(--color-secondary))' }} />
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '1.4rem', color: 'var(--text-secondary)' }}>
                              <span>Média: <strong style={{ color: 'var(--text-primary)' }}>{t.media.toFixed(1)}</strong></span>
                              <span><strong>{t.total_avaliacoes}</strong> avaliações</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {showAvaliacoes && (
                  <div id="avaliacoes" className="card">
                    <h2 style={{ marginBottom: '2rem' }}>
                      <span className="material-icons-outlined" style={{ verticalAlign: 'middle', marginRight: '0.5rem' }}>history</span>
                      Avaliações Recentes
                    </h2>
                    {data.avaliacoes_recentes.length === 0 ? (
                      <div className="empty-state"><div className="empty-icon">📝</div><p>Nenhuma avaliação nos últimos 7 dias.</p></div>
                    ) : (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                        {data.avaliacoes_recentes.map(av => (
                          <div key={av.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1.5rem', background: 'white', borderRadius: '1.2rem', gap: '1rem' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem', minWidth: 0 }}>
                              <div style={{ width: '5rem', height: '5rem', borderRadius: '50%', background: 'var(--color-stat-circle)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 600, fontSize: '2rem', color: 'var(--text-primary)', flexShrink: 0 }}>
                                {av.aluno_nome.charAt(0).toUpperCase()}
                              </div>
                              <div style={{ minWidth: 0 }}>
                                <strong style={{ fontSize: '1.5rem', display: 'block', marginBottom: '0.3rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{av.aluno_nome}</strong>
                                <small style={{ color: 'var(--text-secondary)', fontSize: '1.3rem' }}>{av.aluno_turma}</small>
                              </div>
                            </div>
                            <div style={{ textAlign: 'right', flexShrink: 0 }}>
                              <NotaBadge nota={av.media} />
                              <small style={{ display: 'block', marginTop: '0.5rem', color: 'var(--text-secondary)', fontSize: '1.2rem' }}>
                                {new Date(av.data).toLocaleDateString('pt-BR')}
                              </small>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Coluna direita */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
                {showTop && (
                  <div id="top-alunos" className="card" style={{ background: 'linear-gradient(135deg, #e8f0fc, white)' }}>
                    <h2 style={{ marginBottom: '2rem' }}>
                      <span className="material-icons-outlined" style={{ verticalAlign: 'middle', marginRight: '0.5rem' }}>emoji_events</span>
                      Top 5 Alunos
                    </h2>
                    {data.top_alunos.length === 0 ? (
                      <div className="empty-state"><div className="empty-icon">🏆</div><p>Nenhuma avaliação registrada ainda.</p></div>
                    ) : (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                        {data.top_alunos.map((aluno, idx) => (
                          <div key={aluno.id} style={{ display: 'flex', alignItems: 'center', gap: '1.2rem', padding: '1.5rem', background: 'white', borderRadius: '1.2rem', boxShadow: '0 0.2rem 0.8rem rgba(0,0,0,0.05)' }}>
                            <div style={{ width: '3.6rem', height: '3.6rem', borderRadius: '50%', background: rankBg(idx), color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: '1.6rem', flexShrink: 0 }}>
                              {idx + 1}
                            </div>
                            {aluno.foto_url && (
                              <Image src={aluno.foto_url} alt={aluno.nome} width={36} height={36} style={{ borderRadius: '50%', objectFit: 'cover', flexShrink: 0 }} unoptimized />
                            )}
                            <div style={{ flex: 1, minWidth: 0 }}>
                              <strong style={{ display: 'block', fontSize: '1.45rem', marginBottom: '0.2rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{aluno.nome}</strong>
                              <small style={{ color: 'var(--text-secondary)', fontSize: '1.2rem' }}>{aluno.turma}</small>
                            </div>
                            <div style={{ padding: '0.6rem 1.2rem', background: 'linear-gradient(135deg, var(--color-success), #229954)', color: 'white', borderRadius: '1rem', fontWeight: 600, fontSize: '1.4rem', flexShrink: 0 }}>
                              {aluno.media_geral}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {showTurmas && (
                  <div id="turmas" className="card">
                    <h2 style={{ marginBottom: '2rem' }}>
                      <span className="material-icons-outlined" style={{ verticalAlign: 'middle', marginRight: '0.5rem' }}>school</span>
                      Minhas Turmas
                    </h2>
                    {!data.turmas || data.turmas.length === 0 ? (
                      <div className="empty-state"><div className="empty-icon">👥</div><p>Nenhuma turma associada.</p></div>
                    ) : (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                        {data.turmas.map(t => (
                          <Link key={t.id} href={`/professor/turma/${t.id}`} className="turma-link-item"
                            style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '1.5rem', background: 'white', borderRadius: '1.2rem', textDecoration: 'none', color: 'inherit', transition: 'all 0.3s ease', border: '2px solid transparent' }}>
                            <div>
                              <div style={{ padding: '0.5rem 1.2rem', background: 'var(--color-secondary)', color: 'white', borderRadius: '0.8rem', display: 'inline-block', fontWeight: 600, marginBottom: '0.5rem', fontSize: '1.4rem' }}>
                                {t.nome}
                              </div>
                              <div style={{ fontSize: '1.3rem', color: 'var(--text-secondary)' }}>
                                <span className="material-icons-outlined" style={{ verticalAlign: 'middle', fontSize: '1.6rem' }}>person</span>
                                {' '}{t.total_alunos} alunos
                              </div>
                            </div>
                            <span className="material-icons-outlined" style={{ color: 'var(--color-secondary)', fontSize: '2.4rem' }}>arrow_forward_ios</span>
                          </Link>
                        ))}
                      </div>
                    )}
                  </div>
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
