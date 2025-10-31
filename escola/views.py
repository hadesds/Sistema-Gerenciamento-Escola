from django.shortcuts import render, get_object_or_404, redirect
from django.contrib.auth.decorators import login_required
from .models import Professor, Aluno, Turma, Avaliacao, Questao, Simulado
from django.http import HttpResponseForbidden
from django.contrib import messages
from django.contrib.auth import logout


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


# --- Visão Geral (Dashboard) ---

@login_required
def dashboard(request):
    """
    Redireciona o usuário para o painel correto
    baseado no seu tipo (perfil).
    """
    if hasattr(request.user, 'professor'):
        return redirect('lista_turmas_professor')
    elif hasattr(request.user, 'aluno'):
        return redirect('meu_feedback')
    elif request.user.is_superuser:
        # Superusuários (Admins) são redirecionados para o painel /admin/
        return redirect('/admin/')
    else:
        # Caso de usuário sem perfil
        return render(request, 'erro_perfil.html')

# ==========================================
# ÁREA DO PROFESSOR
# ==========================================

@login_required
@professor_required
def lista_turmas_professor(request):
    """
    Requisito: "Visualizar suas turmas"
    Mostra a lista de turmas associadas ao professor logado.
    """
    professor = request.user.professor
    turmas = professor.turmas.all()
    return render(request, 'professor/lista_turmas.html', {'turmas': turmas})

@login_required
@professor_required
def detalhe_turma_carometro(request, turma_id):
    """
    Requisito: "Usar o 'Carômetro' para identificar facilmente cada aluno por meio de fotos."
    Mostra a lista de alunos (com fotos) de uma turma específica.
    """
    turma = get_object_or_404(Turma, id=turma_id)
    # Garante que o professor só veja turmas dele
    if turma not in request.user.professor.turmas.all():
        return HttpResponseForbidden("Você não tem permissão para ver esta turma.")
        
    alunos = turma.alunos.all()
    return render(request, 'professor/carometro.html', {'turma': turma, 'alunos': alunos})

@login_required
@professor_required
def registrar_avaliacao(request, aluno_id):
    """
    Requisito: "Registrar avaliações de desempenho dos alunos (usando emojis e notas de 1 a 5)"
    Esta view processa o POST do formulário de avaliação.
    """
    aluno = get_object_or_404(Aluno, pk=aluno_id)
    professor = request.user.professor

    if request.method == 'POST':
        # Pega os dados do formulário (o SOW dizia 1-5)
        assiduidade_val = request.POST.get('assiduidade')
        participacao_val = request.POST.get('participacao')
        responsabilidade_val = request.POST.get('responsabilidade')
        sociabilidade_val = request.POST.get('sociabilidade')
        
        # Cria a avaliação no banco de dados
        Avaliacao.objects.create(
            aluno=aluno,
            professor=professor,
            assiduidade=assiduidade_val,
            participacao=participacao_val,
            responsabilidade=responsabilidade_val,
            sociabilidade=sociabilidade_val
        )
        
        
        return redirect('detalhe_turma_carometro', turma_id=aluno.turma.id)
    
    
    return redirect('lista_turmas_professor')

@login_required
@professor_required
def banco_questoes(request):
    """
    Requisito: "Cadastrar novas questões em um 'Banco de Questões'."
    Mostra as questões do professor e permite cadastrar novas.
    """
    professor = request.user.professor
    
    if request.method == 'POST':
        # Lógica para criar uma nova questão
        Questao.objects.create(
            autor=professor,
            enunciado=request.POST.get('enunciado'),
            resposta=request.POST.get('resposta'),
            materia=request.POST.get('materia')
        )
        return redirect('banco_questoes')
        
    # Se for GET, apenas lista as questões dele
    questoes = Questao.objects.filter(autor=professor)
    return render(request, 'professor/banco_questoes.html', {'questoes': questoes})


# ==========================================
# ÁREA DO ALUNO
# ==========================================

@login_required
@aluno_required
def meu_feedback(request):
    """
    Requisito: "Visualizar o seu feedback após a avaliação"
    Mostra o histórico de avaliações (feedbacks) para o aluno logado.
    """
    aluno = request.user.aluno
    avaliacoes = Avaliacao.objects.filter(aluno=aluno).order_by('-data')
    
    return render(request, 'aluno/meu_feedback.html', {
        'aluno': aluno,
        'avaliacoes': avaliacoes
    })


@login_required
def dashboard(request):
    """
    Redireciona o usuário para o painel correto
    baseado no seu tipo (perfil).
    """
    if hasattr(request.user, 'professor'):
        return redirect('lista_turmas_professor')
    elif hasattr(request.user, 'aluno'):
        return redirect('meu_feedback')
    elif request.user.is_superuser:
        # Superusuários (Admins) são redirecionados para o painel /admin/
        return redirect('/admin/')

    # Se o usuário logou mas não tem perfil, faça isso:
    else:
        # 1. Crie uma mensagem de erro
        messages.error(request, 'Login bem-sucedido, mas seu usuário não está vinculado a um perfil (Aluno ou Professor). Contate o administrador.')
        # 2. Deslogue o usuário (para não ficar em um estado "preso")
        logout(request)
        # 3. Redirecione de volta para a página de login
        return redirect('login')