# Load Balancer

## What it is
A component that sits in front of multiple servers and decides which server handles each incoming request. It distributes traffic so no single server is overwhelmed.

## Why it matters
Every system at scale uses one. Without it, all traffic hits one server, which becomes a single point of failure. Interviewers ask about it when you mention horizontal scaling — they want to know how traffic actually gets distributed.

## What to know before starting
- HTTP request/response cycle: client sends request, server returns response
- What a server process is: a program listening on a port
- The difference between stateless and stateful requests (cookies, sessions)

## How to approach it
Start with the simplest algorithm: round-robin. Keep an index, increment it mod N for each request. Then ask: what if servers have different capacities? That's weighted round-robin. What if you want to minimize queue depth? That's least connections — you need to track how many requests each server is actively handling.

The hard part is what happens when a server goes down. You need health checks running in the background, and the routing logic needs to skip dead servers.

## What to build (minimal working version)
- Three FastAPI apps on ports 8001, 8002, 8003 — each returns its own port number
- `RoundRobinBalancer` with a server list and index counter
- A proxy endpoint that picks a server and forwards the request using `httpx`
- Send 9 requests, confirm 3 go to each server

## Knobs to turn
- Kill one backend server mid-test. What happens? Add health check polling to skip it.
- Give servers different weights (3:2:1). Verify distribution over 60 requests.
- Implement least-connections. Under which traffic pattern does it beat round-robin?
- Add sticky sessions (same client IP → same server). What breaks when a server dies?

## How it connects to other components
- `08-consistent-hash-ring` — alternative routing strategy; maps keys to nodes
- `12-health-check` — how the balancer knows which servers are alive
- `07-circuit-breaker` — when a backend is degraded (not dead), circuit breaker decides whether to route
- `03-rate-limiter` — rate limiting often sits at the load balancer layer

## Real tool / production system
Nginx `upstream` block does round-robin by default. AWS ALB uses connection-based routing with health checks built in. HAProxy has more granular algorithm options. What you're missing: SSL termination, sticky sessions at scale, cross-zone awareness.
