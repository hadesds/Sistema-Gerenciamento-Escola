from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('escola', '0002_notamateria'),
    ]

    operations = [
        migrations.SeparateDatabaseAndState(
            database_operations=[
                migrations.RunSQL(
                    sql='ALTER TABLE "escola_questao" ADD COLUMN IF NOT EXISTS "dificuldade" varchar(10) DEFAULT \'medio\' NOT NULL',
                    reverse_sql='ALTER TABLE "escola_questao" DROP COLUMN IF EXISTS "dificuldade"',
                ),
            ],
            state_operations=[
                migrations.AddField(
                    model_name='questao',
                    name='dificuldade',
                    field=models.CharField(
                        choices=[('facil', 'Fácil'), ('medio', 'Médio'), ('dificil', 'Difícil')],
                        default='medio',
                        max_length=10,
                    ),
                ),
            ],
        ),
    ]
