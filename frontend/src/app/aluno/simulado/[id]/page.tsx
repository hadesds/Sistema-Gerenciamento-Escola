'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { apiFetch } from '@/lib/api';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import Navbar from '@/components/Navbar';
import ProtectedRoute from '@/components/ProtectedRoute';
import Loading from '@/components/Loading';

// ─── Types ───────────────────────────────────────────────────────────────────

interface Alternativa { id: number; texto: string; correta: boolean; ordem: number; imagem_url: string | null; }

interface QuestaoSimulado {
  id: number;
  enunciado: string;
  tipo: string;
  tipo_display: string;
  resposta: string;
  materia_nome: string;
  materia_sigla: string;
  dificuldade_display: string;
  exige_justificativa: boolean;
  alternativas: Alternativa[];
  imagem_url: string | null;
}

interface SimuladoDetalhe {
  id: number;
  titulo: string;
  turma_nome: string;
  autor_nome: string;
  total_questoes: number;
  data_criacao: string;
  tempo_limite: number | null; // minutes
  area_conhecimento: string;
  questoes: QuestaoSimulado[];
}

type Fase = 'loading' | 'info' | 'confirmar' | 'prova' | 'resultado' | 'cancelado';
type Respostas = Record<number, string>; // questao.id → alt.id (string) or text

// ─── Helpers ─────────────────────────────────────────────────────────────────

