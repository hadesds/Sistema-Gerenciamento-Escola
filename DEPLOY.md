# Deploy do Projeto CARA

Este documento explica o que foi preparado no projeto, o que ainda precisa ser feito nos paineis da Neon, Cloudinary, Render e Vercel, e como voltar a usar Docker localmente caso seja necessario.

## Visao Geral

A arquitetura recomendada ficou assim:

- Frontend: Next.js hospedado na Vercel.
- Backend: Django/DRF hospedado na Render.
- Banco: PostgreSQL gerenciado na Neon.
- Fotos/uploads: Cloudinary.
- Docker: mantido apenas como ambiente local/opcional.

O motivo da separacao e simples: container nao e um bom lugar para guardar fotos em producao, porque redeploys e reinicios podem trocar ou apagar o filesystem local. Por isso o banco fica na Neon e os arquivos ficam na Cloudinary.

## O Que Foi Alterado

Arquivos principais:

- `gestao_escolar/settings.py`
  - Passou a ler `SECRET_KEY`, `DEBUG`, `ALLOWED_HOSTS`, CORS/CSRF e banco via variaveis de ambiente.
  - Passou a aceitar `DATABASE_URL` para usar Neon.
  - Adicionou WhiteNoise para servir arquivos estaticos.
  - Adicionou suporte opcional a Cloudinary quando `CLOUDINARY_URL` existir.
  - Manteve armazenamento local em `media/` quando `CLOUDINARY_URL` nao existir, util para desenvolvimento.

- `requirements.txt`
  - Adicionou `dj-database-url`, `gunicorn`, `whitenoise`, `cloudinary` e `django-cloudinary-storage`.

- `render.yaml`
  - Blueprint para criar o Web Service da Render.
  - Define build, start command e variaveis esperadas.

- `build.sh`
  - Instala dependencias.
  - Roda `collectstatic`.
  - Roda migrations.

- `Procfile`
  - Define start command generico para plataformas que leem Procfile.

- `frontend/src/lib/api.ts`
  - Centraliza `NEXT_PUBLIC_API_URL`.
  - Remove barra final da URL para evitar endpoints quebrados.

- `frontend/src/context/AuthContext.tsx` e `frontend/src/app/page.tsx`
  - Redirecionamento para `/admin/` agora usa a URL configurada da API.

- `frontend/next.config.js`
  - Permite imagens vindas do dominio configurado em `NEXT_PUBLIC_API_URL`.
  - Mantem `localhost` e `cara_app` para desenvolvimento local/Docker.

- `frontend/vercel.json`
  - Define comandos de install/build para a Vercel.

- `.env.example` e `frontend/.env.example`
  - Exemplos das variaveis necessarias.

- `.gitignore`
  - Impede commit de `.env`, `media/`, `staticfiles/`, caches e builds locais.

## Neon

Projeto criado:

- Nome: `projetocara`
- Project ID: `floral-sunset-47934317`
- Branch: `main`
- Branch ID: `br-soft-star-akmxr6fv`
- Database: `neondb`

O que fazer agora:

1. Entrar no painel da Neon.
2. Abrir o projeto `projetocara`.
3. Copiar a connection string pooled do banco.
4. Usar essa connection string como `DATABASE_URL` na Render.

Importante: nao coloque a connection string real no Git. Ela contem usuario e senha.

Formato esperado:

```env
DATABASE_URL=postgresql://USUARIO:SENHA@HOST/neondb?sslmode=require
```

## Cloudinary

O que fazer agora:

1. Entrar no painel da Cloudinary.
2. Copiar a `CLOUDINARY_URL`.
3. Configurar essa URL na Render como variavel de ambiente.

Formato esperado:

```env
CLOUDINARY_URL=cloudinary://API_KEY:API_SECRET@CLOUD_NAME
```

Com isso, novas fotos enviadas pelo Django passam a ser salvas na Cloudinary. Sem essa variavel, o Django salva em `media/` local, o que serve para desenvolvimento, mas nao para producao.

## Render

Use a Render para publicar o backend Django.

### Caminho Recomendado

1. No painel da Render, criar um novo Blueprint ou Web Service a partir do repo:

```text
https://github.com/hadesds/Sistema-Gerenciamento-Escola
```

2. Se usar Blueprint, a Render deve detectar `render.yaml`.

3. Confirmar as configuracoes:

```text
Service name: projetocara-api
Runtime: Python
Build command: bash build.sh
Start command: gunicorn gestao_escolar.wsgi:application --bind 0.0.0.0:$PORT
Python version: 3.11.9
```

4. Configurar as variaveis:

```env
DEBUG=False
DATABASE_URL=connection-string-da-neon
CLOUDINARY_URL=cloudinary://API_KEY:API_SECRET@CLOUD_NAME
CORS_ALLOWED_ORIGINS=https://projetocara.vercel.app
```

O `render.yaml` ja define:

