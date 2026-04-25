from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from rest_framework_simplejwt.tokens import RefreshToken

from core.models import Usuario

from .serializers import LoginSerializer, RegisterSerializer, UsuarioProfileSerializer
from .utils import decode_jwt_user


def _flatten_error_detail(detail):
    if isinstance(detail, list):
        return ' '.join(filter(None, (_flatten_error_detail(item) for item in detail)))
    if isinstance(detail, dict):
        return ' '.join(filter(None, (_flatten_error_detail(item) for item in detail.values())))
    return str(detail).strip()


def _validation_error_response(serializer):
    return Response(
        {
            'success': False,
            'error': _flatten_error_detail(serializer.errors) or 'Revisa los datos ingresados.',
            'errors': serializer.errors,
        },
        status=status.HTTP_400_BAD_REQUEST,
    )


@api_view(['POST'])
@permission_classes([AllowAny])
def register(request):
    serializer = RegisterSerializer(data=request.data)
    if not serializer.is_valid():
        return _validation_error_response(serializer)
    usuario = serializer.save()

    refresh = RefreshToken()
    refresh['user_id'] = usuario.idusuario
    refresh['email'] = usuario.email
    refresh['rol'] = usuario.rol

    return Response({
        'success': True,
        'user': RegisterSerializer(usuario).data,
        'tokens': {
            'access': str(refresh.access_token),
            'refresh': str(refresh),
        }
    }, status=status.HTTP_201_CREATED)


@api_view(['POST'])
@permission_classes([AllowAny])
def login(request):
    serializer = LoginSerializer(data=request.data)
    if not serializer.is_valid():
        return _validation_error_response(serializer)

    email = serializer.validated_data['email']
    contrasena = serializer.validated_data['contrasena']

    try:
        usuario = Usuario.objects.get(email__iexact=email)
    except Usuario.DoesNotExist:
        return Response(
            {'success': False, 'error': 'Credenciales invalidas'},
            status=status.HTTP_401_UNAUTHORIZED
        )

    if not usuario.check_password(contrasena):
        return Response(
            {'success': False, 'error': 'Credenciales invalidas'},
            status=status.HTTP_401_UNAUTHORIZED
        )

    refresh = RefreshToken()
    refresh['user_id'] = usuario.idusuario
    refresh['email'] = usuario.email
    refresh['rol'] = usuario.rol

    return Response({
        'success': True,
        'user': UsuarioProfileSerializer(usuario).data,
        'tokens': {
            'access': str(refresh.access_token),
            'refresh': str(refresh),
        }
    })


@api_view(['GET'])
@permission_classes([AllowAny])
def me(request):
    try:
        usuario = decode_jwt_user(request)
        return Response({
            'success': True,
            'user': UsuarioProfileSerializer(usuario).data,
        })
    except Exception:
        pass

    return Response(
        {'success': False, 'error': 'No autenticado'},
        status=status.HTTP_401_UNAUTHORIZED
    )
