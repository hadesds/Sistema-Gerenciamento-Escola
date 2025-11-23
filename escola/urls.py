from django.urls import path
from . import views

urlpatterns = [
    # Rota principal (Dashboard)
    path('', views.dashboard, name='dashboard'),

    # =====================
    # URLs DO PROFESSOR
    # =====================
   
    # Lista de turmas
    path('turmas/', views.lista_turmas_professor, name='lista_turmas_professor'),
    
    # Carômetro (detalhes da turma)
    path('turma/<int:turma_id>/', views.detalhe_turma_carometro, name='detalhe_turma_carometro'),

    # Registrar avaliação
    path('avaliar/<int:aluno_id>/', views.registrar_avaliacao, name='registrar_avaliacao'),
    
    # Banco de Questões
    path('banco-questoes/', views.banco_questoes, name='banco_questoes'),
    
    # Criar Simulado
    path('criar-simulado/', views.criar_simulado, name='criar_simulado'),
    
    # Lista de Simulados
    path('simulados/', views.lista_simulados, name='lista_simulados'),
    
    # Relatório de Aluno
    path('relatorio/<int:aluno_id>/', views.relatorio_aluno, name='relatorio_aluno'),

    # =====================
    # URLs DO ALUNO
    # =====================
   
    # Feedback do aluno
    path('meu-feedback/', views.meu_feedback, name='meu_feedback'),
    
    # Simulados do aluno
    path('meus-simulados/', views.meus_simulados, name='meus_simulados'),
    
    # Visualizar simulado
    path('simulado/<int:simulado_id>/', views.visualizar_simulado, name='visualizar_simulado'),
]