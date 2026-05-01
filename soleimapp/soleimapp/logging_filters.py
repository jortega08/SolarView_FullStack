"""
Logging utilities: filtro que inyecta un request_id en cada log record,
y middleware que genera el UUID de request y lo propaga.
"""

import logging
import threading
import uuid

# Almacén thread-local para el ID del request activo
_local = threading.local()


def get_request_id():
    return getattr(_local, "request_id", "-")


def set_request_id(request_id: str):
    _local.request_id = request_id


def clear_request_id():
    _local.request_id = "-"


class RequestIdFilter(logging.Filter):
    """Inyecta request_id en cada LogRecord para que el formatter pueda usarlo."""

    def filter(self, record):
        record.request_id = get_request_id()
        return True


class RequestIdMiddleware:
    """
    Genera un UUID por request y lo adjunta a:
      - thread-local (para logs)
      - request.request_id (para vistas / serializers)
      - cabecera de respuesta X-Request-ID
    """

    def __init__(self, get_response):
        self.get_response = get_response

    def __call__(self, request):
        request_id = request.headers.get("X-Request-ID") or str(uuid.uuid4())
        set_request_id(request_id)
        request.request_id = request_id

        response = self.get_response(request)

        response["X-Request-ID"] = request_id
        clear_request_id()
        return response
