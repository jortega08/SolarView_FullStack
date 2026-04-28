"""
Tests for the OrdenTrabajo state-machine workflow.
"""
import pytest
from django.contrib.auth.hashers import make_password
from rest_framework.test import APIClient
from rest_framework_simplejwt.tokens import RefreshToken


def _client_for(user):
    c = APIClient()
    refresh = RefreshToken.for_user(user)
    c.credentials(HTTP_AUTHORIZATION=f'Bearer {str(refresh.access_token)}')
    return c


@pytest.fixture
def tecnico(db):
    from core.models import Usuario
    return Usuario.objects.create(
        nombre='Tecnico Test', email='tecnico@t.co',
        contrasena=make_password('Password1!'),
        rol='user', is_active=True,
    )


@pytest.fixture
def orden_abierta(db, instalacion, admin_usuario):
    from ordenes.models import OrdenTrabajo
    return OrdenTrabajo.objects.create(
        instalacion=instalacion,
        tipo='correctivo', prioridad='alta', estado='abierta',
        titulo='Panel dañado',
        creado_por=admin_usuario,
        sla_objetivo_horas=8,
    )


@pytest.mark.django_db
class TestOrdenWorkflow:
    def test_asignar_orden(self, orden_abierta, tecnico, admin_client):
        url = f'/api/ordenes/ordenes/{orden_abierta.idorden}/asignar/'
        resp = admin_client.post(url, {'tecnico_id': tecnico.idusuario}, format='json')
        assert resp.status_code == 200, resp.data
        orden_abierta.refresh_from_db()
        assert orden_abierta.estado == 'asignada'
        assert orden_abierta.asignado_a_id == tecnico.idusuario

    def test_iniciar_orden(self, orden_abierta, tecnico, admin_client):
        # First assign
        admin_client.post(
            f'/api/ordenes/ordenes/{orden_abierta.idorden}/asignar/',
            {'tecnico_id': tecnico.idusuario}, format='json',
        )
        # Then initiate as the assigned technician
        tecnico_client = _client_for(tecnico)
        resp = tecnico_client.post(f'/api/ordenes/ordenes/{orden_abierta.idorden}/iniciar/')
        assert resp.status_code == 200, resp.data
        orden_abierta.refresh_from_db()
        assert orden_abierta.estado == 'en_progreso'

    def test_completar_orden(self, orden_abierta, tecnico, admin_client):
        admin_client.post(
            f'/api/ordenes/ordenes/{orden_abierta.idorden}/asignar/',
            {'tecnico_id': tecnico.idusuario}, format='json',
        )
        tecnico_client = _client_for(tecnico)
        tecnico_client.post(f'/api/ordenes/ordenes/{orden_abierta.idorden}/iniciar/')
        resp = tecnico_client.post(
            f'/api/ordenes/ordenes/{orden_abierta.idorden}/completar/',
            {'notas_resolucion': 'Panel reemplazado.'},
            format='json',
        )
        assert resp.status_code == 200, resp.data
        orden_abierta.refresh_from_db()
        assert orden_abierta.estado == 'completada'

    def test_comentarios_estado_auto_generated(self, orden_abierta, tecnico, admin_client):
        """State changes must auto-create ComentarioOrden(tipo='cambio_estado')."""
        admin_client.post(
            f'/api/ordenes/ordenes/{orden_abierta.idorden}/asignar/',
            {'tecnico_id': tecnico.idusuario}, format='json',
        )
        from ordenes.models import ComentarioOrden
        comments = ComentarioOrden.objects.filter(
            orden=orden_abierta, tipo='cambio_estado',
        )
        assert comments.exists()

    def test_unauthenticated_blocked(self, orden_abierta):
        from rest_framework.test import APIClient
        anon = APIClient()
        resp = anon.get(f'/api/ordenes/ordenes/{orden_abierta.idorden}/')
        assert resp.status_code in (401, 403)
