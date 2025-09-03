from django.urls import path
from . import views

urlpatterns = [
    path("enter_matchmaking/", views.enter_matchmaking, name="enter_matchmaking"),
    path("exit_matchmaking/", views.exit_matchmaking, name="exit_matchmaking"),
    path("matchmaking_status/", views.matchmaking_status, name="matchmaking_status"),
    path("get_seed/", views.get_seed, name="get_seed"),
    path("init/", views.get_frontend_token, name="init")
]
