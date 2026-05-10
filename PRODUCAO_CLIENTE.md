# Guia de Producao e Entrega ao Cliente

Este documento descreve como entregar o Sistema CARA em producao para um cliente, quais contas o cliente deve possuir, quais custos ele deve assumir, como fica a arquitetura, quais cuidados operacionais existem e como resolver a integracao GitHub App da Vercel com o repositorio original.

## Estado Atual

Existem dois repositorios envolvidos na conversa:

- Repositorio original recomendado: `hadesds/Sistema-Gerenciamento-Escola`
- Repositorio criado/importado na Vercel: `davilslv/sistemacara`

Eles nao estao iguais. Na ultima verificacao:

```text
hadesds/Sistema-Gerenciamento-Escola main = 6a30758
davilslv/sistemacara main = 5512597
```

O deploy manual feito na Vercel usou o codigo local atualizado, entao o site publicado esta correto naquele momento. Porem, para manutencao e deploy automatico, isso nao basta. O projeto Vercel precisa estar conectado ao repositorio oficial que recebera os commits futuros.

Recomendacao:

```text
Usar hadesds/Sistema-Gerenciamento-Escola como repositorio oficial.
```

Se o cliente assumir o projeto, o ideal e transferir esse repositorio para uma organizacao GitHub do cliente, ou criar um novo repositorio oficial na organizacao dele e migrar o historico para la.

## Arquitetura Recomendada

Arquitetura atual de producao:

```text
Usuario
  -> Vercel: frontend Next.js
  -> Render: backend Django/DRF
  -> Neon: banco PostgreSQL
  -> Cloudinary: fotos/uploads
```

Responsabilidades:

- Vercel hospeda o frontend.
- Render hospeda a API Django e o admin Django.
- Neon armazena os dados relacionais.
- Cloudinary armazena fotos de alunos e outros uploads.
- GitHub guarda o codigo e dispara deploys automaticos.

Docker fica apenas para desenvolvimento local ou demonstracao offline. Ele nao deve ser usado para guardar fotos de producao.

## Por Que Nao Guardar Fotos no Docker

Containers sao descartaveis. Em redeploy, reinicio ou troca de instancia, arquivos salvos dentro do container podem sumir. Volumes resolvem parcialmente em maquina local, mas criam dependencia da plataforma e complicam backup/migracao.

Por isso:

- Banco: Neon.
- Fotos: Cloudinary.
- Codigo: GitHub.
- Aplicacao: Vercel + Render.

## Contas Que o Cliente Deve Ter

O cliente deve assumir a propriedade das contas e formas de pagamento:

- GitHub: repositorio oficial do sistema.
- Vercel: frontend.
- Render: backend.
- Neon: banco PostgreSQL.
- Cloudinary: armazenamento de imagens.
- Registro de dominio: por exemplo Registro.br, Cloudflare, GoDaddy ou similar.

Boa pratica:

- Criar uma organizacao no GitHub do cliente.
- Criar um time/projeto Vercel do cliente.
- Criar uma conta Render do cliente.
- Criar uma conta Neon do cliente.
- Criar uma conta Cloudinary do cliente.
- Usar e-mail institucional do cliente, nao e-mail pessoal do desenvolvedor.

## Custos Estimados

Precos podem mudar. Consulte sempre as paginas oficiais antes de fechar contrato:

- Vercel: https://vercel.com/pricing
- Render: https://render.com/pricing
- Neon: https://neon.com/pricing
- Cloudinary: https://cloudinary.com/pricing

### Cenario MVP / Baixo Trafego

Adequado para piloto, escola pequena ou validacao inicial.

```text
Vercel Pro:       US$ 20/mes por developer seat
Render Starter:  US$ 7/mes
Neon Launch:     ~US$ 15/mes, variavel por uso
Cloudinary Free: US$ 0/mes inicialmente
Dominio:         varia, normalmente pago anual
Total estimado:  ~US$ 42/mes + dominio
```

Observacao: Vercel Hobby e Render Free podem funcionar tecnicamente, mas nao sao recomendados para uso comercial/cliente real. Vercel Hobby e voltado a uso pessoal, e Render Free pode hibernar/ter limitacoes.

### Cenario Producao Basica

Mais adequado para cliente real, com mais previsibilidade e conta em nome do cliente.

```text
Vercel Pro:              US$ 20/mes por developer seat
Render Pro Workspace:    US$ 25/mes
Render Starter Service:  US$ 7/mes
Neon Launch:             ~US$ 15/mes, variavel por uso
Cloudinary Free:         US$ 0/mes inicialmente
Dominio:                 varia
Total estimado:          ~US$ 67/mes + dominio
```

### Cenario Com Mais Fotos/Arquivos

Se o uso de fotos crescer e passar do plano gratuito da Cloudinary:

