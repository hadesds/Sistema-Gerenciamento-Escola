import django.core.validators
import django.db.models.deletion
from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('escola', '0001_initial'),
    ]

    operations = [
        migrations.CreateModel(
            name='NotaMateria',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('materia', models.CharField(
                    max_length=20,
                    choices=[
                        ('portugues', 'Português'),
                        ('matematica', 'Matemática'),
                        ('ciencias', 'Ciências'),
                        ('religiao', 'Religião'),
                        ('geografia', 'Geografia'),
                        ('historia', 'História'),
                        ('artes', 'Artes'),
                        ('ingles', 'Inglês'),
                        ('educacao_fisica', 'Educação Física'),
                        ('filosofia', 'Filosofia'),
                    ]
                )),
                ('nota', models.DecimalField(
                    max_digits=4,
                    decimal_places=2,
                    validators=[
                        django.core.validators.MinValueValidator(0),
                        django.core.validators.MaxValueValidator(10),
                    ]
                )),
                ('epoca', models.CharField(
                    max_length=2,
                    choices=[
                        ('1B', '1° Bimestre'),
                        ('2B', '2° Bimestre'),
                        ('3B', '3° Bimestre'),
                        ('4B', '4° Bimestre'),
                    ]
                )),
                ('data', models.DateField(auto_now_add=True)),
                ('aluno', models.ForeignKey(
                    on_delete=django.db.models.deletion.CASCADE,
                    related_name='notas_materias',
                    to='escola.aluno',
                )),
                ('professor', models.ForeignKey(
                    null=True,
                    on_delete=django.db.models.deletion.SET_NULL,
                    related_name='notas_dadas',
                    to='escola.professor',
                )),
            ],
            options={
                'ordering': ['epoca', 'materia'],
                'unique_together': {('aluno', 'materia', 'epoca')},
            },
        ),
    ]
