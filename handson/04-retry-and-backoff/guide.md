# Retry Logic + Exponential Backoff + Jitter

## What it is
When a network call fails, retry it — but wait longer between each attempt, and add randomness to that wait. This prevents a flood of simultaneous retries from overwhelming an already-struggling service.

## Why it matters
Every distributed call can fail transiently. Without retries, transient failures become user-visible errors. Without backoff, retries amplify load on a recovering service. Without jitter, all clients retry at the same moment — the "thundering herd" — which keeps the service from recovering.

## What to know before starting
- The difference between a transient error (network timeout, 503) and a permanent error (400 bad request) — only retry transient ones
- `time.sleep()` and how to calculate exponential delays
- Python's `random` module for adding jitter

## How to approach it
Start with a simple loop: call the function, if it raises, sleep and try again. Then replace fixed sleep with exponential: `delay = base * (2 ** attempt)`. Then add jitter: `delay = delay + random.uniform(0, base)`. Then cap it: `delay = min(delay, max_delay)`.

The decorator pattern makes this reusable. The key design decision is: which exceptions trigger a retry, and which don't?

## What to build (minimal working version)
- A function that fails 70% of the time (use `random.random()`)
- A retry loop: up to 5 attempts, fixed 1s delay
- Replace with exponential backoff: print each delay so you can see it grow
- Add jitter: run 10 clients simultaneously and observe they no longer all retry at the same time
- Package as `@retry(max_attempts=5, base_delay=0.5, max_delay=30)` decorator

## Knobs to turn
- Remove jitter. Run 20 concurrent clients. Watch them pile up at the same retry intervals.
- Add jitter back. Same test. Notice the spread.
- Set max_delay=2. How does that affect long-running failures?
- Apply to an `httpx` call to a real endpoint that intermittently returns 500.

## How it connects to other components
- `07-circuit-breaker` — circuit breaker wraps retry; when circuit is OPEN, don't retry at all
- `13-idempotency` — retried requests must be idempotent or you'll duplicate side effects
- `34-webhook-delivery` — webhook delivery is retry logic applied to outbound HTTP

## Real tool / production system
Python's `tenacity` library implements this pattern fully. AWS SDK has built-in exponential backoff. gRPC has built-in retry policies. What you're missing: retry budgets (stop retrying after X total seconds), per-exception retry policies, and coordination with circuit breaker state.
