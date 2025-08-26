from django.db import models
from django.contrib.auth.models import User
import uuid
from datetime import datetime, timedelta

# Create your models here.

class FrontendSession(models.Model):
    token = models.UUIDField(default=uuid.uuid4, unique=True, editable=False)
    created_at = models.DateTimeField(auto_now_add=True)
    expires_at = models.DateTimeField(default=lambda: datetime.now() + timedelta(minutes=5))
    user = models.ForeignKey(User, null=True, blank=True, on_delete=models.SET_NULL)
