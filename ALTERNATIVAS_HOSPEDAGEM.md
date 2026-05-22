# Estudo de Alternativas de Hospedagem do CARA

Este documento foi criado para estudo interno da equipe. O objetivo e comparar alternativas de infraestrutura para reduzir custo sem perder de vista risco operacional, esforco tecnico e adequacao ao momento atual do projeto.

## 1. Resumo executivo

Hoje, o maior custo da arquitetura nao vem do banco ou do storage de imagens. O maior impacto financeiro vem da combinacao de frontend em PaaS dedicado e backend em PaaS dedicado.

A conclusao mais importante deste estudo e:

1. Usar Docker, por si so, nao reduz custo.
2. O custo cai quando a equipe troca PaaS gerenciado por VPS e consolida frontend e backend no mesmo servidor.
3. A alternativa mais equilibrada para o CARA, neste momento, e um VPS unico com Docker para frontend e backend, mantendo Neon e Cloudinary.
4. A alternativa mais barata possivel e um VPS unico com Docker, Postgres local e arquivos locais, mas isso transfere quase toda a responsabilidade operacional para a equipe.

## 2. Arquitetura atual

Arquitetura de referencia atualmente planejada:

```text
Frontend Next.js -> Vercel
Backend Django/DRF -> Render
Banco PostgreSQL -> Neon
Uploads e imagens -> Cloudinary
Codigo -> GitHub
```

Estimativa base usada nos documentos atuais:

```text
Vercel Pro       = US$ 20/mes
Render Starter   = US$ 7/mes
Neon Launch      = US$ 15/mes
Cloudinary Free  = US$ 0/mes
GitHub Free      = US$ 0/mes
Total            = US$ 42/mes
```

Com cambio de referencia de `US$ 1 ~= R$ 5,60`:

```text
Total estimado = R$ 235,20/mes
```

## 3. O que o projeto atual ja suporta

Pelo estado atual do repositorio, o projeto ja esta relativamente perto de um deploy em VPS com Docker.

### O que ja existe hoje

- container Docker para o backend Django;
- container Docker para o frontend Next.js;
- fallback para Postgres local quando `DATABASE_URL` nao e informado;
- fallback para armazenamento local de arquivos quando `CLOUDINARY_URL` nao e informado;
- build de frontend preparado para execucao em modo de producao;
- build script do backend com `collectstatic`, migrations e seed demo opcional.

### O que ainda nao esta pronto para producao em VPS

- o `docker-compose.yml` atual e de desenvolvimento, nao de producao;
- o backend ainda esta configurado com `runserver` nesse compose;
- o frontend ainda sobe com `npm run dev` nesse compose;
- nao existe ainda um proxy reverso de producao para HTTPS, dominio e roteamento;
- se os uploads ficarem locais, sera necessario servir `/media` fora do modo `DEBUG`;
- nao existe ainda rotina operacional documentada de backup em VPS proprio.

## 4. Criterios de comparacao

Para estudar as alternativas, a equipe deve comparar cada opcao em cinco dimensoes:

1. Custo mensal.
2. Complexidade de implantacao.
3. Complexidade de operacao mensal.
4. Risco de indisponibilidade ou perda de dados.
5. Capacidade de a equipe manter o ambiente sem sobrecarga.

## 5. Alternativas estudadas

### 5.1. Alternativa A: manter a arquitetura atual

### Desenho

```text
Vercel + Render + Neon + Cloudinary
```

### Faixa de custo

```text
US$ 42/mes
R$ 235,20/mes
```

### Vantagens

- menor esforco operacional;
- SSL, deploy e observabilidade basica ja vem prontos nas plataformas;
- banco continua gerenciado;
- uploads continuam externos e mais seguros;
- rollback e redeploy tendem a ser mais simples.

### Desvantagens

- custo mais alto para o porte atual do sistema;
- frontend e backend ficam espalhados em plataformas diferentes;
- parte do custo atual existe para comprar conveniencia operacional que talvez ainda nao seja necessaria para uma escola pequena.

### Quando faz sentido

- se o cliente priorizar previsibilidade;
- se a equipe quiser reduzir ao maximo manutencao de infraestrutura;
- se o sistema precisar entrar em producao muito rapido com menor mudanca tecnica.

