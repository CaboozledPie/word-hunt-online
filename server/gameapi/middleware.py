from urllib.parse import parse_qs
from channels.db import database_sync_to_async
from django.contrib.auth.models import AnonymousUser
from django.utils import timezone
from gameapi.models import FrontendSession

@database_sync_to_async
def get_session(token_str):
    try:
        return FrontendSession.objects.get(token=token_str)
    except FrontendSession.DoesNotExist:
        return None


class TokenAuthMiddleware:
    # middleware that attaches the session token from url to scope

    def __init__(self, inner):
        self.inner = inner
    
    async def __call__(self, scope, receive, send):
        # parse token from query string
        query_string = scope.get("query_string", b"").decode()
        params = parse_qs(query_string)
        token = params.get("token", [None])[0]

        scope["session"] = None
        if token:
            session = await self._get_session(token)
            if session:
                scope["session"] = session

        return await self.inner(scope, receive, send)

    @database_sync_to_async
    def _get_session(self, token):
        try:
            return FrontendSession.objects.get(
                token=token,
                expires_at__gt=timezone.now()
            )
        except FrontendSession.DoesNotExist:
            return None
