from django.contrib import admin
from .models import Administrador, Turma, Professor, Aluno, Avaliacao, Questao, Simulado

@admin.register(Aluno)
class AlunoAdmin(admin.ModelAdmin):
    list_display = ('user', 'turma', 'foto') 
    search_fields = ('user__username', 'user__first_name', 'turma__nome') # Habilita a busca

# Para customizar a exibição da Avaliação
@admin.register(Avaliacao)
class AvaliacaoAdmin(admin.ModelAdmin):
    list_display = ('aluno', 'professor', 'data', 'calcular_media')
    list_filter = ('professor', 'aluno__turma', 'data') # Habilita filtros laterais

@admin.register(Professor)
class ProfessorAdmin(admin.ModelAdmin):
    list_display = ('user',)
    filter_horizontal = ('turmas',) 

# Para customizar a Turma
@admin.register(Turma)
class TurmaAdmin(admin.ModelAdmin):
    list_display = ('nome',)
    search_fields = ('nome',)

# Registra os outros modelos de forma simples
admin.site.register(Administrador)
admin.site.register(Questao)
admin.site.register(Simulado)