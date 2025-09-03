from channels.generic.websocket import AsyncWebsocketConsumer
import json

class GameConsumer(AsyncWebsocketConsumer):
    async def connect(self):
        session = self.scope.get("session") 
        if not session:
            await self.close()
            return
        
        self.player_id = session.token # session id!
        self.match_id = self.scope["url_route"]["kwargs"]["match_id"]
        self.last_seen = now()

        # join room group
        await self.channel_layer.group_add(
            self.match_id,
            self.channel_name
        )
        await self.accept()

    async def disconnect(self, close_code):
        await self.channel_layer.group_discard(
            self.match_id,
            self.channel_name
        )

    async def receive(self, text_data):
        data = json.loads(text_data)
        
        # broadcast to group
        if data.get("type") = "heartbeat":
            self.last_seen = now()
        else:
            await self.channel_layer.group_send(
                self.match_id,
                {
                    "type": "game_message",
                    "message": data["message"]
                }
            )

    async def game_message(self, event):
        await self.send(text_data=json.dumps({
            "message": event["message"]
        }))
