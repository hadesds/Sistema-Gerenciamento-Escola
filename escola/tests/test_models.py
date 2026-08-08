"""Testes de unidade dos models: regras de negócio embutidas em save() e
constraints declaradas via Meta (unique_together)."""
from datetime import date

from django.contrib.auth.models import User
from django.db import IntegrityError, transaction
from django.test import TestCase

from escola.models import Aluno, NotaMateria, PerfilTurma, Turma


class AlunoSaveTests(TestCase):
    def test_criar_aluno_com_cpf_e_nascimento_define_login_e_senha(self):
        user = User.objects.create(username='temporario')
        aluno = Aluno.objects.create(
            user=user, cpf='123.456.789-00', data_nascimento=date(2010, 5, 20),
        )
        user.refresh_from_db()
        self.assertEqual(aluno.cpf, '12345678900')  # não-dígitos removidos
        self.assertEqual(user.username, '12345678900')
        self.assertTrue(user.check_password('20-05-2010'))

    def test_editar_aluno_existente_nao_reseta_login_e_senha(self):
        user = User.objects.create(username='original')
        aluno = Aluno.objects.create(user=user, cpf='11122233344', data_nascimento=date(2011, 1, 1))
        user.set_password('senha-trocada-manualmente')
        user.save()

        aluno.telefone = '11999999999'
        aluno.save()

        user.refresh_from_db()
        self.assertEqual(user.username, '11122233344')  # username já setado, mantém
        self.assertTrue(user.check_password('senha-trocada-manualmente'))  # não foi resetada

    def test_aluno_sem_cpf_ou_nascimento_nao_altera_credenciais(self):
        user = User.objects.create_user(username='ja-tem-login', password='senha-original')
        aluno = Aluno.objects.create(user=user)  # sem cpf/data_nascimento
        user.refresh_from_db()
        self.assertEqual(user.username, 'ja-tem-login')
        self.assertTrue(user.check_password('senha-original'))


class ConstraintsTests(TestCase):
    def setUp(self):
        self.turma = Turma.objects.create(nome='Turma X')
        self.aluno1 = Aluno.objects.create(user=User.objects.create(username='a1'), turma=self.turma)
        self.aluno2 = Aluno.objects.create(user=User.objects.create(username='a2'), turma=self.turma)

    def test_nao_permite_dois_lideres_na_mesma_turma(self):
        PerfilTurma.objects.create(aluno=self.aluno1, turma=self.turma, papel='lider')
        with self.assertRaises(IntegrityError):
            with transaction.atomic():
                PerfilTurma.objects.create(aluno=self.aluno2, turma=self.turma, papel='lider')

    def test_nao_permite_nota_duplicada_para_mesma_materia_epoca(self):
        NotaMateria.objects.create(aluno=self.aluno1, materia='matematica', nota=8, epoca='1B')
        with self.assertRaises(IntegrityError):
            with transaction.atomic():
                NotaMateria.objects.create(aluno=self.aluno1, materia='matematica', nota=9, epoca='1B')
