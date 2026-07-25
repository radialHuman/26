# Rate Limiter

## What it is
A gatekeeper that controls how many requests a client can make in a given time window. Requests over the limit are rejected (HTTP 429) rather than forwarded to your service.

## Why it matters
Without it, a single misbehaving client (or attacker) can exhaust your server resources. Every public API has one. Interviewers specifically probe the edge cases between algorithms — they want to see you know why simple solutions fail.

## What to know before starting
- Unix timestamps and how to bucket time (e.g., current minute = `int(time.time() / 60)`)
- Python dicts for per-user counters
- The concept of a sliding window vs. a fixed window

## How to approach it
There are four algorithms, each fixing a weakness of the previous:

1. **Fixed window**: counter per user per time bucket. Simple. Fails at window boundaries — 10 requests at 11:59 + 10 at 12:00 = 20 pass through in 2 seconds.
2. **Sliding window log**: store timestamps of every request; count those in the last 60s. Accurate. Memory-heavy.
3. **Token bucket**: tokens refill at rate R/sec up to capacity C. Allows controlled bursts. Most flexible.
4. **Leaky bucket**: incoming requests queue up; process at fixed rate. Smooths traffic completely. No bursts allowed.

Build them in order. The progression is the lesson.

## What to build (minimal working version)
- Fixed window counter in a dict keyed by `(user_id, minute_bucket)`
- Sliding window log in a dict of lists of timestamps
- Token bucket with last-refill timestamp and token count
- FastAPI middleware that applies one algorithm to every request by IP

## Knobs to turn
- Set limit=10/min. Send 10 at 11:59, 10 at 12:00. Does your fixed window catch this?
- With token bucket: set refill=2/sec, capacity=5. Send 10 requests instantly. Count rejections.
- Make rate limiting distributed: move counters to Redis with `INCR` + `EXPIRE`. What changes?
- Test what happens under concurrent requests (two threads hitting simultaneously). Is your counter thread-safe?

## How it connects to other components
- `30-api-gateway` — rate limiting is a core gateway feature
- `27-distributed-lock` — Redis-based rate limiting uses atomic operations to avoid race conditions
- `04-retry-and-backoff` — clients that get 429s should back off before retrying

## Real tool / production system
Nginx `limit_req_zone` uses leaky bucket. Kong and Envoy use token bucket. Redis is almost always the backing store for distributed rate limiting. Your implementation misses: distributed atomicity across multiple gateway instances, per-endpoint limits, and graceful degradation when Redis is down.
