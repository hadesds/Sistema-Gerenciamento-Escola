from django.urls import path
from django.contrib.auth import views as auth_views
from . import views

urlpatterns = [
    # Autenticação
    path('', views.dashboard, name='dashboard'),
    path('login/', auth_views.LoginView.as_view(template_name='login.html'), name='login'),
    path('logout/', auth_views.LogoutView.as_view(next_page='login'), name='logout'),
    
    # Professor
    path('professor/turmas/', views.lista_turmas, name='lista_turmas'),
    path('professor/avaliar/<int:aluno_id>/', views.avaliar_aluno, name='avaliar_aluno'),
    path('professor/banco-questoes/', views.banco_questoes, name='banco_questoes'),
    
    # Aluno
    path('aluno/feedback/', views.meu_feedback, name='meu_feedback'),
    
    # Admin
    path('admin/dashboard/', views.admin_dashboard, name='admin_dashboard'),
]