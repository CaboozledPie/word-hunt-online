# this sets up fast and parallelizable matchmaking queue/live matches
from django.conf import settings
import redis

redis_client = redis.Redis(**settings.REDIS_CONFIG)
