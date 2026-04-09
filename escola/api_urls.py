from django.urls import path
from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView
from . import api_views

urlpatterns = [
    # Auth
    path('token/', TokenObtainPairView.as_view(), name='token_obtain_pair'),
    path('token/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
    path('me/', api_views.me, name='api_me'),

    # Professor
    path('professor/dashboard/', api_views.professor_dashboard, name='api_professor_dashboard'),
    path('professor/turmas/', api_views.professor_turmas, name='api_professor_turmas'),
    path('professor/turma/<int:turma_id>/', api_views.professor_turma_carometro, name='api_professor_carometro'),
    path('professor/avaliar/<int:aluno_id>/', api_views.professor_registrar_avaliacao, name='api_professor_avaliar'),
    path('professor/banco-questoes/', api_views.professor_banco_questoes, name='api_banco_questoes'),
    path('professor/criar-simulado/data/', api_views.professor_criar_simulado_data, name='api_criar_simulado_data'),
    path('professor/criar-simulado/', api_views.professor_criar_simulado, name='api_criar_simulado'),
    path('professor/simulados/', api_views.professor_lista_simulados, name='api_lista_simulados'),
    path('professor/relatorio/<int:aluno_id>/', api_views.professor_relatorio_aluno, name='api_relatorio_aluno'),
    path('professor/notas/<int:aluno_id>/', api_views.professor_notas_aluno, name='api_professor_notas'),

    # Aluno
    path('aluno/dashboard/', api_views.aluno_dashboard, name='api_aluno_dashboard'),
    path('aluno/meu-feedback/', api_views.aluno_meu_feedback, name='api_aluno_feedback'),
    path('aluno/meus-simulados/', api_views.aluno_meus_simulados, name='api_aluno_simulados'),
    path('aluno/simulado/<int:simulado_id>/', api_views.aluno_visualizar_simulado, name='api_aluno_simulado'),
]
