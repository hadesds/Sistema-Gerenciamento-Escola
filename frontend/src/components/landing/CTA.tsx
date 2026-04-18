import Link from "next/link";

export default function CTA() {
  return (
    <section className="bg-gradient-to-br from-primary to-tertiary text-center px-[5%] py-16 md:py-20 relative overflow-hidden">
      <div className="absolute opacity-[0.04] -top-16 -left-16 pointer-events-none select-none">
        <svg width="280" height="280" viewBox="0 0 24 24" fill="white"><path d="M12 3L1 9l11 6 9-4.91V17h2V9L12 3zM5 13.18v4L12 21l7-3.82v-4L12 17l-7-3.82z"/></svg>
      </div>
      <h2 className="font-sora text-[clamp(2rem,5vw,2.8rem)] font-bold text-white mb-4">Pronto para começar?</h2>
      <p className="text-white/85 text-[1.5rem] mb-8 max-w-[50rem] mx-auto leading-relaxed">
        Acesse agora com os dados fornecidos pela sua escola e comece a acompanhar seu desempenho.
      </p>
      <Link href="#login"
        className="inline-flex items-center gap-3 bg-white text-primary-dark px-9 py-5 rounded-full font-extrabold text-[1.4rem] shadow-[0_0.6rem_2rem_rgba(0,0,0,0.15)] transition-all hover:-translate-y-1 hover:shadow-[0_1rem_2.8rem_rgba(0,0,0,0.2)]">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
        Fazer login agora
      </Link>
    </section>
  );
}
