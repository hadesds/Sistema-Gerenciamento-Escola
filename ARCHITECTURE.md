# Arquitetura Técnica — Sistema de Gerenciamento Escolar

> Documento de referência para manter controle da arquitetura ao longo do tempo.
> Última atualização: Abril/2026

---

## Índice

1. [Visão Geral](#1-visão-geral)
2. [Stack Tecnológica](#2-stack-tecnológica)
3. [Estrutura de Diretórios](#3-estrutura-de-diretórios)
4. [Camada de Dados — Banco de Dados e Modelos](#4-camada-de-dados--banco-de-dados-e-modelos)
5. [Backend Django](#5-backend-django)
6. [API REST](#6-api-rest)
7. [Frontend Next.js](#7-frontend-nextjs)
8. [Autenticação e Autorização](#8-autenticação-e-autorização)
9. [Infraestrutura e Containerização](#9-infraestrutura-e-containerização)
10. [Decisões de Design e Padrões](#10-decisões-de-design-e-padrões)
11. [Débitos Técnicos e Pontos de Atenção](#11-débitos-técnicos-e-pontos-de-atenção)

---

## 1. Visão Geral

O sistema é uma aplicação web de gerenciamento escolar voltada para três perfis de usuário: **Administrador**, **Professor** e **Aluno**. Foi desenvolvido como projeto acadêmico para a disciplina de POO na UNDB.

A arquitetura é composta por duas camadas de apresentação paralelas sobre um único backend Django:

```
┌─────────────────────────────────────────────────────────┐
│                        Clientes                         │
│                                                         │
│   Browser (Templates Django)    Browser (Next.js SPA)   │
│          ↕ Session                    ↕ JWT             │
└─────────────────┬───────────────────────┬───────────────┘
                  │                       │
        ┌─────────▼───────────────────────▼─────────┐
        │            Django (porta 5433)             │
        │                                            │
        │   Views (MVT)  │  DRF API (/api/...)       │
        │                │                           │
        │         escola/ (app principal)            │
        └─────────────────────┬──────────────────────┘
                              │
                    ┌─────────▼─────────┐
                    │   PostgreSQL 15   │
                    │   (serviço: db)   │
                    └───────────────────┘
```

---

## 2. Stack Tecnológica

### Backend

| Componente | Tecnologia | Versão |
|---|---|---|
| Framework web | Django | 5.2.7 |
| Linguagem | Python | 3.11 |
| Banco de dados | PostgreSQL | 15 |
| ORM | Django ORM | — |
| API REST | Django REST Framework | 3.15.2 |
| Autenticação API | SimpleJWT | 5.3.1 |
| CORS | django-cors-headers | 4.4.0 |
| Upload de imagens | Pillow | 11.0.0 |
| Driver Postgres | psycopg2-binary | — |

### Frontend

| Componente | Tecnologia | Versão |
|---|---|---|
| Framework | Next.js (App Router) | 14.2.5 |
| Linguagem | TypeScript | 5 |
| Runtime JS | React | 18 |
| Gerenciamento de tokens | js-cookie | — |

### Infraestrutura

| Componente | Tecnologia |
|---|---|
| Containerização | Docker + Docker Compose |
| Node.js (build frontend) | 20 |

---

## 3. Estrutura de Diretórios

```
Sistema-Gerenciamento-Escola/
│
├── gestao_escolar/             # Pacote do projeto Django
│   ├── settings.py             # Configurações globais (DB, DRF, JWT, CORS, i18n)
│   ├── urls.py                 # URLconf raiz — wire admin, auth, API e app
│   ├── asgi.py
│   └── wsgi.py
│
├── escola/                     # App principal Django
│   ├── models.py               # Todos os modelos de domínio
│   ├── views.py                # Views server-rendered (sessão Django)
│   ├── api_views.py            # Views da API REST (JWT)
│   ├── serializers.py          # DRF serializers
│   ├── urls.py                 # Rotas da UI server-rendered
│   ├── api_urls.py             # Rotas da API REST
│   ├── admin.py                # Registros do Django Admin
│   ├── tests.py                # Testes (atualmente esparsos)
│   ├── migrations/
│   │   └── 0001_initial.py     # Única migration existente
│   └── templates/
│       ├── base.html
│       ├── login.html
│       ├── dashboard.html
│       ├── admin/
│       │   └── admin_dashboard.html
│       ├── professor/
│       │   ├── dashboard.html
│       │   ├── lista_turmas.html
│       │   ├── carometro.html
│       │   ├── banco_questoes.html
│       │   ├── criar_simulado.html
│       │   ├── lista_simulados.html
│       │   └── relatorio_aluno.html
│       └── aluno/
│           ├── dashboard.html
│           ├── meus_simulados.html
│           ├── visualizar_simulado.html
│           └── meu_feedback.html
│
├── frontend/                   # SPA Next.js
│   ├── src/
│   │   ├── app/                # App Router (rotas de arquivo)
│   │   │   ├── page.tsx
│   │   │   ├── login/
│   │   │   ├── professor/      # dashboard, turmas, turma/[id], banco-questoes,
│   │   │   │                   # criar-simulado, simulados, relatorio/[id]
│   │   │   └── aluno/          # dashboard, meu-feedback, meus-simulados, simulado/[id]
│   │   ├── components/
│   │   │   ├── Navbar.tsx
│   │   │   ├── ProtectedRoute.tsx
│   │   │   ├── Loading.tsx
│   │   │   ├── Alert.tsx
│   │   │   └── NotaBadge.tsx
│   │   ├── context/
│   │   │   └── AuthContext.tsx  # Estado global de autenticação
│   │   ├── lib/
│   │   │   └── api.ts           # apiFetch + lógica de refresh JWT
│   │   └── styles/
│   │       └── globals.css
│   ├── Dockerfile
│   ├── next.config.js
│   └── package.json
│
├── static/                     # Fontes estáticas do app
│   ├── css/style.css
│   └── js/dashboard.js
├── staticfiles/                # Saída de collectstatic (não versionar conteúdo)
├── Dockerfile                  # Imagem do backend
├── docker-compose.yml
├── manage.py
├── requirements.txt
└── .env                        # Variáveis de ambiente (não commitar em produção)
```

---

## 4. Camada de Dados — Banco de Dados e Modelos

### Banco de Dados

- **Motor:** PostgreSQL 15 (serviço Docker `db`).
- **Host:** `cara_db` (nome do serviço no Compose, resolvido internamente).
- **Persistência:** volume Docker `postgres_data`.
- **Uploads de mídia:** volume Docker `media_root` → `MEDIA_ROOT` no Django.

> **Atenção:** O `README.md` menciona SQLite — está desatualizado. O banco em uso é PostgreSQL.

### Diagrama de Entidades

```
django.contrib.auth.User (padrão Django)
        │
        ├── OneToOne ──► Administrador
        ├── OneToOne ──► Professor ──► ManyToMany ──► Turma
        └── OneToOne ──► Aluno ──────► ForeignKey ──► Turma
                                                        ↑
Questao ◄── ForeignKey(autor) ── Professor              │
   ↑                                                    │
   └── ManyToMany ◄── Simulado ──────────── ForeignKey(turma_alvo)
                          │
                     ForeignKey(autor) ──► Professor

Avaliacao ──► ForeignKey(aluno) ──► Aluno
          └── ForeignKey(professor) ──► Professor
```

### Modelos em Detalhe

| Modelo | Campos relevantes | Notas |
|---|---|---|
| `Administrador` | `OneToOneField(User)` | PK = user_id |
| `Turma` | `nome`, `serie`, `turno` (M/T/N), `sala` | — |
| `Professor` | `OneToOneField(User)`, `ManyToManyField(Turma)` | PK = user_id |
| `Aluno` | `OneToOneField(User)`, `foto (ImageField)`, `FK(Turma, SET_NULL)`, `matricula (unique, nullable)` | PK = user_id |
| `Avaliacao` | `FK(aluno)`, `FK(professor, SET_NULL)`, `assiduidade/participacao/responsabilidade/sociabilidade (1–5)`, `data (auto_now_add)` | Método `calcular_media()` |
| `Questao` | `enunciado`, `resposta`, `materia`, `FK(autor→Professor)`, `data_criacao` | — |
| `Simulado` | `M2M(questoes)`, `FK(autor→Professor)`, `FK(turma_alvo, SET_NULL)`, `data_criacao` | — |

---

## 5. Backend Django

### Roteamento Geral (`gestao_escolar/urls.py`)

```
/admin/          → Django Admin
/login/          → LoginView (sessão)
/logout/         → LogoutView (sessão)   ← duplicado em escola/urls.py
/api/            → escola/api_urls.py    (DRF + JWT)
/                → escola/urls.py        (UI server-rendered)
```

### Rotas da UI Server-Rendered (`escola/urls.py`)

| Rota | View | Perfil |
|---|---|---|
| `/` | `dashboard` | todos |
| `/login/`, `/logout/` | `login_view`, `logout_view` | — |
| `/turmas/` | `lista_turmas` | professor |
| `/turma/<id>/` | `carometro` | professor |
| `/avaliar/<id>/` | `avaliar_aluno` | professor |
| `/banco-questoes/` | `banco_questoes` | professor |
| `/criar-simulado/` | `criar_simulado` | professor |
| `/simulados/` | `lista_simulados` | professor |
| `/relatorio/<id>/` | `relatorio_aluno` | professor |
| `/meu-feedback/` | `meu_feedback` | aluno |
| `/meus-simulados/` | `meus_simulados` | aluno |
| `/simulado/<id>/` | `visualizar_simulado` | aluno |

### Views (`escola/views.py`)

- Funções (FBV), não CBV genéricas.
- Decoradores de acesso por perfil: `@professor_required`, `@aluno_required` (verificam `hasattr(request.user, 'professor')` / `'aluno'`).
- Lógica de negócio embutida nas views (padrão "fat views").

---

## 6. API REST

Base: `/api/` → `escola/api_urls.py`

### Endpoints de Autenticação

| Método | Rota | Descrição |
|---|---|---|
| POST | `/api/token/` | Obter par access/refresh (SimpleJWT) |
| POST | `/api/token/refresh/` | Renovar access token |
| GET | `/api/me/` | Usuário atual + `tipo` (admin/professor/aluno) |

### Endpoints de Professor

| Método | Rota | Descrição |
|---|---|---|
| GET | `/api/professor/dashboard/` | Estatísticas do dashboard |
| GET | `/api/professor/turmas/` | Turmas + stats |
| GET | `/api/professor/turma/<id>/` | Carômetro (`?busca=`) |
| POST | `/api/professor/avaliar/<aluno_id>/` | Registrar avaliação |
| GET, POST | `/api/professor/banco-questoes/` | Listar/filtrar ou criar questão |
| GET | `/api/professor/criar-simulado/data/` | Dados para formulário |
| POST | `/api/professor/criar-simulado/` | Criar simulado |
| GET | `/api/professor/simulados/` | Listar simulados do professor |
| GET | `/api/professor/relatorio/<aluno_id>/` | Relatório de desempenho |

### Endpoints de Aluno

| Método | Rota | Descrição |
|---|---|---|
| GET | `/api/aluno/dashboard/` | Dashboard do aluno |
| GET | `/api/aluno/meu-feedback/` | Feedback e agregações |
| GET | `/api/aluno/meus-simulados/` | Simulados da turma do aluno |
| GET | `/api/aluno/simulado/<id>/` | Detalhes de simulado (com check de turma) |

### Características da API

- Views com `@api_view(...)` (FBV), sem ViewSets ou Routers.
- Permissão padrão: `IsAuthenticated`.
- Verificação de perfil inline via helpers `_get_professor(request)` / `_get_aluno(request)` — retornam 403 se o usuário não tiver o perfil correto.

---

## 7. Frontend Next.js

### Estrutura de Rotas (App Router)

```
/                       → Redirecionamento pós-login
/login                  → Tela de autenticação
/professor/
  dashboard             → Dashboard professor
  turmas                → Lista de turmas
  turma/[id]            → Carômetro da turma
  banco-questoes        → Gestão de questões
  criar-simulado        → Criação de simulado
  simulados             → Lista de simulados
  relatorio/[id]        → Relatório do aluno
/aluno/
  dashboard             → Dashboard aluno
  meu-feedback          → Feedback e notas
  meus-simulados        → Simulados disponíveis
  simulado/[id]         → Visualização/resposta de simulado
```

### Fluxo de Autenticação no Frontend

```
login/page.tsx
   → POST /api/token/
   → Salva access + refresh em cookies (js-cookie)
   → AuthContext.tsx lê /api/me/ → obtém { tipo }
   → Redireciona: professor → /professor/dashboard
                  aluno     → /aluno/dashboard
                  admin     → /admin  (⚠️ rota Next, não /admin/ Django)
```

### Componentes Globais

| Componente | Responsabilidade |
|---|---|
| `AuthContext` | Estado global: usuário atual, loading, login/logout |
| `ProtectedRoute` | HOC que redireciona para `/login` se não autenticado |
| `Navbar` | Barra de navegação com controles por perfil |
| `Loading` | Spinner de carregamento |
| `Alert` | Mensagens de feedback (erro/sucesso) |
| `NotaBadge` | Exibição visual de notas/avaliações |

### Comunicação com a API

- Toda comunicação via `apiFetch` em `src/lib/api.ts`.
- Lógica de refresh automático: se `401`, tenta `/api/token/refresh/` e repete a requisição.
- Base URL: `NEXT_PUBLIC_API_URL` (default: `http://localhost:5433`).
- Django configurado para aceitar imagens de `localhost:5433` e `cara_app:5433` (`next.config.js`).

---

## 8. Autenticação e Autorização

O sistema mantém **duas pilhas de autenticação paralelas**:

### Sessão Django (UI server-rendered)

```
POST /login/
  → django.contrib.auth.authenticate()
  → login(request, user)
  → Sessão criada no servidor
  → Cookie de sessão no browser
```

- Proteção de rotas via `@login_required` (Django padrão) + decoradores de perfil customizados.
- Superuser → redireciona para `/admin/` (Django Admin).

### JWT (API + Next.js)

```
POST /api/token/     → { access (8h), refresh (7d) }
POST /api/token/refresh/ → { access }
```

- Token salvo em cookies (via `js-cookie`).
- Enviado em cada requisição: `Authorization: Bearer <access>`.
- `access` expira em **8h**, `refresh` em **7 dias** (configurado em `SIMPLE_JWT`).

### Modelo de Perfis / Roles

| Perfil | Mecanismo |
|---|---|
| Administrador | `user.is_superuser = True` **ou** `Administrador` OneToOne |
| Professor | `hasattr(user, 'professor')` (reverse do OneToOne) |
| Aluno | `hasattr(user, 'aluno')` (reverse do OneToOne) |

Não utiliza `django.contrib.auth.Group` — o papel é determinado pela existência de um perfil relacionado ao `User`.

### CORS

Origens permitidas: `http://localhost:3000`, `http://127.0.0.1:3000`, `http://frontend:3000`. Credenciais habilitadas (`CORS_ALLOW_CREDENTIALS = True`).

---

## 9. Infraestrutura e Containerização

### Serviços Docker Compose

| Serviço | Imagem/Build | Porta exposta | Responsabilidade |
|---|---|---|---|
| `db` | `postgres:15` | — (interna) | Banco de dados PostgreSQL |
| `web` | `./Dockerfile` (Python 3.11) | `5433:5433` | Django: collectstatic, migrate, runserver |
| `frontend` | `./frontend/Dockerfile` (Node 20) | `3000:3000` | Next.js em modo standalone |

### Dockerfile Backend

1. Base: `python:3.11`
2. `pip install -r requirements.txt`
3. Expõe porta `5433`
4. Comando de startup: `collectstatic` → `makemigrations` → `migrate` → `runserver 0.0.0.0:5433`

### Dockerfile Frontend

1. Base: `node:20`
2. `npm ci` (requer `package-lock.json`)
3. `next build` com `output: standalone`
4. Serve em `0.0.0.0:3000`

### Volumes

| Volume | Montagem | Conteúdo |
|---|---|---|
| `postgres_data` | Dados do `db` | Arquivos do PostgreSQL |
| `media_root` | `MEDIA_ROOT` do Django | Fotos de alunos (ImageField) |

### Variáveis de Ambiente (`.env`)

```env
POSTGRES_DB=...
POSTGRES_USER=...
POSTGRES_PASSWORD=...
DJANGO_SETTINGS_MODULE=gestao_escolar.settings
```

---

## 10. Decisões de Design e Padrões

### Padrão Arquitetural

- **Django MVT** para a UI server-rendered: Models, Templates, Function-Based Views.
- **DRF + JWT** para a API consumida pelo Next.js — mesmo domínio de negócio, implementações paralelas.

### Sem Camada de Serviço

A lógica de negócio está concentrada nas views (`views.py` e `api_views.py`). Não há camada de `services/` ou `repositories/` — padrão "fat views".

```
Request → URL → View → Model → Template/JSON
```

### Controle de Acesso Baseado em Perfil (não em Groups)

O role do usuário é derivado da existência de um modelo relacionado (`Professor`, `Aluno`, `Administrador`) — abordagem simples e adequada ao escopo acadêmico, mas menos flexível que `django.contrib.auth.Permission`.

### Templates: Herança

Todos os templates estendem `base.html`, que inclui os assets estáticos e o `<head>` padrão.

---

## 11. Débitos Técnicos e Pontos de Atenção

| # | Item | Severidade | Notas |
|---|---|---|---|
| 1 | `SECRET_KEY` hardcoded em `settings.py` | Alta | Mover para variável de ambiente |
| 2 | `DEBUG = True` e `ALLOWED_HOSTS = ['*']` | Alta | Inadequado para produção |
| 3 | Credenciais no `.env` commitado | Alta | Adicionar ao `.gitignore` |
| 4 | README desatualizado (diz SQLite, usa PostgreSQL) | Baixa | Corrigir README |
| 5 | Rota `/admin` no Next.js aponta para rota inexistente | Média | Administrador fica sem tela pós-login no SPA |
| 6 | Rota `/login/` duplicada entre `gestao_escolar/urls.py` e `escola/urls.py` | Baixa | Pode causar conflito |
| 7 | `tests.py` contém script com efeitos colaterais ao ser importado | Média | Isolar em script separado |
| 8 | Cobertura de testes praticamente zero | Média | Adicionar testes unitários e de integração |
| 9 | `makemigrations` no startup do container | Baixa | Adequado para dev; remover em produção |
| 10 | Sem CI/CD configurado | Baixa | Considerar GitHub Actions para linting + testes |
