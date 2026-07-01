"""
Correção automática de simulados e consolidação da nota por área.

Fluxo:
- corrigir_resultado(resultado): percorre as respostas do aluno.
  - Objetivas: marca correta/pontos comparando com a alternativa correta.
  - Discursivas: deixa pontos=None (pendente de correção pelo professor).
  - Calcula a nota (0–10) com base no valor de cada questão (SimuladoQuestao.valor).
  - Se TODAS as questões puderem ser pontuadas, status='corrigido' e a NotaArea é
    consolidada. Caso haja discursiva sem pontos, status='pendente_correcao'.
"""
from decimal import Decimal

from .models import SimuladoQuestao, NotaArea


def _valor_questao(simulado, questao_id):
    sq = SimuladoQuestao.objects.filter(simulado=simulado, questao_id=questao_id).first()
    return Decimal(sq.valor) if sq else Decimal('1.00')


def corrigir_resultado(resultado):
    """Corrige as respostas objetivas, calcula a nota e consolida NotaArea quando possível.

    Retorna o próprio resultado já salvo.
    """
    simulado = resultado.simulado
    respostas = list(resultado.respostas.select_related('questao', 'alternativa'))

    valor_total = Decimal('0')
    pontos_obtidos = Decimal('0')
    tem_pendente = False

    for r in respostas:
        valor = _valor_questao(simulado, r.questao_id)
        valor_total += valor

        if r.questao.tipo == 'objetiva':
            # corrige automaticamente
            acertou = bool(r.alternativa and r.alternativa.correta)
            r.correta = acertou
            r.pontos = valor if acertou else Decimal('0')
            if acertou:
                pontos_obtidos += valor
        else:
            # discursiva: se o professor ainda não pontuou, fica pendente
            if r.pontos is None:
                tem_pendente = True
            else:
                pontos_obtidos += Decimal(r.pontos)
        r.save()

    if valor_total > 0:
        nota10 = (pontos_obtidos / valor_total) * Decimal('10')
    else:
        nota10 = Decimal('0')
    nota10 = nota10.quantize(Decimal('0.01'))

    resultado.nota = nota10
    resultado.status = 'pendente_correcao' if tem_pendente else 'corrigido'
    resultado.save()

    if not tem_pendente:
        consolidar_nota_area(resultado)

    return resultado


def consolidar_nota_area(resultado):
    """Faz upsert da NotaArea a partir de um resultado corrigido (AV1/AV2)."""
    simulado = resultado.simulado
    if not (simulado.av_tipo in ('AV1', 'AV2') and simulado.area and simulado.epoca):
        # Sem metadados de nota suficientes; nada a consolidar.
        return None

    nota_area, _ = NotaArea.objects.update_or_create(
        aluno=resultado.aluno,
        epoca=simulado.epoca,
        av_tipo=simulado.av_tipo,
        area=simulado.area,
        defaults={
            'nota': resultado.nota,
            'origem': 'auto',
            'resultado': resultado,
        },
    )
    return nota_area
