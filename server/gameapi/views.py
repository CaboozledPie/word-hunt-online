from django.shortcuts import render
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import permissions, status
from .models import FrontendSession

# Create your views here.

@api_view(['GET'])
@permission_classes([permissions.AllowAny])
def get_frontend_token(request):
    session = FrontendSession.objects.create(expires_at=datetime.now() + timedelta(minutes=5))
    return Response({"token": str(session.token)})

# protected, only works with session
@api_view(['POST'])
@permission_clases([permissions.AllowAny])
def enter_matchmaking(request):
    # check session token manually
    token_str = request.headers.get("Authorization")
    if not token_str or not token_str.startswith("Bearer "):
        return Response({"error": "Missing token"}, status=status.HTTP_401_UNAUTHORIZED)
    token_str = token_str.split()[1]
    try:
        session = FrontendSession.objects.get(token=token_str)
    except FrontendSession.DoesNotExist:
        return Response({"error": "Invalid token"}, status=status.HTTP_401_UNAUTHORIZED)

    if session.expires_at < datetime.now():
        return Response({"error": "Token expired"}, status=status.HTTP_401_UNAUTHORIZED)

    # actually enter matchmaking
    return Response({"status": "Entered matchmaking successfully!"})
