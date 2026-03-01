from django.urls import re_path
from . import consumers

websocket_urlpatterns = [
    re_path(r'ws/sensor/(?P<domicilio_id>\d+)/$', consumers.SensorConsumer.as_asgi()),
]