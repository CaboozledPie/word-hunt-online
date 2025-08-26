from django.db import models
from django.contrib.auth.models import User
import uuid
from datetime import datetime, timedelta

# Create your models here.

class Post(models.Model):
    title = models.CharField(max_length=200)
    body = models.TextField()
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return self.title
