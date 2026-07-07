'use client';

import { useEffect, useState, useCallback } from 'react';
import { apiFetch } from '@/lib/api';
import Link from 'next/link';
import Image from 'next/image';
import { useParams } from 'next/navigation';
import Navbar from '@/components/Navbar';
import ProtectedRoute from '@/components/ProtectedRoute';
import Loading from '@/components/Loading';
import Alert from '@/components/Alert';
import NotaBadge from '@/components/NotaBadge';

interface AlunoInfo {
  id: number;
  nome: string;
  matricula: string | null;
  foto_url: string | null;
  media_geral: number;
  total_avaliacoes: number;
  papel: 'lider' | 'vice' | null;
}

interface CarometroData {
  turma: { id: number; nome: string; serie: string; turno_display: string; sala: string };
  alunos: AlunoInfo[];
  busca: string;
}

interface AvaliacaoForm {
  assiduidade: number;
  participacao: number;
  responsabilidade: number;
  sociabilidade: number;
  observacao: string;
}

const FORM_INIT: AvaliacaoForm = {
  assiduidade: 3.0, participacao: 3.0, responsabilidade: 3.0, sociabilidade: 3.0,
  observacao: '',
};

export default function CarometroPage() {
  const params = useParams();
  const turmaId = params.id as string;

  const [data, setData] = useState<CarometroData | null>(null);
  const [loading, setLoading] = useState(true);
  const [busca, setBusca] = useState('');

  // Modal avaliação
  const [alunoAvaliando, setAlunoAvaliando] = useState<AlunoInfo | null>(null);
  const [form, setForm] = useState<AvaliacaoForm>(FORM_INIT);

  const [alert, setAlert] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [perfilSubmitting, setPerfilSubmitting] = useState<number | null>(null);

  const fetchData = useCallback((query = '') => {
    setLoading(true);
    apiFetch<CarometroData>(`/professor/turma/${turmaId}/?busca=${encodeURIComponent(query)}`)
      .then(setData)
      .finally(() => setLoading(false));
  }, [turmaId]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  function handleBusca(e: React.FormEvent) {
    e.preventDefault();
    fetchData(busca);
  }

  async function handleAvaliar(e: React.FormEvent) {
    e.preventDefault();
    if (!alunoAvaliando) return;
    setSubmitting(true);
    try {
      await apiFetch(`/professor/avaliar/${alunoAvaliando.id}/`, {
        method: 'POST',
        body: JSON.stringify({
          assiduidade: form.assiduidade,
          participacao: form.participacao,
          responsabilidade: form.responsabilidade,
          sociabilidade: form.sociabilidade,
          observacao: form.observacao,
        }),
      });
      setAlert({ type: 'success', message: `Avaliação de ${alunoAvaliando.nome} registrada!` });
      setAlunoAvaliando(null);
      fetchData(busca);
    } catch {
      setAlert({ type: 'error', message: 'Erro ao registrar avaliação.' });
    } finally {
      setSubmitting(false);
    }
  }

  async function handleAtribuirPerfil(aluno: AlunoInfo, papel: 'lider' | 'vice') {
    setPerfilSubmitting(aluno.id);
    try {
      await apiFetch(`/professor/perfil/${aluno.id}/`, {
        method: 'POST',
        body: JSON.stringify({ papel }),
      });
      setAlert({ type: 'success', message: `${aluno.nome} definido como ${papel === 'lider' ? 'Líder' : 'Vice-Líder'}!` });
      fetchData(busca);
    } catch {
      setAlert({ type: 'error', message: 'Erro ao atribuir perfil.' });
    } finally {
      setPerfilSubmitting(null);
    }
  }

  async function handleRemoverPerfil(aluno: AlunoInfo) {
    setPerfilSubmitting(aluno.id);
    try {
      await apiFetch(`/professor/perfil/${aluno.id}/`, { method: 'DELETE' });
      setAlert({ type: 'success', message: `Perfil de ${aluno.nome} removido.` });
      fetchData(busca);
    } catch {
      setAlert({ type: 'error', message: 'Erro ao remover perfil.' });
    } finally {
      setPerfilSubmitting(null);
    }
  }

  const RatingInput = ({ name, label, value }: {
    name: keyof Pick<AvaliacaoForm, 'assiduidade' | 'participacao' | 'responsabilidade' | 'sociabilidade'>;
    label: string; value: number;
  }) => {
    const pts = (value / 2).toFixed(1);
    const pct = (value / 5) * 100;
    const color = pct >= 75 ? 'var(--color-success)' : pct >= 50 ? 'var(--color-warning)' : 'var(--color-danger)';
    return (
      <div className="form-group">
        <label style={{ display: 'flex', justifyContent: 'space-between' }}>
          <span>{label}</span>
          <strong style={{ color }}>{value.toFixed(1)} / 5 &nbsp;·&nbsp; {pts} pts</strong>
        </label>
        <input
          type="range" min="0" max="5" step="0.5" value={value}
          onChange={e => setForm(f => ({ ...f, [name]: Number(e.target.value) }))}
          style={{ width: '100%', accentColor: 'var(--color-primary)' }}
        />
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '1.1rem', color: 'var(--text-secondary)' }}>
          <span>0</span><span>1.5</span><span>2.5</span><span>3.5</span><span>5</span>
        </div>
      </div>
    );
  };

  return (
    <ProtectedRoute tipo="professor">
      <Navbar />
      <style>{`
        .av-section-title {
          font-size: 1.5rem; font-weight: 700; color: var(--color-primary);
          margin: 1.6rem 0 1rem; padding-bottom: 0.5rem;
          border-bottom: 2px solid var(--border-light);
          display: flex; align-items: center; gap: 0.5rem;
        }
        .bim-section { margin-bottom: 1.4rem; }
        .bim-header {
          display: flex; align-items: center; justify-content: space-between;
          background: var(--bg-card-add); border-radius: 0.8rem;
          padding: 0.8rem 1.2rem; margin-bottom: 0.8rem;
        }
        .bim-header strong { font-size: 1.4rem; }
        .bim-media-badge {
          font-size: 1.3rem; font-weight: 700; color: var(--color-primary);
          background: var(--bg-card); border-radius: 0.6rem; padding: 0.3rem 0.8rem;
        }
        .prova-row {
          display: flex; align-items: center; gap: 0.8rem; margin-bottom: 0.6rem;
        }
        .prova-row label { font-size: 1.3rem; color: var(--text-secondary); min-width: 5.5rem; }
        .prova-row input { flex: 1; }
        .btn-remove-prova {
          background: none; border: none; cursor: pointer;
          color: var(--color-danger); font-size: 2rem; line-height: 1; padding: 0 0.2rem;
        }
        .btn-add-prova {
          background: none; border: 1px dashed var(--color-primary);
          color: var(--color-primary); border-radius: 0.6rem;
          padding: 0.4rem 1rem; font-size: 1.3rem; cursor: pointer;
          display: flex; align-items: center; gap: 0.4rem; margin-top: 0.2rem;
        }
        .btn-add-prova:hover { background: var(--bg-card-add); }
        .materia-required { color: var(--color-danger); font-size: 1.2rem; margin-top: 0.4rem; }
      `}</style>
      <main className="container fade-in">
        {alert && <Alert type={alert.type} message={alert.message} onClose={() => setAlert(null)} />}

        {data && (
          <>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
              <div>
                <h1>{data.turma.nome}</h1>
                <p>{data.turma.serie} · {data.turma.turno_display} · Sala {data.turma.sala}</p>
              </div>
              <Link href="/professor/turmas" className="btn btn-secondary">← Voltar</Link>
            </div>

            <div className="card mb-2">
              <form onSubmit={handleBusca} style={{ display: 'flex', gap: '1rem' }}>
                <div className="form-group" style={{ flex: 1, marginBottom: 0 }}>
                  <input type="text" placeholder="Buscar aluno pelo nome..." value={busca} onChange={e => setBusca(e.target.value)} />
                </div>
                <button type="submit" className="btn btn-primary">Buscar</button>
                {busca && (
                  <button type="button" className="btn btn-secondary" onClick={() => { setBusca(''); fetchData(''); }}>Limpar</button>
                )}
              </form>
            </div>
          </>
        )}

        {loading ? <Loading /> : data && (
          <>
            <span className="badge mb-1">{data.alunos.length} aluno(s)</span>

            {data.alunos.length === 0 ? (
              <div className="empty-state"><div className="empty-icon"><span className="material-icons-outlined" style={{ fontSize: '5rem' }}>search</span></div><h2>Nenhum aluno encontrado</h2></div>
            ) : (
              <div className="carometro-grid">
                {data.alunos.map(aluno => (
                  <div key={aluno.id} className="card" style={{ textAlign: 'center', borderLeft: aluno.papel ? `4px solid ${aluno.papel === 'lider' ? 'var(--color-primary)' : 'var(--color-secondary)'}` : undefined }}>
                    <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '1rem', position: 'relative' }}>
                      {aluno.foto_url ? (
                        <Image src={aluno.foto_url} alt={aluno.nome} width={100} height={100} className="perfil-foto" unoptimized />
                      ) : (
                        <div className="perfil-foto-placeholder">{aluno.nome.charAt(0).toUpperCase()}</div>
                      )}
                    </div>
                    {aluno.papel && (
                      <span className="badge mb-1" style={{ background: aluno.papel === 'lider' ? 'var(--color-primary)' : 'var(--color-secondary)', color: '#fff' }}>
                        <span className="material-icons-outlined" style={{ fontSize: '1.4rem', verticalAlign: 'middle', marginRight: '0.3rem' }}>{aluno.papel === 'lider' ? 'workspace_premium' : 'star'}</span>
                        {aluno.papel === 'lider' ? 'Líder' : 'Vice-Líder'}
                      </span>
                    )}
                    <h3>{aluno.nome}</h3>
                    {aluno.matricula && <p>Matrícula: {aluno.matricula}</p>}
                    <div style={{ margin: '1rem 0' }}>
                      <NotaBadge nota={aluno.media_geral} />
                      <p style={{ marginTop: '0.5rem' }}>{aluno.total_avaliacoes} avaliações</p>
                    </div>

                    <div style={{ display: 'flex', gap: '0.8rem', justifyContent: 'center', flexWrap: 'wrap' }}>
                      <button className="btn btn-primary" onClick={() => {
                        setAlunoAvaliando(aluno);
                        setForm(FORM_INIT);
                      }}>
                        <span className="material-icons-outlined">rate_review</span>
                        Avaliar
                      </button>
                      <Link href={`/professor/relatorio/${aluno.id}`} className="btn btn-secondary">
                        <span className="material-icons-outlined">bar_chart</span>
                        Relatório
                      </Link>
                    </div>

                    <div style={{ display: 'flex', gap: '0.6rem', justifyContent: 'center', flexWrap: 'wrap', marginTop: '0.8rem', borderTop: '1px solid var(--border-color)', paddingTop: '0.8rem' }}>
                      {aluno.papel ? (
                        <button
                          className="btn btn-secondary"
                          style={{ fontSize: '1.2rem' }}
                          disabled={perfilSubmitting === aluno.id}
                          onClick={() => handleRemoverPerfil(aluno)}
                        >
                          <span className="material-icons-outlined">person_remove</span>
                          Remover Cargo
                        </button>
                      ) : (
                        <>
                          <button
                            className="btn btn-secondary"
                            style={{ fontSize: '1.2rem' }}
                            disabled={perfilSubmitting === aluno.id}
                            onClick={() => handleAtribuirPerfil(aluno, 'lider')}
                          >
                            <span className="material-icons-outlined" style={{ fontSize: '1.4rem', verticalAlign: 'middle' }}>workspace_premium</span>
                            Líder
                          </button>
                          <button
                            className="btn btn-secondary"
                            style={{ fontSize: '1.2rem' }}
                            disabled={perfilSubmitting === aluno.id}
                            onClick={() => handleAtribuirPerfil(aluno, 'vice')}
                          >
                            <span className="material-icons-outlined" style={{ fontSize: '1.4rem', verticalAlign: 'middle' }}>star</span>
                            Vice
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </>
        )}

        {/* ── Modal Avaliação ── */}
        {alunoAvaliando && (
          <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999 }}>
            <div className="card" style={{ width: '90%', maxWidth: '600px', maxHeight: '94vh', overflowY: 'auto' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.6rem' }}>
                <h2>Avaliar: {alunoAvaliando.nome}</h2>
                <button onClick={() => setAlunoAvaliando(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '2.5rem' }}>&times;</button>
              </div>
              <form onSubmit={handleAvaliar}>

                {/* Comportamento */}
                <div className="av-section-title">
                  <span className="material-icons-outlined">psychology</span>
                  Comportamento
                </div>
                <RatingInput name="assiduidade" label="Assiduidade" value={form.assiduidade} />
                <RatingInput name="participacao" label="Participação" value={form.participacao} />
                <RatingInput name="responsabilidade" label="Responsabilidade" value={form.responsabilidade} />
                <RatingInput name="sociabilidade" label="Sociabilidade" value={form.sociabilidade} />

                {/* Observação */}
                <div className="av-section-title">
                  <span className="material-icons-outlined">comment</span>
                  Observação
                </div>
                <div className="form-group">
                  <textarea
                    rows={3}
                    placeholder="Observações opcionais sobre o aluno..."
                    value={form.observacao}
                    onChange={e => setForm(f => ({ ...f, observacao: e.target.value }))}
                    style={{ width: '100%', resize: 'vertical' }}
                  />
                </div>

                <button
                  type="submit"
                  className="btn btn-submit"
                  style={{ width: '100%', marginTop: '0.8rem' }}
                  disabled={submitting}
                >
                  {submitting ? 'Salvando...' : 'Salvar Avaliação'}
                </button>
              </form>
            </div>
          </div>
        )}

      </main>
      <footer style={{ textAlign: 'center', padding: '3rem 2rem', color: 'var(--text-secondary)', fontSize: '1.4rem' }}>
        <p>&copy; 2025 Sistema CARA - Gestão Escolar Inteligente</p>
      </footer>
    </ProtectedRoute>
  );
}
