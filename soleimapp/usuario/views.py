import logging

from django.utils import timezone
from rest_framework import status
from rest_framework.decorators import api_view, permission_classes, throttle_classes
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework.throttling import AnonRateThrottle
from rest_framework.views import APIView
from rest_framework_simplejwt.exceptions import TokenError
from rest_framework_simplejwt.tokens import RefreshToken

from auditoria.utils import registrar_evento
from core.models import Usuario
from core.permissions import IsActiveUser

from .serializers import (
    CoreUsuarioTokenRefreshSerializer,
    LoginSerializer,
    RegisterConCodigoSerializer,
    RegisterSerializer,
    UsuarioProfileSerializer,
)

logger = logging.getLogger("soleim")


# ---------------------------------------------------------------------------
# Throttles específicos para auth
# ---------------------------------------------------------------------------


class LoginRateThrottle(AnonRateThrottle):
    """Máximo 5 intentos de login por minuto por IP."""

    scope = "login"


class RegisterRateThrottle(AnonRateThrottle):
    """Máximo 10 registros por hora por IP."""

    scope = "register"


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------


def _flatten_error_detail(detail):
    if isinstance(detail, list):
        return " ".join(filter(None, (_flatten_error_detail(item) for item in detail)))
    if isinstance(detail, dict):
        return " ".join(
            filter(None, (_flatten_error_detail(item) for item in detail.values()))
        )
    return str(detail).strip()


def _validation_error_response(serializer):
    return Response(
        {
            "success": False,
            "error": _flatten_error_detail(serializer.errors)
            or "Revisa los datos ingresados.",
            "errors": serializer.errors,
        },
        status=status.HTTP_400_BAD_REQUEST,
    )


def _build_tokens(usuario):
    """Genera un par access/refresh con los claims del usuario."""
    refresh = RefreshToken()
    refresh["user_id"] = usuario.idusuario
    refresh["email"] = usuario.email
    refresh["rol"] = usuario.rol
    return {
        "access": str(refresh.access_token),
        "refresh": str(refresh),
    }


# ---------------------------------------------------------------------------
# Endpoints
# ---------------------------------------------------------------------------


@api_view(["POST"])
@permission_classes([AllowAny])
@throttle_classes([RegisterRateThrottle])
def register(request):
    serializer = RegisterSerializer(data=request.data)
    if not serializer.is_valid():
        return _validation_error_response(serializer)

    usuario = serializer.save()
    logger.info(
        "Nuevo usuario registrado: %s (id=%s)", usuario.email, usuario.idusuario
    )

    registrar_evento(
        usuario=usuario,
        accion="register",
        entidad="Usuario",
        entidad_id=usuario.idusuario,
        detalle={"email": usuario.email, "rol": usuario.rol},
        request=request,
    )

    return Response(
        {
            "success": True,
            "user": RegisterSerializer(usuario).data,
            "tokens": _build_tokens(usuario),
        },
        status=status.HTTP_201_CREATED,
    )


@api_view(["POST"])
@permission_classes([AllowAny])
@throttle_classes([RegisterRateThrottle])
def registrar_con_codigo(request):
    """
    POST /api/auth/registrar-con-codigo/
    Body: { nombre, email, contrasena, codigo }

    Registra un nuevo usuario que se UNE como empleado al PrestadorServicio
    cuyo admin generó `codigo`. NO crea un nuevo prestador.
    """
    serializer = RegisterConCodigoSerializer(data=request.data)
    if not serializer.is_valid():
        return _validation_error_response(serializer)

    usuario = serializer.save()
    logger.info(
        "Usuario unido a prestador: %s (id=%s, prestador_id=%s)",
        usuario.email,
        usuario.idusuario,
        usuario.prestador_id,
    )
    registrar_evento(
        usuario=usuario,
        accion="register_con_codigo",
        entidad="Usuario",
        entidad_id=usuario.idusuario,
        detalle={
            "email": usuario.email,
            "prestador_id": usuario.prestador_id,
        },
        request=request,
    )
    return Response(
        {
            "success": True,
            "user": UsuarioProfileSerializer(usuario).data,
            "tokens": _build_tokens(usuario),
        },
        status=status.HTTP_201_CREATED,
    )