```text
Cloudinary Plus: US$ 99/mes
Total estimado com Cloudinary Plus: ~US$ 141 a US$ 166/mes + dominio
```

### Custos Variaveis

Podem aumentar com:

- Muitos acessos ao frontend.
- Muitas requisicoes ao backend.
- Fotos grandes ou muitas visualizacoes de imagens.
- Crescimento do banco.
- Muitas pessoas com acesso de desenvolvedor na Vercel.
- Uso de logs/observabilidade pagos.

## Responsabilidades do Cliente

O cliente deve assumir:

- Pagamento das plataformas.
- Titularidade do dominio.
- Titularidade das contas.
- Definicao de usuarios administrativos.
- Politica de uso de dados dos alunos.
- Responsabilidade legal sobre dados pessoais.
- Backup e retencao conforme necessidade institucional.

O fornecedor/desenvolvedor pode assumir por contrato:

- Implantacao inicial.
- Manutencao corretiva.
- Evolucao funcional.
- Monitoramento.
- Suporte mensal.
- Treinamento de administradores.

## LGPD e Dados Escolares

O sistema pode armazenar dados de alunos, possivelmente menores de idade. Antes de producao real, tratar como dado sensivel do ponto de vista operacional.

Recomendacoes minimas:

- Usar HTTPS em todos os dominios.
- Senhas fortes para administradores.
- Acesso admin restrito.
- Principio do menor privilegio.
- Politica de privacidade.
- Registro de quem tem acesso administrativo.
- Processo para remover/exportar dados quando necessario.
- Backups e plano de restauracao.
- Evitar expor dados em logs.
- Nao compartilhar credenciais por WhatsApp ou documentos soltos.

## Variaveis de Ambiente de Producao

### Backend Render

Obrigatorias:

```env
DEBUG=False
SECRET_KEY=uma-chave-secreta-forte
DATABASE_URL=postgresql://...
CLOUDINARY_URL=cloudinary://API_KEY:API_SECRET@CLOUD_NAME
ALLOWED_HOSTS=.onrender.com,api.dominio-do-cliente.com.br
CORS_ALLOWED_ORIGINS=https://app.dominio-do-cliente.com.br
CORS_ALLOWED_ORIGIN_REGEXES=https://.*\.vercel\.app
CSRF_TRUSTED_ORIGINS=https://api.dominio-do-cliente.com.br,https://app.dominio-do-cliente.com.br
```

Enquanto nao houver dominio proprio:

```env
ALLOWED_HOSTS=.onrender.com,localhost,127.0.0.1
CORS_ALLOWED_ORIGINS=https://sistemacara.vercel.app
CSRF_TRUSTED_ORIGINS=https://*.onrender.com,https://*.vercel.app
```

### Frontend Vercel

Obrigatoria:

```env
NEXT_PUBLIC_API_URL=https://api.dominio-do-cliente.com.br
```

Enquanto nao houver dominio proprio:

```env
NEXT_PUBLIC_API_URL=https://url-do-backend.onrender.com
```

## Guia de Implementacao Para Cliente

### 1. Preparar o Repositorio Oficial

Escolher uma das opcoes:

1. Manter `hadesds/Sistema-Gerenciamento-Escola`.
2. Transferir esse repo para a organizacao GitHub do cliente.
3. Criar um novo repo oficial do cliente e migrar o historico.

Evitar manter dois repositorios ativos com conteudo divergente.

### 2. Criar Banco na Neon

1. Criar projeto Neon.
2. Criar banco de producao.
3. Copiar connection string pooled.
4. Configurar `DATABASE_URL` na Render.
5. Manter credencial fora do Git.

### 3. Configurar Cloudinary

1. Criar conta Cloudinary do cliente.
2. Copiar `CLOUDINARY_URL`.
3. Configurar na Render.
4. Testar upload de foto no admin.

### 4. Configurar Backend na Render

1. Criar Web Service ou Blueprint apontando para o repo oficial.
2. Root Directory: raiz do repositorio.
3. Build Command:

```bash
bash build.sh
```

4. Start Command:

```bash
gunicorn gestao_escolar.wsgi:application --bind 0.0.0.0:$PORT
```

5. Configurar env vars.
6. Deploy.
7. Verificar:

```text
https://api.../
https://api.../admin/
```

### 5. Configurar Frontend na Vercel

1. Criar/importar projeto Vercel apontando para o repo oficial.
2. Configurar:

```text
Root Directory: frontend
Framework Preset: Next.js
Install Command: npm ci
Build Command: npm run build
```

3. Configurar:

```env
NEXT_PUBLIC_API_URL=https://api...
```

4. Fazer deploy.
5. Testar login e navegacao.

### 6. Configurar Dominio

Sugestao:

```text
app.dominio.com.br -> Vercel
api.dominio.com.br -> Render
```

Depois atualizar env vars:

