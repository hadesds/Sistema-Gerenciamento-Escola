# escola/models.py

from django.db import models
from django.contrib.auth.models import User # <- Usando o Usuario padrão do Django
from datetime import date



class Administrador(models.Model):
    # Cria uma relação 1-para-1 com o Usuário padrão do Django
    user = models.OneToOneField(User, on_delete=models.CASCADE, primary_key=True)
    # Adicione outros campos se precisar

    def __str__(self):
        return self.user.username

class Turma(models.Model):
    nome = models.CharField(max_length=100)
    # A relação com Aluno e Professor será feita nos outros modelos

    def __str__(self):
        return self.nome

class Professor(models.Model):
    user = models.OneToOneField(User, on_delete=models.CASCADE, primary_key=True)
    turmas = models.ManyToManyField(Turma, related_name="professores") # <- Relação Muitos-para-Muitos

    def __str__(self):
        return self.user.get_full_name() or self.user.username

class Aluno(models.Model):
    user = models.OneToOneField(User, on_delete=models.CASCADE, primary_key=True)
    # "upload_to" salva as fotos numa pasta "fotos_alunos/"
    foto = models.ImageField(upload_to='fotos_alunos/', blank=True, null=True) #
    turma = models.ForeignKey(Turma, on_delete=models.SET_NULL, null=True, blank=True, related_name="alunos") #

    def __str__(self):
        return self.user.get_full_name() or self.user.username

class Avaliacao(models.Model):
    #
    aluno = models.ForeignKey(Aluno, on_delete=models.CASCADE, related_name="avaliacoes")
    professor = models.ForeignKey(Professor, on_delete=models.SET_NULL, null=True, related_name="avaliacoes_dadas")
    
    #
    assiduidade = models.IntegerField(default=0)
    participacao = models.IntegerField(default=0)
    responsabilidade = models.IntegerField(default=0)
    sociabilidade = models.IntegerField(default=0)
    
    data = models.DateField(auto_now_add=True) # Equivalente ao LocalDate

    def calcular_media(self):
        return (self.assiduidade + self.participacao + self.responsabilidade + self.sociabilidade) / 4.0

    def __str__(self):
        return f"Avaliação de {self.aluno} por {self.professor} em {self.data}"

class Questao(models.Model):
    #
    enunciado = models.TextField()
    resposta = models.TextField()
    materia = models.CharField(max_length=100) #
    # Usando o 'Professor' que criamos
    autor = models.ForeignKey(Professor, on_delete=models.CASCADE, related_name="questoes_criadas")

    def __str__(self):
        return self.enunciado[:50] + "..."

class Simulado(models.Model):
    #
    questoes = models.ManyToManyField(Questao)
    autor = models.ForeignKey(Professor, on_delete=models.CASCADE, related_name="simulados_criados")
    turma_alvo = models.ForeignKey(Turma, on_delete=models.SET_NULL, null=True, related_name="simulados")

    def __str__(self):
        return f"Simulado por {self.autor} para {self.turma_alvo}"