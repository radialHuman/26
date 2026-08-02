from fastapi import FastAPI, Request, Response, status  # web framework and types
import httpx  # async HTTP client used to forward requests to backends

# List of backend servers the proxy will round-robin across
servers = ["http://127.0.0.1:8001", "http://127.0.0.1:8002", "http://127.0.0.1:8003"]

# Simple shared counter used by the round-robin selector
index = 0

# Create FastAPI app
app = FastAPI()

# Create a single AsyncClient instance to reuse connections
client = httpx.AsyncClient()


def round_robin():
    """Return the next backend URL using round-robin.

    Uses a global `index` counter and modulus to cycle through `servers`.
    """
    global index
    # pick server based on current index
    s = servers[index % len(servers)]
    # advance the counter for the next call
    index += 1
    return s


# --- Alternative server selection strategies ---
import random
import hashlib

# For weighted round-robin: parallel list of weights matching `servers`.
# Example: [3,2,1] means servers[0] should get ~50% of traffic, then servers[1], then servers[2].
weights = [1 for _ in servers]
weights = [3,2,1]
_w_index = 0

def weighted_round_robin():
    """Simple weighted round-robin using a repeating counter.

    Not the most efficient or fair implementation, but easy to understand:
    it treats each server as if it appears `weight` times in the rotation.
    """
    global _w_index
    # build a flat list where servers appear `weight` times
    flat = []
    for s, w in zip(servers, weights):
        flat.extend([s] * max(0, int(w)))
    if not flat:
        return round_robin()
    s = flat[_w_index % len(flat)]
    _w_index += 1
    return s


# Least-connections: track active request counts per backend and pick the smallest.
active_connections = {s: 0 for s in servers}

def pick_least_connections():
    """Pick the server with the fewest active connections.

    NOTE: This simple version does not increment/decrement automatically —
    you should increment before forwarding and decrement after the response completes.
    """
    # return the server with minimum active count
    return min(active_connections.items(), key=lambda kv: kv[1])[0]


def pick_random():
    """Return a random backend URL."""
    return random.choice(servers)


def pick_consistent_hash(key: str):
    """Simple consistent-hash-like pick: hash the provided key and map to a server.

    Use this for sticky routing (e.g., client IP, session id). This is not a full
    consistent-hash ring implementation but demonstrates the idea.
    """
    h = hashlib.md5(key.encode()).hexdigest()
    n = int(h, 16)
    return servers[n % len(servers)]


@app.api_route("/{path:path}", methods=["GET", "POST"])
async def proxy(path: str, request: Request):
    """Proxy endpoint that forwards incoming requests to a backend.

    - `path` captures the full requested path (including slashes).
    - Reads the request body and headers and forwards them to the chosen backend.
    - Returns backend response content and status back to the client.
    - If the backend is unreachable, returns HTTP 502.
    """
    # read raw request body (works for GET/POST; for large bodies consider streaming)
    body = await request.body()
    # copy headers into a plain dict so httpx can use them
    headers = dict(request.headers)

    # choose a backend using round-robin
    backend_url = weighted_round_robin()

    try:
        # make the request to the selected backend, forwarding method, path, headers and body
        resp = await client.request(
            request.method,
            f"{backend_url}/{path}",
            content=body,
            headers=headers,
            timeout=3.0,
        )
    except httpx.ConnectError:
        # backend not reachable — return a 502 Bad Gateway
        return Response("Bad Gateway", status_code=status.HTTP_502_BAD_GATEWAY)

    # return backend response content and status code, and forward its headers
    return Response(content=resp.content, status_code=resp.status_code, headers=dict(resp.headers))