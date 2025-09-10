from channels.generic.websocket import AsyncWebsocketConsumer
from django.utils.timezone import now
from .redis_client import redis_client
import json

class GameConsumer(AsyncWebsocketConsumer):
    async def connect(self):
        session = self.scope.get("session") 
        if not session:
            await self.close()
            return
        
        self.player_id = str(session.token) # session id!
        self.match_id = str(self.scope["url_route"]["kwargs"]["match_id"])
        self.last_seen = now().timestamp() # saved as a float!

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
        print(f"heartbeat from {self.player_id}")
        # broadcast to group
        match data.get("type"):
            case "heartbeat": # this'll be big because any constant polls are on this
                # update self.last_seen
                self.last_seen = now().timestamp()
                
                # grab match, update last_seen
                match = json.loads(redis_client.hget("matches:unranked", self.match_id))
                match["players"][self.player_id]["last_seen"] = self.last_seen
                
                # check now if other player is dc'd/start game
                for player in match["players"].keys():
                    if player == self.player_id: # can't check for your own dc
                        continue
                    if match["active"]: # so neither last_seen is None
                        other_player = match["players"][player]
                        if now().timestamp() - other_player["last_seen"] > 10 and  not other_player["finished"]:
                            await self.channel_layer.group_send(
                                self.match_id,
                                {
                                    "type": "opponent_disconnect",
                                    "player": player,
                                }
                            )
                            match["players"][player]["finished"] = True
                    else: # start game if both players have sent over a heartbeat
                        if match["players"][player]["last_seen"]: # not None
                            match["active"] = True
                
                # save changes on redis
                redis_client.hset("matches:unranked", self.match_id, json.dumps(match))

            case "foundWord":
                word_info = data.get("info", {})
                await self.channel_layer.group_send(
                    self.match_id,
                    {
                        "type": "found_word",
                        "player": str(self.scope["session"].token),
                        "data": word_info, 
                    }
                )
            case _: # placeholder/default
                await self.channel_layer.group_send(
                    self.match_id,
                    {
                        "type": "misc",
                        "player": str(self.scope["session"].token),
                        "data": data["data"], # dunno if thisll even work 
                    }
                )

    # following functions called on self.channel_layer.group_send()
    async def found_word(self, event):
        await self.send(text_data=json.dumps({
            "event": "foundWord",
            "player": event["player"],
            "word_info": event["data"]
        }))

    async def opponent_disconnect(self, event):
        await self.send(text_data=json.dumps({
            "event": "opponent_disconnect",
            "player": event["player"],
        }))
