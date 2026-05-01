"""
Django settings for soleimapp project.
"""

import os
from datetime import timedelta
from pathlib import Path

# Build paths inside the project like this: BASE_DIR / 'subdir'.
BASE_DIR = Path(__file__).resolve().parent.parent

# Security settings from environment variables
SECRET_KEY = os.environ.get(
    "SECRET_KEY", "django-insecure-9fzp(*k2)65i&w*qb6iz9xzq!2ev#+&9s2oc+r*n6@-ltvt!aj"
)

DEBUG = os.environ.get("DEBUG", "False").lower() in ("true", "1", "yes")

default_allowed_hosts = ["django", "localhost", "127.0.0.1", "0.0.0.0"]
configured_allowed_hosts = [
    host.strip()
    for host in os.environ.get("ALLOWED_HOSTS", "").split(",")
    if host.strip()
]
ALLOWED_HOSTS = list(dict.fromkeys(configured_allowed_hosts + default_allowed_hosts))


# Application definition

# P2 — detectar si django-prometheus está instalado.
# Si la imagen fue construida antes de que se añadiera el paquete a
# requirements.txt, Django arranca igual (sin métricas) en vez de crashear.
try:
    import django_prometheus  # noqa: F401

    _PROMETHEUS_AVAILABLE = True
except ImportError:
    _PROMETHEUS_AVAILABLE = False

INSTALLED_APPS = [
    "daphne",
    "django.contrib.admin",
    "django.contrib.auth",
    "django.contrib.contenttypes",
    "django.contrib.sessions",
    "django.contrib.messages",
    "django.contrib.staticfiles",
    "corsheaders",
    "rest_framework",
    "rest_framework_simplejwt.token_blacklist",
    "django_filters",
    "drf_spectacular",
    "channels",
    "core",
    "alerta",
    "analitica",
    "telemetria",
    "usuario",
    "empresa",
    "auditoria",
    # P1 — Núcleo operativo B2B
    "tecnicos",
    "mantenimiento",
    "ordenes",
    "notificaciones",
]

if _PROMETHEUS_AVAILABLE:
    INSTALLED_APPS.insert(INSTALLED_APPS.index("channels") + 1, "django_prometheus")

_MIDDLEWARE_CORE = [
    # Genera UUID por request y lo inyecta en logs y cabecera X-Request-ID
    "soleimapp.logging_filters.RequestIdMiddleware",
    "django.middleware.security.SecurityMiddleware",
    "whitenoise.middleware.WhiteNoiseMiddleware",
    "django.contrib.sessions.middleware.SessionMiddleware",
    "corsheaders.middleware.CorsMiddleware",
    "django.middleware.common.CommonMiddleware",
    "django.middleware.csrf.CsrfViewMiddleware",
    "django.contrib.auth.middleware.AuthenticationMiddleware",
    "django.contrib.messages.middleware.MessageMiddleware",
    "django.middleware.clickjacking.XFrameOptionsMiddleware",
]

if _PROMETHEUS_AVAILABLE:
    # Prometheus debe ser el primero y el último para capturar todas las métricas
    MIDDLEWARE = (
        ["django_prometheus.middleware.PrometheusBeforeMiddleware"]
        + _MIDDLEWARE_CORE
        + ["django_prometheus.middleware.PrometheusAfterMiddleware"]
    )
else:
    MIDDLEWARE = _MIDDLEWARE_CORE

ROOT_URLCONF = "soleimapp.urls"

TEMPLATES = [
    {
        "BACKEND": "django.template.backends.django.DjangoTemplates",
        "DIRS": [],
        "APP_DIRS": True,
        "OPTIONS": {
            "context_processors": [
                "django.template.context_processors.request",
                "django.contrib.auth.context_processors.auth",
                "django.contrib.messages.context_processors.messages",
            ],
        },
    },
]

WSGI_APPLICATION = "soleimapp.wsgi.application"
ASGI_APPLICATION = "soleimapp.asgi.application"


# Database
# P2 — Use django-prometheus DB wrapper to expose query-count / latency metrics.
DATABASES = {
    "default": {
        "ENGINE": "django_prometheus.db.backends.postgresql",
        "NAME": os.environ.get("POSTGRES_DB", "soleim"),
        "USER": os.environ.get("POSTGRES_USER", "postgres"),
        "PASSWORD": os.environ.get("POSTGRES_PASSWORD", default="1234"),
        "HOST": os.environ.get("POSTGRES_HOST", "localhost"),
        "PORT": os.environ.get("POSTGRES_PORT", "5432"),
        # Reutiliza conexiones en cada worker para evitar el overhead de
        # establecer una nueva conexión por request.
        "CONN_MAX_AGE": int(os.environ.get("CONN_MAX_AGE", 60)),
    }
}


