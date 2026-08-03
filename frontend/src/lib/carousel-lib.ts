import type { CarouselCategory, CarouselItem } from "@/types/carousel-types";

type CategoryMeta = { label: string; badgeClassName: string };
type CategoryMetaMap = Record<CarouselCategory, CategoryMeta>;

export const CATEGORY_META: CategoryMetaMap = {
  matricula: { label: "Matrícula", badgeClassName: "mural-badge--matricula" },
  evento: { label: "Evento", badgeClassName: "mural-badge--evento" },
  esporte: { label: "Esporte", badgeClassName: "mural-badge--esporte" },
  biblioteca: { label: "Biblioteca", badgeClassName: "mural-badge--biblioteca" },
};

export function isPublished(item: Pick<CarouselItem, "publishAt">, now = new Date()): boolean {
  return new Date(item.publishAt).getTime() <= now.getTime();
}

export function getVisibleCarouselItems(items: CarouselItem[], now = new Date()): CarouselItem[] {
  return items
    .filter((item) => isPublished(item, now))
    .sort((a, b) => a.order - b.order);
}

/** Embaralha uma lista sem alterar o array original (Fisher-Yates). */
function shuffle<T>(list: T[]): T[] {
  const result = [...list];
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}

/** N itens aleatórios (sem repetir), pra seções tipo "Outras novidades". */
export function getRandomItems(items: CarouselItem[], count: number): CarouselItem[] {
  return shuffle(items).slice(0, count);
}
