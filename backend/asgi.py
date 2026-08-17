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

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'backend.settings')

django_asgi_app = get_asgi_application()

import sandbox.routing

application = ProtocolTypeRouter({
    "http": django_asgi_app,

    # AllowedHostsOriginValidator retiré : il bloquait les connexions WebSocket
    # cross-origin venant de Vercel car le domaine Vercel n'est pas dans ALLOWED_HOSTS.
    # La sécurité cross-origin est gérée via CORS_ALLOWED_ORIGINS dans settings.py.
    "websocket": AuthMiddlewareStack(
        URLRouter(
            sandbox.routing.websocket_urlpatterns
        )
    ),
})
