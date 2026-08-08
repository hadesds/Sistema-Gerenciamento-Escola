"""Varre os principais endpoints protegidos e garante que requisições sem
token são sempre rejeitadas com 401 (nenhum vaza dado por engano)."""
from rest_framework import status

from .base import BaseAPITestCase


class UnauthenticatedAccessTests(BaseAPITestCase):
    def _assert_401(self, method, path, **kwargs):
        resp = getattr(self.client, method)(path, **kwargs)
        self.assertEqual(resp.status_code, status.HTTP_401_UNAUTHORIZED, f'{method.upper()} {path}')

    def test_endpoints_protegidos_exigem_autenticacao(self):
        aluno_id = self.aluno.pk
        turma_id = self.turma.id
        endpoints_get = [
            '/api/me/',
            '/api/grade-config/',
            '/api/professor/dashboard/',
            '/api/professor/turmas/',
            f'/api/professor/turma/{turma_id}/',
            '/api/professor/banco-questoes/',
            '/api/professor/criar-simulado/data/',
            '/api/professor/simulados/',
            '/api/professor/materias/',
            f'/api/professor/notas/{aluno_id}/',
            f'/api/professor/consolidado/{aluno_id}/',
            f'/api/professor/relatorio/{aluno_id}/',
            '/api/aluno/dashboard/',
            '/api/aluno/meu-feedback/',
            '/api/aluno/meus-simulados/',
            '/api/aluno/assiduidade/',
            '/api/admin/avisos/',
        ]
        for path in endpoints_get:
            self._assert_401('get', path)

    def test_endpoints_de_escrita_exigem_autenticacao(self):
        aluno_id = self.aluno.pk
        self._assert_401('post', f'/api/professor/avaliar/{aluno_id}/', data={}, format='json')
        self._assert_401('post', '/api/professor/banco-questoes/', data={}, format='multipart')
        self._assert_401('post', '/api/professor/criar-simulado/', data={}, format='json')
        self._assert_401('post', f'/api/professor/perfil/{aluno_id}/', data={}, format='json')
        self._assert_401('post', '/api/aluno/assiduidade/', data={}, format='json')
        self._assert_401('post', '/api/admin/avisos/', data={}, format='multipart')

    def test_avisos_publicos_nao_exige_autenticacao(self):
        resp = self.client.get('/api/avisos/')
        self.assertEqual(resp.status_code, status.HTTP_200_OK)
