const studentFeatures = ["Ver notas por matéria e bimestre","Acompanhar atividades com prazo","Consultar calendário de provas","Receber avisos da escola","Ver histórico completo de notas"];
const teacherFeatures = ["Lançar e editar notas por turma","Criar e publicar atividades","Adicionar eventos ao calendário","Enviar avisos para a turma","Visualizar todos os alunos"];

function CheckIcon({ variant }: { variant: "aluno" | "prof" }) {
  return (
    <span className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${variant === "aluno" ? "bg-[#dcfce7] text-[#16a34a]" : "bg-white/25 text-white"}`}>
      <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><polyline points="20 6 9 17 4 12"/></svg>
    </span>
  );
}

export default function Profiles() {
  return (
    <section id="perfis" className="bg-bg-page px-[5%] py-16 md:py-20">
      <div className="mb-12 fade-in">
        <span className="inline-block bg-primary-light text-primary-dark px-4 py-1 rounded-full font-bold text-[1.1rem] uppercase tracking-widest mb-4">Para quem é</span>
        <h2 className="font-sora text-[clamp(2rem,4vw,2.8rem)] font-bold text-dark mb-3 leading-tight">Um portal para todos</h2>
        <p className="text-gray-muted text-[1.5rem] max-w-[54rem] leading-relaxed">Funciona de formas diferentes para alunos e professores.</p>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 fade-in">
        <div className="bg-white border border-gray-border rounded-[2rem] p-8 md:p-10">
          <span className="block mb-5 text-primary">
            <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
          </span>
          <h3 className="font-sora font-bold text-[2rem] text-dark mb-2">Para o Aluno</h3>
          <p className="text-gray-muted text-[1.4rem] leading-relaxed mb-6">Acesse suas notas, veja as atividades postadas e acompanhe o calendário escolar.</p>
          <ul className="list-none flex flex-col gap-3">
            {studentFeatures.map(f => (
              <li key={f} className="flex items-center gap-3 text-[1.4rem] font-semibold text-text-base"><CheckIcon variant="aluno"/>{f}</li>
            ))}
          </ul>
        </div>
        <div className="bg-gradient-to-br from-primary to-tertiary text-white rounded-[2rem] p-8 md:p-10">
          <span className="block mb-5 text-white">
            <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><line x1="23" y1="11" x2="17" y2="11"/><line x1="20" y1="8" x2="20" y2="14"/></svg>
          </span>
          <h3 className="font-sora font-bold text-[2rem] text-white mb-2">Para o Professor</h3>
          <p className="text-white/85 text-[1.4rem] leading-relaxed mb-6">Lance notas, crie atividades e mantenha seus alunos informados com facilidade.</p>
          <ul className="list-none flex flex-col gap-3">
            {teacherFeatures.map(f => (
              <li key={f} className="flex items-center gap-3 text-[1.4rem] font-semibold text-white/90"><CheckIcon variant="prof"/>{f}</li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
}
