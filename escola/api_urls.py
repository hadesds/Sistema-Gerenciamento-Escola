from django.urls import path
from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView
from . import api_views

urlpatterns = [
    # Auth
    path('token/', TokenObtainPairView.as_view(), name='token_obtain_pair'),
    path('token/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
    path('me/', api_views.me, name='api_me'),
    path('grade-config/', api_views.grade_config, name='api_grade_config'),

    # Professor
    path('professor/dashboard/', api_views.professor_dashboard, name='api_professor_dashboard'),
    path('professor/turmas/', api_views.professor_turmas, name='api_professor_turmas'),
    path('professor/turma/<int:turma_id>/', api_views.professor_turma_carometro, name='api_professor_carometro'),
    path('professor/avaliar/<int:aluno_id>/', api_views.professor_registrar_avaliacao, name='api_professor_avaliar'),
    path('professor/banco-questoes/', api_views.professor_banco_questoes, name='api_banco_questoes'),
    path('professor/materias/', api_views.professor_materias, name='api_professor_materias'),
    path('professor/criar-simulado/data/', api_views.professor_criar_simulado_data, name='api_criar_simulado_data'),
    path('professor/criar-simulado/', api_views.professor_criar_simulado, name='api_criar_simulado'),
    path('professor/simulados/', api_views.professor_lista_simulados, name='api_lista_simulados'),
    path('professor/simulado/<int:simulado_id>/', api_views.professor_detalhe_simulado, name='api_detalhe_simulado'),
    path('professor/simulado/<int:simulado_id>/questao/<int:questao_id>/', api_views.professor_remover_questao_simulado, name='api_remover_questao_simulado'),
    path('professor/simulado/<int:simulado_id>/resultados/', api_views.professor_simulado_resultados, name='api_simulado_resultados'),
    path('professor/relatorio/<int:aluno_id>/', api_views.professor_relatorio_aluno, name='api_relatorio_aluno'),
    path('professor/relatorio/<int:aluno_id>/pdf/', api_views.professor_relatorio_pdf, name='api_relatorio_pdf'),
    path('professor/notas/<int:aluno_id>/', api_views.professor_notas_aluno, name='api_professor_notas'),
    path('professor/provas/<int:aluno_id>/', api_views.professor_provas_aluno, name='api_professor_provas'),
    path('professor/perfil/<int:aluno_id>/', api_views.professor_perfil_turma, name='api_professor_perfil'),
    path('professor/resultado/<int:resultado_id>/corrigir/', api_views.professor_corrigir_discursivas, name='api_corrigir_discursivas'),
    path('professor/consolidado/<int:aluno_id>/', api_views.professor_consolidado, name='api_professor_consolidado'),
    path('professor/nota-area/<int:aluno_id>/', api_views.professor_nota_area, name='api_professor_nota_area'),
    path('professor/nota-qualitativa/<int:aluno_id>/', api_views.professor_nota_qualitativa, name='api_professor_nota_qualitativa'),

    # Aluno
    path('aluno/dashboard/', api_views.aluno_dashboard, name='api_aluno_dashboard'),
    path('aluno/meu-feedback/', api_views.aluno_meu_feedback, name='api_aluno_feedback'),
    path('aluno/meus-simulados/', api_views.aluno_meus_simulados, name='api_aluno_simulados'),
    path('aluno/simulado/<int:simulado_id>/', api_views.aluno_visualizar_simulado, name='api_aluno_simulado'),
    path('aluno/simulado/<int:simulado_id>/enviar/', api_views.aluno_enviar_simulado, name='api_aluno_enviar_simulado'),
    path('aluno/minhas-notas/', api_views.aluno_minhas_notas, name='api_aluno_minhas_notas'),
    path('aluno/assiduidade/', api_views.aluno_assiduidade, name='api_aluno_assiduidade'),
]
