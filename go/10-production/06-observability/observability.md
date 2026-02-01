# Observability in Production Go Applications

## Overview
Observability is the ability to understand the internal state of your system by examining its outputs. The three pillars of observability are:
1. **Metrics** - Quantitative measurements
2. **Logs** - Discrete events
3. **Traces** - Request lifecycles across services

## Structured Logging with slog

### Basic slog Usage
```go
package main

import (
    "log/slog"
    "os"
)

func main() {
    // Create JSON handler
    logger := slog.New(slog.NewJSONHandler(os.Stdout, &slog.HandlerOptions{
        Level: slog.LevelInfo,
    }))
    
    // Set as default logger
    slog.SetDefault(logger)
    
    // Log with structured fields
    logger.Info("server starting",
        "port", 8080,
        "env", "production",
    )
    
    logger.Error("database connection failed",
        "error", err,
        "host", "localhost",
        "port", 5432,
    )
}
```

### Custom Logger with Context
```go
package logger

import (
    "context"
    "log/slog"
    "os"
)

type contextKey string

const loggerKey contextKey = "logger"

func New(service string, version string) *slog.Logger {
    return slog.New(slog.NewJSONHandler(os.Stdout, &slog.HandlerOptions{
        Level: slog.LevelInfo,
    })).With(
        "service", service,
        "version", version,
    )
}

func WithLogger(ctx context.Context, logger *slog.Logger) context.Context {
    return context.WithValue(ctx, loggerKey, logger)
}

func FromContext(ctx context.Context) *slog.Logger {
    if logger, ok := ctx.Value(loggerKey).(*slog.Logger); ok {
        return logger
    }
    return slog.Default()
}

// Middleware to add request ID to logger
func RequestIDMiddleware(next http.Handler) http.Handler {
    return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
        requestID := r.Header.Get("X-Request-ID")
        if requestID == "" {
            requestID = uuid.New().String()
        }
        
        logger := FromContext(r.Context()).With("request_id", requestID)
        ctx := WithLogger(r.Context(), logger)
        
        next.ServeHTTP(w, r.WithContext(ctx))
    })
}
```

## Metrics with Prometheus

### Basic Metrics Setup
```go
package metrics

import (
    "github.com/prometheus/client_golang/prometheus"
    "github.com/prometheus/client_golang/prometheus/promauto"
    "github.com/prometheus/client_golang/prometheus/promhttp"
    "net/http"
)

var (
    // Counter - always increasing value
    requestsTotal = promauto.NewCounterVec(
        prometheus.CounterOpts{
            Name: "http_requests_total",
            Help: "Total number of HTTP requests",
        },
        []string{"method", "endpoint", "status"},
    )
    
    // Histogram - distribution of values
    requestDuration = promauto.NewHistogramVec(
        prometheus.HistogramOpts{
            Name:    "http_request_duration_seconds",
            Help:    "HTTP request duration in seconds",
            Buckets: prometheus.DefBuckets,
        },
        []string{"method", "endpoint"},
    )
    
    // Gauge - value that can go up or down
    activeConnections = promauto.NewGauge(
        prometheus.GaugeOpts{
            Name: "http_active_connections",
            Help: "Number of active HTTP connections",
        },
    )
    
    // Summary - similar to histogram but with quantiles
    responseSize = promauto.NewSummaryVec(
        prometheus.SummaryOpts{
            Name:       "http_response_size_bytes",
            Help:       "HTTP response size in bytes",
            Objectives: map[float64]float64{0.5: 0.05, 0.9: 0.01, 0.99: 0.001},
        },
        []string{"endpoint"},
    )
)

// Metrics middleware
func MetricsMiddleware(next http.Handler) http.Handler {
    return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
        activeConnections.Inc()
        defer activeConnections.Dec()
        
        timer := prometheus.NewTimer(requestDuration.WithLabelValues(
            r.Method,
            r.URL.Path,
        ))
        defer timer.ObserveDuration()
        
        // Wrap response writer to capture status code
        wrapped := &responseWriter{ResponseWriter: w, statusCode: http.StatusOK}
        
        next.ServeHTTP(wrapped, r)
        
        requestsTotal.WithLabelValues(
            r.Method,
            r.URL.Path,
            http.StatusText(wrapped.statusCode),
        ).Inc()
    })
}

type responseWriter struct {
    http.ResponseWriter
    statusCode int
}

func (rw *responseWriter) WriteHeader(code int) {
    rw.statusCode = code
    rw.ResponseWriter.WriteHeader(code)
}

// Expose metrics endpoint
func Handler() http.Handler {
    return promhttp.Handler()
}
```

