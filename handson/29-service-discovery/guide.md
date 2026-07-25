# Service Discovery

## What it is
A mechanism for services to find each other dynamically without hardcoded IP addresses. Each service registers its address on startup; other services look it up by name. When services are restarted, moved, or scaled, their address in the registry updates.

## Why it matters
In a containerized environment, service IPs change constantly (Kubernetes assigns new IPs on every restart). Hardcoding IPs breaks immediately. Service discovery is the glue that makes microservices work. Interviewers ask "how does Service A know where Service B is?" in any microservices design.

## What to know before starting
- Why static IPs break in containers (IPs are dynamic, reassigned on restart)
- DNS as a basic form of service discovery (but it has TTL and caching issues)
- What a heartbeat is: a periodic signal proving a service is still alive

## How to approach it
A registry is a key-value store: `service_name → list of (host, port, metadata)`. Services register on startup and deregister on shutdown. The hard problem: what if a service crashes without deregistering? Heartbeats solve this: each service sends a ping every N seconds. The registry removes services that haven't heartbeated in 3N seconds.

Clients look up the registry and pick an instance (round-robin or random). They can cache the result for a short TTL to avoid registry requests on every call.

## What to build (minimal working version)
- `ServiceRegistry` class: in-memory dict, `register(name, host, port)`, `lookup(name)` → list
- `deregister(name, host, port)` for graceful shutdown
- Heartbeat: each service sends `heartbeat(name, host, port)` every 5 seconds; registry removes stale entries after 15s
- Three FastAPI services that register themselves on startup
- A client that uses the registry to find and call a service

## Knobs to turn
- Kill a service without deregistering. How long before registry removes it? (3× heartbeat interval)
- Register the same service on ports 8001, 8002, 8003. Client round-robins across them.
- Simulate registry crash. Client caches the last known address; how long can it function without the registry?
- Add health check integration: registry only keeps services that pass `/health/ready`.

## How it connects to other components
- `12-health-check` — health checks feed into service discovery (only route to healthy instances)
- `02-load-balancer` — client-side load balancing uses the registry to pick among instances
- `37-leader-election` — leader election is a special case of service discovery (finding "the" primary)

## Real tool / production system
Consul: full service registry with health checks and KV store. etcd + custom client. Kubernetes: CoreDNS provides DNS-based discovery; Services provide stable virtual IPs. AWS Cloud Map. What you're missing: health check integration, watch/subscribe to changes (instead of polling), multi-datacenter registry, and ACL for who can register what.
