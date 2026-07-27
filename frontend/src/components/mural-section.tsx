import { CarouselMural } from "@/components/carousel-mural";
import { mockCarouselItems } from "@/data/mock-carousel";
import { getVisibleCarouselItems } from "@/lib/carousel-lib";

/**
 * Isolado num componente próprio de propósito: quando a API estiver
 * pronta, essa função vira `async` e troca `mockCarouselItems` por um
 * `fetch(...)`. Como ela já está dentro de um <Suspense> (em app/page.tsx),
 * o skeleton aparece sozinho enquanto o fetch não resolve.
 */
export function MuralSection() {
  const items = getVisibleCarouselItems(mockCarouselItems);
  return <CarouselMural items={items} />;
}
