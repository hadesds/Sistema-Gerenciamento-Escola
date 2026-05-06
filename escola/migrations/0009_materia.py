from django.db import migrations, models
import django.db.models.deletion


MATERIAS_INICIAIS = [
    ('Português',        'PRT'),
    ('Matemática',       'MTM'),
    ('Ciências',         'CNC'),
    ('Geografia',        'GGF'),
    ('Artes',            'ART'),
    ('Inglês',           'ING'),
    ('Educação Física',  'EDF'),
    ('Filosofia',        'FIL'),
]

MAPEAMENTO = {
    'portugues': 'PRT', 'português': 'PRT', 'port': 'PRT', 'prt': 'PRT',
    'matematica': 'MTM', 'matemática': 'MTM', 'mat': 'MTM', 'mtm': 'MTM',
    'ciencias': 'CNC', 'ciências': 'CNC', 'cnc': 'CNC', 'biologia': 'CNC',
    'geografia': 'GGF', 'geo': 'GGF', 'ggf': 'GGF',
    'artes': 'ART', 'arte': 'ART', 'art': 'ART',
    'ingles': 'ING', 'inglês': 'ING', 'ing': 'ING',
    'educacao_fisica': 'EDF', 'educação física': 'EDF', 'educacao fisica': 'EDF',
    'educação fisica': 'EDF', 'ed. fisica': 'EDF', 'edf': 'EDF', 'educação física': 'EDF',
    'filosofia': 'FIL', 'fil': 'FIL',
}


def criar_materias(apps, schema_editor):
    Materia = apps.get_model('escola', 'Materia')
    for nome, sigla in MATERIAS_INICIAIS:
        Materia.objects.get_or_create(sigla=sigla, defaults={'nome': nome})


def vincular_questoes(apps, schema_editor):
    Questao = apps.get_model('escola', 'Questao')
    Materia = apps.get_model('escola', 'Materia')

    materias_por_sigla = {m.sigla: m for m in Materia.objects.all()}

    for questao in Questao.objects.all():
        legado = (questao.materia_legado or '').strip().lower()
        sigla = MAPEAMENTO.get(legado)
        if sigla and sigla in materias_por_sigla:
            questao.materia = materias_por_sigla[sigla]
            questao.save()


def reverter_materias(apps, schema_editor):
    Materia = apps.get_model('escola', 'Materia')
    Materia.objects.all().delete()


class Migration(migrations.Migration):

    dependencies = [
        ('escola', '0008_simulado_titulo_tempo_area'),
    ]

    operations = [
        # 1. Criar o modelo Materia
        migrations.CreateModel(
            name='Materia',
            fields=[
                ('id', models.AutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('nome', models.CharField(max_length=100)),
                ('sigla', models.CharField(max_length=3, unique=True)),
            ],
            options={
                'verbose_name': 'Matéria',
                'verbose_name_plural': 'Matérias',
                'ordering': ['nome'],
            },
        ),

        # 2. Popular as 8 matérias
        migrations.RunPython(criar_materias, reverter_materias),

        # 3. Renomear o campo antigo para materia_legado
        migrations.RenameField(
            model_name='questao',
            old_name='materia',
            new_name='materia_legado',
        ),

        # 4. Adicionar o novo campo FK
        migrations.AddField(
            model_name='questao',
            name='materia',
            field=models.ForeignKey(
                blank=True,
                null=True,
                on_delete=django.db.models.deletion.SET_NULL,
                related_name='questoes',
                to='escola.materia',
            ),
        ),

        # 5. Vincular questões existentes
        migrations.RunPython(vincular_questoes, migrations.RunPython.noop),

        # 6. Remover o campo legado
        migrations.RemoveField(
            model_name='questao',
            name='materia_legado',
        ),
    ]
