# Idempotency

## What it is
An operation is idempotent if doing it multiple times has the same effect as doing it once. In API design, this means: if the client retries a request (due to network failure), the server doesn't double-process it.

## Why it matters
Networks fail. Clients retry. Without idempotency, a payment gets charged twice, an order placed twice, an email sent twice. This is one of the most important correctness properties in distributed systems. Stripe, PayPal, and every payment API require idempotency keys.

## What to know before starting
- Why retries are unavoidable in distributed systems
- What a UUID/idempotency key is: a unique identifier the client generates and includes with the request
- Difference between idempotent by nature (GET, DELETE) and idempotent by implementation (POST with key)

## How to approach it
The client generates a unique key (UUID) before making the request and includes it in a header (`Idempotency-Key: <uuid>`). The server checks if it has seen this key before:
- If yes: return the stored response without re-processing
- If no: process, store the key + response, return response

The storage must be fast (Redis works well). Keys should expire after a reasonable window (24h).

## What to build (minimal working version)
- FastAPI `POST /orders` endpoint that creates an order
- Check `Idempotency-Key` header; reject if missing
- Use a dict (then Redis) to store `key → response`
- Send same request twice with same key; confirm second call returns cached response
- Send same request with different key; confirm second call creates a new order

## Knobs to turn
- What happens if two concurrent requests arrive with the same key simultaneously? Add a lock.
- Set key expiry to 10 seconds. After expiry, same key creates a new order. Is this right?
- Try without the idempotency key: simulate a network failure by having the client retry 3 times. Count how many orders were created.
- Apply to your retry decorator from `04-retry-and-backoff`: the decorator retries, the endpoint deduplicates.

## How it connects to other components
- `04-retry-and-backoff` — retries require idempotent endpoints to be safe
- `47-exactly-once-delivery` — idempotency is the practical solution to the impossibility of exactly-once delivery
- `16-saga-pattern` — each saga step must be idempotent in case of re-execution

## Real tool / production system
Stripe's `Idempotency-Key` header. AWS SQS provides message deduplication IDs. Kafka consumers handle idempotency at the consumer level. What you're missing: distributed idempotency key storage with TTL, handling concurrent requests with the same key, and idempotency across service boundaries.
