from django.db import models
from django.contrib.auth.models import User
from django.core.validators import MinValueValidator, MaxValueValidator

class Turma(models.Model):
    TURNOS = [
        ('M', 'Manhã'),
        ('T', 'Tarde'),
        ('N', 'Noite'),
    ]
    
    nome = models.CharField(max_length=100)
    serie = models.CharField(max_length=50, default=6)
    turno = models.CharField(max_length=1, choices=TURNOS, default='M')
    sala = models.CharField(max_length=20, blank=True)
    
    def __str__(self):
        return f"{self.nome} - {self.get_turno_display()}"

class Professor(models.Model):
    user = models.OneToOneField(User, on_delete=models.CASCADE)
    turmas = models.ManyToManyField(Turma, related_name='professores')
    
    def __str__(self):
        return self.user.get_full_name() or self.user.username

class Aluno(models.Model):
    user = models.OneToOneField(User, on_delete=models.CASCADE)
    turma = models.ForeignKey(Turma, on_delete=models.CASCADE, related_name='alunos')
    matricula = models.CharField(max_length=20, unique=True, null=True)
    foto = models.ImageField(upload_to='alunos/', null=True, blank=True)
    
    def __str__(self):
        return self.user.get_full_name() or self.user.username

class Avaliacao(models.Model):
    aluno = models.ForeignKey(Aluno, on_delete=models.CASCADE, related_name='avaliacoes')
    professor = models.ForeignKey(Professor, on_delete=models.CASCADE)
    data = models.DateTimeField(auto_now_add=True)
    
    assiduidade = models.IntegerField(
        validators=[MinValueValidator(1), MaxValueValidator(5)]
    )
    participacao = models.IntegerField(
        validators=[MinValueValidator(1), MaxValueValidator(5)]
    )
    responsabilidade = models.IntegerField(
        validators=[MinValueValidator(1), MaxValueValidator(5)]
    )
    sociabilidade = models.IntegerField(
        validators=[MinValueValidator(1), MaxValueValidator(5)]
    )
    
    class Meta:
        unique_together = ['aluno', 'professor', 'data']
    
    def calcular_media(self):
        return (self.assiduidade + self.participacao + 
                self.responsabilidade + self.sociabilidade) / 4
    
    def __str__(self):
        return f"Avaliação de {self.aluno} por {self.professor}"

class Questao(models.Model):
    autor = models.ForeignKey(Professor, on_delete=models.CASCADE, related_name='questoes')
    materia = models.CharField(max_length=100)
    enunciado = models.TextField()
    resposta = models.TextField()
    data_criacao = models.DateTimeField(default=1-1-2025)
    
    def __str__(self):
        return f"{self.materia} - {self.autor}"
