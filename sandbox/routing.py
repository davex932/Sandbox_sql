from django.urls import re_path
from . import consumers

websocket_urlpatterns = [
    # Supporte un UUID avec ou sans slash de fin, avec ou sans "ws/"
    re_path(r'^ws/sandbox/(?P<room_name>[0-9a-f-]+)/?$', consumers.SandboxConsumer.as_asgi()),
]