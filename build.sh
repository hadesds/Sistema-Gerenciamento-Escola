#!/usr/bin/env bash
set -o errexit

pip install -r requirements.txt

# O storage de staticfiles padrão (settings.STORAGES) já é o simples,
# sem manifest/hash — ver comentário em gestao_escolar/settings.py sobre
# por que o storage com manifest do WhiteNoise quebra o build do Admin.
python manage.py collectstatic --noinput --clear

python manage.py migrate

if [ "$SEED_DEMO" = "true" ]; then
  python manage.py seed_demo
fi