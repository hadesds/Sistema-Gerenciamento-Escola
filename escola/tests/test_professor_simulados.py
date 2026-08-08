from rest_framework import status

from escola.models import AlternativaQuestao, Questao, ResultadoSimulado, Simulado, SimuladoQuestao

from .base import BaseAPITestCase


class SimuladoCrudTests(BaseAPITestCase):
    def setUp(self):
        super().setUp()
        self.questao = Questao.objects.create(
            autor=self.professor, enunciado='2 + 2?', materia=self.materia, tipo='objetiva',
        )
        self.alt_certa = AlternativaQuestao.objects.create(questao=self.questao, texto='4', correta=True, ordem=0)
        self.alt_errada = AlternativaQuestao.objects.create(questao=self.questao, texto='5', correta=False, ordem=1)

    def test_criar_simulado(self):
        self.auth_professor()
        resp = self.client.post('/api/professor/criar-simulado/', {
            'titulo': 'Prova 1',
            'turmas': [self.turma.id],
            'questoes': [{'id': self.questao.id, 'valor': 10}],
        }, format='json')
        self.assertEqual(resp.status_code, status.HTTP_201_CREATED, resp.data)
        self.assertEqual(Simulado.objects.count(), 1)
        simulado = Simulado.objects.get()
        self.assertEqual(simulado.autor, self.professor)
        self.assertEqual(simulado.questoes.count(), 1)

    def test_criar_simulado_sem_turma_ou_questao_falha(self):
        self.auth_professor()
        resp = self.client.post('/api/professor/criar-simulado/', {
            'titulo': 'Prova sem nada', 'turmas': [], 'questoes': [],
        }, format='json')
        self.assertEqual(resp.status_code, status.HTTP_400_BAD_REQUEST)

    def test_criar_simulado_av1_sem_area_epoca_falha(self):
        self.auth_professor()
        resp = self.client.post('/api/professor/criar-simulado/', {
            'titulo': 'Prova AV1',
            'turmas': [self.turma.id],
            'questoes': [{'id': self.questao.id, 'valor': 10}],
            'av_tipo': 'AV1',
        }, format='json')
        self.assertEqual(resp.status_code, status.HTTP_400_BAD_REQUEST)

    def test_listar_simulados_do_professor(self):
        Simulado.objects.create(autor=self.professor, titulo='Meu simulado')
        Simulado.objects.create(autor=self.outro_professor, titulo='Simulado alheio')

        self.auth_professor()
        resp = self.client.get('/api/professor/simulados/')
        self.assertEqual(resp.status_code, status.HTTP_200_OK)
        titulos = [s['titulo'] for s in resp.data]
        self.assertIn('Meu simulado', titulos)
        self.assertNotIn('Simulado alheio', titulos)

    def test_detalhe_simulado_de_outro_professor_retorna_404(self):
        simulado = Simulado.objects.create(autor=self.outro_professor)
        self.auth_professor()
        resp = self.client.get(f'/api/professor/simulado/{simulado.id}/')
        self.assertEqual(resp.status_code, status.HTTP_404_NOT_FOUND)

    def test_atualizar_simulado_patch(self):
        simulado = Simulado.objects.create(autor=self.professor, titulo='Antigo')
        self.auth_professor()
        resp = self.client.patch(f'/api/professor/simulado/{simulado.id}/', {
            'titulo': 'Novo título',
        }, format='json')
        self.assertEqual(resp.status_code, status.HTTP_200_OK)
        simulado.refresh_from_db()
        self.assertEqual(simulado.titulo, 'Novo título')

    def test_atualizar_simulado_para_av1_sem_area_epoca_falha(self):
        simulado = Simulado.objects.create(autor=self.professor, titulo='Prova')
        self.auth_professor()
        resp = self.client.patch(f'/api/professor/simulado/{simulado.id}/', {
            'av_tipo': 'AV1',
        }, format='json')
        self.assertEqual(resp.status_code, status.HTTP_400_BAD_REQUEST)

    def test_excluir_simulado(self):
        simulado = Simulado.objects.create(autor=self.professor)
        self.auth_professor()
        resp = self.client.delete(f'/api/professor/simulado/{simulado.id}/')
        self.assertEqual(resp.status_code, status.HTTP_204_NO_CONTENT)
        self.assertFalse(Simulado.objects.filter(id=simulado.id).exists())

    def test_remover_questao_do_simulado(self):
        simulado = Simulado.objects.create(autor=self.professor)
        SimuladoQuestao.objects.create(simulado=simulado, questao=self.questao, valor=5)
        self.auth_professor()
        resp = self.client.delete(f'/api/professor/simulado/{simulado.id}/questao/{self.questao.id}/')
        self.assertEqual(resp.status_code, status.HTTP_200_OK)
        self.assertEqual(simulado.questoes.count(), 0)


