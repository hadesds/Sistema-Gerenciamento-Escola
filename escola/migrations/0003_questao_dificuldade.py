from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('escola', '0002_notamateria'),
    ]

    operations = [
        migrations.AddField(
            model_name='questao',
            name='dificuldade',
            field=models.CharField(
                choices=[('facil', 'Fácil'), ('medio', 'Médio'), ('dificil', 'Difícil')],
                default='medio',
                max_length=10,
            ),
        ),
    ]
