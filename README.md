# Sistema de Gerenciamento Escolar

Este projeto é um sistema web desenvolvido em Django para gestão escolar, abrangendo recursos para professores, alunos e administradores. O sistema tem como objetivo centralizar informações acadêmicas, avaliações, atividades e comunicação entre corpo docente e discente.

## Principais Funcionalidades

### Acesso e Perfis
- **Login para Professores e Alunos:** Usuários autenticados acessam funcionalidades de acordo com seu perfil.
- **Dashboard Personalizado:** Cada perfil (professor ou aluno) possui um painel específico com atalhos para suas principais funções.

### Área do Professor

- **Gestão de Turmas:**
  - Visualização das turmas sob responsabilidade do professor.
  - Detalhamento das turmas, com listagem de alunos (Carômetro de Alunos).
- **Registro de Avaliações:**
  - Professores podem registrar avaliações de desempenho dos alunos em critérios como assiduidade, participação, responsabilidade e sociabilidade, com notas de 1 a 5.
- **Banco de Questões:**
  - Cadastro de novas questões, incluindo matéria/disciplina, enunciado e resposta.
  - Acesso ao banco pessoal de questões para criar simulados e atividades.
- **Montagem de Simulados:**
  - Composição de simulados a partir do banco de questões, direcionados para turmas específicas.

### Área do Aluno

- **Painel do Aluno:**
  - Visualização de feedbacks e histórico de avaliações recebidas dos professores.
  - Consulta à sua turma e desempenho individual nos critérios avaliados.
- **Eventos e Atividades:**
  - Visualização de eventos próximos e atividades escolares, como simulados, apresentações e ações sociais.

### Funcionalidades Gerais

- **Gestão Administrativa:**
  - Perfis de Administrador, Aluno, Professor e Turma cadastrados e gerenciados via painel administrativo Django.
- **Notificações:**
  - Informações sobre eventos institucionais, novidades e comunicados exibidos no dashboard.
- **Pesquisa:**
  - Campo de busca para alunos, notas, eventos e demais registros escolares.
- **Interface Responsiva:**
  - Layout moderno e adaptável, com navegação intuitiva.

## Modelos Principais

- **Administrador**
- **Professor**
- **Aluno**
- **Turma**
- **Avaliação**
- **Questão**
- **Simulado**

## Outras Funcionalidades

- **Ações Sociais e Projetos:** Registro e acompanhamento de atividades extracurriculares como ações sociais, práticas laboratoriais e aulas de idiomas.
- **Controle de Permissões:** Acesso restrito às funcionalidades conforme o perfil do usuário.
- **Histórico de Simulados e Avaliações:** Professores e alunos têm acesso ao histórico de simulados realizados e avaliações lançadas.

## Tecnologias Utilizadas

- **Backend:** Python 3, Django
- **Frontend:** HTML5, CSS3, JavaScript
- **Banco de Dados:** SQLite3 (padrão Django)
- **Outros:** Templates Django, autenticação via Django Auth

## Como Executar

1. Clone o repositório:
   ```bash
   git clone https://github.com/hadesds/Sistema-Gerenciamento-Escola.git
   ```
2. Instale as dependências:
   ```bash
   pip install -r requirements.txt
   ```
3. Realize as migrações e crie um superusuário:
   ```bash
   python manage.py migrate
   python manage.py createsuperuser
   ```
4. Inicie o servidor de desenvolvimento:
   ```bash
   python manage.py runserver
   ```
5. Acesse `http://localhost:8000` no navegador.

---

**Observação:** Para cadastro de perfis (professor, aluno, turma) utilize o painel administrativo: `/admin/`.

---
