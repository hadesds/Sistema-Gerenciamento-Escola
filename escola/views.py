from django.shortcuts import render, get_object_or_404, redirect
from django.contrib.auth.decorators import login_required
from .models import Professor, Aluno, Turma, Avaliacao, Questao, Simulado
from django.http import HttpResponseForbidden
from django.contrib import messages
from django.contrib.auth import logout
from django.db.models import Avg, Count
from datetime import datetime, timedelta


def professor_required(view_func):
    """Verifica se o usuário logado é um professor"""
    def wrapper(request, *args, **kwargs):
        if not hasattr(request.user, 'professor'):
            return HttpResponseForbidden("Acesso negado")
        return view_func(request, *args, **kwargs)
    return wrapper

def aluno_required(view_func):
    """Verifica se o usuário logado é um aluno"""
    def wrapper(request, *args, **kwargs):
        if not hasattr(request.user, 'aluno'):
            return HttpResponseForbidden("Acesso negado.")
        return view_func(request, *args, **kwargs)
    return wrapper


# --- Dashboard Melhorado ---

@login_required
def dashboard(request):
    """
    Dashboard unificado que mostra informações relevantes
    baseado no tipo de usuário (Professor, Aluno ou Admin)
    """
    if hasattr(request.user, 'professor'):
        return dashboard_professor(request)
    elif hasattr(request.user, 'aluno'):
        return dashboard_aluno(request)
    elif request.user.is_superuser:
        return redirect('/admin/')
    else:
        messages.error(request, 'Login bem-sucedido, mas seu usuário não está vinculado a um perfil (Aluno ou Professor). Contate o administrador.')
        logout(request)
        return redirect('login')


@login_required
@professor_required
def dashboard_professor(request):
    """
    Dashboard do Professor com estatísticas e informações relevantes
    """
    professor = request.user.professor
    turmas = professor.turmas.all()
    
    # Estatísticas gerais
    total_alunos = Aluno.objects.filter(turma__in=turmas).count()
    total_turmas = turmas.count()
    total_questoes = Questao.objects.filter(autor=professor).count()
    total_simulados = Simulado.objects.filter(autor=professor).count()
    
    # Avaliações recentes (últimos 7 dias)
    data_limite = datetime.now().date() - timedelta(days=7)
    avaliacoes_recentes = Avaliacao.objects.filter(
        professor=professor,
        data__gte=data_limite
    ).select_related('aluno', 'aluno__turma').order_by('-data')[:10]
    
    # Top 5 alunos por média geral
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
                
                top_alunos.append({
                    'aluno': aluno,
                    'media_geral': round(media_geral, 2),
                    'turma': turma.nome
                })
    
    # Ordenar top alunos por média
    top_alunos = sorted(top_alunos, key=lambda x: x['media_geral'], reverse=True)[:5]
    
    # Desempenho por turma
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
    
    context = {
        'turmas': turmas,
        'total_alunos': total_alunos,
        'total_turmas': total_turmas,
        'total_questoes': total_questoes,
        'total_simulados': total_simulados,
        'avaliacoes_recentes': avaliacoes_recentes,
        'top_alunos': top_alunos,
        'desempenho_turmas': desempenho_turmas,
    }
    
    return render(request, 'professor/dashboard.html', context)


@login_required
@aluno_required
def dashboard_aluno(request):
    """
    Dashboard do Aluno com seu desempenho e informações
    """
    aluno = request.user.aluno
    avaliacoes = Avaliacao.objects.filter(aluno=aluno).order_by('-data')
    
    # Cálculo das médias gerais
    if avaliacoes.exists():
        medias = avaliacoes.aggregate(
            media_assiduidade=Avg('assiduidade'),
            media_participacao=Avg('participacao'),
            media_responsabilidade=Avg('responsabilidade'),
            media_sociabilidade=Avg('sociabilidade')
        )
        
        media_geral = (
            (medias['media_assiduidade'] or 0) +
            (medias['media_participacao'] or 0) +
            (medias['media_responsabilidade'] or 0) +
            (medias['media_sociabilidade'] or 0)
        ) / 4
        
        # Últimas 5 avaliações
        avaliacoes_recentes = avaliacoes[:5]
        
        # Evolução (comparar última avaliação com média geral)
        if avaliacoes.count() > 1:
            ultima_avaliacao = avaliacoes.first()
            media_ultima = ultima_avaliacao.calcular_media()
            evolucao = round(media_ultima - media_geral, 2)
        else:
            evolucao = 0
    else:
        medias = {
            'media_assiduidade': 0,
            'media_participacao': 0,
            'media_responsabilidade': 0,
            'media_sociabilidade': 0
        }
        media_geral = 0
        avaliacoes_recentes = []
        evolucao = 0
    
    # Simulados disponíveis
    simulados = Simulado.objects.filter(turma_alvo=aluno.turma).select_related('autor')[:5]
    
    context = {
        'aluno': aluno,
        'media_geral': round(media_geral, 2),
        'medias': medias,
        'avaliacoes_recentes': avaliacoes_recentes,
        'total_avaliacoes': avaliacoes.count(),
        'evolucao': evolucao,
        'simulados': simulados,
    }
    
    return render(request, 'aluno/dashboard.html', context)