class SimuladoResultadosTests(BaseAPITestCase):
    def setUp(self):
        super().setUp()
        self.questao_obj = Questao.objects.create(
            autor=self.professor, enunciado='2 + 2?', materia=self.materia, tipo='objetiva',
        )
        self.alt_certa = AlternativaQuestao.objects.create(questao=self.questao_obj, texto='4', correta=True, ordem=0)
        self.questao_disc = Questao.objects.create(
            autor=self.professor, enunciado='Explique X', materia=self.materia, tipo='discursiva',
        )
        self.simulado = Simulado.objects.create(autor=self.professor, titulo='Prova mista')
        self.simulado.turmas.add(self.turma)
        SimuladoQuestao.objects.create(simulado=self.simulado, questao=self.questao_obj, valor=6)
        SimuladoQuestao.objects.create(simulado=self.simulado, questao=self.questao_disc, valor=4)

    def test_resultados_antes_de_qualquer_envio(self):
        self.auth_professor()
        resp = self.client.get(f'/api/professor/simulado/{self.simulado.id}/resultados/')
        self.assertEqual(resp.status_code, status.HTTP_200_OK)
        alunos = resp.data['turmas'][0]['alunos']
        self.assertEqual(alunos[0]['status'], 'nao_iniciado')

    def test_fluxo_completo_envio_e_correcao(self):
        # Aluno envia respostas: acerta a objetiva, deixa a discursiva pendente.
        self.auth_aluno()
        resp = self.client.post(f'/api/aluno/simulado/{self.simulado.id}/enviar/', {
            'respostas': [
                {'questao': self.questao_obj.id, 'alternativa': self.alt_certa.id},
                {'questao': self.questao_disc.id, 'texto': 'Minha resposta discursiva'},
            ],
        }, format='json')
        self.assertEqual(resp.status_code, status.HTTP_201_CREATED, resp.data)
        self.assertEqual(resp.data['status'], 'pendente_correcao')

        resultado = ResultadoSimulado.objects.get(simulado=self.simulado, aluno=self.aluno)
        resposta_obj = resultado.respostas.get(questao=self.questao_obj)
        self.assertEqual(resposta_obj.correta, True)
        self.assertEqual(float(resposta_obj.pontos), 6.0)

        # Envio duplicado é rejeitado.
        resp2 = self.client.post(f'/api/aluno/simulado/{self.simulado.id}/enviar/', {'respostas': []}, format='json')
        self.assertEqual(resp2.status_code, status.HTTP_409_CONFLICT)

        # Professor corrige a discursiva.
        resposta_disc = resultado.respostas.get(questao=self.questao_disc)
        self.auth_professor()
        resp3 = self.client.post(f'/api/professor/resultado/{resultado.id}/corrigir/', {
            'pontos': {str(resposta_disc.id): 4},
        }, format='json')
        self.assertEqual(resp3.status_code, status.HTTP_200_OK)
        self.assertEqual(resp3.data['status'], 'corrigido')
        self.assertEqual(float(resp3.data['nota']), 10.0)

    def test_aluno_sem_acesso_a_simulado_de_outra_turma(self):
        aluno_outra_turma = self.aluno.__class__.objects.create(
            user=self.professor_user.__class__.objects.create_user(username='aluno_outro', password='x'),
            turma=self.outra_turma,
        )
        self.client.force_authenticate(user=aluno_outra_turma.user)
        resp = self.client.get(f'/api/aluno/simulado/{self.simulado.id}/')
        self.assertEqual(resp.status_code, status.HTTP_403_FORBIDDEN)

    def test_professor_nao_corrige_resultado_de_simulado_alheio(self):
        outro_simulado = Simulado.objects.create(autor=self.outro_professor)
        outro_simulado.turmas.add(self.outra_turma)
        resultado = ResultadoSimulado.objects.create(simulado=outro_simulado, aluno=self.aluno)

        self.auth_professor()
        resp = self.client.post(f'/api/professor/resultado/{resultado.id}/corrigir/', {'pontos': {}}, format='json')
        self.assertEqual(resp.status_code, status.HTTP_403_FORBIDDEN)
