# Long Polling + Server-Sent Events (SSE)

## What it is
Two alternatives to WebSocket for server-to-client push. **Long polling**: client makes a request; server holds it open until data is available, then responds; client immediately re-requests. **SSE**: server holds a single HTTP connection open and streams events as `text/event-stream` data indefinitely.

## Why it matters
WebSocket isn't always available (some proxies strip it, some environments don't support it). SSE is a simpler protocol for one-directional updates (server → client). Interviewers ask "how would you implement notifications/live updates without WebSocket?" SSE is the practical answer.

## What to know before starting
- Standard HTTP request/response vs. streaming responses
- What chunked transfer encoding is: server sends data in pieces without knowing the total length
- Python's `asyncio` and `async generators`

## How to approach it
**Long polling**: Client sends `GET /updates`. Server waits (up to 30s) for an event. On event: respond with data and close. Client immediately re-requests. On timeout: respond with empty and client re-requests. Simulates push over regular HTTP.

**SSE**: Server responds with `Content-Type: text/event-stream`. Sends `data: {...}\n\n` whenever an event occurs. Connection stays open. Browser's `EventSource` API handles reconnection automatically.

## What to build (minimal working version)
- Long poll: `GET /poll?last_id=N` — server waits up to 30s for a message with ID > N; returns it when available
- SSE: `GET /stream` — FastAPI `StreamingResponse` that yields `data: {json}\n\n` on new events
- Client: Python `httpx` client that demonstrates long polling loop
- Simulate: a background task publishes a new event every 3 seconds; confirm SSE client receives it

## Knobs to turn
- Long poll: what happens if 1000 clients are all waiting simultaneously? (1000 open connections, threads)
- SSE: kill the server mid-stream. How long before the client detects and reconnects?
- Add `Last-Event-ID` header: client sends the ID of the last event it received; server replays missed events
- Compare latency: long poll vs SSE vs WebSocket for the same "new message" notification

## How it connects to other components
- `17-websocket-realtime` — WebSocket is the bidirectional upgrade; SSE is unidirectional but simpler
- `10-pub-sub` — SSE endpoint subscribes to an internal pub/sub topic and streams events out
- `14-task-queue-worker` — job status updates are a natural SSE use case

## Real tool / production system
GitHub uses SSE for live page updates. Many chat apps use SSE for notifications with WebSocket for actual messaging. Browser's native `EventSource` handles SSE reconnection. What you're missing: per-user event filtering, event replay from a persistent log, and load balancing (sticky sessions needed for SSE).
