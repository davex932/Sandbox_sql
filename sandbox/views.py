from rest_framework import status, permissions
from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
from django.shortcuts import get_object_or_404
from .models import SandboxSession
from .serializers import SandboxSessionSerializer
from .executor import execute_sql_query


# Create your views here.

@api_view(['POST', 'GET'])
@permission_classes([permissions.IsAuthenticated])
def session_list_create(request):

    if request.method == 'POST':

        data= request.data
        data['creator']= request.user.id
        data['participants']= [request.user.id]  # Add the creator to the participants list
        sandbox_session_serialized= SandboxSessionSerializer(data=data)
        if sandbox_session_serialized.is_valid():

            sandbox_session_serialized.save()
            return Response(sandbox_session_serialized.data, status=status.HTTP_201_CREATED)
        
        return Response(sandbox_session_serialized.errors, status=status.HTTP_400_BAD_REQUEST)

    elif request.method == 'GET':

        sessions = SandboxSession.objects.filter(creator=request.user) | SandboxSession.objects.filter(participants=request.user)
        sessions = sessions.distinct().order_by('-updated_at')
        serializer = SandboxSessionSerializer(sessions, many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)

@api_view(['GET'])
@permission_classes([permissions.IsAuthenticated])
def get_or_join_session(request, session_id):
    session = get_object_or_404(SandboxSession, id=session_id)
    if request.user not in session.participants.all():
        session.participants.add(request.user)

    serializer = SandboxSessionSerializer(session)
    return Response(serializer.data, status=status.HTTP_200_OK)

@api_view(['POST'])
@permission_classes([permissions.IsAuthenticated])
def execute_sql_view(request):
    room_name = request.data.get('room_name')
    sql_code = request.data.get('code', '')

    if not sql_code:
        return Response({'success': False, 'error': 'Aucun code SQL fourni.'}, status=400)

    # Sauvegarde du dernier état du code dans la session en base de données
    try:
        session = SandboxSession.objects.get(id=room_name)
        session.last_code = sql_code
        session.save()
    except (SandboxSession.DoesNotExist, ValueError):
        return Response({'error': 'Session non trouvée.'}, status= status.HTTP_404_NOT_FOUND)

    # Exécution dans le fichier SQLite du salon
    result = execute_sql_query(str(room_name), sql_code)
    return Response(result, status=status.HTTP_200_OK)

@api_view(['POST', 'GET'])
@permission_classes([permissions.IsAuthenticated])
def search(request):
    query= request.GET.get('q', '')

    if query:
        sandBoxSession= SandboxSession.objects.filter(name__icontains= query).distinct().order_by('-updated_at')

        sandBoxSession_serialized= SandboxSessionSerializer(sandBoxSession, many=True)
        return Response(sandBoxSession_serialized.data, status= status.HTTP_200_OK)
    else:
        return Response({'error': 'Aucune requête de recherche fournie.'}, status= status.HTTP_400_BAD_REQUEST)
    