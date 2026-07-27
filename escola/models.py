from django.db import models
from django.contrib.auth.models import User
from django.core.validators import MinValueValidator, MaxValueValidator
from datetime import date
from decimal import Decimal

from .grade_config import AV_TIPOS, AREA_CHOICES, EPOCAS as GRADE_EPOCAS

class Administrador(models.Model):
    user = models.OneToOneField(User, on_delete=models.CASCADE, primary_key=True)

    def __str__(self):
        return self.user.username

class Turma(models.Model):
    TURNOS = [
        ('M', 'Manhã'),
        ('T', 'Tarde'),
        ('N', 'Noite'),
    ]
    
    nome = models.CharField(max_length=100)
    serie = models.CharField(max_length=50, default='', blank=True)
    turno = models.CharField(max_length=1, choices=TURNOS, default='M', blank=True)
    sala = models.CharField(max_length=20, blank=True)
   
    def __str__(self):
        return self.nome

class Professor(models.Model):
    user = models.OneToOneField(User, on_delete=models.CASCADE, primary_key=True)
    turmas = models.ManyToManyField(Turma, related_name="professores", blank=True) 
    
    def __str__(self):
        return self.user.get_full_name() or self.user.username

class Aluno(models.Model):
    user = models.OneToOneField(User, on_delete=models.CASCADE, primary_key=True)
    foto = models.ImageField(upload_to='fotos_alunos/', blank=True, null=True)
    turma = models.ForeignKey(Turma, on_delete=models.SET_NULL, null=True, blank=True, related_name="alunos")
    matricula = models.CharField(max_length=20, unique=True, null=True, blank=True)

    def __str__(self):
        return self.user.get_full_name() or self.user.username

class Avaliacao(models.Model):
    aluno = models.ForeignKey(Aluno, on_delete=models.CASCADE, related_name="avaliacoes")
    professor = models.ForeignKey(Professor, on_delete=models.SET_NULL, null=True, related_name="avaliacoes_dadas")
    
    assiduidade = models.DecimalField(
        max_digits=3, decimal_places=1, default=3.0,
        validators=[MinValueValidator(Decimal('0')), MaxValueValidator(Decimal('5'))]
    )
    participacao = models.DecimalField(
        max_digits=3, decimal_places=1, default=3.0,
        validators=[MinValueValidator(Decimal('0')), MaxValueValidator(Decimal('5'))]
    )
    responsabilidade = models.DecimalField(
        max_digits=3, decimal_places=1, default=3.0,
        validators=[MinValueValidator(Decimal('0')), MaxValueValidator(Decimal('5'))]
    )
    sociabilidade = models.DecimalField(
        max_digits=3, decimal_places=1, default=3.0,
        validators=[MinValueValidator(Decimal('0')), MaxValueValidator(Decimal('5'))]
    )

    materia    = models.ForeignKey('Materia', on_delete=models.SET_NULL, null=True, blank=True, related_name='avaliacoes')
    observacao = models.TextField(blank=True, default='')

    data = models.DateField(auto_now_add=True)
    
    class Meta:
        ordering = ['-data']
        verbose_name = 'Avaliação'
        verbose_name_plural = 'Avaliações'
    
    def calcular_media(self):
        return (self.assiduidade + self.participacao + self.responsabilidade + self.sociabilidade) / 4

    def __str__(self):
        return f"Avaliação de {self.aluno} por {self.professor} em {self.data}"

class NotaMateria(models.Model):
    MATERIAS = [
        ('portugues',       'Português'),
        ('matematica',      'Matemática'),
        ('ciencias',        'Ciências'),
        ('religiao',        'Religião'),
        ('geografia',       'Geografia'),
        ('historia',        'História'),
        ('artes',           'Artes'),
        ('ingles',          'Inglês'),
        ('educacao_fisica', 'Educação Física'),
        ('filosofia',       'Filosofia'),
    ]

    EPOCAS = [
        ('1B', '1° Bimestre'),
        ('2B', '2° Bimestre'),
        ('3B', '3° Bimestre'),
        ('4B', '4° Bimestre'),
    ]

    aluno     = models.ForeignKey(Aluno,     on_delete=models.CASCADE,    related_name='notas_materias')
    professor = models.ForeignKey(Professor, on_delete=models.SET_NULL, null=True, related_name='notas_dadas')
    materia   = models.CharField(max_length=20, choices=MATERIAS)
    nota      = models.DecimalField(max_digits=4, decimal_places=2,
                    validators=[MinValueValidator(Decimal('0')), MaxValueValidator(Decimal('10'))])
    epoca     = models.CharField(max_length=2, choices=EPOCAS)
    data      = models.DateField(auto_now_add=True)

    class Meta:
        unique_together = ('aluno', 'materia', 'epoca')
        ordering = ['epoca', 'materia']
        verbose_name = 'Nota por Matéria'
        verbose_name_plural = 'Notas por Matéria'

    def __str__(self):
        return f"{self.aluno} – {self.get_materia_display()} ({self.get_epoca_display()}): {self.nota}"


