from django.urls import path
from . import views

urlpatterns = [
    path("enter_matchmaking/", views.enter_matchmaking.as_view(), name="enter_matchmaking"),
    path("init/", views.get_frontend_token.as_view(), name="init")
]
