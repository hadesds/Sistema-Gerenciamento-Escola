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

interface Materia { id: number; nome: string; sigla: string; }

// provas_bimestrais: list of grade strings per epoch
interface AvaliacaoForm {
  materia_id: string;
  provas_bimestrais: Record<string, string[]>;
  assiduidade: number;
  participacao: number;
  responsabilidade: number;
  sociabilidade: number;
  observacao: string;
}

const EPOCAS = [
  { key: '1B', label: '1° Bimestre' },
  { key: '2B', label: '2° Bimestre' },
  { key: '3B', label: '3° Bimestre' },
  { key: '4B', label: '4° Bimestre' },
];

const EMPTY_PROVAS = { '1B': [], '2B': [], '3B': [], '4B': [] } as Record<string, string[]>;

const FORM_INIT: AvaliacaoForm = {
  materia_id: '',
  provas_bimestrais: { '1B': [], '2B': [], '3B': [], '4B': [] },
  assiduidade: 3.0, participacao: 3.0, responsabilidade: 3.0, sociabilidade: 3.0,
  observacao: '',
};

const MATERIAS_NOTAS = [
  { key: 'portugues',       label: 'Português' },
  { key: 'matematica',      label: 'Matemática' },
  { key: 'ciencias',        label: 'Ciências' },
  { key: 'religiao',        label: 'Religião' },
  { key: 'geografia',       label: 'Geografia' },
  { key: 'historia',        label: 'História' },
  { key: 'artes',           label: 'Artes' },
  { key: 'ingles',          label: 'Inglês' },
  { key: 'educacao_fisica', label: 'Educação Física' },
  { key: 'filosofia',       label: 'Filosofia' },
];

type NotasForm = Record<string, string>;

function calcMedia(provas: string[]): string {
  const validas = provas.map(p => parseFloat(p)).filter(n => !isNaN(n) && n >= 0 && n <= 10);
  if (!validas.length) return '—';
  return (validas.reduce((a, b) => a + b, 0) / validas.length).toFixed(2);
}

