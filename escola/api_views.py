from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework import status
from django.shortcuts import get_object_or_404
from django.db.models import Avg
from datetime import datetime, timedelta

from .models import Professor, Aluno, Turma, Avaliacao, Questao, Simulado, NotaMateria, PerfilTurma, RegistroAssiduidade, PresencaAluno, AlternativaQuestao, Materia, ProvaIndividual, SimuladoQuestao
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
                media = {k: float(v or 0) for k, v in avaliacoes.aggregate(
                    media_assiduidade=Avg('assiduidade'),
                    media_participacao=Avg('participacao'),
                    media_responsabilidade=Avg('responsabilidade'),
                    media_sociabilidade=Avg('sociabilidade')
                ).items()}
                media_geral = (
                    media['media_assiduidade'] +
                    media['media_participacao'] +
                    media['media_responsabilidade'] +
                    media['media_sociabilidade']
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
            media_turma = {k: float(v or 0) for k, v in avaliacoes_turma.aggregate(
                media_assiduidade=Avg('assiduidade'),
                media_participacao=Avg('participacao'),
                media_responsabilidade=Avg('responsabilidade'),
                media_sociabilidade=Avg('sociabilidade')
            ).items()}
            media_geral_turma = (
                media_turma['media_assiduidade'] +
                media_turma['media_participacao'] +
                media_turma['media_responsabilidade'] +
                media_turma['media_sociabilidade']
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
            media_turma = float(avaliacoes_turma.aggregate(Avg('assiduidade'))['assiduidade__avg'] or 0)
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
            media = sum([float(av.calcular_media()) for av in avaliacoes]) / avaliacoes.count()
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

        def _comportamento(key):
            try:
                v = round(float(request.data.get(key, 3.0)) * 2) / 2  # arredonda ao 0.5 mais próximo
                return max(0.0, min(5.0, v))
            except (TypeError, ValueError):
                return 3.0

        avaliacao = Avaliacao.objects.create(
            aluno=aluno,
            professor=professor,
            assiduidade=_comportamento('assiduidade'),
            participacao=_comportamento('participacao'),
            responsabilidade=_comportamento('responsabilidade'),
            sociabilidade=_comportamento('sociabilidade'),
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
                imagem=request.FILES.get('imagem') or None,
                materia=materia,
                dificuldade=request.data.get('dificuldade', 'medio'),
                tipo=tipo,
                exige_justificativa=bool(request.data.get('exige_justificativa', False)),
            )
            if tipo == 'objetiva':
                import json as _json
                alternativas_raw = request.data.get('alternativas', [])
                if isinstance(alternativas_raw, str):
                    try:
                        alternativas_raw = _json.loads(alternativas_raw)
                    except Exception:
                        alternativas_raw = []
                for i, alt in enumerate(alternativas_raw):
                    texto = str(alt.get('texto', '')).strip()
                    if texto:
                        AlternativaQuestao.objects.create(
                            questao=questao,
                            texto=texto,
                            correta=bool(alt.get('correta', False)),
                            ordem=i,
                        )
            return Response(QuestaoSerializer(questao, context={'request': request}).data, status=201)
        except Exception as e:
            return Response({'detail': str(e)}, status=400)

    materia_filtro = request.GET.get('materia', '')
    questoes = Questao.objects.filter(autor=professor).order_by('-id')
    if materia_filtro:
        questoes = questoes.filter(materia__sigla=materia_filtro)

    ctx = {'request': request}
    return Response({
        'questoes': QuestaoSerializer(questoes, many=True, context=ctx).data,
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
    ctx = {'request': request}
    return Response({
        'questoes': QuestaoSerializer(questoes, many=True, context=ctx).data,
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
    questoes_payload = request.data.get('questoes', [])

    if not turma_id or not questoes_payload:            
        return Response({'detail': 'Selecione uma turma e pelo menos uma questão.'}, status=400)

    turma = get_object_or_404(Turma, id=turma_id)
    simulado = Simulado.objects.create(autor=professor, turma_alvo=turma)
    for item in questoes_payload:                      
        SimuladoQuestao.objects.create(
            simulado=simulado,
            questao_id=item['id'],
            valor=item.get('valor', 1.0),
    )
    simulado.titulo = request.data.get('titulo', '')
    simulado.tempo_limite = request.data.get('tempo_limite') or None
    simulado.area_conhecimento = request.data.get('area_conhecimento', '')
    simulado.save()

    return Response(SimuladoSerializer(simulado, context={'request': request}).data, status=201)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def professor_lista_simulados(request):
    professor = _get_professor(request)
    if not professor:
        return Response({'detail': 'Acesso negado.'}, status=403)

    simulados = Simulado.objects.filter(autor=professor).select_related('turma_alvo').order_by('-id')
    return Response(SimuladoSerializer(simulados, many=True, context={'request': request}).data)


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
        return Response(SimuladoSerializer(simulado, context={'request': request}).data)

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
        return Response(SimuladoSerializer(simulado, context={'request': request}).data)

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
    return Response(SimuladoSerializer(simulado, context={'request': request}).data)


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
        medias = {k: float(v or 0) for k, v in medias.items()}
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
        medias = {k: float(v or 0) for k, v in medias.items()}
        media_geral = sum(medias.values()) / 4

        if avaliacoes.count() > 1:
            ultima = avaliacoes.first()
            evolucao = round(float(ultima.calcular_media()) - media_geral, 2)

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
        'simulados': SimuladoSerializer(simulados, many=True, context={'request': request}).data,
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
        medias = {k: float(v or 0) for k, v in medias.items()}
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
    return Response(SimuladoSerializer(simulados, many=True, context={'request': request}).data)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def aluno_visualizar_simulado(request, simulado_id):
    aluno = _get_aluno(request)
    if not aluno:
        return Response({'detail': 'Acesso negado.'}, status=403)

    simulado = get_object_or_404(Simulado, id=simulado_id)
    if simulado.turma_alvo != aluno.turma:
        return Response({'detail': 'Sem acesso a este simulado.'}, status=403)

    return Response(SimuladoSerializer(simulado, context={'request': request}).data)


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


# ==========================================
# RELATÓRIO PDF
# ==========================================

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def professor_relatorio_pdf(request, aluno_id):
    """Gera e devolve o relatório completo do aluno em PDF via ReportLab."""
    from io import BytesIO
    from datetime import date
    from django.http import HttpResponse
    from reportlab.lib import colors
    from reportlab.lib.pagesizes import A4
    from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
    from reportlab.lib.units import cm
    from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, HRFlowable
    from reportlab.lib.enums import TA_CENTER, TA_LEFT

    professor = _get_professor(request)
    if not professor:
        return HttpResponse('Acesso negado.', status=403)

    aluno = get_object_or_404(Aluno, pk=aluno_id)
    avaliacoes = Avaliacao.objects.filter(aluno=aluno).order_by('-data')
    MAX_SCORE = 5.0

    # ── médias comportamentais ──────────────────────────────────────────────
    medias = {'media_assiduidade': 0.0, 'media_participacao': 0.0,
              'media_responsabilidade': 0.0, 'media_sociabilidade': 0.0}
    if avaliacoes.exists():
        agg = avaliacoes.aggregate(
            media_assiduidade=Avg('assiduidade'),
            media_participacao=Avg('participacao'),
            media_responsabilidade=Avg('responsabilidade'),
            media_sociabilidade=Avg('sociabilidade'),
        )
        medias = {k: float(v or 0) for k, v in agg.items()}
    media_geral_comp = sum(medias.values()) / 4

    def calc_percent(v):
        return round((v / MAX_SCORE) * 100) if v and MAX_SCORE > 0 else 0

    # ── notas por matéria (ProvaIndividual) ────────────────────────────────
    provas_qs = ProvaIndividual.objects.filter(aluno=aluno).select_related('materia').order_by('materia__nome', 'epoca', 'numero')
    provas_por_materia: dict = {}
    for p in provas_qs:
        mat = p.materia.nome
        if mat not in provas_por_materia:
            provas_por_materia[mat] = {'1B': [], '2B': [], '3B': [], '4B': []}
        provas_por_materia[mat][p.epoca].append(float(p.nota))

    # fallback: NotaMateria (legado)
    notas_por_epoca: dict = {}
    medias_materias: dict = {}
    if not provas_por_materia:
        notas_qs = NotaMateria.objects.filter(aluno=aluno).order_by('epoca', 'materia')
        medias_raw: dict = {}
        for nota in notas_qs:
            ek = nota.get_epoca_display()
            mk = nota.get_materia_display()
            notas_por_epoca.setdefault(ek, {})[mk] = float(nota.nota)
            medias_raw.setdefault(mk, []).append(float(nota.nota))
        medias_materias = {m: round(sum(v)/len(v), 2) for m, v in medias_raw.items()}

    def _avg(lst):
        return round(sum(lst) / len(lst), 2) if lst else None

    # ── build PDF ──────────────────────────────────────────────────────────
    buffer = BytesIO()
    doc = SimpleDocTemplate(
        buffer, pagesize=A4,
        leftMargin=2*cm, rightMargin=2*cm, topMargin=2*cm, bottomMargin=2*cm,
    )

    styles = getSampleStyleSheet()
    title_style = ParagraphStyle('Title', parent=styles['Title'], fontSize=16, spaceAfter=4, alignment=TA_CENTER)
    subtitle_style = ParagraphStyle('Sub', parent=styles['Normal'], fontSize=9, textColor=colors.grey, alignment=TA_CENTER, spaceAfter=12)
    section_style = ParagraphStyle('Section', parent=styles['Heading2'], fontSize=12, spaceBefore=14, spaceAfter=6, textColor=colors.HexColor('#0d2d6b'))
    body_style = ParagraphStyle('Body', parent=styles['Normal'], fontSize=9, leading=13)

    PRIMARY = colors.HexColor('#0d2d6b')
    LIGHT = colors.HexColor('#e8f0fc')
    SUCCESS = colors.HexColor('#27ae60')
    WARNING = colors.HexColor('#f39c12')
    DANGER = colors.HexColor('#e74c3c')

    def nota_color(n):
        if n is None:
            return colors.grey
        if n >= 7:
            return SUCCESS
        if n >= 5:
            return WARNING
        return DANGER

    story = []

    # Cabeçalho
    story.append(Paragraph('Sistema CARA – Relatório do Aluno', title_style))
    story.append(Paragraph(f'Gerado em {date.today().strftime("%d/%m/%Y")}', subtitle_style))
    story.append(HRFlowable(width='100%', thickness=1, color=PRIMARY))
    story.append(Spacer(1, 0.3*cm))

    # ── Seção 1: Identificação ─────────────────────────────────────────────
    story.append(Paragraph('Identificação', section_style))
    nome = aluno.user.get_full_name() or aluno.user.username
    turma_nome = aluno.turma.nome if aluno.turma else '–'
    matricula = aluno.matricula or '–'
    id_data = [
        ['Nome', nome, 'Turma', turma_nome],
        ['Matrícula', matricula, 'Total de Avaliações', str(avaliacoes.count())],
    ]
    id_table = Table(id_data, colWidths=[3.5*cm, 7*cm, 3*cm, 3.5*cm])
    id_table.setStyle(TableStyle([
        ('FONTNAME', (0,0), (-1,-1), 'Helvetica'),
        ('FONTNAME', (0,0), (0,-1), 'Helvetica-Bold'),
        ('FONTNAME', (2,0), (2,-1), 'Helvetica-Bold'),
        ('FONTSIZE', (0,0), (-1,-1), 9),
        ('BACKGROUND', (0,0), (-1,-1), LIGHT),
        ('ROWBACKGROUNDS', (0,0), (-1,-1), [LIGHT, colors.white]),
        ('GRID', (0,0), (-1,-1), 0.5, colors.HexColor('#cccccc')),
        ('PADDING', (0,0), (-1,-1), 4),
    ]))
    story.append(id_table)
    story.append(Spacer(1, 0.4*cm))

    # ── Seção 2: Notas por Matéria e Bimestre ─────────────────────────────
    story.append(Paragraph('Notas por Matéria e Bimestre', section_style))
    EPOCAS_KEYS = ['1B', '2B', '3B', '4B']
    EPOCAS_LABELS = ['1° Bimestre', '2° Bimestre', '3° Bimestre', '4° Bimestre']

    if provas_por_materia:
        header_row = ['Matéria'] + EPOCAS_LABELS + ['Média Anual']
        table_data = [header_row]
        all_means = []
        bim_means = {k: [] for k in EPOCAS_KEYS}

        for mat, epocas in sorted(provas_por_materia.items()):
            row = [mat]
            mat_all = []
            for ek in EPOCAS_KEYS:
                lst = epocas.get(ek, [])
                m = _avg(lst)
                row.append(f'{m:.2f}' if m is not None else '–')
                if m is not None:
                    mat_all.append(m)
                    bim_means[ek].append(m)
            ma = _avg(mat_all)
            row.append(f'{ma:.2f}' if ma is not None else '–')
            if ma is not None:
                all_means.append(ma)
            table_data.append(row)

        # linha de média geral
        mg_row = ['Média Geral']
        for ek in EPOCAS_KEYS:
            mg = _avg(bim_means[ek])
            mg_row.append(f'{mg:.2f}' if mg is not None else '–')
        mga = _avg(all_means)
        mg_row.append(f'{mga:.2f}' if mga is not None else '–')
        table_data.append(mg_row)

        col_w = [4.5*cm] + [2.5*cm]*4 + [2.5*cm]
        nt = Table(table_data, colWidths=col_w)
        n_rows = len(table_data)
        nt.setStyle(TableStyle([
            ('BACKGROUND', (0,0), (-1,0), PRIMARY),
            ('TEXTCOLOR', (0,0), (-1,0), colors.white),
            ('FONTNAME', (0,0), (-1,0), 'Helvetica-Bold'),
            ('FONTSIZE', (0,0), (-1,-1), 8),
            ('FONTNAME', (0,1), (0,-1), 'Helvetica-Bold'),
            ('FONTNAME', (0,n_rows-1), (-1,n_rows-1), 'Helvetica-Bold'),
            ('BACKGROUND', (0,n_rows-1), (-1,n_rows-1), LIGHT),
            ('ROWBACKGROUNDS', (0,1), (-1,n_rows-2), [colors.white, colors.HexColor('#f5f8ff')]),
            ('GRID', (0,0), (-1,-1), 0.5, colors.HexColor('#cccccc')),
            ('ALIGN', (1,0), (-1,-1), 'CENTER'),
            ('PADDING', (0,0), (-1,-1), 4),
        ]))
        story.append(nt)

    elif notas_por_epoca:
        EPOCAS_ORDER = ['1° Bimestre', '2° Bimestre', '3° Bimestre', '4° Bimestre']
        epocas_presentes = [e for e in EPOCAS_ORDER if e in notas_por_epoca]
        materias = sorted(medias_materias.keys())
        header_row = ['Matéria'] + epocas_presentes + ['Média']
        table_data = [header_row]
        for mat in materias:
            row = [mat]
            for ep in epocas_presentes:
                n = notas_por_epoca.get(ep, {}).get(mat)
                row.append(f'{n:.1f}' if n is not None else '–')
            row.append(f'{medias_materias[mat]:.2f}')
            table_data.append(row)
        col_w = [4.5*cm] + [2.5*cm]*len(epocas_presentes) + [2.5*cm]
        nt = Table(table_data, colWidths=col_w)
        nt.setStyle(TableStyle([
            ('BACKGROUND', (0,0), (-1,0), PRIMARY),
            ('TEXTCOLOR', (0,0), (-1,0), colors.white),
            ('FONTNAME', (0,0), (-1,0), 'Helvetica-Bold'),
            ('FONTSIZE', (0,0), (-1,-1), 8),
            ('FONTNAME', (0,1), (0,-1), 'Helvetica-Bold'),
            ('ROWBACKGROUNDS', (0,1), (-1,-1), [colors.white, colors.HexColor('#f5f8ff')]),
            ('GRID', (0,0), (-1,-1), 0.5, colors.HexColor('#cccccc')),
            ('ALIGN', (1,0), (-1,-1), 'CENTER'),
            ('PADDING', (0,0), (-1,-1), 4),
        ]))
        story.append(nt)
    else:
        story.append(Paragraph('Nenhuma nota registrada.', body_style))

    story.append(Spacer(1, 0.4*cm))

    # ── Seção 3: Comportamento ─────────────────────────────────────────────
    story.append(Paragraph('Comportamento', section_style))
    criterios = [
        ('Assiduidade',      'media_assiduidade'),
        ('Participação',     'media_participacao'),
        ('Responsabilidade', 'media_responsabilidade'),
        ('Sociabilidade',    'media_sociabilidade'),
    ]
    comp_data = [['Critério', 'Média (0–5)', 'Pontos (0–2.5)', '%']]
    for label, key in criterios:
        v = medias[key]
        comp_data.append([label, f'{v:.2f}', f'{v/2:.2f}', f'{calc_percent(v)}%'])
    comp_data.append(['Média Geral', f'{media_geral_comp:.2f}', f'{media_geral_comp/2:.2f}', f'{calc_percent(media_geral_comp)}%'])

    ct = Table(comp_data, colWidths=[5*cm, 3.5*cm, 3.5*cm, 3*cm])
    n_comp = len(comp_data)
    ct.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,0), PRIMARY),
        ('TEXTCOLOR', (0,0), (-1,0), colors.white),
        ('FONTNAME', (0,0), (-1,0), 'Helvetica-Bold'),
        ('FONTSIZE', (0,0), (-1,-1), 9),
        ('FONTNAME', (0,n_comp-1), (-1,n_comp-1), 'Helvetica-Bold'),
        ('BACKGROUND', (0,n_comp-1), (-1,n_comp-1), LIGHT),
        ('ROWBACKGROUNDS', (0,1), (-1,n_comp-2), [colors.white, colors.HexColor('#f5f8ff')]),
        ('GRID', (0,0), (-1,-1), 0.5, colors.HexColor('#cccccc')),
        ('ALIGN', (1,0), (-1,-1), 'CENTER'),
        ('PADDING', (0,0), (-1,-1), 5),
    ]))
    story.append(ct)
    story.append(Spacer(1, 0.4*cm))

    # ── Seção 4: Histórico de Avaliações ──────────────────────────────────
    if avaliacoes.exists():
        story.append(Paragraph('Histórico de Avaliações Comportamentais', section_style))
        av_data = [['Data', 'Matéria', 'Assim.', 'Part.', 'Resp.', 'Soc.', 'Média', 'Observação']]
        for av in avaliacoes:
            media_av = float(av.calcular_media())
            av_data.append([
                av.data.strftime('%d/%m/%Y'),
                av.materia.nome if av.materia else '–',
                f'{float(av.assiduidade)/2:.1f}',
                f'{float(av.participacao)/2:.1f}',
                f'{float(av.responsabilidade)/2:.1f}',
                f'{float(av.sociabilidade)/2:.1f}',
                f'{media_av:.2f}',
                av.observacao or '–',
            ])

        av_col_w = [2*cm, 2.5*cm, 1.3*cm, 1.3*cm, 1.3*cm, 1.3*cm, 1.5*cm, 5.8*cm]
        avt = Table(av_data, colWidths=av_col_w, repeatRows=1)
        avt.setStyle(TableStyle([
            ('BACKGROUND', (0,0), (-1,0), PRIMARY),
            ('TEXTCOLOR', (0,0), (-1,0), colors.white),
            ('FONTNAME', (0,0), (-1,0), 'Helvetica-Bold'),
            ('FONTSIZE', (0,0), (-1,-1), 7.5),
            ('ROWBACKGROUNDS', (0,1), (-1,-1), [colors.white, colors.HexColor('#f5f8ff')]),
            ('GRID', (0,0), (-1,-1), 0.5, colors.HexColor('#cccccc')),
            ('ALIGN', (2,0), (6,-1), 'CENTER'),
            ('VALIGN', (0,0), (-1,-1), 'TOP'),
            ('WORDWRAP', (7,1), (7,-1), True),
            ('PADDING', (0,0), (-1,-1), 4),
        ]))
        story.append(avt)

    # ── build & return ─────────────────────────────────────────────────────
    doc.build(story)
    buffer.seek(0)
    nome_arquivo = f'relatorio_{nome.replace(" ", "_")}_{date.today().strftime("%Y%m%d")}.pdf'
    response = HttpResponse(buffer, content_type='application/pdf')
    response['Content-Disposition'] = f'attachment; filename="{nome_arquivo}"'
    return response

    return Response({'detail': 'Assiduidade registrada!', 'id': registro.id}, status=201)
