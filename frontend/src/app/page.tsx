'use client';

import { useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';

export default function Home() {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && user) {
      if (user.tipo === 'professor') router.push('/professor/dashboard');
      else if (user.tipo === 'aluno') router.push('/aluno/dashboard');
      else if (user.tipo === 'admin') {
        const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5433';
        window.location.href = `${apiUrl}/admin/`;
      }
    }
  }, [user, loading, router]);

  if (loading || user) return null;

  return (
    <div style={{ fontFamily: "'Poppins', sans-serif", background: 'radial-gradient(circle, #FFF5df, #fce8b4)', minHeight: '100vh' }}>

      {/* ── Header ── */}
      <header style={{
        position: 'sticky', top: 0, zIndex: 100,
        background: 'linear-gradient(135deg, #f5a623, #f39c12)',
        padding: '1.4rem 4rem',
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        boxShadow: '0 0.4rem 1.5rem rgba(0,0,0,0.12)',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1.2rem' }}>
          <Image src="/logo.png" alt="CARA" width={40} height={40} style={{ height: '4rem', width: 'auto' }} />
          <span style={{ color: '#fff', fontWeight: 700, fontSize: '2.2rem', letterSpacing: '0.05em' }}>CARA</span>
        </div>
        <Link href="/login" style={{
          background: '#fff', color: '#f5a623', fontWeight: 700,
          padding: '0.8rem 2.4rem', borderRadius: '5rem',
          textDecoration: 'none', fontSize: '1.5rem',
          boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
        }}>
          Entrar →
        </Link>
      </header>

      {/* ── Hero ── */}
      <section style={{
        background: 'linear-gradient(135deg, #f5a623 0%, #ffc107 50%, #f39c12 100%)',
        padding: '9rem 4rem 8rem',
        textAlign: 'center',
        position: 'relative',
        overflow: 'hidden',
      }}>
        <div style={{
          position: 'absolute', inset: 0,
          background: 'radial-gradient(ellipse at 20% 50%, rgba(255,255,255,0.15) 0%, transparent 60%), radial-gradient(ellipse at 80% 20%, rgba(255,255,255,0.1) 0%, transparent 50%)',
          pointerEvents: 'none',
        }} />
        <div style={{ maxWidth: '80rem', margin: '0 auto', position: 'relative' }}>
          <div style={{
            display: 'inline-flex', alignItems: 'center', gap: '0.8rem',
            background: 'rgba(255,255,255,0.25)', borderRadius: '5rem',
            padding: '0.6rem 2rem', marginBottom: '2.5rem',
            fontSize: '1.4rem', color: '#fff', fontWeight: 600,
          }}>
            <span>🏫</span> Sistema de Gestão Escolar
          </div>
          <h1 style={{
            fontSize: 'clamp(3.6rem, 7vw, 6rem)',
            fontWeight: 800, color: '#fff',
            lineHeight: 1.15, marginBottom: '2rem',
            textShadow: '0 2px 12px rgba(0,0,0,0.15)',
          }}>
            Gestão Escolar<br />
            <span style={{ color: '#fff9e6' }}>Inteligente</span>
          </h1>
          <p style={{
            fontSize: '2rem', color: 'rgba(255,255,255,0.92)',
            maxWidth: '56rem', margin: '0 auto 4rem',
            lineHeight: 1.6,
          }}>
            O CARA conecta professores e alunos em uma plataforma completa — avaliações, simulados, notas e assiduidade em um só lugar.
          </p>
          <div style={{ display: 'flex', gap: '1.6rem', justifyContent: 'center', flexWrap: 'wrap' }}>
            <Link href="/login" style={{
              background: '#fff', color: '#f5a623',
              fontWeight: 700, fontSize: '1.7rem',
              padding: '1.4rem 4rem', borderRadius: '5rem',
              textDecoration: 'none',
              boxShadow: '0 4px 20px rgba(0,0,0,0.2)',
            }}>
              Acessar o Sistema
            </Link>
            <a href="#funcionalidades" style={{
              background: 'rgba(255,255,255,0.2)', color: '#fff',
              fontWeight: 600, fontSize: '1.7rem',
              padding: '1.4rem 4rem', borderRadius: '5rem',
              textDecoration: 'none', border: '2px solid rgba(255,255,255,0.5)',
            }}>
              Saiba mais ↓
            </a>
          </div>
        </div>
      </section>

      {/* ── Stats bar ── */}
      <section style={{
        background: '#fff', padding: '3rem 4rem',
        display: 'flex', justifyContent: 'center', gap: '6rem', flexWrap: 'wrap',
        boxShadow: '0 4px 20px rgba(0,0,0,0.06)',
      }}>
        {[
          { value: '100%', label: 'Desempenho em tempo real' },
          { value: '4', label: 'Bimestres acompanhados' },
          { value: '10+', label: 'Matérias suportadas' },
        ].map(s => (
          <div key={s.label} style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '3.6rem', fontWeight: 800, color: '#f5a623' }}>{s.value}</div>
            <div style={{ fontSize: '1.4rem', color: '#555', marginTop: '0.3rem' }}>{s.label}</div>
          </div>
        ))}
      </section>

      {/* ── Features ── */}
      <section id="funcionalidades" style={{ padding: '8rem 4rem', maxWidth: '120rem', margin: '0 auto' }}>
        <div style={{ textAlign: 'center', marginBottom: '5rem' }}>
          <h2 style={{ fontSize: '3.6rem', fontWeight: 800, color: '#333' }}>
            Tudo que a sua escola precisa
          </h2>
          <p style={{ fontSize: '1.7rem', color: '#555', marginTop: '1rem' }}>
            Funcionalidades pensadas para o dia a dia de professores e alunos
          </p>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(28rem, 1fr))', gap: '2.4rem' }}>
          {[
            { icon: '📊', title: 'Avaliações Comportamentais', color: '#f5a623',
              desc: 'Avalie assiduidade, participação, responsabilidade e sociabilidade. Relatórios gerados automaticamente.' },
            { icon: '📝', title: 'Banco de Questões & Simulados', color: '#e67b59',
              desc: 'Crie questões por dificuldade, monte simulados personalizados e acompanhe o aproveitamento da turma.' },
            { icon: '📚', title: 'Notas por Bimestre', color: '#27ae60',
              desc: 'Registre notas de todas as matérias em cada bimestre. Alunos acompanham seu histórico completo.' },
            { icon: '✅', title: 'Controle de Assiduidade', color: '#3498db',
              desc: 'Líder e vice-líder registram a chamada diária. Histórico completo com presentes e ausentes.' },
            { icon: '👑', title: 'Perfis de Liderança', color: '#9b59b6',
              desc: 'Defina líder e vice-líder para cada turma com acesso especial ao registro de assiduidade.' },
            { icon: '🏆', title: 'Ranking & Relatórios', color: '#f39c12',
              desc: 'Visualize o top 5 da turma, relatórios individuais e médias gerais por turma em tempo real.' },
          ].map(f => (
            <div key={f.title} style={{
              background: '#fff', borderRadius: '1.6rem',
              padding: '3rem 2.5rem',
              boxShadow: '0 4px 20px rgba(0,0,0,0.06)',
              borderLeft: `4px solid ${f.color}`,
            }}>
              <div style={{ fontSize: '4rem', marginBottom: '1.6rem' }}>{f.icon}</div>
              <h3 style={{ fontSize: '1.8rem', fontWeight: 700, color: '#333', marginBottom: '1rem' }}>{f.title}</h3>
              <p style={{ fontSize: '1.5rem', color: '#666', lineHeight: 1.7 }}>{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── Roles ── */}
      <section style={{
        background: 'linear-gradient(135deg, #fff9e6, #fff3cc)',
        padding: '8rem 4rem',
      }}>
        <div style={{ maxWidth: '100rem', margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: '5rem' }}>
            <h2 style={{ fontSize: '3.6rem', fontWeight: 800, color: '#333' }}>Para quem é o CARA?</h2>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(36rem, 1fr))', gap: '3rem' }}>

            <div style={{
              background: 'linear-gradient(135deg, #f5a623, #f39c12)',
              borderRadius: '2rem', padding: '4rem 3.5rem', color: '#fff',
              boxShadow: '0 8px 32px rgba(245,166,35,0.3)',
            }}>
              <div style={{ fontSize: '5rem', marginBottom: '2rem' }}>👨‍🏫</div>
              <h3 style={{ fontSize: '2.4rem', fontWeight: 800, marginBottom: '2rem' }}>Professores</h3>
              <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '1.2rem' }}>
                {['Visualize turmas e alunos', 'Registre avaliações comportamentais',
                  'Lance notas por bimestre e matéria', 'Crie questões e monte simulados',
                  'Atribua cargos de líder e vice-líder', 'Acompanhe rankings e relatórios'].map(item => (
                  <li key={item} style={{ display: 'flex', alignItems: 'center', gap: '1.2rem', fontSize: '1.6rem' }}>
                    <span style={{ background: 'rgba(255,255,255,0.3)', borderRadius: '50%', width: '2.4rem', height: '2.4rem', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.2rem', flexShrink: 0 }}>✓</span>
                    {item}
                  </li>
                ))}
              </ul>
            </div>

            <div style={{
              background: 'linear-gradient(135deg, #e67b59, #c0392b)',
              borderRadius: '2rem', padding: '4rem 3.5rem', color: '#fff',
              boxShadow: '0 8px 32px rgba(230,123,89,0.3)',
            }}>
              <div style={{ fontSize: '5rem', marginBottom: '2rem' }}>🎓</div>
              <h3 style={{ fontSize: '2.4rem', fontWeight: 800, marginBottom: '2rem' }}>Alunos</h3>
              <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '1.2rem' }}>
                {['Acesse seu feedback comportamental', 'Veja suas notas por matéria e bimestre',
                  'Faça e revise os simulados da turma', 'Acompanhe seu histórico de desempenho',
                  'Líderes registram a chamada diária', 'Monitore seu progresso em tempo real'].map(item => (
                  <li key={item} style={{ display: 'flex', alignItems: 'center', gap: '1.2rem', fontSize: '1.6rem' }}>
                    <span style={{ background: 'rgba(255,255,255,0.3)', borderRadius: '50%', width: '2.4rem', height: '2.4rem', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.2rem', flexShrink: 0 }}>✓</span>
                    {item}
                  </li>
                ))}
              </ul>
            </div>

          </div>
        </div>
      </section>

      {/* ── CTA ── */}
      <section style={{ padding: '9rem 4rem', textAlign: 'center' }}>
        <div style={{ maxWidth: '60rem', margin: '0 auto' }}>
          <h2 style={{ fontSize: '4rem', fontWeight: 800, color: '#333', marginBottom: '1.5rem' }}>
            Pronto para começar?
          </h2>
          <p style={{ fontSize: '1.8rem', color: '#555', marginBottom: '4rem', lineHeight: 1.6 }}>
            Entre com suas credenciais e tenha acesso completo ao sistema de gestão escolar.
          </p>
          <Link href="/login" style={{
            background: 'linear-gradient(135deg, #f5a623, #f39c12)',
            color: '#fff', fontWeight: 700, fontSize: '1.8rem',
            padding: '1.6rem 5rem', borderRadius: '5rem',
            textDecoration: 'none',
            boxShadow: '0 6px 24px rgba(245,166,35,0.4)',
            display: 'inline-block',
          }}>
            Entrar no Sistema →
          </Link>
        </div>
      </section>

      {/* ── Footer ── */}
      <footer style={{
        background: '#222', padding: '3rem 4rem',
        textAlign: 'center', color: '#888', fontSize: '1.4rem',
      }}>
        <p>&copy; 2025 Sistema CARA — Gestão Escolar Inteligente</p>
      </footer>

    </div>
  );
}
