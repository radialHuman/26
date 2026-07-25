# Structured Logging + Correlation IDs

## What it is
Structured logging writes logs as JSON objects (key-value pairs) instead of plain text strings. A correlation ID (trace ID) is a unique identifier that flows through every service handling a single request, so you can reconstruct the full request journey from logs alone.

## Why it matters
`"Error occurred"` in a log file is useless. `{"level": "error", "trace_id": "abc123", "user_id": 42, "service": "order-service", "error": "payment timeout", "duration_ms": 5001}` is searchable, filterable, and correlatable. Senior engineers are expected to design for observability from day one. Interviewers ask "how would you debug a slow request?" — structured logs with trace IDs is the answer.

## What to know before starting
- Python's `logging` module basics
- JSON format and why it's machine-parseable
- What middleware is in a web framework

## How to approach it
On every incoming request: generate a UUID as the `trace_id`. Store it in a context variable (`contextvars.ContextVar`) so any code that runs during that request can access it without passing it explicitly. Every log call reads from this context and includes the `trace_id`.

When your service calls another service, pass the `trace_id` in a header (`X-Trace-ID`). The downstream service extracts it, sets its own context, and all its logs include the same ID.

## What to build (minimal working version)
- Custom JSON log formatter using Python's `logging` module
- FastAPI middleware that generates `trace_id` per request and stores in `ContextVar`
- Log formatter that automatically includes `trace_id`, `service_name`, `timestamp`, and `level`
- Two FastAPI services: service A calls service B; pass `X-Trace-ID` header; both log with same ID
- Test: make a request, grep both services' logs for the same trace_id

## Knobs to turn
- Log without trace IDs. Make 10 concurrent requests. Try to follow one request through the logs.
- Add trace IDs. Same test. Difference in debuggability?
- Add `duration_ms` to every request log (time from request start to response)
- Add `user_id` and `request_id` to all logs; filter logs by user_id for a specific user's journey

## How it connects to other components
- `38-distributed-tracing` — trace IDs are the same concept; tracing adds spans and timing per operation
- `30-api-gateway` — gateway generates the initial trace_id for all requests
- `33-metrics-collector` — metrics are aggregated numbers; logs are individual events — both are needed

## Real tool / production system
Python `structlog` library makes structured logging ergonomic. ELK Stack (Elasticsearch + Logstash + Kibana) or Loki + Grafana for log storage and search. Datadog, Splunk for production. What you're missing: log sampling (only log 1% of successful requests), log levels in production (warn/error only), and log shipping without blocking the request thread.
