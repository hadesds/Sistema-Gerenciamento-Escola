from django.urls import path
from . import views

urlpatterns = [
    # Rota principal (Dashboard)
    path('', views.dashboard, name='dashboard'),

    # =====================
    # URLs DO PROFESSOR
    # =====================
   
    path('turmas/', views.lista_turmas_professor, name='lista_turmas_professor'),
    
    path('turma/<int:turma_id>/', views.detalhe_turma_carometro, name='detalhe_turma_carometro'),

    path('avaliar/<int:aluno_id>/', views.registrar_avaliacao, name='registrar_avaliacao'),
    
    # Banco de Questões (ex: /banco-questoes/)
    path('banco-questoes/', views.banco_questoes, name='banco_questoes'),

    # =====================
    # URLs DO ALUNO
    # =====================
   
    path('meu-feedback/', views.meu_feedback, name='meu_feedback'),
]