from django.core.validators import MaxValueValidator, MinValueValidator
from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('escola', '0012_alter_materia_id_simuladoquestao_and_more'),
    ]

    operations = [
        # Avaliacao: campos de comportamento passam de IntegerField (1-5)
        # para DecimalField (0.0-5.0, step 0.5)
        migrations.AlterField(
            model_name='avaliacao',
            name='assiduidade',
            field=models.DecimalField(
                decimal_places=1, default=3.0, max_digits=3,
                validators=[MinValueValidator(0), MaxValueValidator(5)],
            ),
        ),
        migrations.AlterField(
            model_name='avaliacao',
            name='participacao',
            field=models.DecimalField(
                decimal_places=1, default=3.0, max_digits=3,
                validators=[MinValueValidator(0), MaxValueValidator(5)],
            ),
        ),
        migrations.AlterField(
            model_name='avaliacao',
            name='responsabilidade',
            field=models.DecimalField(
                decimal_places=1, default=3.0, max_digits=3,
                validators=[MinValueValidator(0), MaxValueValidator(5)],
            ),
        ),
        migrations.AlterField(
            model_name='avaliacao',
            name='sociabilidade',
            field=models.DecimalField(
                decimal_places=1, default=3.0, max_digits=3,
                validators=[MinValueValidator(0), MaxValueValidator(5)],
            ),
        ),
        # Questao: campo de imagem opcional
        migrations.AddField(
            model_name='questao',
            name='imagem',
            field=models.ImageField(blank=True, null=True, upload_to='questoes_imagens/'),
        ),
    ]
