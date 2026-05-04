from django.db import migrations, models

class Migration(migrations.Migration):
    dependencies = [
        ('escola', '0007_questao_tipo_justificativa_alternativaquestao'),
    ]
    operations = [
        migrations.AddField(
            model_name='simulado',
            name='titulo',
            field=models.CharField(blank=True, default='', max_length=200),
        ),
        migrations.AddField(
            model_name='simulado',
            name='tempo_limite',
            field=models.PositiveIntegerField(blank=True, help_text='Tempo limite em minutos', null=True),
        ),
        migrations.AddField(
            model_name='simulado',
            name='area_conhecimento',
            field=models.CharField(blank=True, default='', max_length=100),
        ),
    ]
