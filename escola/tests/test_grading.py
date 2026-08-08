"""Testes de unidade da lógica de correção/consolidação de notas (escola/grading.py),
chamando as funções diretamente (sem passar pela API)."""
from decimal import Decimal

from django.test import TestCase

from escola.grading import consolidar_notas, corrigir_resultado, recomputar_simulado
from escola.models import (
    AlternativaQuestao, NotaArea, NotaQualitativa, Questao, ResultadoSimulado,
    RespostaAluno, Simulado, SimuladoQuestao,
)

from .base import BaseAPITestCase


class CorrigirResultadoTests(BaseAPITestCase):
    def setUp(self):
        super().setUp()
        self.questao_obj = Questao.objects.create(autor=self.professor, enunciado='Objetiva', tipo='objetiva')
        self.alt_certa = AlternativaQuestao.objects.create(questao=self.questao_obj, texto='certa', correta=True)
        self.alt_errada = AlternativaQuestao.objects.create(questao=self.questao_obj, texto='errada', correta=False)
        self.questao_disc = Questao.objects.create(autor=self.professor, enunciado='Discursiva', tipo='discursiva')

        self.simulado = Simulado.objects.create(autor=self.professor, av_tipo='AV1', area='MTM', epoca='1B')
        self.simulado.turmas.add(self.turma)
        SimuladoQuestao.objects.create(simulado=self.simulado, questao=self.questao_obj, valor=Decimal('6'))
        SimuladoQuestao.objects.create(simulado=self.simulado, questao=self.questao_disc, valor=Decimal('4'))

        self.resultado = ResultadoSimulado.objects.create(simulado=self.simulado, aluno=self.aluno)

    def test_objetiva_correta_pontua_e_discursiva_pendente_mantem_status_pendente(self):
        RespostaAluno.objects.create(resultado=self.resultado, questao=self.questao_obj, alternativa=self.alt_certa)
        RespostaAluno.objects.create(resultado=self.resultado, questao=self.questao_disc, texto='resposta')

        corrigir_resultado(self.resultado)

        # A nota parcial já é calculada (só considera o que foi pontuado até
        # agora: 6 de 10 pontos possíveis), mas o status continua pendente
        # até o professor corrigir a discursiva — e nenhuma NotaArea é
        # gerada enquanto isso.
        self.assertEqual(self.resultado.status, 'pendente_correcao')
        self.assertEqual(self.resultado.nota, Decimal('6.00'))
        self.assertFalse(NotaArea.objects.filter(aluno=self.aluno).exists())

    def test_nota_calculada_quando_tudo_pontuado(self):
        RespostaAluno.objects.create(resultado=self.resultado, questao=self.questao_obj, alternativa=self.alt_certa)
        resp_disc = RespostaAluno.objects.create(resultado=self.resultado, questao=self.questao_disc, texto='ok', pontos=4)

        corrigir_resultado(self.resultado)

        self.assertEqual(self.resultado.status, 'corrigido')
        self.assertEqual(self.resultado.nota, Decimal('10.00'))
        self.assertTrue(NotaArea.objects.filter(aluno=self.aluno, epoca='1B', av_tipo='AV1', area='MTM').exists())

    def test_objetiva_errada_nao_pontua(self):
        RespostaAluno.objects.create(resultado=self.resultado, questao=self.questao_obj, alternativa=self.alt_errada)
        RespostaAluno.objects.create(resultado=self.resultado, questao=self.questao_disc, texto='ok', pontos=0)

        corrigir_resultado(self.resultado)
        self.assertEqual(self.resultado.nota, Decimal('0.00'))

    def test_questao_removida_do_simulado_nao_conta_na_nota(self):
        RespostaAluno.objects.create(resultado=self.resultado, questao=self.questao_obj, alternativa=self.alt_certa)
        resp_disc = RespostaAluno.objects.create(resultado=self.resultado, questao=self.questao_disc, texto='ok', pontos=4)
        corrigir_resultado(self.resultado)
        self.assertEqual(self.resultado.nota, Decimal('10.00'))

        # Remove a questão discursiva do simulado (ela deixa de valer nota).
        self.simulado.questoes.remove(self.questao_disc)
        recomputar_simulado(self.simulado)
        self.resultado.refresh_from_db()
        # Só resta a objetiva (valor 6) e ela foi respondida corretamente: 6/6 * 10 = 10
        self.assertEqual(self.resultado.nota, Decimal('10.00'))

    def test_sem_area_epoca_nao_gera_notaarea(self):
        simulado_sem_area = Simulado.objects.create(autor=self.professor)  # sem av_tipo/area/epoca
        SimuladoQuestao.objects.create(simulado=simulado_sem_area, questao=self.questao_obj, valor=Decimal('10'))
        resultado = ResultadoSimulado.objects.create(simulado=simulado_sem_area, aluno=self.aluno)
        RespostaAluno.objects.create(resultado=resultado, questao=self.questao_obj, alternativa=self.alt_certa)

        corrigir_resultado(resultado)
        self.assertEqual(resultado.status, 'corrigido')
        self.assertEqual(NotaArea.objects.filter(aluno=self.aluno).count(), 0)


class ConsolidarNotasTests(BaseAPITestCase):
    def test_media_final_trata_nota_ausente_como_zero(self):
        NotaArea.objects.create(aluno=self.aluno, epoca='1B', av_tipo='AV1', area='MTM', nota=Decimal('9.0'))
        # AV2 e AV3 (qualitativa) de matemática ausentes -> tratadas como 0.

        consolidado = consolidar_notas(self.aluno)
        linha_mtm = next(l for l in consolidado['1B'] if l['sigla'] == 'MTM')
        self.assertEqual(linha_mtm['av1'], 9.0)
        self.assertIsNone(linha_mtm['av2'])
        self.assertEqual(linha_mtm['final'], round(9.0 / 3, 2))

    def test_media_final_combina_av1_av2_av3(self):
        NotaArea.objects.create(aluno=self.aluno, epoca='1B', av_tipo='AV1', area='MTM', nota=Decimal('8.0'))
        NotaArea.objects.create(aluno=self.aluno, epoca='1B', av_tipo='AV2', area='MTM', nota=Decimal('6.0'))
        NotaQualitativa.objects.create(aluno=self.aluno, epoca='1B', materia=self.materia, nota=Decimal('10.0'))

        consolidado = consolidar_notas(self.aluno)
        linha_mtm = next(l for l in consolidado['1B'] if l['sigla'] == 'MTM')
        self.assertEqual(linha_mtm['final'], round((8.0 + 6.0 + 10.0) / 3, 2))