### 5.2. Alternativa B: VPS unico com Docker, mantendo Neon e Cloudinary

### Desenho

```text
Frontend Next.js em container
Backend Django em container
Proxy reverso em container
Banco PostgreSQL -> Neon
Uploads -> Cloudinary
```

### Faixa de custo de servidor

Exemplos de servidores de entrada consultados em 22/05/2026:

- Hetzner Cloud: compartilhado a partir de cerca de `EUR 4,49` a `EUR 6,49/mes`, com opcao ainda mais barata em perfil especifico a `EUR 3,99/mes`.
- DigitalOcean Basic Droplets: `US$ 6/mes` para 1 GB e `US$ 12/mes` para 2 GB.
- AWS Lightsail: `US$ 5/mes` para 0,5 GB, `US$ 7/mes` para 1 GB e `US$ 12/mes` para 2 GB.

Para o CARA, o minimo prudente e estudar um VPS de classe 2 GB para cima quando frontend e backend rodarem juntos.

### Faixa de custo total estimada

Considerando VPS pequeno + Neon Launch + Cloudinary Free:

```text
Faixa provavel = US$ 22 a US$ 27/mes
Faixa em BRL   = R$ 123,20 a R$ 151,20/mes
```

Se o servidor escolhido for em euro, o valor final varia com o cambio do periodo.

### Vantagens

- reduz significativamente o custo total;
- mantem banco gerenciado, que e uma das partes mais sensiveis da operacao;
- mantem Cloudinary, entao uploads continuam fora do servidor;
- reduz a dispersao da arquitetura;
- continua compativel com a arquitetura atual do projeto sem refatoracao grande.

### Desvantagens

- exige montar compose de producao;
- exige configurar proxy reverso, SSL e deploy no VPS;
- exige manter sistema operacional, Docker, firewall e logs do servidor;
- a equipe perde parte da conveniencia nativa de Vercel e Render.

### Impacto tecnico no projeto

Necessario preparar pelo menos:

1. Um `docker-compose` de producao.
2. Backend com Gunicorn em vez de `runserver`.
3. Frontend com `next start` em vez de `npm run dev`.
4. Proxy reverso com Caddy ou Nginx.
5. Pipeline de deploy por `git pull`, CI/CD simples ou Coolify.

### Nivel de risco

Baixo a medio, desde que a equipe saiba operar um VPS Linux.

### Leitura pratica

Esta e a melhor alternativa para cortar custo sem derrubar demais a seguranca operacional.

### 5.3. Alternativa C: VPS unico com Docker e Coolify, mantendo Neon e Cloudinary

### Desenho

```text
Coolify no VPS
  -> frontend em container
  -> backend em container
Banco PostgreSQL -> Neon
Uploads -> Cloudinary
```

### Observacao importante

Coolify e open-source, self-hosted e sem custo de licenca obrigatoria. O custo principal continua sendo o VPS.

### Faixa de custo total estimada

Muito parecida com a alternativa B, mas em alguns casos o servidor pode precisar de um pouco mais de folga para hospedar o proprio painel do Coolify.

```text
Faixa provavel = US$ 22 a US$ 35/mes
Faixa em BRL   = R$ 123,20 a R$ 196,00/mes
```

### Vantagens

- custo ainda bem menor que a arquitetura atual;
- push-to-deploy mais proximo da experiencia de um PaaS;
- SSL automatico e melhor ergonomia operacional;
- reduz a necessidade de fazer tudo manualmente por SSH;
- pode facilitar o fluxo da equipe quando houver mais de um desenvolvedor.

### Desvantagens

- adiciona uma camada extra para a equipe aprender;
- ainda continua sendo responsabilidade da equipe cuidar do VPS;
- se o servidor for muito pequeno, o painel pode competir por recursos com a aplicacao.

### Nivel de risco

Baixo a medio, mas com melhor experiencia operacional do que um VPS totalmente manual.

### Leitura pratica

Boa opcao se voces querem economizar, mas nao querem voltar para um processo muito artesanal de deploy.

### 5.4. Alternativa D: VPS unico com Docker, Postgres local e Cloudinary

