import Chamada from "@/components/chamada/Chamada";

interface Aluno {
  id: number;
  nome: string;
}

interface PageProps {
  params: Promise<{ turmaId: string }>;
}

async function getAlunos(
  turmaId: string,
): Promise<{ turma: string; alunos: Aluno[] }> {
  // TODO: substituir pela URL real da API Django
  // const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/turmas/${turmaId}/alunos/`, {
  //   cache: "no-store",
  // });
  // if (!res.ok) throw new Error("Erro ao buscar alunos");
  // return res.json();

  return {
    turma: turmaId,
    alunos: [
      { id: 1, nome: "João Silva" },
      { id: 2, nome: "Maria Souza" },
      { id: 3, nome: "Pedro Oliveira" },
      { id: 4, nome: "Ana Lima" },
      { id: 5, nome: "Carlos Mendes" },
    ],
  };
}

export default async function ChamadaPage({ params }: PageProps) {
  const { turmaId } = await params;
  const { turma, alunos } = await getAlunos(turmaId);

  return <Chamada turma={turma} alunos={alunos} />;
}
