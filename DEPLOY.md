# Deploy do Projeto CARA

## Banco Neon

- Projeto Neon criado: `projetocara`
- Project ID: `floral-sunset-47934317`
- Branch: `main`
- Branch ID: `br-soft-star-akmxr6fv`
- Database: `neondb`

Use a connection string pooled da Neon como `DATABASE_URL` no backend.
Nao salve essa URL no Git.

## Backend Render

Crie um Web Service usando o arquivo `render.yaml`.

Variaveis que precisam ser preenchidas no painel da Render:

- `DATABASE_URL`: connection string da Neon
- `CLOUDINARY_URL`: URL da Cloudinary no formato `cloudinary://API_KEY:API_SECRET@CLOUD_NAME`
- `CORS_ALLOWED_ORIGINS`: URL final do frontend, por exemplo `https://projetocara.vercel.app`

O blueprint ja define:

- Build command: `bash build.sh`
- Start command: `gunicorn gestao_escolar.wsgi:application`
- `DEBUG=False`
- `ALLOWED_HOSTS=.onrender.com,localhost,127.0.0.1`
- `CSRF_TRUSTED_ORIGINS=https://*.onrender.com,https://*.vercel.app`

Depois do primeiro deploy, copie a URL publica da Render.

## Frontend Vercel

No projeto Vercel `projetocara`, configure:

- Root Directory: `frontend`
- Framework Preset: `Next.js`
- Install Command: `npm ci`
- Build Command: `npm run build`
- Environment Variable: `NEXT_PUBLIC_API_URL=https://URL-DO-BACKEND-RENDER`

Depois que o backend estiver no ar, rode um novo deploy do frontend.

## Cloudinary

Com `CLOUDINARY_URL` configurada no backend, os uploads do campo `foto` passam a ir para a Cloudinary.
Sem essa variavel, o Django continua usando `media/` local para desenvolvimento.
