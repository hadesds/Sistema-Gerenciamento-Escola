import { apiFetch, apiUpload, getApiBaseUrl } from '@/lib/api';
import type { CarouselCategory, CarouselItem } from '@/types/carousel-types';

/** Formato bruto devolvido pela API do backend. */
export interface Aviso {
  id: number;
  categoria: CarouselCategory;
  categoria_display: string;
  titulo: string;
  slug: string;
  descricao_curta: string;
  imagem_capa_url: string | null;
  imagem_capa_alt: string;
  conteudo: string;
  publicar_em: string;
  ativo: boolean;
  ordem: number;
  autor_nome: string | null;
  criado_em: string;
  atualizado_em: string;
}

export function avisoToCarouselItem(aviso: Aviso): CarouselItem {
  return {
    id: aviso.id,
    slug: aviso.slug,
    imageUrl: aviso.imagem_capa_url ?? '',
    imageAlt: aviso.imagem_capa_alt || aviso.titulo,
    title: aviso.titulo,
    text: aviso.descricao_curta,
    content: aviso.conteudo,
    category: aviso.categoria,
    publishAt: aviso.publicar_em,
    order: aviso.ordem,
  };
}

/** Lista pública de avisos publicados — usada no carrossel da landing page. */
export async function fetchAvisosPublicos(): Promise<CarouselItem[]> {
  const res = await fetch(`${getApiBaseUrl()}/api/avisos/`, { cache: 'no-store' });
  if (!res.ok) throw new Error('Falha ao carregar o mural de novidades.');
  const avisos: Aviso[] = await res.json();
  return avisos.map(avisoToCarouselItem);
}

/** Artigo público por slug — usado na página /novidades/[slug]. */
export async function fetchAvisoPublicoPorSlug(slug: string): Promise<CarouselItem | null> {
  const res = await fetch(`${getApiBaseUrl()}/api/avisos/${encodeURIComponent(slug)}/`, { cache: 'no-store' });
  if (res.status === 404) return null;
  if (!res.ok) throw new Error('Falha ao carregar a notícia.');
  const aviso: Aviso = await res.json();
  return avisoToCarouselItem(aviso);
}

/** Lista completa (rascunhos e publicados) — só para o painel do admin. */
export function fetchAdminAvisos(): Promise<Aviso[]> {
  return apiFetch<Aviso[]>('/admin/avisos/');
}

export function fetchAdminAviso(id: number): Promise<Aviso> {
  return apiFetch<Aviso>(`/admin/avisos/${id}/`);
}

/** Cria um novo aviso (rascunho) com os campos básicos do modal. */
export function createAdminAviso(dados: {
  categoria: CarouselCategory;
  titulo: string;
  descricao_curta: string;
  imagem_capa: File;
}): Promise<Aviso> {
  const fd = new FormData();
  fd.append('categoria', dados.categoria);
  fd.append('titulo', dados.titulo);
  fd.append('descricao_curta', dados.descricao_curta);
  fd.append('imagem_capa', dados.imagem_capa);
  return apiUpload<Aviso>('/admin/avisos/', fd);
}

/** Atualiza campos de texto/HTML do aviso (categoria, título, descrição, conteúdo, publicado). */
export function updateAdminAviso(
  id: number,
  dados: Partial<{
    categoria: CarouselCategory;
    titulo: string;
    descricao_curta: string;
    imagem_capa_alt: string;
    conteudo: string;
    ativo: boolean;
  }>
): Promise<Aviso> {
  return apiFetch<Aviso>(`/admin/avisos/${id}/`, {
    method: 'PATCH',
    body: JSON.stringify(dados),
  });
}

/** Troca a imagem de capa do aviso. */
export function updateAdminAvisoCapa(id: number, imagem_capa: File): Promise<Aviso> {
  const fd = new FormData();
  fd.append('imagem_capa', imagem_capa);
  return apiUpload<Aviso>(`/admin/avisos/${id}/`, fd, 'PATCH');
}

export function deleteAdminAviso(id: number): Promise<void> {
  return apiFetch<void>(`/admin/avisos/${id}/`, { method: 'DELETE' });
}

/** Upload de imagem para inserir no meio do texto do artigo, pelo editor rico. */
export async function uploadAvisoInlineImagem(imagem: File): Promise<string> {
  const fd = new FormData();
  fd.append('imagem', imagem);
  const { url } = await apiUpload<{ url: string }>('/admin/avisos/upload-imagem/', fd);
  return url;
}
