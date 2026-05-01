from rest_framework.exceptions import AuthenticationFailed
from rest_framework_simplejwt.authentication import JWTAuthentication
from rest_framework_simplejwt.exceptions import (
    AuthenticationFailed as JWTAuthenticationFailed,
)
from rest_framework_simplejwt.tokens import AccessToken

from core.models import Usuario


class CoreUsuarioJWTAuthentication(JWTAuthentication):
    """JWTAuthentication que resuelve usuarios desde core.Usuario en lugar de auth.User."""

    def get_user(self, validated_token):
        user_id = validated_token.get("user_id")
        if not user_id:
            raise JWTAuthenticationFailed("Token inválido: user_id no encontrado")
        try:
            return Usuario.objects.get(idusuario=user_id)
        except Usuario.DoesNotExist as exc:
            raise JWTAuthenticationFailed("Usuario no encontrado") from exc


def decode_jwt_user(request):
    """
    Devuelve el Usuario autenticado asociado al request.

    Estrategia (en orden de preferencia):
    1. Si DRF ya ejecutó la autenticación (la vista usa IsAuthenticated),
       request.user es un core.Usuario real — se reutiliza directamente.
    2. Fallback: decodifica manualmente la cabecera Authorization para vistas
       que todavía usen AllowAny pero llamen esta función.
    """
    # --- Ruta rápida: request.user ya está cargado por CoreUsuarioJWTAuthentication ---
    user = getattr(request, "user", None)
    if user is not None and hasattr(user, "idusuario"):
        return user

    # --- Fallback manual (compatibilidad hacia atrás) ---
    auth_header = request.headers.get("Authorization", "")
    if not auth_header.startswith("Bearer "):
        raise AuthenticationFailed("Cabecera Authorization faltante o inválida")

    token = AccessToken(auth_header.split(" ")[1])
    user_id = token.get("user_id")
    if not user_id:
        raise AuthenticationFailed("Token inválido: user_id no encontrado")

    try:
        return Usuario.objects.get(idusuario=user_id)
    except Usuario.DoesNotExist as exc:
        raise AuthenticationFailed("Usuario autenticado no encontrado") from exc
