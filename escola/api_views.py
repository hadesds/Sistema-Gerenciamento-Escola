from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework import status
from django.shortcuts import get_object_or_404
from django.db.models import Avg
from datetime import datetime, timedelta

from .models import Professor, Aluno, Turma, Avaliacao, Questao, Simulado, NotaMateria, PerfilTurma, RegistroAssiduidade, PresencaAluno, AlternativaQuestao, Materia, ProvaIndividual
from .serializers import (
    TurmaSerializer, AlunoBasicSerializer, AvaliacaoSerializer,
    QuestaoSerializer, SimuladoSerializer, MeSerializer, NotaMateriaSerializer,
    MateriaSerializer
)

SIGLA_TO_NOTA_MATERIA = {
    'PRT': 'portugues',
    'MTM': 'matematica',
    'CNC': 'ciencias',
    'GGF': 'geografia',
    'ART': 'artes',
    'ING': 'ingles',
    'EDF': 'educacao_fisica',
    'FIL': 'filosofia',
}


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

    turmas_lista = []
    for turma in turmas:
        turmas_lista.append({
            'id': turma.id,
            'nome': turma.nome,
            'total_alunos': turma.alunos.count(),
        })

    return Response({
        'total_alunos': total_alunos,
        'total_turmas': total_turmas,
        'total_questoes': total_questoes,
        'total_simulados': total_simulados,
        'avaliacoes_recentes': avaliacoes_recentes,
        'top_alunos': top_alunos,
        'desempenho_turmas': desempenho_turmas,
        'turmas': turmas_lista,
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
        alunos_preview = []
        for aluno in turma.alunos.all()[:4]:
            foto_url = request.build_absolute_uri(aluno.foto.url) if aluno.foto else None
            alunos_preview.append({
                'nome': aluno.user.get_full_name() or aluno.user.username,
                'foto_url': foto_url,
            })
        turmas_info.append({
            'turma': TurmaSerializer(turma).data,
            'total_alunos': total_alunos,
            'media_turma': round(media_turma, 2),
            'total_avaliacoes': avaliacoes_turma.count(),
            'alunos_preview': alunos_preview,
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
        papel = None
        try:
            papel = aluno.perfil_turma.papel
        except Exception:
            pass
        alunos_info.append({
            'id': aluno.user.id,
            'nome': aluno.user.get_full_name() or aluno.user.username,
            'matricula': aluno.matricula,
            'foto_url': foto_url,
            'media_geral': round(media, 2),
            'total_avaliacoes': avaliacoes.count(),
            'papel': papel,
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
        from decimal import Decimal

        materia_id = request.data.get('materia_id')
        if not materia_id:
            return Response({'detail': 'A matéria é obrigatória.'}, status=400)
        materia_obj = get_object_or_404(Materia, pk=materia_id)

        observacao = request.data.get('observacao', '')
        # provas_bimestrais: { '1B': [8.5, 7.0], '2B': [9.0], ... }
        provas_bimestrais = request.data.get('provas_bimestrais', {})

        avaliacao = Avaliacao.objects.create(
            aluno=aluno,
            professor=professor,
            assiduidade=int(request.data.get('assiduidade', 3)),
            participacao=int(request.data.get('participacao', 3)),
            responsabilidade=int(request.data.get('responsabilidade', 3)),
            sociabilidade=int(request.data.get('sociabilidade', 3)),
            materia=materia_obj,
            observacao=observacao,
        )

        materia_key = SIGLA_TO_NOTA_MATERIA.get(materia_obj.sigla)
        epocas_validas = {'1B', '2B', '3B', '4B'}

        for epoca, notas_lista in provas_bimestrais.items():
            if epoca not in epocas_validas or not isinstance(notas_lista, list):
                continue

            notas_validas = []
            for nota_val in notas_lista:
                try:
                    n = float(nota_val)
                    if 0 <= n <= 10:
                        notas_validas.append(n)
                except (TypeError, ValueError):
                    pass

            if not notas_validas:
                continue

            # Substitui as provas individuais deste bimestre para esta matéria/aluno
            ProvaIndividual.objects.filter(aluno=aluno, materia=materia_obj, epoca=epoca).delete()
            for i, nota_val in enumerate(notas_validas, 1):
                ProvaIndividual.objects.create(
                    aluno=aluno,
                    professor=professor,
                    materia=materia_obj,
                    epoca=epoca,
                    numero=i,
                    nota=Decimal(str(round(nota_val, 2))),
                )

            # Salva a média no NotaMateria (retrocompatibilidade)
            media = sum(notas_validas) / len(notas_validas)
            if materia_key:
                NotaMateria.objects.update_or_create(
                    aluno=aluno, materia=materia_key, epoca=epoca,
                    defaults={'professor': professor, 'nota': Decimal(str(round(media, 2)))}
                )

        return Response({
            'message': f'Avaliação de {aluno.user.get_full_name()} registrada com sucesso!',
            'avaliacao': AvaliacaoSerializer(avaliacao).data
        }, status=201)
    except Exception as e:
        return Response({'detail': str(e)}, status=400)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def professor_provas_aluno(request, aluno_id):
    """Retorna as provas individuais de um aluno por matéria e época."""
    professor = _get_professor(request)
    if not professor:
        return Response({'detail': 'Acesso negado.'}, status=403)

    aluno = get_object_or_404(Aluno, pk=aluno_id)
    materia_id = request.query_params.get('materia_id')
    if not materia_id:
        return Response({'detail': 'materia_id é obrigatório.'}, status=400)

    provas = ProvaIndividual.objects.filter(
        aluno=aluno, materia_id=materia_id
    ).order_by('epoca', 'numero')

    result = {'1B': [], '2B': [], '3B': [], '4B': []}
    for p in provas:
        result[p.epoca].append(float(p.nota))

    return Response(result)


@api_view(['GET', 'POST'])
@permission_classes([IsAuthenticated])
def professor_banco_questoes(request):
    professor = _get_professor(request)
    if not professor:
        return Response({'detail': 'Acesso negado.'}, status=403)

    if request.method == 'POST':
        try:
            tipo = request.data.get('tipo', 'discursiva')
            materia_id = request.data.get('materia')
            materia = Materia.objects.filter(id=materia_id).first() if materia_id else None
            questao = Questao.objects.create(
                autor=professor,
                enunciado=request.data.get('enunciado', ''),
                resposta=request.data.get('resposta', ''),
                materia=materia,
                dificuldade=request.data.get('dificuldade', 'medio'),
                tipo=tipo,
                exige_justificativa=bool(request.data.get('exige_justificativa', False)),
            )
            if tipo == 'objetiva':
                for i, alt in enumerate(request.data.get('alternativas', [])):
                    texto = str(alt.get('texto', '')).strip()
                    if texto:
                        AlternativaQuestao.objects.create(
                            questao=questao,
                            texto=texto,
                            correta=bool(alt.get('correta', False)),
                            ordem=i,
                        )
            return Response(QuestaoSerializer(questao).data, status=201)
        except Exception as e:
            return Response({'detail': str(e)}, status=400)

    materia_filtro = request.GET.get('materia', '')
    questoes = Questao.objects.filter(autor=professor).order_by('-id')
    if materia_filtro:
        questoes = questoes.filter(materia__sigla=materia_filtro)

    return Response({
        'questoes': QuestaoSerializer(questoes, many=True).data,
        'materias': MateriaSerializer(Materia.objects.all(), many=True).data,
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
        'turmas': TurmaSerializer(turmas, many=True).data,
        'materias': MateriaSerializer(Materia.objects.all(), many=True).data,
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
    simulado.titulo = request.data.get('titulo', '')
    simulado.tempo_limite = request.data.get('tempo_limite') or None
    simulado.area_conhecimento = request.data.get('area_conhecimento', '')
    simulado.save()

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
def professor_materias(request):
    professor = _get_professor(request)
    if not professor:
        return Response({'detail': 'Acesso negado.'}, status=403)
    materias = Materia.objects.all()
    return Response(MateriaSerializer(materias, many=True).data)


@api_view(['GET', 'PATCH', 'DELETE'])
@permission_classes([IsAuthenticated])
def professor_detalhe_simulado(request, simulado_id):
    professor = _get_professor(request)
    if not professor:
        return Response({'detail': 'Acesso negado.'}, status=403)

    simulado = get_object_or_404(Simulado, id=simulado_id, autor=professor)

    if request.method == 'GET':
        return Response(SimuladoSerializer(simulado).data)

    if request.method == 'PATCH':
        if 'titulo' in request.data:
            simulado.titulo = request.data['titulo']
        if 'tempo_limite' in request.data:
            simulado.tempo_limite = request.data['tempo_limite'] or None
        if 'area_conhecimento' in request.data:
            simulado.area_conhecimento = request.data['area_conhecimento']
        if 'turma' in request.data:
            turma = get_object_or_404(Turma, id=request.data['turma'])
            simulado.turma_alvo = turma
        simulado.save()
        return Response(SimuladoSerializer(simulado).data)

    if request.method == 'DELETE':
        simulado.delete()
        return Response(status=204)


@api_view(['DELETE'])
@permission_classes([IsAuthenticated])
def professor_remover_questao_simulado(request, simulado_id, questao_id):
    professor = _get_professor(request)
    if not professor:
        return Response({'detail': 'Acesso negado.'}, status=403)

    simulado = get_object_or_404(Simulado, id=simulado_id, autor=professor)
    questao = get_object_or_404(Questao, id=questao_id)
    simulado.questoes.remove(questao)
    return Response(SimuladoSerializer(simulado).data)


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
        return round((value / MAX_SCORE) * 100) if value and MAX_SCORE > 0 else 0

    foto_url = None
    if aluno.foto:
        foto_url = request.build_absolute_uri(aluno.foto.url)

    # Notas por matéria
    notas_qs = NotaMateria.objects.filter(aluno=aluno).order_by('epoca', 'materia')
    notas_por_epoca = {}
    medias_por_materia = {}

    for nota in notas_qs:
        epoca_key = nota.get_epoca_display()
        mat_key   = nota.get_materia_display()
        notas_por_epoca.setdefault(epoca_key, {})[mat_key] = float(nota.nota)
        medias_por_materia.setdefault(mat_key, []).append(float(nota.nota))

    medias_materias = {
        mat: round(sum(vals) / len(vals), 2)
        for mat, vals in medias_por_materia.items()
    }
    media_geral_materias = (
        round(sum(medias_materias.values()) / len(medias_materias), 2)
        if medias_materias else None
    )

    # Provas individuais agrupadas por matéria e época
    provas_qs = ProvaIndividual.objects.filter(aluno=aluno).select_related('materia').order_by('materia__nome', 'epoca', 'numero')
    provas_por_materia: dict = {}
    for p in provas_qs:
        mat = p.materia.nome
        if mat not in provas_por_materia:
            provas_por_materia[mat] = {'1B': [], '2B': [], '3B': [], '4B': []}
        provas_por_materia[mat][p.epoca].append(float(p.nota))

    # Médias por matéria a partir das provas individuais
    medias_provas: dict = {}
    for mat, epocas in provas_por_materia.items():
        todas = [n for lista in epocas.values() for n in lista]
        if todas:
            medias_provas[mat] = round(sum(todas) / len(todas), 2)

    media_geral_provas = (
        round(sum(medias_provas.values()) / len(medias_provas), 2)
        if medias_provas else None
    )

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
        'avaliacoes': AvaliacaoSerializer(avaliacoes, many=True).data,
        # notas por matéria (NotaMateria – retrocompatibilidade)
        'notas_por_epoca': notas_por_epoca,
        'medias_materias': medias_materias,
        'media_geral_materias': media_geral_materias,
        # provas individuais agrupadas
        'provas_por_materia': provas_por_materia,
        'medias_provas': medias_provas,
        'media_geral_provas': media_geral_provas,
    })


@api_view(['GET', 'POST'])
@permission_classes([IsAuthenticated])
def professor_notas_aluno(request, aluno_id):
    """GET: retorna notas do aluno. POST: lança/atualiza notas de uma época."""
    professor = _get_professor(request)
    if not professor:
        return Response({'detail': 'Acesso negado.'}, status=403)

    aluno = get_object_or_404(Aluno, pk=aluno_id)

    if request.method == 'GET':
        notas = NotaMateria.objects.filter(aluno=aluno)
        return Response(NotaMateriaSerializer(notas, many=True).data)

    # POST: { epoca: '1B', notas: { portugues: 8.5, matematica: 7.0, ... } }
    epoca = request.data.get('epoca')
    notas_dict = request.data.get('notas', {})

    if not epoca or not notas_dict:
        return Response({'detail': 'Informe a época e as notas.'}, status=400)

    epocas_validas = [e[0] for e in NotaMateria.EPOCAS]
    if epoca not in epocas_validas:
        return Response({'detail': 'Época inválida.'}, status=400)

    materias_validas = [m[0] for m in NotaMateria.MATERIAS]
    criadas = []
    for materia, nota_val in notas_dict.items():
        if materia not in materias_validas:
            continue
        try:
            nota_float = float(nota_val)
            if not (0 <= nota_float <= 10):
                continue
        except (TypeError, ValueError):
            continue

        obj, _ = NotaMateria.objects.update_or_create(
            aluno=aluno, materia=materia, epoca=epoca,
            defaults={'professor': professor, 'nota': nota_float}
        )
        criadas.append(obj)

    return Response(NotaMateriaSerializer(criadas, many=True).data, status=201)


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

    # Notas por matéria
    notas_qs = NotaMateria.objects.filter(aluno=aluno).order_by('epoca', 'materia')
    notas_por_epoca = {}
    medias_por_materia = {}
    for nota in notas_qs:
        ep  = nota.get_epoca_display()
        mat = nota.get_materia_display()
        notas_por_epoca.setdefault(ep, {})[mat] = float(nota.nota)
        medias_por_materia.setdefault(mat, []).append(float(nota.nota))

    medias_materias = {
        mat: round(sum(v) / len(v), 2)
        for mat, v in medias_por_materia.items()
    }
    media_geral_materias = (
        round(sum(medias_materias.values()) / len(medias_materias), 2)
        if medias_materias else None
    )

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
        'avaliacoes': AvaliacaoSerializer(avaliacoes, many=True).data,
        'notas_por_epoca': notas_por_epoca,
        'medias_materias': medias_materias,
        'media_geral_materias': media_geral_materias,
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


# ==========================================
# PERFIL TURMA (líder / vice-líder)
# ==========================================

@api_view(['POST', 'DELETE'])
@permission_classes([IsAuthenticated])
def professor_perfil_turma(request, aluno_id):
    professor = _get_professor(request)
    if not professor:
        return Response({'detail': 'Acesso negado.'}, status=403)

    aluno = get_object_or_404(Aluno, pk=aluno_id)

    if request.method == 'DELETE':
        PerfilTurma.objects.filter(aluno=aluno).delete()
        return Response({'detail': 'Perfil removido.'})

    papel = request.data.get('papel')
    if papel not in ('lider', 'vice'):
        return Response({'detail': 'Papel inválido. Use "lider" ou "vice".'}, status=400)

    if not aluno.turma:
        return Response({'detail': 'Aluno sem turma.'}, status=400)

    # Garante unicidade: remove perfil anterior do mesmo papel na turma e do aluno
    PerfilTurma.objects.filter(turma=aluno.turma, papel=papel).delete()
    PerfilTurma.objects.filter(aluno=aluno).delete()

    perfil = PerfilTurma.objects.create(aluno=aluno, turma=aluno.turma, papel=papel)
    return Response({
        'id': perfil.id,
        'papel': perfil.papel,
        'papel_display': perfil.get_papel_display(),
    }, status=201)


# ==========================================
# ASSIDUIDADE (registrado pelo líder/vice)
# ==========================================

def _get_aluno_lider(request):
    aluno = _get_aluno(request)
    if not aluno:
        return None, 'Acesso negado.'
    try:
        _ = aluno.perfil_turma
    except Exception:
        return None, 'Apenas líderes e vice-líderes podem registrar assiduidade.'
    return aluno, None


@api_view(['GET', 'POST'])
@permission_classes([IsAuthenticated])
def aluno_assiduidade(request):
    aluno, erro = _get_aluno_lider(request)
    if erro:
        return Response({'detail': erro}, status=403)

    turma = aluno.turma
    if not turma:
        return Response({'detail': 'Aluno sem turma.'}, status=400)

    if request.method == 'GET':
        alunos_turma = [
            {
                'id': a.user.pk,
                'nome': a.user.get_full_name() or a.user.username,
                'matricula': a.matricula,
                'presente': True,
            }
            for a in Aluno.objects.filter(turma=turma).select_related('user').order_by('user__first_name')
        ]
        registros_qs = RegistroAssiduidade.objects.filter(turma=turma).prefetch_related('presencas')[:30]
        historico = []
        for reg in registros_qs:
            presencas_list = list(reg.presencas.all())
            total = len(presencas_list)
            presentes = sum(1 for p in presencas_list if p.presente)
            historico.append({
                'id': reg.id,
                'data': reg.data.isoformat(),
                'observacao': reg.observacao,
                'registrado_por': reg.registrado_por.user.get_full_name() or reg.registrado_por.user.username,
                'total': total,
                'presentes': presentes,
                'ausentes': total - presentes,
            })
        return Response({
            'turma': turma.nome,
            'papel': aluno.perfil_turma.papel,
            'papel_display': aluno.perfil_turma.get_papel_display(),
            'alunos': alunos_turma,
            'historico': historico,
        })

    # POST — registrar nova chamada
    presencas_data = request.data.get('presencas_data', {})  # {str(aluno_id): bool}
    observacao = request.data.get('observacao', '')

    registro = RegistroAssiduidade.objects.create(
        turma=turma,
        registrado_por=aluno,
        observacao=observacao,
    )
    for a in Aluno.objects.filter(turma=turma):
        presente = presencas_data.get(str(a.user.pk), True)
        PresencaAluno.objects.create(registro=registro, aluno=a, presente=bool(presente))

    return Response({'detail': 'Assiduidade registrada!', 'id': registro.id}, status=201)
