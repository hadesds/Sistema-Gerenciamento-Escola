from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):
    dependencies = [('escola', '0009_materia')]
    operations = [
        migrations.AddField(
            model_name='avaliacao',
            name='materia',
            field=models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.SET_NULL, related_name='avaliacoes', to='escola.materia'),
        ),
        migrations.AddField(
            model_name='avaliacao',
            name='observacao',
            field=models.TextField(blank=True, default=''),
        ),
    ]