@api_view(["POST"])
@permission_classes([AllowAny])
@throttle_classes([LoginRateThrottle])
def login(request):
    serializer = LoginSerializer(data=request.data)
    if not serializer.is_valid():
        return _validation_error_response(serializer)

    email = serializer.validated_data["email"]
    contrasena = serializer.validated_data["contrasena"]

    try:
        usuario = Usuario.objects.get(email__iexact=email)
    except Usuario.DoesNotExist:
        # No revelar si el email existe o no
        logger.warning("Login fallido — email no encontrado: %s", email)
        return Response(
            {"success": False, "error": "Credenciales inválidas"},
            status=status.HTTP_401_UNAUTHORIZED,
        )

    # 1. Verificar si la cuenta está activa
    if not usuario.is_active:
        logger.warning(
            "Login denegado — cuenta inactiva: %s (id=%s)", email, usuario.idusuario
        )
        return Response(
            {
                "success": False,
                "error": "Cuenta desactivada. Contacta al administrador.",
            },
            status=status.HTTP_403_FORBIDDEN,
        )

    # 2. Verificar bloqueo temporal
    if usuario.is_locked():
        minutos_restantes = max(
            0,
            int((usuario.locked_until - timezone.now()).total_seconds() / 60) + 1,
        )
        logger.warning(
            "Login denegado — cuenta bloqueada: %s (id=%s), desbloqueada en %d min",
            email,
            usuario.idusuario,
            minutos_restantes,
        )
        return Response(
            {
                "success": False,
                "error": (
                    f"Cuenta bloqueada por exceso de intentos. "
                    f"Inténtalo de nuevo en {minutos_restantes} minuto(s)."
                ),
            },
            status=status.HTTP_429_TOO_MANY_REQUESTS,
        )

    # 3. Verificar contraseña
    if not usuario.check_password(contrasena):
        usuario.record_failed_login()
        intentos_restantes = max(
            0, usuario._MAX_FAILED_ATTEMPTS - usuario.failed_login_attempts
        )
        logger.warning(
            "Login fallido — contraseña incorrecta: %s (id=%s), intentos restantes: %d",
            email,
            usuario.idusuario,
            intentos_restantes,
        )
        registrar_evento(
            usuario=usuario,
            accion="login_failed",
            entidad="Usuario",
            entidad_id=usuario.idusuario,
            detalle={"intentos": usuario.failed_login_attempts},
            request=request,
        )
        return Response(
            {"success": False, "error": "Credenciales inválidas"},
            status=status.HTTP_401_UNAUTHORIZED,
        )

    # 4. Login exitoso
    usuario.reset_failed_logins()
    logger.info("Login exitoso: %s (id=%s)", email, usuario.idusuario)
    registrar_evento(
        usuario=usuario,
        accion="login",
        entidad="Usuario",
        entidad_id=usuario.idusuario,
        detalle={"email": usuario.email},
        request=request,
    )

    return Response(
        {
            "success": True,
            "user": UsuarioProfileSerializer(usuario).data,
            "tokens": _build_tokens(usuario),
        }
    )


@api_view(["POST"])
@permission_classes([IsAuthenticated, IsActiveUser])
def logout(request):
    """
    Invalida el refresh token provisto.
    El access token expira por sí solo (TTL = 1 h).
    Body: { "refresh": "<refresh_token>" }
    """
    refresh_token = request.data.get("refresh")
    if not refresh_token:
        return Response(
            {"success": False, "error": 'Se requiere el campo "refresh".'},
            status=status.HTTP_400_BAD_REQUEST,
        )

    try:
        token = RefreshToken(refresh_token)
        token.blacklist()
    except TokenError:
        return Response(
            {"success": False, "error": "Token inválido o ya revocado."},
            status=status.HTTP_400_BAD_REQUEST,
        )

    usuario = request.user
    logger.info("Logout: %s (id=%s)", usuario.email, usuario.idusuario)
    registrar_evento(
        usuario=usuario,
        accion="logout",
        entidad="Usuario",
        entidad_id=usuario.idusuario,
        detalle={},
        request=request,
    )
    return Response({"success": True})


class CoreUsuarioTokenRefreshView(APIView):
    """
    Refresh JWT que NO depende de `django.contrib.auth.models.User`.

    Reemplaza al `TokenRefreshView` por defecto de SimpleJWT, cuyo serializer
    invoca `get_user_model().objects.get(...)` y rompe en este proyecto
    (modelo operativo `core.Usuario`, sin AUTH_USER_MODEL configurado).

    Body: { "refresh": "<refresh_token>" }
    Resp: { "access": "<nuevo_access_token>" }
    """

    authentication_classes = []
    permission_classes = [AllowAny]

    def post(self, request):
        serializer = CoreUsuarioTokenRefreshSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        return Response(serializer.validated_data, status=status.HTTP_200_OK)


@api_view(["GET"])
@permission_classes([IsAuthenticated, IsActiveUser])
def me(request):
    """
    Devuelve el perfil del usuario autenticado.
    La autenticación JWT la maneja CoreUsuarioJWTAuthentication;
    request.user es un core.Usuario real.
    """
    return Response(
        {
            "success": True,
            "user": UsuarioProfileSerializer(request.user).data,
        }
    )
