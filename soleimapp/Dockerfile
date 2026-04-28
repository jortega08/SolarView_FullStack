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

# P2: Gunicorn default (used when docker-compose does NOT override the command).
# Worker count formula: 2 * CPU + 1.  Set GUNICORN_WORKERS env var to override.
# The docker-compose service uses daphne (ASGI) instead; this CMD is the
# fallback for plain WSGI deployments (e.g. staging without WebSockets).
CMD ["sh", "-c", \
     "gunicorn soleimapp.wsgi:application \
       --bind 0.0.0.0:8000 \
       --workers ${GUNICORN_WORKERS:-3} \
       --worker-class gthread \
       --threads 4 \
       --timeout 120 \
       --keep-alive 5 \
       --max-requests 1000 \
       --max-requests-jitter 100 \
       --access-logfile - \
       --error-logfile -"]
