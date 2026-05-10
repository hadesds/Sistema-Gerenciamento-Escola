'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { API_URL } from '@/lib/api';

const C = {
  primary:   '#0d2d6b',
  secondary: '#1a4fa0',
  accent:    '#1a73c7',
  light:     '#3b9fe8',
  bg:        '#f0f4fb',
  white:     '#ffffff',
  text:      '#1a2a4a',
  muted:     '#4a6080',
};

export default function Home() {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && user) {
      if (user.tipo === 'professor') router.push('/professor/dashboard');
      else if (user.tipo === 'aluno') router.push('/aluno/dashboard');
      else if (user.tipo === 'admin') window.location.href = `${API_URL}/admin/`;
    }
  }, [user, loading, router]);

  const [menuOpen, setMenuOpen] = useState(false);
  const closeMenu = () => setMenuOpen(false);

  if (loading || user) return null;

  const features = [
    { icon: 'assessment',        color: C.primary,   title: 'Avaliações Comportamentais',
      desc: 'Avalie assiduidade, participação, responsabilidade e sociabilidade. Relatórios gerados automaticamente.' },
    { icon: 'quiz',              color: C.secondary,  title: 'Banco de Questões & Simulados',
      desc: 'Crie questões por dificuldade, monte simulados personalizados e acompanhe o aproveitamento da turma.' },
    { icon: 'menu_book',         color: C.accent,     title: 'Notas por Bimestre',
      desc: 'Registre notas de todas as matérias em cada bimestre. Alunos acompanham seu histórico completo.' },
    { icon: 'checklist',         color: C.light,      title: 'Controle de Assiduidade',
      desc: 'Líder e vice-líder registram a chamada diária. Histórico completo com presentes e ausentes.' },
    { icon: 'workspace_premium', color: C.primary,    title: 'Perfis de Liderança',
      desc: 'Defina líder e vice-líder para cada turma com acesso especial ao registro de assiduidade.' },
    { icon: 'leaderboard',       color: C.secondary,  title: 'Ranking & Relatórios',
      desc: 'Visualize o top 5 da turma, relatórios individuais e médias gerais por turma em tempo real.' },
  ];

  const stats = [
    { value: '100%', label: 'Desempenho em tempo real',    icon: 'speed' },
    { value: '4',    label: 'Bimestres acompanhados',       icon: 'calendar_month' },
    { value: '10+',  label: 'Matérias suportadas',          icon: 'auto_stories' },
    { value: '360°', label: 'Avaliação comportamental',     icon: 'psychology' },
    { value: '∞',    label: 'Histórico de notas',           icon: 'history_edu' },
  ];

  const steps = [
    { step: '01', icon: 'login',    title: 'Acesse o Sistema',
      desc: 'Entre com suas credenciais. Professores e alunos têm painéis próprios e personalizados.' },
    { step: '02', icon: 'tune',     title: 'Configure sua Turma',
      desc: 'Professores cadastram turmas, alunos e matérias. Sistema pronto para uso em minutos.' },
    { step: '03', icon: 'insights', title: 'Acompanhe Resultados',
      desc: 'Monitore desempenho em tempo real com rankings, gráficos e relatórios detalhados.' },
  ];

  const diferenciais = [
    { icon: 'security',      title: 'Seguro e Confiável',  desc: 'Autenticação JWT com tokens de curta duração. Dados sempre protegidos.' },
    { icon: 'devices',       title: 'Responsivo',           desc: 'Acesse de qualquer dispositivo — computador, tablet ou celular.' },
    { icon: 'bolt',          title: 'Rápido e Moderno',     desc: 'Interface construída em Next.js 15 para máxima performance.' },
    { icon: 'support_agent', title: 'Intuitivo',            desc: 'Design pensado para facilitar o uso por professores e alunos.' },
  ];

  const professorItems = [
    'Visualize turmas e alunos',
    'Registre avaliações comportamentais',
    'Lance notas por bimestre e matéria',
    'Crie questões e monte simulados',
    'Atribua cargos de líder e vice-líder',
    'Acompanhe rankings e relatórios',
  ];

  const alunoItems = [
    'Acesse seu feedback comportamental',
    'Veja suas notas por matéria e bimestre',
    'Faça e revise os simulados da turma',
    'Acompanhe seu histórico de desempenho',
    'Líderes registram a chamada diária',
    'Monitore seu progresso em tempo real',
  ];

  const checkCircle = (
    <span style={{
      background: 'rgba(255,255,255,0.2)', borderRadius: '50%',
      width: '2.4rem', height: '2.4rem', flexShrink: 0,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
    }}>
      <span className="material-icons-outlined" style={{ fontSize: '1.4rem', color: '#fff' }}>check</span>
    </span>
  );

  return (
    <div style={{ fontFamily: "'Poppins', sans-serif", background: C.bg, minHeight: '100vh', color: C.text }}>

      <style>{`
        .lp-header {
          position: sticky; top: 0; z-index: 100;
          background: linear-gradient(135deg, ${C.primary}, ${C.secondary});
          padding: 1.2rem 4rem;
          display: flex; justify-content: space-between; align-items: center;
          box-shadow: 0 0.4rem 1.8rem rgba(13,45,107,0.3);
        }
        .lp-logo { display: flex; align-items: center; gap: 1.4rem; text-decoration: none; }
        .lp-logo-img { height: 4.8rem; width: auto; border-radius: 0.8rem; }
        .lp-logo-name { color: #fff; font-weight: 800; font-size: 2rem; letter-spacing: 0.06em; line-height: 1; }
        .lp-logo-sub  { color: rgba(255,255,255,0.65); font-size: 1.1rem; font-weight: 500; }

        .lp-nav { display: flex; align-items: center; gap: 2.4rem; }
        .lp-nav-link {
          color: rgba(255,255,255,0.82); text-decoration: none;
          font-size: 1.4rem; font-weight: 500; white-space: nowrap;
          transition: color 0.2s;
        }
        .lp-nav-link:hover { color: #fff; }
        .lp-nav-btn {
          background: #fff; color: ${C.primary}; font-weight: 700;
          padding: 0.8rem 2.4rem; border-radius: 5rem;
          text-decoration: none; font-size: 1.5rem;
          box-shadow: 0 2px 10px rgba(0,0,0,0.18);
          display: flex; align-items: center; gap: 0.5rem; white-space: nowrap;
          transition: box-shadow 0.2s;
        }
        .lp-nav-btn:hover { box-shadow: 0 4px 16px rgba(0,0,0,0.25); }
        .lp-nav-btn .material-icons-outlined { font-size: 1.8rem; }

        /* Hamburger — oculto no desktop */
        .lp-hamburger {
          display: none;
          background: rgba(255,255,255,0.15);
          border: 1.5px solid rgba(255,255,255,0.35);
          border-radius: 0.8rem;
          padding: 0.6rem;
          cursor: pointer;
          color: #fff;
          align-items: center;
          justify-content: center;
          transition: background 0.2s;
        }
        .lp-hamburger:hover { background: rgba(255,255,255,0.25); }
        .lp-hamburger .material-icons-outlined { font-size: 2.6rem; }

        /* Menu mobile — oculto por padrão */
        .lp-mobile-menu {
          display: none;
          position: absolute; top: 100%; left: 0; right: 0;
          background: linear-gradient(180deg, ${C.secondary}, ${C.primary});
          flex-direction: column;
          padding: 1.6rem 2.4rem 2.4rem;
          gap: 0.4rem;
          box-shadow: 0 8px 24px rgba(13,45,107,0.35);
          z-index: 99;
        }
        .lp-mobile-menu.open { display: flex; }
        .lp-mobile-link {
          color: rgba(255,255,255,0.88); text-decoration: none;
          font-size: 1.6rem; font-weight: 500;
          padding: 1.2rem 0;
          border-bottom: 1px solid rgba(255,255,255,0.1);
          display: flex; align-items: center; gap: 0.8rem;
          transition: color 0.2s;
        }
        .lp-mobile-link:hover { color: #fff; }
        .lp-mobile-link .material-icons-outlined { font-size: 2rem; }
        .lp-mobile-btn {
          margin-top: 1.2rem;
          background: #fff; color: ${C.primary};
          font-weight: 700; font-size: 1.6rem;
          padding: 1.2rem 2rem; border-radius: 5rem;
          text-decoration: none;
          display: flex; align-items: center; justify-content: center; gap: 0.6rem;
          box-shadow: 0 4px 12px rgba(0,0,0,0.2);
        }
        .lp-mobile-btn .material-icons-outlined { font-size: 2rem; }

        @media (max-width: 768px) {
          .lp-header { padding: 1.2rem 2rem; position: relative; }
          .lp-nav { display: none; }
          .lp-hamburger { display: flex; }
        }
        @media (max-width: 480px) {
          .lp-header { padding: 1rem 1.6rem; }
          .lp-logo-img { height: 3.8rem; }
          .lp-logo-name { font-size: 1.7rem; }
          .lp-logo-sub { font-size: 1rem; }
        }
      `}</style>

      {/* ── Header ── */}
      <header className="lp-header">
        <a href="/" className="lp-logo">
          <Image src="/logo_escola.png" alt="Logo CARA" width={48} height={48} className="lp-logo-img" />
          <div>
            <div className="lp-logo-name">CARA</div>
            <div className="lp-logo-sub">Gestão Escolar</div>
          </div>
        </a>

        {/* Nav desktop */}
        <nav className="lp-nav">
          <a href="#funcionalidades" className="lp-nav-link">Funcionalidades</a>
          <a href="#como-funciona" className="lp-nav-link">Como Funciona</a>
          <Link href="/login" className="lp-nav-btn">
            Entrar
            <span className="material-icons-outlined">arrow_forward</span>
          </Link>
        </nav>

        {/* Hamburger mobile */}
        <button
          className="lp-hamburger"
          onClick={() => setMenuOpen(o => !o)}
          aria-label={menuOpen ? 'Fechar menu' : 'Abrir menu'}
        >
          <span className="material-icons-outlined">{menuOpen ? 'close' : 'menu'}</span>
        </button>

        {/* Menu mobile dropdown */}
        <div className={`lp-mobile-menu${menuOpen ? ' open' : ''}`}>
          <a href="#funcionalidades" className="lp-mobile-link" onClick={closeMenu}>
            <span className="material-icons-outlined">grid_view</span>
            Funcionalidades
          </a>
          <a href="#como-funciona" className="lp-mobile-link" onClick={closeMenu}>
            <span className="material-icons-outlined">help_outline</span>
            Como Funciona
          </a>
          <Link href="/login" className="lp-mobile-btn" onClick={closeMenu}>
            <span className="material-icons-outlined">login</span>
            Entrar no Sistema
          </Link>
        </div>
      </header>

      {/* ── Hero ── */}
      <section style={{
        background: `linear-gradient(135deg, ${C.primary} 0%, ${C.secondary} 55%, ${C.accent} 100%)`,
        padding: '9rem 4rem 8rem',
        textAlign: 'center',
        position: 'relative',
        overflow: 'hidden',
      }}>
        <div style={{
          position: 'absolute', top: '-10rem', right: '-10rem',
          width: '44rem', height: '44rem', borderRadius: '50%',
          background: 'rgba(255,255,255,0.05)', pointerEvents: 'none',
        }} />
        <div style={{
          position: 'absolute', bottom: '-8rem', left: '-8rem',
          width: '32rem', height: '32rem', borderRadius: '50%',
          background: 'rgba(255,255,255,0.04)', pointerEvents: 'none',
        }} />
        <div style={{
          position: 'absolute', top: '30%', left: '8%',
          width: '16rem', height: '16rem', borderRadius: '50%',
          background: 'rgba(255,255,255,0.03)', pointerEvents: 'none',
        }} />

        <div style={{ maxWidth: '82rem', margin: '0 auto', position: 'relative' }}>
          <div style={{
            display: 'inline-flex', alignItems: 'center', gap: '0.8rem',
            background: 'rgba(255,255,255,0.15)', borderRadius: '5rem',
            padding: '0.6rem 2rem', marginBottom: '2.8rem',
            fontSize: '1.4rem', color: '#fff', fontWeight: 600,
            border: '1px solid rgba(255,255,255,0.3)',
          }}>
            <span className="material-icons-outlined" style={{ fontSize: '1.8rem' }}>school</span>
            Sistema de Gestão Escolar
          </div>

          <h1 style={{
            fontSize: 'clamp(3.6rem, 7vw, 6.2rem)',
            fontWeight: 800, color: '#fff',
            lineHeight: 1.15, marginBottom: '2.2rem',
            textShadow: '0 2px 14px rgba(0,0,0,0.2)',
          }}>
            Gestão Escolar<br />
            <span style={{ color: '#a8d4f5' }}>Inteligente</span>
          </h1>

          <p style={{
            fontSize: '2rem', color: 'rgba(255,255,255,0.88)',
            maxWidth: '60rem', margin: '0 auto 4.5rem',
            lineHeight: 1.65,
          }}>
            O CARA conecta professores e alunos em uma plataforma completa — avaliações, simulados, notas e assiduidade em um só lugar.
          </p>

          <div style={{ display: 'flex', gap: '1.6rem', justifyContent: 'center', flexWrap: 'wrap' }}>
            <Link href="/login" style={{
              background: '#fff', color: C.primary,
              fontWeight: 700, fontSize: '1.7rem',
              padding: '1.4rem 4rem', borderRadius: '5rem',
              textDecoration: 'none',
              boxShadow: '0 4px 22px rgba(0,0,0,0.25)',
              display: 'inline-flex', alignItems: 'center', gap: '0.8rem',
            }}>
              Acessar o Sistema
              <span className="material-icons-outlined" style={{ fontSize: '2rem' }}>login</span>
            </Link>
            <a href="#funcionalidades" style={{
              background: 'rgba(255,255,255,0.14)', color: '#fff',
              fontWeight: 600, fontSize: '1.7rem',
              padding: '1.4rem 4rem', borderRadius: '5rem',
              textDecoration: 'none', border: '2px solid rgba(255,255,255,0.4)',
              display: 'inline-flex', alignItems: 'center', gap: '0.8rem',
            }}>
              Saiba mais
              <span className="material-icons-outlined" style={{ fontSize: '2rem' }}>expand_more</span>
            </a>
          </div>
        </div>
      </section>

      {/* ── Stats bar ── */}
      <section style={{
        background: C.white, padding: '3.5rem 4rem',
        display: 'flex', justifyContent: 'center', gap: '5rem', flexWrap: 'wrap',
        boxShadow: '0 4px 20px rgba(13,45,107,0.09)',
      }}>
        {stats.map(s => (
          <div key={s.label} style={{ textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.4rem' }}>
            <span className="material-icons-outlined" style={{ fontSize: '2.8rem', color: C.accent }}>{s.icon}</span>
            <div style={{ fontSize: '3.2rem', fontWeight: 800, color: C.primary }}>{s.value}</div>
            <div style={{ fontSize: '1.3rem', color: C.muted }}>{s.label}</div>
          </div>
        ))}
      </section>

      {/* ── Features ── */}
      <section id="funcionalidades" style={{ padding: '8rem 4rem', maxWidth: '126rem', margin: '0 auto' }}>
        <div style={{ textAlign: 'center', marginBottom: '5rem' }}>
          <div style={{
            display: 'inline-block', background: `${C.accent}18`, color: C.accent,
            borderRadius: '5rem', padding: '0.5rem 2rem', fontSize: '1.3rem', fontWeight: 600, marginBottom: '1.5rem',
          }}>
            Funcionalidades
          </div>
          <h2 style={{ fontSize: '3.6rem', fontWeight: 800, color: C.primary }}>
            Tudo que a sua escola precisa
          </h2>
          <p style={{ fontSize: '1.7rem', color: C.muted, marginTop: '1rem' }}>
            Funcionalidades pensadas para o dia a dia de professores e alunos
          </p>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(30rem, 1fr))', gap: '2.4rem' }}>
          {features.map(f => (
            <div key={f.title} style={{
              background: C.white, borderRadius: '1.6rem',
              padding: '3rem 2.5rem',
              boxShadow: '0 4px 20px rgba(13,45,107,0.07)',
              borderTop: `4px solid ${f.color}`,
            }}>
              <div style={{
                width: '5.6rem', height: '5.6rem', borderRadius: '1.4rem',
                background: `${f.color}15`,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                marginBottom: '1.8rem',
              }}>
                <span className="material-icons-outlined" style={{ fontSize: '2.8rem', color: f.color }}>{f.icon}</span>
              </div>
              <h3 style={{ fontSize: '1.8rem', fontWeight: 700, color: C.primary, marginBottom: '1rem' }}>{f.title}</h3>
              <p style={{ fontSize: '1.5rem', color: C.muted, lineHeight: 1.7 }}>{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── Como funciona ── */}
      <section id="como-funciona" style={{
        background: `linear-gradient(135deg, ${C.primary}, ${C.secondary})`,
        padding: '8rem 4rem',
      }}>
        <div style={{ maxWidth: '102rem', margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: '5.5rem' }}>
            <h2 style={{ fontSize: '3.6rem', fontWeight: 800, color: '#fff' }}>Como funciona?</h2>
            <p style={{ fontSize: '1.7rem', color: 'rgba(255,255,255,0.72)', marginTop: '1rem' }}>
              Três passos simples para começar a usar o CARA
            </p>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(28rem, 1fr))', gap: '3rem' }}>
            {steps.map(s => (
              <div key={s.step} style={{
                background: 'rgba(255,255,255,0.1)', borderRadius: '2rem',
                padding: '4rem 3rem 3.5rem', textAlign: 'center',
                border: '1px solid rgba(255,255,255,0.2)',
                position: 'relative',
              }}>
                <div style={{
                  position: 'absolute', top: '-1.8rem', left: '50%', transform: 'translateX(-50%)',
                  background: C.white, color: C.primary,
                  width: '4rem', height: '4rem', borderRadius: '50%',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontWeight: 800, fontSize: '1.4rem',
                  boxShadow: '0 4px 12px rgba(0,0,0,0.2)',
                }}>{s.step}</div>
                <div style={{
                  width: '7rem', height: '7rem', borderRadius: '50%',
                  background: 'rgba(255,255,255,0.15)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  margin: '0 auto 2rem',
                }}>
                  <span className="material-icons-outlined" style={{ fontSize: '3.4rem', color: '#fff' }}>{s.icon}</span>
                </div>
                <h3 style={{ fontSize: '2rem', fontWeight: 700, color: '#fff', marginBottom: '1.2rem' }}>{s.title}</h3>
                <p style={{ fontSize: '1.5rem', color: 'rgba(255,255,255,0.78)', lineHeight: 1.7 }}>{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Para quem é o CARA ── */}
      <section style={{ padding: '8rem 4rem', background: C.bg }}>
        <div style={{ maxWidth: '102rem', margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: '5rem' }}>
            <h2 style={{ fontSize: '3.6rem', fontWeight: 800, color: C.primary }}>Para quem é o CARA?</h2>
            <p style={{ fontSize: '1.7rem', color: C.muted, marginTop: '1rem' }}>
              Dois perfis, uma plataforma integrada
            </p>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(36rem, 1fr))', gap: '3rem' }}>

            <div style={{
              background: `linear-gradient(135deg, ${C.primary}, ${C.secondary})`,
              borderRadius: '2rem', padding: '4rem 3.5rem', color: '#fff',
              boxShadow: '0 8px 32px rgba(13,45,107,0.3)',
            }}>
              <div style={{
                width: '7rem', height: '7rem', borderRadius: '50%',
                background: 'rgba(255,255,255,0.15)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                marginBottom: '2rem',
              }}>
                <span className="material-icons-outlined" style={{ fontSize: '3.6rem', color: '#fff' }}>person_outline</span>
              </div>
              <h3 style={{ fontSize: '2.4rem', fontWeight: 800, marginBottom: '2rem' }}>Professores</h3>
              <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '1.2rem' }}>
                {professorItems.map(item => (
                  <li key={item} style={{ display: 'flex', alignItems: 'center', gap: '1.2rem', fontSize: '1.6rem' }}>
                    {checkCircle}{item}
                  </li>
                ))}
              </ul>
            </div>

            <div style={{
              background: `linear-gradient(135deg, ${C.accent}, ${C.light})`,
              borderRadius: '2rem', padding: '4rem 3.5rem', color: '#fff',
              boxShadow: '0 8px 32px rgba(26,115,199,0.3)',
            }}>
              <div style={{
                width: '7rem', height: '7rem', borderRadius: '50%',
                background: 'rgba(255,255,255,0.15)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                marginBottom: '2rem',
              }}>
                <span className="material-icons-outlined" style={{ fontSize: '3.6rem', color: '#fff' }}>school</span>
              </div>
              <h3 style={{ fontSize: '2.4rem', fontWeight: 800, marginBottom: '2rem' }}>Alunos</h3>
              <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '1.2rem' }}>
                {alunoItems.map(item => (
                  <li key={item} style={{ display: 'flex', alignItems: 'center', gap: '1.2rem', fontSize: '1.6rem' }}>
                    {checkCircle}{item}
                  </li>
                ))}
              </ul>
            </div>

          </div>
        </div>
      </section>

      {/* ── Diferenciais ── */}
      <section style={{
        background: C.white,
        padding: '6rem 4rem',
        borderTop: `4px solid ${C.accent}`,
        borderBottom: `4px solid ${C.accent}`,
      }}>
        <div style={{ maxWidth: '102rem', margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: '4rem' }}>
            <h2 style={{ fontSize: '3rem', fontWeight: 800, color: C.primary }}>Por que escolher o CARA?</h2>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(22rem, 1fr))', gap: '3rem' }}>
            {diferenciais.map(d => (
              <div key={d.title} style={{ display: 'flex', gap: '1.6rem', alignItems: 'flex-start' }}>
                <div style={{
                  width: '5.2rem', height: '5.2rem', borderRadius: '1.2rem',
                  background: `${C.accent}15`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                }}>
                  <span className="material-icons-outlined" style={{ fontSize: '2.6rem', color: C.accent }}>{d.icon}</span>
                </div>
                <div>
                  <div style={{ fontWeight: 700, fontSize: '1.6rem', color: C.primary, marginBottom: '0.5rem' }}>{d.title}</div>
                  <div style={{ fontSize: '1.4rem', color: C.muted, lineHeight: 1.65 }}>{d.desc}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA Final ── */}
      <section style={{ padding: '9rem 4rem', textAlign: 'center', background: C.bg }}>
        <div style={{ maxWidth: '60rem', margin: '0 auto' }}>
          <span className="material-icons-outlined" style={{ fontSize: '5.2rem', color: C.accent, display: 'block', marginBottom: '2rem' }}>
            rocket_launch
          </span>
          <h2 style={{ fontSize: '4rem', fontWeight: 800, color: C.primary, marginBottom: '1.5rem' }}>
            Pronto para começar?
          </h2>
          <p style={{ fontSize: '1.8rem', color: C.muted, marginBottom: '4rem', lineHeight: 1.65 }}>
            Entre com suas credenciais e tenha acesso completo ao sistema de gestão escolar.
          </p>
          <Link href="/login" style={{
            background: `linear-gradient(135deg, ${C.primary}, ${C.accent})`,
            color: '#fff', fontWeight: 700, fontSize: '1.8rem',
            padding: '1.6rem 5rem', borderRadius: '5rem',
            textDecoration: 'none',
            boxShadow: '0 6px 24px rgba(13,45,107,0.35)',
            display: 'inline-flex', alignItems: 'center', gap: '1rem',
          }}>
            Entrar no Sistema
            <span className="material-icons-outlined" style={{ fontSize: '2.2rem' }}>arrow_forward</span>
          </Link>
        </div>
      </section>

      {/* ── Footer ── */}
      <footer style={{
        background: C.primary, padding: '4rem 4rem', textAlign: 'center',
      }}>
        <div style={{ marginBottom: '1.6rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '1.2rem' }}>
          <Image src="/logo_escola.png" alt="Logo CARA" width={36} height={36} style={{ height: '3.6rem', width: 'auto', borderRadius: '0.5rem' }} />
          <span style={{ color: '#fff', fontWeight: 700, fontSize: '1.8rem' }}>CARA</span>
        </div>
        <p style={{ color: 'rgba(255,255,255,0.45)', fontSize: '1.4rem' }}>
          &copy; 2025 Sistema CARA — Gestão Escolar Inteligente
        </p>
      </footer>

    </div>
  );
}