class PerfilTurma(models.Model):
    PAPEL_CHOICES = [
        ('lider', 'Líder'),
        ('vice',  'Vice-Líder'),
    ]
    aluno  = models.OneToOneField(Aluno, on_delete=models.CASCADE, related_name='perfil_turma')
    turma  = models.ForeignKey(Turma,   on_delete=models.CASCADE, related_name='perfis')
    papel  = models.CharField(max_length=10, choices=PAPEL_CHOICES)

    class Meta:
        unique_together = ('turma', 'papel')
        verbose_name = 'Perfil de Turma'
        verbose_name_plural = 'Perfis de Turma'

    def __str__(self):
        return f"{self.get_papel_display()} da {self.turma} — {self.aluno}"


class RegistroAssiduidade(models.Model):
    turma          = models.ForeignKey(Turma,  on_delete=models.CASCADE, related_name='registros_assiduidade')
    registrado_por = models.ForeignKey(Aluno,  on_delete=models.CASCADE, related_name='registros_feitos')
    data           = models.DateField(auto_now_add=True)
    observacao     = models.TextField(blank=True)

    class Meta:
        ordering = ['-data']
        verbose_name = 'Registro de Assiduidade'
        verbose_name_plural = 'Registros de Assiduidade'

    def __str__(self):
        return f"Assiduidade {self.turma} em {self.data}"


class PresencaAluno(models.Model):
    registro = models.ForeignKey(RegistroAssiduidade, on_delete=models.CASCADE, related_name='presencas')
    aluno    = models.ForeignKey(Aluno,               on_delete=models.CASCADE, related_name='presencas')
    presente = models.BooleanField(default=True)

    class Meta:
        unique_together = ('registro', 'aluno')
        verbose_name = 'Presença'
        verbose_name_plural = 'Presenças'

    def __str__(self):
        return f"{self.aluno} — {'Presente' if self.presente else 'Ausente'} em {self.registro.data}"


class Materia(models.Model):
    nome  = models.CharField(max_length=100)
    sigla = models.CharField(max_length=3, unique=True)

    class Meta:
        ordering = ['nome']
        verbose_name = 'Matéria'
        verbose_name_plural = 'Matérias'

    def __str__(self):
        return f"{self.nome} ({self.sigla})"


class ProvaIndividual(models.Model):
    EPOCAS = [
        ('1B', '1° Bimestre'),
        ('2B', '2° Bimestre'),
        ('3B', '3° Bimestre'),
        ('4B', '4° Bimestre'),
    ]
    aluno     = models.ForeignKey(Aluno,     on_delete=models.CASCADE,  related_name='provas_individuais')
    professor = models.ForeignKey(Professor, on_delete=models.SET_NULL, null=True, related_name='provas_aplicadas')
    materia   = models.ForeignKey('Materia', on_delete=models.CASCADE,  related_name='provas_individuais')
    epoca     = models.CharField(max_length=2, choices=EPOCAS)
    numero    = models.PositiveSmallIntegerField()
    nota      = models.DecimalField(max_digits=4, decimal_places=2,
                    validators=[MinValueValidator(Decimal('0')), MaxValueValidator(Decimal('10'))])
    data      = models.DateField(auto_now_add=True)

    class Meta:
        unique_together = ('aluno', 'materia', 'epoca', 'numero')
        ordering = ['epoca', 'numero']
        verbose_name = 'Prova Individual'
        verbose_name_plural = 'Provas Individuais'

    def __str__(self):
        return f"{self.aluno} – {self.materia} ({self.epoca}) Prova {self.numero}: {self.nota}"


