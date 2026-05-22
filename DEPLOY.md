# Guia Tecnico de Deploy do CARA

Este documento e a referencia tecnica para publicar, operar e repassar o Sistema CARA em producao. O foco aqui e a equipe de desenvolvimento.

## 1. Objetivo e escopo

O CARA hoje esta preparado para operar com a seguinte arquitetura:

```text
Usuario
  -> Frontend Next.js na Vercel
  -> Backend Django/DRF na Render
  -> Banco PostgreSQL na Neon
  -> Imagens e uploads na Cloudinary
```

Docker continua util para desenvolvimento local e demonstracoes internas, mas nao deve ser tratado como camada de persistencia de producao.

## 2. Stack confirmado

| Camada    | Tecnologia                            | Hospedagem recomendada | Observacao                                          |
| --------- | ------------------------------------- | ---------------------- | --------------------------------------------------- |
| Frontend  | Next.js 15 + React 19 + TypeScript    | Vercel                 | Projeto configurado com `Root Directory = frontend` |
| Backend   | Django 5 + DRF + SimpleJWT + Gunicorn | Render                 | Admin Django e API ficam no mesmo servico           |
| Banco     | PostgreSQL                            | Neon                   | Consumido via `DATABASE_URL`                        |
| Arquivos  | Cloudinary                            | Cloudinary             | Ativado por `CLOUDINARY_URL`                        |
| Estaticos | WhiteNoise                            | Mesmo backend          | `build.sh` faz `collectstatic` antes do start       |
| Codigo    | GitHub                                | Repositorio oficial    | Dispara deploy automatizado                         |

## 3. Principios de implantacao

1. Dados de producao nao ficam dentro do container.
2. Banco e arquivos precisam ser externos ao runtime da aplicacao.
3. O repositorio oficial deve ser unico. Evite manter dois repositorios divergentes em paralelo.
4. A equipe deve diferenciar ambiente local, homologacao e producao, mesmo que hoje a homologacao ainda seja opcional.
5. As contas e o billing devem preferencialmente ficar em nome do cliente na entrega.

## 4. Requisitos minimos e recomendados

### Requisitos minimos para entrar em producao

- Repositorio oficial atualizado no GitHub.
- Conta Neon com banco PostgreSQL disponivel e `DATABASE_URL` pooled com SSL.
- Conta Cloudinary com `CLOUDINARY_URL` configurada.
- Backend Django publicado na Render com `bash build.sh` e `gunicorn gestao_escolar.wsgi:application --bind 0.0.0.0:$PORT`.
- Frontend Next.js publicado na Vercel com `Root Directory = frontend`.
- `NEXT_PUBLIC_API_URL` apontando para a URL publica do backend.
- Pelo menos uma conta administrativa valida.
- Smoke tests executados apos o deploy.

### Requisitos recomendados para entrega ao cliente

- Plano pago de producao no backend. O `render.yaml` pode servir de base, mas a entrega deve usar pelo menos `Starter` na Render.
- Banco em plano gerenciado da Neon para uso real, evitando depender de tier gratuito em producao.
- Dominio proprio para `app.` e `api.`.
- Contas e faturamento em nome do cliente.
- Checklist de backup/restore antes de migrations estruturais.
- Registro de quem possui acesso administrativo a Vercel, Render, Neon, Cloudinary e GitHub.
- Ambiente de homologacao quando houver risco de mudancas frequentes antes do fim do periodo letivo.

## 5. Ordem correta de provisionamento

Use sempre esta sequencia para deploy inicial:

1. Confirmar repositorio oficial e branch principal.
2. Criar ou revisar o banco na Neon.
3. Criar ou revisar a conta Cloudinary.
4. Publicar o backend na Render.
5. Criar admin ou seed demo no backend.
6. Publicar o frontend na Vercel.
7. Configurar dominios customizados, se houver.
8. Executar smoke tests de ponta a ponta.

Essa ordem evita configurar o frontend antes da URL real do backend e evita iniciar o backend sem banco e storage corretos.

## 6. Matriz de variaveis de ambiente

### Backend na Render

