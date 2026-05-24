import django.db.models.deletion
from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('escola', '0011_provaindividual'),
    ]

    operations = [
        # 1. Corrige BigAutoField no Materia (sem efeito no banco, só estado)
        migrations.AlterField(
            model_name='materia',
            name='id',
            field=models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID'),
        ),

        # 2. Cria a tabela SimuladoQuestao
        migrations.CreateModel(
            name='SimuladoQuestao',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('valor', models.DecimalField(decimal_places=2, default=1.0, max_digits=5)),
                ('questao', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='simulado_questoes', to='escola.questao')),
                ('simulado', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='simulado_questoes', to='escola.simulado')),
            ],
            options={
                'verbose_name': 'Questão do Simulado',
                'verbose_name_plural': 'Questões do Simulado',
                'unique_together': {('simulado', 'questao')},
            },
        ),

        # 3. Migra dados da tabela M2M implícita para SimuladoQuestao,
        #    remove a tabela implícita e atualiza o estado do Django —
        #    tudo sem usar AlterField (que o Django proíbe em M2M com through).
        migrations.SeparateDatabaseAndState(
            database_operations=[
                # Copia pares existentes com valor padrão 1.00
                migrations.RunSQL(
                    sql=(
                        "INSERT INTO escola_simuladoquestao (simulado_id, questao_id, valor) "
                        "SELECT simulado_id, questao_id, 1.00 "
                        "FROM escola_simulado_questoes "
                        "ON CONFLICT DO NOTHING"
                    ),
                    reverse_sql=migrations.RunSQL.noop,
                ),
                # Remove a tabela implícita antiga
                migrations.RunSQL(
                    sql="DROP TABLE IF EXISTS escola_simulado_questoes",
                    reverse_sql=migrations.RunSQL.noop,
                ),
            ],
            state_operations=[
                # Atualiza o estado do Django: questoes agora usa through=
                migrations.AlterField(
                    model_name='simulado',
                    name='questoes',
                    field=models.ManyToManyField(
                        related_name='simulados',
                        through='escola.SimuladoQuestao',
                        to='escola.questao',
                    ),
                ),
            ],
        ),
    ]
