FROM python:3.11-slim

WORKDIR /app

RUN groupadd --system appuser && useradd --system --gid appuser --create-home --shell /usr/sbin/nologin appuser

RUN apt-get update && apt-get install -y \
    gcc \
    postgresql-client \
    && rm -rf /var/lib/apt/lists/*

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY . .

RUN mkdir -p /app/staticfiles /home/appuser && chown -R appuser:appuser /app /home/appuser

USER appuser

RUN python manage.py collectstatic --noinput || true

EXPOSE 8000

CMD ["gunicorn", "soleimapp.wsgi:application", "--bind", "0.0.0.0:8000", "--workers", "3", "--timeout", "120"]
