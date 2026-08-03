export type CarouselCategory = "matricula" | "evento" | "esporte" | "biblioteca";

export interface CarouselItem {
  id: number;
  /** Usado na URL do artigo: /novidades/[slug] */
  slug: string;
  imageUrl: string;
  imageAlt: string;
  title: string;
  /** Texto curto exibido no card do carrossel */
  text: string;
  /**
   * Corpo completo do artigo, em HTML gerado pelo editor rico do admin
   * (pode conter imagens embutidas em qualquer ponto do texto).
   */
  content: string;
  category: CarouselCategory;
  /**
   * Data/hora ISO de publicação. Se estiver no futuro, o item fica
   * agendado: não aparece no carrossel nem é acessível pela URL ainda.
   */
  publishAt: string;
  /** Ordem manual definida pelo admin. */
  order: number;
}
