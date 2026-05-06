'use client';

import { useEffect, useState } from 'react';
import { apiFetch } from '@/lib/api';
import Navbar from '@/components/Navbar';
import ProtectedRoute from '@/components/ProtectedRoute';
import Loading from '@/components/Loading';
import Alert from '@/components/Alert';

const ALPHA = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H'];

interface Alternativa {
  id?: number;
  texto: string;
  correta: boolean;
  ordem: number;
}

interface Materia {
  id: number;
  nome: string;
  sigla: string;
}

interface Questao {
  id: number;
  enunciado: string;
  resposta: string;
  materia: number | null;
  materia_nome: string;
  materia_sigla: string;
  dificuldade: 'facil' | 'medio' | 'dificil';
  dificuldade_display: string;
  tipo: 'discursiva' | 'objetiva';
  tipo_display: string;
  exige_justificativa: boolean;
  alternativas: Alternativa[];
  data_criacao: string;
}

interface BancoData {
  questoes: Questao[];
  materias: Materia[];
  materia_filtro: string;
}

interface FormState {
  enunciado: string;
  resposta: string;
  materia: string;
  dificuldade: string;
  tipo: 'discursiva' | 'objetiva';
  exige_justificativa: boolean;
  alternativas: { texto: string; correta: boolean }[];
}

const FORM_INIT: FormState = {
  enunciado: '',
  resposta: '',
  materia: '',
  dificuldade: 'medio',
  tipo: 'discursiva',
  exige_justificativa: false,
  alternativas: [
    { texto: '', correta: false },
    { texto: '', correta: false },
    { texto: '', correta: false },
    { texto: '', correta: false },
  ],
};

function difColor(d: string) {
  if (d === 'facil')   return 'var(--color-success)';
  if (d === 'dificil') return 'var(--color-danger)';
  return 'var(--color-warning)';
}

