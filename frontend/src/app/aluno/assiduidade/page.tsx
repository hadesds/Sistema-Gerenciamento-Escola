'use client';

import { useEffect, useState } from 'react';
import { apiFetch } from '@/lib/api';
import Navbar from '@/components/Navbar';
import ProtectedRoute from '@/components/ProtectedRoute';
import Loading from '@/components/Loading';
import Alert from '@/components/Alert';

interface AlunoPresenca {
  id: number;
  nome: string;
  matricula: string | null;
  presente: boolean;
}

interface RegistroHistorico {
  id: number;
  data: string;
  observacao: string;
  registrado_por: string;
  total: number;
  presentes: number;
  ausentes: number;
}

interface AssiduidadeData {
  turma: string;
  papel: string;
  alunos: AlunoPresenca[];
  historico: RegistroHistorico[];
}

export default function AssiduidadePage() {
  const [data, setData] = useState<AssiduidadeData | null>(null);
  const [loading, setLoading] = useState(true);
  const [presencas, setPresencas] = useState<Record<number, boolean>>({});
  const [observacao, setObservacao] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [alert, setAlert] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  function fetchData() {
    setLoading(true);
    apiFetch<AssiduidadeData>('/aluno/assiduidade/')
      .then(d => {
        setData(d);
        const init: Record<number, boolean> = {};
        d.alunos.forEach(a => { init[a.id] = true; });
        setPresencas(init);
      })
      .finally(() => setLoading(false));
  }

  useEffect(() => { fetchData(); }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    try {
      await apiFetch('/aluno/assiduidade/', {
        method: 'POST',
        body: JSON.stringify({ presencas_data: presencas, observacao }),
      });
      setAlert({ type: 'success', message: 'Registro de assiduidade salvo com sucesso!' });
      setObservacao('');
      fetchData();
    } catch {
      setAlert({ type: 'error', message: 'Erro ao salvar registro.' });
    } finally {
      setSubmitting(false);
    }
  }

  const presentesCount = Object.values(presencas).filter(Boolean).length;
  const totalCount = data?.alunos.length ?? 0;

  return (
    <ProtectedRoute tipo="aluno">
      <Navbar />
      <main className="container fade-in">
        {alert && <Alert type={alert.type} message={alert.message} onClose={() => setAlert(null)} />}

        {loading ? <Loading /> : !data ? (
          <div className="empty-state">
            <div className="empty-icon"><span className="material-icons-outlined" style={{ fontSize: '5rem' }}>lock</span></div>
            <h2>Acesso restrito</h2>
            <p>Apenas o líder ou vice-líder da turma pode registrar assiduidade.</p>
          </div>
        ) : (
          <>
            <div style={{ marginBottom: '2rem' }}>
              <h1>Registro de Assiduidade</h1>
              <p style={{ color: 'var(--text-secondary)', marginTop: '0.4rem' }}>
                {data.turma} · <strong style={{ color: 'var(--color-primary)' }}>{data.papel === 'lider' ? 'Líder' : 'Vice-Líder'}</strong>
              </p>
            </div>

            <form onSubmit={handleSubmit}>
              <div className="card mb-2">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                  <h2 style={{ margin: 0 }}>Hoje — {new Date().toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long' })}</h2>
                  <span className="badge" style={{ background: 'var(--color-success)', color: '#fff' }}>
                    {presentesCount}/{totalCount} presentes
                  </span>
                </div>

                <div style={{ display: 'flex', gap: '1rem', marginBottom: '1.5rem' }}>
                  <button type="button" className="btn btn-secondary" style={{ fontSize: '1.2rem' }}
                    onClick={() => {
                      const all: Record<number, boolean> = {};
                      data.alunos.forEach(a => { all[a.id] = true; });
                      setPresencas(all);
                    }}>
                    <span className="material-icons-outlined" style={{ fontSize: '1.6rem', verticalAlign: 'middle', marginRight: '0.4rem' }}>check_circle</span>Todos presentes
                  </button>
                  <button type="button" className="btn btn-secondary" style={{ fontSize: '1.2rem' }}
                    onClick={() => {
                      const none: Record<number, boolean> = {};
                      data.alunos.forEach(a => { none[a.id] = false; });
                      setPresencas(none);
                    }}>
                    <span className="material-icons-outlined" style={{ fontSize: '1.6rem', verticalAlign: 'middle', marginRight: '0.4rem' }}>cancel</span>Todos ausentes
                  </button>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: '1rem' }}>
                  {data.alunos.map(aluno => (
                    <label key={aluno.id} style={{
                      display: 'flex', alignItems: 'center', gap: '1rem', padding: '1rem 1.5rem',
                      borderRadius: '1rem', border: `2px solid ${presencas[aluno.id] ? 'var(--color-success)' : 'var(--color-danger)'}`,
                      background: presencas[aluno.id] ? 'rgba(39,174,96,0.08)' : 'rgba(231,76,60,0.08)',
                      cursor: 'pointer', transition: 'all 0.2s',
                    }}>
                      <input
                        type="checkbox"
                        checked={presencas[aluno.id] ?? true}
                        onChange={e => setPresencas(p => ({ ...p, [aluno.id]: e.target.checked }))}
                        style={{ width: '1.8rem', height: '1.8rem', accentColor: 'var(--color-success)', cursor: 'pointer' }}
                      />
                      <div>
                        <div style={{ fontWeight: 600, fontSize: '1.5rem' }}>{aluno.nome}</div>
                        {aluno.matricula && <div style={{ fontSize: '1.2rem', color: 'var(--text-secondary)' }}>{aluno.matricula}</div>}
                      </div>
                      <span className="material-icons-outlined" style={{ marginLeft: 'auto', fontSize: '2rem', color: presencas[aluno.id] ? 'var(--color-success)' : 'var(--color-danger)' }}>
                        {presencas[aluno.id] ? 'check_circle' : 'cancel'}
                      </span>
                    </label>
                  ))}
                </div>

                <div className="form-group" style={{ marginTop: '1.5rem' }}>
                  <label>Observação (opcional)</label>
                  <textarea
                    value={observacao}
                    onChange={e => setObservacao(e.target.value)}
                    placeholder="Ex: aula de campo, atividade especial..."
                    rows={2}
                  />
                </div>

                <button type="submit" className="btn btn-submit" style={{ width: '100%', marginTop: '1rem' }} disabled={submitting}>
                  {submitting ? 'Salvando...' : 'Registrar Assiduidade'}
                </button>
              </div>
            </form>

            {data.historico.length > 0 && (
              <div className="card">
                <h2 style={{ marginBottom: '1.5rem' }}>Histórico de Registros</h2>
                {data.historico.map(reg => (
                  <div key={reg.id} style={{
                    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                    padding: '1.2rem 1.5rem', borderRadius: '0.8rem',
                    background: 'var(--bg-card)', marginBottom: '1rem', border: '1px solid rgba(0,0,0,0.06)',
                    borderLeft: '4px solid var(--color-primary)',
                  }}>
                    <div>
                      <div style={{ fontWeight: 600, fontSize: '1.5rem' }}>
                        {new Date(reg.data + 'T12:00:00').toLocaleDateString('pt-BR', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' })}
                      </div>
                      {reg.observacao && (
                        <div style={{ fontSize: '1.3rem', color: 'var(--text-secondary)', marginTop: '0.3rem' }}>{reg.observacao}</div>
                      )}
                      <div style={{ fontSize: '1.2rem', color: 'var(--text-secondary)' }}>por {reg.registrado_por}</div>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <div style={{ color: 'var(--color-success)', fontWeight: 700, fontSize: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.3rem' }}><span className="material-icons-outlined" style={{ fontSize: '1.6rem' }}>check_circle</span>{reg.presentes}</div>
                      <div style={{ color: 'var(--color-danger)', fontWeight: 700, fontSize: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.3rem' }}><span className="material-icons-outlined" style={{ fontSize: '1.6rem' }}>cancel</span>{reg.ausentes}</div>
                      <div style={{ color: 'var(--text-secondary)', fontSize: '1.2rem' }}>{reg.total} total</div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </>
        )}
      </main>
      <footer style={{ textAlign: 'center', padding: '3rem 2rem', color: 'var(--text-secondary)', fontSize: '1.4rem' }}>
        <p>&copy; 2025 Sistema CARA - Gestão Escolar Inteligente</p>
      </footer>
    </ProtectedRoute>
  );
}
