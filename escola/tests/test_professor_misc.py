from rest_framework import status

from escola.models import Avaliacao, NotaArea, NotaMateria, NotaQualitativa, PerfilTurma

from .base import BaseAPITestCase


class ProfessorTurmasTests(BaseAPITestCase):
    def test_listar_turmas_do_professor(self):
        self.auth_professor()
        resp = self.client.get('/api/professor/turmas/')
        self.assertEqual(resp.status_code, status.HTTP_200_OK)
        self.assertEqual(len(resp.data), 1)
        self.assertEqual(resp.data[0]['turma']['nome'], self.turma.nome)

    def test_carometro_de_turma_do_professor(self):
        self.auth_professor()
        resp = self.client.get(f'/api/professor/turma/{self.turma.id}/')
        self.assertEqual(resp.status_code, status.HTTP_200_OK)
        self.assertEqual(len(resp.data['alunos']), 1)

    def test_carometro_de_turma_de_outro_professor_e_negado(self):
        self.auth_professor()
        resp = self.client.get(f'/api/professor/turma/{self.outra_turma.id}/')
        self.assertEqual(resp.status_code, status.HTTP_403_FORBIDDEN)

    def test_dashboard_professor(self):
        self.auth_professor()
        resp = self.client.get('/api/professor/dashboard/')
        self.assertEqual(resp.status_code, status.HTTP_200_OK)
        self.assertEqual(resp.data['total_turmas'], 1)
        self.assertEqual(resp.data['total_alunos'], 1)


class AvaliacaoTests(BaseAPITestCase):
    def test_registrar_avaliacao(self):
        self.auth_professor()
        resp = self.client.post(f'/api/professor/avaliar/{self.aluno.pk}/', {
            'assiduidade': 5, 'participacao': 4, 'responsabilidade': 5, 'sociabilidade': 4,
            'observacao': 'Ótimo aluno',
        }, format='json')
        self.assertEqual(resp.status_code, status.HTTP_201_CREATED, resp.data)
        self.assertEqual(Avaliacao.objects.count(), 1)

    def test_registrar_avaliacao_aluno_inexistente_404(self):
        self.auth_professor()
        resp = self.client.post('/api/professor/avaliar/999999/', {}, format='json')
        self.assertEqual(resp.status_code, status.HTTP_404_NOT_FOUND)


class NotasMateriaTests(BaseAPITestCase):
    def test_lancar_notas_por_materia(self):
        self.auth_professor()
        resp = self.client.post(f'/api/professor/notas/{self.aluno.pk}/', {
            'epoca': '1B',
            'notas': {'matematica': 8.5, 'portugues': 7.0},
        }, format='json')
        self.assertEqual(resp.status_code, status.HTTP_201_CREATED, resp.data)
        self.assertEqual(NotaMateria.objects.filter(aluno=self.aluno).count(), 2)

    def test_lancar_nota_fora_do_intervalo_e_ignorada(self):
        self.auth_professor()
        resp = self.client.post(f'/api/professor/notas/{self.aluno.pk}/', {
            'epoca': '1B',
            'notas': {'matematica': 15.0},
        }, format='json')
        self.assertEqual(resp.status_code, status.HTTP_201_CREATED)
        self.assertEqual(NotaMateria.objects.filter(aluno=self.aluno).count(), 0)

    def test_listar_notas_do_aluno(self):
        NotaMateria.objects.create(aluno=self.aluno, professor=self.professor, materia='matematica', nota=9, epoca='1B')
        self.auth_professor()
        resp = self.client.get(f'/api/professor/notas/{self.aluno.pk}/')
        self.assertEqual(resp.status_code, status.HTTP_200_OK)
        self.assertEqual(len(resp.data), 1)


class NotaAreaQualitativaTests(BaseAPITestCase):
    def test_override_manual_nota_area_valida(self):
        self.auth_professor()
        resp = self.client.post(f'/api/professor/nota-area/{self.aluno.pk}/', {
            'epoca': '1B', 'av_tipo': 'AV1', 'area': 'MTM', 'nota': 8.0,
        }, format='json')
        self.assertEqual(resp.status_code, status.HTTP_200_OK, resp.data)
        nota = NotaArea.objects.get(aluno=self.aluno)
        self.assertEqual(nota.origem, 'manual')
        self.assertEqual(float(nota.nota), 8.0)

    def test_nota_area_invalida_retorna_400(self):
        self.auth_professor()
        resp = self.client.post(f'/api/professor/nota-area/{self.aluno.pk}/', {
            'epoca': 'XX', 'av_tipo': 'AV1', 'area': 'MTM', 'nota': 8.0,
        }, format='json')
        self.assertEqual(resp.status_code, status.HTTP_400_BAD_REQUEST)

    def test_nota_area_fora_do_intervalo_retorna_400(self):
        self.auth_professor()
        resp = self.client.post(f'/api/professor/nota-area/{self.aluno.pk}/', {
            'epoca': '1B', 'av_tipo': 'AV1', 'area': 'MTM', 'nota': 11,
        }, format='json')
        self.assertEqual(resp.status_code, status.HTTP_400_BAD_REQUEST)

    def test_lancar_nota_qualitativa(self):
        self.auth_professor()
        resp = self.client.post(f'/api/professor/nota-qualitativa/{self.aluno.pk}/', {
            'epoca': '1B', 'notas': {str(self.materia.id): 7.5},
        }, format='json')
        self.assertEqual(resp.status_code, status.HTTP_200_OK, resp.data)
        self.assertEqual(resp.data['salvas'], 1)
        self.assertEqual(NotaQualitativa.objects.count(), 1)

    def test_consolidado_do_aluno(self):
        self.auth_professor()
        resp = self.client.get(f'/api/professor/consolidado/{self.aluno.pk}/')
        self.assertEqual(resp.status_code, status.HTTP_200_OK)
        self.assertIn('notas', resp.data)


class PerfilTurmaTests(BaseAPITestCase):
    def test_definir_lider(self):
        self.auth_professor()
        resp = self.client.post(f'/api/professor/perfil/{self.aluno.pk}/', {'papel': 'lider'}, format='json')
        self.assertEqual(resp.status_code, status.HTTP_201_CREATED, resp.data)
        self.assertEqual(PerfilTurma.objects.get(aluno=self.aluno).papel, 'lider')

    def test_papel_invalido_retorna_400(self):
        self.auth_professor()
        resp = self.client.post(f'/api/professor/perfil/{self.aluno.pk}/', {'papel': 'rei'}, format='json')
        self.assertEqual(resp.status_code, status.HTTP_400_BAD_REQUEST)

    def test_definir_lider_substitui_lider_anterior_na_turma(self):
        from django.contrib.auth.models import User
        outro_aluno_user = User.objects.create_user(username='aluno2', password='x')
        outro_aluno = self.aluno.__class__.objects.create(user=outro_aluno_user, turma=self.turma)

        self.auth_professor()
        self.client.post(f'/api/professor/perfil/{self.aluno.pk}/', {'papel': 'lider'}, format='json')
        self.client.post(f'/api/professor/perfil/{outro_aluno.pk}/', {'papel': 'lider'}, format='json')

        self.assertFalse(PerfilTurma.objects.filter(aluno=self.aluno).exists())
        self.assertEqual(PerfilTurma.objects.get(aluno=outro_aluno).papel, 'lider')

    def test_remover_perfil(self):
        PerfilTurma.objects.create(aluno=self.aluno, turma=self.turma, papel='lider')
        self.auth_professor()
        resp = self.client.delete(f'/api/professor/perfil/{self.aluno.pk}/')
        self.assertEqual(resp.status_code, status.HTTP_200_OK)
        self.assertFalse(PerfilTurma.objects.filter(aluno=self.aluno).exists())