# Password validation
AUTH_PASSWORD_VALIDATORS = [
    {
        "NAME": "django.contrib.auth.password_validation.UserAttributeSimilarityValidator",
    },
    {
        "NAME": "django.contrib.auth.password_validation.MinimumLengthValidator",
    },
    {
        "NAME": "django.contrib.auth.password_validation.CommonPasswordValidator",
    },
    {
        "NAME": "django.contrib.auth.password_validation.NumericPasswordValidator",
    },
]


# Internationalization
LANGUAGE_CODE = "es-co"

TIME_ZONE = "America/Bogota"

USE_I18N = True

USE_TZ = True


# Static files
STATIC_URL = "/static/"
STATIC_ROOT = BASE_DIR / "staticfiles"

# Media files (uploads de evidencia de órdenes)
MEDIA_URL = "/media/"
MEDIA_ROOT = BASE_DIR / "media"
STORAGES = {
    "default": {
        "BACKEND": "django.core.files.storage.FileSystemStorage",
    },
    "staticfiles": {
        "BACKEND": "whitenoise.storage.CompressedStaticFilesStorage",
    },
}

# Default primary key field type
DEFAULT_AUTO_FIELD = "django.db.models.BigAutoField"


CSRF_TRUSTED_ORIGINS = [
    "http://localhost:5174",
    "http://127.0.0.1:5174",
    "http://localhost:5173",
    "http://localhost:3000",
]

# CORS Configuration
CORS_ALLOWED_ORIGINS = os.environ.get(
    "CORS_ALLOWED_ORIGINS",
    "http://localhost:5173,http://localhost:5174,http://127.0.0.1:5173,http://127.0.0.1:5174,http://localhost:3000",
).split(",")

CORS_ALLOW_CREDENTIALS = True


# Redis
REDIS_URL = os.environ.get("REDIS_URL", "redis://redis:6379/0")


# Cache with Redis
CACHES = {
    "default": {
        "BACKEND": "django_redis.cache.RedisCache",
        "LOCATION": REDIS_URL,
        "OPTIONS": {
            "CLIENT_CLASS": "django_redis.client.DefaultClient",
        },
        "TIMEOUT": 300,
    }
}


# Django REST Framework
REST_FRAMEWORK = {
    "DEFAULT_AUTHENTICATION_CLASSES": [
        "usuario.utils.CoreUsuarioJWTAuthentication",
    ],
    "DEFAULT_PERMISSION_CLASSES": [
        "rest_framework.permissions.IsAuthenticated",
        "core.permissions.IsActiveUser",
    ],
    "DEFAULT_PAGINATION_CLASS": "rest_framework.pagination.PageNumberPagination",
    "PAGE_SIZE": 20,
    "DEFAULT_FILTER_BACKENDS": [
        "django_filters.rest_framework.DjangoFilterBackend",
        "rest_framework.filters.SearchFilter",
        "rest_framework.filters.OrderingFilter",
    ],
    "DEFAULT_SCHEMA_CLASS": "drf_spectacular.openapi.AutoSchema",
    # --- Throttling global ---
    "DEFAULT_THROTTLE_CLASSES": [
        "rest_framework.throttling.AnonRateThrottle",
        "rest_framework.throttling.UserRateThrottle",
    ],
    "DEFAULT_THROTTLE_RATES": {
        "anon": "200/day",
        "user": "2000/day",
        # Scopes usados por los throttles de login/register en usuario/views.py
        "login": "5/minute",
        "register": "10/hour",
    },
}


# Swagger / OpenAPI (drf-spectacular)
SPECTACULAR_SETTINGS = {
    "TITLE": "Soleim Smart Grid API",
    "DESCRIPTION": "API para monitoreo operativo multi-sitio, consumo, baterias, alertas y auditoria.",
    "VERSION": "2.0.0",
    "SERVE_INCLUDE_SCHEMA": False,
}


# JWT Configuration
SIMPLE_JWT = {
    "ACCESS_TOKEN_LIFETIME": timedelta(hours=1),
    "REFRESH_TOKEN_LIFETIME": timedelta(days=7),
    "ROTATE_REFRESH_TOKENS": True,
    # Activa la blacklist: los refresh tokens rotados quedan invalidados.
    # Requiere 'rest_framework_simplejwt.token_blacklist' en INSTALLED_APPS.
    "BLACKLIST_AFTER_ROTATION": True,
    "AUTH_HEADER_TYPES": ("Bearer",),
    "UPDATE_LAST_LOGIN": False,  # core.Usuario no es auth.User; no usar este campo
}


# Clave compartida para el consumer MQTT → endpoint /api/telemetria/registrar_datos/
# El consumer debe enviarla en la cabecera: X-IoT-Key: <valor>
IOT_SHARED_SECRET = os.environ.get("IOT_SHARED_SECRET", "")

