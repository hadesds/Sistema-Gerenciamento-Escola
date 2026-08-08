from django.contrib.auth.models import User
from rest_framework import status

from escola.models import PerfilTurma, RegistroAssiduidade, Simulado

from .base import BaseAPITestCase


class AlunoDashboardTests(BaseAPITestCase):
    def test_dashboard_aluno(self):
        self.auth_aluno()
        resp = self.client.get('/api/aluno/dashboard/')
        self.assertEqual(resp.status_code, status.HTTP_200_OK)
        self.assertEqual(resp.data['aluno']['cpf'], self.aluno.cpf)

    def test_professor_nao_acessa_dashboard_de_aluno(self):
        self.auth_professor()
        resp = self.client.get('/api/aluno/dashboard/')
        self.assertEqual(resp.status_code, status.HTTP_403_FORBIDDEN)

    def test_meu_feedback(self):
        self.auth_aluno()
        resp = self.client.get('/api/aluno/meu-feedback/')
        self.assertEqual(resp.status_code, status.HTTP_200_OK)

    def test_meus_simulados_lista_apenas_da_turma(self):
        simulado_da_turma = Simulado.objects.create(autor=self.professor, titulo='Da minha turma')
        simulado_da_turma.turmas.add(self.turma)
        simulado_de_outra_turma = Simulado.objects.create(autor=self.outro_professor, titulo='De outra turma')
        simulado_de_outra_turma.turmas.add(self.outra_turma)

        self.auth_aluno()
        resp = self.client.get('/api/aluno/meus-simulados/')
        self.assertEqual(resp.status_code, status.HTTP_200_OK)
        titulos = [s['titulo'] for s in resp.data]
        self.assertIn('Da minha turma', titulos)
        self.assertNotIn('De outra turma', titulos)


class AssiduidadeTests(BaseAPITestCase):
    def test_aluno_comum_nao_acessa_assiduidade(self):
        self.auth_aluno()
        resp = self.client.get('/api/aluno/assiduidade/')
        self.assertEqual(resp.status_code, status.HTTP_403_FORBIDDEN)

    def test_lider_acessa_e_registra_assiduidade(self):
        PerfilTurma.objects.create(aluno=self.aluno, turma=self.turma, papel='lider')
        self.auth_aluno()

        resp_get = self.client.get('/api/aluno/assiduidade/')
        self.assertEqual(resp_get.status_code, status.HTTP_200_OK)
        self.assertEqual(resp_get.data['papel'], 'lider')

        resp_post = self.client.post('/api/aluno/assiduidade/', {
            'presencas_data': {str(self.aluno.user_id): True},
            'observacao': 'Aula normal',
        }, format='json')
        self.assertEqual(resp_post.status_code, status.HTTP_201_CREATED)
        self.assertEqual(RegistroAssiduidade.objects.filter(turma=self.turma).count(), 1)
