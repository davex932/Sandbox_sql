from django.urls import path
from .views import execute_sql_view, session_list_create, get_or_join_session, search

urlpatterns = [
    path('execute/', execute_sql_view, name='execute_sql'),
    path('sessions/', session_list_create, name='session_list_create'),
    path('sessions/<uuid:session_id>/', get_or_join_session, name='get_or_join_session'),
    path('search/', search, name='search'),
]