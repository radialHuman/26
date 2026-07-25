# WebSocket / Real-time Server

## What it is
A persistent, bidirectional connection between client and server over a single TCP connection. Unlike HTTP (client sends → server responds → connection closes), WebSocket keeps the connection open so either side can send data at any time.

## Why it matters
Powers real-time features: Uber driver location updates, WhatsApp messages, live sports scores, collaborative editing. When an interviewer asks "how does the client get updates without polling?", WebSocket is usually the answer.

## What to know before starting
- HTTP request/response model and why it's inefficient for real-time (polling overhead)
- What a TCP connection is: persistent two-way channel
- The difference between push (server initiates) and pull (client initiates)

## How to approach it
The WebSocket handshake starts as an HTTP request with `Upgrade: websocket` header. After upgrade, both sides can send frames at any time.

On the server: maintain a registry of connected clients (by user ID or room). When an event occurs, look up relevant connections and send to each. This is the server-side pub/sub — the hard part is managing connections when you have multiple server instances.

## What to build (minimal working version)
- FastAPI with `WebSocket` endpoint at `/ws/{user_id}`
- Server keeps a `dict[user_id, WebSocket]` of active connections
- `POST /send/{user_id}` accepts a message and pushes it to that user's WebSocket
- Test: two browser tabs connected; send to one, confirm instant delivery
- Simulate Uber: client sends location every 2 seconds; server broadcasts to a "room" of watchers

## Knobs to turn
- Connect 100 clients (use `asyncio`). Broadcast a message. Measure delivery time.
- Kill a client without disconnecting. How does the server detect the dead connection?
- Run 2 server instances. Client A is on server 1. Message for A arrives at server 2. How does it reach A? (Needs Redis pub/sub as the inter-server bus)
- Implement heartbeats: server pings every 30s; if no pong in 10s, close and clean up.

## How it connects to other components
- `10-pub-sub` — inter-server message routing uses pub/sub (Redis)
- `20-long-polling-sse` — alternatives when WebSocket isn't available
- `33-metrics-collector` — track active connections, message rate, connection duration

## Real tool / production system
Socket.IO adds rooms, namespaces, and auto-fallback to polling. AWS API Gateway WebSocket API. Pusher/Ably for managed WebSocket at scale. What you're missing: reconnection handling, message queuing for offline clients, horizontal scaling with Redis adapter, and connection limits per server.
