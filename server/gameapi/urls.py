from django.urls import path
from . import views

urlpatterns = [
    path("enter_matchmaking/", views.enter_matchmaking, name="enter_matchmaking"),
    path("init/", views.get_frontend_token, name="init")
]
