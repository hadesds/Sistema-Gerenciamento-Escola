from django.contrib import admin
from django.contrib.auth.admin import UserAdmin
from django.contrib.auth.models import User
from .models import Professor, Aluno, Turma, Avaliacao, Questao

class ProfessorInline(admin.StackedInline):
    model = Professor
    can_delete = False
    verbose_name_plural = 'Professor'

class AlunoInline(admin.StackedInline):
    model = Aluno
    can_delete = False
    verbose_name_plural = 'Aluno'

class CustomUserAdmin(UserAdmin):
    def get_inlines(self, request, obj=None):
        if obj:
            if hasattr(obj, 'professor'):
                return [ProfessorInline]
            elif hasattr(obj, 'aluno'):
                return [AlunoInline]
        return []

@admin.register(Turma)
class TurmaAdmin(admin.ModelAdmin):
    list_display = ['nome', 'serie', 'turno', 'sala']
    list_filter = ['turno', 'serie']
    search_fields = ['nome', 'serie']

@admin.register(Avaliacao)
class AvaliacaoAdmin(admin.ModelAdmin):
    list_display = ['aluno', 'professor', 'data', 'assiduidade', 'participacao', 'responsabilidade', 'sociabilidade']
    list_filter = ['data', 'professor']
    search_fields = ['aluno__user__first_name', 'aluno__user__last_name']

@admin.register(Questao)
class QuestaoAdmin(admin.ModelAdmin):
    list_display = ['materia', 'autor', 'data_criacao']
    list_filter = ['materia', 'data_criacao']
    search_fields = ['materia', 'enunciado']

# Re-register UserAdmin
admin.site.unregister(User)
admin.site.register(User, CustomUserAdmin)