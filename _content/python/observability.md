# Observability in Python: Logging, Metrics, and Tracing

Observability is key for monitoring and debugging production systems. This chapter covers logging, metrics, and tracing in Python.

---

## Logging
- Use the built-in `logging` module.
```python
import logging
logging.basicConfig(level=logging.INFO)
logging.info("Hello, log!")
```
- For structured logging: `structlog`, `loguru`.

---

## Metrics
- Use `prometheus_client` for Prometheus metrics.
```python
from prometheus_client import Counter
c = Counter('requests_total', 'Total requests')
c.inc()
```

---

## Tracing
- Use OpenTelemetry for distributed tracing.
```python
from opentelemetry import trace
tracer = trace.get_tracer(__name__)
with tracer.start_as_current_span("operation"):
    pass
```

---

## Best Practices
- Use structured logs in production.
- Expose metrics endpoints for monitoring.
- Add trace IDs to logs for correlation.

---

Observability is essential for reliable, scalable Python applications.