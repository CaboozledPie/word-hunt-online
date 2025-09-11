from django.shortcuts import render
from rest_framework.views import APIView
from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
from rest_framework import permissions, status
from django.utils import timezone
from django.views.decorators.csrf import csrf_exempt

from .models import FrontendSession
from .matchmaking import unranked_add_to_queue, unranked_remove_from_queue, find_match_from_token, find_match_from_id
from .redis_client import redis_client

import json

# Create your views here.

@api_view(['GET'])
@permission_classes([permissions.AllowAny])
def get_frontend_token(request):
    FrontendSession.objects.filter(expires_at__lt=timezone.now()).delete() # clear expired tokens every time a new one is made
    session = FrontendSession.objects.create()
    return Response({"token": str(session.token)})


def verify_token(token):
    if not token or not token.startswith("Bearer "):
        return Response({"error": "Missing token"}, status=status.HTTP_401_UNAUTHORIZED)
    token = token.split()[1]
    try:
        session = FrontendSession.objects.get(token=token)
    except FrontendSession.DoesNotExist:
        return Response({"error": "Invalid token"}, status=status.HTTP_401_UNAUTHORIZED)

    if session.expires_at < timezone.now():
        return Response({"error": "Token expired"}, status=status.HTTP_401_UNAUTHORIZED)
    return Response({"status": "Token valid!"})

@csrf_exempt
@api_view(['GET'])
@permission_classes([permissions.AllowAny])
def valid_token(request):
    token_str = request.headers.get("Authorization")
    token_status = verify_token(token_str)
    return Response({"status": token_status.status_code == 200})

@csrf_exempt
@api_view(['POST'])
@permission_classes([permissions.AllowAny])
def enter_matchmaking(request):
    # check session token manually
    token_str = request.headers.get("Authorization")
    print("Auth received: ", token_str)
    token_status = verify_token(token_str)
    if token_status.status_code != 200:
        return token_status
    token_str = token_str.split()[1]
    
    # actually enter matchmaking
    unranked_add_to_queue(token_str, None)

    return Response({"status": "Entered matchmaking successfully!"})

@csrf_exempt
@api_view(['POST'])
@permission_classes([permissions.AllowAny])
def exit_matchmaking(request):
    token_str = "Bearer " + json.loads(request.body.decode("utf-8")).get("token")
    token_status = verify_token(token_str)
    if token_status.status_code != 200:
        return token_status
    token_str = token_str.split()[1]

    # exit matchmaking
    unranked_remove_from_queue(token_str)

    return Response({"status": "Exited matchmaking successfully."})

@csrf_exempt
@api_view(['GET'])
@permission_classes([permissions.AllowAny])
def matchmaking_status(request):
    token_str = request.headers.get("Authorization")
    print("Auth received: ", token_str)
    token_status = verify_token(token_str)
    if token_status.status_code != 200:
        return token_status
    token_str = token_str.split()[1]
    match = find_match_from_token(token_str)
    if match:
        return Response({"status": "matched", "match_id": match["match_id"]})
    return Response({"status": "waiting"})

@csrf_exempt
@api_view(['GET'])
@permission_classes([permissions.AllowAny])
def get_match(request):
    token_str = request.headers.get("Authorization")
    token_status = verify_token(token_str)
    if token_status.status_code != 200:
        return token_status
    token_str = token_str.split()[1]
    match_id = request.headers.get("matchId")
    match = find_match_from_id(match_id)
    if not match:
        return Response({"error": "no match with given token in get_seed()"})
    if match["players"][token_str]["finished"]:
        print("player finished fail")
        return Response({"error": "can't grab seed, player has already finished game"})
    if token_str not in match["players"]:
        print("player not found fail")
        return Response({"error": "can't grab seed, player not found in match"})
    return Response({"data": match})

@csrf_exempt
@api_view(['POST'])
@permission_classes([permissions.AllowAny])
def exit_match(request): # currently useless but ill keep it for now
    token_str = "Bearer " + json.loads(request.body.decode("utf-8")).get("token")
    token_status = verify_token(token_str)
    if token_status.status_code != 200:
        return token_status
    token_str = token_str.split()[1]

    return Response({"status": "Exited match successfully."})
