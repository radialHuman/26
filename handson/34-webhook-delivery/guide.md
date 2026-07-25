# Webhook Delivery + Retry

## What it is
A webhook is an HTTP callback: when an event occurs in your system, you POST a JSON payload to a URL the customer has configured. Reliable delivery means retrying on failure, with backoff, and tracking delivery status.

## Why it matters
Stripe, GitHub, Slack, Twilio all deliver events via webhooks. Building reliable webhook delivery teaches you: async event processing, retry with backoff, idempotent delivery, and failure isolation. Interviewers ask about it in API platform and event-driven system designs.

## What to know before starting
- HTTP POST with JSON body (client = your system; server = customer's endpoint)
- Retry with exponential backoff from `04-retry-and-backoff`
- The difference between synchronous delivery (in request thread) and async delivery (via worker queue)

## How to approach it
Never deliver webhooks synchronously in the request thread. Enqueue the delivery; a worker process handles it. This decouples your system's uptime from the customer's endpoint reliability.

Delivery flow: event occurs → enqueue delivery job (event payload + destination URL) → worker attempts POST → on 2xx: mark delivered; on non-2xx or timeout: schedule retry with backoff → after max retries: mark failed, stop.

Sign your payloads: compute `HMAC(secret, payload)` and include in `X-Webhook-Signature` header. Recipients verify before processing.

## What to build (minimal working version)
- `WebhookDelivery(event, url, secret)` model with status, attempts, next_retry_at
- Worker: dequeue, POST to URL with `httpx`, update status
- Retry schedule: 30s, 5min, 30min, 2h, 8h (5 attempts)
- HMAC signature: `X-Webhook-Signature: sha256=<hmac_hex>`
- Build a test receiver endpoint that sometimes returns 500; watch retries happen

## Knobs to turn
- Make the destination return 200 but process the event twice. How does the sender know?
- Make the destination return 200 on first retry but you already retried. Implement receiver idempotency using delivery ID.
- What happens after 5 failed attempts? Add a "dead webhook" notification to the customer.
- Add delivery log: every attempt recorded with timestamp, response code, response body.

## How it connects to other components
- `04-retry-and-backoff` — the retry logic is the same pattern
- `14-task-queue-worker` — workers process the delivery queue
- `13-idempotency` — delivery ID lets recipients deduplicate retried webhooks

## Real tool / production system
Stripe's webhook system retries over 3 days with increasing intervals. GitHub webhooks retry for 30 minutes. Svix and Hookdeck are managed webhook delivery platforms. What you're missing: webhook endpoint health tracking (disable after consecutive failures), delivery ordering guarantees, and fan-out (same event to multiple subscriber URLs).
