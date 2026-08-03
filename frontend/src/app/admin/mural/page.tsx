'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import Navbar from '@/components/Navbar';
import ProtectedRoute from '@/components/ProtectedRoute';
import Loading from '@/components/Loading';
import Alert from '@/components/Alert';
import { CATEGORY_META } from '@/lib/carousel-lib';
import type { CarouselCategory } from '@/types/carousel-types';
import { deleteAdminAviso, fetchAdminAvisos, createAdminAviso, type Aviso } from '@/lib/avisos-api';

const CATEGORIAS: CarouselCategory[] = ['matricula', 'evento', 'esporte', 'biblioteca'];

interface FormState {
  categoria: CarouselCategory;
  titulo: string;
  descricao_curta: string;
}

const FORM_INIT: FormState = { categoria: 'evento', titulo: '', descricao_curta: '' };

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' });
}

export default function AdminMuralPage() {
  const router = useRouter();
  const [avisos, setAvisos]     = useState<Aviso[] | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [form, setForm]         = useState<FormState>(FORM_INIT);
  const [capaFile, setCapaFile] = useState<File | null>(null);
  const [capaPreview, setCapaPreview] = useState<string | null>(null);
  const capaInputRef            = useRef<HTMLInputElement>(null);
  const [submitting, setSubmitting] = useState(false);
  const [alert, setAlert]       = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<number | null>(null);
  const [deletingId, setDeletingId] = useState<number | null>(null);

  function fetchData() {
    fetchAdminAvisos().then(setAvisos).catch(() => setAlert({ type: 'error', message: 'Erro ao carregar o mural.' }));
  }

  useEffect(() => { fetchData(); }, []);

  function closeModal() {
    setShowModal(false);
    setForm(FORM_INIT);
    setCapaFile(null);
    setCapaPreview(null);
    if (capaInputRef.current) capaInputRef.current.value = '';
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!capaFile) {
      setAlert({ type: 'error', message: 'Selecione uma imagem de capa.' });
      return;
    }
    setSubmitting(true);
    try {
      const aviso = await createAdminAviso({ ...form, imagem_capa: capaFile });
      closeModal();
      router.push(`/admin/mural/${aviso.id}`);
    } catch {
      setAlert({ type: 'error', message: 'Erro ao criar o aviso. Verifique os campos e tente novamente.' });
    } finally {
      setSubmitting(false);
    }
  }

  async function handleExcluir(id: number) {
    setDeletingId(id);
    try {
      await deleteAdminAviso(id);
      setAlert({ type: 'success', message: 'Aviso excluído com sucesso.' });
      fetchData();
    } catch {
      setAlert({ type: 'error', message: 'Erro ao excluir o aviso.' });
    } finally {
      setDeletingId(null);
      setConfirmDeleteId(null);
    }
  }

  return (
    <ProtectedRoute tipo="admin">
      <Navbar />
      <main className="container fade-in">
        {alert && <Alert type={alert.type} message={alert.message} onClose={() => setAlert(null)} />}

        <div className="admin-mural-header">
          <h1>Mural de Novidades</h1>
          <button className="btn btn-primary" onClick={() => setShowModal(true)}>
            <span className="material-icons-outlined">add</span>
            Novo aviso
          </button>
        </div>

        {avisos === null ? (
          <Loading />
        ) : avisos.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon"><span className="material-icons-outlined" style={{ fontSize: '5rem' }}>campaign</span></div>
            <h2>Nenhum aviso ainda</h2>
            <p>Crie o primeiro aviso para alimentar o mural da landing page.</p>
          </div>
        ) : (
          <div className="admin-mural-grid">
            {avisos.map(aviso => (
              <div key={aviso.id} className="admin-mural-card" style={{ cursor: 'pointer' }} onClick={() => router.push(`/admin/mural/${aviso.id}`)}>
                <div className="admin-mural-card__image">
                  {aviso.imagem_capa_url && (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={aviso.imagem_capa_url} alt={aviso.imagem_capa_alt} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  )}
                </div>
                <div className="admin-mural-card__body">
                  <div className="admin-mural-card__meta">
                    <span className={`admin-status ${aviso.ativo ? 'admin-status--publicado' : 'admin-status--rascunho'}`}>
                      {aviso.ativo ? 'Publicado' : 'Rascunho'}
                    </span>
                    <span className={`mural-badge ${CATEGORY_META[aviso.categoria].badgeClassName}`}>
                      {CATEGORY_META[aviso.categoria].label}
                    </span>
                  </div>
                  <h3 className="admin-mural-card__title">{aviso.titulo}</h3>
                  <p className="admin-mural-card__desc">{aviso.descricao_curta}</p>
                  <div className="admin-mural-card__footer">
                    <span style={{ fontSize: '1.3rem', color: 'var(--text-secondary)' }}>
                      {formatDate(aviso.atualizado_em)}
                    </span>
                    <button
                      type="button"
                      className="admin-mural-card__delete"
                      title="Excluir aviso"
                      onClick={(e) => { e.stopPropagation(); setConfirmDeleteId(aviso.id); }}
                    >
                      <span className="material-icons-outlined">delete_outline</span>
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      {/* ── Modal: novo aviso ── */}
      {showModal && (
        <div className="modal-overlay" onClick={closeModal}>
          <div className="modal-box" onClick={e => e.stopPropagation()}>
            <h3>Novo aviso</h3>
            <p style={{ color: 'var(--text-secondary)', fontSize: '1.4rem', marginBottom: '1.6rem' }}>
              Crie o card do mural. Depois de salvar, você escreve o texto completo da notícia.
            </p>
            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label>Categoria</label>
                <select value={form.categoria} onChange={e => setForm(f => ({ ...f, categoria: e.target.value as CarouselCategory }))}>
                  {CATEGORIAS.map(cat => (
                    <option key={cat} value={cat}>{CATEGORY_META[cat].label}</option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label>Título</label>
                <input
                  type="text"
                  value={form.titulo}
                  onChange={e => setForm(f => ({ ...f, titulo: e.target.value }))}
                  placeholder="Ex.: Matrículas abertas para 2027"
                  required
                />
              </div>

              <div className="form-group">
                <label>Descrição rápida</label>
                <textarea
                  value={form.descricao_curta}
                  onChange={e => setForm(f => ({ ...f, descricao_curta: e.target.value }))}
                  placeholder="Texto curto exibido no card do carrossel…"
                  rows={3}
                  required
                />
              </div>

              <div className="form-group">
                <label>Imagem de capa</label>
                <input
                  ref={capaInputRef}
                  type="file"
                  accept="image/*"
                  onChange={e => {
                    const file = e.target.files?.[0] ?? null;
                    setCapaFile(file);
                    setCapaPreview(file ? URL.createObjectURL(file) : null);
                  }}
                  required
                />
                {capaPreview && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={capaPreview} alt="Prévia da capa"
                    style={{ marginTop: '0.8rem', maxWidth: '100%', maxHeight: '18rem', borderRadius: '1rem', objectFit: 'contain', border: '2px solid var(--border-light)', display: 'block' }}
                  />
                )}
              </div>

              <div className="modal-actions">
                <button type="button" className="btn btn-secondary" onClick={closeModal}>Cancelar</button>
                <button type="submit" className="btn btn-primary" disabled={submitting}>
                  {submitting ? 'Criando…' : 'Criar e continuar'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── Confirmar exclusão ── */}
      {confirmDeleteId !== null && (
        <div className="modal-overlay" onClick={() => setConfirmDeleteId(null)}>
          <div className="modal-box" style={{ textAlign: 'center', maxWidth: '44rem' }} onClick={e => e.stopPropagation()}>
            <span className="material-icons-outlined" style={{ fontSize: '4rem', color: '#e74c3c' }}>warning</span>
            <h3>Excluir aviso?</h3>
            <p style={{ color: 'var(--text-secondary)', marginBottom: '2rem' }}>Esta ação é irreversível.</p>
            <div className="modal-actions" style={{ justifyContent: 'center' }}>
              <button className="btn btn-secondary" onClick={() => setConfirmDeleteId(null)}>Cancelar</button>
              <button
                className="btn"
                onClick={() => handleExcluir(confirmDeleteId)}
                disabled={deletingId === confirmDeleteId}
                style={{ background: '#e74c3c', color: 'white' }}
              >
                {deletingId === confirmDeleteId ? 'Excluindo…' : 'Sim, excluir'}
              </button>
            </div>
          </div>
        </div>
      )}
    </ProtectedRoute>
  );
}
