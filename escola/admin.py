from django.contrib import admin
from django.contrib.auth.admin import UserAdmin
from django.contrib.auth.models import User
from django.utils.html import format_html
from .models import (
    Professor, Aluno, Turma, Avaliacao, Questao, Simulado, SimuladoQuestao,
    Administrador, AlternativaQuestao, Materia, NotaMateria, ProvaIndividual,
    PerfilTurma, RegistroAssiduidade, PresencaAluno,
    ResultadoSimulado, RespostaAluno, NotaArea, NotaQualitativa,
)


# ─── Helpers ─────────────────────────────────────────────────────────────────

def _escala_comportamento(valor_0_5) -> float:
    """Converte nota 0–5 (step 0.5) para pontuação 0–2.5."""
    return round(float(valor_0_5) / 2, 2)


def _nota_color(nota) -> str:
    n = float(nota)
    return '#27ae60' if n >= 7 else ('#e67e22' if n >= 5 else '#e74c3c')


def _nota_html(nota):
    return format_html('<strong style="color:{}">{}</strong>', _nota_color(nota), f'{float(nota):.2f}')


def _turma_de(aluno):
    return aluno.turma.nome if aluno and aluno.turma else '–'


# ═════════════════════════════════════════════════════════════════════════════
# ÁREA DO ALUNO
# ═════════════════════════════════════════════════════════════════════════════

# ─── Inlines usados no cadastro do Aluno (correlaciona tudo) ──────────────────

class AvaliacaoInline(admin.TabularInline):
    model = Avaliacao
    extra = 0
    fields = ['materia', 'data', 'assiduidade', 'participacao', 'responsabilidade', 'sociabilidade', 'observacao']
    readonly_fields = ['data']
    ordering = ['-data']
    verbose_name = 'Avaliação Comportamental'
    verbose_name_plural = 'Avaliações Comportamentais'


class NotaAreaInline(admin.TabularInline):
    model = NotaArea
    extra = 0
    fields = ['epoca', 'av_tipo', 'area', 'nota', 'origem', 'atualizado_em']
    readonly_fields = ['atualizado_em']
    ordering = ['epoca', 'av_tipo', 'area']
    verbose_name = 'Nota por Área (AV1/AV2)'
    verbose_name_plural = 'Notas por Área (AV1/AV2 — geradas pelos simulados)'


class NotaQualitativaInline(admin.TabularInline):
    model = NotaQualitativa
    extra = 0
    fields = ['epoca', 'materia', 'nota', 'professor', 'atualizado_em']
    readonly_fields = ['atualizado_em']
    ordering = ['epoca', 'materia']
    verbose_name = 'Nota Qualitativa (AV3)'
    verbose_name_plural = 'Notas Qualitativas (AV3 — por disciplina)'


class ResultadoSimuladoInline(admin.TabularInline):
    model = ResultadoSimulado
    extra = 0
    fields = ['simulado', 'status', 'nota', 'enviado_em']
    readonly_fields = ['simulado', 'status', 'nota', 'enviado_em']
    ordering = ['-enviado_em']
    show_change_link = True
    can_delete = False
    verbose_name = 'Resultado de Simulado'
    verbose_name_plural = 'Resultados de Simulado (envios do aluno)'

    def has_add_permission(self, request, obj=None):
        return False


class ProvaIndividualInline(admin.TabularInline):
    model = ProvaIndividual
    extra = 0
    fields = ['materia', 'epoca', 'numero', 'nota', 'professor', 'data']
    readonly_fields = ['data']
    ordering = ['materia', 'epoca', 'numero']
    classes = ['collapse']
    verbose_name = 'Prova Individual (legado)'
    verbose_name_plural = 'Provas Individuais (legado)'


