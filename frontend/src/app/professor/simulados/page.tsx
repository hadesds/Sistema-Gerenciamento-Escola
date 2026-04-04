'use client';

import { useEffect, useState } from 'react';
import { apiFetch } from '@/lib/api';
import Link from 'next/link';
import Navbar from '@/components/Navbar';
import ProtectedRoute from '@/components/ProtectedRoute';
import Loading from '@/components/Loading';

interface Simulado {
  id: number;
  turma_nome: string;
  autor_nome: string;
  data_criacao: string;
  total_questoes: number;
}

export default function ListaSimuladosPage() {
  const [simulados, setSimulados] = useState<Simulado[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    apiFetch<Simulado[]>('/professor/simulados/')
      .then(setSimulados)
      .finally(() => setLoading(false));
  }, []);

  return (
    <ProtectedRoute tipo="professor">
      <Navbar />
      <main className="container fade-in">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
          <h1>Meus Simulados</h1>
          <Link href="/professor/criar-simulado" className="btn btn-primary">
            <span className="material-icons-outlined">add</span>
            Criar Novo
          </Link>
        </div>

        {loading ? <Loading /> : simulados.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">📝</div>
            <h2>Nenhum simulado criado</h2>
            <p>Crie seu primeiro simulado a partir do banco de questões.</p>
            <Link href="/professor/criar-simulado" className="btn btn-primary mt-2">
              Criar Simulado
            </Link>
          </div>
        ) : (
          <div className="turmas-grid">
            {simulados.map(s => (
              <div key={s.id} className="card">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem' }}>
                  <h2 style={{ marginBottom: 0 }}>Simulado #{s.id}</h2>
                  <span className="badge">{s.total_questoes} questões</span>
                </div>
                <p><strong>Turma:</strong> {s.turma_nome}</p>
                <p><strong>Criado em:</strong> {new Date(s.data_criacao).toLocaleDateString('pt-BR')}</p>
              </div>
            ))}
          </div>
        )}
      </main>
      <footer style={{ textAlign: 'center', padding: '3rem 2rem', color: 'var(--text-secondary)', fontSize: '1.4rem' }}>
        <p>&copy; 2025 Sistema CARA - Gestão Escolar Inteligente</p>
      </footer>
    </ProtectedRoute>
  );
}
