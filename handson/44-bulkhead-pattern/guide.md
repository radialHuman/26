# Bulkhead Pattern

## What it is
A resilience pattern that isolates components into separate resource pools so that a failure in one doesn't exhaust resources for others. Named after the watertight compartments in a ship's hull — one flooding compartment doesn't sink the ship.

## Why it matters
Without bulkheads, a slow or hung downstream service can exhaust your thread pool, causing your entire service to become unresponsive — even for requests that don't touch the slow service. Netflix found that a single slow microservice could bring down their entire platform. Bulkheads contain the blast radius.

## What to know before starting
- Thread pools and how they can be exhausted (all threads waiting → no threads for new requests)
- The circuit breaker from `07-circuit-breaker` — bulkheads and circuit breakers are complementary
- Semaphores: limit concurrent access to a resource

## How to approach it
Instead of one shared thread pool for all backend calls, give each downstream dependency its own isolated pool. Service A calls services B, C, and D. Each gets a pool of max 10 threads. If service B hangs and fills its pool, calls to C and D still have their own 10 threads available.

Similarly, you can apply bulkheads at the connection pool level (separate DB connection pools per feature), request queue level (separate queues per tenant), or CPU core level.

## What to build (minimal working version)
- Simulate 3 downstream services: B (fast), C (slow, 5s delay), D (fast)
- WITHOUT bulkheads: shared `ThreadPoolExecutor(max_workers=10)`. Flood with calls to C. Observe B and D calls hanging.
- WITH bulkheads: separate `ThreadPoolExecutor(max_workers=5)` per downstream service. Flood C's pool. Confirm B and D remain responsive.
- Add a semaphore-based bulkhead as middleware: limit concurrent requests per endpoint

## Knobs to turn
- Set bulkhead size=1 for service C. What is the trade-off?
- What happens when C's bulkhead is full? Options: queue requests, fail fast, or shed load. Implement all three and compare.
- Add timeout per bulkhead slot: if you can't get a slot within 500ms, fail fast.
- Combine with circuit breaker: bulkhead detects overload; circuit breaker prevents calls when service is unhealthy.

## How it connects to other components
- `07-circuit-breaker` — circuit breaker prevents calls to a failing service; bulkhead limits concurrent calls to an overloaded one
- `11-connection-pool` — connection pool IS a bulkhead for DB connections
- `22-backpressure` — bulkhead full → fail fast is a form of backpressure

## Real tool / production system
Netflix Hystrix's `@HystrixCommand` with thread pool isolation. Resilience4j Bulkhead (Java). Python: `concurrent.futures.ThreadPoolExecutor` per dependency. Envoy's circuit breaker includes connection limits per cluster. What you're missing: bulkhead metrics (fill rate, rejection rate), adaptive pool sizing, and shedding load gracefully (return 503 with retry-after header).