### Custom Metrics
```go
package metrics

import (
    "github.com/prometheus/client_golang/prometheus"
)

type Collector struct {
    requestsTotal     *prometheus.CounterVec
    requestDuration   *prometheus.HistogramVec
    activeUsers       prometheus.Gauge
    queueLength       prometheus.Gauge
}

func NewCollector(namespace string) *Collector {
    c := &Collector{
        requestsTotal: prometheus.NewCounterVec(
            prometheus.CounterOpts{
                Namespace: namespace,
                Name:      "requests_total",
                Help:      "Total requests processed",
            },
            []string{"service", "method", "status"},
        ),
        requestDuration: prometheus.NewHistogramVec(
            prometheus.HistogramOpts{
                Namespace: namespace,
                Name:      "request_duration_seconds",
                Help:      "Request duration in seconds",
                Buckets:   []float64{.005, .01, .025, .05, .1, .25, .5, 1, 2.5, 5, 10},
            },
            []string{"service", "method"},
        ),
        activeUsers: prometheus.NewGauge(
            prometheus.GaugeOpts{
                Namespace: namespace,
                Name:      "active_users",
                Help:      "Number of currently active users",
            },
        ),
        queueLength: prometheus.NewGauge(
            prometheus.GaugeOpts{
                Namespace: namespace,
                Name:      "queue_length",
                Help:      "Current length of processing queue",
            },
        ),
    }
    
    // Register metrics
    prometheus.MustRegister(c.requestsTotal)
    prometheus.MustRegister(c.requestDuration)
    prometheus.MustRegister(c.activeUsers)
    prometheus.MustRegister(c.queueLength)
    
    return c
}

func (c *Collector) RecordRequest(service, method, status string, duration float64) {
    c.requestsTotal.WithLabelValues(service, method, status).Inc()
    c.requestDuration.WithLabelValues(service, method).Observe(duration)
}

func (c *Collector) SetActiveUsers(count float64) {
    c.activeUsers.Set(count)
}

func (c *Collector) SetQueueLength(length float64) {
    c.queueLength.Set(length)
}
```

## Distributed Tracing with OpenTelemetry

### OpenTelemetry Setup
```go
package tracing

import (
    "context"
    "go.opentelemetry.io/otel"
    "go.opentelemetry.io/otel/attribute"
    "go.opentelemetry.io/otel/exporters/jaeger"
    "go.opentelemetry.io/otel/sdk/resource"
    "go.opentelemetry.io/otel/sdk/trace"
    semconv "go.opentelemetry.io/otel/semconv/v1.4.0"
)

func InitTracer(serviceName, jaegerEndpoint string) (*trace.TracerProvider, error) {
    // Create Jaeger exporter
    exporter, err := jaeger.New(jaeger.WithCollectorEndpoint(
        jaeger.WithEndpoint(jaegerEndpoint),
    ))
    if err != nil {
        return nil, err
    }
    
    // Create resource
    res, err := resource.New(context.Background(),
        resource.WithAttributes(
            semconv.ServiceNameKey.String(serviceName),
        ),
    )
    if err != nil {
        return nil, err
    }
    
    // Create tracer provider
    tp := trace.NewTracerProvider(
        trace.WithBatcher(exporter),
        trace.WithResource(res),
    )
    
    otel.SetTracerProvider(tp)
    
    return tp, nil
}

// HTTP middleware for tracing
func TracingMiddleware(next http.Handler) http.Handler {
    return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
        tracer := otel.Tracer("http-server")
        ctx, span := tracer.Start(r.Context(), r.URL.Path)
        defer span.End()
        
        span.SetAttributes(
            attribute.String("http.method", r.Method),
            attribute.String("http.url", r.URL.String()),
            attribute.String("http.user_agent", r.UserAgent()),
        )
        
        next.ServeHTTP(w, r.WithContext(ctx))
    })
}
```

