"""Testes de integração do fluxo de autenticação JWT (login real, sem
force_authenticate) e do endpoint /api/me/."""
from rest_framework import status
from rest_framework.test import APITestCase

from .base import BaseAPITestCase


class AuthFlowTests(BaseAPITestCase):
    def test_login_com_credenciais_validas_retorna_tokens(self):
        resp = self.client.post('/api/token/', {
            'username': 'professor1', 'password': 'SenhaForte123',
        }, format='json')
        self.assertEqual(resp.status_code, status.HTTP_200_OK)
        self.assertIn('access', resp.data)
        self.assertIn('refresh', resp.data)

    def test_login_com_credenciais_invalidas_retorna_401(self):
        resp = self.client.post('/api/token/', {
            'username': 'professor1', 'password': 'senha-errada',
        }, format='json')
        self.assertEqual(resp.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_access_token_emitido_no_login_acessa_endpoint_protegido(self):
        login = self.client.post('/api/token/', {
            'username': 'professor1', 'password': 'SenhaForte123',
        }, format='json')
        access = login.data['access']

        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {access}')
        resp = self.client.get('/api/me/')
        self.assertEqual(resp.status_code, status.HTTP_200_OK)
        self.assertEqual(resp.data['username'], 'professor1')
        self.assertEqual(resp.data['tipo'], 'professor')

    def test_refresh_token_emite_novo_access_token(self):
        login = self.client.post('/api/token/', {
            'username': 'professor1', 'password': 'SenhaForte123',
        }, format='json')
        refresh = login.data['refresh']

        resp = self.client.post('/api/token/refresh/', {'refresh': refresh}, format='json')
        self.assertEqual(resp.status_code, status.HTTP_200_OK)
        self.assertIn('access', resp.data)

    def test_me_sem_autenticacao_retorna_401(self):
        resp = self.client.get('/api/me/')
        self.assertEqual(resp.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_me_identifica_papel_admin(self):
        self.auth_admin()
        resp = self.client.get('/api/me/')
        self.assertEqual(resp.status_code, status.HTTP_200_OK)
        self.assertEqual(resp.data['tipo'], 'admin')

    def test_me_identifica_papel_aluno(self):
        self.auth_aluno()
        resp = self.client.get('/api/me/')
        self.assertEqual(resp.status_code, status.HTTP_200_OK)
        self.assertEqual(resp.data['tipo'], 'aluno')

    def test_me_usuario_sem_perfil_vinculado(self):
        from django.contrib.auth.models import User
        user_orfao = User.objects.create_user(username='orfao', password='SenhaForte123')
        self.auth_as(user_orfao)
        resp = self.client.get('/api/me/')
        self.assertEqual(resp.status_code, status.HTTP_200_OK)
        self.assertEqual(resp.data['tipo'], 'unknown')


class GradeConfigTests(BaseAPITestCase):
    def test_grade_config_requer_autenticacao(self):
        resp = self.client.get('/api/grade-config/')
        self.assertEqual(resp.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_grade_config_retorna_taxonomia(self):
        self.auth_professor()
        resp = self.client.get('/api/grade-config/')
        self.assertEqual(resp.status_code, status.HTTP_200_OK)
        self.assertIsInstance(resp.data, dict)
