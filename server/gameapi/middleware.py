from urllib.parse import parse_qs
from channels.db import database_sync_to_async
from django.contrib.auth.models import AnonymousUser
from gameapi.models import FrontendSession  # wherever you defined it


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

    def __call__(self, scope):
        return TokenAuthMiddlewareInstance(scope, self.inner)


class TokenAuthMiddlewareInstance:
    def __init__(self, scope, inner):
        self.scope = dict(scope)
        self.inner = inner

    async def __call__(self, receive, send):
        query_string = self.scope.get("query_string", b"").decode()
        params = parse_qs(query_string)
        token = params.get("token", [None])[0]

        if token:
            session = await get_session(token)
            if session:
                self.scope["session"] = session
            else:
                self.scope["session"] = None
        else:
            self.scope["session"] = None

        inner = self.inner(self.scope)
        return await inner(receive, send)
