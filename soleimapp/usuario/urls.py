from django.urls import path

from . import views

urlpatterns = [
    path("api/auth/register/", views.register, name="auth_register"),
    path(
        "api/auth/registrar-con-codigo/",
        views.registrar_con_codigo,
        name="auth_register_con_codigo",
    ),
    path(
        "api/auth/registrar-cliente-con-codigo/",
        views.registrar_cliente_con_codigo,
        name="auth_register_cliente_con_codigo",
    ),
    path("api/auth/login/", views.login, name="auth_login"),
    path("api/auth/logout/", views.logout, name="auth_logout"),
    path(
        "api/auth/refresh/",
        views.CoreUsuarioTokenRefreshView.as_view(),
        name="auth_refresh",
    ),
    path("api/auth/me/", views.me, name="auth_me"),
]