export default function CarometroPage() {
  const params = useParams();
  const turmaId = params.id as string;

  const [data, setData] = useState<CarometroData | null>(null);
  const [loading, setLoading] = useState(true);
  const [busca, setBusca] = useState('');
  const [materias, setMaterias] = useState<Materia[]>([]);

  // Modal avaliação
  const [alunoAvaliando, setAlunoAvaliando] = useState<AlunoInfo | null>(null);
  const [form, setForm] = useState<AvaliacaoForm>(FORM_INIT);
  const [materiaError, setMateriaError] = useState('');
  const [loadingProvas, setLoadingProvas] = useState(false);

  // Modal notas
  const [alunoNotas, setAlunoNotas] = useState<AlunoInfo | null>(null);
  const [epocaSelecionada, setEpocaSelecionada] = useState('1B');
  const [notasForm, setNotasForm] = useState<NotasForm>({});
  const [notasExistentes, setNotasExistentes] = useState<Record<string, Record<string, number>>>({});

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
    apiFetch<Materia[]>('/professor/materias/').then(setMaterias).catch(() => {});
  }, [fetchData]);

  function handleBusca(e: React.FormEvent) {
    e.preventDefault();
    fetchData(busca);
  }

  // When matéria changes, load existing provas for that student+materia
  async function handleMateriaChange(e: React.ChangeEvent<HTMLSelectElement>) {
    const materiaId = e.target.value;
    setMateriaError('');
    setForm(f => ({ ...f, materia_id: materiaId, provas_bimestrais: { ...EMPTY_PROVAS } }));
    if (!materiaId || !alunoAvaliando) return;

    setLoadingProvas(true);
    try {
      const provas = await apiFetch<Record<string, number[]>>(
        `/professor/provas/${alunoAvaliando.id}/?materia_id=${materiaId}`
      );
      const converted: Record<string, string[]> = { '1B': [], '2B': [], '3B': [], '4B': [] };
      for (const ep of ['1B', '2B', '3B', '4B']) {
        converted[ep] = (provas[ep] || []).map(String);
      }
      setForm(f => ({ ...f, materia_id: materiaId, provas_bimestrais: converted }));
    } catch {
      // no existing provas, keep empty
    } finally {
      setLoadingProvas(false);
    }
  }

  function addProva(ep: string) {
    setForm(f => ({
      ...f,
      provas_bimestrais: {
        ...f.provas_bimestrais,
        [ep]: [...f.provas_bimestrais[ep], ''],
      },
    }));
  }

  function removeProva(ep: string, idx: number) {
    setForm(f => ({
      ...f,
      provas_bimestrais: {
        ...f.provas_bimestrais,
        [ep]: f.provas_bimestrais[ep].filter((_, i) => i !== idx),
      },
    }));
  }

  function setProvaNota(ep: string, idx: number, val: string) {
    setForm(f => {
      const list = [...f.provas_bimestrais[ep]];
      list[idx] = val;
      return { ...f, provas_bimestrais: { ...f.provas_bimestrais, [ep]: list } };
    });
  }

  async function handleAvaliar(e: React.FormEvent) {
    e.preventDefault();
    if (!alunoAvaliando) return;
    if (!form.materia_id) {
      setMateriaError('Selecione uma matéria para continuar.');
      return;
    }
    setSubmitting(true);
    try {
      const provas: Record<string, number[]> = {};
      for (const [ep, lista] of Object.entries(form.provas_bimestrais)) {
        const validas = lista.map(g => parseFloat(g)).filter(n => !isNaN(n) && n >= 0 && n <= 10);
        if (validas.length) provas[ep] = validas;
      }
      await apiFetch(`/professor/avaliar/${alunoAvaliando.id}/`, {
        method: 'POST',
        body: JSON.stringify({
          materia_id: Number(form.materia_id),
          provas_bimestrais: provas,
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

  async function abrirNotas(aluno: AlunoInfo) {
    setAlunoNotas(aluno);
    setEpocaSelecionada('1B');
    try {
      const notas = await apiFetch<Array<{ materia: string; nota: number; epoca: string }>>(
        `/professor/notas/${aluno.id}/`
      );
      const por_epoca: Record<string, Record<string, number>> = {};
      notas.forEach(n => {
        por_epoca[n.epoca] = por_epoca[n.epoca] || {};
        por_epoca[n.epoca][n.materia] = n.nota;
      });
      setNotasExistentes(por_epoca);
      const init: NotasForm = {};
      MATERIAS_NOTAS.forEach(m => {
        init[m.key] = String(por_epoca['1B']?.[m.key] ?? '');
      });
      setNotasForm(init);
    } catch {
      setNotasExistentes({});
      setNotasForm({});
    }
  }

  function trocarEpoca(epoca: string) {
    setEpocaSelecionada(epoca);
    const init: NotasForm = {};
    MATERIAS_NOTAS.forEach(m => {
      init[m.key] = String(notasExistentes[epoca]?.[m.key] ?? '');
    });
    setNotasForm(init);
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

  async function handleSalvarNotas(e: React.FormEvent) {
    e.preventDefault();
    if (!alunoNotas) return;
    setSubmitting(true);
    try {
      const notas: Record<string, number> = {};
      MATERIAS_NOTAS.forEach(m => {
        const v = parseFloat(notasForm[m.key]);
        if (!isNaN(v)) notas[m.key] = v;
      });
      await apiFetch(`/professor/notas/${alunoNotas.id}/`, {
        method: 'POST',
        body: JSON.stringify({ epoca: epocaSelecionada, notas }),
      });
      setAlert({ type: 'success', message: `Notas de ${alunoNotas.nome} salvas!` });
      setNotasExistentes(prev => ({ ...prev, [epocaSelecionada]: notas }));
      setAlunoNotas(null);
    } catch {
      setAlert({ type: 'error', message: 'Erro ao salvar notas.' });
    } finally {
      setSubmitting(false);
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
                        setMateriaError('');
                      }}>
                        <span className="material-icons-outlined">rate_review</span>
                        Avaliar
                      </button>
                      <button className="btn btn-secondary" onClick={() => abrirNotas(aluno)}>
                        <span className="material-icons-outlined">edit_note</span>
                        Notas
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

                {/* Matéria – obrigatória */}
                <div className="av-section-title">
                  <span className="material-icons-outlined">menu_book</span>
                  Matéria <span style={{ color: 'var(--color-danger)', marginLeft: '0.2rem' }}>*</span>
                </div>
                <div className="form-group">
                  <select
                    value={form.materia_id}
                    onChange={handleMateriaChange}
                    style={{ borderColor: materiaError ? 'var(--color-danger)' : undefined }}
                  >
                    <option value="">— Selecione a matéria —</option>
                    {materias.map(m => (
                      <option key={m.id} value={m.id}>{m.nome}</option>
                    ))}
                  </select>
                  {materiaError && <p className="materia-required">{materiaError}</p>}
                </div>

                {/* Provas por Bimestre */}
                <div className="av-section-title">
                  <span className="material-icons-outlined">grade</span>
                  Provas por Bimestre
                  {loadingProvas && <span style={{ fontSize: '1.2rem', color: 'var(--text-secondary)', marginLeft: '0.5rem' }}>carregando...</span>}
                </div>
                <p style={{ fontSize: '1.3rem', color: 'var(--text-secondary)', marginBottom: '1.2rem' }}>
                  Adicione as notas de cada prova realizada. A média do bimestre é calculada automaticamente.
                </p>

                {EPOCAS.map(ep => {
                  const provas = form.provas_bimestrais[ep.key];
                  const media = calcMedia(provas);
                  return (
                    <div className="bim-section" key={ep.key}>
                      <div className="bim-header">
                        <strong>{ep.label}</strong>
                        <span className="bim-media-badge">
                          Média: {media}
                        </span>
                      </div>
                      {provas.map((nota, idx) => (
                        <div className="prova-row" key={idx}>
                          <label>Prova {idx + 1}</label>
                          <input
                            type="number"
                            min="0"
                            max="10"
                            step="0.1"
                            placeholder="0 – 10"
                            value={nota}
                            onChange={e => setProvaNota(ep.key, idx, e.target.value)}
                          />
                          <button
                            type="button"
                            className="btn-remove-prova"
                            onClick={() => removeProva(ep.key, idx)}
                            title="Remover prova"
                          >
                            &times;
                          </button>
                        </div>
                      ))}
                      <button type="button" className="btn-add-prova" onClick={() => addProva(ep.key)}>
                        <span className="material-icons-outlined" style={{ fontSize: '1.6rem' }}>add</span>
                        Adicionar Prova
                      </button>
                    </div>
                  );
                })}

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

        {/* ── Modal Notas por Matéria ── */}
        {alunoNotas && (
          <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999 }}>
            <div className="card" style={{ width: '95%', maxWidth: '600px', maxHeight: '92vh', overflowY: 'auto' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                <h2>Notas: {alunoNotas.nome}</h2>
                <button onClick={() => setAlunoNotas(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '2.5rem' }}>&times;</button>
              </div>

              <div style={{ display: 'flex', gap: '0.8rem', marginBottom: '2rem', flexWrap: 'wrap' }}>
                {EPOCAS.map(ep => (
                  <button
                    key={ep.key}
                    type="button"
                    className={`btn ${epocaSelecionada === ep.key ? 'btn-primary' : 'btn-secondary'}`}
                    onClick={() => trocarEpoca(ep.key)}
                  >
                    {ep.label}
                  </button>
                ))}
              </div>

              <form onSubmit={handleSalvarNotas}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.2rem' }}>
                  {MATERIAS_NOTAS.map(m => (
                    <div className="form-group" key={m.key} style={{ marginBottom: 0 }}>
                      <label>{m.label}</label>
                      <input
                        type="number"
                        min="0"
                        max="10"
                        step="0.1"
                        placeholder="0 – 10"
                        value={notasForm[m.key] ?? ''}
                        onChange={e => setNotasForm(f => ({ ...f, [m.key]: e.target.value }))}
                      />
                    </div>
                  ))}
                </div>

                <button type="submit" className="btn btn-submit" style={{ width: '100%', marginTop: '2rem' }} disabled={submitting}>
                  {submitting ? 'Salvando...' : `Salvar notas do ${EPOCAS.find(e => e.key === epocaSelecionada)?.label}`}
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