export default function BancoQuestoesPage() {
  const [data, setData]               = useState<BancoData | null>(null);
  const [loading, setLoading]         = useState(true);
  const [materiaFiltro, setMateriaFiltro] = useState('');
  const [showForm, setShowForm]       = useState(false);
  const [form, setForm]               = useState<FormState>(FORM_INIT);
  const [alert, setAlert]             = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [submitting, setSubmitting]   = useState(false);

  function fetchData(materia = '') {
    setLoading(true);
    apiFetch<BancoData>(`/professor/banco-questoes/?materia=${encodeURIComponent(materia)}`)
      .then(setData)
      .finally(() => setLoading(false));
  }

  useEffect(() => { fetchData(); }, []);

  function setAltTexto(idx: number, texto: string) {
    setForm(f => ({
      ...f,
      alternativas: f.alternativas.map((a, i) => i === idx ? { ...a, texto } : a),
    }));
  }

  function setAltCorreta(idx: number) {
    setForm(f => ({
      ...f,
      alternativas: f.alternativas.map((a, i) => ({ ...a, correta: i === idx })),
    }));
  }

  function addAlt() {
    if (form.alternativas.length >= 8) return;
    setForm(f => ({ ...f, alternativas: [...f.alternativas, { texto: '', correta: false }] }));
  }

  function removeAlt(idx: number) {
    if (form.alternativas.length <= 2) return;
    setForm(f => {
      const alts = f.alternativas.filter((_, i) => i !== idx);
      const hasCorrect = alts.some(a => a.correta);
      return { ...f, alternativas: hasCorrect ? alts : alts.map((a, i) => ({ ...a, correta: i === 0 })) };
    });
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    if (form.tipo === 'objetiva') {
      const filled = form.alternativas.filter(a => a.texto.trim());
      if (filled.length < 2) {
        setAlert({ type: 'error', message: 'Adicione ao menos 2 alternativas com texto.' });
        return;
      }
      if (!filled.some(a => a.correta)) {
        setAlert({ type: 'error', message: 'Marque qual alternativa é a correta.' });
        return;
      }
    }

    setSubmitting(true);
    try {
      const payload = {
        enunciado: form.enunciado,
        resposta: form.resposta,
        materia: form.materia ? Number(form.materia) : null,
        dificuldade: form.dificuldade,
        tipo: form.tipo,
        exige_justificativa: form.exige_justificativa,
        alternativas: form.tipo === 'objetiva'
          ? form.alternativas.filter(a => a.texto.trim())
          : [],
      };
      await apiFetch('/professor/banco-questoes/', { method: 'POST', body: JSON.stringify(payload) });
      setAlert({ type: 'success', message: 'Questão cadastrada com sucesso!' });
      setForm(FORM_INIT);
      setShowForm(false);
      fetchData(materiaFiltro);
    } catch {
      setAlert({ type: 'error', message: 'Erro ao cadastrar questão. Verifique os campos e tente novamente.' });
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <ProtectedRoute tipo="professor">
      <Navbar />
      <main className="container fade-in">
        <style>{`
          /* ── Seletor de tipo ── */
          .tipo-selector {
            display: flex;
            gap: 1rem;
            margin-bottom: 0.4rem;
          }
          .tipo-btn {
            flex: 1;
            padding: 1.2rem;
            border: 2px solid #d0daea;
            border-radius: 1.2rem;
            background: #fff;
            cursor: pointer;
            font-size: 1.5rem;
            font-family: 'Poppins', sans-serif;
            font-weight: 600;
            color: #4a6080;
            display: flex;
            align-items: center;
            justify-content: center;
            gap: 0.8rem;
            transition: all 0.2s;
          }
          .tipo-btn.active {
            border-color: #1a73c7;
            background: #e8f0fc;
            color: #0d2d6b;
          }
          .tipo-btn .material-icons-outlined { font-size: 2.2rem; }

          /* ── Alternativas ── */
          .alt-list { display: flex; flex-direction: column; gap: 1rem; }
          .alt-row {
            display: flex;
            align-items: center;
            gap: 1rem;
          }
          .alt-letra {
            width: 3.2rem;
            height: 3.2rem;
            border-radius: 50%;
            background: #e8f0fc;
            color: #0d2d6b;
            font-weight: 700;
            font-size: 1.4rem;
            display: flex;
            align-items: center;
            justify-content: center;
            flex-shrink: 0;
          }
          .alt-letra.correta {
            background: linear-gradient(135deg, #27ae60, #229954);
            color: #fff;
          }
          /* Isola o input de alternativa do .form-group input do globals.css */
          .alt-input {
            flex: 1 !important;
            width: auto !important;
            min-width: 0 !important;
            padding: 1rem 1.4rem !important;
            border: 2px solid #d0daea !important;
            border-radius: 1rem !important;
            font-size: 1.4rem !important;
            font-family: 'Poppins', sans-serif !important;
            outline: none !important;
            background: #fff !important;
            transition: border-color 0.2s !important;
            box-shadow: none !important;
          }
          .alt-input:focus { border-color: #1a73c7 !important; }
          .alt-radio {
            width: 2rem;
            height: 2rem;
            cursor: pointer;
            flex-shrink: 0;
            accent-color: #27ae60;
          }
          .alt-remove {
            background: none;
            border: none;
            cursor: pointer;
            color: #e74c3c;
            display: flex;
            align-items: center;
            padding: 0;
            flex-shrink: 0;
            opacity: 0.7;
            transition: opacity 0.2s;
          }
          .alt-remove:hover { opacity: 1; }
          .alt-remove .material-icons-outlined { font-size: 2rem; }
          .alt-remove:disabled { opacity: 0.25; cursor: default; }

          .alt-add-btn {
            display: flex;
            align-items: center;
            gap: 0.6rem;
            background: none;
            border: 2px dashed #d0daea;
            border-radius: 1rem;
            padding: 1rem 1.6rem;
            cursor: pointer;
            color: #1a73c7;
            font-size: 1.4rem;
            font-weight: 600;
            font-family: 'Poppins', sans-serif;
            width: 100%;
            transition: all 0.2s;
          }
          .alt-add-btn:hover { border-color: #1a73c7; background: #f0f7ff; }
          .alt-add-btn:disabled { opacity: 0.4; cursor: default; }

          /* ── Checkbox justificativa ── */
          .check-row {
            display: flex;
            align-items: center;
            gap: 1rem;
            padding: 1.2rem 1.4rem;
            border: 2px solid #d0daea;
            border-radius: 1.2rem;
            cursor: pointer;
            transition: border-color 0.2s, background 0.2s;
            user-select: none;
          }
          .check-row:hover { border-color: #1a73c7; background: #f0f7ff; }
          .check-row.checked { border-color: #1a73c7; background: #e8f0fc; }
          .check-box {
            width: 2.2rem; height: 2.2rem;
            border: 2px solid #94a3b8;
            border-radius: 0.5rem;
            display: flex; align-items: center; justify-content: center;
            flex-shrink: 0;
            transition: all 0.2s;
          }
          .check-row.checked .check-box {
            background: #1a73c7; border-color: #1a73c7;
          }
          .check-box .material-icons-outlined { font-size: 1.6rem; color: #fff; }

          /* ── Card de questão ── */
          .questao-card-alts { display: flex; flex-direction: column; gap: 0.6rem; margin-top: 1rem; }
          .questao-alt-item {
            display: flex;
            align-items: flex-start;
            gap: 0.8rem;
            padding: 0.8rem 1.2rem;
            border-radius: 0.8rem;
            background: #f8fafc;
            font-size: 1.4rem;
          }
          .questao-alt-item.correta {
            background: #edfaf4;
            border: 1px solid #27ae60;
          }
          .questao-alt-badge {
            width: 2.4rem;
            height: 2.4rem;
            border-radius: 50%;
            background: #e2e8f0;
            color: #475569;
            font-weight: 700;
            font-size: 1.2rem;
            display: flex; align-items: center; justify-content: center;
            flex-shrink: 0;
          }
          .questao-alt-item.correta .questao-alt-badge {
            background: #27ae60; color: #fff;
          }

          /* Responsive page header */
          .banco-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            flex-wrap: wrap;
            gap: 1.2rem;
            margin-bottom: 2rem;
          }
          .banco-header h1 { margin: 0; }

          /* Filtros responsivos */
          .filtro-btns {
            display: flex;
            gap: 0.8rem;
            flex-wrap: wrap;
            align-items: center;
          }

          @media (max-width: 480px) {
            .tipo-btn { font-size: 1.35rem; padding: 1rem; }
            .alt-row  { gap: 0.6rem; }
          }
        `}</style>

        {alert && <Alert type={alert.type} message={alert.message} onClose={() => setAlert(null)} />}

        <div className="banco-header">
          <h1>Banco de Questões</h1>
          <button className="btn btn-primary" onClick={() => { setShowForm(!showForm); setForm(FORM_INIT); }}>
            <span className="material-icons-outlined">{showForm ? 'close' : 'add'}</span>
            {showForm ? 'Cancelar' : 'Nova Questão'}
          </button>
        </div>

        {/* ── Formulário ── */}
        {showForm && (
          <div className="card mb-2">
            <h2 style={{ marginBottom: '2rem' }}>Nova Questão</h2>
            <form onSubmit={handleSubmit}>

              {/* Tipo */}
              <div className="form-group">
                <label>Tipo de Questão</label>
                <div className="tipo-selector">
                  <button
                    type="button"
                    className={`tipo-btn${form.tipo === 'discursiva' ? ' active' : ''}`}
                    onClick={() => setForm(f => ({ ...f, tipo: 'discursiva' }))}
                  >
                    <span className="material-icons-outlined">edit_note</span>
                    Discursiva
                  </button>
                  <button
                    type="button"
                    className={`tipo-btn${form.tipo === 'objetiva' ? ' active' : ''}`}
                    onClick={() => setForm(f => ({ ...f, tipo: 'objetiva' }))}
                  >
                    <span className="material-icons-outlined">format_list_bulleted</span>
                    Objetiva
                  </button>
                </div>
              </div>

              {/* Matéria + Dificuldade */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.6rem' }}>
                <div className="form-group" style={{ margin: 0 }}>
                  <label>Matéria</label>
                  <select
                    value={form.materia}
                    onChange={e => setForm(f => ({ ...f, materia: e.target.value }))}
                    required
                  >
                    <option value="">Selecione uma matéria…</option>
                    {data?.materias.map(m => (
                      <option key={m.id} value={m.id}>{m.nome}</option>
                    ))}
                  </select>
                </div>
                <div className="form-group" style={{ margin: 0 }}>
                  <label>Dificuldade</label>
                  <select value={form.dificuldade} onChange={e => setForm(f => ({ ...f, dificuldade: e.target.value }))}>
                    <option value="facil">Fácil</option>
                    <option value="medio">Médio</option>
                    <option value="dificil">Difícil</option>
                  </select>
                </div>
              </div>

              {/* Enunciado */}
              <div className="form-group">
                <label>Enunciado</label>
                <textarea
                  value={form.enunciado}
                  onChange={e => setForm(f => ({ ...f, enunciado: e.target.value }))}
                  placeholder="Digite o enunciado da questão…"
                  rows={4}
                  required
                />
              </div>

              {/* ── OBJETIVA: alternativas ── */}
              {form.tipo === 'objetiva' && (
                <div style={{ marginBottom: '2rem' }}>
                  <label style={{ display: 'block', marginBottom: '1rem', fontWeight: 600, fontSize: '1.5rem', color: 'var(--text-primary)' }}>
                    Alternativas &nbsp;
                    <span style={{ fontSize: '1.3rem', color: 'var(--text-secondary)', fontWeight: 400 }}>
                      — selecione o botão circular para marcar a correta
                    </span>
                  </label>
                  <div className="alt-list">
                    {form.alternativas.map((alt, i) => (
                      <div key={i} className="alt-row">
                        <div className={`alt-letra${alt.correta ? ' correta' : ''}`}>{ALPHA[i]}</div>
                        <input
                          className="alt-input"
                          type="text"
                          placeholder={`Alternativa ${ALPHA[i]}…`}
                          value={alt.texto}
                          onChange={e => setAltTexto(i, e.target.value)}
                        />
                        <input
                          type="radio"
                          className="alt-radio"
                          name="correta"
                          title="Marcar como correta"
                          checked={alt.correta}
                          onChange={() => setAltCorreta(i)}
                        />
                        <button
                          type="button"
                          className="alt-remove"
                          onClick={() => removeAlt(i)}
                          disabled={form.alternativas.length <= 2}
                          title="Remover alternativa"
                        >
                          <span className="material-icons-outlined">delete_outline</span>
                        </button>
                      </div>
                    ))}
                  </div>
                  <button
                    type="button"
                    className="alt-add-btn"
                    style={{ marginTop: '1rem' }}
                    onClick={addAlt}
                    disabled={form.alternativas.length >= 8}
                  >
                    <span className="material-icons-outlined">add_circle_outline</span>
                    Adicionar alternativa {form.alternativas.length < 8 ? `(${form.alternativas.length}/8)` : '(máx. 8)'}
                  </button>
                </div>
              )}

              {/* ── DISCURSIVA: campo resposta ── */}
              {form.tipo === 'discursiva' && (
                <div className="form-group">
                  <label>Resposta esperada</label>
                  <textarea
                    value={form.resposta}
                    onChange={e => setForm(f => ({ ...f, resposta: e.target.value }))}
                    placeholder="Descreva a resposta esperada para correção…"
                    rows={4}
                  />
                </div>
              )}

              {/* Exige justificativa */}
              <div className="form-group">
                <label>Justificativa</label>
                <div
                  className={`check-row${form.exige_justificativa ? ' checked' : ''}`}
                  onClick={() => setForm(f => ({ ...f, exige_justificativa: !f.exige_justificativa }))}
                >
                  <div className="check-box">
                    {form.exige_justificativa && <span className="material-icons-outlined">check</span>}
                  </div>
                  <div>
                    <strong style={{ fontSize: '1.45rem' }}>Exigir justificativa do aluno</strong>
                    <p style={{ margin: 0, fontSize: '1.3rem', color: 'var(--text-secondary)' }}>
                      O aluno deverá escrever um texto justificando sua resposta.
                    </p>
                  </div>
                </div>
              </div>

              <button type="submit" className="btn btn-submit" disabled={submitting}>
                <span className="material-icons-outlined">save</span>
                {submitting ? 'Salvando…' : 'Salvar Questão'}
              </button>
            </form>
          </div>
        )}

        {/* ── Filtros ── */}
        <div className="card mb-2">
          <div className="filtro-btns">
            <strong style={{ fontSize: '1.45rem', flexShrink: 0 }}>
              <span className="material-icons-outlined" style={{ verticalAlign: 'middle', marginRight: '0.4rem' }}>filter_list</span>
              Matéria:
            </strong>
            <button
              className={`btn ${materiaFiltro === '' ? 'btn-primary' : 'btn-secondary'}`}
              onClick={() => { setMateriaFiltro(''); fetchData(''); }}
            >
              Todas
            </button>
            {data?.materias.map(m => (
              <button
                key={m.id}
                className={`btn ${materiaFiltro === m.sigla ? 'btn-primary' : 'btn-secondary'}`}
                onClick={() => { setMateriaFiltro(m.sigla); fetchData(m.sigla); }}
              >
                {m.nome}
              </button>
            ))}
          </div>
        </div>

        {/* ── Lista de questões ── */}
        {loading ? <Loading /> : !data || data.questoes.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">📚</div>
            <h2>Nenhuma questão encontrada</h2>
            <p>Adicione questões ao seu banco para criar simulados.</p>
          </div>
        ) : (
          <>
            <span className="badge mb-1">{data.questoes.length} questão(ões)</span>
            {data.questoes.map((q, idx) => (
              <div key={q.id} className="card" style={{ borderLeft: `4px solid ${difColor(q.dificuldade)}` }}>

                {/* Cabeçalho do card */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.2rem', flexWrap: 'wrap', gap: '0.6rem' }}>
                  <div style={{ display: 'flex', gap: '0.6rem', flexWrap: 'wrap', alignItems: 'center' }}>
                    <span className="badge">{q.materia_nome}</span>
                    <span className="badge" style={{ background: difColor(q.dificuldade), color: '#fff' }}>
                      {q.dificuldade_display}
                    </span>
                    <span className="badge" style={{ background: q.tipo === 'objetiva' ? '#1a73c7' : '#7c3aed', color: '#fff' }}>
                      <span className="material-icons-outlined" style={{ fontSize: '1.4rem', verticalAlign: 'middle', marginRight: '0.3rem' }}>
                        {q.tipo === 'objetiva' ? 'format_list_bulleted' : 'edit_note'}
                      </span>
                      {q.tipo_display}
                    </span>
                    {q.exige_justificativa && (
                      <span className="badge" style={{ background: '#f39c12', color: '#fff' }}>
                        <span className="material-icons-outlined" style={{ fontSize: '1.4rem', verticalAlign: 'middle', marginRight: '0.3rem' }}>rate_review</span>
                        Justificativa
                      </span>
                    )}
                  </div>
                  <span style={{ fontSize: '1.3rem', color: 'var(--text-secondary)', flexShrink: 0 }}>
                    #{idx + 1} · {new Date(q.data_criacao).toLocaleDateString('pt-BR')}
                  </span>
                </div>

                {/* Enunciado */}
                <p style={{ fontSize: '1.5rem', fontWeight: 500, color: 'var(--text-primary)', whiteSpace: 'pre-wrap', marginBottom: '1rem' }}>
                  {q.enunciado}
                </p>

                {/* Alternativas (objetiva) */}
                {q.tipo === 'objetiva' && q.alternativas.length > 0 && (
                  <div className="questao-card-alts">
                    {q.alternativas.map((alt, i) => (
                      <div key={alt.id ?? i} className={`questao-alt-item${alt.correta ? ' correta' : ''}`}>
                        <div className="questao-alt-badge">{ALPHA[i]}</div>
                        <span style={{ flex: 1 }}>{alt.texto}</span>
                        {alt.correta && (
                          <span className="material-icons-outlined" style={{ color: '#27ae60', fontSize: '1.8rem', flexShrink: 0 }}>
                            check_circle
                          </span>
                        )}
                      </div>
                    ))}
                  </div>
                )}

                {/* Resposta (discursiva) */}
                {q.tipo === 'discursiva' && q.resposta && (
                  <details style={{ marginTop: '0.8rem' }}>
                    <summary style={{ cursor: 'pointer', fontWeight: 600, fontSize: '1.45rem', color: 'var(--color-add-button)' }}>
                      Ver resposta esperada
                    </summary>
                    <p style={{ marginTop: '1rem', padding: '1rem 1.4rem', background: 'var(--bg-card-add)', borderRadius: '1rem', whiteSpace: 'pre-wrap' }}>
                      {q.resposta}
                    </p>
                  </details>
                )}
              </div>
            ))}
          </>
        )}
      </main>
      <footer style={{ textAlign: 'center', padding: '3rem 2rem', color: 'var(--text-secondary)', fontSize: '1.4rem' }}>
        <p>&copy; 2025 Sistema CARA - Gestão Escolar Inteligente</p>
      </footer>
    </ProtectedRoute>
  );
}