# ==========================================
# ÁREA DO PROFESSOR
# ==========================================

@login_required
@professor_required
def lista_turmas_professor(request):
    """
    Lista de turmas associadas ao professor logado com estatísticas
    """
    professor = request.user.professor
    turmas = professor.turmas.all()
    
    # Adicionar estatísticas para cada turma
    turmas_info = []
    for turma in turmas:
        total_alunos = turma.alunos.count()
        avaliacoes_turma = Avaliacao.objects.filter(aluno__turma=turma, professor=professor)
        
        if avaliacoes_turma.exists():
            media_turma = avaliacoes_turma.aggregate(Avg('assiduidade'))['assiduidade__avg']
        else:
            media_turma = 0
        
        turmas_info.append({
            'turma': turma,
            'total_alunos': total_alunos,
            'media_turma': round(media_turma or 0, 2),
            'total_avaliacoes': avaliacoes_turma.count()
        })
    
    return render(request, 'professor/lista_turmas.html', {'turmas_info': turmas_info})


@login_required
@professor_required
def detalhe_turma_carometro(request, turma_id):
    """
    Carômetro com filtro de busca e ordenação
    """
    turma = get_object_or_404(Turma, id=turma_id)
    
    if turma not in request.user.professor.turmas.all():
        return HttpResponseForbidden("Você não tem permissão para ver esta turma.")
    
    # Busca por nome
    busca = request.GET.get('busca', '')
    alunos = turma.alunos.all()
    
    if busca:
        alunos = alunos.filter(user__first_name__icontains=busca) | \
                 alunos.filter(user__last_name__icontains=busca)
    
    # Adicionar média de cada aluno
    alunos_info = []
    for aluno in alunos:
        avaliacoes = Avaliacao.objects.filter(aluno=aluno)
        if avaliacoes.exists():
            media = sum([av.calcular_media() for av in avaliacoes]) / avaliacoes.count()
        else:
            media = 0
        
        alunos_info.append({
            'aluno': aluno,
            'media_geral': round(media, 2),
            'total_avaliacoes': avaliacoes.count()
        })
    
    return render(request, 'professor/carometro.html', {
        'turma': turma,
        'alunos_info': alunos_info,
        'busca': busca
    })


@login_required
@professor_required
def registrar_avaliacao(request, aluno_id):
    """
    Registra avaliação com mensagem de sucesso
    """
    aluno = get_object_or_404(Aluno, pk=aluno_id)
    professor = request.user.professor

    if request.method == 'POST':
        try:
            Avaliacao.objects.create(
                aluno=aluno,
                professor=professor,
                assiduidade=int(request.POST.get('assiduidade', 3)),
                participacao=int(request.POST.get('participacao', 3)),
                responsabilidade=int(request.POST.get('responsabilidade', 3)),
                sociabilidade=int(request.POST.get('sociabilidade', 3))
            )
            messages.success(request, f'Avaliação de {aluno.user.get_full_name()} registrada com sucesso!')
        except Exception as e:
            messages.error(request, f'Erro ao registrar avaliação: {str(e)}')
        
        return redirect('detalhe_turma_carometro', turma_id=aluno.turma.id)
    
    return redirect('lista_turmas_professor')


@login_required
@professor_required
def banco_questoes(request):
    """
    Banco de questões com filtro por matéria
    """
    professor = request.user.professor
    
    if request.method == 'POST':
        try:
            Questao.objects.create(
                autor=professor,
                enunciado=request.POST.get('enunciado'),
                resposta=request.POST.get('resposta'),
                materia=request.POST.get('materia')
            )
            messages.success(request, 'Questão cadastrada com sucesso!')
        except Exception as e:
            messages.error(request, f'Erro ao cadastrar questão: {str(e)}')
        
        return redirect('banco_questoes')
    
    # Filtro por matéria
    materia_filtro = request.GET.get('materia', '')
    questoes = Questao.objects.filter(autor=professor).order_by('-id')
    
    if materia_filtro:
        questoes = questoes.filter(materia__icontains=materia_filtro)
    
    # Lista de matérias únicas
    materias = Questao.objects.filter(autor=professor).values_list('materia', flat=True).distinct()
    
    return render(request, 'professor/banco_questoes.html', {
        'questoes': questoes,
        'materias': materias,
        'materia_filtro': materia_filtro
    })


