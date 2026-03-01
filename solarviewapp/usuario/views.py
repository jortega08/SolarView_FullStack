from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework_simplejwt.tokens import RefreshToken

from core.models import Usuario
from .serializers import RegisterSerializer, LoginSerializer, UsuarioProfileSerializer


@api_view(['POST'])
@permission_classes([AllowAny])
def register(request):
    serializer = RegisterSerializer(data=request.data)
    serializer.is_valid(raise_exception=True)
    usuario = serializer.save()

    # Generate JWT tokens
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
    serializer.is_valid(raise_exception=True)

    email = serializer.validated_data['email']
    contrasena = serializer.validated_data['contrasena']

    try:
        usuario = Usuario.objects.get(email=email)
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

    # Generate JWT tokens
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
    # Extract user from JWT token if present
    auth_header = request.headers.get('Authorization', '')
    if auth_header.startswith('Bearer '):
        try:
            from rest_framework_simplejwt.tokens import AccessToken
            token = AccessToken(auth_header.split(' ')[1])
            user_id = token.get('user_id')
            usuario = Usuario.objects.get(idusuario=user_id)
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
