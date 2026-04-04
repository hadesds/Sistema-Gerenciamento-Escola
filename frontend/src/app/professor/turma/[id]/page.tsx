'use client';

import { useEffect, useState } from 'react';
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
}

export default function CarometroPage() {
  const params = useParams();
  const turmaId = params.id as string;

  const [data, setData] = useState<CarometroData | null>(null);
  const [loading, setLoading] = useState(true);
  const [busca, setBusca] = useState('');
  const [alunoAvaliando, setAlunoAvaliando] = useState<AlunoInfo | null>(null);
  const [form, setForm] = useState<AvaliacaoForm>({ assiduidade: 3, participacao: 3, responsabilidade: 3, sociabilidade: 3 });
  const [alert, setAlert] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [submitting, setSubmitting] = useState(false);

  function fetchData(query = '') {
    setLoading(true);
    apiFetch<CarometroData>(`/professor/turma/${turmaId}/?busca=${encodeURIComponent(query)}`)
      .then(setData)
      .finally(() => setLoading(false));
  }

  useEffect(() => {
    fetchData();
  }, [turmaId]);

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
        body: JSON.stringify(form),
      });
      setAlert({ type: 'success', message: `Avaliação de ${alunoAvaliando.nome} registrada com sucesso!` });
      setAlunoAvaliando(null);
      fetchData(busca);
    } catch {
      setAlert({ type: 'error', message: 'Erro ao registrar avaliação.' });
    } finally {
      setSubmitting(false);
    }
  }

  const RatingInput = ({ name, label, value }: { name: keyof AvaliacaoForm; label: string; value: number }) => (
    <div className="form-group">
      <label>{label}: <strong>{value}/5</strong></label>
      <input
        type="range"
        min="1"
        max="5"
        value={value}
        onChange={e => setForm(f => ({ ...f, [name]: Number(e.target.value) }))}
        style={{ width: '100%', accentColor: 'var(--color-primary)' }}
      />
      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '1.2rem', color: 'var(--text-secondary)' }}>
        <span>1 - Ruim</span><span>3 - Médio</span><span>5 - Excelente</span>
      </div>
    </div>
  );

  return (
    <ProtectedRoute tipo="professor">
      <Navbar />
      <main className="container fade-in">
        {alert && <Alert type={alert.type} message={alert.message} onClose={() => setAlert(null)} />}

        {data && (
          <>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
              <div>
                <h1>{data.turma.nome}</h1>
                <p>{data.turma.serie} · {data.turma.turno_display} · Sala {data.turma.sala}</p>
              </div>
              <Link href="/professor/turmas" className="btn btn-secondary">
                ← Voltar
              </Link>
            </div>

            <div className="card mb-2">
              <form onSubmit={handleBusca} style={{ display: 'flex', gap: '1rem' }}>
                <div className="form-group" style={{ flex: 1, marginBottom: 0 }}>
                  <input
                    type="text"
                    placeholder="Buscar aluno pelo nome..."
                    value={busca}
                    onChange={e => setBusca(e.target.value)}
                  />
                </div>
                <button type="submit" className="btn btn-primary">Buscar</button>
                {busca && (
                  <button type="button" className="btn btn-secondary" onClick={() => { setBusca(''); fetchData(''); }}>
                    Limpar
                  </button>
                )}
              </form>
            </div>
          </>
        )}

        {loading ? <Loading /> : data && (
          <>
            <div style={{ marginBottom: '1rem' }}>
              <span className="badge">{data.alunos.length} aluno(s)</span>
            </div>

            {data.alunos.length === 0 ? (
              <div className="empty-state">
                <div className="empty-icon">🔍</div>
                <h2>Nenhum aluno encontrado</h2>
              </div>
            ) : (
              <div className="carometro-grid">
                {data.alunos.map(aluno => (
                  <div key={aluno.id} className="card" style={{ textAlign: 'center' }}>
                    <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '1.5rem' }}>
                      {aluno.foto_url ? (
                        <Image src={aluno.foto_url} alt={aluno.nome} width={100} height={100} className="perfil-foto" unoptimized />
                      ) : (
                        <div className="perfil-foto-placeholder">
                          {aluno.nome.charAt(0).toUpperCase()}
                        </div>
                      )}
                    </div>
                    <h3>{aluno.nome}</h3>
                    {aluno.matricula && <p>Matrícula: {aluno.matricula}</p>}
                    <div style={{ margin: '1rem 0' }}>
                      <NotaBadge nota={aluno.media_geral} />
                      <p style={{ marginTop: '0.5rem' }}>{aluno.total_avaliacoes} avaliações</p>
                    </div>

                    <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center' }}>
                      <button
                        className="btn btn-primary"
                        onClick={() => { setAlunoAvaliando(aluno); setForm({ assiduidade: 3, participacao: 3, responsabilidade: 3, sociabilidade: 3 }); }}
                      >
                        <span className="material-icons-outlined">rate_review</span>
                        Avaliar
                      </button>
                      <Link href={`/professor/relatorio/${aluno.id}`} className="btn btn-secondary">
                        <span className="material-icons-outlined">bar_chart</span>
                        Relatório
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </>
        )}

        {/* Modal de Avaliação */}
        {alunoAvaliando && (
          <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999 }}>
            <div className="card" style={{ width: '90%', maxWidth: '500px', maxHeight: '90vh', overflowY: 'auto' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
                <h2>Avaliar: {alunoAvaliando.nome}</h2>
                <button onClick={() => setAlunoAvaliando(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '2.5rem' }}>&times;</button>
              </div>
              <form onSubmit={handleAvaliar}>
                <RatingInput name="assiduidade" label="Assiduidade" value={form.assiduidade} />
                <RatingInput name="participacao" label="Participação" value={form.participacao} />
                <RatingInput name="responsabilidade" label="Responsabilidade" value={form.responsabilidade} />
                <RatingInput name="sociabilidade" label="Sociabilidade" value={form.sociabilidade} />
                <button type="submit" className="btn btn-submit" style={{ width: '100%' }} disabled={submitting}>
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
