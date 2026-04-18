const features = [
  {
    icon: (<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/></svg>),
    title: "Notas em tempo real",
    desc: "Acompanhe suas notas por matéria assim que o professor lançar. Chega de surpresas no boletim!",
  },
  {
    icon: (<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></svg>),
    title: "Atividades e tarefas",
    desc: "Veja todas as atividades postadas pelos professores com prazo, enunciado e status de entrega.",
  },
  {
    icon: (<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>),
    title: "Calendário escolar",
    desc: "Provas, eventos, feriados e atividades tudo em um calendário interativo e visual.",
  },
  {
    icon: (<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/></svg>),
    title: "Avisos da escola",
    desc: "Fique por dentro de comunicados, reuniões de pais e eventos importantes da escola.",
  },
  {
    icon: (<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>),
    title: "Perfil do aluno",
    desc: "Histórico de notas, frequência e informações da turma organizadas em um só perfil.",
  },
  {
    icon: (<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="5" y="2" width="14" height="20" rx="2"/><line x1="12" y1="18" x2="12.01" y2="18"/></svg>),
    title: "Acesso pelo celular",
    desc: "Funciona no navegador do celular, sem precisar instalar nada. Fácil e rápido.",
  },
];

export default function Features() {
  return (
    <section id="funcionalidades" className="bg-white px-[5%] py-16 md:py-20">
      <div className="mb-12 fade-in">
        <span className="inline-block bg-primary-light text-primary-dark px-4 py-1 rounded-full font-bold text-[1.1rem] uppercase tracking-widest mb-4">
          Funcionalidades
        </span>
        <h2 className="font-sora text-[clamp(2rem,4vw,2.8rem)] font-bold text-dark mb-3 leading-tight">
          Tudo que você precisa<br />para se organizar
        </h2>
        <p className="text-gray-muted text-[1.5rem] max-w-[54rem] leading-relaxed">
          Desenvolvido especialmente para a realidade das escolas públicas brasileiras.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {features.map((f) => (
          <div key={f.title}
            className="fade-in relative bg-bg-page border border-gray-border rounded-[2rem] p-8 transition-all duration-[250ms] overflow-hidden group
              hover:-translate-y-1 hover:shadow-primary hover:border-[rgba(245,166,35,0.3)]">
            {/* Barra inferior no hover */}
            <div className="absolute bottom-0 left-0 right-0 h-[0.3rem] bg-gradient-to-r from-primary to-secondary scale-x-0 origin-left transition-transform duration-300 group-hover:scale-x-100" />
            <div className="w-[5.2rem] h-[5.2rem] rounded-[1.4rem] bg-primary-light flex items-center justify-center text-primary-dark mb-5">
              {f.icon}
            </div>
            <h3 className="font-bold text-[1.5rem] mb-2 text-dark">{f.title}</h3>
            <p className="text-gray-muted text-[1.4rem] leading-relaxed">{f.desc}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