### Desenho

```text
Frontend Next.js em container
Backend Django em container
Postgres em container no proprio VPS
Uploads -> Cloudinary
```

### Faixa de custo total estimada

```text
Faixa provavel = US$ 7 a US$ 15/mes
Faixa em BRL   = R$ 39,20 a R$ 84,00/mes
```

Pode haver custo adicional de snapshot, backup externo ou armazenamento extra, dependendo do provedor.

### Vantagens

- corte de custo mais agressivo sem mexer no fluxo de imagens;
- elimina o custo mensal da Neon;
- continua aproveitando Docker para padronizar deploy.

### Desvantagens

- o banco deixa de ser gerenciado;
- backup, restore, tuning e atualizacao de Postgres passam para a equipe;
- uma falha no servidor afeta aplicacao e banco ao mesmo tempo;
- o nivel de responsabilidade operacional sobe bastante.

### Nivel de risco

Medio a alto.

### Leitura pratica

Financeiramente e atraente, mas so vale se voces aceitarem assumir a operacao de banco com disciplina real de backup.

### 5.5. Alternativa E: VPS unico com Docker, Postgres local e arquivos locais

### Desenho

```text
Frontend Next.js em container
Backend Django em container
Postgres em container no proprio VPS
Uploads em volume local no proprio VPS
```

### Faixa de custo total estimada

```text
Faixa provavel = US$ 7 a US$ 15/mes
Faixa em BRL   = R$ 39,20 a R$ 84,00/mes
```

Na pratica, o custo puro pode parecer quase igual ao da alternativa D, mas a equipe deve considerar algum custo adicional de backup externo. Sem isso, a economia fica artificial.

### Vantagens

- menor custo mensal recorrente;
- arquitetura simples de entender;
- tudo fica centralizado em um unico servidor.

### Desvantagens

- maior concentracao de risco;
- banco e arquivos ficam expostos ao mesmo ponto unico de falha;
- exigira proxy reverso ou configuracao complementar para servir arquivos locais em producao;
- qualquer problema de disco, servidor ou configuracao afeta tudo ao mesmo tempo.

### Nivel de risco

Alto.

### Leitura pratica

E a opcao mais barata, mas tambem a que menos combina com uma entrega profissional para cliente se nao houver rotina solida de backup, snapshot e restauracao.

### 5.6. Alternativa F: usar planos gratuitos ou quase gratuitos das plataformas atuais

### Desenho

```text
Tentar manter Vercel/Render/Neon em tiers free ou equivalentes
```

### Vantagens

- menor mudanca tecnica;
- quase nenhum retrabalho de infraestrutura.

### Desvantagens

- hibernacao, limites de uso ou restricoes de uso comercial podem aparecer;
- risco de surpresa em indisponibilidade e performance;
- passa imagem menos profissional em entrega ao cliente;
- a economia existe, mas com pouca previsibilidade.

### Nivel de risco

Medio a alto para cliente real.

### Leitura pratica

Pode servir para piloto interno, homologacao ou demonstracao. Nao e a melhor base para contrato com cliente real.

## 6. Tabela comparativa consolidada

| Alternativa | Custo mensal estimado | Complexidade tecnica | Risco operacional | Observacao principal |
| --- | --- | --- | --- | --- |
| A. PaaS atual | US$ 42 | Baixa | Baixo | Mais simples, porem mais caro |
| B. VPS + Docker + Neon + Cloudinary | US$ 22 a 27 | Media | Baixo a medio | Melhor equilibrio entre custo e seguranca |
| C. VPS + Coolify + Neon + Cloudinary | US$ 22 a 35 | Media | Baixo a medio | Boa experiencia operacional com custo menor |
| D. VPS + Docker + Postgres local + Cloudinary | US$ 7 a 15 | Media a alta | Medio a alto | Economia forte, mas banco passa a ser responsabilidade da equipe |
| E. VPS + Docker + Postgres local + arquivos locais | US$ 7 a 15 | Alta | Alto | Mais barato, porem com maior ponto unico de falha |
| F. Tiers gratuitos atuais | muito variavel | Baixa | Medio a alto | Bom para piloto, fraco para entrega comercial |

