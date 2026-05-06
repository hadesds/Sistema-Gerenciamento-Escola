from django.db import migrations, models
import django.core.validators
import django.db.models.deletion


class Migration(migrations.Migration):

    dependencies = [
        ('escola', '0010_avaliacao_materia_observacao'),
    ]

    operations = [
        migrations.CreateModel(
            name='ProvaIndividual',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('epoca', models.CharField(
                    choices=[('1B', '1° Bimestre'), ('2B', '2° Bimestre'), ('3B', '3° Bimestre'), ('4B', '4° Bimestre')],
                    max_length=2,
                )),
                ('numero', models.PositiveSmallIntegerField()),
                ('nota', models.DecimalField(
                    decimal_places=2, max_digits=4,
                    validators=[django.core.validators.MinValueValidator(0), django.core.validators.MaxValueValidator(10)],
                )),
                ('data', models.DateField(auto_now_add=True)),
                ('aluno', models.ForeignKey(
                    on_delete=django.db.models.deletion.CASCADE,
                    related_name='provas_individuais',
                    to='escola.aluno',
                )),
                ('materia', models.ForeignKey(
                    on_delete=django.db.models.deletion.CASCADE,
                    related_name='provas_individuais',
                    to='escola.materia',
                )),
                ('professor', models.ForeignKey(
                    null=True,
                    on_delete=django.db.models.deletion.SET_NULL,
                    related_name='provas_aplicadas',
                    to='escola.professor',
                )),
            ],
            options={
                'verbose_name': 'Prova Individual',
                'verbose_name_plural': 'Provas Individuais',
                'ordering': ['epoca', 'numero'],
            },
        ),
        migrations.AlterUniqueTogether(
            name='provaindividual',
            unique_together={('aluno', 'materia', 'epoca', 'numero')},
        ),
    ]