- Vercel: `NEXT_PUBLIC_API_URL`
- Render: `ALLOWED_HOSTS`
- Render: `CORS_ALLOWED_ORIGINS`
- Render: `CSRF_TRUSTED_ORIGINS`

### 7. Criar Superusuario

No shell da Render:

```bash
python manage.py createsuperuser
```

### 8. Checklist de Aceite

- [ ] Frontend abre no dominio correto.
- [ ] Backend responde no dominio correto.
- [ ] Admin Django abre.
- [ ] Superusuario entra no admin.
- [ ] Professor entra no sistema.
- [ ] Aluno entra no sistema.
- [ ] Fotos aparecem.
- [ ] Upload de foto funciona.
- [ ] Banco persiste apos redeploy.
- [ ] Deploy automatico funciona com push no GitHub.
- [ ] Cliente tem acesso e billing das plataformas.

## Como Resolver a Questao do GitHub App da Vercel

Problema observado:

```text
Failed to connect hadesds/Sistema-Gerenciamento-Escola to project.
Make sure there aren't any typos and that you have access to the repository if it's private.
```

Isso significa que a Vercel nao tem permissao para acessar o repositorio `hadesds/Sistema-Gerenciamento-Escola` pelo GitHub App.

### Caminho Pela Vercel

1. Acesse a Vercel com a conta que e dona do projeto.
2. Va em:

```text
Account Settings > Git Integrations
```

3. Em GitHub, clique em `Configure`.
4. O GitHub vai abrir a pagina do app da Vercel.
5. Escolha a conta/organizacao correta.
6. Em `Repository access`, selecione uma das opcoes:

```text
All repositories
```

ou:

```text
Only select repositories
```

7. Se escolher repositorios especificos, adicione:

```text
hadesds/Sistema-Gerenciamento-Escola
```

8. Salve a instalacao.
9. Volte para a Vercel.
10. Reconecte o projeto ao repo original.

### Caminho Pelo GitHub

1. Acesse GitHub.
2. Va em:

```text
Settings > Applications > Installed GitHub Apps
```

3. Encontre `Vercel`.
4. Clique em `Configure`.
5. Em `Repository access`, libere:

```text
hadesds/Sistema-Gerenciamento-Escola
```

6. Salve.
7. Volte para Vercel e tente conectar/importar novamente.

### Depois de Liberar Permissao

Na maquina local, dentro da raiz do repositorio, rode:

```bash
npx vercel link --yes --project sistemacara
npx vercel git connect https://github.com/hadesds/Sistema-Gerenciamento-Escola
```

Ou faca pelo painel:

```text
Vercel > Project > Settings > Git > Connected Git Repository
```

Conecte:

```text
hadesds/Sistema-Gerenciamento-Escola
```

Confira:

```text
Root Directory: frontend
Framework Preset: Next.js
Install Command: npm ci
Build Command: npm run build
```

### Se o Repo Original Nao Aparecer

Possiveis causas:

- A conta Vercel nao tem acesso ao repo.
- O GitHub App da Vercel nao foi instalado na organizacao certa.
- O repo e privado e nao foi selecionado na lista de repositorios permitidos.
- Voce esta logado na Vercel com outro usuario/time.
- O repo pertence a uma organizacao que exige permissao de administrador para instalar apps.

Solucao:

- Pedir para o dono/admin do repo ou organizacao GitHub liberar o app da Vercel.
- Ou transferir o repo para uma organizacao controlada pelo cliente.

## O Que Fazer Com `davilslv/sistemacara`

Esse repo pode ser:

1. Removido, se foi criado apenas por engano/import inicial.
2. Mantido como backup temporario.
3. Transformado no repo oficial, mas so se ele for atualizado com todo o conteudo do original.

Recomendacao:

```text
Nao usar dois repositorios oficiais.
```

Se ficar usando `davilslv/sistemacara`, qualquer correcao feita em `hadesds/Sistema-Gerenciamento-Escola` nao chegara automaticamente na Vercel.

## Operacao Mensal

Rotina recomendada:

- Verificar deploys da Vercel.
- Verificar deploys da Render.
- Verificar erros de login/API.
- Verificar consumo Neon.
- Verificar consumo Cloudinary.
- Fazer backup/export periodico quando necessario.
- Atualizar dependencias com cuidado.
- Testar fluxo principal apos cada deploy.

## Plano de Manutencao Sugerido

Para cliente real, vender manutencao mensal separada da infraestrutura.

Itens possiveis:

- Suporte tecnico.
- Pequenas correcoes.
- Monitoramento de deploy.
- Ajuste de usuarios.
- Atualizacoes de seguranca.
- Backup e verificacao mensal.
- Relatorio mensal simples de saude do sistema.

O custo da infraestrutura deve ser pago diretamente pelo cliente nas plataformas. O custo de manutencao e servico profissional deve ser contratado separadamente.