```env
PYTHON_VERSION=3.11.9
ALLOWED_HOSTS=.onrender.com,localhost,127.0.0.1
CORS_ALLOWED_ORIGIN_REGEXES=https://.*\.vercel\.app
CSRF_TRUSTED_ORIGINS=https://*.onrender.com,https://*.vercel.app
```

5. Fazer deploy.

6. Aguardar a Render rodar:

```text
pip install -r requirements.txt
python manage.py collectstatic --noinput --clear
python manage.py migrate
gunicorn gestao_escolar.wsgi:application --bind 0.0.0.0:$PORT
```

7. Copiar a URL publica do backend, algo como:

```text
https://projetocara-api.onrender.com
```

8. Testar no navegador:

```text
https://projetocara-api.onrender.com/
https://projetocara-api.onrender.com/admin/
```

Se `/` retornar a mensagem da API, o backend subiu.

## Vercel

Use a Vercel para publicar o frontend Next.js.

Voce comentou que ja criou um projeto chamado `projetocara`. Configure ele assim:

```text
Root Directory: frontend
Framework Preset: Next.js
Install Command: npm ci
Build Command: npm run build
Output Directory: deixar padrao
```

Variavel obrigatoria:

```env
NEXT_PUBLIC_API_URL=https://URL-DO-BACKEND-RENDER
```

Exemplo:

```env
NEXT_PUBLIC_API_URL=https://projetocara-api.onrender.com
```

Depois de configurar a variavel:

1. Rodar redeploy na Vercel.
2. Abrir a URL da Vercel.
3. Testar login.
4. Testar redirecionamento de admin para `/admin/` no backend.
5. Testar exibicao de fotos.

## Ordem Correta Para Tudo Rodar

1. Confirmar que a branch `main` esta atualizada no GitHub.
2. No Cloudinary, copiar `CLOUDINARY_URL`.
3. No Neon, copiar `DATABASE_URL`.
4. Na Render, criar o backend usando `render.yaml`.
5. Na Render, preencher `DATABASE_URL`, `CLOUDINARY_URL` e `CORS_ALLOWED_ORIGINS`.
6. Esperar deploy do backend terminar.
7. Abrir a URL do backend e testar `/`.
8. Na Vercel, configurar `Root Directory = frontend`.
9. Na Vercel, configurar `NEXT_PUBLIC_API_URL` com a URL da Render.
10. Redeploy da Vercel.
11. Testar o sistema completo.

## Criar Superusuario Em Producao

Depois que o backend estiver publicado e conectado na Neon, crie um superusuario pelo shell da Render.

No shell/console da Render, rode:

```bash
python manage.py createsuperuser
```

Depois acesse:

```text
https://URL-DO-BACKEND-RENDER/admin/
```

Se estiver usando instancia Free da Render, o Shell pode nao estar disponivel. Para prototipo, use o comando de seed automatico:

```env
SEED_DEMO=true
DEMO_PASSWORD=UmaSenhaForteAqui
```

Depois faca um novo deploy. O build executara `python manage.py seed_demo` apos as migrations e criara contas demo, incluindo um admin.

Para producao real, remova ou desative:

```env
SEED_DEMO=false
```

## Variaveis De Ambiente

### Backend

Obrigatorias em producao:

```env
DEBUG=False
SECRET_KEY=gerada-pela-render-ou-manual
DATABASE_URL=postgresql://...
ALLOWED_HOSTS=.onrender.com,localhost,127.0.0.1
CORS_ALLOWED_ORIGINS=https://projetocara.vercel.app
CORS_ALLOWED_ORIGIN_REGEXES=https://.*\.vercel\.app
CSRF_TRUSTED_ORIGINS=https://*.onrender.com,https://*.vercel.app
CLOUDINARY_URL=cloudinary://...
```

### Frontend

Obrigatoria em producao:

```env
NEXT_PUBLIC_API_URL=https://URL-DO-BACKEND-RENDER
```

## Como Usar Docker Se Necessario

Docker continua funcionando como ambiente local. Ele nao deve ser usado para guardar fotos em producao, mas pode ser usado para desenvolver, testar ou apresentar o projeto localmente.

### Criar `.env` Local

Crie um arquivo `.env` na raiz do projeto com valores locais:

```env
DEBUG=True
POSTGRES_DB=cara_escola
POSTGRES_USER=django_user
POSTGRES_PASSWORD=Cara2025.
POSTGRES_HOST=db
POSTGRES_PORT=5432
```

Nao coloque `DATABASE_URL` nesse `.env` local se quiser usar o Postgres do Docker. Sem `DATABASE_URL`, o Django usa as variaveis `POSTGRES_*`.

### Subir Tudo Com Docker

Na raiz do projeto:

```bash
docker compose up --build
```

Servicos locais:

```text
Frontend: http://localhost:3000
Backend/API: http://localhost:5433
Admin Django: http://localhost:5433/admin/
Postgres Docker: db:5432 dentro da rede Docker
```

### Onde As Fotos Ficam No Docker

No `docker-compose.yml`, o backend monta:

```yaml
volumes:
  - media_root:/app/media
```

