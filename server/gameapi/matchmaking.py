import threading

unranked_matchmaking_queue = []
ranked_matchmaking_queue = []

queue_lock = threading.Lock()

class MatchmakingEntry:
    def __init__(self, session, account):
        self.session = session
        self.account = account

def unranked_add_to_queue(token, account = None):
    with queue_lock:
        if token not in unranked_matchmaking_queue:
            unranked_matchmaking_queue.append(MatchmakingEntry(token, account))

def unranked_remove_from_queue(token):
    with queue_lock:
        for i in unranked_matchmaking_queue:
            if token == i.session:
                unranked_matchmaking_queue.pop(i)

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
        time.sleep(1)

threading.Thread(target=unranked_matchmaker_loop, daemon=True).start()
