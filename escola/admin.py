from django.contrib import admin
from django.contrib.auth.admin import UserAdmin
from django.contrib.auth.models import User
from django.conf import settings
from django.utils.html import format_html
from .models import (
    Professor, Aluno, Turma, Avaliacao, Questao, Simulado, SimuladoQuestao,
    Administrador, AlternativaQuestao, Materia, NotaMateria, ProvaIndividual,
    PerfilTurma, RegistroAssiduidade, PresencaAluno,
)


def _escala_comportamento(valor_0_5: float) -> float:
    """Converte nota 0–5 (step 0.5) para pontuação 0–2.5."""
    return round(float(valor_0_5) / 2, 2)


# ─── Inlines User ───────────────────────────────────────────────────────────

class ProfessorInline(admin.StackedInline):
    model = Professor
    can_delete = False
    verbose_name_plural = 'Dados de Professor'
    filter_horizontal = ('turmas',)


class AlunoInline(admin.StackedInline):
    model = Aluno
    can_delete = False
    verbose_name_plural = 'Dados de Aluno'
    fields = ('foto', 'turma', 'matricula')


class CustomUserAdmin(UserAdmin):
    inlines = []

    def get_inlines(self, request, obj=None):
        if obj:
            if hasattr(obj, 'professor'):
                return [ProfessorInline]
            elif hasattr(obj, 'aluno'):
                return [AlunoInline]
        return []


# ─── Turma ──────────────────────────────────────────────────────────────────

@admin.register(Turma)
class TurmaAdmin(admin.ModelAdmin):
    list_display = ['nome', 'serie', 'turno', 'sala', 'total_alunos']
    list_filter = ['turno', 'serie']
    search_fields = ['nome', 'serie']

    def total_alunos(self, obj):
        return obj.alunos.count()
    total_alunos.short_description = 'Total de Alunos'


# ─── Aluno ───────────────────────────────────────────────────────────────────

class ProvaIndividualInline(admin.TabularInline):
    model = ProvaIndividual
    extra = 0
    fields = ['materia', 'epoca', 'numero', 'nota', 'professor', 'data']
    readonly_fields = ['data']
    ordering = ['materia', 'epoca', 'numero']
    verbose_name = 'Prova Individual'
    verbose_name_plural = 'Provas Individuais'


class AvaliacaoInline(admin.TabularInline):
    model = Avaliacao
    extra = 0
    fields = ['materia', 'data', 'assiduidade', 'participacao', 'responsabilidade', 'sociabilidade', 'observacao']
    readonly_fields = ['data']
    ordering = ['-data']
    verbose_name = 'Avaliação Comportamental'
    verbose_name_plural = 'Avaliações Comportamentais'


@admin.register(Aluno)
class AlunoAdmin(admin.ModelAdmin):
    list_display = ['get_nome_completo', 'matricula', 'turma', 'get_email', 'total_avaliacoes', 'total_provas']
    list_filter = ['turma']
    search_fields = ['user__username', 'user__first_name', 'user__last_name', 'matricula']
    inlines = [AvaliacaoInline, ProvaIndividualInline]

    def get_nome_completo(self, obj):
        return obj.user.get_full_name() or obj.user.username
    get_nome_completo.short_description = 'Nome'

    def get_email(self, obj):
        return obj.user.email
    get_email.short_description = 'Email'

    def total_avaliacoes(self, obj):
        return obj.avaliacoes.count()
    total_avaliacoes.short_description = 'Avaliações'

    def total_provas(self, obj):
        return obj.provas_individuais.count()
    total_provas.short_description = 'Provas'


# ─── Professor ───────────────────────────────────────────────────────────────

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


# ─── Avaliação Comportamental ─────────────────────────────────────────────────

