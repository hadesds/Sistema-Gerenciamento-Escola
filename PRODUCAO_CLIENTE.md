# Guia de Produto e Servicos Contratados do CARA

Este documento foi escrito para apresentacao ao cliente. Ele explica o que o Sistema CARA entrega hoje, quais servicos de terceiros sustentam a operacao e quais custos de plataforma devem ser considerados.

## 1. O que e o CARA

O CARA e um sistema de gerenciamento escolar voltado para acompanhamento academico e comportamental. Ele foi estruturado para concentrar em um unico ambiente:

- cadastro de turmas e alunos;
- lancamento de notas por materia e bimestre;
- acompanhamento comportamental por criterios pedagogicos;
- banco de questoes e simulados;
- registro de presenca e visualizacao de relatorios;
- acesso separado para administracao, professores e alunos.

## 2. Modulos entregues nesta fase

### Modulos operacionais disponiveis

| Modulo                    | O que permite hoje                                                       |
| ------------------------- | ------------------------------------------------------------------------ |
| Gestao de turmas e alunos | Cadastro de turmas, alunos, matriculas, fotos e vinculacao por professor |
| Avaliacao comportamental  | Registro de assiduidade, participacao, responsabilidade e sociabilidade  |
| Notas por materia         | Lancamento de notas por materia e por bimestre                           |
| Provas individuais        | Registro de notas de provas por aluno, materia e epoca                   |
| Banco de questoes         | Cadastro e organizacao de questoes por materia e dificuldade             |
| Simulados                 | Criacao e disponibilizacao de simulados para turmas                      |
| Frequencia                | Registro de presenca e ausencia                                          |
| Relatorios                | Dashboards para professor e historico visivel ao aluno                   |

### Perfis de usuario

| Perfil        | Uso principal                                                      |
| ------------- | ------------------------------------------------------------------ |
| Administrador | Gerencia o sistema e acessa o painel administrativo                |
| Professor     | Lanca avaliacoes, notas, questoes, simulados e consulta relatorios |
| Aluno         | Consulta simulados, feedback e informacoes pessoais                |

## 3. Limites atuais do produto

Para manter a documentacao honesta com o estado do sistema, este escopo precisa ser entendido pelo cliente:

1. O sistema ja cria simulados e os exibe aos alunos, mas ainda nao possui um fluxo completo de correcao automatica com historico detalhado de respostas por questao.
2. Os relatorios atuais sao operacionais e pedagogicos, nao um modulo completo de BI ou analytics avancado.
3. O sistema depende de servicos externos para banco, hospedagem e imagens. Esses servicos fazem parte da operacao normal do produto.
4. Backup, monitoramento avancado e suporte continuado podem ser contratados a parte como servico da equipe desenvolvedora.

## 4. Servicos externos que sustentam o sistema

O CARA nao depende apenas do codigo. Para ficar online de forma segura e estavel, ele precisa de servicos de infraestrutura terceirizados.

| Servico         | Funcao no CARA                                       | Plano minimo indicado | Plano recomendado hoje                                                   |
| --------------- | ---------------------------------------------------- | --------------------- | ------------------------------------------------------------------------ |
| GitHub          | Guarda o codigo e historico de versoes               | Free                  | Team, se o cliente quiser organizacao com mais de um responsavel tecnico |
| Vercel          | Hospeda o frontend acessado por professores e alunos | Pro                   | Pro                                                                      |
| Render          | Hospeda backend, API e admin Django                  | Starter               | Starter                                                                  |
| Neon            | Banco PostgreSQL gerenciado                          | Launch                | Launch                                                                   |
| Cloudinary      | Guarda fotos e uploads                               | Free                  | Free inicialmente; Plus apenas se o volume de imagens crescer bastante   |
| Dominio proprio | Endereco publico do sistema                          | 1 dominio anual       | 1 dominio anual                                                          |

## 5. Premissas de valores

As estimativas abaixo usam como referencia:

- data-base: 22/05/2026;
- cambio de referencia: `US$ 1 ~= R$ 5,60`;
- valores sujeitos a alteracao pelas plataformas;
- dominio tratado a parte porque normalmente e cobrado por ano;
- custos de suporte, treinamento e manutencao nao estao incluidos nos custos de plataforma.

## 6. Tabela de custos estimados

| Servico           | Plano minimo indicado | Custo estimado             | Estimativa em BRL              | Observacao comercial                                                      |
| ----------------- | --------------------- | -------------------------- | ------------------------------ | ------------------------------------------------------------------------- |
| GitHub            | Free                  | US$ 0/mes                  | R$ 0/mes                       | Pode ser suficiente se a equipe tecnica for pequena                       |
| GitHub            | Team                  | US$ 4 por usuario/mes      | R$ 22,40 por usuario/mes       | Recomendado se o cliente quiser organizacao propria com governanca melhor |
| Vercel            | Pro                   | US$ 20/mes                 | R$ 112,00/mes                  | Plano indicado para frontend em producao                                  |
| Render            | Starter               | US$ 7/mes                  | R$ 39,20/mes                   | Evita limitacoes do plano gratuito                                        |
| Neon              | Launch                | US$ 15/mes                 | R$ 84,00/mes                   | Banco gerenciado recomendado para uso real                                |
| Cloudinary        | Free                  | US$ 0/mes                  | R$ 0/mes                       | Atende a fase inicial do projeto                                          |
| Cloudinary        | Plus                  | US$ 99/mes                 | R$ 554,40/mes                  | Necessario apenas se o volume de imagens crescer muito                    |
| Dominio `.com.br` | Registro anual        | cerca de R$ 40 a R$ 70/ano | cerca de R$ 3,33 a R$ 5,83/mes | Valor varia conforme registrador e extensao                               |

