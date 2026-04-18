import Link from "next/link";

export default function Hero() {
  return (
    <section id="hero"
      className="mt-[6.8rem] min-h-[calc(100vh-6.8rem)] grid grid-cols-1 md:grid-cols-2 items-center gap-12 md:gap-16 px-[5%] py-16 md:py-20 bg-gradient-to-br from-[#fffdf5] via-[#fff8e1] to-[#fafaf7] relative overflow-hidden">

      {/* Círculo decorativo */}
      <div className="absolute w-[60rem] h-[60rem] rounded-full bg-[radial-gradient(circle,rgba(245,166,35,0.08)_0%,transparent_70%)] -right-40 -top-40 pointer-events-none" />

      {/* Conteúdo */}
      <div className="fade-in flex flex-col items-center md:items-start text-center md:text-left md:pl-16 self-center">

        {/* Badge */}
        <div className="inline-flex items-center gap-2 bg-primary-light text-primary-dark px-4 py-[0.4rem] rounded-full font-bold text-[1.2rem] mb-6 border border-[rgba(245,166,35,0.3)]">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z"/>
          </svg>
          Portal Escolar 2025
        </div>

        <h1 className="font-sora text-[clamp(2.4rem,6vw,3.2rem)] font-bold leading-tight text-dark mb-5">
          Seu aprendizado<br />
          em um só <em className="not-italic text-primary">lugar</em>
        </h1>

        <p className="text-[1.5rem] md:text-[1.6rem] text-gray-muted leading-relaxed mb-8 max-w-[50rem]">
          Acesse suas notas, acompanhe atividades, veja o calendário escolar e
          fique por dentro de tudo — do fundamental ao médio.
        </p>

        {/* Botões */}
        <div className="flex flex-col sm:flex-row gap-4 w-full sm:w-auto">
          <Link href="#login"
            className="inline-flex items-center justify-center gap-3 bg-primary text-white px-8 py-5 rounded-full font-extrabold text-[1.4rem] shadow-[0_0.6rem_2rem_rgba(245,166,35,0.4)] transition-all hover:bg-primary-dark hover:-translate-y-1">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <path d="M5 12h14M12 5l7 7-7 7"/>
            </svg>
            Acessar minha conta
          </Link>
          <Link href="#funcionalidades"
            className="inline-flex items-center justify-center gap-3 bg-transparent text-dark px-8 py-5 rounded-full font-bold text-[1.4rem] border-2 border-gray-border transition-all hover:border-primary hover:text-primary">
            Ver funcionalidades
          </Link>
        </div>

        {/* Stats */}
        <div className="flex gap-8 mt-10 flex-wrap justify-center md:justify-start">
          {[
            { number: "500+", label: "Alunos" },
            { number: "40+",  label: "Professores" },
            { number: "18",   label: "Turmas" },
          ].map((s) => (
            <div key={s.label} className="text-center md:text-left">
              <span className="block font-sora text-[2.8rem] font-bold text-primary">{s.number}</span>
              <span className="text-[1.1rem] text-gray-muted font-semibold uppercase tracking-wider">{s.label}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Card visual — só desktop */}
      <div className="hidden md:flex relative justify-center items-center">
        <div className="relative w-[34rem] h-[42rem]">
          <div className="absolute w-[26rem] left-12 top-16 z-[1] bg-[#fff3cd] rounded-[2rem] p-6 shadow-md border border-gray-border rotate-[4deg]" />
          <div className="absolute w-[28rem] left-4 top-20 z-[2] bg-[#fff8e1] rounded-[2rem] p-6 shadow-md border border-gray-border -rotate-[3deg]" />

          {/* Card principal */}
          <div className="absolute w-[30rem] left-8 top-28 z-[3] bg-white rounded-[2rem] p-6 shadow-md border border-gray-border animate-float">
            <div className="flex items-center gap-4 mb-4 pb-4 border-b border-gray-border">
              <div className="w-[4rem] h-[4rem] rounded-full bg-gradient-to-br from-primary to-secondary flex items-center justify-center text-white font-extrabold text-[1.2rem]">
                JS
              </div>
              <div>
                <div className="font-bold text-[1.3rem]">João Silva</div>
                <div className="text-[1.1rem] text-gray-muted">9º Ano A — 2025</div>
              </div>
            </div>
            {[
              { subject: "Matemática", grade: "9.5", cls: "bg-[#dcfce7] text-[#16a34a]" },
              { subject: "Português",  grade: "8.2", cls: "bg-[#dbeafe] text-[#2563eb]" },
              { subject: "Ciências",   grade: "7.8", cls: "bg-primary-light text-primary-dark" },
              { subject: "História",   grade: "9.0", cls: "bg-[#dcfce7] text-[#16a34a]" },
              { subject: "Geografia",  grade: "8.5", cls: "bg-[#dbeafe] text-[#2563eb]" },
            ].map((row, i, arr) => (
              <div key={row.subject}
                className={`flex justify-between items-center py-2 text-[1.3rem] ${i < arr.length - 1 ? "border-b border-gray-border" : ""}`}>
                <span className="text-gray-muted font-semibold">{row.subject}</span>
                <span className={`px-3 py-1 rounded-full font-extrabold text-[1.2rem] ${row.cls}`}>{row.grade}</span>
              </div>
            ))}
          </div>

          {/* Floating badges */}
          <div className="absolute bottom-36 -left-12 z-10 bg-white rounded-[1.2rem] px-4 py-2 shadow-[0_0.4rem_2rem_rgba(0,0,0,0.1)] text-[1.1rem] font-bold text-[#16a34a] flex items-center gap-2 whitespace-nowrap animate-float-1">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="20 6 9 17 4 12"/></svg>
            Atividade entregue!
          </div>
          <div className="absolute top-20 -right-8 z-10 bg-white rounded-[1.2rem] px-4 py-2 shadow-[0_0.4rem_2rem_rgba(0,0,0,0.1)] text-[1.1rem] font-bold text-primary-dark flex items-center gap-2 whitespace-nowrap animate-float-2">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/>
            </svg>
            Prova amanhã
          </div>
        </div>
      </div>
    </section>
  );
}