| Variavel                      | Obrigatoria     | Exemplo                                                         | Uso                                           |
| ----------------------------- | --------------- | --------------------------------------------------------------- | --------------------------------------------- |
| `DEBUG`                       | Sim             | `False`                                                         | Deve ficar desativado em producao             |
| `SECRET_KEY`                  | Sim             | gerada pela plataforma                                          | Chave secreta do Django                       |
| `DATABASE_URL`                | Sim             | `postgresql://USER:PASSWORD@HOST/neondb?sslmode=require`        | Conexao com Neon                              |
| `ALLOWED_HOSTS`               | Sim             | `.onrender.com,api.cara.escola.com.br`                          | Hosts aceitos pelo Django                     |
| `CORS_ALLOWED_ORIGINS`        | Sim             | `https://app.cara.escola.com.br`                                | Origem do frontend                            |
| `CORS_ALLOWED_ORIGIN_REGEXES` | Nao             | `https://.*\.vercel\.app`                                       | Ajuda em previews da Vercel                   |
| `CSRF_TRUSTED_ORIGINS`        | Sim             | `https://api.cara.escola.com.br,https://app.cara.escola.com.br` | Protecao CSRF no admin                        |
| `CLOUDINARY_URL`              | Sim em producao | `cloudinary://API_KEY:API_SECRET@CLOUD_NAME`                    | Ativa storage remoto de uploads               |
| `FRONTEND_URL`                | Recomendado     | `https://app.cara.escola.com.br`                                | Redirecionamentos do admin                    |
| `SEED_DEMO`                   | Opcional        | `true`                                                          | Roda `seed_demo` no build                     |
| `DEMO_PASSWORD`               | Opcional        | `SenhaForteAqui`                                                | Senha das contas demo quando `SEED_DEMO=true` |

Observacoes:

- O `build.sh` ja instala dependencias, roda `collectstatic` e aplica migrations.
- O `build.sh` forca `STATICFILES_STORAGE=django.contrib.staticfiles.storage.StaticFilesStorage` apenas durante o collectstatic para evitar falha conhecida com WhiteNoise e arquivos do pacote Cloudinary.
- Sem `CLOUDINARY_URL`, o Django volta a salvar em `media/` local. Isso e aceitavel somente fora da producao.

### Frontend na Vercel

| Variavel              | Obrigatoria | Exemplo                                | Uso                              |
| --------------------- | ----------- | -------------------------------------- | -------------------------------- |
| `NEXT_PUBLIC_API_URL` | Sim         | `https://projetocara-api.onrender.com` | Base URL consumida pelo frontend |

Observacao: use a origem sem barra final.

## 7. Deploy inicial passo a passo

### 7.1. Repositorio oficial

1. Defina um unico repositorio como fonte da verdade.
2. Garanta que a branch principal esteja atualizada e versionada.
3. Se o cliente for assumir o projeto, prefira uma organizacao GitHub do cliente.

### 7.2. Banco na Neon

1. Criar projeto e banco de producao.
2. Copiar a connection string pooled.
3. Guardar a URL fora do Git.
4. Usar esta URL em `DATABASE_URL` na Render.

Formato esperado:

```env
DATABASE_URL=postgresql://USUARIO:SENHA@HOST/neondb?sslmode=require
```

### 7.3. Storage na Cloudinary

1. Criar a conta do projeto ou do cliente.
2. Copiar a `CLOUDINARY_URL`.
3. Configurar a variavel na Render.
4. Validar upload de foto depois do deploy.

Formato esperado:

```env
CLOUDINARY_URL=cloudinary://API_KEY:API_SECRET@CLOUD_NAME
```

### 7.4. Backend na Render

Configuracao base do servico:

```text
Service name: projetocara-api
Runtime: Python
Build Command: bash build.sh
Start Command: gunicorn gestao_escolar.wsgi:application --bind 0.0.0.0:$PORT
Python version: 3.11.9
Root Directory: raiz do repositorio
```

Notas importantes:

- O `render.yaml` atualmente usa `plan: free` como bootstrap. Para cliente real, altere o plano no painel para `Starter` ou superior antes do go-live.
- Se a Render criar start command padrao incorreto, substitua manualmente pelo comando acima.

Variaveis minimas no painel da Render:

```env
DEBUG=False
DATABASE_URL=postgresql://...
CLOUDINARY_URL=cloudinary://...
ALLOWED_HOSTS=.onrender.com,localhost,127.0.0.1
CORS_ALLOWED_ORIGINS=https://projetocara.vercel.app
CORS_ALLOWED_ORIGIN_REGEXES=https://.*\.vercel\.app
CSRF_TRUSTED_ORIGINS=https://*.onrender.com,https://*.vercel.app
FRONTEND_URL=https://projetocara.vercel.app
```

Depois do deploy, teste:

```text
https://projetocara-api.onrender.com/
https://projetocara-api.onrender.com/admin/
```

### 7.5. Criar superusuario ou seed demo

Opcao 1, recomendada para cliente real:

```bash
python manage.py createsuperuser
```

Opcao 2, util para demo controlada:

```env
SEED_DEMO=true
DEMO_PASSWORD=UmaSenhaForteAqui
```

O seed cria contas demonstrativas previsiveis. Remova ou desative isso antes da operacao normal:

```env
SEED_DEMO=false
```

### 7.6. Frontend na Vercel

Configuracao base do projeto:

```text
Root Directory: frontend
Framework Preset: Next.js
Install Command: npm ci
Build Command: npm run build
```

