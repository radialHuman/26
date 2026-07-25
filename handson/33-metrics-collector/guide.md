# Metrics Collector (Prometheus-style)

## What it is
A system for collecting, aggregating, and exposing numerical measurements about your application: request counts, error rates, latency percentiles, queue depths, cache hit rates. Unlike logs (individual events), metrics are aggregated numbers over time.

## Why it matters
You cannot operate a production system without metrics. "Is the system healthy?" requires numbers. p99 latency, error rate, queue depth — these tell you what's wrong before users complain. Interviewers ask about observability in every senior design round.

## What to know before starting
- The three metric types: counter (only goes up), gauge (goes up and down), histogram (distribution of values)
- What p50/p95/p99 latency means: 50th/95th/99th percentile — "99% of requests complete under X ms"
- The pull model: a metrics server scrapes your `/metrics` endpoint, vs push model where you send to a server

## How to approach it
Build three metric types:
- **Counter**: `requests_total`. Increment on each request. Never decrements.
- **Gauge**: `queue_depth`. Set to current value. Can go up or down.
- **Histogram**: `request_duration_seconds`. Record each observation. Compute buckets and percentiles.

Expose a `GET /metrics` endpoint that returns all current values in Prometheus text format.

## What to build (minimal working version)
- `Counter(name, labels)` class: `increment(label_values)`, `value(label_values)`
- `Gauge(name)` class: `set(value)`, `increment()`, `decrement()`
- `Histogram(name, buckets)` class: `observe(value)` → updates bucket counts and sum
- FastAPI middleware that records request duration as a histogram observation
- `GET /metrics` endpoint returning Prometheus text format

## Knobs to turn
- Add label dimensions: `requests_total{method="GET", endpoint="/users", status="200"}`. Query by label.
- Compute p95 from your histogram buckets. Compare to actual p95 from sorted observation list.
- Run 1000 requests with random latencies. Export metrics. Calculate error rate and p99.
- Scrape your `/metrics` endpoint with actual Prometheus (Docker) and visualize in Grafana.

## How it connects to other components
- `32-structured-logging` — logs are events; metrics are aggregates — both needed together
- `38-distributed-tracing` — the three pillars of observability: logs, metrics, traces
- `12-health-check` — health checks are binary (up/down); metrics show degradation before failure

## Real tool / production system
`prometheus_client` Python library does all of this with decorators. Prometheus scrapes `/metrics`. Grafana visualizes. What you're missing: metric cardinality limits (too many label combinations explodes memory), metric federation across services, and alerting rules (Alertmanager).
