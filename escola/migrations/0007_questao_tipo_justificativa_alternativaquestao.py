from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):

    dependencies = [
        ('escola', '0006_alter_presencaaluno_options_alter_perfilturma_papel'),
    ]

    operations = [
        migrations.AddField(
            model_name='questao',
            name='tipo',
            field=models.CharField(
                choices=[('discursiva', 'Discursiva'), ('objetiva', 'Objetiva')],
                default='discursiva',
                max_length=12,
            ),
        ),
        migrations.AddField(
            model_name='questao',
            name='exige_justificativa',
            field=models.BooleanField(default=False),
        ),
        migrations.AlterField(
            model_name='questao',
            name='resposta',
            field=models.TextField(blank=True, default=''),
        ),
        migrations.CreateModel(
            name='AlternativaQuestao',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('texto', models.CharField(max_length=500)),
                ('correta', models.BooleanField(default=False)),
                ('ordem', models.PositiveSmallIntegerField(default=0)),
                ('questao', models.ForeignKey(
                    on_delete=django.db.models.deletion.CASCADE,
                    related_name='alternativas',
                    to='escola.questao',
                )),
            ],
            options={
                'verbose_name': 'Alternativa',
                'verbose_name_plural': 'Alternativas',
                'ordering': ['ordem'],
            },
        ),
    ]
