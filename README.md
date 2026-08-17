# Sandbox_sql

Un projet de laboratoire (sandbox) pour expérimentations SQL avec une API Django (ASGI) + websockets et une interface frontend en React (Vite + Monaco). Conçu pour prototyper l'exécution sécurisée de requêtes SQL, des interactions en temps réel via websockets, et pour tester des UI d'édition de code.

## Ce que c'est
Une application full‑stack composée d'un backend Django (ASGI) exposant :
- une API REST protégée (djoser + SimpleJWT) (routes `/auth/`),
- des endpoints applicatifs pour la sandbox sous `/api/sandbox/`,
- des connexions WebSocket (Django Channels) pour interactions temps réel.

Le frontend est une SPA React (Vite) qui embarque Monaco Editor pour éditer/visualiser du SQL.

### Stack
- Language(s) : JavaScript (frontend), Python (backend), CSS (styles)
- Framework / runtime : Django 6.x (ASGI) + Django Channels, React (Vite)
- Notable libraries :
  - Backend : channels, daphne (ASGI server), djoser, djangorestframework, rest_framework_simplejwt, dj_database_url
  - Frontend : react, @monaco-editor/react, vite

## Arborescence (top-level)
```text
backend/           # Django project (asgi.py, settings.py, urls.py, wsgi.py)
sandbox/           # Django app : models, views, serializers, consumers, executor, routing
frontend/          # React app (Vite) : package.json, src/, public/, vite.config.js, vercel.json
manage.py          # utilitaire Django
requirements.txt   # dépendances Python
build.sh           # script utilitaire (présent à la racine)
.gitignore