class Questao(models.Model):
    DIFICULDADE_CHOICES = [
        ('facil',   'Fácil'),
        ('medio',   'Médio'),
        ('dificil', 'Difícil'),
    ]
    TIPO_CHOICES = [
        ('discursiva', 'Discursiva'),
        ('objetiva',   'Objetiva'),
    ]
    enunciado           = models.TextField()
    resposta            = models.TextField(blank=True, default='')
    imagem              = models.ImageField(upload_to='questoes_imagens/', blank=True, null=True)
    materia             = models.ForeignKey(
        'Materia', on_delete=models.SET_NULL,
        null=True, blank=True, related_name='questoes'
    )
    autor               = models.ForeignKey(Professor, on_delete=models.CASCADE, related_name="questoes_criadas")
    dificuldade         = models.CharField(max_length=10, choices=DIFICULDADE_CHOICES, default='medio')
    tipo                = models.CharField(max_length=12, choices=TIPO_CHOICES, default='discursiva')
    exige_justificativa = models.BooleanField(default=False)
    data_criacao        = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-data_criacao']
        verbose_name = 'Questão'
        verbose_name_plural = 'Questões'

    def __str__(self):
        return f"{self.materia.nome if self.materia else 'Sem matéria'} - {self.enunciado[:50]}..."


class AlternativaQuestao(models.Model):
    questao = models.ForeignKey(Questao, on_delete=models.CASCADE, related_name='alternativas')
    texto   = models.CharField(max_length=500, blank=True, default='')
    imagem  = models.ImageField(upload_to='alternativas_imagens/', blank=True, null=True)
    correta = models.BooleanField(default=False)
    ordem   = models.PositiveSmallIntegerField(default=0)

    class Meta:
        ordering = ['ordem']
        verbose_name = 'Alternativa'
        verbose_name_plural = 'Alternativas'

    def __str__(self):
        return f"{'✓' if self.correta else '○'} {self.texto[:60]}"

class SimuladoQuestao(models.Model):
    """Tabela intermediária — permite guardar o valor de cada questão dentro do simulado."""
    simulado = models.ForeignKey('Simulado', on_delete=models.CASCADE, related_name='simulado_questoes')
    questao  = models.ForeignKey(Questao,   on_delete=models.CASCADE, related_name='simulado_questoes')
    valor    = models.DecimalField(max_digits=5, decimal_places=2, default=1.00)

    class Meta:
        unique_together = ('simulado', 'questao')
        verbose_name = 'Questão do Simulado'
        verbose_name_plural = 'Questões do Simulado'

    def __str__(self):
        return f"Simulado {self.simulado_id} → Q{self.questao_id} ({self.valor}pts)"


class Simulado(models.Model):
    questoes          = models.ManyToManyField(Questao, through='SimuladoQuestao', related_name='simulados')
    autor             = models.ForeignKey(Professor, on_delete=models.CASCADE, related_name='simulados_criados')
    turma_alvo        = models.ForeignKey(Turma, on_delete=models.SET_NULL, null=True, related_name='simulados')
    data_criacao      = models.DateTimeField(auto_now_add=True)
    titulo            = models.CharField(max_length=200, blank=True, default='')
    tempo_limite      = models.PositiveIntegerField(null=True, blank=True, help_text='Tempo limite em minutos')
    area_conhecimento = models.CharField(max_length=100, blank=True, default='')

    # Novo sistema de notas
    av_tipo = models.CharField(max_length=3, choices=AV_TIPOS, blank=True, default='')
    area    = models.CharField(max_length=4, choices=AREA_CHOICES, blank=True, default='')
    epoca   = models.CharField(max_length=2, choices=GRADE_EPOCAS, blank=True, default='')

    class Meta:
        ordering = ['-data_criacao']
        verbose_name = 'Simulado'
        verbose_name_plural = 'Simulados'

    def __str__(self):
        return f"Simulado por {self.autor} para {self.turma_alvo}"


