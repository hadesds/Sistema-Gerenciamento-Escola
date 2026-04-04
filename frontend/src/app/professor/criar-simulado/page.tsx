'use client';

import { useEffect, useState } from 'react';
import { apiFetch } from '@/lib/api';
import { useRouter } from 'next/navigation';
import Navbar from '@/components/Navbar';
import ProtectedRoute from '@/components/ProtectedRoute';
import Loading from '@/components/Loading';
import Alert from '@/components/Alert';

interface Questao {
  id: number;
  enunciado: string;
  materia: string;
}

interface Turma {
  id: number;
  nome: string;
}

interface SimuladoData {
  questoes: Questao[];
  turmas: Turma[];
}

export default function CriarSimuladoPage() {
  const router = useRouter();
  const [data, setData] = useState<SimuladoData | null>(null);
  const [loading, setLoading] = useState(true);
  const [turmaId, setTurmaId] = useState('');
  const [questoesSelecionadas, setQuestoesSelecionadas] = useState<number[]>([]);
  const [materiaFiltro, setMateriaFiltro] = useState('');
  const [alert, setAlert] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    apiFetch<SimuladoData>('/professor/criar-simulado/data/')
      .then(setData)
      .finally(() => setLoading(false));
  }, []);

  function toggleQuestao(id: number) {
    setQuestoesSelecionadas(prev =>
      prev.includes(id) ? prev.filter(q => q !== id) : [...prev, id]
    );
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!turmaId || questoesSelecionadas.length === 0) {
      setAlert({ type: 'error', message: 'Selecione uma turma e pelo menos uma questão.' });
      return;
    }
    setSubmitting(true);
    try {
      await apiFetch('/professor/criar-simulado/', {
        method: 'POST',
        body: JSON.stringify({ turma: turmaId, questoes: questoesSelecionadas }),
      });
      setAlert({ type: 'success', message: 'Simulado criado com sucesso!' });
      setTimeout(() => router.push('/professor/simulados'), 1500);
    } catch {
      setAlert({ type: 'error', message: 'Erro ao criar simulado.' });
    } finally {
      setSubmitting(false);
    }
  }

  const materias = data ? [...new Set(data.questoes.map(q => q.materia))] : [];
  const questoesFiltradas = data
    ? (materiaFiltro ? data.questoes.filter(q => q.materia === materiaFiltro) : data.questoes)
    : [];

  return (
    <ProtectedRoute tipo="professor">
      <Navbar />
      <main className="container fade-in">
        {alert && <Alert type={alert.type} message={alert.message} onClose={() => setAlert(null)} />}

        <h1>Criar Simulado</h1>

        {loading ? <Loading /> : !data ? null : (
          <form onSubmit={handleSubmit}>
            <div className="card mb-2">
              <h2>1. Selecionar Turma</h2>
              <div className="form-group">
                <label>Turma alvo</label>
                <select value={turmaId} onChange={e => setTurmaId(e.target.value)} required>
                  <option value="">Selecione uma turma...</option>
                  {data.turmas.map(t => (
                    <option key={t.id} value={t.id}>{t.nome}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="card mb-2">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                <h2>2. Selecionar Questões</h2>
                <span className="badge">{questoesSelecionadas.length} selecionada(s)</span>
              </div>

              <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', marginBottom: '1.5rem' }}>
                <button
                  type="button"
                  className={`btn ${materiaFiltro === '' ? 'btn-primary' : 'btn-secondary'}`}
                  onClick={() => setMateriaFiltro('')}
                >
                  Todas
                </button>
                {materias.map(m => (
                  <button
                    key={m}
                    type="button"
                    className={`btn ${materiaFiltro === m ? 'btn-primary' : 'btn-secondary'}`}
                    onClick={() => setMateriaFiltro(m)}
                  >
                    {m}
                  </button>
                ))}
              </div>

              {questoesFiltradas.length === 0 ? (
                <p>Nenhuma questão disponível. Adicione questões no banco de questões primeiro.</p>
              ) : (
                questoesFiltradas.map((q) => (
                  <label
                    key={q.id}
                    style={{
                      display: 'flex',
                      gap: '1.5rem',
                      alignItems: 'flex-start',
                      padding: '1.5rem',
                      borderRadius: '1rem',
                      cursor: 'pointer',
                      background: questoesSelecionadas.includes(q.id) ? 'var(--bg-card-add)' : 'transparent',
                      border: `2px solid ${questoesSelecionadas.includes(q.id) ? 'var(--color-add-button)' : 'transparent'}`,
                      marginBottom: '1rem',
                      transition: 'all 0.2s',
                    }}
                  >
                    <input
                      type="checkbox"
                      checked={questoesSelecionadas.includes(q.id)}
                      onChange={() => toggleQuestao(q.id)}
                      style={{ width: '2rem', height: '2rem', marginTop: '0.2rem', flexShrink: 0 }}
                    />
                    <div>
                      <span className="badge" style={{ marginBottom: '0.5rem', display: 'inline-block' }}>{q.materia}</span>
                      <p style={{ margin: 0, fontSize: '1.5rem', color: 'var(--text-primary)' }}>{q.enunciado}</p>
                    </div>
                  </label>
                ))
              )}
            </div>

            <button type="submit" className="btn btn-submit" style={{ width: '100%' }} disabled={submitting}>
              {submitting ? 'Criando...' : 'Criar Simulado'}
            </button>
          </form>
        )}
      </main>
      <footer style={{ textAlign: 'center', padding: '3rem 2rem', color: 'var(--text-secondary)', fontSize: '1.4rem' }}>
        <p>&copy; 2025 Sistema CARA - Gestão Escolar Inteligente</p>
      </footer>
    </ProtectedRoute>
  );
}
