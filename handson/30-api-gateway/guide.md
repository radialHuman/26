# API Gateway

## What it is
A single entry point for all client requests. It routes requests to the appropriate backend service, enforces cross-cutting concerns (auth, rate limiting, logging, circuit breaking), and can transform requests and responses.

## Why it matters
Without it, every service must independently implement auth, rate limiting, CORS, logging, and TLS termination. The gateway centralizes these. Every production API platform uses one (AWS API Gateway, Kong, Nginx). Interviewers expect you to mention it when designing any multi-service backend.

## What to know before starting
- Reverse proxy: a server that accepts requests on behalf of clients and forwards to backends
- HTTP forwarding: how to copy headers, body, and method from an incoming request to an outgoing one
- Python's `httpx` for making async HTTP requests

## How to approach it
The gateway is a FastAPI app with a catch-all route. It reads the path, looks up a routing config, and forwards the request to the correct backend using `httpx`. Cross-cutting concerns run as middleware before routing.

The routing config is the heart of the gateway:
```python
routes = {
    "/users": "http://user-service:8001",
    "/orders": "http://order-service:8002",
}
```

## What to build (minimal working version)
- FastAPI gateway on port 8000
- Routing config dict: map path prefixes to backend URLs
- `httpx.AsyncClient` to forward requests: copy method, headers, body
- Add middleware (in order): auth check → rate limiter → circuit breaker → route → log result
- Test: `GET http://localhost:8000/users/123` → forwards to user-service, returns response

## Knobs to turn
- Kill a backend service. Does the gateway return 503 or hang? (Add circuit breaker and timeout)
- Add response transformation: strip `X-Internal-*` headers before returning to client
- Add request ID: gateway generates a UUID, adds it to the forwarded request and the response
- Add content negotiation: if client sends `Accept: application/xml`, transform JSON response to XML (or 406 if not supported)

## How it connects to other components
- `03-rate-limiter` — rate limiting middleware
- `07-circuit-breaker` — wrap each backend call
- `31-token-auth` — validate JWT before routing
- `32-structured-logging` — log request ID, path, backend, latency, status
- `29-service-discovery` — instead of hardcoded backend URLs, look up from registry

## Real tool / production system
Kong: Nginx-based, plugin ecosystem for rate limiting, auth, logging. AWS API Gateway: serverless, integrates with Lambda. Traefik: dynamic config from Kubernetes/Docker labels. What you're missing: SSL termination, websocket proxying, request buffering, canary routing, and admin API for dynamic route changes.
