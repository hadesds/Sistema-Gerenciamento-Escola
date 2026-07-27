from django.db import migrations, models


def popular_turmas(apps, schema_editor):
    Simulado = apps.get_model('escola', 'Simulado')
    for simulado in Simulado.objects.exclude(turma_alvo__isnull=True):
        simulado.turmas.add(simulado.turma_alvo_id)


def reverter_turmas(apps, schema_editor):
    Simulado = apps.get_model('escola', 'Simulado')
    for simulado in Simulado.objects.all():
        primeira = simulado.turmas.first()
        if primeira:
            simulado.turma_alvo_id = primeira.id
            simulado.save(update_fields=['turma_alvo'])


class Migration(migrations.Migration):

    dependencies = [
        ("escola", "0016_alternativaquestao_imagem_and_more"),
    ]

    operations = [
        migrations.AddField(
            model_name="simulado",
            name="turmas",
            field=models.ManyToManyField(blank=True, related_name="simulados_turmas_tmp", to="escola.turma"),
        ),
        migrations.RunPython(popular_turmas, reverter_turmas),
        migrations.RemoveField(
            model_name="simulado",
            name="turma_alvo",
        ),
        migrations.AlterField(
            model_name="simulado",
            name="turmas",
            field=models.ManyToManyField(blank=True, related_name="simulados", to="escola.turma"),
        ),
    ]