## 7. Cenarios sugeridos para contratacao

### Cenario A: entrega deste mes com operacao minima viavel

Indicado para colocar o sistema em producao com baixo risco e sem contratar recursos acima do necessario para uma escola de pequeno porte.

| Item       | Plano   |
| ---------- | ------- |
| GitHub     | Free    |
| Vercel     | Pro     |
| Render     | Starter |
| Neon       | Launch  |
| Cloudinary | Free    |

Total mensal estimado de plataforma:

```text
US$ 42/mes
R$ 235,20/mes
```

Acrescimos possiveis:

- dominio anual;
- eventual custo de assentos no GitHub Team, se o cliente optar por governanca propria;
- crescimento futuro do Cloudinary.

### Cenario B: operacao recomendada para cliente com titularidade das contas

Indicado quando a escola quer assumir a propriedade dos servicos e manter pelo menos dois responsaveis tecnicos com acesso ao repositorio.

| Item       | Plano                |
| ---------- | -------------------- |
| GitHub     | Team para 2 usuarios |
| Vercel     | Pro                  |
| Render     | Starter              |
| Neon       | Launch               |
| Cloudinary | Free                 |

Total mensal estimado de plataforma:

```text
US$ 50/mes
R$ 280,00/mes
```

Esse cenario melhora governanca e titularidade sem elevar demais o custo mensal.

### Cenario C: crescimento com maior volume de imagens

Se o uso de fotos e uploads subir muito ao longo do tempo, o principal salto de custo tende a acontecer no Cloudinary.

| Item       | Plano                |
| ---------- | -------------------- |
| GitHub     | Team para 2 usuarios |
| Vercel     | Pro                  |
| Render     | Starter              |
| Neon       | Launch               |
| Cloudinary | Plus                 |

Total mensal estimado de plataforma:

```text
US$ 149/mes
R$ 834,40/mes
```

## 8. O que o cliente contrata de fato

Ao contratar o CARA em producao, o cliente passa a contratar dois grupos de itens diferentes:

### 8.1. Infraestrutura de terceiros

Sao os servicos mensais que mantem o sistema online:

- hospedagem do frontend;
- hospedagem do backend;
- banco de dados gerenciado;
- armazenamento de imagens;
- repositorio e historico tecnico do sistema;
- dominio, quando houver.

Esses custos pertencem as plataformas e nao a equipe desenvolvedora.

### 8.2. Servico profissional da equipe desenvolvedora

Sao itens que podem ser cobrados separadamente por voces:

- implantacao inicial;
- configuracao das contas e deploy;
- treinamento de uso;
- manutencao corretiva;
- evolucao funcional;
- suporte mensal;
- monitoramento e revisao operacional.

Em contrato, o ideal e separar claramente `custo de plataforma` de `custo de servico`.

## 9. Responsabilidades recomendadas

### Cliente

- pagar as plataformas contratadas;
- ser titular das contas e do dominio;
- definir quem tera acesso administrativo;
- definir politica interna de uso dos dados;
- aprovar as regras de acesso e responsabilidade institucional.

### Equipe desenvolvedora

- implantar o sistema pela primeira vez;
- configurar integracoes tecnicas;
- realizar ajustes corretivos acordados;
- orientar o uso da plataforma;
- apoiar em futuras evolucoes, se contratadas.

## 10. Seguranca, LGPD e operacao

Como o sistema lida com dados escolares, as seguintes medidas sao recomendadas desde o inicio:

1. HTTPS ativo em todos os acessos.
2. Senhas fortes para administradores.
3. Menor numero possivel de usuarios com acesso administrativo.
4. Credenciais guardadas fora de conversas informais e arquivos soltos.
5. Processo minimo de backup e restauracao.
6. Politica clara para desligamento de usuarios e troca de senhas.

## 11. Recomendacao comercial para este projeto

Para o porte atual do CARA e para uma entrega ainda neste mes, a recomendacao mais equilibrada e:

1. Vercel Pro para o frontend.
2. Render Starter para o backend.
3. Neon Launch para o banco.
4. Cloudinary Free inicialmente.
5. Dominio proprio do cliente assim que possivel.
6. Contas em nome do cliente, com acesso tecnico delegado a equipe.

Esse conjunto atende o momento atual do sistema com custo controlado, boa separacao de responsabilidades e menor risco operacional do que depender de planos gratuitos em producao.

## 12. Checklist de aceite para entrega ao cliente

- [ ] Cliente entende quais servicos serao cobrados mensalmente.
- [ ] Cliente sabe que dominio e plataforma sao custos separados do servico dos desenvolvedores.
- [ ] Cliente recebeu a lista de contas que deve possuir.
- [ ] Cliente aprovou o cenario de custo escolhido.
- [ ] Cliente sabe quem sera responsavel por billing e acessos.
- [ ] Cliente recebeu treinamento basico de uso e administracao.

## 13. Observacao final sobre valores

Antes da assinatura final ou da emissao de proposta comercial, revisem os precos nas paginas oficiais de Vercel, Render, Neon, Cloudinary e do registrador de dominio escolhido. O documento acima deve ser tratado como base tecnica e comercial, nao como tabela congelada de faturamento.
