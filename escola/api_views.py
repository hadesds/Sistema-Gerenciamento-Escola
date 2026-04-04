from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework import status
from django.shortcuts import get_object_or_404
from django.db.models import Avg
from datetime import datetime, timedelta

from .models import Professor, Aluno, Turma, Avaliacao, Questao, Simulado
from .serializers import (
    TurmaSerializer, AlunoBasicSerializer, AvaliacaoSerializer,
    QuestaoSerializer, SimuladoSerializer, MeSerializer
)


# ==========================================
# AUTH
# ==========================================

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def me(request):
    serializer = MeSerializer(request.user)
    return Response(serializer.data)


# ==========================================
# PROFESSOR
# ==========================================

def _get_professor(request):
    if not hasattr(request.user, 'professor'):
        return None
    return request.user.professor


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def professor_dashboard(request):
    professor = _get_professor(request)
    if not professor:
        return Response({'detail': 'Acesso negado.'}, status=403)

    turmas = professor.turmas.all()
    total_alunos = Aluno.objects.filter(turma__in=turmas).count()
    total_turmas = turmas.count()
    total_questoes = Questao.objects.filter(autor=professor).count()
    total_simulados = Simulado.objects.filter(autor=professor).count()

    data_limite = datetime.now().date() - timedelta(days=7)
    avaliacoes_recentes_qs = Avaliacao.objects.filter(
        professor=professor,
        data__gte=data_limite
    ).select_related('aluno', 'aluno__turma').order_by('-data')[:10]

    avaliacoes_recentes = AvaliacaoSerializer(
        avaliacoes_recentes_qs, many=True, context={'request': request}
    ).data

    top_alunos = []
    for turma in turmas:
        alunos_turma = Aluno.objects.filter(turma=turma)
        for aluno in alunos_turma:
            avaliacoes = Avaliacao.objects.filter(aluno=aluno)
            if avaliacoes.exists():
                media = avaliacoes.aggregate(
                    media_assiduidade=Avg('assiduidade'),
                    media_participacao=Avg('participacao'),
                    media_responsabilidade=Avg('responsabilidade'),
                    media_sociabilidade=Avg('sociabilidade')
                )
                media_geral = (
                    (media['media_assiduidade'] or 0) +
                    (media['media_participacao'] or 0) +
                    (media['media_responsabilidade'] or 0) +
                    (media['media_sociabilidade'] or 0)
                ) / 4
                foto_url = None
                if aluno.foto:
                    foto_url = request.build_absolute_uri(aluno.foto.url)
                top_alunos.append({
                    'id': aluno.user.id,
                    'nome': aluno.user.get_full_name() or aluno.user.username,
                    'media_geral': round(media_geral, 2),
                    'turma': turma.nome,
                    'foto_url': foto_url,
                })

    top_alunos = sorted(top_alunos, key=lambda x: x['media_geral'], reverse=True)[:5]

    desempenho_turmas = []
    for turma in turmas:
        avaliacoes_turma = Avaliacao.objects.filter(aluno__turma=turma)
        if avaliacoes_turma.exists():
            media_turma = avaliacoes_turma.aggregate(
                media_assiduidade=Avg('assiduidade'),
                media_participacao=Avg('participacao'),
                media_responsabilidade=Avg('responsabilidade'),
                media_sociabilidade=Avg('sociabilidade')
            )
            media_geral_turma = (
                (media_turma['media_assiduidade'] or 0) +
                (media_turma['media_participacao'] or 0) +
                (media_turma['media_responsabilidade'] or 0) +
                (media_turma['media_sociabilidade'] or 0)
            ) / 4
            desempenho_turmas.append({
                'turma': turma.nome,
                'media': round(media_geral_turma, 2),
                'total_alunos': turma.alunos.count(),
                'total_avaliacoes': avaliacoes_turma.count()
            })

    return Response({
        'total_alunos': total_alunos,
        'total_turmas': total_turmas,
        'total_questoes': total_questoes,
        'total_simulados': total_simulados,
        'avaliacoes_recentes': avaliacoes_recentes,
        'top_alunos': top_alunos,
        'desempenho_turmas': desempenho_turmas,
    })


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def professor_turmas(request):
    professor = _get_professor(request)
    if not professor:
        return Response({'detail': 'Acesso negado.'}, status=403)

    turmas = professor.turmas.all()
    turmas_info = []
    for turma in turmas:
        total_alunos = turma.alunos.count()
        avaliacoes_turma = Avaliacao.objects.filter(aluno__turma=turma, professor=professor)
        media_turma = 0
        if avaliacoes_turma.exists():
            media_turma = avaliacoes_turma.aggregate(Avg('assiduidade'))['assiduidade__avg'] or 0
        turmas_info.append({
            'turma': TurmaSerializer(turma).data,
            'total_alunos': total_alunos,
            'media_turma': round(media_turma, 2),
            'total_avaliacoes': avaliacoes_turma.count()
        })

    return Response(turmas_info)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def professor_turma_carometro(request, turma_id):
    professor = _get_professor(request)
    if not professor:
        return Response({'detail': 'Acesso negado.'}, status=403)

    turma = get_object_or_404(Turma, id=turma_id)
    if turma not in professor.turmas.all():
        return Response({'detail': 'Sem permissão para ver esta turma.'}, status=403)

    busca = request.GET.get('busca', '')
    alunos = turma.alunos.all()
    if busca:
        alunos = alunos.filter(user__first_name__icontains=busca) | \
                 alunos.filter(user__last_name__icontains=busca)

    alunos_info = []
    for aluno in alunos:
        avaliacoes = Avaliacao.objects.filter(aluno=aluno)
        media = 0
        if avaliacoes.exists():
            media = sum([av.calcular_media() for av in avaliacoes]) / avaliacoes.count()
        foto_url = None
        if aluno.foto:
            foto_url = request.build_absolute_uri(aluno.foto.url)
        alunos_info.append({
            'id': aluno.user.id,
            'nome': aluno.user.get_full_name() or aluno.user.username,
            'matricula': aluno.matricula,
            'foto_url': foto_url,
            'media_geral': round(media, 2),
            'total_avaliacoes': avaliacoes.count()
        })

    return Response({
        'turma': TurmaSerializer(turma).data,
        'alunos': alunos_info,
        'busca': busca
    })


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def professor_registrar_avaliacao(request, aluno_id):
    professor = _get_professor(request)
    if not professor:
        return Response({'detail': 'Acesso negado.'}, status=403)

    aluno = get_object_or_404(Aluno, pk=aluno_id)
    try:
        avaliacao = Avaliacao.objects.create(
            aluno=aluno,
            professor=professor,
            assiduidade=int(request.data.get('assiduidade', 3)),
            participacao=int(request.data.get('participacao', 3)),
            responsabilidade=int(request.data.get('responsabilidade', 3)),
            sociabilidade=int(request.data.get('sociabilidade', 3))
        )
        return Response({
            'message': f'Avaliação de {aluno.user.get_full_name()} registrada com sucesso!',
            'avaliacao': AvaliacaoSerializer(avaliacao).data
        }, status=201)
    except Exception as e:
        return Response({'detail': str(e)}, status=400)


