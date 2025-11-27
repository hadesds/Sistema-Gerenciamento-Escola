## 🏫 Sistema de Gerenciamento Escolar

Este projeto é um **Sistema de Gerenciamento Escolar** desenvolvido para a disciplina de **Programação Orientada a Objetos (POO)** durante o quarto período da faculdade na **UNDB (Centro Universitário Dom Bosco)**.

O sistema foi construído integralmente utilizando o framework **Django** (Python) para todas as funcionalidades, abrangendo desde a persistência de dados (modelos) até a lógica de negócios (views) e a apresentação (templates).

-----

## 💻 Tecnologias Utilizadas

O projeto é baseado principalmente em:

  * **Backend Framework:** **Django** (Python)
  * **Banco de Dados:** **SQLite** (configuração padrão do Django)
  * **Containerização:** **Docker** e **Docker Compose**
  * **Frontend:** HTML, CSS (em `static/css/style.css`), JavaScript, e o sistema de templates do Django.

-----

## 🎨 Telas e Funcionalidades Principais

O sistema possui diferentes perfis de usuário (Administrador, Professor e Aluno), cada um com acesso a dashboards e funcionalidades específicas.

### 1\. Tela de Login

  * **`escola/templates/login.html`**
  * Ponto de entrada para todos os usuários. O sistema redireciona o usuário para o dashboard apropriado após a autenticação bem-sucedida, com base no seu tipo de usuário.

### 2\. Dashboards por Perfil

#### 2.1. Dashboard de Administrador

  * **`escola/templates/admin/admin_dashboard.html`**
  * Visão geral para o administrador do sistema.

#### 2.2. Dashboard de Professor

  * **`escola/templates/professor/dashboard.html`**
  * Visão geral para o professor, com acesso rápido às suas ferramentas.

#### 2.3. Dashboard de Aluno

  * **`escola/templates/aluno/dashboard.html`**
  * Visão geral para o aluno.

### 3\. Telas do Professor

As telas do professor focam na gestão de conteúdo e acompanhamento dos alunos.

  * **Banco de Questões**

      * **`escola/templates/professor/banco_questoes.html`**
      * Interface para visualizar, adicionar e gerenciar as questões que compõem os simulados.

  * **Criar Simulado**

      * **`escola/templates/professor/criar_simulado.html`**
      * Tela para montar novos simulados, selecionando questões do banco.

  * **Lista de Simulados**

      * **`escola/templates/professor/lista_simulados.html`**
      * Exibe os simulados criados pelo professor.

  * **Lista de Turmas**

      * **`escola/templates/professor/lista_turmas.html`**
      * Exibe a lista de turmas sob a responsabilidade do professor.

  * **Carômetro**

      * **`escola/templates/professor/carometro.html`**
      * Uma forma visual de visualizar os alunos de uma turma (pode exibir fotos e informações básicas).

  * **Relatório do Aluno**

      * **`escola/templates/professor/relatorio_aluno.html`**
      * Permite ao professor visualizar o desempenho e o histórico de um aluno específico.

### 4\. Telas do Aluno

As telas do aluno focam no acesso aos recursos de estudo e feedback.

  * **Meus Simulados**

      * **`escola/templates/aluno/meus_simulados.html`**
      * Lista os simulados disponíveis para o aluno realizar ou já realizados.

  * **Visualizar Simulado**

      * **`escola/templates/aluno/visualizar_simulado.html`**
      * Tela onde o aluno interage com as questões do simulado.

  * **Meu Feedback**

      * **`escola/templates/aluno/meu_feedback.html`**
      * Exibe o feedback e os resultados de desempenho do aluno.

-----

## 🚀 Como Executar o Projeto com Docker

Este projeto utiliza **Docker** e **Docker Compose** para facilitar a configuração do ambiente.

### Pré-requisitos

  * Docker
  * Docker Compose

### Passos

1.  **Construa e Inicie os Containers:**
    Navegue até o diretório raiz do projeto onde se encontra o arquivo `docker-compose.yml` e execute o seguinte comando:

    ```bash
    docker-compose up --build
    ```

2.  **Acesse o Sistema:**
    O sistema estará disponível em: `http://localhost:5433`
