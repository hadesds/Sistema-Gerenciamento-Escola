export function Hero() {
  return (
    <section className="mural-hero">
      <div className="mural-hero__inner">
        <p className="mural-hero__eyebrow">Escola • São Luís, MA</p>
        <h1 className="mural-hero__title">
          Um lugar onde cada aluno encontra o seu jeito de aprender
        </h1>
        <p className="mural-hero__subtitle">
          Educação infantil ao ensino médio, com projetos que preparam para a vida — não só para
          a prova.
        </p>
        <div className="mural-hero__actions">
          <a href="/matriculas" className="mural-btn mural-btn--primary">
            Fazer matrícula
          </a>
          <a href="#mural" className="mural-btn mural-btn--outline">
            Ver novidades
          </a>
        </div>
      </div>
    </section>
  );
}
