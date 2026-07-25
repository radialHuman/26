# Health Check + Readiness / Liveness

## What it is
Two HTTP endpoints every service exposes: `/health/live` (is the process alive?) and `/health/ready` (is it ready to serve traffic?). Load balancers and orchestrators poll these to decide whether to route traffic to an instance.

## Why it matters
Without health checks, a load balancer routes traffic to crashed or overloaded servers. Kubernetes uses these to know when to restart a pod (liveness) vs. when to add it to the load balancer pool (readiness). Every service needs them; they're the first thing to add after "hello world."

## What to know before starting
- HTTP status codes: 200 = healthy, 503 = not ready/not healthy
- The difference between liveness (process is running) and readiness (process can handle requests)
- What a dependency check is: your service might be alive but DB is down, making it not ready

## How to approach it
Liveness is simple: if this endpoint returns 200, the process is up. If it doesn't respond, the process is dead.

Readiness is richer: check your dependencies. Can you reach the database? Is the cache warm? Is an internal queue draining? Return 503 if any critical dependency is down.

The trap: don't put slow checks in liveness. A slow liveness check causes false restarts.

## What to build (minimal working version)
- FastAPI app with `GET /health/live` → always returns 200 if process is up
- `GET /health/ready` → checks DB connection, cache connection; returns 200 or 503
- Simulate DB being down: set a flag, flip it, watch readiness fail while liveness passes
- Add a `/health/ready` response body: `{"status": "ok", "checks": {"db": "ok", "cache": "fail"}}`

## Knobs to turn
- Kill the simulated DB. Does liveness stay green while readiness goes red?
- Add a check that fails if request queue depth > 1000. Simulate backpressure-based readiness.
- Add a startup probe: service is not ready for the first 10 seconds (warm-up time). Implement with a startup timestamp check.
- Integrate with your load balancer from `02-load-balancer`: poll health endpoints, remove failing instances from rotation.

## How it connects to other components
- `02-load-balancer` — load balancer polls health endpoints to decide routing
- `29-service-discovery` — registry heartbeats are a form of health signaling
- `22-backpressure` — readiness endpoint can signal "I'm overloaded, stop sending me traffic"

## Real tool / production system
Kubernetes liveness/readiness probes. AWS ALB target group health checks. Docker Compose `healthcheck`. What you're missing: health check history (not just current state), aggregated health dashboards, and dependency health propagation (my service is unhealthy because my DB is unhealthy).