# P2 — Redis write-ahead buffer para ingesta IoT de alta frecuencia.
# Cuando True, registrar_datos encola en Redis y retorna 202; flush_iot_buffer
# escribe a Postgres con bulk_create cada ~3 s (ver CELERY_BEAT_SCHEDULE).
IOT_BUFFER_ENABLED = os.environ.get("IOT_BUFFER_ENABLED", "False").lower() in (
    "true",
    "1",
    "yes",
)


# --- Notificaciones (P1) ---
NOTIFICATION_BACKENDS = {
    "in_app": "notificaciones.backends.InAppBackend",
    "email": "notificaciones.backends.EmailBackend",
    "webhook": "notificaciones.backends.WebhookBackend",
}
DEFAULT_FROM_EMAIL = os.environ.get("DEFAULT_FROM_EMAIL", "no-reply@soleim.io")
EMAIL_BACKEND = os.environ.get(
    "EMAIL_BACKEND",
    "django.core.mail.backends.console.EmailBackend",  # dev por defecto
)
DEFAULT_WEBHOOK_URL = os.environ.get("DEFAULT_WEBHOOK_URL", "")


# Celery Configuration
from celery.schedules import crontab  # noqa: E402

CELERY_BROKER_URL = os.environ.get("CELERY_BROKER_URL", "redis://redis:6379/1")
CELERY_RESULT_BACKEND = os.environ.get("CELERY_RESULT_BACKEND", "redis://redis:6379/1")
CELERY_ACCEPT_CONTENT = ["json"]
CELERY_TASK_SERIALIZER = "json"
CELERY_RESULT_SERIALIZER = "json"
CELERY_TIMEZONE = TIME_ZONE
CELERY_TASK_TRACK_STARTED = True
CELERY_BROKER_CONNECTION_RETRY_ON_STARTUP = True

# --- Celery Beat schedule ---
CELERY_BEAT_SCHEDULE = {
    # P1 — B2B operational tasks
    "generar-mantenimientos-preventivos": {
        "task": "ordenes.tasks.generar_mantenimientos_preventivos",
        "schedule": crontab(hour=2, minute=0),  # diaria 02:00
    },
    "verificar-sla-ordenes": {
        "task": "ordenes.tasks.verificar_sla_ordenes",
        "schedule": crontab(minute=0),  # cada hora en punto
    },
    "recordatorio-mantenimientos": {
        "task": "ordenes.tasks.recordatorio_mantenimientos_diario",
        "schedule": crontab(hour=8, minute=0),  # diaria 08:00
    },
    # P2 — IoT buffer flush (every 3 s when buffer enabled)
    # timedelta-based schedule runs even outside working hours.
    "flush-iot-buffer": {
        "task": "telemetria.task.flush_iot_buffer",
        "schedule": timedelta(seconds=3),
    },
}


# Django Channels
CHANNEL_LAYERS = {
    "default": {
        "BACKEND": "channels_redis.core.RedisChannelLayer",
        "CONFIG": {
            "hosts": [os.environ.get("REDIS_URL", "redis://redis:6379/2")],
        },
    },
}


# Logging  (formato estructurado; incluye request_id generado por el middleware)
LOGGING = {
    "version": 1,
    "disable_existing_loggers": False,
    "formatters": {
        "structured": {
            "format": (
                '{"time": "%(asctime)s", "level": "%(levelname)s", '
                '"logger": "%(name)s", "module": "%(module)s", '
                '"request_id": "%(request_id)s", "message": "%(message)s"}'
            ),
            "style": "%",
            "defaults": {"request_id": "-"},
        },
        "verbose": {
            "format": "[%(asctime)s] %(levelname)s %(name)s %(request_id)s %(message)s",
            "style": "%",
            "defaults": {"request_id": "-"},
        },
    },
    "filters": {
        "request_id": {
            "()": "soleimapp.logging_filters.RequestIdFilter",
        },
    },
    "handlers": {
        "console": {
            "class": "logging.StreamHandler",
            "formatter": "verbose",
            "filters": ["request_id"],
        },
    },
    "root": {
        "handlers": ["console"],
        "level": "INFO",
    },
    "loggers": {
        "django": {
            "handlers": ["console"],
            "level": "INFO",
            "propagate": False,
        },
        "django.security": {
            "handlers": ["console"],
            "level": "WARNING",
            "propagate": False,
        },
        "celery": {
            "handlers": ["console"],
            "level": "INFO",
            "propagate": False,
        },
        "soleim": {
            "handlers": ["console"],
            "level": "DEBUG" if DEBUG else "INFO",
            "propagate": False,
        },
    },
}
