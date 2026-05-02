#!/usr/bin/env bash
set -o errexit

pip install -r requirements.txt
python manage.py collectstatic --noinput --clear
python manage.py migrate

if [ "$SEED_DEMO" = "true" ]; then
  python manage.py seed_demo
fi
