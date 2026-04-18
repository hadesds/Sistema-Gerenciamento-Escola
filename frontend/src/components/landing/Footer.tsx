import Image from "next/image";
import Link from "next/link";

export default function Footer() {
  return (
    <footer className="bg-dark text-white/60 px-[5%] pt-12 pb-8">
      <div className="grid grid-cols-1 md:grid-cols-[2fr_1fr_1fr] gap-8 md:gap-12 mb-10">
        <div>
          <Link href="#" className="inline-flex items-center gap-4 no-underline mb-3">
            <Image src="/LOGO.png" alt="Logo Cara" width={200} height={200} className="h-[5rem] w-auto object-contain" />
            <span className="font-sora font-bold text-[2rem] text-white">Sistema<span className="text-primary">Cara</span></span>
          </Link>
          <p className="text-[1.2rem] leading-relaxed mt-3">Portal escolar desenvolvido para facilitar a comunicação entre alunos e professores da rede pública de ensino.</p>
        </div>
        <div>
          <h4 className="text-white font-bold text-[1.2rem] mb-4 uppercase tracking-wider">Acesso</h4>
          <ul className="list-none flex flex-col gap-2">
            {["Login do Aluno","Login do Professor","Esqueci minha senha"].map(l => (
              <li key={l}><Link href="#" className="text-white/50 no-underline text-[1.3rem] transition-colors hover:text-primary">{l}</Link></li>
            ))}
          </ul>
        </div>
        <div>
          <h4 className="text-white font-bold text-[1.2rem] mb-4 uppercase tracking-wider">Escola</h4>
          <ul className="list-none flex flex-col gap-2">
            {["Sobre a escola","Calendário escolar","Fale conosco"].map(l => (
              <li key={l}><Link href="#" className="text-white/50 no-underline text-[1.3rem] transition-colors hover:text-primary">{l}</Link></li>
            ))}
          </ul>
        </div>
      </div>
      <div className="border-t border-white/[0.08] pt-6 flex justify-center">
        <span className="text-primary text-[1.2rem] text-center">© 2025 Cara — Todos os direitos reservados</span>
      </div>
    </footer>
  );
}
