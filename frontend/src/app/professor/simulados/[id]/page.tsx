'use client';

import { useEffect, useState, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { apiFetch } from '@/lib/api';
import Navbar from '@/components/Navbar';
import ProtectedRoute from '@/components/ProtectedRoute';
import Loading from '@/components/Loading';

interface Alternativa {
  id: number;
  texto: string;
  correta: boolean;
  ordem: number;
}

interface Questao {
  id: number;
  enunciado: string;
  materia: number | null;
  materia_nome: string;
  materia_sigla: string;
  dificuldade: string;
  dificuldade_display: string;
  tipo: string;
  tipo_display: string;
  resposta: string;
  exige_justificativa: boolean;
  alternativas: Alternativa[];
}

interface Simulado {
  id: number;
  titulo: string;
  turma_alvo: number;
  turma_nome: string;
  autor_nome: string;
  data_criacao: string;
  tempo_limite: number | null;
  area_conhecimento: string;
  total_questoes: number;
  questoes: Questao[];
}

interface Turma {
  id: number;
  nome: string;
}

interface PendenteResp {
  resposta_id: number;
  questao_enunciado: string;
  texto: string;
}

interface ResultadoAluno {
  aluno_id: number;
  nome: string;
  foto_url: string | null;
  status: 'nao_iniciado' | 'pendente_correcao' | 'corrigido';
  nota: number | null;
  resultado_id: number | null;
  pendentes: PendenteResp[];
}

const STATUS_INFO: Record<string, { label: string; color: string; icon: string }> = {
  nao_iniciado:      { label: 'Não iniciado',       color: '#94a3b8', icon: 'radio_button_unchecked' },
  pendente_correcao: { label: 'Pendente correção',  color: '#f39c12', icon: 'pending_actions' },
  corrigido:         { label: 'Corrigido',          color: '#27ae60', icon: 'check_circle' },
};

const DIF_COLOR: Record<string, string> = {
  facil: '#27ae60',
  medio: '#f39c12',
  dificil: '#e74c3c',
};

export default function DetalheSimuladoPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();

  const [simulado, setSimulado] = useState<Simulado | null>(null);
  const [turmas, setTurmas] = useState<Turma[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [toast, setToast] = useState<{ msg: string; ok: boolean } | null>(null);

  // edit state
  const [titulo, setTitulo] = useState('');
  const [turmaId, setTurmaId] = useState('');
  const [usarTempo, setUsarTempo] = useState(false);
  const [tempo, setTempo] = useState('');
  const [area, setArea] = useState('');
  const [expandedId, setExpandedId] = useState<number | null>(null);

  // andamento / resultados
  const [resultados, setResultados] = useState<ResultadoAluno[]>([]);
  const [expandedAluno, setExpandedAluno] = useState<number | null>(null);
  const [pontos, setPontos] = useState<Record<number, string>>({});
  const [corrigindo, setCorrigindo] = useState<number | null>(null);

  const carregarResultados = useCallback(() => {
    apiFetch<{ alunos: ResultadoAluno[] }>(`/professor/simulado/${id}/resultados/`)
      .then(d => setResultados(d.alunos))
      .catch(() => setResultados([]));
  }, [id]);

  useEffect(() => {
    const numId = Number(id);

    const fetchSimulado = apiFetch<Simulado>(`/professor/simulado/${id}/`)
      .catch(() =>
        apiFetch<Simulado[]>('/professor/simulados/').then(list => {
          const found = list.find(s => s.id === numId);
          if (!found) throw new Error('Simulado não encontrado na lista.');
          return found;
        })
      );

    const fetchTurmas = apiFetch<{ turmas: Turma[] }>('/professor/criar-simulado/data/')
      .then(d => d.turmas)
      .catch(() => [] as Turma[]);

    Promise.all([fetchSimulado, fetchTurmas])
      .then(([s, turmaList]) => {
        setSimulado(s);
        setTurmas(turmaList);
        setTitulo(s.titulo || '');
        setTurmaId(String(s.turma_alvo ?? ''));
        setUsarTempo(!!s.tempo_limite);
        setTempo(s.tempo_limite ? String(s.tempo_limite) : '');
        setArea(s.area_conhecimento || '');
      })
      .catch((err: unknown) => {
        const msg = err instanceof Error ? err.message : String(err);
        setError(`Erro ao carregar simulado: ${msg}`);
      })
      .finally(() => setLoading(false));

    carregarResultados();
  }, [id, carregarResultados]);

  async function handleCorrigir(resultadoId: number, pendentes: PendenteResp[]) {
    setCorrigindo(resultadoId);
    try {
      const pontosMap: Record<number, number> = {};
      for (const p of pendentes) {
        const v = pontos[p.resposta_id];
        if (v !== undefined && v !== '' && !isNaN(parseFloat(v))) {
          pontosMap[p.resposta_id] = parseFloat(v);
        }
      }
      await apiFetch(`/professor/resultado/${resultadoId}/corrigir/`, {
        method: 'POST',
        body: JSON.stringify({ pontos: pontosMap }),
      });
      showToast('Correção salva.');
      setExpandedAluno(null);
      setPontos({});
      carregarResultados();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Erro desconhecido';
      showToast(`Erro ao salvar correção: ${msg}`, false);
    } finally {
      setCorrigindo(null);
    }
  }

  function showToast(msg: string, ok = true) {
    setToast({ msg, ok });
    setTimeout(() => setToast(null), 3000);
  }

  async function handleSave() {
    setSaving(true);
    try {
      const updated = await apiFetch<Simulado>(`/professor/simulado/${id}/`, {
        method: 'PATCH',
        body: JSON.stringify({
          titulo,
          turma: turmaId || undefined,
          tempo_limite: usarTempo && tempo ? Number(tempo) : null,
          area_conhecimento: area,
        }),
      });
      setSimulado(updated);
      showToast('Simulado atualizado com sucesso!');
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Erro desconhecido';
      showToast(`Erro ao salvar: ${msg}`, false);
    } finally {
      setSaving(false);
    }
  }

  async function handleRemoverQuestao(questaoId: number) {
    setDeletingId(questaoId);
    try {
      const updated = await apiFetch<Simulado>(
        `/professor/simulado/${id}/questao/${questaoId}/`,
        { method: 'DELETE' }
      );
      setSimulado(updated);
      showToast('Questão removida do simulado.');
      carregarResultados();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Erro desconhecido';
      showToast(`Erro ao remover questão: ${msg}`, false);
    } finally {
      setDeletingId(null);
    }
  }

  async function handleExcluirSimulado() {
    try {
      await apiFetch(`/professor/simulado/${id}/`, { method: 'DELETE' });
      router.push('/professor/simulados');
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Erro desconhecido';
      showToast(`Erro ao excluir simulado: ${msg}`, false);
      setConfirmDelete(false);
    }
  }

  if (loading) return <ProtectedRoute tipo="professor"><Navbar /><Loading /></ProtectedRoute>;

  if (error || !simulado) return (
    <ProtectedRoute tipo="professor">
      <Navbar />
      <main className="container fade-in">
        <div className="card empty-state" style={{ marginTop: '4rem' }}>
          <div className="empty-icon"><span className="material-icons-outlined" style={{ fontSize: '5rem' }}>warning</span></div>
          <h2>Simulado não encontrado</h2>
          <p>{error || 'Este simulado não existe ou você não tem permissão para acessá-lo.'}</p>
          <button className="btn btn-secondary" onClick={() => router.push('/professor/simulados')} style={{ marginTop: '1.5rem' }}>
            Voltar para Meus Simulados
          </button>
        </div>
      </main>
    </ProtectedRoute>
  );

  const dirty =
    titulo !== (simulado.titulo || '') ||
    turmaId !== String(simulado.turma_alvo ?? '') ||
    (usarTempo ? Number(tempo) : null) !== simulado.tempo_limite ||
    area !== (simulado.area_conhecimento || '');

  return (
    <ProtectedRoute tipo="professor">
      <Navbar />
      <style>{`
        .det-header { display:flex; align-items:center; gap:1rem; margin-bottom:2.4rem; flex-wrap:wrap; }
        .det-back { background:none; border:none; cursor:pointer; display:flex; align-items:center; gap:0.4rem; color:var(--color-secondary); font-size:1.5rem; font-weight:600; padding:0.6rem 1rem; border-radius:0.8rem; transition:background 0.2s; }
        .det-back:hover { background:rgba(52,152,219,0.1); }
        .det-grid { display:grid; grid-template-columns:1fr 1.6fr; gap:2rem; align-items:start; }
        @media(max-width:860px){ .det-grid{ grid-template-columns:1fr; } }
        .det-card { background:white; border-radius:1.6rem; padding:2rem; box-shadow:0 0.2rem 1.2rem rgba(0,0,0,0.07); }
        .det-field { margin-bottom:1.6rem; }
        .det-field label { display:block; font-size:1.3rem; font-weight:600; color:var(--text-secondary); margin-bottom:0.5rem; }
        .det-field input, .det-field select { width:100%; padding:1rem 1.2rem; border:2px solid var(--border-light); border-radius:1rem; font-size:1.5rem; background:white; color:var(--text-primary); transition:border-color 0.2s; box-sizing:border-box; }
        .det-field input:focus, .det-field select:focus { outline:none; border-color:var(--color-secondary); }
        .tempo-row { display:flex; align-items:center; gap:1rem; }
        .toggle-btn { position:relative; width:4.4rem; height:2.4rem; flex-shrink:0; }
        .toggle-btn input { opacity:0; width:0; height:0; }
        .toggle-slider { position:absolute; inset:0; background:#ccc; border-radius:2.4rem; cursor:pointer; transition:0.3s; }
        .toggle-slider:before { content:''; position:absolute; width:1.8rem; height:1.8rem; left:0.3rem; bottom:0.3rem; background:white; border-radius:50%; transition:0.3s; }
        .toggle-btn input:checked + .toggle-slider { background:var(--color-secondary); }
        .toggle-btn input:checked + .toggle-slider:before { transform:translateX(2rem); }
        .save-btn { width:100%; padding:1.2rem; border:none; border-radius:1.2rem; font-size:1.5rem; font-weight:700; cursor:pointer; background:var(--color-secondary); color:white; transition:all 0.2s; }
        .save-btn:disabled { opacity:0.6; cursor:not-allowed; }
        .del-btn { width:100%; padding:1.2rem; border:2px solid #e74c3c; border-radius:1.2rem; font-size:1.5rem; font-weight:700; cursor:pointer; background:transparent; color:#e74c3c; margin-top:1rem; transition:all 0.2s; }
        .del-btn:hover { background:#e74c3c; color:white; }
        .q-list { display:flex; flex-direction:column; gap:1rem; }
        .q-item { background:white; border-radius:1.2rem; box-shadow:0 0.2rem 0.8rem rgba(0,0,0,0.05); overflow:hidden; min-width:0; }
        .q-row { display:flex; align-items:flex-start; gap:1rem; padding:1.4rem 1.6rem; cursor:pointer; min-width:0; }
        .q-row:hover { background:#f8f9fa; }
        .q-num { width:3rem; height:3rem; border-radius:50%; background:var(--color-secondary); color:white; display:flex; align-items:center; justify-content:center; font-weight:700; font-size:1.4rem; flex-shrink:0; margin-top:0.2rem; }
        .q-info { flex:1; min-width:0; overflow:hidden; }
        .q-enunciado { font-size: 1.45rem; font-weight: 600; white-space: normal; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; margin-bottom: 0.4rem; }
        .q-meta { display:flex; gap:0.6rem; flex-wrap:wrap; }
        .badge-sm { padding:0.3rem 0.8rem; border-radius:2rem; font-size:1.15rem; font-weight:600; color:white; white-space:nowrap; }
        .q-expand { padding:1.6rem; border-top:2px solid var(--border-light); background:#fafbfc; font-size:1.4rem; overflow:hidden; }
        .q-enunciado-full { font-size:1.45rem; font-weight:600; word-break:break-word; overflow-wrap:anywhere; margin-bottom:1.4rem; line-height:1.5; padding-bottom:1.2rem; border-bottom:1px solid var(--border-light); }
        .q-alt { padding:0.7rem 0.6rem; border-radius:0.8rem; display:flex; align-items:flex-start; gap:0.8rem; margin-bottom:0.3rem; }
        .q-alt.correta { background:rgba(39,174,96,0.08); }
        .q-alt-letter { width:2.6rem; height:2.6rem; border-radius:50%; border:2px solid #ccc; display:flex; align-items:center; justify-content:center; font-weight:700; font-size:1.3rem; flex-shrink:0; color:#888; }
        .q-alt.correta .q-alt-letter { border-color:#27ae60; background:#27ae60; color:white; }
        .q-alt-text { flex:1; min-width:0; word-break:break-word; overflow-wrap:anywhere; line-height:1.5; padding-top:0.3rem; }
        .gabarito-banner { display:flex; align-items:center; gap:0.8rem; background:rgba(39,174,96,0.1); border:1.5px solid #27ae60; border-radius:0.8rem; padding:0.8rem 1.2rem; margin-bottom:1.2rem; font-size:1.4rem; color:#1a7a47; font-weight:700; }
        .rm-btn { flex-shrink:0; background:none; border:2px solid #e74c3c; border-radius:0.8rem; color:#e74c3c; font-size:1.3rem; padding:0.5rem 1rem; cursor:pointer; transition:all 0.2s; display:flex; align-items:center; gap:0.3rem; }
        .rm-btn:hover { background:#e74c3c; color:white; }
        .rm-btn:disabled { opacity:0.4; cursor:not-allowed; }
        .toast { position:fixed; bottom:2.4rem; right:2.4rem; padding:1.2rem 2rem; border-radius:1.2rem; color:white; font-size:1.5rem; font-weight:600; z-index:1000; animation:fadeIn 0.3s; box-shadow:0 0.4rem 1.2rem rgba(0,0,0,0.18); }
        @keyframes fadeIn{ from{opacity:0;transform:translateY(1rem)} to{opacity:1;transform:none} }
        .modal-overlay { position:fixed; inset:0; background:rgba(0,0,0,0.5); display:flex; align-items:center; justify-content:center; z-index:200; }
        .modal-box { background:white; border-radius:1.6rem; padding:3rem; max-width:44rem; width:90%; text-align:center; }
        .modal-box h3 { font-size:2rem; margin-bottom:1rem; }
        .modal-box p { color:var(--text-secondary); margin-bottom:2rem; font-size:1.5rem; }
        .modal-actions { display:flex; gap:1rem; justify-content:center; }
      `}</style>

      <main className="container fade-in">
        <div className="det-header">
          <button className="det-back" onClick={() => router.push('/professor/simulados')}>
            <span className="material-icons-outlined" style={{ fontSize: '2rem' }}>arrow_back</span>
            Meus Simulados
          </button>
          <h1 style={{ flex: 1, margin: 0, fontSize: '2.2rem' }}>
            {simulado.titulo || `Simulado #${simulado.id}`}
          </h1>
        </div>

        <div className="det-grid">
          {/* Painel de configurações */}
          <div>
            <div className="det-card">
              <h2 style={{ marginBottom: '2rem', fontSize: '1.8rem', display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                <span className="material-icons-outlined">settings</span>
                Configurações
              </h2>

              <div className="det-field">
                <label>Título do Simulado</label>
                <input value={titulo} onChange={e => setTitulo(e.target.value)} placeholder="Ex: Simulado de Matemática" />
              </div>

              <div className="det-field">
                <label>Turma Alvo</label>
                <select value={turmaId} onChange={e => setTurmaId(e.target.value)}>
                  <option value="">Selecionar turma...</option>
                  {turmas.map(t => <option key={t.id} value={t.id}>{t.nome}</option>)}
                </select>
              </div>

              <div className="det-field">
                <label>Área de Conhecimento</label>
                <input value={area} onChange={e => setArea(e.target.value)} placeholder="Ex: Ciências da Natureza" />
              </div>

              <div className="det-field">
                <label>Tempo Limite</label>
                <div className="tempo-row">
                  <label className="toggle-btn">
                    <input type="checkbox" checked={usarTempo} onChange={e => setUsarTempo(e.target.checked)} />
                    <span className="toggle-slider" />
                  </label>
                  {usarTempo && (
                    <input
                      type="number"
                      min="1"
                      value={tempo}
                      onChange={e => setTempo(e.target.value)}
                      placeholder="Minutos"
                      style={{ flex: 1 }}
                    />
                  )}
                  {!usarTempo && <span style={{ color: 'var(--text-secondary)', fontSize: '1.4rem' }}>Sem limite de tempo</span>}
                </div>
              </div>

              <div style={{ marginTop: '2rem', borderTop: '2px solid var(--border-light)', paddingTop: '2rem' }}>
                <div style={{ fontSize: '1.3rem', color: 'var(--text-secondary)', marginBottom: '1.2rem' }}>
                  <span className="material-icons-outlined" style={{ fontSize: '1.5rem', verticalAlign: 'middle', marginRight: '0.4rem' }}>calendar_today</span>
                  Criado em {new Date(simulado.data_criacao).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                </div>
                <div style={{ fontSize: '1.3rem', color: 'var(--text-secondary)', marginBottom: '2rem' }}>
                  <span className="material-icons-outlined" style={{ fontSize: '1.5rem', verticalAlign: 'middle', marginRight: '0.4rem' }}>quiz</span>
                  {simulado.total_questoes} questão{simulado.total_questoes !== 1 ? 'ões' : ''}
                </div>
                <button className="save-btn" onClick={handleSave} disabled={saving || !dirty}>
                  {saving ? 'Salvando...' : dirty ? 'Salvar Alterações' : 'Sem alterações'}
                </button>
                <button className="del-btn" onClick={() => setConfirmDelete(true)}>
                  <span className="material-icons-outlined" style={{ verticalAlign: 'middle', marginRight: '0.4rem', fontSize: '1.7rem' }}>delete</span>
                  Excluir Simulado
                </button>
              </div>
            </div>
          </div>

          {/* Lista de questões */}
          <div className="det-card">
            <h2 style={{ marginBottom: '2rem', fontSize: '1.8rem', display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
              <span className="material-icons-outlined">list_alt</span>
              Questões ({simulado.questoes.length})
            </h2>

            {simulado.questoes.length === 0 ? (
              <div className="empty-state">
                <div className="empty-icon"><span className="material-icons-outlined" style={{ fontSize: '5rem' }}>edit_note</span></div>
                <p>Este simulado não tem questões.</p>
              </div>
            ) : (
              <div className="q-list">
                {simulado.questoes.map((q, idx) => (
                  <div key={q.id} className="q-item">
                    <div className="q-row" onClick={() => setExpandedId(expandedId === q.id ? null : q.id)}>
                      <div className="q-num">{idx + 1}</div>
                      <div className="q-info">
                        <div className="q-enunciado">{q.enunciado}</div>
                        <div className="q-meta">
                          {q.materia_nome && (
                            <span className="badge-sm" style={{ background: 'var(--color-secondary)' }}>{q.materia_sigla || q.materia_nome}</span>
                          )}
                          <span className="badge-sm" style={{ background: DIF_COLOR[q.dificuldade] ?? '#888' }}>{q.dificuldade_display}</span>
                          <span className="badge-sm" style={{ background: q.tipo === 'objetiva' ? '#8e44ad' : '#2980b9' }}>{q.tipo_display}</span>
                        </div>
                      </div>
                      <span className="material-icons-outlined" style={{ color: 'var(--text-secondary)', fontSize: '2rem', flexShrink: 0, transition: 'transform 0.2s', transform: expandedId === q.id ? 'rotate(180deg)' : 'none', marginTop: '0.2rem' }}>
                        expand_more
                      </span>
                      <button
                        className="rm-btn"
                        disabled={deletingId === q.id}
                        onClick={e => { e.stopPropagation(); handleRemoverQuestao(q.id); }}
                      >
                        <span className="material-icons-outlined" style={{ fontSize: '1.6rem' }}>remove_circle_outline</span>
                        {deletingId === q.id ? '...' : 'Remover'}
                      </button>
                    </div>

                    {expandedId === q.id && (
                      <div className="q-expand">
                        {/* Enunciado completo */}
                        <div className="q-enunciado-full">{q.enunciado}</div>

                        {q.tipo === 'discursiva' && (
                          <>
                            {q.resposta && (
                              <div style={{ marginBottom: '1rem' }}>
                                <strong style={{ display: 'block', marginBottom: '0.5rem', color: 'var(--text-secondary)', fontSize: '1.3rem' }}>RESPOSTA ESPERADA</strong>
                                <p style={{ margin: 0, wordBreak: 'break-word', overflowWrap: 'anywhere', lineHeight: 1.6 }}>{q.resposta}</p>
                              </div>
                            )}
                            {q.exige_justificativa && (
                              <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', background: '#fff3cd', padding: '0.4rem 0.8rem', borderRadius: '0.6rem', fontSize: '1.3rem', color: '#856404' }}>
                                <span className="material-icons-outlined" style={{ fontSize: '1.5rem' }}>info</span>
                                Exige justificativa
                              </div>
                            )}
                          </>
                        )}

                        {q.tipo === 'objetiva' && (() => {
                          const gabIdx = q.alternativas.findIndex(a => a.correta);
                          const gabLetra = gabIdx >= 0 ? String.fromCharCode(65 + gabIdx) : null;
                          return (
                            <>
                              {gabLetra && (
                                <div className="gabarito-banner">
                                  <span className="material-icons-outlined" style={{ fontSize: '2rem' }}>check_circle</span>
                                  Gabarito: alternativa <strong style={{ fontSize: '1.6rem', marginLeft: '0.2rem' }}>{gabLetra}</strong>
                                </div>
                              )}
                              {q.alternativas.length > 0 && (
                                <div>
                                  <strong style={{ display: 'block', marginBottom: '0.8rem', color: 'var(--text-secondary)', fontSize: '1.3rem' }}>ALTERNATIVAS</strong>
                                  {q.alternativas.map((alt, i) => (
                                    <div key={alt.id} className={`q-alt${alt.correta ? ' correta' : ''}`}>
                                      <div className="q-alt-letter">{String.fromCharCode(65 + i)}</div>
                                      <div className="q-alt-text" style={{ color: alt.correta ? '#1a7a47' : 'inherit', fontWeight: alt.correta ? 700 : 400 }}>
                                        {alt.texto}
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              )}
                              {q.alternativas.length === 0 && (
                                <p style={{ color: 'var(--text-secondary)', fontStyle: 'italic' }}>Nenhuma alternativa cadastrada.</p>
                              )}
                            </>
                          );
                        })()}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Andamento e Notas */}
        <div className="det-card" style={{ marginTop: '2rem' }}>
          <h2 style={{ marginBottom: '2rem', fontSize: '1.8rem', display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
            <span className="material-icons-outlined">groups</span>
            Andamento e Notas
          </h2>

          {resultados.length === 0 ? (
            <p style={{ color: 'var(--text-secondary)', fontSize: '1.4rem' }}>
              Nenhum aluno na turma-alvo (ou turma não definida).
            </p>
          ) : (
            <div className="q-list">
              {resultados.map(a => {
                const info = STATUS_INFO[a.status];
                const aberto = expandedAluno === a.aluno_id;
                const temPendencia = a.status === 'pendente_correcao' && a.pendentes.length > 0;
                return (
                  <div key={a.aluno_id} className="q-item">
                    <div
                      className="q-row"
                      style={{ cursor: temPendencia ? 'pointer' : 'default' }}
                      onClick={() => temPendencia && setExpandedAluno(aberto ? null : a.aluno_id)}
                    >
                      <div className="q-info">
                        <div className="q-enunciado" style={{ whiteSpace: 'normal' }}>{a.nome}</div>
                        <div className="q-meta" style={{ alignItems: 'center' }}>
                          <span className="badge-sm" style={{ background: info.color, display: 'inline-flex', alignItems: 'center', gap: '0.3rem' }}>
                            <span className="material-icons-outlined" style={{ fontSize: '1.4rem' }}>{info.icon}</span>
                            {info.label}
                          </span>
                          {a.nota != null && (
                            <span style={{ fontSize: '1.4rem', fontWeight: 700, color: 'var(--color-primary)' }}>
                              Nota: {a.nota.toFixed(2)}
                            </span>
                          )}
                          {temPendencia && (
                            <span style={{ fontSize: '1.25rem', color: 'var(--text-secondary)' }}>
                              {a.pendentes.length} discursiva(s) a corrigir
                            </span>
                          )}
                        </div>
                      </div>
                      {temPendencia && (
                        <span className="material-icons-outlined" style={{ color: 'var(--text-secondary)', fontSize: '2rem', flexShrink: 0, transform: aberto ? 'rotate(180deg)' : 'none' }}>
                          expand_more
                        </span>
                      )}
                    </div>

                    {aberto && temPendencia && a.resultado_id != null && (
                      <div className="q-expand">
                        {a.pendentes.map(p => (
                          <div key={p.resposta_id} style={{ marginBottom: '1.4rem' }}>
                            <div style={{ fontWeight: 600, marginBottom: '0.4rem' }}>{p.questao_enunciado}</div>
                            <div style={{ background: '#fff', border: '1px solid var(--border-light)', borderRadius: '0.8rem', padding: '0.8rem 1rem', marginBottom: '0.6rem', fontSize: '1.35rem', whiteSpace: 'pre-wrap' }}>
                              {p.texto || <em style={{ color: 'var(--text-secondary)' }}>Sem resposta.</em>}
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                              <label style={{ fontSize: '1.3rem', color: 'var(--text-secondary)' }}>Pontos:</label>
                              <input
                                type="number" min={0} step={0.5}
                                value={pontos[p.resposta_id] ?? ''}
                                onChange={e => setPontos(prev => ({ ...prev, [p.resposta_id]: e.target.value }))}
                                style={{ width: '8rem', padding: '0.5rem 0.7rem', border: '2px solid var(--border-light)', borderRadius: '0.8rem', fontSize: '1.4rem' }}
                              />
                              <span style={{ fontSize: '1.25rem', color: 'var(--text-secondary)' }}>(valor da questão no simulado)</span>
                            </div>
                          </div>
                        ))}
                        <button
                          className="save-btn"
                          style={{ marginTop: '0.4rem' }}
                          disabled={corrigindo === a.resultado_id}
                          onClick={() => handleCorrigir(a.resultado_id!, a.pendentes)}
                        >
                          {corrigindo === a.resultado_id ? 'Salvando...' : 'Salvar correção'}
                        </button>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </main>

      {toast && (
        <div className="toast" style={{ background: toast.ok ? '#27ae60' : '#e74c3c' }}>
          {toast.msg}
        </div>
      )}

      {confirmDelete && (
        <div className="modal-overlay" onClick={() => setConfirmDelete(false)}>
          <div className="modal-box" onClick={e => e.stopPropagation()}>
            <span className="material-icons-outlined" style={{ fontSize: '4rem', color: '#e74c3c' }}>warning</span>
            <h3>Excluir Simulado?</h3>
            <p>Esta ação é irreversível. O simulado e todos os seus dados serão removidos permanentemente.</p>
            <div className="modal-actions">
              <button className="btn" onClick={() => setConfirmDelete(false)} style={{ background: 'var(--border-light)', color: 'var(--text-primary)' }}>
                Cancelar
              </button>
              <button className="btn" onClick={handleExcluirSimulado} style={{ background: '#e74c3c', color: 'white' }}>
                Sim, excluir
              </button>
            </div>
          </div>
        </div>
      )}

      <footer style={{ textAlign: 'center', padding: '3rem 2rem', color: 'var(--text-secondary)', fontSize: '1.4rem' }}>
        <p>&copy; 2025 Sistema CARA - Gestão Escolar Inteligente</p>
      </footer>
    </ProtectedRoute>
  );
}
