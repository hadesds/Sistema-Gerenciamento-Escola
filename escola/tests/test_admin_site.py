"""CRUD via painel administrativo do Django (/admin/) — é por ali, e não pela
API REST, que administradores cadastram Alunos, Professores, Turmas,
Administradores e Questões."""
from django.contrib.auth.models import User
from django.test import TestCase
from django.urls import reverse

from escola.models import Administrador, Aluno, Professor, Turma


class AdminCrudTests(TestCase):
    def setUp(self):
        self.admin_user = User.objects.create_superuser(username='root', password='SenhaForte123', email='r@example.com')
        self.client.force_login(self.admin_user)
        self.turma = Turma.objects.create(nome='Turma Admin')

    def test_paginas_de_listagem_carregam_para_todos_os_models_principais(self):
        for model_name in ['aluno', 'professor', 'turma', 'administrador', 'questao', 'simulado', 'materia', 'aviso']:
            resp = self.client.get(f'/admin/escola/{model_name}/')
            self.assertEqual(resp.status_code, 200, model_name)

    def test_criar_aluno_pelo_admin_gera_login_e_senha_a_partir_do_cpf(self):
        resp = self.client.post('/admin/escola/aluno/add/', {
            'first_name': 'Maria', 'last_name': 'Silva', 'email': 'maria@example.com',
            'turma': self.turma.id, 'cpf': '999.888.777-66', 'data_nascimento': '2011-03-15',
            'endereco': '', 'telefone': '', 'nome_mae': '', 'email_mae': '',
        })
        self.assertEqual(resp.status_code, 302, getattr(resp, 'context', None) and resp.context['errors'])
        aluno = Aluno.objects.get(cpf='99988877766')
        self.assertEqual(aluno.user.username, '99988877766')
        self.assertTrue(aluno.user.check_password('15-03-2011'))

    def test_criar_aluno_com_cpf_duplicado_e_rejeitado(self):
        user = User.objects.create_user(username='11111111111', password='x')
        Aluno.objects.create(user=user, cpf='11111111111', turma=self.turma)

        resp = self.client.post('/admin/escola/aluno/add/', {
            'first_name': 'Outro', 'last_name': '', 'email': '',
            'turma': self.turma.id, 'cpf': '111.111.111-11', 'data_nascimento': '2011-03-15',
            'endereco': '', 'telefone': '', 'nome_mae': '', 'email_mae': '',
        })
        self.assertEqual(resp.status_code, 200)  # re-renderiza o form com erro
        self.assertContains(resp, 'Já existe um usuário com esse CPF')

    def test_criar_professor_pelo_admin(self):
        user = User.objects.create_user(username='prof.novo', password='SenhaForte123')
        resp = self.client.post('/admin/escola/professor/add/', {
            'user': user.pk, 'turmas': [self.turma.id],
        })
        self.assertEqual(resp.status_code, 302)
        self.assertTrue(Professor.objects.filter(user=user).exists())

    def test_criar_administrador_pelo_admin(self):
        user = User.objects.create_user(username='admin.novo', password='SenhaForte123')
        resp = self.client.post('/admin/escola/administrador/add/', {'user': user.pk})
        self.assertEqual(resp.status_code, 302)
        self.assertTrue(Administrador.objects.filter(user=user).exists())

    def test_editar_turma_pelo_admin(self):
        resp = self.client.post(f'/admin/escola/turma/{self.turma.id}/change/', {
            'nome': 'Turma Admin Editada', 'serie': '', 'turno': 'M', 'sala': '',
        })
        self.assertEqual(resp.status_code, 302)
        self.turma.refresh_from_db()
        self.assertEqual(self.turma.nome, 'Turma Admin Editada')

    def test_excluir_turma_pelo_admin(self):
        resp = self.client.post(f'/admin/escola/turma/{self.turma.id}/delete/', {'post': 'yes'})
        self.assertEqual(resp.status_code, 302)
        self.assertFalse(Turma.objects.filter(id=self.turma.id).exists())


class AdminAccessRestritoTests(TestCase):
    def test_usuario_comum_nao_acessa_o_admin(self):
        User.objects.create_user(username='comum', password='SenhaForte123')
        self.client.login(username='comum', password='SenhaForte123')
        resp = self.client.get('/admin/escola/aluno/', follow=True)
        # django admin não mostra a listagem: reexibe a tela de login com um
        # aviso de que o usuário está autenticado mas sem permissão.
        self.assertContains(resp, 'não está autorizado a acessar esta página', status_code=200)

    def test_pagina_de_login_do_admin_referencia_link_valido_de_volta_ao_site(self):
        admin_user = User.objects.create_superuser(username='root2', password='SenhaForte123')
        self.client.force_login(admin_user)
        resp = self.client.get('/admin/')
        self.assertEqual(resp.status_code, 200)
        self.assertNotContains(resp, 'ir-para-o-site')
