from rest_framework import status
from rest_framework.test import APITestCase

from core.models import Usuario


class AuthEndpointsTests(APITestCase):
    def test_register_returns_success_payload(self):
        response = self.client.post(
            '/api/auth/register/',
            {
                'nombre': 'Maria Solar',
                'email': 'Maria.Solar@Example.com',
                'contrasena': 'claveSegura123',
            },
            format='json',
        )

        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertTrue(response.data['success'])
        self.assertEqual(response.data['user']['email'], 'maria.solar@example.com')
        self.assertIn('access', response.data['tokens'])
        self.assertTrue(Usuario.objects.filter(email='maria.solar@example.com').exists())

    def test_register_duplicate_email_is_case_insensitive(self):
        Usuario.objects.create(
            nombre='Maria Solar',
            email='maria.solar@example.com',
            contrasena='claveSegura123',
        )

        response = self.client.post(
            '/api/auth/register/',
            {
                'nombre': 'Otra Maria',
                'email': 'MARIA.SOLAR@example.com',
                'contrasena': 'claveSegura123',
            },
            format='json',
        )

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertFalse(response.data['success'])
        self.assertEqual(response.data['error'], 'Ya existe un usuario con este email.')
        self.assertIn('email', response.data['errors'])

    def test_login_accepts_case_insensitive_email(self):
        Usuario.objects.create(
            nombre='Carlos Energia',
            email='carlos@example.com',
            contrasena='claveSegura123',
        )

        response = self.client.post(
            '/api/auth/login/',
            {
                'email': 'CARLOS@EXAMPLE.COM',
                'contrasena': 'claveSegura123',
            },
            format='json',
        )

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertTrue(response.data['success'])
        self.assertEqual(response.data['user']['email'], 'carlos@example.com')
        self.assertIn('access', response.data['tokens'])

    def test_login_validation_error_includes_error_summary(self):
        response = self.client.post(
            '/api/auth/login/',
            {
                'email': 'correo-invalido',
                'contrasena': 'claveSegura123',
            },
            format='json',
        )

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertFalse(response.data['success'])
        self.assertIn('correo', response.data['error'].lower())
        self.assertIn('email', response.data['errors'])