@admin.register(Aluno)
class AlunoAdmin(admin.ModelAdmin):
    list_display = ['get_nome_completo', 'matricula', 'turma', 'get_email',
                    'total_avaliacoes', 'total_resultados', 'total_notas_area', 'total_qualitativas']
    list_filter = ['turma']
    search_fields = ['user__username', 'user__first_name', 'user__last_name', 'matricula']
    inlines = [AvaliacaoInline, NotaAreaInline, NotaQualitativaInline,
               ResultadoSimuladoInline, ProvaIndividualInline]

    def get_nome_completo(self, obj):
        return obj.user.get_full_name() or obj.user.username
    get_nome_completo.short_description = 'Nome'

    def get_email(self, obj):
        return obj.user.email
    get_email.short_description = 'Email'

    def total_avaliacoes(self, obj):
        return obj.avaliacoes.count()
    total_avaliacoes.short_description = 'Comportamento'

    def total_resultados(self, obj):
        return obj.resultados_simulado.count()
    total_resultados.short_description = 'Simulados'

    def total_notas_area(self, obj):
        return obj.notas_area.count()
    total_notas_area.short_description = 'Notas AV1/AV2'

    def total_qualitativas(self, obj):
        return obj.notas_qualitativas.count()
    total_qualitativas.short_description = 'Notas AV3'


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
    readonly_fields = ['data', 'get_media_comportamento', 'get_media_raw']
    fieldsets = [
        ('Identificação', {'fields': ['aluno', 'professor', 'materia', 'data']}),
        ('Comportamento (0 a 5, step 0.5 → exibido como 0–2.5 pts)', {
            'description': 'Cada critério aceita valores de 0 a 5 em passos de 0.5. A pontuação exibida é valor ÷ 2 (escala 0–2.5 pts).',
            'fields': ['assiduidade', 'participacao', 'responsabilidade', 'sociabilidade',
                       'get_media_comportamento'],
        }),
        ('Observação', {'fields': ['observacao']}),
    ]

    def get_turma(self, obj):
        return _turma_de(obj.aluno)
    get_turma.short_description = 'Turma'

    def _fmt(self, val):
        pts = _escala_comportamento(val)
        color = '#27ae60' if pts >= 1.875 else ('#e67e22' if pts >= 1.25 else '#e74c3c')
        return format_html('<span style="font-weight:600;color:{}">{}</span>', color, f'{pts:.1f}')

    def get_assid(self, obj):
        return self._fmt(obj.assiduidade)
    get_assid.short_description = 'Assid. (0-2.5)'

    def get_part(self, obj):
        return self._fmt(obj.participacao)
    get_part.short_description = 'Part. (0-2.5)'

    def get_resp(self, obj):
        return self._fmt(obj.responsabilidade)
    get_resp.short_description = 'Resp. (0-2.5)'

    def get_soc(self, obj):
        return self._fmt(obj.sociabilidade)
    get_soc.short_description = 'Soc. (0-2.5)'

    def get_media_comportamento(self, obj):
        pts = _escala_comportamento(obj.calcular_media())
        color = '#27ae60' if pts >= 1.875 else ('#e67e22' if pts >= 1.25 else '#e74c3c')
        return format_html('<strong style="font-size:1.1em;color:{}">{} / 2.5 pts</strong>', color, f'{pts:.2f}')
    get_media_comportamento.short_description = 'Média Comportamental'

    def get_media_raw(self, obj):
        return round(obj.calcular_media(), 2)
    get_media_raw.short_description = 'Média (1-5)'


# ─── Notas por Área (AV1/AV2 — novo sistema) ─────────────────────────────────

@admin.register(NotaArea)
class NotaAreaAdmin(admin.ModelAdmin):
    list_display = ['aluno', 'get_turma', 'epoca', 'av_tipo', 'area', 'get_nota', 'origem', 'get_resultado', 'atualizado_em']
    list_filter = ['epoca', 'av_tipo', 'area', 'origem', 'aluno__turma']
    search_fields = ['aluno__user__first_name', 'aluno__user__last_name']
    readonly_fields = ['atualizado_em']
    ordering = ['aluno', 'epoca', 'av_tipo', 'area']

    def get_turma(self, obj):
        return _turma_de(obj.aluno)
    get_turma.short_description = 'Turma'

    def get_nota(self, obj):
        return _nota_html(obj.nota)
    get_nota.short_description = 'Nota'
    get_nota.admin_order_field = 'nota'

    def get_resultado(self, obj):
        return f'#{obj.resultado_id}' if obj.resultado_id else '–'
    get_resultado.short_description = 'Simulado origem'


