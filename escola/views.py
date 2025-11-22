from django.shortcuts import render, redirect, get_object_or_404
from django.contrib.auth.decorators import login_required
from django.contrib import messages
from django.http import HttpResponseForbidden, JsonResponse
from .models import Professor, Aluno, Turma, Avaliacao, Questao
from django.contrib.auth.models import User
from django.db.models import Avg

def professor_required(view_func):
    def wrapper(request, *args, **kwargs):
        if not hasattr(request.user, 'professor'):
            return HttpResponseForbidden("Acesso negado para professores")
        return view_func(request, *args, **kwargs)
    return wrapper

def aluno_required(view_func):
    def wrapper(request, *args, **kwargs):
        if not hasattr(request.user, 'aluno'):
            return HttpResponseForbidden("Acesso negado para alunos")
        return view_func(request, *args, **kwargs)
    return wrapper

@login_required
def dashboard(request):
    if hasattr(request.user, 'professor'):
        return redirect('lista_turmas')
    elif hasattr(request.user, 'aluno'):
        return redirect('meu_feedback')
    elif request.user.is_superuser:
        return redirect('admin_dashboard')
    else:
        messages.error(request, 'Perfil não configurado')
        return redirect('login')

@login_required
@professor_required
def lista_turmas(request):
    professor = request.user.professor
    turmas = professor.turmas.all().prefetch_related('alunos')
    return render(request, 'professor/lista_turmas.html', {'turmas': turmas})

@login_required
@professor_required
def avaliar_aluno(request, aluno_id):
    if request.method == 'POST':
        aluno = get_object_or_404(Aluno, id=aluno_id)
        professor = request.user.professor
        
        # Verifica se o professor tem acesso à turma do aluno
        if aluno.turma not in professor.turmas.all():
            return HttpResponseForbidden("Acesso negado")
        
        Avaliacao.objects.create(
            aluno=aluno,
            professor=professor,
            assiduidade=request.POST.get('assiduidade'),
            participacao=request.POST.get('participacao'),
            responsabilidade=request.POST.get('responsabilidade'),
            sociabilidade=request.POST.get('sociabilidade')
        )
        
        messages.success(request, f'Avaliação registrada para {aluno.user.get_full_name()}')
    
    return redirect('lista_turmas')

@login_required
@professor_required
def banco_questoes(request):
    professor = request.user.professor
    
    if request.method == 'POST':
        Questao.objects.create(
            autor=professor,
            materia=request.POST.get('materia'),
            enunciado=request.POST.get('enunciado'),
            resposta=request.POST.get('resposta')
        )
        messages.success(request, 'Questão cadastrada com sucesso!')
        return redirect('banco_questoes')
    
    questoes = Questao.objects.filter(autor=professor)
    return render(request, 'professor/banco_questoes.html', {'questoes': questoes})

@login_required
@aluno_required
def meu_feedback(request):
    aluno = request.user.aluno
    avaliacoes = Avaliacao.objects.filter(aluno=aluno).order_by('-data')
    
    # Calcula média geral
    media_geral = avaliacoes.aggregate(
        media=Avg('assiduidade') + Avg('participacao') + 
              Avg('responsabilidade') + Avg('sociabilidade') / 4
    )['media'] or 0
    
    context = {
        'aluno': aluno,
        'avaliacoes': avaliacoes,
        'media_geral': round(media_geral, 1),
        'total_avaliacoes': avaliacoes.count()
    }
    return render(request, 'aluno/meu_feedback.html', context)

@login_required
def admin_dashboard(request):
    if not request.user.is_superuser:
        return HttpResponseForbidden("Acesso negado")
    
    if request.method == 'POST':
        # Cadastrar novo aluno
        username = request.POST.get('email').split('@')[0]
        user = User.objects.create_user(
            username=username,
            email=request.POST.get('email'),
            password='senha123',  # Senha padrão
            first_name=request.POST.get('nome').split()[0],
            last_name=' '.join(request.POST.get('nome').split()[1:])
        )
        
        turma = get_object_or_404(Turma, id=request.POST.get('turma'))
        Aluno.objects.create(
            user=user,
            turma=turma,
            matricula=f"2024{User.objects.count():04d}"
        )
        
        messages.success(request, 'Aluno cadastrado com sucesso!')
        return redirect('admin_dashboard')
    
    context = {
        'turmas': Turma.objects.all(),
        'total_alunos': Aluno.objects.count(),
        'total_professores': Professor.objects.count(),
        'total_turmas': Turma.objects.count(),
    }
    return render(request, 'admin/admin_dashboard.html', context)