@admin.register(Avaliacao)
class AvaliacaoAdmin(admin.ModelAdmin):
    list_display = [
        'aluno', 'get_turma', 'materia', 'professor', 'data',
        'get_assid', 'get_part', 'get_resp', 'get_soc', 'get_media_comportamento',
        'get_media_raw',
    ]
    list_filter = ['materia', 'professor', 'aluno__turma', 'data']
    search_fields = [
        'aluno__user__first_name', 'aluno__user__last_name',
        'professor__user__first_name', 'materia__nome',
    ]
    date_hierarchy = 'data'
    readonly_fields = ['get_media_comportamento', 'get_media_raw']
    fieldsets = [
        ('Identificação', {
            'fields': ['aluno', 'professor', 'materia', 'data'],
        }),
        ('Comportamento (0 a 5, step 0.5 → exibido como 0–2.5 pts)', {
            'description': 'Cada critério aceita valores de 0 a 5 em passos de 0.5. A pontuação exibida é valor ÷ 2 (escala 0–2.5 pts).',
            'fields': ['assiduidade', 'participacao', 'responsabilidade', 'sociabilidade',
                       'get_media_comportamento'],
        }),
        ('Observação', {
            'fields': ['observacao'],
        }),
    ]

    def get_turma(self, obj):
        return obj.aluno.turma.nome if obj.aluno.turma else '–'
    get_turma.short_description = 'Turma'

    def _fmt(self, val):
        pts = _escala_comportamento(val)
        color = '#27ae60' if pts >= 1.875 else ('#e67e22' if pts >= 1.25 else '#e74c3c')
        return format_html('<span style="font-weight:600;color:{}">{}</span>', color, f'{pts:.1f}')

    def get_assid(self, obj):
        return self._fmt(obj.assiduidade)
    get_assid.short_description = 'Assid. (0-2.5)'
    get_assid.allow_tags = True

    def get_part(self, obj):
        return self._fmt(obj.participacao)
    get_part.short_description = 'Part. (0-2.5)'
    get_part.allow_tags = True

    def get_resp(self, obj):
        return self._fmt(obj.responsabilidade)
    get_resp.short_description = 'Resp. (0-2.5)'
    get_resp.allow_tags = True

    def get_soc(self, obj):
        return self._fmt(obj.sociabilidade)
    get_soc.short_description = 'Soc. (0-2.5)'
    get_soc.allow_tags = True

    def get_media_comportamento(self, obj):
        media_1_5 = obj.calcular_media()
        pts = _escala_comportamento(media_1_5)
        color = '#27ae60' if pts >= 1.875 else ('#e67e22' if pts >= 1.25 else '#e74c3c')
        return format_html(
            '<strong style="font-size:1.1em;color:{}">{} / 2.5 pts</strong>', color, f'{pts:.2f}'
        )
    get_media_comportamento.short_description = 'Média Comportamental'

    def get_media_raw(self, obj):
        return round(obj.calcular_media(), 2)
    get_media_raw.short_description = 'Média (1-5)'


# ─── Matéria ─────────────────────────────────────────────────────────────────

@admin.register(Materia)
class MateriaAdmin(admin.ModelAdmin):
    list_display = ['nome', 'sigla', 'total_questoes', 'total_provas', 'total_avaliacoes']
    search_fields = ['nome', 'sigla']

    def total_questoes(self, obj):
        return obj.questoes.count()
    total_questoes.short_description = 'Questões'

    def total_provas(self, obj):
        return obj.provas_individuais.count()
    total_provas.short_description = 'Provas'

    def total_avaliacoes(self, obj):
        return obj.avaliacoes.count()
    total_avaliacoes.short_description = 'Avaliações'


# ─── Notas por Matéria (legado NotaMateria) ───────────────────────────────────

@admin.register(NotaMateria)
class NotaMateriaAdmin(admin.ModelAdmin):
    list_display = ['aluno', 'get_turma', 'get_materia', 'get_epoca', 'get_nota_colorida', 'professor', 'data']
    list_filter = ['materia', 'epoca', 'aluno__turma', 'professor']
    search_fields = ['aluno__user__first_name', 'aluno__user__last_name', 'professor__user__first_name']
    date_hierarchy = 'data'
    ordering = ['aluno', 'materia', 'epoca']

    def get_turma(self, obj):
        return obj.aluno.turma.nome if obj.aluno.turma else '–'
    get_turma.short_description = 'Turma'

    def get_materia(self, obj):
        return obj.get_materia_display()
    get_materia.short_description = 'Matéria'
    get_materia.admin_order_field = 'materia'

    def get_epoca(self, obj):
        return obj.get_epoca_display()
    get_epoca.short_description = 'Bimestre'
    get_epoca.admin_order_field = 'epoca'

    def get_nota_colorida(self, obj):
        nota = float(obj.nota)
        color = '#27ae60' if nota >= 7 else ('#e67e22' if nota >= 5 else '#e74c3c')
        return format_html('<strong style="color:{}">{}</strong>', color, f'{nota:.1f}')
    get_nota_colorida.short_description = 'Nota'
    get_nota_colorida.admin_order_field = 'nota'


# ─── Provas Individuais por Matéria ──────────────────────────────────────────

@admin.register(ProvaIndividual)
class ProvaIndividualAdmin(admin.ModelAdmin):
    list_display = ['aluno', 'get_turma', 'materia', 'get_epoca', 'get_numero_prova', 'get_nota_colorida', 'professor', 'data']
    list_filter = ['materia', 'epoca', 'aluno__turma', 'professor']
    search_fields = [
        'aluno__user__first_name', 'aluno__user__last_name',
        'materia__nome', 'professor__user__first_name',
    ]
    date_hierarchy = 'data'
    ordering = ['aluno', 'materia', 'epoca', 'numero']

    def get_turma(self, obj):
        return obj.aluno.turma.nome if obj.aluno.turma else '–'
    get_turma.short_description = 'Turma'

    def get_epoca(self, obj):
        return obj.get_epoca_display()
    get_epoca.short_description = 'Bimestre'
    get_epoca.admin_order_field = 'epoca'

    def get_numero_prova(self, obj):
        return f'P{obj.numero}'
    get_numero_prova.short_description = 'Nº Prova'
    get_numero_prova.admin_order_field = 'numero'

    def get_nota_colorida(self, obj):
        nota = float(obj.nota)
        color = '#27ae60' if nota >= 7 else ('#e67e22' if nota >= 5 else '#e74c3c')
        return format_html('<strong style="color:{}">{}</strong>', color, f'{nota:.1f}')
    get_nota_colorida.short_description = 'Nota'
    get_nota_colorida.admin_order_field = 'nota'