# ─── Notas Qualitativas (AV3 — novo sistema) ─────────────────────────────────

@admin.register(NotaQualitativa)
class NotaQualitativaAdmin(admin.ModelAdmin):
    list_display = ['aluno', 'get_turma', 'epoca', 'materia', 'get_nota', 'professor', 'atualizado_em']
    list_filter = ['epoca', 'materia', 'aluno__turma', 'professor']
    search_fields = ['aluno__user__first_name', 'aluno__user__last_name', 'materia__nome']
    readonly_fields = ['atualizado_em']
    ordering = ['aluno', 'epoca', 'materia']

    def get_turma(self, obj):
        return _turma_de(obj.aluno)
    get_turma.short_description = 'Turma'

    def get_nota(self, obj):
        return _nota_html(obj.nota)
    get_nota.short_description = 'Nota'
    get_nota.admin_order_field = 'nota'


# ─── Resultado de Simulado (envios dos alunos) ───────────────────────────────

class RespostaAlunoInline(admin.TabularInline):
    model = RespostaAluno
    extra = 0
    fields = ['questao', 'get_tipo', 'alternativa', 'texto', 'correta', 'pontos']
    readonly_fields = ['questao', 'get_tipo', 'alternativa', 'texto', 'correta']
    can_delete = False
    verbose_name = 'Resposta'
    verbose_name_plural = 'Respostas do aluno (pontos das discursivas são editáveis)'

    def has_add_permission(self, request, obj=None):
        return False

    def get_tipo(self, obj):
        return obj.questao.get_tipo_display() if obj.questao else '–'
    get_tipo.short_description = 'Tipo'


@admin.register(ResultadoSimulado)
class ResultadoSimuladoAdmin(admin.ModelAdmin):
    list_display = ['aluno', 'get_turma', 'simulado', 'get_av', 'get_area', 'get_epoca',
                    'get_status', 'get_nota', 'get_pendentes', 'enviado_em']
    list_filter = ['status', 'simulado__av_tipo', 'simulado__area', 'simulado__epoca',
                   'aluno__turma', 'simulado']
    search_fields = ['aluno__user__first_name', 'aluno__user__last_name', 'simulado__titulo']
    date_hierarchy = 'enviado_em'
    readonly_fields = ['iniciado_em', 'enviado_em']
    inlines = [RespostaAlunoInline]
    ordering = ['-enviado_em']

    def get_turma(self, obj):
        return _turma_de(obj.aluno)
    get_turma.short_description = 'Turma'

    def get_av(self, obj):
        return obj.simulado.av_tipo or '–'
    get_av.short_description = 'AV'

    def get_area(self, obj):
        return obj.simulado.area or '–'
    get_area.short_description = 'Área'

    def get_epoca(self, obj):
        return obj.simulado.epoca or '–'
    get_epoca.short_description = 'Bim.'

    def get_status(self, obj):
        cor = {'corrigido': '#27ae60', 'pendente_correcao': '#e67e22'}.get(obj.status, '#888')
        return format_html('<span style="font-weight:600;color:{}">{}</span>', cor, obj.get_status_display())
    get_status.short_description = 'Status'
    get_status.admin_order_field = 'status'

    def get_nota(self, obj):
        return _nota_html(obj.nota) if obj.nota is not None else '–'
    get_nota.short_description = 'Nota'
    get_nota.admin_order_field = 'nota'

    def get_pendentes(self, obj):
        n = obj.respostas.filter(pontos__isnull=True).exclude(questao__tipo='objetiva').count()
        if n:
            return format_html('<span style="color:#e67e22;font-weight:600">{} a corrigir</span>', n)
        return '—'
    get_pendentes.short_description = 'Discursivas'


