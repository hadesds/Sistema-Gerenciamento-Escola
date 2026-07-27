from .models import LogAtividade


def registrar_atividade(user, descricao):
    """Grava uma linha no log de atividades, exibido no painel admin."""
    LogAtividade.objects.create(usuario=user, descricao=descricao)
