"""
ASGI config for backend project.

It exposes the ASGI callable as a module-level variable named ``application``.

For more information on this file, see
https://docs.djangoproject.com/en/6.0/howto/deployment/asgi/
"""

# backend/asgi.py

# backend/asgi.py

import os
from django.core.asgi import get_asgi_application
from channels.routing import ProtocolTypeRouter, URLRouter
from channels.auth import AuthMiddlewareStack
from channels.security.websocket import AllowedHostsOriginValidator  # <-- AJOUTE CET IMPORT

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'backend.settings')

django_asgi_app = get_asgi_application()

import sandbox.routing 

application = ProtocolTypeRouter({
    "http": django_asgi_app,
    
    # On enveloppe l'AuthMiddlewareStack avec AllowedHostsOriginValidator
    # pour autoriser les connexions provenant de localhost / 127.0.0.1
    "websocket": AllowedHostsOriginValidator(
        AuthMiddlewareStack(
            URLRouter(
                sandbox.routing.websocket_urlpatterns
            )
        )
    ),
})