# ═════════════════════════════════════════════════════════════════════════════
# ÁREA DO PROFESSOR
# ═════════════════════════════════════════════════════════════════════════════

@admin.register(Professor)
class ProfessorAdmin(admin.ModelAdmin):
    list_display = ['get_nome_completo', 'get_email', 'total_turmas', 'total_simulados', 'total_questoes']
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
    total_turmas.short_description = 'Turmas'

    def total_simulados(self, obj):
        return obj.simulados_criados.count()
    total_simulados.short_description = 'Simulados'

    def total_questoes(self, obj):
        return obj.questoes_criadas.count()
    total_questoes.short_description = 'Questões'


@admin.register(Turma)
class TurmaAdmin(admin.ModelAdmin):
    list_display = ['nome', 'serie', 'turno', 'sala', 'total_alunos', 'total_professores']
    list_filter = ['turno', 'serie']
    search_fields = ['nome', 'serie']

    def total_alunos(self, obj):
        return obj.alunos.count()
    total_alunos.short_description = 'Alunos'

    def total_professores(self, obj):
        return obj.professores.count()
    total_professores.short_description = 'Professores'


@admin.register(Materia)
class MateriaAdmin(admin.ModelAdmin):
    list_display = ['nome', 'sigla', 'total_questoes', 'total_avaliacoes', 'total_qualitativas']
    search_fields = ['nome', 'sigla']

    def total_questoes(self, obj):
        return obj.questoes.count()
    total_questoes.short_description = 'Questões'

    def total_avaliacoes(self, obj):
        return obj.avaliacoes.count()
    total_avaliacoes.short_description = 'Avaliações'

    def total_qualitativas(self, obj):
        return obj.notas_qualitativas.count()
    total_qualitativas.short_description = 'Notas AV3'


class AlternativaInline(admin.TabularInline):
    model = AlternativaQuestao
    extra = 2
    fields = ['ordem', 'texto', 'imagem', 'correta']


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


class SimuladoQuestaoInline(admin.TabularInline):
    model = SimuladoQuestao
    extra = 0
    fields = ['questao', 'valor']
    autocomplete_fields = ['questao']
    verbose_name = 'Questão do Simulado'
    verbose_name_plural = 'Questões do Simulado (com valor por questão)'


@admin.register(Simulado)
class SimuladoAdmin(admin.ModelAdmin):
    list_display = ['get_titulo', 'autor', 'turma_alvo', 'get_av', 'area', 'epoca',
                    'tempo_limite', 'total_questoes', 'total_resultados', 'data_criacao']
    list_filter = ['av_tipo', 'area', 'epoca', 'turma_alvo', 'autor', 'data_criacao']
    search_fields = ['titulo', 'autor__user__first_name', 'turma_alvo__nome']
    date_hierarchy = 'data_criacao'
    inlines = [SimuladoQuestaoInline]
    fieldsets = [
        ('Identificação', {'fields': ['titulo', 'autor', 'turma_alvo', 'data_criacao']}),
        ('Avaliação (novo sistema de notas)', {
            'description': 'AV1/AV2 geram nota automática por área; AV3 é qualitativa. Área e Bimestre definem onde a nota é lançada.',
            'fields': ['av_tipo', 'area', 'epoca'],
        }),
        ('Configuração', {'fields': ['tempo_limite', 'area_conhecimento']}),
    ]
    readonly_fields = ['data_criacao']

    def get_titulo(self, obj):
        return obj.titulo or f'Simulado de {obj.autor} – {obj.turma_alvo}'
    get_titulo.short_description = 'Título'

    def get_av(self, obj):
        return obj.av_tipo or '–'
    get_av.short_description = 'AV'

    def total_questoes(self, obj):
        return obj.questoes.count()
    total_questoes.short_description = 'Questões'

    def total_resultados(self, obj):
        return obj.resultados.count()
    total_resultados.short_description = 'Envios'


