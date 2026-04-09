from django.db import models
from django.contrib.auth.models import User 
from django.core.validators import MinValueValidator, MaxValueValidator
from datetime import date

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
    
    assiduidade = models.IntegerField(
        default=3,
        validators=[MinValueValidator(1), MaxValueValidator(5)]
    )
    participacao = models.IntegerField(
        default=3,
        validators=[MinValueValidator(1), MaxValueValidator(5)]
    )
    responsabilidade = models.IntegerField(
        default=3,
        validators=[MinValueValidator(1), MaxValueValidator(5)]
    )
    sociabilidade = models.IntegerField(
        default=3,
        validators=[MinValueValidator(1), MaxValueValidator(5)]
    )
    
    data = models.DateField(auto_now_add=True)
    
    class Meta:
        ordering = ['-data']
        verbose_name = 'Avaliação'
        verbose_name_plural = 'Avaliações'
    
    def calcular_media(self):
        return (self.assiduidade + self.participacao + self.responsabilidade + self.sociabilidade) / 4.0

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
                    validators=[MinValueValidator(0), MaxValueValidator(10)])
    epoca     = models.CharField(max_length=2, choices=EPOCAS)
    data      = models.DateField(auto_now_add=True)

    class Meta:
        unique_together = ('aluno', 'materia', 'epoca')
        ordering = ['epoca', 'materia']
        verbose_name = 'Nota por Matéria'
        verbose_name_plural = 'Notas por Matéria'

    def __str__(self):
        return f"{self.aluno} – {self.get_materia_display()} ({self.get_epoca_display()}): {self.nota}"


class Questao(models.Model):
    enunciado = models.TextField()
    resposta = models.TextField()
    materia = models.CharField(max_length=100) 
    autor = models.ForeignKey(Professor, on_delete=models.CASCADE, related_name="questoes_criadas")
    data_criacao = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        ordering = ['-data_criacao']
        verbose_name = 'Questão'
        verbose_name_plural = 'Questões'

    def __str__(self):
        return f"{self.materia} - {self.enunciado[:50]}..."

class Simulado(models.Model):
    questoes = models.ManyToManyField(Questao, related_name="simulados")
    autor = models.ForeignKey(Professor, on_delete=models.CASCADE, related_name="simulados_criados")
    turma_alvo = models.ForeignKey(Turma, on_delete=models.SET_NULL, null=True, related_name="simulados")
    data_criacao = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        ordering = ['-data_criacao']
        verbose_name = 'Simulado'
        verbose_name_plural = 'Simulados'

    def __str__(self):
        return f"Simulado por {self.autor} para {self.turma_alvo}"