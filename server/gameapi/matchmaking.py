import threading
import uuid
import time

unranked_matchmaking_queue = []
ranked_matchmaking_queue = []

unranked_matches = []

queue_lock = threading.Lock()

class MatchmakingEntry:
    def __init__(self, session: str, account: str):
        self.session = session
        self.account = account # if None, block from ranked

class UnrankedMatch:
    def __init__(self, player1: MatchmakingEntry, player2: MatchmakingEntry):
        self.id = f"match_{uuid.uuid4()}"
        self.player1 = player1
        self.player2 = player2
        self.started = False
        self.Board = None

def unranked_add_to_queue(token, account = None):
    with queue_lock:
        if token not in unranked_matchmaking_queue:
            unranked_matchmaking_queue.append(MatchmakingEntry(token, account))

def unranked_remove_from_queue(token):
    with queue_lock:
        for i in unranked_matchmaking_queue:
            if token == i.session:
                unranked_matchmaking_queue.remove(i)

def unranked_get_queue():
    with queue_lock:
        return list(unranked_matchmaking_queue)

def unranked_matchmaker_loop():
    while True:
        with queue_lock:
            while len(unranked_matchmaking_queue) >= 2:
                player1 = unranked_matchmaking_queue.pop(0)
                player2 = unranked_matchmaking_queue.pop(0)
                print(f"Matched {player1.session} vs {player2.session}")
                unranked_matches.append(UnrankedMatch(player1, player2))
        time.sleep(5)

def find_match_from_token(token: str):
    for match in unranked_matches:
        print(match.player1.session, match.player2.session)
        if match.player1.session == token or match.player2.session == token:
            return match.id
    return 0



threading.Thread(target=unranked_matchmaker_loop, daemon=True).start()
