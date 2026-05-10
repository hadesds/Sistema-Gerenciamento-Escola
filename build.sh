#!/usr/bin/env bash
set -o errexit

pip install -r requirements.txt

# Força storage simples para evitar erro do WhiteNoise com arquivos do Admin
DJANGO_SETTINGS_MODULE=gestao_escolar.settings \
STATICFILES_STORAGE=django.contrib.staticfiles.storage.StaticFilesStorage \
python manage.py collectstatic --noinput --clear

python manage.py migrate

if [ "$SEED_DEMO" = "true" ]; then
  python manage.py seed_demo
fi