# ─── Perfil de Turma (Líder / Vice) ─────────────────────────────────────────

@admin.register(PerfilTurma)
class PerfilTurmaAdmin(admin.ModelAdmin):
    list_display = ['aluno', 'turma', 'get_papel']
    list_filter = ['papel', 'turma']
    search_fields = ['aluno__user__first_name', 'aluno__user__last_name', 'turma__nome']

    def get_papel(self, obj):
        icon = '👑' if obj.papel == 'lider' else '⭐'
        return f'{icon} {obj.get_papel_display()}'
    get_papel.short_description = 'Cargo'
    get_papel.admin_order_field = 'papel'


# ─── Questão ─────────────────────────────────────────────────────────────────

class AlternativaInline(admin.TabularInline):
    model = AlternativaQuestao
    extra = 2
    fields = ['ordem', 'texto', 'correta']


@admin.register(Questao)
class QuestaoAdmin(admin.ModelAdmin):
    list_display = ['materia', 'tipo', 'dificuldade', 'get_enunciado_curto', 'tem_imagem', 'exige_justificativa', 'autor', 'data_criacao']
    list_filter = ['materia', 'tipo', 'dificuldade', 'exige_justificativa', 'data_criacao', 'autor']
    search_fields = ['materia__nome', 'enunciado', 'autor__user__first_name']
    date_hierarchy = 'data_criacao'
    inlines = [AlternativaInline]

    def get_enunciado_curto(self, obj):
        return obj.enunciado[:60] + '...' if len(obj.enunciado) > 60 else obj.enunciado
    get_enunciado_curto.short_description = 'Enunciado'

    def tem_imagem(self, obj):
        return format_html('<span style="color:#27ae60">Sim</span>') if obj.imagem else '—'
    tem_imagem.short_description = 'Imagem'


# ─── Simulado ────────────────────────────────────────────────────────────────

class SimuladoQuestaoInline(admin.TabularInline):
    model = SimuladoQuestao
    extra = 0
    fields = ['questao', 'valor']
    autocomplete_fields = ['questao']
    verbose_name = 'Questão do Simulado'
    verbose_name_plural = 'Questões do Simulado (com valor por questão)'


@admin.register(Simulado)
class SimuladoAdmin(admin.ModelAdmin):
    list_display = ['get_titulo', 'autor', 'turma_alvo', 'area_conhecimento', 'tempo_limite', 'total_questoes', 'data_criacao']
    list_filter = ['data_criacao', 'autor', 'turma_alvo', 'area_conhecimento']
    search_fields = ['titulo', 'autor__user__first_name', 'turma_alvo__nome']
    date_hierarchy = 'data_criacao'
    inlines = [SimuladoQuestaoInline]

    def get_titulo(self, obj):
        return obj.titulo or f'Simulado de {obj.autor} – {obj.turma_alvo}'
    get_titulo.short_description = 'Título'

    def total_questoes(self, obj):
        return obj.questoes.count()
    total_questoes.short_description = 'Questões'


# ─── Assiduidade ─────────────────────────────────────────────────────────────

class PresencaAlunoInline(admin.TabularInline):
    model = PresencaAluno
    extra = 0
    fields = ['aluno', 'presente']


@admin.register(RegistroAssiduidade)
class RegistroAssiduidadeAdmin(admin.ModelAdmin):
    list_display = ['turma', 'data', 'registrado_por', 'total_presentes', 'total_alunos']
    list_filter = ['turma', 'data']
    date_hierarchy = 'data'
    inlines = [PresencaAlunoInline]

    def total_presentes(self, obj):
        return obj.presencas.filter(presente=True).count()
    total_presentes.short_description = 'Presentes'

    def total_alunos(self, obj):
        return obj.presencas.count()
    total_alunos.short_description = 'Total'


# ─── Administrador ───────────────────────────────────────────────────────────

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


# ─── User ─────────────────────────────────────────────────────────────────────

admin.site.unregister(User)
admin.site.register(User, CustomUserAdmin)

# ─── Site config ─────────────────────────────────────────────────────────────

admin.site.site_header = 'CARA - Administração'
admin.site.site_title = 'CARA Admin'
admin.site.index_title = 'Painel de Administração'

# '/' é relativo: o browser resolve para a raiz do mesmo host/porta (nginx),
# que roteia para o frontend Next.js — sem hardcoded de porta.
admin.site.site_url = '/'
