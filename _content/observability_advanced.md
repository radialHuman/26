# Advanced Observability: Tracing, Metrics, Dashboards, and Alerts

This chapter goes deeper into observability: instrumentation patterns, trace propagation, Prometheus + Grafana examples, and alerting rules.

---

## Tracing and Trace Propagation
- Use OpenTelemetry to instrument services.
- Propagate trace IDs across HTTP/gRPC/queues using headers (e.g., `traceparent`).

```python
from opentelemetry import trace
tracer = trace.get_tracer(__name__)
with tracer.start_as_current_span("operation"):
    pass
```

---

## Example Prometheus Metrics
- Expose `/metrics` endpoint and register counters/histograms.
```python
from prometheus_client import Counter, Histogram
REQUESTS = Counter('requests_total', 'Total requests')
LATENCY = Histogram('request_latency_seconds', 'Request latency')
```

---

## Sample Grafana Panels
- Request rate, error rate, p95 latency, CPU/memory, GC pause time.
- Suggest a dashboard: single service overview with panels for latency, errors, throughput, and resource usage.

---

## Alerting Rules (Prometheus)
- Example alert: high error rate
```yaml
groups:
- name: example
  rules:
  - alert: HighErrorRate
    expr: increase(http_requests_total{status=~"5.."}[5m]) / increase(http_requests_total[5m]) > 0.05
    for: 5m
    labels:
      severity: page
    annotations:
      summary: "High error rate detected"
```

---

## Correlating Logs and Traces
- Include trace IDs in logs to connect traces with logs.
- Use structured logs and centralized log storage (ELK/EFK).

---

## Best Practices
- Instrument core libraries and middleware, not only business logic.
- Keep metrics cardinality low for Prometheus.
- Use sampling for traces to control volume.

---

Observability is critical for diagnosing production issues and verifying system behavior under load.