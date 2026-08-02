**Overview:** simple demo: three backend servers + one round-robin proxy. Files and commands below.

- **`backend.py`**: tiny FastAPI app that returns which backend handled the request (reads `PORT` env var or hardcoded).  
  - Run three instances (each in its own terminal) so they listen on 8001, 8002, 8003.

- **`proxy.py`**: FastAPI proxy implementing round-robin (`servers` list + `round_robin()`), forwards incoming requests to backends using a shared `httpx.AsyncClient`, and returns backend responses. Returns 502 if a backend is unavailable.

- **Start backends** (open three terminals). Option A: set env var per terminal (PowerShell example):
```powershell
$env:PORT=8001; uvicorn backend:app --port 8001
$env:PORT=8002; uvicorn backend:app --port 8002
$env:PORT=8003; uvicorn backend:app --port 8003
```
Option B: edit `backend.py` to return a fixed port string, then run each with the matching `--port`.

- **Start proxy** (new terminal):
```bash
uvicorn proxy:app --port 8000
```

- **Test behavior**:
  - Single request:
  ```bash
  curl http://127.0.0.1:8000/foo
  ```
  - Repeat multiple times (e.g., 6 times). Expected: responses cycle among backends (8001 → 8002 → 8003 → 8001 ...). Each response body shows which backend served it.
  - If a backend is down, proxy returns HTTP 502 for requests routed to that backend.

- **What each command does**:
  - `uvicorn backend:app --port 8001` — starts one backend process listening on port 8001 and responding with its identity.
  - `uvicorn proxy:app --port 8000` — starts the load‑balancer/proxy on port 8000; it accepts client requests and forwards them to backends using round‑robin.
  - `curl http://127.0.0.1:8000/foo` — sends a request to the proxy; the proxy forwards it to one backend and returns that backend's response.

Files:

backend.py — tiny FastAPI app that returns its PORT identity.
proxy.py — round‑robin load balancer using httpx.AsyncClient and round_robin() logic.

Client ---> Proxy(8000) ---> round_robin() ---> Backend(8001)
| ^
| |
|---> Backend(8002) |
| |
|---> Backend(8003) |
|
v
Responses
|
v
Proxy(8000) ---> Client

Expanded linear flow: