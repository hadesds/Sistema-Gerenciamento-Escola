from rest_framework import status

from escola.models import AlternativaQuestao, Questao, Simulado, SimuladoQuestao

from .base import BaseAPITestCase


class BancoQuestoesCrudTests(BaseAPITestCase):
    """CRUD do banco de questões: create (discursiva/objetiva), list, filter, delete."""

    def test_criar_questao_discursiva(self):
        self.auth_professor()
        resp = self.client.post('/api/professor/banco-questoes/', {
            'tipo': 'discursiva',
            'enunciado': 'Explique a fotossíntese.',
            'resposta': 'Processo pelo qual plantas convertem luz em energia.',
            'materia': self.materia.id,
            'dificuldade': 'medio',
        }, format='multipart')
        self.assertEqual(resp.status_code, status.HTTP_201_CREATED, resp.data)
        self.assertEqual(Questao.objects.count(), 1)
        questao = Questao.objects.get()
        self.assertEqual(questao.autor, self.professor)
        self.assertEqual(questao.tipo, 'discursiva')

    def test_criar_questao_objetiva_com_alternativas(self):
        self.auth_professor()
        import json
        resp = self.client.post('/api/professor/banco-questoes/', {
            'tipo': 'objetiva',
            'enunciado': 'Quanto é 2 + 2?',
            'materia': self.materia.id,
            'alternativas': json.dumps([
                {'texto': '3', 'correta': False},
                {'texto': '4', 'correta': True},
                {'texto': '5', 'correta': False},
            ]),
        }, format='multipart')
        self.assertEqual(resp.status_code, status.HTTP_201_CREATED, resp.data)
        questao = Questao.objects.get()
        self.assertEqual(questao.alternativas.count(), 3)
        self.assertEqual(questao.alternativas.filter(correta=True).count(), 1)

    def test_listar_questoes_traz_apenas_do_autor(self):
        Questao.objects.create(autor=self.professor, enunciado='Do professor 1')
        Questao.objects.create(autor=self.outro_professor, enunciado='Do professor 2')

        self.auth_professor()
        resp = self.client.get('/api/professor/banco-questoes/')
        self.assertEqual(resp.status_code, status.HTTP_200_OK)
        self.assertEqual(len(resp.data['questoes']), 1)
        self.assertEqual(resp.data['questoes'][0]['enunciado'], 'Do professor 1')

    def test_filtrar_questoes_por_materia(self):
        outra_materia, _ = self.materia.__class__.objects.get_or_create(sigla='PRT', defaults={'nome': 'Português'})
        Questao.objects.create(autor=self.professor, enunciado='Questão MTM', materia=self.materia)
        Questao.objects.create(autor=self.professor, enunciado='Questão PRT', materia=outra_materia)

        self.auth_professor()
        resp = self.client.get('/api/professor/banco-questoes/', {'materia': 'MTM'})
        self.assertEqual(len(resp.data['questoes']), 1)
        self.assertEqual(resp.data['questoes'][0]['enunciado'], 'Questão MTM')

    def test_excluir_questao_nao_usada(self):
        questao = Questao.objects.create(autor=self.professor, enunciado='Para excluir')
        self.auth_professor()
        resp = self.client.delete(f'/api/professor/banco-questoes/{questao.id}/')
        self.assertEqual(resp.status_code, status.HTTP_204_NO_CONTENT)
        self.assertFalse(Questao.objects.filter(id=questao.id).exists())

    def test_excluir_questao_usada_em_simulado_e_bloqueado(self):
        questao = Questao.objects.create(autor=self.professor, enunciado='Em uso')
        simulado = Simulado.objects.create(autor=self.professor)
        SimuladoQuestao.objects.create(simulado=simulado, questao=questao)

        self.auth_professor()
        resp = self.client.delete(f'/api/professor/banco-questoes/{questao.id}/')
        self.assertEqual(resp.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertTrue(Questao.objects.filter(id=questao.id).exists())

    def test_excluir_questao_de_outro_professor_retorna_404(self):
        questao = Questao.objects.create(autor=self.outro_professor, enunciado='De outro professor')
        self.auth_professor()
        resp = self.client.delete(f'/api/professor/banco-questoes/{questao.id}/')
        self.assertEqual(resp.status_code, status.HTTP_404_NOT_FOUND)

    def test_aluno_nao_acessa_banco_de_questoes(self):
        self.auth_aluno()
        resp = self.client.get('/api/professor/banco-questoes/')
        self.assertEqual(resp.status_code, status.HTTP_403_FORBIDDEN)

    def test_banco_de_questoes_requer_autenticacao(self):
        resp = self.client.get('/api/professor/banco-questoes/')
        self.assertEqual(resp.status_code, status.HTTP_401_UNAUTHORIZED)