### Tracing Database Queries
```go
package database

import (
    "context"
    "database/sql"
    
    "go.opentelemetry.io/otel"
    "go.opentelemetry.io/otel/attribute"
)

type TracedDB struct {
    *sql.DB
}

func (db *TracedDB) QueryContext(ctx context.Context, query string, args ...interface{}) (*sql.Rows, error) {
    tracer := otel.Tracer("database")
    ctx, span := tracer.Start(ctx, "db.query")
    defer span.End()
    
    span.SetAttributes(
        attribute.String("db.statement", query),
        attribute.String("db.system", "postgresql"),
    )
    
    rows, err := db.DB.QueryContext(ctx, query, args...)
    if err != nil {
        span.RecordError(err)
    }
    
    return rows, err
}
```

## Complete Observability Setup

```go
package main

import (
    "context"
    "log"
    "log/slog"
    "net/http"
    "os"
    "time"
    
    "github.com/prometheus/client_golang/prometheus/promhttp"
)

type Server struct {
    logger  *slog.Logger
    metrics *metrics.Collector
    tracer  *trace.TracerProvider
}

func NewServer() (*Server, error) {
    // Initialize logger
    logger := slog.New(slog.NewJSONHandler(os.Stdout, &slog.HandlerOptions{
        Level: slog.LevelInfo,
    })).With(
        "service", "myapp",
        "version", "1.0.0",
    )
    
    // Initialize metrics
    metricsCollector := metrics.NewCollector("myapp")
    
    // Initialize tracer
    tp, err := tracing.InitTracer("myapp", "http://jaeger:14268/api/traces")
    if err != nil {
        return nil, err
    }
    
    return &Server{
        logger:  logger,
        metrics: metricsCollector,
        tracer:  tp,
    }, nil
}

func (s *Server) Start() error {
    mux := http.NewServeMux()
    
    // Register routes
    mux.HandleFunc("/", s.handleIndex)
    mux.Handle("/metrics", promhttp.Handler())
    mux.HandleFunc("/health", s.handleHealth)
    
    // Apply middleware chain
    handler := s.loggingMiddleware(
        s.metricsMiddleware(
            s.tracingMiddleware(mux),
        ),
    )
    
    server := &http.Server{
        Addr:    ":8080",
        Handler: handler,
    }
    
    s.logger.Info("starting server", "addr", server.Addr)
    return server.ListenAndServe()
}

func (s *Server) loggingMiddleware(next http.Handler) http.Handler {
    return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
        start := time.Now()
        
        wrapped := &statusRecorder{ResponseWriter: w, statusCode: http.StatusOK}
        next.ServeHTTP(wrapped, r)
        
        s.logger.Info("request completed",
            "method", r.Method,
            "path", r.URL.Path,
            "status", wrapped.statusCode,
            "duration_ms", time.Since(start).Milliseconds(),
            "remote_addr", r.RemoteAddr,
        )
    })
}

func (s *Server) metricsMiddleware(next http.Handler) http.Handler {
    return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
        start := time.Now()
        
        wrapped := &statusRecorder{ResponseWriter: w, statusCode: http.StatusOK}
        next.ServeHTTP(wrapped, r)
        
        duration := time.Since(start).Seconds()
        s.metrics.RecordRequest(
            "myapp",
            r.Method,
            http.StatusText(wrapped.statusCode),
            duration,
        )
    })
}

func (s *Server) tracingMiddleware(next http.Handler) http.Handler {
    return tracing.TracingMiddleware(next)
}

type statusRecorder struct {
    http.ResponseWriter
    statusCode int
}

func (sr *statusRecorder) WriteHeader(code int) {
    sr.statusCode = code
    sr.ResponseWriter.WriteHeader(code)
}

func (s *Server) handleIndex(w http.ResponseWriter, r *http.Request) {
    ctx := r.Context()
    logger := s.logger.With("handler", "index")
    
    logger.InfoContext(ctx, "handling index request")
    
    // Simulate some work with tracing
    tracer := otel.Tracer("handler")
    _, span := tracer.Start(ctx, "process_request")
    time.Sleep(100 * time.Millisecond)
    span.End()
    
    w.Write([]byte("Hello, World!"))
}

func (s *Server) handleHealth(w http.ResponseWriter, r *http.Request) {
    w.WriteHeader(http.StatusOK)
    w.Write([]byte("OK"))
}

func (s *Server) Shutdown(ctx context.Context) error {
    s.logger.Info("shutting down server")
    
    if err := s.tracer.Shutdown(ctx); err != nil {
        s.logger.Error("tracer shutdown error", "error", err)
        return err
    }
    
    return nil
}

func main() {
    server, err := NewServer()
    if err != nil {
        log.Fatal(err)
    }
    
    if err := server.Start(); err != nil {
        log.Fatal(err)
    }
}
```

