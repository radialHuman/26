# Circuit Breaker

## What it is
A state machine that wraps calls to an external service. In normal operation (CLOSED state), calls go through. When failures exceed a threshold, the circuit opens (OPEN state) and all calls fail immediately without touching the service. After a timeout, it allows one test request through (HALF-OPEN). If that succeeds, it closes again.

## Why it matters
Without it, a slow or failed downstream service causes your threads to pile up waiting for timeouts, eventually crashing your service too. This is called cascading failure. Netflix built Hystrix specifically because one slow service was bringing down their entire platform.

## What to know before starting
- What a state machine is: a system with defined states and rules for transitioning between them
- The retry pattern from `04-retry-and-backoff` — circuit breaker works differently; it prevents retries when things are clearly broken
- What "fail fast" means: return an error immediately rather than waiting

## How to approach it
Three states, two transitions each:
- **CLOSED → OPEN**: failure count exceeds threshold within a time window
- **OPEN → HALF-OPEN**: recovery timeout expires
- **HALF-OPEN → CLOSED**: test request succeeds
- **HALF-OPEN → OPEN**: test request fails

The circuit breaker wraps a callable. The caller doesn't need to know about the state machine — they just call the function and either get a result or a `CircuitOpenError`.

## What to build (minimal working version)
- `CircuitBreaker(failure_threshold=5, recovery_timeout=30)` class
- Wraps any callable: `breaker.call(my_function, args)`
- Track failure count and last failure time
- Raise `CircuitOpenError` immediately when OPEN
- Allow one request through when recovery_timeout has elapsed (HALF-OPEN)
- Test with the flaky function from `04-retry-and-backoff`

## Knobs to turn
- Set failure_threshold=3. Fail 4 times. Confirm circuit opens on the 4th.
- While OPEN, confirm requests fail instantly (no sleep, no network call).
- Add a fallback: when OPEN, call a fallback function instead of raising. Use a cached response.
- Combine with retry: retry up to 3 times, but only if circuit is CLOSED. What happens when you violate this?

## How it connects to other components
- `04-retry-and-backoff` — don't retry when circuit is OPEN
- `44-bulkhead-pattern` — bulkhead isolates failure domains; circuit breaker detects failures within one domain
- `30-api-gateway` — circuit breakers at the gateway level protect all upstream services

## Real tool / production system
Netflix Hystrix (now deprecated) was the original. Python has `pybreaker`. Envoy and Istio implement it at the network layer. What you're missing: per-endpoint circuit breakers, metrics/alerting on state transitions, and half-open probe request rate limiting.
