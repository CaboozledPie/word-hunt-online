from django.conf import settings
from django.utils import timezone
import threading
import uuid
import time
import random
import json
from .redis_client import redis_client

#redis_client.rpush("queue:ranked")
#redis_client.rpush("matches:ranked")


def create_match(player1, player2, duration = 80): # this models what a data is in a match. SUBJECT TO CHANGE 
    ret_dict = {
        "match_id": f"match_{uuid.uuid4()}",
        "players": {
            player1["session"]: {
                "finished": False,
                "last_seen": None,
                "score": 0,
                "word_count": 0,
                "found_words": [],
            },
            player2["session"]: {
                "finished": False,
                "last_seen": None,
                "score": 0,
                "word_count": 0,
                "found_words": [],
            },
        },
        "accounts": {
            player1["session"]: player1["account"],
            player2["session"]: player2["account"],
        },
        "active": False,
        "seed": "",
        "start_time": timezone.now().timestamp(),
        "duration": duration,
    }
    for i in range(16): # this assumes 4x4 board dim! subject to change
        ret_dict["seed"] += '%02d' % random.randint(0, 99 - i)
    return ret_dict

def unranked_add_to_queue(token, account=None):
    raw = redis_client.hget("queue:unranked", token)
    if raw is None:
        matchmaking_entry = {
            "session": token,
            "account": account,
        }
        redis_client.hset("queue:unranked", token, json.dumps(matchmaking_entry))

def unranked_remove_from_queue(token):
    redis_client.hdel("queue:unranked", token)

def unranked_get_queue():
    return redis_client.smembers("queue:unranked")

def unranked_matchmaker_loop():
    while True:
        queue_keys = redis_client.hkeys("queue:unranked")
        while len(queue_keys) >= 2:
            key1, key2 = queue_keys[:2]
            player1_raw = redis_client.hget("queue:unranked", key1)
            player2_raw = redis_client.hget("queue:unranked", key2)

            player1 = json.loads(player1_raw)
            player2 = json.loads(player2_raw)

            print(f"Matched {player1['session']} vs {player2['session']}")

            redis_client.hdel("queue:unranked", key1, key2)

            match = create_match(player1, player2)
            redis_client.hset("matches:unranked", match["match_id"], json.dumps(match))

            # allow for quick indexing from player
            redis_client.hset("matches:players", player1["session"], match["match_id"])
            redis_client.hset("matches:players", player2["session"], match["match_id"])
            
            queue_keys = redis_client.hkeys("queue:unranked")
        time.sleep(5)

def find_match_from_token(token: str): # find match from PLAYER token
    match_id = redis_client.hget("matches:players", token)
    if not match_id:
        return False
    match = json.loads(redis_client.hget("matches:unranked", match_id))
    if (not match):
        return False
    return match

def find_match_from_id(match_id: str):
    match = json.loads(redis_client.hget("matches:unranked", match_id))
    if (not match):
        return False
    return match

threading.Thread(target=unranked_matchmaker_loop, daemon=True).start()