@login_required
@professor_required
def criar_simulado(request):
    """
    Criação de simulados a partir do banco de questões
    """
    professor = request.user.professor
    
    if request.method == 'POST':
        turma_id = request.POST.get('turma')
        questoes_ids = request.POST.getlist('questoes')
        
        if turma_id and questoes_ids:
            turma = get_object_or_404(Turma, id=turma_id)
            simulado = Simulado.objects.create(
                autor=professor,
                turma_alvo=turma
            )
            simulado.questoes.set(questoes_ids)
            messages.success(request, 'Simulado criado com sucesso!')
            return redirect('lista_simulados')
        else:
            messages.error(request, 'Selecione uma turma e pelo menos uma questão.')
    
    questoes = Questao.objects.filter(autor=professor)
    turmas = professor.turmas.all()
    
    return render(request, 'professor/criar_simulado.html', {
        'questoes': questoes,
        'turmas': turmas
    })


@login_required
@professor_required
def lista_simulados(request):
    """
    Lista de simulados criados pelo professor
    """
    professor = request.user.professor
    simulados = Simulado.objects.filter(autor=professor).select_related('turma_alvo').order_by('-id')
    
    return render(request, 'professor/lista_simulados.html', {'simulados': simulados})


@login_required
@professor_required
def relatorio_aluno(request, aluno_id):
    """
    Gera relatório completo de desempenho do aluno
    """
    aluno = get_object_or_404(Aluno, pk=aluno_id)
    avaliacoes = Avaliacao.objects.filter(aluno=aluno).order_by('-data')
    
    if avaliacoes.exists():
        medias = avaliacoes.aggregate(
            media_assiduidade=Avg('assiduidade'),
            media_participacao=Avg('participacao'),
            media_responsabilidade=Avg('responsabilidade'),
            media_sociabilidade=Avg('sociabilidade')
        )
        media_geral = sum(medias.values()) / 4
    else:
        medias = {}
        media_geral = 0
    
    context = {
        'aluno': aluno,
        'avaliacoes': avaliacoes,
        'medias': medias,
        'media_geral': round(media_geral, 2),
        'total_avaliacoes': avaliacoes.count()
    }
    
    return render(request, 'professor/relatorio_aluno.html', context)


# ==========================================
# ÁREA DO ALUNO
# ==========================================

@login_required
@aluno_required
def meu_feedback(request):
    """
    Visualização de feedbacks do aluno com gráficos
    """
    aluno = request.user.aluno
    avaliacoes = Avaliacao.objects.filter(aluno=aluno).order_by('-data')
    
    # Calcular médias
    if avaliacoes.exists():
        medias = avaliacoes.aggregate(
            media_assiduidade=Avg('assiduidade'),
            media_participacao=Avg('participacao'),
            media_responsabilidade=Avg('responsabilidade'),
            media_sociabilidade=Avg('sociabilidade')
        )
        media_geral = sum(medias.values()) / 4
    else:
        medias = {
            'media_assiduidade': 0,
            'media_participacao': 0,
            'media_responsabilidade': 0,
            'media_sociabilidade': 0
        }
        media_geral = 0
    
    return render(request, 'aluno/meu_feedback.html', {
        'aluno': aluno,
        'avaliacoes': avaliacoes,
        'medias': medias,
        'media_geral': round(media_geral, 2)
    })


@login_required
@aluno_required
def meus_simulados(request):
    """
    Lista de simulados disponíveis para o aluno
    """
    aluno = request.user.aluno
    simulados = Simulado.objects.filter(turma_alvo=aluno.turma).select_related('autor')
    
    return render(request, 'aluno/meus_simulados.html', {
        'aluno': aluno,
        'simulados': simulados
    })


@login_required
@aluno_required
def visualizar_simulado(request, simulado_id):
    """
    Visualiza as questões de um simulado
    """
    aluno = request.user.aluno
    simulado = get_object_or_404(Simulado, id=simulado_id)
    
    # Verificar se o simulado é para a turma do aluno
    if simulado.turma_alvo != aluno.turma:
        return HttpResponseForbidden("Você não tem acesso a este simulado.")
    
    questoes = simulado.questoes.all()
    
    return render(request, 'aluno/visualizar_simulado.html', {
        'simulado': simulado,
        'questoes': questoes
    })