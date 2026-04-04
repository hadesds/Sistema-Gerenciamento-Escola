'use client';

import { useEffect, useState } from 'react';
import { apiFetch } from '@/lib/api';
import Navbar from '@/components/Navbar';
import ProtectedRoute from '@/components/ProtectedRoute';
import Loading from '@/components/Loading';
import Alert from '@/components/Alert';

interface Questao {
  id: number;
  enunciado: string;
  resposta: string;
  materia: string;
  data_criacao: string;
}

interface BancoData {
  questoes: Questao[];
  materias: string[];
  materia_filtro: string;
}

export default function BancoQuestoesPage() {
  const [data, setData] = useState<BancoData | null>(null);
  const [loading, setLoading] = useState(true);
  const [materiaFiltro, setMateriaFiltro] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ enunciado: '', resposta: '', materia: '' });
  const [alert, setAlert] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [submitting, setSubmitting] = useState(false);

  function fetchData(materia = '') {
    setLoading(true);
    apiFetch<BancoData>(`/professor/banco-questoes/?materia=${encodeURIComponent(materia)}`)
      .then(setData)
      .finally(() => setLoading(false));
  }

  useEffect(() => { fetchData(); }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    try {
      await apiFetch('/professor/banco-questoes/', {
        method: 'POST',
        body: JSON.stringify(form),
      });
      setAlert({ type: 'success', message: 'Questão cadastrada com sucesso!' });
      setForm({ enunciado: '', resposta: '', materia: '' });
      setShowForm(false);
      fetchData(materiaFiltro);
    } catch {
      setAlert({ type: 'error', message: 'Erro ao cadastrar questão.' });
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <ProtectedRoute tipo="professor">
      <Navbar />
      <main className="container fade-in">
        {alert && <Alert type={alert.type} message={alert.message} onClose={() => setAlert(null)} />}

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
          <h1>Banco de Questões</h1>
          <button className="btn btn-primary" onClick={() => setShowForm(!showForm)}>
            <span className="material-icons-outlined">{showForm ? 'close' : 'add'}</span>
            {showForm ? 'Cancelar' : 'Nova Questão'}
          </button>
        </div>

        {/* Formulário de nova questão */}
        {showForm && (
          <div className="card mb-2">
            <h2>Nova Questão</h2>
            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label>Matéria</label>
                <input
                  type="text"
                  value={form.materia}
                  onChange={e => setForm(f => ({ ...f, materia: e.target.value }))}
                  placeholder="Ex: Matemática, Português..."
                  required
                />
              </div>
              <div className="form-group">
                <label>Enunciado</label>
                <textarea
                  value={form.enunciado}
                  onChange={e => setForm(f => ({ ...f, enunciado: e.target.value }))}
                  placeholder="Digite o enunciado da questão..."
                  rows={4}
                  required
                />
              </div>
              <div className="form-group">
                <label>Resposta</label>
                <textarea
                  value={form.resposta}
                  onChange={e => setForm(f => ({ ...f, resposta: e.target.value }))}
                  placeholder="Digite a resposta..."
                  rows={3}
                  required
                />
              </div>
              <button type="submit" className="btn btn-submit" disabled={submitting}>
                {submitting ? 'Salvando...' : 'Salvar Questão'}
              </button>
            </form>
          </div>
        )}

        {/* Filtro por matéria */}
        <div className="card mb-2">
          <div style={{ display: 'flex', gap: '1rem', alignItems: 'center', flexWrap: 'wrap' }}>
            <strong style={{ fontSize: '1.5rem' }}>Filtrar por matéria:</strong>
            <button
              className={`btn ${materiaFiltro === '' ? 'btn-primary' : 'btn-secondary'}`}
              onClick={() => { setMateriaFiltro(''); fetchData(''); }}
            >
              Todas
            </button>
            {data?.materias.map(m => (
              <button
                key={m}
                className={`btn ${materiaFiltro === m ? 'btn-primary' : 'btn-secondary'}`}
                onClick={() => { setMateriaFiltro(m); fetchData(m); }}
              >
                {m}
              </button>
            ))}
          </div>
        </div>

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
              <div key={q.id} className="card">
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem' }}>
                  <span className="badge">{q.materia}</span>
                  <span style={{ fontSize: '1.3rem', color: 'var(--text-secondary)' }}>
                    #{idx + 1} · {new Date(q.data_criacao).toLocaleDateString('pt-BR')}
                  </span>
                </div>
                <h3 style={{ marginBottom: '1rem' }}>Enunciado</h3>
                <p style={{ marginBottom: '1.5rem', whiteSpace: 'pre-wrap' }}>{q.enunciado}</p>
                <details>
                  <summary style={{ cursor: 'pointer', fontWeight: 600, fontSize: '1.5rem', color: 'var(--color-add-button)' }}>
                    Ver Resposta
                  </summary>
                  <p style={{ marginTop: '1rem', padding: '1rem', background: 'var(--bg-card-add)', borderRadius: '1rem', whiteSpace: 'pre-wrap' }}>
                    {q.resposta}
                  </p>
                </details>
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