Isso cria um volume Docker chamado `media_root`. Ele persiste enquanto o volume existir na maquina local.

Para listar volumes:

```bash
docker volume ls
```

Para apagar tudo do Docker local, incluindo fotos e banco local, use com cuidado:

```bash
docker compose down -v
```

Esse comando remove os volumes `postgres_data` e `media_root`.

### Quando Usar Docker

Use Docker para:

- Desenvolvimento local.
- Testes rapidos com Postgres local.
- Apresentacao local sem depender da internet.
- Reproduzir o ambiente antigo.

Nao use Docker local para:

- Guardar fotos de producao.
- Substituir Cloudinary.
- Substituir Neon.
- Fazer deploy na Vercel.

## Troubleshooting

### Frontend nao consegue fazer login

Verifique na Vercel:

```env
NEXT_PUBLIC_API_URL=https://URL-DO-BACKEND-RENDER
```

Verifique na Render:

```env
CORS_ALLOWED_ORIGINS=https://URL-DA-VERCEL
```

Depois faca redeploy do frontend.

Importante: em `CORS_ALLOWED_ORIGINS`, use a origem sem barra final:

```env
CORS_ALLOWED_ORIGINS=https://sistemacara.vercel.app
```

Evite:

```env
CORS_ALLOWED_ORIGINS=https://sistemacara.vercel.app/
```

### Erro de banco no backend

Verifique:

```env
DATABASE_URL=postgresql://...
```

A URL da Neon precisa ter SSL habilitado, normalmente com:

```text
sslmode=require
```

### Fotos nao aparecem

Verifique:

```env
CLOUDINARY_URL=cloudinary://...
```

Novas fotos devem ir para a Cloudinary. Fotos antigas que estavam em `media/` local nao vao aparecer automaticamente na producao, a menos que sejam reenviadas ou migradas para a Cloudinary.

### Admin nao abre

Verifique:

```env
ALLOWED_HOSTS=.onrender.com,localhost,127.0.0.1
CSRF_TRUSTED_ORIGINS=https://*.onrender.com,https://*.vercel.app
```

Depois rode novo deploy na Render.

### Render tenta rodar `gunicorn app:app`

Esse erro indica que a Render criou o servico com o comando padrao errado, geralmente de Flask:

```text
ModuleNotFoundError: No module named 'app'
```

Corrija no painel da Render:

```text
Build Command: bash build.sh
Start Command: gunicorn gestao_escolar.wsgi:application --bind 0.0.0.0:$PORT
```

Tambem confira:

```text
Root Directory: vazio / raiz do repositorio
PYTHON_VERSION: 3.11.9
```

Depois clique em `Manual Deploy` e use `Clear build cache & deploy`.

### `collectstatic` falha em arquivo do Cloudinary/WhiteNoise

Erro parecido:

```text
FileNotFoundError: staticfiles/cloudinary/js/jquery.ui.widget.js
```

O projeto foi ajustado para usar `StaticFilesStorage` no build da Render e evitar a etapa de compressao/manifest que falhava nesse arquivo do pacote Cloudinary. O `build.sh` tambem usa:

```bash
python manage.py collectstatic --noinput --clear
```

Depois de atualizar a branch `main`, rode na Render:

```text
Manual Deploy > Clear build cache & deploy
```

### Build do frontend falha por versao local

O `package.json` e o `package-lock.json` apontam para Next 15. Na Vercel, o comando correto e:

```bash
npm ci
```

Isso ignora `node_modules` local e instala exatamente pelo lockfile.

### Vercel tenta publicar Django em vez do frontend

Erro parecido:

```text
Error: No django entrypoint found.
```

Isso acontece quando a Vercel esta usando a raiz do repositorio como projeto. Como este repo tem Django na raiz e Next.js dentro de `frontend`, a Vercel precisa estar configurada assim:

```text
Root Directory: frontend
Framework Preset: Next.js
Install Command: npm ci
Build Command: npm run build
```

Tambem confira se o projeto da Vercel esta conectado ao repositorio correto. Se ela mostrar algo como:

```text
Cloning github.com/davilslv/sistemacara
```

mas o deploy deve vir de:

```text
github.com/hadesds/Sistema-Gerenciamento-Escola
```

entao remova esse projeto da Vercel ou reconecte o projeto ao repositorio correto. Se voce quiser continuar usando `davilslv/sistemacara`, garanta que esse repo tambem tenha a pasta `frontend` e configure `Root Directory: frontend`.

## Checklist Final

- [ ] Neon criado e `DATABASE_URL` copiada.
- [ ] Cloudinary criado e `CLOUDINARY_URL` copiada.
- [ ] Backend Render publicado.
- [ ] Migrations rodaram no build da Render.
- [ ] Superusuario criado.
- [ ] Frontend Vercel com `Root Directory = frontend`.
- [ ] Vercel com `NEXT_PUBLIC_API_URL` apontando para Render.
- [ ] Login testado.
- [ ] Admin testado.
- [ ] Fotos testadas.