## 7. Comparacao por criterio

### Menor custo puro

As alternativas D e E vencem no papel.

### Melhor relacao custo x risco

A alternativa B vence.

### Melhor experiencia de deploy para a equipe

As alternativas A e C sao as mais confortaveis.

### Menor esforco de mudanca tecnica imediata

A alternativa A vence.

### Menor dependencia de fornecedores PaaS

As alternativas B, C, D e E vencem.

## 8. O que muda tecnicamente se a equipe escolher VPS

Se a equipe migrar para VPS, algumas entregas tecnicas deixam de ser opcionais.

### Itens obrigatorios

1. Criar `docker-compose` de producao separado do atual.
2. Definir proxy reverso com HTTPS.
3. Trocar o comando do backend para Gunicorn.
4. Subir o frontend em modo de producao.
5. Configurar politicas minimas de backup.
6. Configurar reinicio automatico dos containers.
7. Fechar portas e firewall do servidor.

### Itens obrigatorios se o banco ficar local

1. Backup automatico diario.
2. Teste de restauracao periodico.
3. Snapshot antes de migrations relevantes.
4. Monitoramento de disco e memoria.

### Itens obrigatorios se os arquivos ficarem locais

1. Volume persistente bem definido.
2. Servir `media/` corretamente em producao.
3. Rotina de backup dos uploads.

## 9. Recomendacao estrategica para o CARA

Para o contexto atual do projeto, a recomendacao estrategica e separar a decisao em dois niveis.

### Se a prioridade for entregar neste mes com menos risco

Ficar na arquitetura atual ou migrar apenas para a alternativa B.

### Se a prioridade for reduzir custo sem cair em operacao fragil

Escolher a alternativa B: VPS unico com Docker, mantendo Neon e Cloudinary.

### Se a prioridade for reduzir o maximo possivel, mesmo assumindo mais responsabilidade

Escolher a alternativa D: VPS unico com Docker e Postgres local, mantendo Cloudinary.

### O que eu nao recomendaria como primeira escolha para cliente real

1. Abandonar Cloudinary e Neon ao mesmo tempo sem antes estruturar backup.
2. Confiar em tiers gratuitos como base de contrato.
3. Rodar producao no `docker-compose` atual sem separar ambiente de desenvolvimento e producao.

## 10. Caminho sugerido de decisao

Se a equipe quiser tomar a decisao com criterio, o caminho mais pragmatico e:

1. Confirmar o teto mensal de infraestrutura que a escola realmente aceita.
2. Decidir se a equipe quer ou nao operar banco proprio.
3. Decidir se a equipe quer deploy manual em VPS ou algum painel como Coolify.
4. Se o teto estiver na faixa de `R$ 120 a R$ 160/mes`, ir para a alternativa B.
5. Se o teto estiver abaixo de `R$ 100/mes`, avaliar seriamente a alternativa D, mas apenas com backup automatico e teste de restore.

## 11. Conclusao final

Existe, sim, alternativa mais barata dada a arquitetura atual do CARA. A principal delas e consolidar frontend e backend em um VPS com Docker. O projeto ja esta perto desse caminho.

O ponto central nao e simplesmente usar Docker. O ponto central e decidir quanto da operacao voces querem internalizar.

Em termos de equilibrio entre custo, maturidade tecnica e risco para cliente real, a melhor alternativa hoje e:

```text
VPS unico + Docker + Neon + Cloudinary
```

Se a equipe quiser ir alem na reducao de custo, o proximo passo natural e:

```text
VPS unico + Docker + Postgres local + Cloudinary
```

Ir alem disso ainda e possivel, mas aumenta de forma clara o risco operacional e a responsabilidade da equipe na entrega.

## 12. Premissas deste estudo

- Data-base das referencias: 22/05/2026.
- Cambio de referencia para USD: `US$ 1 ~= R$ 5,60`.
- Valores em euro podem oscilar e nao foram convertidos aqui para evitar falsa precisao.
- Faixas de custo sao estimativas para discussao interna, nao proposta comercial final.
- Antes de fechar contrato, os precos devem ser conferidos nas paginas oficiais dos provedores escolhidos.