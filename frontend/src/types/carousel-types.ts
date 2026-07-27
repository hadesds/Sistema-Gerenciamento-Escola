export type CarouselCategory = "matricula" | "evento" | "esporte" | "biblioteca";

export interface CarouselItem {
  id: string;
  /** Usado na URL do artigo: /novidades/[slug] */
  slug: string;
  imageUrl: string;
  imageAlt: string;
  title: string;
  /** Texto curto exibido no card do carrossel */
  text: string;
  /**
   * Corpo completo do artigo, escrito pelo admin. Cada string do array
   * vira um parágrafo.
   */
  content: string[];
  category: CarouselCategory;
  /**
   * Data/hora ISO de publicação. Se estiver no futuro, o item fica
   * agendado: não aparece no carrossel nem é acessível pela URL ainda.
   */
  publishAt: string;
  /** Controlado pelo admin depois; por enquanto só ordena o mock */
  order: number;
}