# ═════════════════════════════════════════════════════════════════════════════
# ÁREA DO ALUNO — Perfis, Assiduidade e legado
# ═════════════════════════════════════════════════════════════════════════════

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


@admin.register(NotaMateria)
class NotaMateriaAdmin(admin.ModelAdmin):
    list_display = ['aluno', 'get_turma', 'get_materia', 'get_epoca', 'get_nota_colorida', 'professor', 'data']
    list_filter = ['materia', 'epoca', 'aluno__turma', 'professor']
    search_fields = ['aluno__user__first_name', 'aluno__user__last_name', 'professor__user__first_name']
    date_hierarchy = 'data'
    ordering = ['aluno', 'materia', 'epoca']

    def get_turma(self, obj):
        return _turma_de(obj.aluno)
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
        return _nota_html(obj.nota)
    get_nota_colorida.short_description = 'Nota'
    get_nota_colorida.admin_order_field = 'nota'


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
        return _turma_de(obj.aluno)
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
        return _nota_html(obj.nota)
    get_nota_colorida.short_description = 'Nota'
    get_nota_colorida.admin_order_field = 'nota'


# ═════════════════════════════════════════════════════════════════════════════
# ADMINISTRAÇÃO
# ═════════════════════════════════════════════════════════════════════════════

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


# ─── User (com inline de Professor/Aluno conforme o vínculo) ─────────────────

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


admin.site.unregister(User)
admin.site.register(User, CustomUserAdmin)


# ═════════════════════════════════════════════════════════════════════════════
# Seccionamento do painel: Área do Aluno / Professor / Administração
# ═════════════════════════════════════════════════════════════════════════════

# Ordem das seções e dos models dentro de cada uma (por object_name do model).
_SECOES = [
    ('area-aluno', '👨‍🎓 Área do Aluno', [
        'Aluno', 'Avaliacao', 'ResultadoSimulado', 'NotaArea', 'NotaQualitativa',
        'PerfilTurma', 'RegistroAssiduidade', 'NotaMateria', 'ProvaIndividual',
    ]),
    ('area-professor', '👩‍🏫 Área do Professor', [
        'Professor', 'Turma', 'Materia', 'Questao', 'Simulado',
    ]),
    ('area-admin', '🛠️ Administração', [
        'Administrador', 'User', 'Group',
    ]),
]

_admin_original_get_app_list = admin.site.get_app_list


def _get_app_list_seccionado(request, app_label=None):
    # Página de índice de um app específico: mantém o comportamento padrão.
    if app_label:
        return _admin_original_get_app_list(request, app_label)

    app_dict = admin.site._build_app_dict(request)
    models_por_nome = {}
    for app in app_dict.values():
        for m in app['models']:
            models_por_nome[m['object_name']] = m

    secoes = []
    colocados = set()
    for chave, titulo, nomes in _SECOES:
        modelos = [models_por_nome[n] for n in nomes if n in models_por_nome]
        colocados.update(nomes)
        if modelos:
            secoes.append({
                'name': titulo,
                'app_label': chave,
                'app_url': '',
                'has_module_perms': True,
                'models': modelos,
            })

    # Qualquer model registrado fora das seções acima entra em "Outros".
    restantes = [m for nome, m in models_por_nome.items() if nome not in colocados]
    if restantes:
        secoes.append({
            'name': '📦 Outros',
            'app_label': 'outros',
            'app_url': '',
            'has_module_perms': True,
            'models': sorted(restantes, key=lambda m: m['name']),
        })
    return secoes


admin.site.get_app_list = _get_app_list_seccionado


# ─── Identidade do site ───────────────────────────────────────────────────────

admin.site.site_header = 'CARA - Administração'
admin.site.site_title = 'CARA Admin'
admin.site.index_title = 'Painel de Administração'
admin.site.site_url = '/'