@api_view(['GET', 'POST'])
@permission_classes([IsAuthenticated])
def professor_banco_questoes(request):
    professor = _get_professor(request)
    if not professor:
        return Response({'detail': 'Acesso negado.'}, status=403)

    if request.method == 'POST':
        try:
            questao = Questao.objects.create(
                autor=professor,
                enunciado=request.data.get('enunciado'),
                resposta=request.data.get('resposta'),
                materia=request.data.get('materia')
            )
            return Response(QuestaoSerializer(questao).data, status=201)
        except Exception as e:
            return Response({'detail': str(e)}, status=400)

    materia_filtro = request.GET.get('materia', '')
    questoes = Questao.objects.filter(autor=professor).order_by('-id')
    if materia_filtro:
        questoes = questoes.filter(materia__icontains=materia_filtro)

    materias = list(Questao.objects.filter(autor=professor).values_list('materia', flat=True).distinct())

    return Response({
        'questoes': QuestaoSerializer(questoes, many=True).data,
        'materias': materias,
        'materia_filtro': materia_filtro
    })


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def professor_criar_simulado_data(request):
    professor = _get_professor(request)
    if not professor:
        return Response({'detail': 'Acesso negado.'}, status=403)

    questoes = Questao.objects.filter(autor=professor)
    turmas = professor.turmas.all()
    return Response({
        'questoes': QuestaoSerializer(questoes, many=True).data,
        'turmas': TurmaSerializer(turmas, many=True).data
    })


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def professor_criar_simulado(request):
    professor = _get_professor(request)
    if not professor:
        return Response({'detail': 'Acesso negado.'}, status=403)

    turma_id = request.data.get('turma')
    questoes_ids = request.data.get('questoes', [])

    if not turma_id or not questoes_ids:
        return Response({'detail': 'Selecione uma turma e pelo menos uma questão.'}, status=400)

    turma = get_object_or_404(Turma, id=turma_id)
    simulado = Simulado.objects.create(autor=professor, turma_alvo=turma)
    simulado.questoes.set(questoes_ids)

    return Response(SimuladoSerializer(simulado).data, status=201)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def professor_lista_simulados(request):
    professor = _get_professor(request)
    if not professor:
        return Response({'detail': 'Acesso negado.'}, status=403)

    simulados = Simulado.objects.filter(autor=professor).select_related('turma_alvo').order_by('-id')
    return Response(SimuladoSerializer(simulados, many=True).data)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def professor_relatorio_aluno(request, aluno_id):
    professor = _get_professor(request)
    if not professor:
        return Response({'detail': 'Acesso negado.'}, status=403)

    aluno = get_object_or_404(Aluno, pk=aluno_id)
    avaliacoes = Avaliacao.objects.filter(aluno=aluno).order_by('-data')
    MAX_SCORE = 5.0

    medias = {'media_assiduidade': 0, 'media_participacao': 0,
              'media_responsabilidade': 0, 'media_sociabilidade': 0}
    media_geral = 0

    if avaliacoes.exists():
        medias = avaliacoes.aggregate(
            media_assiduidade=Avg('assiduidade'),
            media_participacao=Avg('participacao'),
            media_responsabilidade=Avg('responsabilidade'),
            media_sociabilidade=Avg('sociabilidade')
        )
        medias = {k: v or 0 for k, v in medias.items()}
        media_geral = sum(medias.values()) / 4

    def calc_percent(value):
        if value and MAX_SCORE > 0:
            return round((value / MAX_SCORE) * 100)
        return 0

    foto_url = None
    if aluno.foto:
        foto_url = request.build_absolute_uri(aluno.foto.url)

    return Response({
        'aluno': {
            'id': aluno.user.id,
            'nome': aluno.user.get_full_name() or aluno.user.username,
            'matricula': aluno.matricula,
            'turma': aluno.turma.nome if aluno.turma else '',
            'foto_url': foto_url,
        },
        'medias': {
            'assiduidade': round(medias['media_assiduidade'], 2),
            'participacao': round(medias['media_participacao'], 2),
            'responsabilidade': round(medias['media_responsabilidade'], 2),
            'sociabilidade': round(medias['media_sociabilidade'], 2),
            'assiduidade_percentual': calc_percent(medias['media_assiduidade']),
            'participacao_percentual': calc_percent(medias['media_participacao']),
            'responsabilidade_percentual': calc_percent(medias['media_responsabilidade']),
            'sociabilidade_percentual': calc_percent(medias['media_sociabilidade']),
        },
        'media_geral': round(media_geral, 2),
        'total_avaliacoes': avaliacoes.count(),
        'avaliacoes': AvaliacaoSerializer(avaliacoes, many=True).data
    })


