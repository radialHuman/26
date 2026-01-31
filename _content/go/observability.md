# Observability in Go: Logging, Metrics, and Tracing

Observability helps you understand, monitor, and debug your Go applications in production. This chapter covers logging, metrics, and tracing with practical tools and best practices.

---

## Logging

- Use the standard `log` package for simple needs:
  ```go
  import "log"
  log.Println("Hello, log!")
  ```
- For structured logging, use libraries like `zap` or `logrus`:
  ```go
  import "go.uber.org/zap"
  logger, _ := zap.NewProduction()
  logger.Info("User logged in", zap.String("user", "alice"))
  ```

---

## Metrics

- Use `expvar` for basic metrics:
  ```go
  import "expvar"
  var requests = expvar.NewInt("requests")
  requests.Add(1)
  ```
- For Prometheus:
  ```go
  import "github.com/prometheus/client_golang/prometheus"
  var opsProcessed = prometheus.NewCounter(prometheus.CounterOpts{
      Name: "ops_processed_total",
      Help: "The total number of processed events",
  })
  ```

---

## Tracing

- Use OpenTelemetry for distributed tracing:
  ```go
  import "go.opentelemetry.io/otel"
  tracer := otel.Tracer("my-service")
  ctx, span := tracer.Start(ctx, "operation")
  defer span.End()
  ```
- Export traces to Jaeger, Zipkin, or other backends.

---

## Best Practices
- Use structured logs for production.
- Expose metrics endpoints for monitoring.
- Add trace IDs to logs for correlation.
- Monitor latency, error rates, and resource usage.

---

Observability is essential for operating reliable, scalable Go applications in production.