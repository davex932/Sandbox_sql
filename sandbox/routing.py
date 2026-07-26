# sandbox/routing.py

from django.urls import re_path
from . import consumers

websocket_urlpatterns = [
    # On ajoute bien .as_asgi() ici !
    re_path(r'^ws/sandbox/(?P<room_name>\w+)/$', consumers.SandboxConsumer.as_asgi()),
]