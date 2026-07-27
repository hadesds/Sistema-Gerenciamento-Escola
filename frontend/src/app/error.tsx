"use client";

export default function HomeError({ reset }: { error: Error; reset: () => void }) {
  return (
    <main className="mural-error-page">
      <p className="mural-error-page__title">Não conseguimos carregar o mural agora</p>
      <p className="mural-error-page__text">
        Pode ser só uma instabilidade passageira. Tenta de novo em alguns segundos.
      </p>
      <button type="button" onClick={reset} className="mural-btn mural-btn--primary">
        Tentar novamente
      </button>
    </main>
  );
}