function fmt(sec: number): string {
  const m = Math.floor(Math.max(0, sec) / 60);
  const s = Math.max(0, sec) % 60;
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

// ─────────────────────────────────────────────────────────────────────────────

export default function VisualizarSimuladoPage() {
  const params = useParams();
  const simuladoId = params.id as string;

  const [simulado, setSimulado] = useState<SimuladoDetalhe | null>(null);
  const [fase, setFase] = useState<Fase>('loading');
  const [questaoIdx, setQuestaoIdx] = useState(0);
  const [respostas, setRespostas] = useState<Respostas>({});
  const [enviando, setEnviando] = useState(false);
  const [resultadoApi, setResultadoApi] = useState<{ nota: number | null; status: string } | null>(null);
  const enviadoRef = useRef(false);

  // Exam timer
  const [tempoRestante, setTempoRestante] = useState<number | null>(null);
  const endTimeRef = useRef<number | null>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Away / grace-period
  const [saindoAlerta, setSaindoAlerta] = useState(false);
  const [graceRestante, setGraceRestante] = useState(0);
  const awayStartRef = useRef<number | null>(null);
  const graceTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // ── Load ───────────────────────────────────────────────────────────────────
  useEffect(() => {
    apiFetch<SimuladoDetalhe>(`/aluno/simulado/${simuladoId}/`)
      .then(data => { setSimulado(data); setFase('info'); })
      .catch(() => setFase('cancelado'));
  }, [simuladoId]);

  // ── Start exam ─────────────────────────────────────────────────────────────
  const iniciarProva = useCallback(() => {
    if (!simulado) return;
    setQuestaoIdx(0);
    setRespostas({});
    setSaindoAlerta(false);
    if (simulado.tempo_limite) {
      const end = Date.now() + simulado.tempo_limite * 60 * 1000;
      endTimeRef.current = end;
      setTempoRestante(simulado.tempo_limite * 60);
    } else {
      endTimeRef.current = null;
      setTempoRestante(null);
    }
    setFase('prova');
  }, [simulado]);

  // ── Exam countdown ─────────────────────────────────────────────────────────
  useEffect(() => {
    if (fase !== 'prova' || !endTimeRef.current) return;
    if (timerRef.current) clearInterval(timerRef.current);
    timerRef.current = setInterval(() => {
      const rem = Math.max(0, Math.floor((endTimeRef.current! - Date.now()) / 1000));
      setTempoRestante(rem);
      if (rem === 0) {
        clearInterval(timerRef.current!);
        finalizarRef.current();
      }
    }, 500);
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [fase]);

  // ── Visibility / beforeunload ──────────────────────────────────────────────
  useEffect(() => {
    if (fase !== 'prova') return;

    const GRACE_MS = 3 * 60 * 1000;

    const onVisibility = () => {
      if (document.visibilityState === 'hidden') {
        awayStartRef.current = Date.now();
      } else if (awayStartRef.current !== null) {
        const away = Date.now() - awayStartRef.current;
        awayStartRef.current = null;
        if (away >= GRACE_MS) {
          // Exceeded grace → cancel
          if (timerRef.current) clearInterval(timerRef.current);
          setFase('cancelado');
        } else {
          // Within grace → show warning modal with remaining tolerance
          const remaining = Math.floor((GRACE_MS - away) / 1000);
          setGraceRestante(remaining);
          setSaindoAlerta(true);
        }
      }
    };

    const onBeforeUnload = (e: BeforeUnloadEvent) => {
      e.preventDefault();
      // Modern browsers show a generic prompt; the returnValue text may not display.
      e.returnValue = 'Sua prova está em andamento! Se sair, ela poderá ser cancelada.';
    };

    document.addEventListener('visibilitychange', onVisibility);
    window.addEventListener('beforeunload', onBeforeUnload);
    return () => {
      document.removeEventListener('visibilitychange', onVisibility);
      window.removeEventListener('beforeunload', onBeforeUnload);
    };
  }, [fase]);

  // ── Grace countdown (displayed in modal) ───────────────────────────────────
  useEffect(() => {
    if (!saindoAlerta) {
      if (graceTimerRef.current) clearInterval(graceTimerRef.current);
      return;
    }
    if (graceTimerRef.current) clearInterval(graceTimerRef.current);
    graceTimerRef.current = setInterval(() => {
      setGraceRestante(prev => {
        if (prev <= 1) { clearInterval(graceTimerRef.current!); return 0; }
        return prev - 1;
      });
    }, 1000);
    return () => { if (graceTimerRef.current) clearInterval(graceTimerRef.current); };
  }, [saindoAlerta]);

  // ── Score ──────────────────────────────────────────────────────────────────
  function calcScore() {
    if (!simulado) return { acertos: 0, respondidas: 0, total: 0 };
    let acertos = 0, respondidas = 0;
    for (const q of simulado.questoes) {
      const resp = respostas[q.id];
      if (!resp?.trim()) continue;
      respondidas++;
      if (q.tipo === 'objetiva') {
        const alt = q.alternativas.find(a => a.id === Number(resp));
        if (alt?.correta) acertos++;
      }
    }
    return { acertos, respondidas, total: simulado.total_questoes };
  }

  // ── Finalizar e enviar respostas ao backend ─────────────────────────────────
  const finalizarProva = useCallback(async () => {
    if (enviadoRef.current || !simulado) { setFase('resultado'); return; }
    enviadoRef.current = true;
    setEnviando(true);
    const payload = {
      respostas: simulado.questoes.map(qq => {
        const r = respostas[qq.id];
        if (qq.tipo === 'objetiva') {
          return { questao: qq.id, alternativa: r ? Number(r) : null, texto: '' };
        }
        return { questao: qq.id, alternativa: null, texto: r ?? '' };
      }),
    };
    try {
      const res = await apiFetch<{ nota: number | null; status: string }>(
        `/aluno/simulado/${simuladoId}/enviar/`,
        { method: 'POST', body: JSON.stringify(payload) },
      );
      setResultadoApi(res);
    } catch {
      // mesmo em erro (ex.: já enviado), mostra a revisão local
      setResultadoApi(null);
    } finally {
      setEnviando(false);
      setFase('resultado');
    }
  }, [simulado, respostas, simuladoId]);

  // mantém a referência mais recente para uso dentro do timer (evita closure obsoleta)
  const finalizarRef = useRef(finalizarProva);
  finalizarRef.current = finalizarProva;

  // ──────────────────────────────────────────────────────────────────────────
  // Render phases
  // ──────────────────────────────────────────────────────────────────────────

  if (fase === 'loading') return <ProtectedRoute tipo="aluno"><Navbar /><Loading /></ProtectedRoute>;

  // ─── CANCELADO ─────────────────────────────────────────────────────────────
  if (fase === 'cancelado') return (
    <ProtectedRoute tipo="aluno">
      <Navbar />
      <main className="container fade-in" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '72vh' }}>
        <div style={{ maxWidth: '50rem', textAlign: 'center' }}>
          <span className="material-icons-outlined" style={{ fontSize: '6rem', color: 'var(--color-secondary)', marginBottom: '1.5rem', display: 'block' }}>timer</span>
          <h2 style={{ fontSize: '2.8rem', color: 'var(--color-danger)', marginBottom: '1rem' }}>Prova Cancelada</h2>
          <p style={{ fontSize: '1.6rem', color: 'var(--text-secondary)', lineHeight: 1.7, marginBottom: '3rem' }}>
            Você ficou fora da prova por mais de 3 minutos.<br />
            A prova foi encerrada automaticamente.
          </p>
          <Link href="/aluno/meus-simulados" className="btn btn-primary" style={{ fontSize: '1.5rem', padding: '1.2rem 3rem' }}>
            Voltar aos Simulados
          </Link>
        </div>
      </main>
    </ProtectedRoute>
  );

  if (!simulado) return (
    <ProtectedRoute tipo="aluno">
      <Navbar />
      <main className="container fade-in">
        <div className="empty-state card"><h2>Simulado não encontrado.</h2></div>
      </main>
    </ProtectedRoute>
  );

  // ─── INFO ──────────────────────────────────────────────────────────────────
  if (fase === 'info') return (
    <ProtectedRoute tipo="aluno">
      <Navbar />
      <main className="container fade-in">
        <style>{`
          .sim-hero { background: linear-gradient(135deg, var(--color-primary) 0%, #1a6bb5 60%, #27ae60 100%); border-radius: 2rem; padding: 3.5rem; margin-bottom: 2.4rem; color: white; }
          .sim-pill { padding: 0.7rem 1.4rem; background: rgba(255,255,255,0.18); backdrop-filter: blur(4px); border-radius: 10rem; font-size: 1.35rem; display: inline-flex; align-items: center; gap: 0.5rem; font-weight: 600; }
          .sim-stat-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(20rem,1fr)); gap: 1.4rem; margin-bottom: 2.4rem; }
          .sim-stat { background: white; border-radius: 1.6rem; padding: 1.8rem 2rem; box-shadow: 0 0.2rem 1rem rgba(0,0,0,0.07); display: flex; align-items: center; gap: 1.4rem; }
          .sim-stat-icon { width: 4.8rem; height: 4.8rem; border-radius: 1.2rem; display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
          .sim-stat-lbl { font-size: 1.2rem; color: var(--text-secondary); }
          .sim-stat-val { font-size: 2rem; font-weight: 800; }
          .sim-alert { background: #fff8e1; border: 1.5px solid #f9a825; border-radius: 1.4rem; padding: 1.8rem 2.2rem; margin-bottom: 2.4rem; }
          .sim-alert h3 { font-size: 1.55rem; color: #e65100; margin-bottom: 0.8rem; display: flex; align-items: center; gap: 0.5rem; }
          .sim-alert li { list-style: none; font-size: 1.4rem; color: #5d4037; margin-bottom: 0.6rem; line-height: 1.5; display: flex; align-items: flex-start; gap: 0.7rem; }
        `}</style>

        <div className="sim-hero">
          <p style={{ color: 'rgba(255,255,255,0.75)', fontSize: '1.3rem', marginBottom: '0.5rem' }}>Simulado</p>
          <h1 style={{ color: 'white', fontSize: '2.6rem', marginBottom: '0.6rem' }}>
            {simulado.titulo || `Simulado — ${simulado.turma_nome}`}
          </h1>
          <p style={{ color: 'rgba(255,255,255,0.85)', fontSize: '1.4rem', marginBottom: '2rem' }}>
            Prof. {simulado.autor_nome} · {simulado.turma_nome}
          </p>
          <div style={{ display: 'flex', gap: '0.8rem', flexWrap: 'wrap' }}>
            <span className="sim-pill"><span className="material-icons-outlined" style={{ fontSize: '1.6rem', verticalAlign: 'middle' }}>quiz</span> {simulado.total_questoes} questões</span>
            <span className="sim-pill"><span className="material-icons-outlined" style={{ fontSize: '1.6rem', verticalAlign: 'middle' }}>timer</span> {simulado.tempo_limite ? `${simulado.tempo_limite} min` : 'Sem limite'}</span>
            {simulado.area_conhecimento && <span className="sim-pill"><span className="material-icons-outlined" style={{ fontSize: '1.6rem', verticalAlign: 'middle' }}>menu_book</span> {simulado.area_conhecimento}</span>}
            <span className="sim-pill"><span className="material-icons-outlined" style={{ fontSize: '1.6rem', verticalAlign: 'middle' }}>calendar_today</span> {new Date(simulado.data_criacao).toLocaleDateString('pt-BR')}</span>
          </div>
        </div>

        <div className="sim-stat-grid">
          <div className="sim-stat">
            <div className="sim-stat-icon" style={{ background: 'linear-gradient(135deg,#0d2d6b,#1a4fa0)' }}>
              <span className="material-icons-outlined" style={{ color: 'white', fontSize: '2.2rem' }}>quiz</span>
            </div>
            <div>
              <div className="sim-stat-lbl">Questões</div>
              <div className="sim-stat-val">{simulado.total_questoes}</div>
            </div>
          </div>
          <div className="sim-stat">
            <div className="sim-stat-icon" style={{ background: 'linear-gradient(135deg,#e67e22,#d35400)' }}>
              <span className="material-icons-outlined" style={{ color: 'white', fontSize: '2.2rem' }}>timer</span>
            </div>
            <div>
              <div className="sim-stat-lbl">Tempo Limite</div>
              <div className="sim-stat-val">{simulado.tempo_limite ? `${simulado.tempo_limite} min` : '—'}</div>
            </div>
          </div>
          <div className="sim-stat">
            <div className="sim-stat-icon" style={{ background: 'linear-gradient(135deg,#27ae60,#1e8449)' }}>
              <span className="material-icons-outlined" style={{ color: 'white', fontSize: '2.2rem' }}>school</span>
            </div>
            <div>
              <div className="sim-stat-lbl">Área</div>
              <div className="sim-stat-val" style={{ fontSize: '1.5rem' }}>{simulado.area_conhecimento || 'Geral'}</div>
            </div>
          </div>
          <div className="sim-stat">
            <div className="sim-stat-icon" style={{ background: 'linear-gradient(135deg,#8e44ad,#6c3483)' }}>
              <span className="material-icons-outlined" style={{ color: 'white', fontSize: '2.2rem' }}>person</span>
            </div>
            <div>
              <div className="sim-stat-lbl">Professor</div>
              <div className="sim-stat-val" style={{ fontSize: '1.5rem' }}>{simulado.autor_nome}</div>
            </div>
          </div>
        </div>

        <div className="sim-alert">
          <h3>
            <span className="material-icons-outlined" style={{ fontSize: '1.8rem' }}>warning_amber</span>
            Leia antes de começar
          </h3>
          <ul style={{ margin: 0, padding: 0 }}>
            <li><span className="material-icons-outlined" style={{ fontSize: '1.8rem' }}>block</span><span>Não feche, minimize ou mude de aba durante a prova.</span></li>
            <li><span className="material-icons-outlined" style={{ fontSize: '1.8rem' }}>hourglass_empty</span><span>Se sair da prova, você terá <strong>3 minutos</strong> para retornar — caso contrário, a prova será cancelada automaticamente.</span></li>
            {simulado.tempo_limite && <li><span className="material-icons-outlined" style={{ fontSize: '1.8rem' }}>timer</span><span>O cronômetro de <strong>{simulado.tempo_limite} minutos</strong> começa ao confirmar o início.</span></li>}
            <li><span className="material-icons-outlined" style={{ fontSize: '1.8rem' }}>check_circle</span><span>Você pode navegar entre as questões livremente antes de finalizar.</span></li>
          </ul>
        </div>

        {simulado.questoes.length === 0 ? (
          <div className="card" style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-secondary)' }}>
            <p>Este simulado ainda não possui questões.</p>
            <Link href="/aluno/meus-simulados" className="btn btn-secondary" style={{ marginTop: '1.5rem', display: 'inline-flex' }}>← Voltar</Link>
          </div>
        ) : (
          <div style={{ display: 'flex', gap: '1.2rem', justifyContent: 'flex-end' }}>
            <Link href="/aluno/meus-simulados" className="btn btn-secondary" style={{ fontSize: '1.5rem' }}>Voltar</Link>
            <button className="btn btn-primary" style={{ fontSize: '1.5rem', padding: '1.2rem 2.8rem' }} onClick={() => setFase('confirmar')}>
              <span className="material-icons-outlined">play_arrow</span>
              Iniciar Simulado
            </button>
          </div>
        )}
      </main>
      <footer style={{ textAlign: 'center', padding: '3rem 2rem', color: 'var(--text-secondary)', fontSize: '1.4rem' }}>
        <p>&copy; 2025 Sistema CARA - Gestão Escolar Inteligente</p>
      </footer>
    </ProtectedRoute>
  );

  // ─── CONFIRMAR ─────────────────────────────────────────────────────────────
  if (fase === 'confirmar') return (
    <ProtectedRoute tipo="aluno">
      <Navbar />
      <main className="container fade-in" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '72vh' }}>
        <div style={{ maxWidth: '52rem', width: '100%', textAlign: 'center' }}>
          <span className="material-icons-outlined" style={{ fontSize: '6rem', color: 'var(--color-primary)', marginBottom: '1.2rem', display: 'block' }}>sports_score</span>
          <h2 style={{ fontSize: '2.8rem', marginBottom: '0.8rem' }}>Tudo pronto?</h2>
          <p style={{ fontSize: '1.6rem', color: 'var(--text-secondary)', lineHeight: 1.6, marginBottom: '2rem' }}>
            Você está prestes a iniciar <strong>{simulado.titulo || `Simulado — ${simulado.turma_nome}`}</strong>
            {simulado.tempo_limite
              ? <> com <strong>{simulado.tempo_limite} minutos</strong> de tempo limite.</>
              : <> sem limite de tempo.</>
            }
          </p>

          {/* Resumo */}
          <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center', marginBottom: '2rem', flexWrap: 'wrap' }}>
            <div style={{ background: '#e8f4fd', borderRadius: '1rem', padding: '1rem 1.8rem', fontSize: '1.5rem', fontWeight: 700, color: '#1a4fa0', display: 'inline-flex', alignItems: 'center', gap: '0.5rem' }}>
              <span className="material-icons-outlined" style={{ fontSize: '1.6rem', verticalAlign: 'middle' }}>quiz</span> {simulado.total_questoes} questões
            </div>
            <div style={{ background: '#fef3e2', borderRadius: '1rem', padding: '1rem 1.8rem', fontSize: '1.5rem', fontWeight: 700, color: '#e67e22', display: 'inline-flex', alignItems: 'center', gap: '0.5rem' }}>
              <span className="material-icons-outlined" style={{ fontSize: '1.6rem', verticalAlign: 'middle' }}>timer</span> {simulado.tempo_limite ? `${simulado.tempo_limite} min` : 'Sem limite'}
            </div>
          </div>

          <div style={{ background: '#ffebee', border: '1.5px solid #ef9a9a', borderRadius: '1.2rem', padding: '1.6rem 2rem', marginBottom: '2.8rem', textAlign: 'left', fontSize: '1.4rem', color: '#b71c1c', lineHeight: 1.7 }}>
            <strong><span className="material-icons-outlined" style={{ fontSize: '1.6rem', verticalAlign: 'middle' }}>warning</span> Atenção:</strong> Ao confirmar, não saia da aba. Mudar de aba ou minimizar o navegador ativará um contador de 3 minutos — se esse prazo for excedido, a prova será cancelada.
          </div>

          <div style={{ display: 'flex', gap: '1.2rem', justifyContent: 'center' }}>
            <button className="btn btn-secondary" style={{ fontSize: '1.5rem', minWidth: '14rem' }} onClick={() => setFase('info')}>
              ← Voltar
            </button>
            <button className="btn btn-submit" style={{ fontSize: '1.5rem', minWidth: '16rem' }} onClick={iniciarProva}>
              <span className="material-icons-outlined">play_circle</span>
              Confirmar e Iniciar
            </button>
          </div>
        </div>
      </main>
    </ProtectedRoute>
  );

  // ─── RESULTADO ─────────────────────────────────────────────────────────────
  if (fase === 'resultado') {
    const score = calcScore();
    const temObj = simulado.questoes.some(q => q.tipo === 'objetiva');
    const pct = simulado.total_questoes > 0 ? Math.round((score.acertos / simulado.total_questoes) * 100) : 0;
    const nota = (score.acertos / Math.max(simulado.total_questoes, 1)) * 10;

    return (
      <ProtectedRoute tipo="aluno">
        <Navbar />
        <main className="container fade-in">
          <style>{`
            .res-hero { background: linear-gradient(135deg, #0d2d6b, #27ae60); border-radius: 2rem; padding: 3.5rem; text-align: center; color: white; margin-bottom: 2.4rem; }
            .res-circle { width: 13rem; height: 13rem; border-radius: 50%; background: rgba(255,255,255,0.18); display: flex; flex-direction: column; align-items: center; justify-content: center; margin: 0 auto 1.5rem; border: 3px solid rgba(255,255,255,0.4); }
            .qr-card { border-radius: 1.2rem; padding: 1.6rem 1.8rem; margin-bottom: 1.2rem; border-left: 4px solid #ccc; box-shadow: 0 0.1rem 0.5rem rgba(0,0,0,0.04); }
            .qr-card.certa  { border-left-color: #27ae60; background: rgba(39,174,96,0.04); }
            .qr-card.errada { border-left-color: #e74c3c; background: rgba(231,76,60,0.04); }
            .qr-card.disc   { border-left-color: #3498db; background: rgba(52,152,219,0.04); }
            .qr-card.vazia  { border-left-color: #95a5a6; background: rgba(149,165,166,0.04); }
          `}</style>

          <div className="res-hero">
            <div className="res-circle">
              {temObj ? (
                <>
                  <span style={{ fontSize: '3.5rem', fontWeight: 900, lineHeight: 1 }}>{pct}%</span>
                  <span style={{ fontSize: '1.2rem', opacity: 0.85, marginTop: '0.2rem' }}>de acertos</span>
                </>
              ) : (
                <>
                  <span className="material-icons-outlined" style={{ fontSize: '4rem', color: 'white' }}>check_circle</span>
                  <span style={{ fontSize: '1.3rem', marginTop: '0.4rem' }}>Concluído!</span>
                </>
              )}
            </div>
            {resultadoApi && resultadoApi.status === 'corrigido' && resultadoApi.nota !== null ? (
              <h2 style={{ color: 'white', fontSize: '2.4rem', marginBottom: '0.4rem' }}>
                Nota: <strong>{Number(resultadoApi.nota).toFixed(1)}</strong>
              </h2>
            ) : resultadoApi && resultadoApi.status === 'pendente_correcao' ? (
              <h2 style={{ color: 'white', fontSize: '2rem', marginBottom: '0.4rem' }}>
                Aguardando correção das questões discursivas
              </h2>
            ) : temObj ? (
              <h2 style={{ color: 'white', fontSize: '2.4rem', marginBottom: '0.4rem' }}>
                Nota estimada: <strong>{nota.toFixed(1)}</strong>
              </h2>
            ) : null}
            <p style={{ color: 'rgba(255,255,255,0.85)', fontSize: '1.5rem' }}>
              {temObj ? `${score.acertos} corretas · ` : ''}{score.respondidas} de {simulado.total_questoes} respondidas
            </p>
          </div>

          <h3 style={{ fontSize: '1.8rem', marginBottom: '1.6rem' }}>
            <span className="material-icons-outlined" style={{ verticalAlign: 'middle', marginRight: '0.5rem' }}>list_alt</span>
            Revisão das Questões
          </h3>

          {simulado.questoes.map((q, i) => {
            const resp = respostas[q.id];
            let cls = 'vazia';
            let gabaritoEl = null;

            if (q.tipo === 'objetiva') {
              const escolhida = q.alternativas.find(a => a.id === Number(resp));
              const correta   = q.alternativas.find(a => a.correta);
              if (!resp) { cls = 'vazia'; }
              else if (escolhida?.correta) { cls = 'certa'; }
              else { cls = 'errada'; }

              gabaritoEl = (
                <div style={{ marginTop: '0.8rem', fontSize: '1.3rem' }}>
                  {escolhida ? (
                    <p style={{ margin: '0.3rem 0', color: escolhida.correta ? '#1a7a47' : '#c0392b', fontWeight: 600 }}>
                      Sua resposta:{' '}
                      {String.fromCharCode(65 + q.alternativas.indexOf(escolhida))}) {escolhida.texto}
                      {escolhida.imagem_url && (
                        /* eslint-disable-next-line @next/next/no-img-element */
                        <img src={escolhida.imagem_url} alt="Sua resposta"
                          style={{ display: 'block', maxHeight: '120px', maxWidth: '100%', borderRadius: '0.6rem', marginTop: '0.4rem', objectFit: 'contain', border: '1px solid #e2e8f0' }} />
                      )}
                    </p>
                  ) : (
                    <p style={{ margin: '0.3rem 0', color: 'var(--text-secondary)', fontStyle: 'italic' }}>Não respondida.</p>
                  )}
                  {!escolhida?.correta && correta && (
                    <p style={{ margin: '0.3rem 0', color: '#1a7a47', fontWeight: 700 }}>
                      Gabarito: {String.fromCharCode(65 + q.alternativas.indexOf(correta))}) {correta.texto}
                      {correta.imagem_url && (
                        /* eslint-disable-next-line @next/next/no-img-element */
                        <img src={correta.imagem_url} alt="Gabarito"
                          style={{ display: 'block', maxHeight: '120px', maxWidth: '100%', borderRadius: '0.6rem', marginTop: '0.4rem', objectFit: 'contain', border: '1px solid #e2e8f0' }} />
                      )}
                    </p>
                  )}
                </div>
              );
            } else {
              if (resp?.trim()) { cls = 'disc'; }
              else { cls = 'vazia'; }
              gabaritoEl = (
                <div style={{ marginTop: '0.8rem', fontSize: '1.3rem' }}>
                  {resp?.trim() ? (
                    <p style={{ margin: '0.3rem 0' }}><strong>Sua resposta:</strong> {resp}</p>
                  ) : (
                    <p style={{ margin: '0.3rem 0', color: 'var(--text-secondary)', fontStyle: 'italic' }}>Não respondida.</p>
                  )}
                  {q.resposta && (
                    <p style={{ margin: '0.5rem 0', color: '#1a7a47', fontWeight: 600 }}>
                      <strong>Resposta esperada:</strong> {q.resposta}
                    </p>
                  )}
                </div>
              );
            }

            return (
              <div key={q.id} className={`qr-card ${cls}`}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '1rem', marginBottom: '0.5rem' }}>
                  <div style={{ display: 'flex', gap: '0.7rem', alignItems: 'center', flexWrap: 'wrap', flex: 1 }}>
                    <strong style={{ fontSize: '1.5rem' }}>Q{i + 1}</strong>
                    {q.materia_sigla && (
                      <span style={{ background: 'var(--color-secondary)', color: 'white', padding: '0.2rem 0.8rem', borderRadius: '1rem', fontSize: '1.15rem', fontWeight: 700 }}>
                        {q.materia_sigla}
                      </span>
                    )}
                    <span style={{ color: 'var(--text-secondary)', fontSize: '1.25rem' }}>{q.tipo_display}</span>
                  </div>
                  <span className="material-icons-outlined" style={{ fontSize: '2.2rem', flexShrink: 0, color: cls === 'certa' ? '#27ae60' : cls === 'errada' ? '#e74c3c' : cls === 'disc' ? '#3498db' : '#aaa' }}>
                    {cls === 'certa' ? 'check_circle' : cls === 'errada' ? 'cancel' : cls === 'disc' ? 'edit_note' : 'radio_button_unchecked'}
                  </span>
                </div>
                <p style={{ fontSize: '1.45rem', margin: '0 0 0.2rem', wordBreak: 'break-word', lineHeight: 1.5 }}>{q.enunciado}</p>
                {gabaritoEl}
              </div>
            );
          })}

          <div style={{ textAlign: 'center', marginTop: '3rem', marginBottom: '3rem' }}>
            <Link href="/aluno/meus-simulados" className="btn btn-primary" style={{ fontSize: '1.5rem', padding: '1.2rem 3rem' }}>
              Voltar aos Simulados
            </Link>
          </div>
        </main>
      </ProtectedRoute>
    );
  }

  // ─── PROVA (exam) ──────────────────────────────────────────────────────────
  const q = simulado.questoes[questaoIdx];
  const totalRespondidas = simulado.questoes.filter(qq => respostas[qq.id]?.trim()).length;
  const progressPct = (totalRespondidas / simulado.total_questoes) * 100;
  const timerOk = tempoRestante === null || tempoRestante > 60;

  return (
    <ProtectedRoute tipo="aluno">
      <style>{`
        .prova-topbar {
          position: sticky; top: 0; z-index: 100; background: white;
          border-bottom: 2px solid var(--border-light);
          box-shadow: 0 0.2rem 0.8rem rgba(0,0,0,0.07);
          padding: 1rem 2rem; display: flex; align-items: center; gap: 1.4rem; flex-wrap: wrap;
        }
        .prova-prog-track { flex: 1; height: 0.7rem; background: var(--border-light); border-radius: 10rem; min-width: 6rem; }
        .prova-prog-fill  { height: 100%; border-radius: 10rem; background: linear-gradient(90deg, var(--color-secondary), var(--color-primary)); transition: width 0.4s; }
        .timer-box { display: flex; align-items: center; gap: 0.5rem; padding: 0.6rem 1.2rem; border-radius: 0.8rem; font-size: 1.8rem; font-weight: 900; font-variant-numeric: tabular-nums; white-space: nowrap; }
        .q-nav-wrap { display: flex; gap: 0.5rem; flex-wrap: wrap; margin-bottom: 1.8rem; }
        .q-nav-dot {
          width: 3.2rem; height: 3.2rem; border-radius: 0.6rem; border: 2px solid var(--border-light);
          background: white; cursor: pointer; font-size: 1.25rem; font-weight: 700;
          display: flex; align-items: center; justify-content: center; transition: all 0.15s;
        }
        .q-nav-dot.resp  { background: var(--color-secondary); border-color: var(--color-secondary); color: white; }
        .q-nav-dot.atual { border-color: var(--color-primary); color: var(--color-primary); box-shadow: 0 0 0 2px var(--color-primary); }
        .q-nav-dot.atual.resp { background: var(--color-primary); border-color: var(--color-primary); color: white; box-shadow: none; }
        .prova-card { background: white; border-radius: 2rem; padding: 2.8rem; box-shadow: 0 0.2rem 1.2rem rgba(0,0,0,0.08); margin-bottom: 1.8rem; }
        .alt-opt {
          width: 100%; text-align: left; padding: 1.2rem 1.6rem; border-radius: 1rem;
          border: 2px solid var(--border-light); background: white; cursor: pointer;
          font-size: 1.5rem; display: flex; align-items: flex-start; gap: 1rem;
          transition: all 0.15s; margin-bottom: 0.8rem;
        }
        .alt-opt:hover { border-color: var(--color-secondary); background: rgba(52,152,219,0.04); }
        .alt-opt.sel  { border-color: var(--color-primary); background: rgba(13,45,107,0.07); }
        .alt-circle { width: 2.8rem; height: 2.8rem; border-radius: 50%; border: 2px solid currentColor; display: flex; align-items: center; justify-content: center; font-weight: 800; font-size: 1.3rem; flex-shrink: 0; transition: all 0.15s; }
        .away-overlay { position: fixed; inset: 0; background: rgba(0,0,0,0.7); display: flex; align-items: center; justify-content: center; z-index: 9999; }
        .away-box { background: white; border-radius: 2rem; padding: 3.5rem 3rem; max-width: 46rem; width: 90%; text-align: center; }
        .questao-body { display: flex; gap: 2rem; align-items: flex-start; margin-bottom: 2.4rem; }
        .questao-enunciado { flex: 1; font-size: 1.75rem; line-height: 1.65; word-break: break-word; }
        .questao-img-desktop { flex: 0 0 auto; max-width: 38%; display: block; }
        .questao-img-mobile  { display: none; margin: 1.6rem auto 0; text-align: center; }
        @media (max-width: 700px) {
          .questao-body { flex-direction: column; }
          .questao-img-desktop { display: none; }
          .questao-img-mobile  { display: block; }
        }
      `}</style>

      {/* Top bar */}
      <div className="prova-topbar">
        <span style={{ fontWeight: 800, fontSize: '1.5rem', color: 'var(--color-primary)', whiteSpace: 'nowrap' }}>
          {questaoIdx + 1} / {simulado.questoes.length}
        </span>
        <div className="prova-prog-track">
          <div className="prova-prog-fill" style={{ width: `${progressPct}%` }} />
        </div>
        <span style={{ fontSize: '1.3rem', color: 'var(--text-secondary)', whiteSpace: 'nowrap' }}>
          {totalRespondidas}/{simulado.total_questoes}
        </span>
        {tempoRestante !== null && (
          <div className="timer-box" style={{ background: timerOk ? '#e8f5e9' : '#ffebee', color: timerOk ? '#1b5e20' : '#b71c1c' }}>
            <span className="material-icons-outlined" style={{ fontSize: '2rem' }}>timer</span>
            {fmt(tempoRestante)}
          </div>
        )}
        <button
          className="btn btn-submit"
          style={{ fontSize: '1.35rem', padding: '0.8rem 1.6rem', whiteSpace: 'nowrap' }}
          onClick={finalizarProva}
          disabled={enviando}
        >
          <span className="material-icons-outlined" style={{ fontSize: '1.8rem' }}>check_circle</span>
          {enviando ? 'Enviando...' : 'Finalizar'}
        </button>
      </div>

      <main className="container fade-in" style={{ paddingTop: '2rem' }}>

        {/* Question navigator */}
        <div className="q-nav-wrap">
          {simulado.questoes.map((qq, i) => (
            <button
              key={qq.id}
              className={`q-nav-dot${respostas[qq.id]?.trim() ? ' resp' : ''}${i === questaoIdx ? ' atual' : ''}`}
              onClick={() => setQuestaoIdx(i)}
              title={`Questão ${i + 1}${respostas[qq.id]?.trim() ? ' (respondida)' : ''}`}
            >
              {i + 1}
            </button>
          ))}
        </div>

        {/* Current question */}
        {q && (
          <div className="prova-card">
            {/* Header chips */}
            <div style={{ display: 'flex', gap: '0.7rem', flexWrap: 'wrap', marginBottom: '1.8rem', alignItems: 'center' }}>
              <div style={{ width: '3.8rem', height: '3.8rem', borderRadius: '50%', background: 'var(--color-primary)', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 900, fontSize: '1.5rem', flexShrink: 0 }}>
                {questaoIdx + 1}
              </div>
              {q.materia_sigla && (
                <span style={{ background: 'var(--color-secondary)', color: 'white', padding: '0.3rem 1rem', borderRadius: '1rem', fontSize: '1.25rem', fontWeight: 700 }}>
                  {q.materia_sigla}
                </span>
              )}
              <span style={{ color: 'var(--text-secondary)', fontSize: '1.3rem' }}>{q.dificuldade_display}</span>
              <span style={{ color: 'var(--text-secondary)', fontSize: '1.3rem' }}>· {q.tipo_display}</span>
            </div>

            {/* Enunciado + imagem responsiva */}
            <div className="questao-body">
              <p className="questao-enunciado">{q.enunciado}</p>
              {q.imagem_url && (
                <div className="questao-img-desktop">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={q.imagem_url} alt="Imagem da questão"
                    style={{ width: '100%', height: 'auto', borderRadius: '1rem', objectFit: 'contain', border: '1px solid #e2e8f0' }}
                  />
                </div>
              )}
            </div>
            {q.imagem_url && (
              <div className="questao-img-mobile">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={q.imagem_url} alt="Imagem da questão"
                  style={{ maxWidth: '100%', height: 'auto', borderRadius: '1rem', objectFit: 'contain', border: '1px solid #e2e8f0' }}
                />
              </div>
            )}

            {/* Response area */}
            {q.tipo === 'objetiva' ? (
              <div>
                {q.alternativas.map((alt, i) => {
                  const sel = respostas[q.id] === String(alt.id);
                  return (
                    <button
                      key={alt.id}
                      className={`alt-opt${sel ? ' sel' : ''}`}
                      onClick={() => setRespostas(r => ({ ...r, [q.id]: String(alt.id) }))}
                    >
                      <span className="alt-circle" style={{ color: sel ? 'var(--color-primary)' : '#bbb' }}>
                        {String.fromCharCode(65 + i)}
                      </span>
                      <span style={{ flex: 1, wordBreak: 'break-word', textAlign: 'left', paddingTop: '0.2rem', display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
                        {alt.texto && <span>{alt.texto}</span>}
                        {alt.imagem_url && (
                          /* eslint-disable-next-line @next/next/no-img-element */
                          <img src={alt.imagem_url} alt={`Alternativa ${String.fromCharCode(65 + i)}`}
                            style={{ maxHeight: '160px', maxWidth: '100%', borderRadius: '0.8rem', objectFit: 'contain', border: '1px solid #e2e8f0' }}
                          />
                        )}
                      </span>
                    </button>
                  );
                })}
              </div>
            ) : (
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label style={{ fontSize: '1.35rem', color: 'var(--text-secondary)', marginBottom: '0.8rem', display: 'block' }}>
                  {q.exige_justificativa ? 'Resposta (com justificativa):' : 'Sua resposta:'}
                </label>
                <textarea
                  rows={6}
                  style={{ width: '100%', resize: 'vertical', fontSize: '1.5rem', lineHeight: 1.6 }}
                  placeholder="Digite sua resposta aqui..."
                  value={respostas[q.id] ?? ''}
                  onChange={e => setRespostas(r => ({ ...r, [q.id]: e.target.value }))}
                />
              </div>
            )}
          </div>
        )}

        {/* Prev / Next navigation */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '1rem', marginBottom: '5rem' }}>
          <button className="btn btn-secondary" disabled={questaoIdx === 0} onClick={() => setQuestaoIdx(i => i - 1)}>
            <span className="material-icons-outlined">arrow_back</span>
            Anterior
          </button>
          <span style={{ fontSize: '1.3rem', color: 'var(--text-secondary)' }}>
            {questaoIdx + 1} de {simulado.questoes.length}
          </span>
          {questaoIdx < simulado.questoes.length - 1 ? (
            <button className="btn btn-primary" onClick={() => setQuestaoIdx(i => i + 1)}>
              Próxima
              <span className="material-icons-outlined">arrow_forward</span>
            </button>
          ) : (
            <button className="btn btn-submit" onClick={finalizarProva} disabled={enviando}>
              <span className="material-icons-outlined">check_circle</span>
              {enviando ? 'Enviando...' : 'Finalizar Prova'}
            </button>
          )}
        </div>
      </main>

      {/* Away / grace-period modal */}
      {saindoAlerta && (
        <div className="away-overlay">
          <div className="away-box">
            <span className="material-icons-outlined" style={{ fontSize: '5rem', color: '#b71c1c', marginBottom: '1rem', display: 'block' }}>warning</span>
            <h2 style={{ fontSize: '2.4rem', color: '#b71c1c', marginBottom: '0.6rem' }}>Você saiu da prova!</h2>
            <p style={{ fontSize: '1.5rem', color: 'var(--text-secondary)', marginBottom: '1.6rem', lineHeight: 1.6 }}>
              Detectamos que você mudou de aba ou minimizou o navegador.<br />
              Você voltou a tempo. Tolerância acumulada restante:
            </p>
            <div style={{ background: '#ffebee', borderRadius: '1.4rem', padding: '1.5rem 2rem', marginBottom: '2rem' }}>
              <div style={{ fontSize: '4.5rem', fontWeight: 900, color: '#b71c1c', fontVariantNumeric: 'tabular-nums', lineHeight: 1 }}>
                {fmt(graceRestante)}
              </div>
              <p style={{ margin: '0.5rem 0 0', fontSize: '1.25rem', color: '#c62828' }}>
                Se esse limite for atingido, a prova será cancelada.
              </p>
            </div>
            <button
              className="btn btn-primary"
              style={{ fontSize: '1.55rem', padding: '1.2rem', width: '100%' }}
              onClick={() => setSaindoAlerta(false)}
            >
              <span className="material-icons-outlined">play_arrow</span>
              Continuar Prova
            </button>
          </div>
        </div>
      )}
    </ProtectedRoute>
  );
}
