from django.urls import path
from . import views

urlpatterns = [
    path("valid_token/", views.valid_token, name="valid_token"),
    path("enter_matchmaking/", views.enter_matchmaking, name="enter_matchmaking"),
    path("exit_matchmaking/", views.exit_matchmaking, name="exit_matchmaking"),
    path("matchmaking_status/", views.matchmaking_status, name="matchmaking_status"),
    path("get_match/", views.get_match, name="get_match"),
    path("exit_match/", views.exit_match, name="exit_match"),
    path("init/", views.get_frontend_token, name="init")
]
