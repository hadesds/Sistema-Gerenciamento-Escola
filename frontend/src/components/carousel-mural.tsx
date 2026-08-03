"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import type { CarouselItem } from "@/types/carousel-types";
import { CATEGORY_META } from "@/lib/carousel-lib";

interface CarouselMuralProps {
  items: CarouselItem[];
  /** Troca de slide automática, em ms. Passe 0 para desativar. */
  autoplayInterval?: number;
}

// Rotação alternada para cada cartão parecer "pinado" à mão, não perfeitamente alinhado
const TILTS = [-2.5, 1.5, -1, 2];

// Distância mínima de arrasto (em px) pra contar como um swipe de verdade
const SWIPE_THRESHOLD = 50;

export function CarouselMural({ items, autoplayInterval = 6000 }: CarouselMuralProps) {
  const [index, setIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const touchStartX = useRef<number | null>(null);

  const goTo = useCallback(
    (i: number) => setIndex(((i % items.length) + items.length) % items.length),
    [items.length]
  );
  const next = useCallback(() => goTo(index + 1), [goTo, index]);
  const prev = useCallback(() => goTo(index - 1), [goTo, index]);

  useEffect(() => {
    if (!autoplayInterval || isPaused || items.length <= 1) return;
    timerRef.current = setInterval(next, autoplayInterval);
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [autoplayInterval, isPaused, next, items.length]);

  function handleTouchStart(e: React.TouchEvent) {
    touchStartX.current = e.touches[0].clientX;
    setIsPaused(true);
  }

  function handleTouchEnd(e: React.TouchEvent) {
    if (touchStartX.current === null) return;
    const deltaX = e.changedTouches[0].clientX - touchStartX.current;

    if (deltaX > SWIPE_THRESHOLD) {
      prev();
    } else if (deltaX < -SWIPE_THRESHOLD) {
      next();
    }

    touchStartX.current = null;
    setIsPaused(false);
  }

  if (items.length === 0) {
    return (
      <div className="mural-empty">
        <PinIcon className="mural-empty__icon" />
        <p className="mural-empty__title">Nenhum aviso no mural ainda</p>
        <p className="mural-empty__text">
          Assim que a escola publicar uma novidade, ela aparece bem aqui.
        </p>
      </div>
    );
  }

  return (
    <div
      role="region"
      aria-roledescription="carrossel"
      aria-label="Mural de novidades da escola"
      className="mural-carousel"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
      onFocus={() => setIsPaused(true)}
      onBlur={() => setIsPaused(false)}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
    >
      {/* Textura sutil de cortiça */}
      <div className="mural-carousel__texture" aria-hidden />

      <div className="mural-carousel__viewport">
        <div
          className="mural-carousel__track"
          style={{ transform: `translateX(-${index * 100}%)` }}
        >
          {items.map((item, i) => (
            <div
              key={item.id}
              className={`mural-carousel__slide ${
                i === index ? "" : "mural-carousel__slide--inactive"
              }`}
              aria-hidden={i !== index}
            >
              <MuralCard
                item={item}
                tilt={TILTS[i % TILTS.length]}
                priority={i === 0}
                tabIndex={i === index ? 0 : -1}
              />
            </div>
          ))}
        </div>
      </div>

      {/* Setas */}
      {items.length > 1 && (
        <>
          <button
            type="button"
            onClick={prev}
            aria-label="Aviso anterior"
            className="mural-carousel__arrow mural-carousel__arrow--prev"
          >
            <ArrowIcon direction="left" />
          </button>
          <button
            type="button"
            onClick={next}
            aria-label="Próximo aviso"
            className="mural-carousel__arrow mural-carousel__arrow--next"
          >
            <ArrowIcon direction="right" />
          </button>
        </>
      )}

      {/* Indicadores (pinos) */}
      {items.length > 1 && (
        <div className="mural-carousel__dots">
          {items.map((item, i) => (
            <button
              key={item.id}
              type="button"
              onClick={() => goTo(i)}
              aria-label={`Ir para: ${item.title}`}
              aria-current={i === index}
              className={`mural-carousel__dot ${
                i === index ? "mural-carousel__dot--active" : ""
              }`}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function MuralCard({
  item,
  tilt,
  priority = false,
  tabIndex,
}: {
  item: CarouselItem;
  tilt: number;
  priority?: boolean;
  tabIndex?: number;
}) {
  return (
    <Link
      href={`/novidades/${item.slug}`}
      className="mural-card"
      style={{ transform: `rotate(${tilt}deg)` }}
      tabIndex={tabIndex}
    >
      {/* Fita adesiva */}
      <span className="mural-card__tape" aria-hidden />

      <div className="mural-card__image-wrapper">
        <Image
          src={item.imageUrl}
          alt={item.imageAlt}
          fill
          sizes="(max-width: 768px) 100vw, 500px"
          draggable={false}
          priority={priority}
        />
      </div>

      <div className="mural-card__body">
        <span className={`mural-badge ${CATEGORY_META[item.category].badgeClassName}`}>
          {CATEGORY_META[item.category].label}
        </span>
        <h3 className="mural-card__title">{item.title}</h3>
        <p className="mural-card__text">{item.text}</p>
        <span className="mural-card__link">
          Saiba mais <ArrowIcon direction="right" style={{ width: "1.4rem", height: "1.4rem" }} />
        </span>
      </div>
    </Link>
  );
}

function ArrowIcon({
  direction,
  style,
}: {
  direction: "left" | "right";
  style?: React.CSSProperties;
}) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2.5}
      strokeLinecap="round"
      strokeLinejoin="round"
      style={{ width: "1.6rem", height: "1.6rem", ...style }}
      aria-hidden
    >
      {direction === "left" ? <path d="M15 18l-6-6 6-6" /> : <path d="M9 18l6-6-6-6" />}
    </svg>
  );
}

function PinIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.75}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden
    >
      <path d="M12 2a5 5 0 0 0-5 5c0 3 2 4.5 3 7l-4 1 1 1h10l1-1-4-1c1-2.5 3-4 3-7a5 5 0 0 0-5-5Z" />
      <path d="M12 15v7" />
    </svg>
  );
}
