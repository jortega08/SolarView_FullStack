from django.apps import AppConfig


class OrdenesConfig(AppConfig):
    default_auto_field = 'django.db.models.BigAutoField'
    name = 'ordenes'
    verbose_name = 'Órdenes de trabajo'

    def ready(self):
        # Conectar signals (alerta crítica → orden de trabajo)
        from . import signals  # noqa: F401
