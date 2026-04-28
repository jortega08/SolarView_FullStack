from django.urls import path
from rest_framework_simplejwt.views import TokenRefreshView

from . import views

urlpatterns = [
    path("api/auth/register/", views.register, name="auth_register"),
    path("api/auth/login/", views.login, name="auth_login"),
    path("api/auth/logout/", views.logout, name="auth_logout"),
    path("api/auth/refresh/", TokenRefreshView.as_view(), name="auth_refresh"),
    path("api/auth/me/", views.me, name="auth_me"),
]
