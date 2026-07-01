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

from .models import SimuladoQuestao, NotaArea, NotaQualitativa, Materia
from .grade_config import DISCIPLINAS, DISCIPLINA_AREA, EPOCAS


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


def consolidar_notas(aluno):
    """Consolida as notas do aluno por bimestre × disciplina.

    Média final por disciplina = (AV1_área + AV2_área + AV3_disciplina) / 3,
    tratando nota ausente como 0.
    """
    # Índices para lookup rápido
    areas = {
        (na.epoca, na.av_tipo, na.area): float(na.nota)
        for na in NotaArea.objects.filter(aluno=aluno)
    }
    # NotaQualitativa por (epoca, sigla da matéria)
    qualis = {}
    for nq in NotaQualitativa.objects.filter(aluno=aluno).select_related('materia'):
        if nq.materia:
            qualis[(nq.epoca, nq.materia.sigla)] = float(nq.nota)

    # id da Materia por sigla (para edição da AV3)
    materia_por_sigla = {m.sigla: m.id for m in Materia.objects.all()}

    resultado = {}
    for epoca_cod, _epoca_nome in EPOCAS:
        linhas = []
        for sigla, nome in DISCIPLINAS:
            mapa = DISCIPLINA_AREA.get(sigla, {})
            area_av1 = mapa.get('AV1')
            area_av2 = mapa.get('AV2')
            av1 = areas.get((epoca_cod, 'AV1', area_av1))
            av2 = areas.get((epoca_cod, 'AV2', area_av2))
            av3 = qualis.get((epoca_cod, sigla))
            final = round(((av1 or 0) + (av2 or 0) + (av3 or 0)) / 3, 2)
            linhas.append({
                'sigla': sigla, 'nome': nome,
                'area_av1': area_av1, 'area_av2': area_av2,
                'materia_id': materia_por_sigla.get(sigla),
                'av1': av1, 'av2': av2, 'av3': av3,
                'final': final,
            })
        resultado[epoca_cod] = linhas
    return resultado
