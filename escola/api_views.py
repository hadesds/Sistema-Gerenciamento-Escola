from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework.response import Response
from rest_framework import status
from django.shortcuts import get_object_or_404
from django.db.models import Avg
from django.utils import timezone
from datetime import datetime, timedelta

from .models import Professor, Aluno, Turma, Avaliacao, Questao, Simulado, NotaMateria, PerfilTurma, RegistroAssiduidade, PresencaAluno, AlternativaQuestao, Materia, SimuladoQuestao, Aviso
from .serializers import (
    TurmaSerializer, AlunoBasicSerializer, AvaliacaoSerializer,
    QuestaoSerializer, SimuladoSerializer, MeSerializer, NotaMateriaSerializer,
    MateriaSerializer, AvisoSerializer
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
            'cpf': aluno.cpf,
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


_MESES_PT = {
    1: 'Janeiro', 2: 'Fevereiro', 3: 'Março', 4: 'Abril', 5: 'Maio', 6: 'Junho',
    7: 'Julho', 8: 'Agosto', 9: 'Setembro', 10: 'Outubro', 11: 'Novembro', 12: 'Dezembro',
}


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def professor_turma_relatorios(request, turma_id):
    """Dados para os relatórios da turma: relação nominal, dados cadastrais,
    notas por disciplina (AV1/AV2/AV3/bimestral) e frequência mensal."""
    from .grading import consolidar_notas
    from .grade_config import DISCIPLINAS

    professor = _get_professor(request)
    if not professor:
        return Response({'detail': 'Acesso negado.'}, status=403)

    turma = get_object_or_404(Turma, id=turma_id)
    if turma not in professor.turmas.all():
        return Response({'detail': 'Sem permissão para ver esta turma.'}, status=403)

    alunos = turma.alunos.all().select_related('user').order_by('user__first_name', 'user__last_name')

    alunos_info = []
    for aluno in alunos:
        foto_url = request.build_absolute_uri(aluno.foto.url) if aluno.foto else None

        presencas = (PresencaAluno.objects
                     .filter(aluno=aluno, registro__turma=turma)
                     .select_related('registro')
                     .order_by('registro__data'))
        por_mes: dict = {}
        for p in presencas:
            chave = (p.registro.data.year, p.registro.data.month)
            d = por_mes.setdefault(chave, {'presentes': 0, 'faltas': 0, 'total': 0})
            d['total'] += 1
            if p.presente:
                d['presentes'] += 1
            else:
                d['faltas'] += 1

        frequencia_mensal = []
        for (ano, mes), d in sorted(por_mes.items()):
            frequencia_mensal.append({
                'mes': f'{ano}-{mes:02d}',
                'mes_label': f'{_MESES_PT[mes]}/{ano}',
                'presentes': d['presentes'],
                'faltas': d['faltas'],
                'total': d['total'],
                'percentual': round(d['presentes'] / d['total'] * 100, 1) if d['total'] else 0,
            })

        alunos_info.append({
            'id': aluno.user.id,
            'nome': aluno.user.get_full_name() or aluno.user.username,
            'foto_url': foto_url,
            'cpf': aluno.cpf,
            'telefone': aluno.telefone,
            'endereco': aluno.endereco,
            'nome_mae': aluno.nome_mae,
            'email_mae': aluno.email_mae,
            'email': aluno.user.email,
            'notas': consolidar_notas(aluno),
            'frequencia_mensal': frequencia_mensal,
        })

    return Response({
        'turma': TurmaSerializer(turma).data,
        'disciplinas': [{'sigla': sigla, 'nome': nome} for sigla, nome in DISCIPLINAS],
        'alunos': alunos_info,
    })


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def professor_turma_relatorios_pdf(request, turma_id):
    """Gera em PDF (ReportLab) o relatório da turma para a área selecionada:
    relação nominal (com foto), dados cadastrais, notas por disciplina ou
    frequência mensal — de acordo com os parâmetros de query informados."""
    from io import BytesIO
    from datetime import date
    from django.http import HttpResponse
    from reportlab.lib import colors
    from reportlab.lib.pagesizes import A4, landscape
    from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
    from reportlab.lib.units import cm
    from reportlab.platypus import (
        SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, HRFlowable, Image as RLImage,
    )
    from reportlab.lib.enums import TA_CENTER
    from .grading import consolidar_notas
    from .grade_config import DISCIPLINAS, EPOCAS as GRADE_EPOCAS

    professor = _get_professor(request)
    if not professor:
        return HttpResponse('Acesso negado.', status=403)

    turma = get_object_or_404(Turma, id=turma_id)
    if turma not in professor.turmas.all():
        return HttpResponse('Sem permissão para ver esta turma.', status=403)

    tipo = request.GET.get('tipo', 'nominal')
    if tipo not in ('nominal', 'dados', 'notas', 'frequencia'):
        return HttpResponse('Tipo de relatório inválido.', status=400)

    alunos = turma.alunos.all().select_related('user').order_by('user__first_name', 'user__last_name')

    PRIMARY = colors.HexColor('#0d2d6b')
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

    def freq_color(pct):
        if pct >= 75:
            return SUCCESS
        if pct >= 50:
            return WARNING
        return DANGER

    # ── Resolve filtros específicos de cada tipo (antes de montar o cabeçalho) ──
    filtro_label = None
    bimestre = nota_tipo = None
    por_aluno_freq: dict = {}
    chave_mes = None

    if tipo == 'notas':
        epocas_validas = [c for c, _ in GRADE_EPOCAS]
        bimestre = request.GET.get('bimestre', '1B')
        if bimestre not in epocas_validas:
            bimestre = '1B'
        nota_tipo = request.GET.get('nota', 'final')
        if nota_tipo not in ('av1', 'av2', 'av3', 'final'):
            nota_tipo = 'final'
        epoca_label = dict(GRADE_EPOCAS)[bimestre]
        nota_label = {'av1': 'AV1', 'av2': 'AV2', 'av3': 'AV3', 'final': 'Média Bimestral'}[nota_tipo]
        filtro_label = f'{nota_label} — {epoca_label}'

    elif tipo == 'frequencia':
        meses_disponiveis = set()
        for aluno in alunos:
            presencas = (PresencaAluno.objects
                         .filter(aluno=aluno, registro__turma=turma)
                         .select_related('registro'))
            por_mes: dict = {}
            for p in presencas:
                chave = (p.registro.data.year, p.registro.data.month)
                d = por_mes.setdefault(chave, {'presentes': 0, 'faltas': 0, 'total': 0})
                d['total'] += 1
                if p.presente:
                    d['presentes'] += 1
                else:
                    d['faltas'] += 1
                meses_disponiveis.add(chave)
            por_aluno_freq[aluno.pk] = por_mes

        mes_param = request.GET.get('mes')  # 'YYYY-MM'
        if mes_param:
            ano_str, mes_str = mes_param.split('-')
            chave_mes = (int(ano_str), int(mes_str))
        elif meses_disponiveis:
            chave_mes = max(meses_disponiveis)

        mes_label = f'{_MESES_PT[chave_mes[1]]}/{chave_mes[0]}' if chave_mes else '–'
        filtro_label = f'Mês de referência: {mes_label}'

    # ── Configuração do documento ────────────────────────────────────────────
    landscape_types = ('dados', 'notas', 'frequencia')
    pagesize = landscape(A4) if tipo in landscape_types else A4
    margin = 1.3*cm if tipo == 'notas' else 2*cm

    buffer = BytesIO()
    doc = SimpleDocTemplate(
        buffer, pagesize=pagesize,
        leftMargin=margin, rightMargin=margin, topMargin=1.6*cm, bottomMargin=1.6*cm,
    )

    styles = getSampleStyleSheet()
    title_style = ParagraphStyle('Title', parent=styles['Title'], fontSize=15, spaceAfter=2, alignment=TA_CENTER)
    turma_style = ParagraphStyle('Turma', parent=styles['Normal'], fontSize=11, alignment=TA_CENTER,
                                  fontName='Helvetica-Bold', textColor=PRIMARY, spaceAfter=4)
    filtro_style = ParagraphStyle('Filtro', parent=styles['Normal'], fontSize=10, alignment=TA_CENTER,
                                   fontName='Helvetica-Bold', textColor=colors.HexColor('#555555'), spaceAfter=4)
    subtitle_style = ParagraphStyle('Sub', parent=styles['Normal'], fontSize=9, textColor=colors.grey,
                                     alignment=TA_CENTER, spaceAfter=12)
    body_style = ParagraphStyle('Body', parent=styles['Normal'], fontSize=9, leading=13)

    titulos = {
        'nominal': 'Relação Nominal',
        'dados': 'Dados dos Alunos',
        'notas': 'Notas por Disciplina',
        'frequencia': 'Frequência Mensal',
    }

    story = [
        Paragraph(f'Sistema CARA – {titulos[tipo]}', title_style),
        Paragraph(
            turma.nome + (f' · {turma.serie}' if turma.serie else '') +
            f' · {turma.get_turno_display()}' + (f' · Sala {turma.sala}' if turma.sala else ''),
            turma_style,
        ),
    ]
    if filtro_label:
        story.append(Paragraph(filtro_label, filtro_style))
    story.append(Paragraph(f'Gerado em {date.today().strftime("%d/%m/%Y")} · {alunos.count()} aluno(s)', subtitle_style))
    story.append(HRFlowable(width='100%', thickness=1, color=PRIMARY))
    story.append(Spacer(1, 0.4*cm))

    if not alunos.exists():
        story.append(Paragraph('Nenhum aluno nesta turma.', body_style))

    # ── Relação Nominal ──────────────────────────────────────────────────────
    if alunos.exists() and tipo == 'nominal':
        table_data = [['Nº', 'Foto', 'Nome', 'CPF']]
        row_heights = [0.9*cm]
        for idx, aluno in enumerate(alunos, start=1):
            foto_flowable = ''
            if aluno.foto:
                try:
                    aluno.foto.open('rb')
                    try:
                        img_bytes = aluno.foto.read()
                    finally:
                        aluno.foto.close()
                    foto_flowable = RLImage(BytesIO(img_bytes), width=1.3*cm, height=1.3*cm)
                except Exception:
                    foto_flowable = ''
            nome = aluno.user.get_full_name() or aluno.user.username
            table_data.append([str(idx), foto_flowable, nome, aluno.cpf or '–'])
            row_heights.append(1.5*cm)

        nt = Table(table_data, colWidths=[1.2*cm, 2*cm, 9*cm, 3.5*cm], rowHeights=row_heights, repeatRows=1)
        nt.setStyle(TableStyle([
            ('BACKGROUND', (0, 0), (-1, 0), PRIMARY),
            ('TEXTCOLOR', (0, 0), (-1, 0), colors.white),
            ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
            ('FONTSIZE', (0, 0), (-1, -1), 9),
            ('ROWBACKGROUNDS', (0, 1), (-1, -1), [colors.white, colors.HexColor('#f5f8ff')]),
            ('GRID', (0, 0), (-1, -1), 0.5, colors.HexColor('#cccccc')),
            ('ALIGN', (0, 0), (1, -1), 'CENTER'),
            ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
            ('PADDING', (0, 0), (-1, -1), 5),
        ]))
        story.append(nt)

    # ── Dados dos Alunos ─────────────────────────────────────────────────────
    if alunos.exists() and tipo == 'dados':
        table_data = [['Nome', 'CPF', 'E-mail', 'Telefone', 'Endereço', 'Nome da Mãe', 'E-mail da Mãe']]
        for aluno in alunos:
            nome = aluno.user.get_full_name() or aluno.user.username
            table_data.append([
                nome, aluno.cpf or '–',
                aluno.user.email or '–', aluno.telefone or '–', aluno.endereco or '–',
                aluno.nome_mae or '–', aluno.email_mae or '–',
            ])
        dt = Table(table_data, colWidths=[3.4*cm, 2.8*cm, 4.5*cm, 2.5*cm, 4.4*cm, 3.4*cm, 4.5*cm], repeatRows=1)
        dt.setStyle(TableStyle([
            ('BACKGROUND', (0, 0), (-1, 0), PRIMARY),
            ('TEXTCOLOR', (0, 0), (-1, 0), colors.white),
            ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
            ('FONTSIZE', (0, 0), (-1, -1), 8.5),
            ('ROWBACKGROUNDS', (0, 1), (-1, -1), [colors.white, colors.HexColor('#f5f8ff')]),
            ('GRID', (0, 0), (-1, -1), 0.5, colors.HexColor('#cccccc')),
            ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
            ('PADDING', (0, 0), (-1, -1), 4),
        ]))
        story.append(dt)

    # ── Notas por Disciplina ─────────────────────────────────────────────────
    if alunos.exists() and tipo == 'notas':
        header = ['Nome'] + [sigla for sigla, _ in DISCIPLINAS]
        table_data = [header]
        cell_colors = []
        for aluno in alunos:
            nome = aluno.user.get_full_name() or aluno.user.username
            consolidado = consolidar_notas(aluno)
            linhas = {l['sigla']: l for l in consolidado.get(bimestre, [])}
            row = [nome]
            row_colors = []
            for sigla, _ in DISCIPLINAS:
                linha = linhas.get(sigla)
                valor = linha[nota_tipo] if linha else None
                row.append(f'{valor:.1f}' if valor is not None else '–')
                row_colors.append(nota_color(valor))
            table_data.append(row)
            cell_colors.append(row_colors)

        col_w = [3.8*cm] + [1.4*cm] * len(DISCIPLINAS)
        nt2 = Table(table_data, colWidths=col_w, repeatRows=1)
        estilo = [
            ('BACKGROUND', (0, 0), (-1, 0), PRIMARY),
            ('TEXTCOLOR', (0, 0), (-1, 0), colors.white),
            ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
            ('FONTSIZE', (0, 0), (-1, -1), 7.5),
            ('ROWBACKGROUNDS', (0, 1), (-1, -1), [colors.white, colors.HexColor('#f5f8ff')]),
            ('GRID', (0, 0), (-1, -1), 0.5, colors.HexColor('#cccccc')),
            ('ALIGN', (1, 0), (-1, -1), 'CENTER'),
            ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
            ('PADDING', (0, 0), (-1, -1), 3),
        ]
        for i, row_colors in enumerate(cell_colors, start=1):
            for j, c in enumerate(row_colors, start=1):
                estilo.append(('TEXTCOLOR', (j, i), (j, i), c))
        nt2.setStyle(TableStyle(estilo))
        story.append(nt2)

    # ── Frequência Mensal ────────────────────────────────────────────────────
    if alunos.exists() and tipo == 'frequencia':
        table_data = [['Nome', 'Presenças', 'Faltas', 'Dias Registrados', '% Frequência']]
        row_colors = []
        for aluno in alunos:
            nome = aluno.user.get_full_name() or aluno.user.username
            d = por_aluno_freq.get(aluno.pk, {}).get(chave_mes) if chave_mes else None
            if d:
                pct = round(d['presentes'] / d['total'] * 100, 1) if d['total'] else 0
                table_data.append([nome, str(d['presentes']), str(d['faltas']), str(d['total']), f'{pct:.1f}%'])
                row_colors.append(freq_color(pct))
            else:
                table_data.append([nome, '–', '–', '–', '–'])
                row_colors.append(colors.grey)

        ft = Table(table_data, colWidths=[6*cm, 3*cm, 3*cm, 4*cm, 3.5*cm], repeatRows=1)
        estilo = [
            ('BACKGROUND', (0, 0), (-1, 0), PRIMARY),
            ('TEXTCOLOR', (0, 0), (-1, 0), colors.white),
            ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
            ('FONTSIZE', (0, 0), (-1, -1), 9),
            ('ROWBACKGROUNDS', (0, 1), (-1, -1), [colors.white, colors.HexColor('#f5f8ff')]),
            ('GRID', (0, 0), (-1, -1), 0.5, colors.HexColor('#cccccc')),
            ('ALIGN', (1, 0), (-1, -1), 'CENTER'),
            ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
            ('PADDING', (0, 0), (-1, -1), 5),
        ]
        for i, c in enumerate(row_colors, start=1):
            estilo.append(('TEXTCOLOR', (4, i), (4, i), c))
        ft.setStyle(TableStyle(estilo))
        story.append(ft)

    doc.build(story)
    buffer.seek(0)
    nome_arquivo = f'turma_{turma.nome.replace(" ", "_")}_{tipo}_{date.today().strftime("%Y%m%d")}.pdf'
    response = HttpResponse(buffer, content_type='application/pdf')
    response['Content-Disposition'] = f'attachment; filename="{nome_arquivo}"'
    return response


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def professor_registrar_avaliacao(request, aluno_id):
    professor = _get_professor(request)
    if not professor:
        return Response({'detail': 'Acesso negado.'}, status=403)

    aluno = get_object_or_404(Aluno, pk=aluno_id)
    try:
        # Matéria é opcional (as notas de disciplina vêm dos simulados agora).
        materia_id = request.data.get('materia_id')
        materia_obj = Materia.objects.filter(pk=materia_id).first() if materia_id else None

        observacao = request.data.get('observacao', '')

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
                    img = request.FILES.get(f'alt_imagem_{i}')
                    # cria a alternativa se tiver texto OU imagem
                    if texto or img:
                        AlternativaQuestao.objects.create(
                            questao=questao,
                            texto=texto,
                            imagem=img or None,
                            correta=bool(alt.get('correta', False)),
                            ordem=i,
                        )
            from .activity_log import registrar_atividade
            nome_professor = professor.user.get_full_name() or professor.user.username
            materia_desc = f' ({materia.nome})' if materia else ''
            registrar_atividade(
                professor.user,
                f'{nome_professor} (Professor) criou uma questão {questao.get_tipo_display().lower()}{materia_desc} no banco de questões.'
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


@api_view(['DELETE'])
@permission_classes([IsAuthenticated])
def professor_excluir_questao_banco(request, questao_id):
    """Exclui uma questão do banco. Bloqueado se a questão já foi usada em algum simulado,
    para não apagar retroativamente as respostas dos alunos que a responderam."""
    professor = _get_professor(request)
    if not professor:
        return Response({'detail': 'Acesso negado.'}, status=403)

    questao = get_object_or_404(Questao, id=questao_id, autor=professor)

    if questao.simulado_questoes.exists():
        return Response(
            {'detail': 'Esta questão já foi usada em um ou mais simulados e não pode ser excluída do banco.'},
            status=400,
        )

    from .activity_log import registrar_atividade
    nome_professor = professor.user.get_full_name() or professor.user.username
    materia_desc = f' ({questao.materia.nome})' if questao.materia else ''
    tipo_desc = questao.get_tipo_display().lower()
    questao.delete()

    registrar_atividade(
        professor.user,
        f'{nome_professor} (Professor) excluiu uma questão {tipo_desc}{materia_desc} do banco de questões.'
    )
    return Response(status=204)


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

    turma_ids = request.data.get('turmas', [])
    questoes_payload = request.data.get('questoes', [])

    if not turma_ids or not questoes_payload:
        return Response({'detail': 'Selecione ao menos uma turma e pelo menos uma questão.'}, status=400)

    turmas = Turma.objects.filter(id__in=turma_ids)
    if not turmas.exists():
        return Response({'detail': 'Selecione ao menos uma turma e pelo menos uma questão.'}, status=400)

    av_tipo = (request.data.get('av_tipo', '') or '').strip()
    area = (request.data.get('area', '') or '').strip()
    epoca = (request.data.get('epoca', '') or '').strip()
    if av_tipo in ('AV1', 'AV2') and not (area and epoca):
        return Response(
            {'detail': 'Selecione a área e o bimestre para que a nota seja lançada automaticamente.'},
            status=400,
        )

    simulado = Simulado.objects.create(autor=professor)
    simulado.turmas.set(turmas)
    for item in questoes_payload:
        SimuladoQuestao.objects.create(
            simulado=simulado,
            questao_id=item['id'],
            valor=item.get('valor', 1.0),
    )
    simulado.titulo = request.data.get('titulo', '')
    simulado.tempo_limite = request.data.get('tempo_limite') or None
    simulado.area_conhecimento = request.data.get('area_conhecimento', '')
    simulado.av_tipo = av_tipo
    simulado.area = area
    simulado.epoca = epoca
    simulado.save()

    from .activity_log import registrar_atividade
    nome_professor = professor.user.get_full_name() or professor.user.username
    turmas_desc = ', '.join(t.nome for t in turmas)
    registrar_atividade(
        professor.user,
        f'{nome_professor} (Professor) criou o simulado "{simulado.titulo or f"#{simulado.id}"}" para a(s) turma(s) {turmas_desc}.'
    )

    return Response(SimuladoSerializer(simulado, context={'request': request}).data, status=201)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def professor_lista_simulados(request):
    professor = _get_professor(request)
    if not professor:
        return Response({'detail': 'Acesso negado.'}, status=403)

    simulados = Simulado.objects.filter(autor=professor).prefetch_related('turmas').order_by('-id')
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
        nota_alterada = any(campo in request.data for campo in ('av_tipo', 'area', 'epoca'))

        if 'titulo' in request.data:
            simulado.titulo = request.data['titulo']
        if 'tempo_limite' in request.data:
            simulado.tempo_limite = request.data['tempo_limite'] or None
        if 'area_conhecimento' in request.data:
            simulado.area_conhecimento = request.data['area_conhecimento']
        if 'av_tipo' in request.data:
            simulado.av_tipo = (request.data['av_tipo'] or '').strip()
        if 'area' in request.data:
            simulado.area = (request.data['area'] or '').strip()
        if 'epoca' in request.data:
            simulado.epoca = (request.data['epoca'] or '').strip()

        if nota_alterada and simulado.av_tipo in ('AV1', 'AV2') and not (simulado.area and simulado.epoca):
            return Response(
                {'detail': 'Selecione a área e o bimestre para que a nota seja lançada automaticamente.'},
                status=400,
            )

        if 'turmas' in request.data:
            turmas = Turma.objects.filter(id__in=request.data['turmas'])
            simulado.turmas.set(turmas)
        simulado.save()

        if nota_alterada:
            # backfill: alunos que já haviam sido corrigidos passam a ter a
            # NotaArea consolidada agora que a área/bimestre está definido.
            from .grading import recomputar_simulado
            recomputar_simulado(simulado)

        return Response(SimuladoSerializer(simulado, context={'request': request}).data)

    if request.method == 'DELETE':
        from .activity_log import registrar_atividade
        nome_professor = professor.user.get_full_name() or professor.user.username
        titulo_desc = simulado.titulo or f'#{simulado.id}'
        simulado.delete()
        registrar_atividade(
            professor.user,
            f'{nome_professor} (Professor) excluiu o simulado "{titulo_desc}".'
        )
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
    # Recalcula as notas de quem já respondeu (a questão anulada deixa de contar).
    from .grading import recomputar_simulado
    recomputar_simulado(simulado)
    return Response(SimuladoSerializer(simulado, context={'request': request}).data)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def professor_simulado_resultados(request, simulado_id):
    """Andamento do simulado por aluno da turma-alvo: status, nota e discursivas pendentes."""
    from .models import ResultadoSimulado

    professor = _get_professor(request)
    if not professor:
        return Response({'detail': 'Acesso negado.'}, status=403)

    simulado = get_object_or_404(Simulado, id=simulado_id, autor=professor)

    # questões que ainda pertencem ao simulado (para filtrar respostas de questões removidas)
    questao_ids = set(simulado.simulado_questoes.values_list('questao_id', flat=True))

    resultados = {
        r.aluno_id: r
        for r in ResultadoSimulado.objects.filter(simulado=simulado)
        .prefetch_related('respostas__questao')
    }

    def montar_aluno(aluno):
        r = resultados.get(aluno.user_id)
        foto_url = request.build_absolute_uri(aluno.foto.url) if aluno.foto else None
        if not r:
            status_str = 'nao_iniciado'
            nota = None
            resultado_id = None
            pendentes = []
        else:
            status_str = r.status
            nota = float(r.nota) if r.nota is not None else None
            resultado_id = r.id
            pendentes = [
                {
                    'resposta_id': resp.id,
                    'questao_enunciado': resp.questao.enunciado,
                    'texto': resp.texto,
                }
                for resp in r.respostas.all()
                if resp.questao_id in questao_ids
                and resp.questao.tipo != 'objetiva'
                and resp.pontos is None
            ]
        return {
            'aluno_id': aluno.user_id,
            'nome': aluno.user.get_full_name() or aluno.user.username,
            'foto_url': foto_url,
            'status': status_str,
            'nota': nota,
            'resultado_id': resultado_id,
            'pendentes': pendentes,
        }

    turmas_da_prova = list(simulado.turmas.all().order_by('nome'))
    turmas_out = []
    for turma in turmas_da_prova:
        alunos = Aluno.objects.filter(turma=turma).select_related('user')
        alunos_out = [montar_aluno(aluno) for aluno in alunos]
        turmas_out.append({
            'turma_id': turma.id,
            'turma_nome': turma.nome,
            'alunos': alunos_out,
        })

    return Response({
        'simulado': {
            'id': simulado.id,
            'titulo': simulado.titulo,
            'turmas': [t.nome for t in turmas_da_prova],
            'av_tipo': simulado.av_tipo,
            'area': simulado.area,
            'epoca': simulado.epoca,
            'total_questoes': simulado.questoes.count(),
        },
        'turmas': turmas_out,
    })


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def professor_relatorio_aluno(request, aluno_id):
    from .grading import consolidar_notas
    from .models import ResultadoSimulado

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

    return Response({
        'aluno': {
            'id': aluno.user.id,
            'nome': aluno.user.get_full_name() or aluno.user.username,
            'cpf': aluno.cpf,
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
        # novo sistema: notas consolidadas por bimestre × disciplina
        'consolidado': consolidar_notas(aluno),
        # resultados por simulado (com status de pendência de correção)
        'simulados': [
            {
                'resultado_id': r.id,
                'simulado_id': r.simulado_id,
                'titulo': r.simulado.titulo or f'Simulado #{r.simulado_id}',
                'av_tipo': r.simulado.av_tipo,
                'area': r.simulado.area,
                'epoca': r.simulado.epoca,
                'nota': float(r.nota) if r.nota is not None else None,
                'status': r.status,
            }
            for r in ResultadoSimulado.objects.filter(aluno=aluno)
                .select_related('simulado').order_by('-enviado_em')
        ],
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

    simulados = Simulado.objects.filter(turmas=aluno.turma).select_related('autor')[:5]
    foto_url = None
    if aluno.foto:
        foto_url = request.build_absolute_uri(aluno.foto.url)

    return Response({
        'aluno': {
            'id': aluno.user.id,
            'nome': aluno.user.get_full_name() or aluno.user.username,
            'cpf': aluno.cpf,
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
    from .models import ResultadoSimulado
    from .grading import consolidar_notas

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

    resultados_simulados = []
    for r in (ResultadoSimulado.objects.filter(aluno=aluno)
              .select_related('simulado')
              .prefetch_related('respostas__questao')
              .order_by('-enviado_em')):
        pendentes = [
            {'questao_enunciado': resp.questao.enunciado}
            for resp in r.respostas.all()
            if resp.questao.tipo != 'objetiva' and resp.pontos is None
        ]
        resultados_simulados.append({
            'resultado_id': r.id,
            'simulado_id': r.simulado_id,
            'titulo': r.simulado.titulo or f'Simulado #{r.simulado_id}',
            'av_tipo': r.simulado.av_tipo,
            'av_tipo_display': r.simulado.get_av_tipo_display(),
            'area': r.simulado.area,
            'area_display': r.simulado.get_area_display(),
            'epoca': r.simulado.epoca,
            'epoca_display': r.simulado.get_epoca_display(),
            'nota': float(r.nota) if r.nota is not None else None,
            'status': r.status,
            'status_display': r.get_status_display(),
            'enviado_em': r.enviado_em,
            'pendentes': pendentes,
        })

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
        'consolidado': consolidar_notas(aluno),
        'resultados_simulados': resultados_simulados,
    })


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def aluno_meus_simulados(request):
    from .models import ResultadoSimulado

    aluno = _get_aluno(request)
    if not aluno:
        return Response({'detail': 'Acesso negado.'}, status=403)

    simulados = Simulado.objects.filter(turmas=aluno.turma).select_related('autor')
    resultados = {
        r.simulado_id: r
        for r in ResultadoSimulado.objects.filter(aluno=aluno, simulado__in=simulados)
    }

    data = SimuladoSerializer(simulados, many=True, context={'request': request}).data
    for item in data:
        r = resultados.get(item['id'])
        item['meu_resultado'] = None if not r else {
            'resultado_id': r.id,
            'status': r.status,
            'nota': float(r.nota) if r.nota is not None else None,
        }
    return Response(data)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def aluno_visualizar_simulado(request, simulado_id):
    aluno = _get_aluno(request)
    if not aluno:
        return Response({'detail': 'Acesso negado.'}, status=403)

    simulado = get_object_or_404(Simulado, id=simulado_id)
    if not simulado.turmas.filter(id=aluno.turma_id).exists():
        return Response({'detail': 'Sem acesso a este simulado.'}, status=403)

    return Response(SimuladoSerializer(simulado, context={'request': request}).data)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def aluno_enviar_simulado(request, simulado_id):
    """O aluno envia as respostas; corrige automaticamente as objetivas e gera a nota.

    Payload: { respostas: [ { questao: <id>, alternativa: <id|null>, texto: <str> }, ... ] }
    """
    from django.utils import timezone
    from .models import ResultadoSimulado, RespostaAluno, AlternativaQuestao
    from .grading import corrigir_resultado
    from .serializers import ResultadoSimuladoSerializer

    aluno = _get_aluno(request)
    if not aluno:
        return Response({'detail': 'Acesso negado.'}, status=403)

    simulado = get_object_or_404(Simulado, id=simulado_id)
    if not simulado.turmas.filter(id=aluno.turma_id).exists():
        return Response({'detail': 'Sem acesso a este simulado.'}, status=403)

    if ResultadoSimulado.objects.filter(simulado=simulado, aluno=aluno).exists():
        return Response({'detail': 'Você já enviou este simulado.'}, status=409)

    respostas_payload = request.data.get('respostas', [])

    resultado = ResultadoSimulado.objects.create(
        simulado=simulado, aluno=aluno, enviado_em=timezone.now(),
    )

    # questões válidas do simulado
    questoes_validas = {sq.questao_id: sq.questao for sq in
                        simulado.simulado_questoes.select_related('questao')}

    for item in respostas_payload:
        qid = item.get('questao')
        if qid not in questoes_validas:
            continue
        alt_id = item.get('alternativa')
        alternativa = None
        if alt_id:
            alternativa = AlternativaQuestao.objects.filter(id=alt_id, questao_id=qid).first()
        RespostaAluno.objects.create(
            resultado=resultado,
            questao=questoes_validas[qid],
            alternativa=alternativa,
            texto=item.get('texto', '') or '',
        )

    corrigir_resultado(resultado)

    from .activity_log import registrar_atividade
    nome_aluno = aluno.user.get_full_name() or aluno.user.username
    titulo_desc = simulado.titulo or f'#{simulado.id}'
    registrar_atividade(
        aluno.user,
        f'{nome_aluno} (Aluno) respondeu o simulado "{titulo_desc}".'
    )

    return Response(ResultadoSimuladoSerializer(resultado, context={'request': request}).data, status=201)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def professor_corrigir_discursivas(request, resultado_id):
    """O professor pontua as discursivas pendentes; recalcula a nota e fecha a NotaArea.

    Payload: { pontos: { <resposta_id>: <valor>, ... } }
    """
    from .models import ResultadoSimulado, RespostaAluno
    from .grading import corrigir_resultado
    from .serializers import ResultadoSimuladoSerializer

    professor = _get_professor(request)
    if not professor:
        return Response({'detail': 'Acesso negado.'}, status=403)

    resultado = get_object_or_404(ResultadoSimulado, id=resultado_id)
    if resultado.simulado.autor_id != professor.pk:
        return Response({'detail': 'Sem acesso a este resultado.'}, status=403)

    pontos_map = request.data.get('pontos', {})
    for resp_id, valor in pontos_map.items():
        resp = RespostaAluno.objects.filter(id=resp_id, resultado=resultado).first()
        if resp and resp.questao.tipo != 'objetiva':
            try:
                resp.pontos = float(valor)
                resp.save()
            except (TypeError, ValueError):
                continue

    corrigir_resultado(resultado)

    from .activity_log import registrar_atividade
    nome_professor = professor.user.get_full_name() or professor.user.username
    nome_aluno = resultado.aluno.user.get_full_name() or resultado.aluno.user.username
    titulo_desc = resultado.simulado.titulo or f'#{resultado.simulado_id}'
    registrar_atividade(
        professor.user,
        f'{nome_professor} (Professor) corrigiu as questões discursivas de {nome_aluno} no simulado "{titulo_desc}".'
    )

    return Response(ResultadoSimuladoSerializer(resultado, context={'request': request}).data)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def grade_config(request):
    """Expõe a taxonomia de disciplinas/áreas/AVs/épocas para o frontend."""
    from .grade_config import config_dict
    return Response(config_dict())


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def professor_consolidado(request, aluno_id):
    """Notas consolidadas do aluno por bimestre × disciplina."""
    from .grading import consolidar_notas

    professor = _get_professor(request)
    if not professor:
        return Response({'detail': 'Acesso negado.'}, status=403)

    aluno = get_object_or_404(Aluno, pk=aluno_id)
    return Response({
        'aluno': {
            'id': aluno.user.id,
            'nome': aluno.user.get_full_name() or aluno.user.username,
            'turma': aluno.turma.nome if aluno.turma else '',
        },
        'notas': consolidar_notas(aluno),
    })


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def professor_nota_area(request, aluno_id):
    """Override manual de uma NotaArea (correção/recuperação de AV1/AV2)."""
    from .models import NotaArea
    from .grade_config import AV_TIPOS, AREA_CHOICES, EPOCAS

    professor = _get_professor(request)
    if not professor:
        return Response({'detail': 'Acesso negado.'}, status=403)

    aluno = get_object_or_404(Aluno, pk=aluno_id)
    epoca = request.data.get('epoca')
    av_tipo = request.data.get('av_tipo')
    area = request.data.get('area')
    nota = request.data.get('nota')

    validos = lambda val, choices: val in [c[0] for c in choices]
    if not (validos(epoca, EPOCAS) and validos(av_tipo, AV_TIPOS) and validos(area, AREA_CHOICES)):
        return Response({'detail': 'Época, AV ou área inválidos.'}, status=400)
    try:
        nota_f = float(nota)
        if not (0 <= nota_f <= 10):
            raise ValueError
    except (TypeError, ValueError):
        return Response({'detail': 'Nota inválida (0–10).'}, status=400)

    obj, _ = NotaArea.objects.update_or_create(
        aluno=aluno, epoca=epoca, av_tipo=av_tipo, area=area,
        defaults={'nota': nota_f, 'origem': 'manual'},
    )
    return Response({'ok': True, 'nota': float(obj.nota), 'origem': obj.origem})


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def professor_nota_qualitativa(request, aluno_id):
    """Lança/atualiza a AV3 qualitativa por disciplina.

    Payload: { epoca, notas: { <materia_id>: <nota>, ... } }  ou  { epoca, materia_id, nota }
    """
    from .models import NotaQualitativa
    from .grade_config import EPOCAS

    professor = _get_professor(request)
    if not professor:
        return Response({'detail': 'Acesso negado.'}, status=403)

    aluno = get_object_or_404(Aluno, pk=aluno_id)
    epoca = request.data.get('epoca')
    if epoca not in [c[0] for c in EPOCAS]:
        return Response({'detail': 'Época inválida.'}, status=400)

    notas_map = request.data.get('notas')
    if notas_map is None:
        # formato single
        mid = request.data.get('materia_id')
        notas_map = {mid: request.data.get('nota')} if mid else {}

    salvas = 0
    for materia_id, valor in notas_map.items():
        materia = Materia.objects.filter(id=materia_id).first()
        if not materia:
            continue
        try:
            nf = float(valor)
            if not (0 <= nf <= 10):
                continue
        except (TypeError, ValueError):
            continue
        NotaQualitativa.objects.update_or_create(
            aluno=aluno, epoca=epoca, materia=materia,
            defaults={'nota': nf, 'professor': professor},
        )
        salvas += 1

    return Response({'ok': True, 'salvas': salvas})


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
                'cpf': a.cpf,
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
    cpf = aluno.cpf or '–'
    id_data = [
        ['Nome', nome, 'Turma', turma_nome],
        ['CPF', cpf, 'Total de Avaliações', str(avaliacoes.count())],
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

    # ── Seção 2: Notas por Disciplina (AV1/AV2/AV3) ───────────────────────
    from .grading import consolidar_notas
    from .grade_config import EPOCAS as GRADE_EPOCAS

    story.append(Paragraph('Notas por Disciplina', section_style))

    consolidado = consolidar_notas(aluno)
    epocas_label = dict(GRADE_EPOCAS)

    def _cel(v):
        return f'{v:.1f}' if v is not None else '–'

    algum_bimestre = False
    for epoca_cod, _lbl in GRADE_EPOCAS:
        linhas = consolidado.get(epoca_cod, [])
        # só mostra o bimestre se houver ao menos uma nota lançada
        if not any(l['av1'] is not None or l['av2'] is not None or l['av3'] is not None
                   for l in linhas):
            continue
        algum_bimestre = True

        story.append(Paragraph(epocas_label.get(epoca_cod, epoca_cod),
                               ParagraphStyle('Bim', parent=body_style, fontSize=10,
                                              spaceBefore=8, spaceAfter=4,
                                              textColor=PRIMARY, fontName='Helvetica-Bold')))

        table_data = [['Disciplina', 'AV1', 'AV2', 'AV3', 'Média Final']]
        for l in linhas:
            table_data.append([l['nome'], _cel(l['av1']), _cel(l['av2']), _cel(l['av3']),
                               f"{l['final']:.2f}"])

        col_w = [6*cm] + [2.4*cm]*4
        nt = Table(table_data, colWidths=col_w, repeatRows=1)
        estilo = [
            ('BACKGROUND', (0,0), (-1,0), PRIMARY),
            ('TEXTCOLOR', (0,0), (-1,0), colors.white),
            ('FONTNAME', (0,0), (-1,0), 'Helvetica-Bold'),
            ('FONTSIZE', (0,0), (-1,-1), 8),
            ('FONTNAME', (0,1), (0,-1), 'Helvetica-Bold'),
            ('FONTNAME', (4,1), (4,-1), 'Helvetica-Bold'),
            ('ROWBACKGROUNDS', (0,1), (-1,-1), [colors.white, colors.HexColor('#f5f8ff')]),
            ('GRID', (0,0), (-1,-1), 0.5, colors.HexColor('#cccccc')),
            ('ALIGN', (1,0), (-1,-1), 'CENTER'),
            ('PADDING', (0,0), (-1,-1), 4),
        ]
        # cor da média final por faixa
        for i, l in enumerate(linhas, start=1):
            estilo.append(('TEXTCOLOR', (4,i), (4,i), nota_color(l['final'])))
        nt.setStyle(TableStyle(estilo))
        story.append(nt)
        story.append(Spacer(1, 0.25*cm))

    if not algum_bimestre:
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


# ==========================================
# MURAL DE NOVIDADES (público + admin)
# ==========================================

def _is_admin(request):
    return request.user.is_superuser


@api_view(['GET'])
@permission_classes([AllowAny])
def avisos_publicos(request):
    """Avisos visíveis no carrossel da landing page: publicados e já na data."""
    avisos = Aviso.objects.filter(ativo=True, publicar_em__lte=timezone.now())
    serializer = AvisoSerializer(avisos, many=True, context={'request': request})
    return Response(serializer.data)


@api_view(['GET'])
@permission_classes([AllowAny])
def aviso_publico_detalhe(request, slug):
    aviso = get_object_or_404(Aviso, slug=slug, ativo=True, publicar_em__lte=timezone.now())
    serializer = AvisoSerializer(aviso, context={'request': request})
    return Response(serializer.data)


@api_view(['GET', 'POST'])
@permission_classes([IsAuthenticated])
def admin_avisos(request):
    if not _is_admin(request):
        return Response({'detail': 'Acesso negado.'}, status=403)

    if request.method == 'POST':
        titulo = request.data.get('titulo', '').strip()
        descricao_curta = request.data.get('descricao_curta', '').strip()
        imagem_capa = request.FILES.get('imagem_capa')

        if not titulo or not descricao_curta or not imagem_capa:
            return Response(
                {'detail': 'Categoria, título, descrição rápida e imagem de capa são obrigatórios.'},
                status=400,
            )

        aviso = Aviso.objects.create(
            categoria=request.data.get('categoria', 'evento'),
            titulo=titulo,
            descricao_curta=descricao_curta,
            imagem_capa=imagem_capa,
            imagem_capa_alt=request.data.get('imagem_capa_alt', titulo),
            autor=request.user,
        )
        serializer = AvisoSerializer(aviso, context={'request': request})
        return Response(serializer.data, status=201)

    avisos = Aviso.objects.all()
    serializer = AvisoSerializer(avisos, many=True, context={'request': request})
    return Response(serializer.data)


@api_view(['GET', 'PATCH', 'DELETE'])
@permission_classes([IsAuthenticated])
def admin_aviso_detalhe(request, aviso_id):
    if not _is_admin(request):
        return Response({'detail': 'Acesso negado.'}, status=403)

    aviso = get_object_or_404(Aviso, id=aviso_id)

    if request.method == 'GET':
        return Response(AvisoSerializer(aviso, context={'request': request}).data)

    if request.method == 'DELETE':
        aviso.delete()
        return Response(status=204)

    # PATCH
    for campo in ['categoria', 'titulo', 'descricao_curta', 'imagem_capa_alt', 'conteudo']:
        if campo in request.data:
            setattr(aviso, campo, request.data.get(campo))
    if 'ativo' in request.data:
        aviso.ativo = str(request.data.get('ativo')).lower() in ('true', '1')
    if request.FILES.get('imagem_capa'):
        aviso.imagem_capa = request.FILES.get('imagem_capa')
    aviso.save()
    return Response(AvisoSerializer(aviso, context={'request': request}).data)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def admin_aviso_upload_imagem(request):
    """Upload de imagem para inserir no meio do texto do artigo, pelo editor rico."""
    if not _is_admin(request):
        return Response({'detail': 'Acesso negado.'}, status=403)

    arquivo = request.FILES.get('imagem')
    if not arquivo:
        return Response({'detail': 'Nenhuma imagem enviada.'}, status=400)

    from django.core.files.storage import default_storage
    caminho = default_storage.save(f'avisos/conteudo/{arquivo.name}', arquivo)
    url = request.build_absolute_uri(default_storage.url(caminho))
    return Response({'url': url}, status=201)
