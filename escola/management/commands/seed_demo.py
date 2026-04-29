import os

from django.contrib.auth.models import User
from django.core.management.base import BaseCommand
from django.db import transaction

from escola.models import (
    Aluno,
    Avaliacao,
    NotaMateria,
    PerfilTurma,
    Professor,
    Questao,
    Simulado,
    Turma,
)


class Command(BaseCommand):
    help = "Cria contas e dados demonstrativos para apresentacao do Sistema CARA."

    def add_arguments(self, parser):
        parser.add_argument(
            "--password",
            default=os.environ.get("DEMO_PASSWORD", "CaraDemo@2026"),
            help="Senha usada nas contas demo. Tambem pode ser definida por DEMO_PASSWORD.",
        )

    @transaction.atomic
    def handle(self, *args, **options):
        password = options["password"]

        self._upsert_user(
            username="admin.demo",
            password=password,
            first_name="Admin",
            last_name="Demo",
            email="admin.demo@cara.local",
            is_staff=True,
            is_superuser=True,
        )

        professor_user = self._upsert_user(
            username="prof.demo",
            password=password,
            first_name="Mariana",
            last_name="Oliveira",
            email="prof.demo@cara.local",
        )
        professor, _ = Professor.objects.get_or_create(user=professor_user)

        turma, _ = Turma.objects.update_or_create(
            nome="Turma Demo 9A",
            defaults={"serie": "9o Ano", "turno": "M", "sala": "Sala 12"},
        )
        professor.turmas.add(turma)

        alunos = [
            self._create_aluno(
                username="aluno.demo",
                first_name="Lucas",
                last_name="Santos",
                email="aluno.demo@cara.local",
                matricula="DEMO-001",
                turma=turma,
                password=password,
            ),
            self._create_aluno(
                username="lider.demo",
                first_name="Ana",
                last_name="Costa",
                email="lider.demo@cara.local",
                matricula="DEMO-002",
                turma=turma,
                password=password,
            ),
        ]

        PerfilTurma.objects.filter(turma=turma, papel="lider").exclude(aluno=alunos[1]).delete()
        PerfilTurma.objects.update_or_create(
            aluno=alunos[1],
            defaults={"turma": turma, "papel": "lider"},
        )

        for aluno in alunos:
            Avaliacao.objects.get_or_create(
                aluno=aluno,
                professor=professor,
                defaults={
                    "assiduidade": 5,
                    "participacao": 4,
                    "responsabilidade": 5,
                    "sociabilidade": 4,
                },
            )

            for materia, nota in [
                ("portugues", 8.5),
                ("matematica", 9.0),
                ("ciencias", 8.0),
                ("historia", 8.8),
            ]:
                NotaMateria.objects.update_or_create(
                    aluno=aluno,
                    materia=materia,
                    epoca="1B",
                    defaults={"professor": professor, "nota": nota},
                )

        questoes = [
            self._upsert_questao(
                professor=professor,
                materia="Matematica",
                dificuldade="facil",
                enunciado="Quanto e 12 x 8?",
                resposta="96",
            ),
            self._upsert_questao(
                professor=professor,
                materia="Portugues",
                dificuldade="medio",
                enunciado="Identifique o sujeito da frase: A turma apresentou o trabalho.",
                resposta="A turma",
            ),
            self._upsert_questao(
                professor=professor,
                materia="Ciencias",
                dificuldade="medio",
                enunciado="Qual e a funcao principal das raizes em uma planta?",
                resposta="Absorver agua e nutrientes e ajudar na fixacao da planta.",
            ),
        ]

        simulado = Simulado.objects.filter(autor=professor, turma_alvo=turma).first()
        if not simulado:
            simulado = Simulado.objects.create(autor=professor, turma_alvo=turma)
        simulado.questoes.set(questoes)

        self.stdout.write(self.style.SUCCESS("Dados demo criados/atualizados com sucesso."))
        self.stdout.write("")
        self.stdout.write("Acessos para demonstracao:")
        self.stdout.write(f"  Admin:     admin.demo / {password}")
        self.stdout.write(f"  Professor: prof.demo / {password}")
        self.stdout.write(f"  Aluno:     aluno.demo / {password}")
        self.stdout.write(f"  Lider:     lider.demo / {password}")
        self.stdout.write("")
        self.stdout.write("Troque/remova essas senhas antes de uma producao real.")

    def _upsert_user(self, username, password, **defaults):
        user, _ = User.objects.update_or_create(
            username=username,
            defaults=defaults,
        )
        user.set_password(password)
        user.save()
        return user

    def _create_aluno(self, username, first_name, last_name, email, matricula, turma, password):
        user = self._upsert_user(
            username=username,
            password=password,
            first_name=first_name,
            last_name=last_name,
            email=email,
        )
        aluno, _ = Aluno.objects.update_or_create(
            user=user,
            defaults={"matricula": matricula, "turma": turma},
        )
        return aluno

    def _upsert_questao(self, professor, materia, dificuldade, enunciado, resposta):
        questao, _ = Questao.objects.update_or_create(
            autor=professor,
            enunciado=enunciado,
            defaults={
                "materia": materia,
                "dificuldade": dificuldade,
                "resposta": resposta,
            },
        )
        return questao