## Error Tracking with Sentry

```go
package errortracking

import (
    "context"
    "time"
    
    "github.com/getsentry/sentry-go"
)

func InitSentry(dsn, environment, release string) error {
    return sentry.Init(sentry.ClientOptions{
        Dsn:              dsn,
        Environment:      environment,
        Release:          release,
        TracesSampleRate: 1.0,
    })
}

func CaptureError(err error, ctx context.Context) {
    sentry.CaptureException(err)
}

func CaptureErrorWithContext(err error, ctx context.Context, tags map[string]string) {
    hub := sentry.CurrentHub().Clone()
    hub.ConfigureScope(func(scope *sentry.Scope) {
        for k, v := range tags {
            scope.SetTag(k, v)
        }
    })
    hub.CaptureException(err)
}

// Middleware for Sentry
func SentryMiddleware(next http.Handler) http.Handler {
    return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
        hub := sentry.CurrentHub().Clone()
        hub.Scope().SetRequest(r)
        ctx := sentry.SetHubOnContext(r.Context(), hub)
        
        defer func() {
            if err := recover(); err != nil {
                hub.RecoverWithContext(ctx, err)
                w.WriteHeader(http.StatusInternalServerError)
            }
        }()
        
        next.ServeHTTP(w, r.WithContext(ctx))
    })
}
```

## Best Practices

### 1. **Correlation IDs**
```go
func CorrelationIDMiddleware(next http.Handler) http.Handler {
    return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
        correlationID := r.Header.Get("X-Correlation-ID")
        if correlationID == "" {
            correlationID = uuid.New().String()
        }
        
        w.Header().Set("X-Correlation-ID", correlationID)
        
        logger := logger.FromContext(r.Context()).With("correlation_id", correlationID)
        ctx := logger.WithLogger(r.Context(), logger)
        
        next.ServeHTTP(w, r.WithContext(ctx))
    })
}
```

### 2. **Structured Logging**
Always use structured fields instead of string formatting:
```go
// Good
logger.Info("user created", "user_id", userID, "email", email)

// Bad
logger.Info(fmt.Sprintf("user %s created with email %s", userID, email))
```

### 3. **Appropriate Log Levels**
```go
logger.Debug("cache hit", "key", key) // Development details
logger.Info("request completed", "duration_ms", duration) // Normal operations
logger.Warn("retry attempt", "attempt", 3) // Warnings
logger.Error("database query failed", "error", err) // Errors
```

### 4. **Metric Naming Conventions**
```go
// Follow Prometheus naming conventions
http_requests_total        // Counter
http_request_duration_seconds  // Histogram
active_connections         // Gauge
```

### 5. **Sampling for High Traffic**
```go
// Only trace a percentage of requests
trace.WithSampler(trace.TraceIDRatioBased(0.1)) // 10% sampling
```

## Summary

Effective observability requires:
- **Structured Logging**: Consistent, queryable log entries
- **Metrics**: Quantitative system measurements
- **Distributed Tracing**: Request flow visualization
- **Error Tracking**: Centralized error aggregation
- **Correlation**: Link logs, metrics, and traces
- **Sampling**: Manage data volume in high-traffic systems

Proper observability enables quick troubleshooting, performance optimization, and understanding system behavior in production.
