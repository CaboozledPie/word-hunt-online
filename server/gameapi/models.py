from django.db import models
from django.contrib.auth.models import User
import uuid
from datetime import datetime, timedelta

def session_token_expiration():
    return datetime.now() + timedelta(days=1)

# Create your models here.

class FrontendSession(models.Model):
    token = models.UUIDField(default=uuid.uuid4, unique=True, editable=False)
    created_at = models.DateTimeField(auto_now_add=True)
    expires_at = models.DateTimeField(default=session_token_expiration)