Variavel obrigatoria:

```env
NEXT_PUBLIC_API_URL=https://projetocara-api.onrender.com
```

Depois do deploy:

1. Abrir a URL da Vercel.
2. Testar login.
3. Testar redirecionamento para o admin Django.
4. Testar exibicao de fotos.

### 7.7. Dominios customizados

Padrao sugerido:

```text
app.dominio-do-cliente.com.br -> Vercel
api.dominio-do-cliente.com.br -> Render
```

Quando o dominio entrar, atualize:

- `NEXT_PUBLIC_API_URL`
- `ALLOWED_HOSTS`
- `CORS_ALLOWED_ORIGINS`
- `CSRF_TRUSTED_ORIGINS`
- `FRONTEND_URL`

## 8. Smoke tests obrigatorios apos o deploy

Execute pelo menos estes testes antes de declarar a entrega pronta:

1. Backend responde na raiz.
2. Admin Django abre e autentica.
3. Login de professor funciona.
4. Login de aluno funciona.
5. Tela principal do frontend carrega sem erro de CORS.
6. Upload de foto funciona e a imagem reaparece apos refresh.
7. Dado salvo continua disponivel apos redeploy.
8. Push no repositorio oficial dispara novo deploy.

## 9. Operacao recorrente

### Deploy recorrente

1. Subir mudancas para a branch principal.
2. Conferir se Vercel e Render detectaram o commit correto.
3. Validar migrations antes de mexer em estruturas de dados sensiveis.
4. Reexecutar smoke tests do item 8.

### Backup antes de mudancas estruturais

Antes de migrations que alterem dados ou tabelas de forma irreversivel:

1. Exportar backup do Neon pelo painel ou por `pg_dump`.
2. Registrar o commit do deploy.
3. Somente depois aplicar migrations em producao.

### Rollback

Frontend:

- Na Vercel, reimplantar o deployment anterior estavel.

Backend:

- Na Render, voltar ao commit anterior ou disparar novo deploy com a revisao estavel.
- Se uma migration ja tiver alterado dados, o rollback da aplicacao sozinho pode nao bastar. Nessa situacao, restaure o backup do banco ou aplique a migracao reversa compativel.

## 10. Docker local e demonstracao interna

Docker continua valido para desenvolvimento local.

Exemplo de `.env` local na raiz:

```env
DEBUG=True
POSTGRES_DB=cara_escola
POSTGRES_USER=django_user
POSTGRES_PASSWORD=Cara2025.
POSTGRES_HOST=db
POSTGRES_PORT=5432
```

Subida local:

```bash
docker compose up --build
```

URLs locais esperadas:

```text
Frontend: http://localhost:3000
Backend/API: http://localhost:5433
Admin Django: http://localhost:5433/admin/
```

Importante:

- Sem `DATABASE_URL`, o backend usa as variaveis `POSTGRES_*`.
- Sem `CLOUDINARY_URL`, os arquivos vao para `media/` local.
- `docker compose down -v` remove banco e uploads locais. Use com cuidado.

## 11. Troubleshooting rapido

### Frontend nao faz login

Conferir:

```env
NEXT_PUBLIC_API_URL=https://URL-DO-BACKEND
CORS_ALLOWED_ORIGINS=https://URL-DO-FRONTEND
```

Use origem sem barra final.

### Backend falha ao subir por banco

Conferir `DATABASE_URL` com SSL habilitado, normalmente com `sslmode=require`.

### Fotos nao aparecem

Conferir `CLOUDINARY_URL`. Fotos antigas salvas apenas em `media/` local nao migram automaticamente para a Cloudinary.

### Admin retorna erro de host ou CSRF

Conferir:

```env
ALLOWED_HOSTS=...
CSRF_TRUSTED_ORIGINS=...
FRONTEND_URL=...
```

### Render tenta rodar `gunicorn app:app`

Corrigir manualmente no painel:

```text
Build Command: bash build.sh
Start Command: gunicorn gestao_escolar.wsgi:application --bind 0.0.0.0:$PORT
```

### Vercel tenta publicar a raiz Django

Corrigir projeto para:

```text
Root Directory: frontend
Framework Preset: Next.js
Install Command: npm ci
Build Command: npm run build
```

## 12. Checklist final de handoff tecnico

- [ ] Repositorio oficial definido.
- [ ] Billing e acessos das plataformas revisados.
- [ ] `DATABASE_URL` configurada e testada.
- [ ] `CLOUDINARY_URL` configurada e testada.
- [ ] Backend publicado com sucesso.
- [ ] Frontend publicado com sucesso.
- [ ] Conta admin criada.
- [ ] Smoke tests executados.
- [ ] Procedimento de rollback combinado.
- [ ] Responsaveis por operacao mensal identificados.
