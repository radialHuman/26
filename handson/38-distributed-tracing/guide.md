# Distributed Tracing

## What it is
A system for tracking a single request as it flows through multiple services. Each service adds a "span" (a timed unit of work) to a trace. The full trace shows every hop the request made, how long each took, and where errors occurred.

## Why it matters
When a request goes through 6 microservices and is slow, you need to know which one is the bottleneck. Logs tell you what happened in each service independently. Tracing shows you the full call tree with timing. Senior engineers are expected to instrument code for tracing and know how to read traces. Every FAANG company uses tracing.

## What to know before starting
- Trace ID and span ID: a trace is a tree of spans; each span has its own ID and points to its parent span ID
- Context propagation: the trace ID and span ID must travel in HTTP headers between services
- Structured logging from `32-structured-logging` — same correlation ID concept, extended

## How to approach it
Every request starts a root span. When your service calls another, it creates a child span and passes the trace context in headers (`traceparent` is the W3C standard). The downstream service creates its own child span.

Each span records: start time, end time, operation name, tags (key-value metadata), and any errors. Completed spans are sent to a trace collector (Jaeger, Zipkin, OpenTelemetry Collector).

## What to build (minimal working version)
- `Span(trace_id, span_id, parent_span_id, operation, start, end, tags)` dataclass
- `Tracer` class: `start_span(operation, parent=None)`, `finish_span(span)` → stores in a list
- FastAPI middleware: extract `traceparent` header on incoming requests; create root span or child span
- When calling a downstream service, inject current span context into `traceparent` header
- Two chained services: A calls B calls C; print the full trace tree with timing

## Knobs to turn
- Make service B sleep for 2 seconds. Find it in the trace.
- Make service C return an error. Tag the span with `error=True`. See it in the trace.
- Add database call spans: every SQL query gets its own span as a child of the request span.
- Send completed spans to Jaeger (Docker): `docker run -p 16686:16686 jaegertracing/all-in-one`. View in Jaeger UI.

## How it connects to other components
- `32-structured-logging` — include trace_id and span_id in all log lines; correlate logs with traces
- `33-metrics-collector` — metrics show "p99 is slow"; tracing shows WHY specific requests are slow
- `30-api-gateway` — gateway creates the root span for every request

## Real tool / production system
OpenTelemetry: the standard SDK and protocol. Jaeger and Zipkin: open-source trace storage and UI. Datadog APM, AWS X-Ray: commercial. `opentelemetry-sdk` Python package. What you're missing: trace sampling (only record 1% of traces to control volume), baggage propagation (carry custom data through the trace), and tail-based sampling (record more for slow/error requests).
