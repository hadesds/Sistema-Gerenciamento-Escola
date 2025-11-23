from django.contrib import admin
from django.contrib.auth.admin import UserAdmin
from django.contrib.auth.models import User
from .models import Professor, Aluno, Turma, Avaliacao, Questao, Simulado, Administrador

# Inline para Professor
class ProfessorInline(admin.StackedInline):
    model = Professor
    can_delete = False
    verbose_name_plural = 'Dados de Professor'
    filter_horizontal = ('turmas',)

# Inline para Aluno
class AlunoInline(admin.StackedInline):
    model = Aluno
    can_delete = False
    verbose_name_plural = 'Dados de Aluno'
    fields = ('foto', 'turma', 'matricula')

# Custom UserAdmin
class CustomUserAdmin(UserAdmin):
    inlines = []
    
    def get_inlines(self, request, obj=None):
        if obj:
            if hasattr(obj, 'professor'):
                return [ProfessorInline]
            elif hasattr(obj, 'aluno'):
                return [AlunoInline]
        return []

# Turma Admin
@admin.register(Turma)
class TurmaAdmin(admin.ModelAdmin):
    list_display = ['nome', 'serie', 'turno', 'sala', 'total_alunos']
    list_filter = ['turno', 'serie']
    search_fields = ['nome', 'serie']
    
    def total_alunos(self, obj):
        return obj.alunos.count()
    total_alunos.short_description = 'Total de Alunos'

# Aluno Admin
@admin.register(Aluno)
class AlunoAdmin(admin.ModelAdmin):
    list_display = ['get_nome_completo', 'matricula', 'turma', 'get_email']
    list_filter = ['turma']
    search_fields = ['user__username', 'user__first_name', 'user__last_name', 'matricula']
    
    def get_nome_completo(self, obj):
        return obj.user.get_full_name() or obj.user.username
    get_nome_completo.short_description = 'Nome'
    
    def get_email(self, obj):
        return obj.user.email
    get_email.short_description = 'Email'

# Professor Admin
@admin.register(Professor)
class ProfessorAdmin(admin.ModelAdmin):
    list_display = ['get_nome_completo', 'get_email', 'total_turmas']
    filter_horizontal = ('turmas',)
    search_fields = ['user__username', 'user__first_name', 'user__last_name']
    
    def get_nome_completo(self, obj):
        return obj.user.get_full_name() or obj.user.username
    get_nome_completo.short_description = 'Nome'
    
    def get_email(self, obj):
        return obj.user.email
    get_email.short_description = 'Email'
    
    def total_turmas(self, obj):
        return obj.turmas.count()
    total_turmas.short_description = 'Total de Turmas'

# Avaliação Admin
@admin.register(Avaliacao)
class AvaliacaoAdmin(admin.ModelAdmin):
    list_display = ['aluno', 'professor', 'data', 'assiduidade', 'participacao', 'responsabilidade', 'sociabilidade', 'calcular_media']
    list_filter = ['data', 'professor', 'aluno__turma']
    search_fields = ['aluno__user__first_name', 'aluno__user__last_name', 'professor__user__first_name']
    date_hierarchy = 'data'
    
    def calcular_media(self, obj):
        return round(obj.calcular_media(), 2)
    calcular_media.short_description = 'Média'

# Questão Admin
@admin.register(Questao)
class QuestaoAdmin(admin.ModelAdmin):
    list_display = ['materia', 'get_enunciado_curto', 'autor', 'data_criacao']
    list_filter = ['materia', 'data_criacao', 'autor']
    search_fields = ['materia', 'enunciado', 'autor__user__first_name']
    date_hierarchy = 'data_criacao'
    
    def get_enunciado_curto(self, obj):
        return obj.enunciado[:50] + '...' if len(obj.enunciado) > 50 else obj.enunciado
    get_enunciado_curto.short_description = 'Enunciado'

# Simulado Admin
@admin.register(Simulado)
class SimuladoAdmin(admin.ModelAdmin):
    list_display = ['get_titulo', 'autor', 'turma_alvo', 'total_questoes', 'data_criacao']
    list_filter = ['data_criacao', 'autor', 'turma_alvo']
    search_fields = ['autor__user__first_name', 'turma_alvo__nome']
    filter_horizontal = ('questoes',)
    date_hierarchy = 'data_criacao'
    
    def get_titulo(self, obj):
        return f"Simulado - {obj.turma_alvo.nome}"
    get_titulo.short_description = 'Título'
    
    def total_questoes(self, obj):
        return obj.questoes.count()
    total_questoes.short_description = 'Total de Questões'

# Administrador Admin
@admin.register(Administrador)
class AdministradorAdmin(admin.ModelAdmin):
    list_display = ['get_nome_completo', 'get_email']
    search_fields = ['user__username', 'user__first_name', 'user__last_name']
    
    def get_nome_completo(self, obj):
        return obj.user.get_full_name() or obj.user.username
    get_nome_completo.short_description = 'Nome'
    
    def get_email(self, obj):
        return obj.user.email
    get_email.short_description = 'Email'

# Re-register UserAdmin
admin.site.unregister(User)
admin.site.register(User, CustomUserAdmin)

# Customizar títulos do Admin
admin.site.site_header = 'CARA - Administração'
admin.site.site_title = 'CARA Admin'
admin.site.index_title = 'Painel de Administração'