from django.test import TestCase

# Create your tests here.

"""
Script para testar todas as URLs do sistema
Execute: python manage.py shell < test_urls.py
"""

from django.urls import reverse, NoReverseMatch
from django.contrib.auth.models import User
from escola.models import Professor, Aluno, Turma

print("=" * 70)
print("TESTE DE URLs DO SISTEMA CARA")
print("=" * 70)
print()

urls_sem_parametros = [
    'dashboard',
    'lista_turmas_professor',
    'banco_questoes',
    'criar_simulado',
    'lista_simulados',
    'meu_feedback',
    'meus_simulados',
]

urls_com_parametros = [
    ('detalhe_turma_carometro', {'turma_id': 1}),
    ('registrar_avaliacao', {'aluno_id': 1}),
    ('relatorio_aluno', {'aluno_id': 1}),
    ('visualizar_simulado', {'simulado_id': 1}),
]

print("📍 Testando URLs sem parâmetros:")
print("-" * 70)
for url_name in urls_sem_parametros:
    try:
        path = reverse(url_name)
        print(f"✅ {url_name:30} -> {path}")
    except NoReverseMatch as e:
        print(f"❌ {url_name:30} -> ERRO: {e}")
    except Exception as e:
        print(f"⚠️  {url_name:30} -> {type(e).__name__}: {e}")

print()
print("📍 Testando URLs com parâmetros:")
print("-" * 70)
for url_name, kwargs in urls_com_parametros:
    try:
        path = reverse(url_name, kwargs=kwargs)
        print(f"✅ {url_name:30} -> {path}")
    except NoReverseMatch as e:
        print(f"❌ {url_name:30} -> ERRO: {e}")
    except Exception as e:
        print(f"⚠️  {url_name:30} -> {type(e).__name__}: {e}")

print()
print("=" * 70)
print("VERIFICAÇÃO DO BANCO DE DADOS")
print("=" * 70)
print()

# Verificar dados no banco
total_users = User.objects.count()
total_professores = Professor.objects.count()
total_alunos = Aluno.objects.count()
total_turmas = Turma.objects.count()

print(f"👥 Usuários cadastrados: {total_users}")
print(f"👨‍🏫 Professores cadastrados: {total_professores}")
print(f"👨‍🎓 Alunos cadastrados: {total_alunos}")
print(f"📚 Turmas cadastradas: {total_turmas}")

print()

if total_users == 0:
    print("⚠️  ATENÇÃO: Nenhum usuário cadastrado!")
    print("   Execute: python manage.py createsuperuser")
    print()

if total_professores == 0:
    print("⚠️  ATENÇÃO: Nenhum professor cadastrado!")
    print("   Acesse /admin/ e crie um perfil de Professor")
    print()

if total_alunos == 0:
    print("⚠️  ATENÇÃO: Nenhum aluno cadastrado!")
    print("   Acesse /admin/ e crie perfis de Alunos")
    print()

if total_turmas == 0:
    print("⚠️  ATENÇÃO: Nenhuma turma cadastrada!")
    print("   Acesse /admin/ e crie Turmas")
    print()

print("=" * 70)
print("RESUMO")
print("=" * 70)
print()

if total_users > 0 and (total_professores > 0 or total_alunos > 0):
    print("✅ Sistema configurado e pronto para uso!")
    print()
    print("🚀 Próximos passos:")
    print("   1. Execute: python manage.py runserver")
    print("   2. Acesse: http://localhost:8000/login/")
    print("   3. Faça login e teste o sistema")
else:
    print("❌ Sistema precisa de configuração!")
    print()
    print("📋 Checklist:")
    print("   [ ] Criar superusuário: python manage.py createsuperuser")
    print("   [ ] Acessar /admin/ e criar Turmas")
    print("   [ ] Criar usuários e vincular a perfis (Professor/Aluno)")
    print("   [ ] Associar professores às turmas")
    print("   [ ] Associar alunos às turmas")

print()
print("=" * 70)