class ResultadoSimulado(models.Model):
    """Submissão de um aluno a um simulado (uma por aluno/simulado)."""
    STATUS = [
        ('pendente_correcao', 'Pendente de correção'),
        ('corrigido',         'Corrigido'),
    ]
    simulado    = models.ForeignKey(Simulado, on_delete=models.CASCADE, related_name='resultados')
    aluno       = models.ForeignKey(Aluno,    on_delete=models.CASCADE, related_name='resultados_simulado')
    iniciado_em = models.DateTimeField(auto_now_add=True)
    enviado_em  = models.DateTimeField(null=True, blank=True)
    nota        = models.DecimalField(max_digits=4, decimal_places=2, null=True, blank=True,
                      validators=[MinValueValidator(Decimal('0')), MaxValueValidator(Decimal('10'))])
    status      = models.CharField(max_length=20, choices=STATUS, default='pendente_correcao')
    cancelado   = models.BooleanField(default=False)

    class Meta:
        unique_together = ('simulado', 'aluno')
        ordering = ['-iniciado_em']
        verbose_name = 'Resultado de Simulado'
        verbose_name_plural = 'Resultados de Simulado'

    def __str__(self):
        return f"{self.aluno} → Simulado {self.simulado_id}: {self.nota if self.nota is not None else '—'}"


class RespostaAluno(models.Model):
    """Resposta de um aluno a uma questão dentro de um resultado."""
    resultado   = models.ForeignKey(ResultadoSimulado, on_delete=models.CASCADE, related_name='respostas')
    questao     = models.ForeignKey(Questao, on_delete=models.CASCADE, related_name='respostas_aluno')
    alternativa = models.ForeignKey(AlternativaQuestao, on_delete=models.SET_NULL, null=True, blank=True,
                      related_name='respostas')
    texto       = models.TextField(blank=True, default='')
    correta     = models.BooleanField(null=True, blank=True)
    pontos      = models.DecimalField(max_digits=5, decimal_places=2, null=True, blank=True)

    class Meta:
        unique_together = ('resultado', 'questao')
        verbose_name = 'Resposta do Aluno'
        verbose_name_plural = 'Respostas do Aluno'

    def __str__(self):
        return f"Resultado {self.resultado_id} → Q{self.questao_id}"


class NotaArea(models.Model):
    """Nota consolidada por (aluno, bimestre, AV, área) — AV1 e AV2."""
    ORIGEM = [
        ('auto',   'Automática'),
        ('manual', 'Manual'),
    ]
    aluno        = models.ForeignKey(Aluno, on_delete=models.CASCADE, related_name='notas_area')
    epoca        = models.CharField(max_length=2, choices=GRADE_EPOCAS)
    av_tipo      = models.CharField(max_length=3, choices=AV_TIPOS)
    area         = models.CharField(max_length=4, choices=AREA_CHOICES)
    nota         = models.DecimalField(max_digits=4, decimal_places=2,
                       validators=[MinValueValidator(Decimal('0')), MaxValueValidator(Decimal('10'))])
    origem       = models.CharField(max_length=6, choices=ORIGEM, default='auto')
    resultado    = models.ForeignKey(ResultadoSimulado, on_delete=models.SET_NULL, null=True, blank=True,
                       related_name='notas_geradas')
    atualizado_em = models.DateTimeField(auto_now=True)

    class Meta:
        unique_together = ('aluno', 'epoca', 'av_tipo', 'area')
        ordering = ['epoca', 'av_tipo', 'area']
        verbose_name = 'Nota por Área'
        verbose_name_plural = 'Notas por Área'

    def __str__(self):
        return f"{self.aluno} {self.epoca} {self.av_tipo}/{self.area}: {self.nota}"


class NotaQualitativa(models.Model):
    """Nota qualitativa (AV3) por disciplina, lançada pelo professor."""
    aluno     = models.ForeignKey(Aluno, on_delete=models.CASCADE, related_name='notas_qualitativas')
    epoca     = models.CharField(max_length=2, choices=GRADE_EPOCAS)
    materia   = models.ForeignKey('Materia', on_delete=models.CASCADE, related_name='notas_qualitativas')
    nota      = models.DecimalField(max_digits=4, decimal_places=2,
                    validators=[MinValueValidator(Decimal('0')), MaxValueValidator(Decimal('10'))])
    professor = models.ForeignKey(Professor, on_delete=models.SET_NULL, null=True, related_name='notas_qualitativas_dadas')
    atualizado_em = models.DateTimeField(auto_now=True)

    class Meta:
        unique_together = ('aluno', 'epoca', 'materia')
        ordering = ['epoca', 'materia']
        verbose_name = 'Nota Qualitativa'
        verbose_name_plural = 'Notas Qualitativas'

    def __str__(self):
        return f"{self.aluno} {self.epoca} {self.materia} (qualitativa): {self.nota}"