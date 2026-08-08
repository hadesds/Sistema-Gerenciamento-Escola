"""Helpers compartilhados pelos testes do app `escola`.

Centraliza a criação de usuários/perfis (admin, professor, aluno) usados em
quase todo teste de API ou de admin do Django, para não repetir esse
boilerplate em cada módulo.
"""
from django.contrib.auth.models import User
from rest_framework.test import APITestCase

from escola.models import Aluno, Materia, Professor, Turma


class BaseAPITestCase(APITestCase):
    """TestCase com um cenário básico (1 turma, 1 professor, 1 aluno, 1 admin)
    já montado em `setUp`, pronto para os testes de CRUD/permissão."""

    def setUp(self):
        super().setUp()

        self.turma = Turma.objects.create(nome='9º Ano A', serie='9º Ano', turno='M', sala='12')
        self.outra_turma = Turma.objects.create(nome='8º Ano B', serie='8º Ano', turno='T', sala='7')

        # A migração 0015_seed_disciplinas já popula as disciplinas oficiais
        # (incluindo MTM) — usamos get_or_create para não colidir com a seed.
        self.materia, _ = Materia.objects.get_or_create(sigla='MTM', defaults={'nome': 'Matemática'})

        self.professor_user = User.objects.create_user(
            username='professor1', password='SenhaForte123', first_name='Carla', last_name='Souza',
        )
        self.professor = Professor.objects.create(user=self.professor_user)
        self.professor.turmas.add(self.turma)

        self.outro_professor_user = User.objects.create_user(
            username='professor2', password='SenhaForte123', first_name='Bruno', last_name='Lima',
        )
        self.outro_professor = Professor.objects.create(user=self.outro_professor_user)
        self.outro_professor.turmas.add(self.outra_turma)

        # Aluno criado via API/admin real seta username=cpf e senha=data de
        # nascimento — aqui criamos o User manualmente e só then o Aluno,
        # então preenchemos os campos à mão para não depender desse side effect.
        self.aluno_user = User.objects.create_user(
            username='aluno1', password='SenhaForte123', first_name='João', last_name='Pereira',
        )
        self.aluno = Aluno.objects.create(user=self.aluno_user, turma=self.turma, cpf='11122233344')

        self.admin_user = User.objects.create_superuser(
            username='admin1', password='SenhaForte123', email='admin1@example.com',
        )

    def auth_as(self, user):
        self.client.force_authenticate(user=user)

    def auth_professor(self):
        self.auth_as(self.professor_user)

    def auth_aluno(self):
        self.auth_as(self.aluno_user)

    def auth_admin(self):
        self.auth_as(self.admin_user)
