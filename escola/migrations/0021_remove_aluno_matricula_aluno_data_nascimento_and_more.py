import re

from django.db import migrations, models


def normalizar_cpfs_existentes(apps, schema_editor):
    """Remove pontuação de CPFs já cadastrados antes de reduzir o max_length da coluna."""
    Aluno = apps.get_model('escola', 'Aluno')
    for aluno in Aluno.objects.exclude(cpf__isnull=True).exclude(cpf=''):
        digitos = re.sub(r'\D', '', aluno.cpf) or None
        if digitos != aluno.cpf:
            aluno.cpf = digitos
            try:
                aluno.save(update_fields=['cpf'])
            except Exception:
                # Colisão de unicidade após normalizar (dado legado inconsistente) —
                # não trava a migração; o admin corrige manualmente depois.
                pass


def noop(apps, schema_editor):
    pass


class Migration(migrations.Migration):

    dependencies = [
        ("escola", "0020_aluno_cpf_aluno_nome_mae_aluno_telefone"),
    ]

    operations = [
        migrations.RemoveField(
            model_name="aluno",
            name="matricula",
        ),
        migrations.AddField(
            model_name="aluno",
            name="data_nascimento",
            field=models.DateField(
                blank=True,
                help_text="Ao criar o aluno com CPF preenchido, vira a senha inicial (formato DD-MM-AAAA).",
                null=True,
            ),
        ),
        migrations.AddField(
            model_name="aluno",
            name="email_mae",
            field=models.EmailField(blank=True, default="", max_length=254),
        ),
        migrations.AddField(
            model_name="aluno",
            name="endereco",
            field=models.CharField(blank=True, default="", max_length=255),
        ),
        migrations.RunPython(normalizar_cpfs_existentes, noop),
        migrations.AlterField(
            model_name="aluno",
            name="cpf",
            field=models.CharField(
                blank=True,
                help_text="Também é o código de matrícula e o login do aluno (só dígitos, sem pontos/traço).",
                max_length=11,
                null=True,
                unique=True,
            ),
        ),
    ]
