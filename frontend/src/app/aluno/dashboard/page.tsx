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
        <style>{`
          /* Grid de 2 colunas → 1 coluna no mobile */
          .aluno-two-col {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 2rem;
            margin-bottom: 2rem;
          }
          .aluno-two-col > * { min-width: 0; }

          @media (max-width: 900px) {
            .aluno-two-col { grid-template-columns: 1fr; }
          }

          /* Stats: 3 colunas em desktop, 2 no tablet/mobile, 1 no pequeno */
          @media (max-width: 900px) {
            .stats-grid { grid-template-columns: repeat(2, 1fr) !important; }
          }
          @media (max-width: 480px) {
            .stats-grid { grid-template-columns: 1fr !important; }
          }
          .stat-card { min-width: 0; overflow: hidden; }
          .stat-info { min-width: 0; overflow: hidden; }
          .stat-info h3 { white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }

          /* Perfil header responsivo */
          .aluno-perfil-header {
            display: flex;
            align-items: center;
            gap: 2rem;
            flex-wrap: wrap;
          }
          .aluno-perfil-foto {
            width: 9rem;
            height: 9rem;
            border-radius: 50%;
            object-fit: cover;
            border: 3px solid #1a73c7;
            flex-shrink: 0;
          }
          .aluno-perfil-placeholder {
            width: 9rem;
            height: 9rem;
            border-radius: 50%;
            background: linear-gradient(135deg, #0d2d6b, #1a73c7);
            display: flex;
            align-items: center;
            justify-content: center;
            color: #fff;
            font-size: 3.2rem;
            font-weight: 700;
            flex-shrink: 0;
          }
          .aluno-perfil-info { min-width: 0; }
          .aluno-perfil-info h2 {
            font-size: 2.4rem;
            margin-bottom: 0.4rem;
            white-space: nowrap;
            overflow: hidden;
            text-overflow: ellipsis;
          }
          @media (max-width: 480px) {
            .aluno-perfil-header { flex-direction: column; align-items: flex-start; }
            .aluno-perfil-info h2 { white-space: normal; font-size: 2rem; }
          }

          /* Tabela com scroll horizontal em telas pequenas */
          .table-scroll {
            overflow-x: auto;
            -webkit-overflow-scrolling: touch;
            border-radius: 1.2rem;
          }
          .table-scroll .feedback-table { margin-top: 0; min-width: 28rem; }

          /* Card de simulado */
          .simulado-item {
            display: flex;
            justify-content: space-between;
            align-items: center;
            gap: 1.2rem;
            padding: 1rem 1.2rem;
            border-radius: 1rem;
            background: var(--bg-card-add);
            margin-bottom: 1rem;
          }
          .simulado-item-info { min-width: 0; }
          .simulado-item-info strong {
            font-size: 1.5rem;
            display: block;
            white-space: nowrap;
            overflow: hidden;
            text-overflow: ellipsis;
          }
          .simulado-item-info p {
            margin: 0;
            white-space: nowrap;
            overflow: hidden;
            text-overflow: ellipsis;
          }
          .simulado-item .btn { flex-shrink: 0; }

          /* Cabeçalho de seção (título + link "ver todos") */
          .section-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 1.5rem;
            gap: 1rem;
            flex-wrap: wrap;
          }
          .section-header h2 { margin: 0; }
        `}</style>

        {loading ? <Loading /> : !data ? null : (
          <>
            {/* Perfil */}
            <div className="card" style={{ marginBottom: '2rem' }}>
              <div className="aluno-perfil-header">
                {data.aluno.foto_url ? (
                  <Image
                    src={data.aluno.foto_url}
                    alt={data.aluno.nome}
                    width={90}
                    height={90}
                    className="aluno-perfil-foto"
                    unoptimized
                  />
                ) : (
                  <div className="aluno-perfil-placeholder">
                    {data.aluno.nome.charAt(0).toUpperCase()}
                  </div>
                )}
                <div className="aluno-perfil-info">
                  <h2>Olá, {data.aluno.nome}!</h2>
                  {data.aluno.matricula && (
                    <p><strong>Matrícula:</strong> {data.aluno.matricula}</p>
                  )}
                  <p><strong>Turma:</strong> {data.aluno.turma}</p>
                  {data.evolucao !== 0 && (
                    <p style={{ color: data.evolucao > 0 ? 'var(--color-success)' : 'var(--color-danger)', marginTop: '0.4rem' }}>
                      {data.evolucao > 0 ? '↑' : '↓'} {Math.abs(data.evolucao).toFixed(2)} em relação à média anterior
                    </p>
                  )}
                </div>
              </div>
            </div>

            {/* Stats */}
            <div className="stats-grid" style={{ marginBottom: '2rem' }}>
              {[
                { icon: 'grade',                label: 'Média Geral',       value: data.media_geral.toFixed(2),              bg: 'linear-gradient(135deg,#0d2d6b,#1a4fa0)' },
                { icon: 'event_available',       label: 'Assiduidade',       value: data.medias.assiduidade.toFixed(1),       bg: 'linear-gradient(135deg,#27ae60,#229954)' },
                { icon: 'record_voice_over',     label: 'Participação',      value: data.medias.participacao.toFixed(1),      bg: 'linear-gradient(135deg,#1a73c7,#1a4fa0)' },
                { icon: 'assignment_turned_in',  label: 'Responsabilidade',  value: data.medias.responsabilidade.toFixed(1),  bg: 'linear-gradient(135deg,#f39c12,#e67e22)' },
                { icon: 'people',                label: 'Sociabilidade',     value: data.medias.sociabilidade.toFixed(1),     bg: 'linear-gradient(135deg,#9b59b6,#8e44ad)' },
                { icon: 'assessment',            label: 'Avaliações',        value: String(data.total_avaliacoes),            bg: 'linear-gradient(135deg,#e74c3c,#c0392b)' },
              ].map(s => (
                <div key={s.label} className="stat-card">
                  <div className="stat-icon" style={{ background: s.bg }}>
                    <span className="material-icons-outlined">{s.icon}</span>
                  </div>
                  <div className="stat-info">
                    <h3>{s.value}</h3>
                    <p>{s.label}</p>
                  </div>
                </div>
              ))}
            </div>

            {/* Grid: Avaliações + Simulados */}
            <div className="aluno-two-col">

              {/* Avaliações recentes */}
              <div className="card">
                <div className="section-header">
                  <h2>
                    <span className="material-icons-outlined" style={{ verticalAlign: 'middle', marginRight: '0.5rem' }}>history</span>
                    Últimas Avaliações
                  </h2>
                  <Link href="/aluno/meu-feedback" className="btn btn-secondary" style={{ fontSize: '1.3rem', padding: '0.6rem 1.2rem', whiteSpace: 'nowrap' }}>
                    Ver todas
                  </Link>
                </div>
                {data.avaliacoes_recentes.length === 0 ? (
                  <div className="empty-state">
                    <div className="empty-icon">📝</div>
                    <p>Nenhuma avaliação registrada ainda.</p>
                  </div>
                ) : (
                  <div className="table-scroll">
                    <table className="feedback-table">
                      <thead>
                        <tr>
                          <th>Data</th>
                          <th>Assid.</th>
                          <th>Part.</th>
                          <th>Resp.</th>
                          <th>Soc.</th>
                          <th>Média</th>
                        </tr>
                      </thead>
                      <tbody>
                        {data.avaliacoes_recentes.map(av => (
                          <tr key={av.id}>
                            <td style={{ whiteSpace: 'nowrap' }}>{new Date(av.data).toLocaleDateString('pt-BR')}</td>
                            <td>{av.assiduidade.toFixed(1)}</td>
                            <td>{av.participacao.toFixed(1)}</td>
                            <td>{av.responsabilidade.toFixed(1)}</td>
                            <td>{av.sociabilidade.toFixed(1)}</td>
                            <td><NotaBadge nota={av.media} /></td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>

              {/* Simulados disponíveis */}
              <div className="card">
                <div className="section-header">
                  <h2>
                    <span className="material-icons-outlined" style={{ verticalAlign: 'middle', marginRight: '0.5rem' }}>quiz</span>
                    Simulados Disponíveis
                  </h2>
                  <Link href="/aluno/meus-simulados" className="btn btn-secondary" style={{ fontSize: '1.3rem', padding: '0.6rem 1.2rem', whiteSpace: 'nowrap' }}>
                    Ver todos
                  </Link>
                </div>
                {data.simulados.length === 0 ? (
                  <div className="empty-state">
                    <div className="empty-icon">📚</div>
                    <p>Nenhum simulado disponível para sua turma.</p>
                  </div>
                ) : (
                  data.simulados.map(s => (
                    <div key={s.id} className="simulado-item">
                      <div className="simulado-item-info">
                        <strong>Simulado #{s.id}</strong>
                        <p>{s.total_questoes} questões · Prof. {s.autor_nome}</p>
                      </div>
                      <Link href={`/aluno/simulado/${s.id}`} className="btn btn-primary" style={{ fontSize: '1.3rem', padding: '0.6rem 1.2rem' }}>
                        Abrir
                      </Link>
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