# ==========================================
# ALUNO
# ==========================================

def _get_aluno(request):
    if not hasattr(request.user, 'aluno'):
        return None
    return request.user.aluno


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def aluno_dashboard(request):
    aluno = _get_aluno(request)
    if not aluno:
        return Response({'detail': 'Acesso negado.'}, status=403)

    avaliacoes = Avaliacao.objects.filter(aluno=aluno).order_by('-data')

    medias = {'media_assiduidade': 0, 'media_participacao': 0,
              'media_responsabilidade': 0, 'media_sociabilidade': 0}
    media_geral = 0
    evolucao = 0

    if avaliacoes.exists():
        medias = avaliacoes.aggregate(
            media_assiduidade=Avg('assiduidade'),
            media_participacao=Avg('participacao'),
            media_responsabilidade=Avg('responsabilidade'),
            media_sociabilidade=Avg('sociabilidade')
        )
        medias = {k: v or 0 for k, v in medias.items()}
        media_geral = sum(medias.values()) / 4

        if avaliacoes.count() > 1:
            ultima = avaliacoes.first()
            evolucao = round(ultima.calcular_media() - media_geral, 2)

    simulados = Simulado.objects.filter(turma_alvo=aluno.turma).select_related('autor')[:5]
    foto_url = None
    if aluno.foto:
        foto_url = request.build_absolute_uri(aluno.foto.url)

    return Response({
        'aluno': {
            'id': aluno.user.id,
            'nome': aluno.user.get_full_name() or aluno.user.username,
            'matricula': aluno.matricula,
            'turma': aluno.turma.nome if aluno.turma else '',
            'foto_url': foto_url,
        },
        'media_geral': round(media_geral, 2),
        'medias': {
            'assiduidade': round(medias['media_assiduidade'], 2),
            'participacao': round(medias['media_participacao'], 2),
            'responsabilidade': round(medias['media_responsabilidade'], 2),
            'sociabilidade': round(medias['media_sociabilidade'], 2),
        },
        'avaliacoes_recentes': AvaliacaoSerializer(avaliacoes[:5], many=True).data,
        'total_avaliacoes': avaliacoes.count(),
        'evolucao': evolucao,
        'simulados': SimuladoSerializer(simulados, many=True).data,
    })


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def aluno_meu_feedback(request):
    aluno = _get_aluno(request)
    if not aluno:
        return Response({'detail': 'Acesso negado.'}, status=403)

    avaliacoes = Avaliacao.objects.filter(aluno=aluno).order_by('-data')

    medias = {'media_assiduidade': 0, 'media_participacao': 0,
              'media_responsabilidade': 0, 'media_sociabilidade': 0}
    media_geral = 0

    if avaliacoes.exists():
        medias = avaliacoes.aggregate(
            media_assiduidade=Avg('assiduidade'),
            media_participacao=Avg('participacao'),
            media_responsabilidade=Avg('responsabilidade'),
            media_sociabilidade=Avg('sociabilidade')
        )
        medias = {k: v or 0 for k, v in medias.items()}
        media_geral = sum(medias.values()) / 4

    foto_url = None
    if aluno.foto:
        foto_url = request.build_absolute_uri(aluno.foto.url)

    return Response({
        'aluno': {
            'id': aluno.user.id,
            'nome': aluno.user.get_full_name() or aluno.user.username,
            'foto_url': foto_url,
        },
        'medias': {
            'assiduidade': round(medias['media_assiduidade'], 2),
            'participacao': round(medias['media_participacao'], 2),
            'responsabilidade': round(medias['media_responsabilidade'], 2),
            'sociabilidade': round(medias['media_sociabilidade'], 2),
        },
        'media_geral': round(media_geral, 2),
        'avaliacoes': AvaliacaoSerializer(avaliacoes, many=True).data
    })


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def aluno_meus_simulados(request):
    aluno = _get_aluno(request)
    if not aluno:
        return Response({'detail': 'Acesso negado.'}, status=403)

    simulados = Simulado.objects.filter(turma_alvo=aluno.turma).select_related('autor')
    return Response(SimuladoSerializer(simulados, many=True).data)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def aluno_visualizar_simulado(request, simulado_id):
    aluno = _get_aluno(request)
    if not aluno:
        return Response({'detail': 'Acesso negado.'}, status=403)

    simulado = get_object_or_404(Simulado, id=simulado_id)
    if simulado.turma_alvo != aluno.turma:
        return Response({'detail': 'Sem acesso a este simulado.'}, status=403)

    return Response(SimuladoSerializer(simulado).data)
