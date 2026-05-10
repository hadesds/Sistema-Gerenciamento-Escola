from rest_framework import serializers
from django.contrib.auth.models import User
from .models import Turma, Professor, Aluno, Avaliacao, Questao, Simulado, NotaMateria, PerfilTurma, AlternativaQuestao, Materia


class TurmaSerializer(serializers.ModelSerializer):
    turno_display = serializers.CharField(source='get_turno_display', read_only=True)

    class Meta:
        model = Turma
        fields = ['id', 'nome', 'serie', 'turno', 'turno_display', 'sala']


class UserBasicSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ['id', 'username', 'first_name', 'last_name', 'email']


class AlunoBasicSerializer(serializers.ModelSerializer):
    user = UserBasicSerializer(read_only=True)
    nome_completo = serializers.SerializerMethodField()
    foto_url = serializers.SerializerMethodField()

    class Meta:
        model = Aluno
        fields = ['user', 'matricula', 'turma', 'foto_url', 'nome_completo']

    def get_nome_completo(self, obj):
        return obj.user.get_full_name() or obj.user.username

    def get_foto_url(self, obj):
        request = self.context.get('request')
        if obj.foto and request:
            return request.build_absolute_uri(obj.foto.url)
        return None


class AvaliacaoSerializer(serializers.ModelSerializer):
    aluno_nome = serializers.SerializerMethodField()
    aluno_turma = serializers.SerializerMethodField()
    aluno_foto_url = serializers.SerializerMethodField()
    media = serializers.SerializerMethodField()
    materia_nome = serializers.SerializerMethodField()

    class Meta:
        model = Avaliacao
        fields = [
            'id', 'aluno', 'aluno_nome', 'aluno_turma', 'aluno_foto_url',
            'assiduidade', 'participacao', 'responsabilidade', 'sociabilidade',
            'data', 'media', 'materia_nome', 'observacao'
        ]

    def get_aluno_nome(self, obj):
        return obj.aluno.user.get_full_name() or obj.aluno.user.username

    def get_aluno_turma(self, obj):
        return obj.aluno.turma.nome if obj.aluno.turma else ''

    def get_aluno_foto_url(self, obj):
        request = self.context.get('request')
        if obj.aluno.foto and request:
            return request.build_absolute_uri(obj.aluno.foto.url)
        return None

    def get_media(self, obj):
        return round(obj.calcular_media(), 2)

    def get_materia_nome(self, obj):
        return obj.materia.nome if obj.materia else ''


class MateriaSerializer(serializers.ModelSerializer):
    class Meta:
        model = Materia
        fields = ['id', 'nome', 'sigla']


class AlternativaSerializer(serializers.ModelSerializer):
    class Meta:
        model = AlternativaQuestao
        fields = ['id', 'texto', 'correta', 'ordem']


class QuestaoSerializer(serializers.ModelSerializer):
    dificuldade_display = serializers.CharField(source='get_dificuldade_display', read_only=True)
    tipo_display        = serializers.CharField(source='get_tipo_display', read_only=True)
    alternativas        = AlternativaSerializer(many=True, read_only=True)
    materia_nome        = serializers.SerializerMethodField()
    materia_sigla       = serializers.SerializerMethodField()

    class Meta:
        model = Questao
        fields = [
            'id', 'enunciado', 'resposta', 'materia',
            'materia_nome', 'materia_sigla',
            'dificuldade', 'dificuldade_display',
            'tipo', 'tipo_display',
            'exige_justificativa',
            'alternativas',
            'data_criacao',
        ]

    def get_materia_nome(self, obj):
        return obj.materia.nome if obj.materia else ''

    def get_materia_sigla(self, obj):
        return obj.materia.sigla if obj.materia else ''


class SimuladoSerializer(serializers.ModelSerializer):
    turma_nome = serializers.SerializerMethodField()
    autor_nome = serializers.SerializerMethodField()
    total_questoes = serializers.SerializerMethodField()
    questoes = QuestaoSerializer(many=True, read_only=True)

    class Meta:
        model = Simulado
        fields = ['id', 'turma_alvo', 'turma_nome', 'autor_nome', 'data_criacao', 'titulo', 'tempo_limite', 'area_conhecimento', 'total_questoes', 'questoes']

    def get_turma_nome(self, obj):
        return obj.turma_alvo.nome if obj.turma_alvo else ''

    def get_autor_nome(self, obj):
        return obj.autor.user.get_full_name() or obj.autor.user.username

    def get_total_questoes(self, obj):
        return obj.questoes.count()


class NotaMateriaSerializer(serializers.ModelSerializer):
    materia_display = serializers.CharField(source='get_materia_display', read_only=True)
    epoca_display   = serializers.CharField(source='get_epoca_display',   read_only=True)

    class Meta:
        model  = NotaMateria
        fields = ['id', 'materia', 'materia_display', 'nota', 'epoca', 'epoca_display', 'data']


class MeSerializer(serializers.ModelSerializer):
    tipo          = serializers.SerializerMethodField()
    nome_completo = serializers.SerializerMethodField()
    papel         = serializers.SerializerMethodField()

    class Meta:
        model = User
        fields = ['id', 'username', 'first_name', 'last_name', 'email', 'tipo', 'nome_completo', 'papel']

    def get_tipo(self, obj):
        if obj.is_superuser:
            return 'admin'
        if hasattr(obj, 'professor'):
            return 'professor'
        if hasattr(obj, 'aluno'):
            return 'aluno'
        return 'unknown'

    def get_nome_completo(self, obj):
        return obj.get_full_name() or obj.username

    def get_papel(self, obj):
        if hasattr(obj, 'aluno'):
            try:
                return obj.aluno.perfil_turma.papel
            except Exception:
                pass
        return None
