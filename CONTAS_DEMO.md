# Contas Demo Para Apresentacao

Este projeto possui um comando para criar contas e dados de demonstracao no banco configurado.

## Quando Usar

Use em ambiente de prototipo, homologacao ou apresentacao para cliente.

Nao use essas credenciais padrao em producao real.

## Comando

Se sua instancia da Render tiver Shell, rode:

```bash
python manage.py seed_demo
```

Se sua instancia for Free e nao tiver Shell, configure as variaveis abaixo na Render e faca um novo deploy:

```env
SEED_DEMO=true
DEMO_PASSWORD=UmaSenhaForteAqui
```

O `build.sh` roda migrations e, quando `SEED_DEMO=true`, executa:

```bash
python manage.py seed_demo
```

Depois que os dados forem criados, voce pode deixar `SEED_DEMO=true` durante a fase de prototipo, porque o comando e idempotente e atualiza os dados demo. Para producao real, remova ou coloque:

```env
SEED_DEMO=false
```

Por padrao, ele cria/atualiza as contas com a senha:

```text
CaraDemo@2026
```

Para escolher outra senha:

```bash
python manage.py seed_demo --password "UmaSenhaForteAqui"
```

Ou defina a variavel na Render:

```env
DEMO_PASSWORD=UmaSenhaForteAqui
```

e rode:

```bash
python manage.py seed_demo
```

## Acessos Criados

```text
Admin:     admin.demo / CaraDemo@2026
Professor: prof.demo / CaraDemo@2026
Aluno:     aluno.demo / CaraDemo@2026
Lider:     lider.demo / CaraDemo@2026
```

Se voce usar `--password`, todos ficam com a senha escolhida.

## Dados Criados

O comando tambem cria:

- uma turma demo;
- professor vinculado a turma;
- dois alunos;
- um aluno lider;
- avaliacoes comportamentais;
- notas do primeiro bimestre;
- questoes;
- um simulado.

## URLs Para Teste

Frontend:

```text
https://sistemacara.vercel.app
```

Admin Django:

```text
https://URL-DO-BACKEND-RENDER/admin/
```

## Cuidados

Antes de entregar producao real:

- trocar senhas;
- remover usuarios demo se nao forem necessarios;
- remover/desativar `SEED_DEMO`;
- criar usuarios reais pelo admin;
- evitar compartilhar credenciais em documento publico;
- garantir que o cliente tenha uma conta admin propria.
