from rest_framework.exceptions import AuthenticationFailed
from rest_framework_simplejwt.authentication import JWTAuthentication
from rest_framework_simplejwt.exceptions import AuthenticationFailed as JWTAuthenticationFailed
from rest_framework_simplejwt.tokens import AccessToken

from core.models import Usuario


class CoreUsuarioJWTAuthentication(JWTAuthentication):
    """JWTAuthentication that resolves users from core.Usuario instead of auth.User."""

    def get_user(self, validated_token):
        user_id = validated_token.get('user_id')
        if not user_id:
            raise JWTAuthenticationFailed('Token invalido: user_id no encontrado')
        try:
            return Usuario.objects.get(idusuario=user_id)
        except Usuario.DoesNotExist as exc:
            raise JWTAuthenticationFailed('Usuario no encontrado') from exc


def decode_jwt_user(request):
    auth_header = request.headers.get('Authorization', '')
    if not auth_header.startswith('Bearer '):
        raise AuthenticationFailed('Authorization header faltante o invalido')

    token = AccessToken(auth_header.split(' ')[1])
    user_id = token.get('user_id')
    if not user_id:
        raise AuthenticationFailed('Token invalido: user_id no encontrado')

    try:
        return Usuario.objects.get(idusuario=user_id)
    except Usuario.DoesNotExist as exc:
        raise AuthenticationFailed('Usuario autenticado no encontrado') from exc
