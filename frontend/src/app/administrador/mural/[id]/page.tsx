'use client';

import { useEffect, useRef, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import Navbar from '@/components/Navbar';
import ProtectedRoute from '@/components/ProtectedRoute';
import Loading from '@/components/Loading';
import Alert from '@/components/Alert';
import RichTextEditor from '@/components/RichTextEditor';
import { CATEGORY_META } from '@/lib/carousel-lib';
import type { CarouselCategory } from '@/types/carousel-types';
import {
  deleteAdminAviso, fetchAdminAviso, updateAdminAviso, updateAdminAvisoCapa, type Aviso,
} from '@/lib/avisos-api';

const CATEGORIAS: CarouselCategory[] = ['matricula', 'evento', 'esporte', 'biblioteca'];

export default function AdminAvisoEditorPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const id = Number(params.id);

  const [aviso, setAviso]       = useState<Aviso | null>(null);
  const [categoria, setCategoria] = useState<CarouselCategory>('evento');
  const [titulo, setTitulo]     = useState('');
  const [descricaoCurta, setDescricaoCurta] = useState('');
  const [conteudo, setConteudo] = useState('');
  const [alert, setAlert]       = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [saving, setSaving]     = useState(false);
  const [publishing, setPublishing] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const capaInputRef            = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!id) return;
    fetchAdminAviso(id)
      .then(a => {
        setAviso(a);
        setCategoria(a.categoria);
        setTitulo(a.titulo);
        setDescricaoCurta(a.descricao_curta);
        setConteudo(a.conteudo);
      })
      .catch(() => setAlert({ type: 'error', message: 'Aviso não encontrado.' }));
  }, [id]);

  async function handleSalvar() {
    setSaving(true);
    try {
      const atualizado = await updateAdminAviso(id, { categoria, titulo, descricao_curta: descricaoCurta, conteudo });
      setAviso(atualizado);
      setAlert({ type: 'success', message: 'Alterações salvas.' });
    } catch {
      setAlert({ type: 'error', message: 'Erro ao salvar. Tente novamente.' });
    } finally {
      setSaving(false);
    }
  }

  async function handleTogglePublicar() {
    if (!aviso) return;
    setPublishing(true);
    try {
      const atualizado = await updateAdminAviso(id, { ativo: !aviso.ativo });
      setAviso(atualizado);
      setAlert({ type: 'success', message: atualizado.ativo ? 'Aviso publicado no mural!' : 'Aviso despublicado.' });
    } catch {
      setAlert({ type: 'error', message: 'Erro ao atualizar a publicação.' });
    } finally {
      setPublishing(false);
    }
  }

  async function handleTrocarCapa(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    try {
      const atualizado = await updateAdminAvisoCapa(id, file);
      setAviso(atualizado);
      setAlert({ type: 'success', message: 'Imagem de capa atualizada.' });
    } catch {
      setAlert({ type: 'error', message: 'Erro ao trocar a imagem de capa.' });
    }
  }

  async function handleExcluir() {
    setDeleting(true);
    try {
      await deleteAdminAviso(id);
      router.push('/administrador/mural');
    } catch {
      setAlert({ type: 'error', message: 'Erro ao excluir o aviso.' });
      setDeleting(false);
    }
  }

  return (
    <ProtectedRoute tipo="admin">
      <Navbar />
      <main className="container fade-in">
        {alert && <Alert type={alert.type} message={alert.message} onClose={() => setAlert(null)} />}

        <Link href="/administrador/mural" className="admin-editor-back">
          <span className="material-icons-outlined" style={{ fontSize: '1.8rem' }}>arrow_back</span>
          Voltar para o mural
        </Link>

        {!aviso ? (
          <Loading />
        ) : (
          <>
            <div className="admin-editor-header">
              <div>
                <span className={`admin-status ${aviso.ativo ? 'admin-status--publicado' : 'admin-status--rascunho'}`}>
                  {aviso.ativo ? 'Publicado' : 'Rascunho'}
                </span>
              </div>
              <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
                <button type="button" className="btn" style={{ background: '#e74c3c', color: '#fff' }} onClick={() => setConfirmDelete(true)}>
                  <span className="material-icons-outlined">delete_outline</span>
                  Excluir
                </button>
                <button type="button" className="btn btn-secondary" onClick={handleTogglePublicar} disabled={publishing}>
                  <span className="material-icons-outlined">{aviso.ativo ? 'visibility_off' : 'publish'}</span>
                  {publishing ? 'Aguarde…' : aviso.ativo ? 'Despublicar' : 'Publicar'}
                </button>
                <button type="button" className="btn btn-primary" onClick={handleSalvar} disabled={saving}>
                  <span className="material-icons-outlined">save</span>
                  {saving ? 'Salvando…' : 'Salvar'}
                </button>
              </div>
            </div>

            <div className="admin-editor-capa" onClick={() => capaInputRef.current?.click()}>
              {aviso.imagem_capa_url && (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={aviso.imagem_capa_url} alt={aviso.imagem_capa_alt} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              )}
              <div className="admin-editor-capa-overlay">
                <span className="material-icons-outlined">photo_camera</span>
                Trocar imagem de capa
              </div>
            </div>
            <input ref={capaInputRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={handleTrocarCapa} />

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.6rem' }}>
              <div className="form-group" style={{ margin: 0 }}>
                <label>Categoria</label>
                <select value={categoria} onChange={e => setCategoria(e.target.value as CarouselCategory)}>
                  {CATEGORIAS.map(cat => (
                    <option key={cat} value={cat}>{CATEGORY_META[cat].label}</option>
                  ))}
                </select>
              </div>
              <div className="form-group" style={{ margin: 0 }}>
                <label>Título</label>
                <input type="text" value={titulo} onChange={e => setTitulo(e.target.value)} required />
              </div>
            </div>

            <div className="form-group">
              <label>Descrição rápida (aparece no card do carrossel)</label>
              <textarea value={descricaoCurta} onChange={e => setDescricaoCurta(e.target.value)} rows={2} required />
            </div>

            <div className="form-group">
              <label>Texto da notícia</label>
              <RichTextEditor value={conteudo} onChange={setConteudo} />
            </div>

            <button type="button" className="btn btn-primary" onClick={handleSalvar} disabled={saving}>
              <span className="material-icons-outlined">save</span>
              {saving ? 'Salvando…' : 'Salvar alterações'}
            </button>
          </>
        )}
      </main>

      {confirmDelete && (
        <div className="modal-overlay" onClick={() => setConfirmDelete(false)}>
          <div className="modal-box" style={{ textAlign: 'center', maxWidth: '44rem' }} onClick={e => e.stopPropagation()}>
            <span className="material-icons-outlined" style={{ fontSize: '4rem', color: '#e74c3c' }}>warning</span>
            <h3>Excluir este aviso?</h3>
            <p style={{ color: 'var(--text-secondary)', marginBottom: '2rem' }}>Esta ação é irreversível.</p>
            <div className="modal-actions" style={{ justifyContent: 'center' }}>
              <button className="btn btn-secondary" onClick={() => setConfirmDelete(false)}>Cancelar</button>
              <button className="btn" onClick={handleExcluir} disabled={deleting} style={{ background: '#e74c3c', color: 'white' }}>
                {deleting ? 'Excluindo…' : 'Sim, excluir'}
              </button>
            </div>
          </div>
        </div>
      )}
    </ProtectedRoute>
  );
}
