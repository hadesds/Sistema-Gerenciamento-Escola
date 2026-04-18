const steps = [
  { num: "1", title: "Faça o login",           desc: "Use o usuário e senha fornecidos pela escola para entrar na sua conta." },
  { num: "2", title: "Veja o que terá acesso", desc: "Acesse notas, atividades ou o calendário direto no seu painel." },
  { num: "3", title: "Fique por dentro",        desc: "Acompanhe tudo em tempo real e nunca perca uma data importante." },
];

export default function HowItWorks() {
  return (
    <section className="bg-white px-[5%] py-16 md:py-20">
      <div className="text-center mb-12 fade-in">
        <span className="inline-block bg-primary-light text-primary-dark px-4 py-1 rounded-full font-bold text-[1.1rem] uppercase tracking-widest mb-4">Como funciona</span>
        <h2 className="font-sora text-[clamp(2rem,4vw,2.8rem)] font-bold text-dark mb-3 leading-tight">Simples e rápido</h2>
        <p className="text-gray-muted text-[1.5rem] max-w-[54rem] leading-relaxed mx-auto">Em 3 passos você já está acessando tudo.</p>
      </div>
      <div className="fade-in relative grid grid-cols-1 sm:grid-cols-3 gap-12">
        <div className="hidden sm:block absolute top-[2.8rem] left-[calc(16.6%+2rem)] right-[calc(16.6%+2rem)] h-[0.2rem] bg-gradient-to-r from-primary to-secondary z-0" />
        {steps.map(s => (
          <div key={s.num} className="text-center relative z-[1]">
            <div className="w-[5.6rem] h-[5.6rem] rounded-full bg-gradient-to-br from-primary to-secondary text-white font-sora font-extrabold text-[1.8rem] flex items-center justify-center mx-auto mb-5 shadow-[0_0.6rem_2rem_rgba(245,166,35,0.35)]">{s.num}</div>
            <h4 className="font-bold text-[1.5rem] mb-2 text-dark">{s.title}</h4>
            <p className="text-[1.3rem] text-gray-muted leading-relaxed max-w-[24rem] mx-auto">{s.desc}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
