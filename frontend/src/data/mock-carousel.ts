import { CarouselItem } from "@/types/carousel-types";

/**
 * Dados de exemplo. Quando a API estiver pronta, troque o import
 * estático por um fetch em components/mural-section.tsx.
 *
 * O último item (`proxima-reuniao-de-pais`) tem `publishAt` no futuro,
 * só pra você ver o agendamento funcionando: ele NÃO aparece no
 * carrossel nem abre pela URL até a data chegar.
 */
export const mockCarouselItems: CarouselItem[] = [
  {
    id: "1",
    slug: "matriculas-abertas-2027",
    imageUrl: "https://images.unsplash.com/photo-1580582932707-520aed937b7b?q=80&w=1200",
    imageAlt: "Alunos em sala de aula durante atividade em grupo",
    title: "Matrículas abertas para 2027",
    text: "Garanta a vaga do seu filho com condições especiais até o fim do mês.",
    category: "matricula",
    publishAt: "2026-07-01T08:00:00",
    order: 0,
    content: [
      "As matrículas para o ano letivo de 2027 já estão abertas para todas as turmas, da educação infantil ao ensino médio.",
      "Famílias que confirmarem a matrícula até o fim deste mês garantem desconto na primeira parcela e prioridade na escolha de turno.",
      "O processo pode ser feito totalmente online, pelo formulário disponível na secretaria digital, ou presencialmente na escola, de segunda a sexta, das 8h às 17h.",
    ],
  },
  {
    id: "2",
    slug: "feira-de-ciencias-2026",
    imageUrl: "https://images.unsplash.com/photo-1546410531-bb4caa6b424d?q=80&w=1200",
    imageAlt: "Feira de ciências com projetos dos alunos expostos",
    title: "Feira de Ciências 2026",
    text: "Os projetos dos alunos do 9º ano ficam expostos até sexta-feira no pátio principal.",
    category: "evento",
    publishAt: "2026-06-20T08:00:00",
    order: 1,
    content: [
      "A Feira de Ciências deste ano reuniu mais de 40 projetos desenvolvidos pelas turmas do 9º ano, com temas que vão de energia renovável a inteligência artificial aplicada à agricultura.",
      "Os projetos ficam expostos no pátio principal até sexta-feira, das 8h às 18h, e a visita é aberta a pais e responsáveis.",
      "No último dia, uma banca de professores escolhe os três melhores projetos, que representarão a escola na feira estadual em setembro.",
    ],
  },
  {
    id: "3",
    slug: "volei-feminino-campeao-regional",
    imageUrl: "https://images.unsplash.com/photo-1427504494785-3a9ca7044f45?q=80&w=1200",
    imageAlt: "Time de vôlei da escola comemorando uma vitória",
    title: "Vôlei feminino é campeão regional",
    text: "Parabéns às meninas do time sub-15 pelo título na competição de Maranhão.",
    category: "esporte",
    publishAt: "2026-06-15T08:00:00",
    order: 2,
    content: [
      "O time de vôlei feminino sub-15 da escola conquistou o título da competição regional de Maranhão, após uma temporada invicta.",
      "A equipe treina três vezes por semana sob a coordenação do professor de educação física, e várias atletas já vêm sendo observadas para times de base da capital.",
      "A diretoria da escola prepara uma recepção especial para as campeãs na próxima segunda-feira, no pátio principal.",
    ],
  },
  {
    id: "4",
    slug: "nova-ala-biblioteca",
    imageUrl: "https://images.unsplash.com/photo-1497633762265-9d179a990aa6?q=80&w=1200",
    imageAlt: "Biblioteca da escola com estantes cheias de livros",
    title: "Nova ala da biblioteca",
    text: "Inauguramos um espaço de leitura com mais de 2 mil títulos novos.",
    category: "biblioteca",
    publishAt: "2026-06-05T08:00:00",
    order: 3,
    content: [
      "A escola inaugurou uma nova ala da biblioteca, com mais de 2 mil títulos novos entre literatura infantojuvenil, clássicos e obras de referência para o ensino médio.",
      "O espaço conta também com uma sala de leitura silenciosa e uma área de estudo em grupo, pensada para os alunos que preparam trabalhos e seminários.",
      "O acervo pode ser consultado pelo sistema online da biblioteca, e o empréstimo de livros pode ser feito diretamente com a bibliotecária, de segunda a sexta.",
    ],
  },
  {
    id: "5",
    slug: "proxima-reuniao-de-pais",
    imageUrl: "https://images.unsplash.com/photo-1522202176988-66273c2fd55f?q=80&w=1200",
    imageAlt: "Sala de reunião com cadeiras organizadas",
    title: "Reunião de pais do 2º semestre",
    text: "Encontro com os professores pra falar do desempenho de cada turma.",
    category: "evento",
    publishAt: "2026-12-01T08:00:00",
    order: 4,
    content: [
      "A reunião de pais do 2º semestre vai acontecer no auditório principal, com horários organizados por turma.",
      "A presença não é obrigatória, mas é fortemente recomendada — é o momento de alinhar com os professores o desempenho de cada aluno até aqui.",
    ],
  },
];
