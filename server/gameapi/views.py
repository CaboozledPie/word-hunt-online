from django.shortcuts import render
from rest_framework.views import APIView
from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
from rest_framework import permissions, status
from django.utils import timezone
from django.views.decorators.csrf import csrf_exempt

from .models import FrontendSession
from .matchmaking import unranked_add_to_queue, unranked_remove_from_queue

# Create your views here.

@api_view(['GET'])
@permission_classes([permissions.AllowAny])
def get_frontend_token(request):
    FrontendSession.objects.filter(expires_at__lt=timezone.now()).delete() # clear expired tokens every time a new one is made
    session = FrontendSession.objects.create()
    return Response({"token": str(session.token)})

# protected, only works with session
@csrf_exempt
@api_view(['POST'])
@permission_classes([permissions.AllowAny])
def enter_matchmaking(request):
    print("hi")
    # check session token manually
    token_str = request.headers.get("Authorization")
    print("Auth received: ", token_str)
    if not token_str or not token_str.startswith("Bearer "):
        return Response({"error": "Missing token"}, status=status.HTTP_401_UNAUTHORIZED)
    token_str = token_str.split()[1]
    try:
        session = FrontendSession.objects.get(token=token_str)
    except FrontendSession.DoesNotExist:
        return Response({"error": "Invalid token"}, status=status.HTTP_401_UNAUTHORIZED)

    if session.expires_at < timezone.now():
        return Response({"error": "Token expired"}, status=status.HTTP_401_UNAUTHORIZED)

    # actually enter matchmaking
    unranked_add_to_queue(token_str, None)

    return Response({"status": "Entered matchmaking successfully!"})
