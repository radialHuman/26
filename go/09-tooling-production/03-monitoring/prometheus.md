# Prometheus Metrics and Monitoring

## What is Prometheus?

**Prometheus** is an open-source monitoring system with:
- **Time-Series Database**: Store metrics over time
- **Multi-Dimensional Data**: Label-based queries
- **Pull Model**: Scrapes metrics from targets
- **PromQL**: Powerful query language
- **Alerting**: Define and trigger alerts

## Why Monitor?

Monitoring provides:
- **Visibility**: Understand system behavior
- **Performance**: Track response times, throughput
- **Reliability**: Detect failures early
- **Capacity Planning**: Predict resource needs
- **Debugging**: Identify bottlenecks

## Prometheus Client for Go

```bash
go get github.com/prometheus/client_golang/prometheus
go get github.com/prometheus/client_golang/prometheus/promhttp
```

## Basic Setup

```go
package main

import (
    "net/http"
    
    "github.com/gin-gonic/gin"
    "github.com/prometheus/client_golang/prometheus"
    "github.com/prometheus/client_golang/prometheus/promhttp"
)

func main() {
    // Gin router
    r := gin.Default()
    
    // Expose Prometheus metrics endpoint
    r.GET("/metrics", gin.WrapH(promhttp.Handler()))
    
    // Application routes
    r.GET("/api/users", getUsers)
    r.POST("/api/users", createUser)
    
    r.Run(":8080")
}
```

Visit `http://localhost:8080/metrics` to see metrics.

## Metric Types

### Counter

Cumulative value that only increases (requests, errors, sales).

```go
package metrics

import (
    "github.com/prometheus/client_golang/prometheus"
    "github.com/prometheus/client_golang/prometheus/promauto"
)

var (
    // Total HTTP requests
    HttpRequestsTotal = promauto.NewCounterVec(
        prometheus.CounterOpts{
            Name: "http_requests_total",
            Help: "Total number of HTTP requests",
        },
        []string{"method", "endpoint", "status"},
    )
    
    // Business metrics
    OrdersCreatedTotal = promauto.NewCounter(
        prometheus.CounterOpts{
            Name: "orders_created_total",
            Help: "Total number of orders created",
        },
    )
    
    FailedLoginsTotal = promauto.NewCounterVec(
        prometheus.CounterOpts{
            Name: "failed_logins_total",
            Help: "Total number of failed login attempts",
        },
        []string{"reason"},
    )
)

// Usage
func loginHandler(c *gin.Context) {
    // ... authentication logic
    
    if err != nil {
        FailedLoginsTotal.WithLabelValues("invalid_password").Inc()
        c.JSON(401, gin.H{"error": "Invalid credentials"})
        return
    }
    
    // Success
    c.JSON(200, gin.H{"token": token})
}

func createOrderHandler(c *gin.Context) {
    // ... create order
    
    OrdersCreatedTotal.Inc()
    c.JSON(201, gin.H{"order": order})
}
```

### Gauge

Value that can go up or down (active connections, memory usage, queue size).

```go
var (
    // Active connections
    ActiveConnections = promauto.NewGauge(
        prometheus.GaugeOpts{
            Name: "active_connections",
            Help: "Number of active connections",
        },
    )
    
    // Queue size
    QueueSize = promauto.NewGaugeVec(
        prometheus.GaugeOpts{
            Name: "queue_size",
            Help: "Current queue size",
        },
        []string{"queue_name"},
    )
    
    // Cache hit rate
    CacheHitRate = promauto.NewGauge(
        prometheus.GaugeOpts{
            Name: "cache_hit_rate",
            Help: "Cache hit rate percentage",
        },
    )
)

// Usage
func handleConnection() {
    ActiveConnections.Inc()
    defer ActiveConnections.Dec()
    
    // Process connection
}

func addToQueue(queueName string, item interface{}) {
    queue.Add(item)
    QueueSize.WithLabelValues(queueName).Inc()
}

func removeFromQueue(queueName string) {
    queue.Remove()
    QueueSize.WithLabelValues(queueName).Dec()
}

// Update cache hit rate periodically
func updateCacheMetrics() {
    hits := cache.GetHits()
    total := cache.GetTotal()
    rate := float64(hits) / float64(total) * 100
    CacheHitRate.Set(rate)
}
```

### Histogram

Observe values and count them in buckets (request duration, response sizes).

```go
var (
    // HTTP request duration
    HttpRequestDuration = promauto.NewHistogramVec(
        prometheus.HistogramOpts{
            Name:    "http_request_duration_seconds",
            Help:    "HTTP request duration in seconds",
            Buckets: prometheus.DefBuckets, // [0.005, 0.01, 0.025, 0.05, 0.1, 0.25, 0.5, 1, 2.5, 5, 10]
        },
        []string{"method", "endpoint"},
    )
    
    // Custom buckets for database queries
    DbQueryDuration = promauto.NewHistogramVec(
        prometheus.HistogramOpts{
            Name:    "db_query_duration_seconds",
            Help:    "Database query duration in seconds",
            Buckets: []float64{0.001, 0.005, 0.01, 0.05, 0.1, 0.5, 1}, // Smaller buckets
        },
        []string{"operation", "table"},
    )
    
    // Response size
    ResponseSizeBytes = promauto.NewHistogram(
        prometheus.HistogramOpts{
            Name:    "response_size_bytes",
            Help:    "HTTP response size in bytes",
            Buckets: prometheus.ExponentialBuckets(100, 10, 8), // [100, 1000, 10000, ...]
        },
    )
)

// Usage
func getUsersHandler(c *gin.Context) {
    start := time.Now()
    
    // Execute query
    users := db.GetUsers()
    
    // Record duration
    duration := time.Since(start).Seconds()
    HttpRequestDuration.WithLabelValues("GET", "/api/users").Observe(duration)
    
    c.JSON(200, users)
}

func queryDatabase(operation, table string, query func()) {
    start := time.Now()
    
    query()
    
    duration := time.Since(start).Seconds()
    DbQueryDuration.WithLabelValues(operation, table).Observe(duration)
}
```

### Summary

Similar to histogram but calculates quantiles (percentiles).

```go
var (
    RequestLatency = promauto.NewSummaryVec(
        prometheus.SummaryOpts{
            Name:       "request_latency_seconds",
            Help:       "Request latency in seconds",
            Objectives: map[float64]float64{
                0.5:  0.05,  // 50th percentile with 5% error
                0.9:  0.01,  // 90th percentile with 1% error
                0.99: 0.001, // 99th percentile with 0.1% error
            },
        },
        []string{"endpoint"},
    )
)

// Usage
func handler(c *gin.Context) {
    start := time.Now()
    defer func() {
        duration := time.Since(start).Seconds()
        RequestLatency.WithLabelValues(c.FullPath()).Observe(duration)
    }()
    
    // Handle request
}
```

## Middleware for HTTP Metrics

```go
package middleware

import (
    "strconv"
    "time"
    
    "github.com/gin-gonic/gin"
    "github.com/prometheus/client_golang/prometheus"
    "github.com/prometheus/client_golang/prometheus/promauto"
)

var (
    httpRequests = promauto.NewCounterVec(
        prometheus.CounterOpts{
            Name: "http_requests_total",
            Help: "Total HTTP requests",
        },
        []string{"method", "path", "status"},
    )
    
    httpDuration = promauto.NewHistogramVec(
        prometheus.HistogramOpts{
            Name:    "http_request_duration_seconds",
            Help:    "HTTP request duration",
            Buckets: prometheus.DefBuckets,
        },
        []string{"method", "path"},
    )
    
    httpRequestSize = promauto.NewHistogramVec(
        prometheus.HistogramOpts{
            Name:    "http_request_size_bytes",
            Help:    "HTTP request size",
            Buckets: prometheus.ExponentialBuckets(100, 10, 8),
        },
        []string{"method", "path"},
    )
    
    httpResponseSize = promauto.NewHistogramVec(
        prometheus.HistogramOpts{
            Name:    "http_response_size_bytes",
            Help:    "HTTP response size",
            Buckets: prometheus.ExponentialBuckets(100, 10, 8),
        },
        []string{"method", "path"},
    )
)

func PrometheusMiddleware() gin.HandlerFunc {
    return func(c *gin.Context) {
        start := time.Now()
        path := c.FullPath()
        method := c.Request.Method
        
        // Request size
        if c.Request.ContentLength > 0 {
            httpRequestSize.WithLabelValues(method, path).Observe(float64(c.Request.ContentLength))
        }
        
        // Custom response writer to capture response size
        writer := &responseWriter{ResponseWriter: c.Writer, size: 0}
        c.Writer = writer
        
        // Process request
        c.Next()
        
        // Duration
        duration := time.Since(start).Seconds()
        httpDuration.WithLabelValues(method, path).Observe(duration)
        
        // Status and count
        status := strconv.Itoa(c.Writer.Status())
        httpRequests.WithLabelValues(method, path, status).Inc()
        
        // Response size
        httpResponseSize.WithLabelValues(method, path).Observe(float64(writer.size))
    }
}

type responseWriter struct {
    gin.ResponseWriter
    size int
}

func (w *responseWriter) Write(b []byte) (int, error) {
    size, err := w.ResponseWriter.Write(b)
    w.size += size
    return size, err
}

// Usage
func main() {
    r := gin.Default()
    
    // Add middleware
    r.Use(PrometheusMiddleware())
    
    // Metrics endpoint
    r.GET("/metrics", gin.WrapH(promhttp.Handler()))
    
    // Routes
    r.GET("/api/users", getUsers)
    
    r.Run(":8080")
}
```

## Business Metrics

```go
package metrics

import (
    "github.com/prometheus/client_golang/prometheus"
    "github.com/prometheus/client_golang/prometheus/promauto"
)

var (
    // User registrations
    UserRegistrations = promauto.NewCounterVec(
        prometheus.CounterOpts{
            Name: "user_registrations_total",
            Help: "Total user registrations",
        },
        []string{"source"}, // web, mobile, api
    )
    
    // Orders
    OrdersTotal = promauto.NewCounterVec(
        prometheus.CounterOpts{
            Name: "orders_total",
            Help: "Total orders",
        },
        []string{"status"}, // pending, completed, cancelled
    )
    
    OrderValue = promauto.NewHistogram(
        prometheus.HistogramOpts{
            Name:    "order_value_dollars",
            Help:    "Order value in dollars",
            Buckets: []float64{10, 50, 100, 500, 1000, 5000},
        },
    )
    
    // Active users
    ActiveUsers = promauto.NewGauge(
        prometheus.GaugeOpts{
            Name: "active_users",
            Help: "Number of currently active users",
        },
    )
    
    // Payment processing
    PaymentProcessingDuration = promauto.NewHistogramVec(
        prometheus.HistogramOpts{
            Name:    "payment_processing_duration_seconds",
            Help:    "Payment processing duration",
            Buckets: []float64{0.1, 0.5, 1, 2, 5, 10},
        },
        []string{"provider"}, // stripe, paypal
    )
)

// Usage
func registerUser(source string) {
    // ... registration logic
    
    UserRegistrations.WithLabelValues(source).Inc()
}

func createOrder(order Order) {
    // ... create order
    
    OrdersTotal.WithLabelValues("pending").Inc()
    OrderValue.Observe(order.TotalAmount)
}

func processPayment(provider string, amount float64) {
    start := time.Now()
    
    // ... process payment
    
    duration := time.Since(start).Seconds()
    PaymentProcessingDuration.WithLabelValues(provider).Observe(duration)
}
```

## Database Metrics

```go
package database

import (
    "database/sql"
    "time"
    
    "github.com/prometheus/client_golang/prometheus"
    "github.com/prometheus/client_golang/prometheus/promauto"
)

var (
    dbQueries = promauto.NewCounterVec(
        prometheus.CounterOpts{
            Name: "db_queries_total",
            Help: "Total database queries",
        },
        []string{"operation", "table"},
    )
    
    dbDuration = promauto.NewHistogramVec(
        prometheus.HistogramOpts{
            Name:    "db_query_duration_seconds",
            Help:    "Database query duration",
            Buckets: []float64{0.001, 0.005, 0.01, 0.05, 0.1, 0.5, 1},
        },
        []string{"operation", "table"},
    )
    
    dbConnections = promauto.NewGaugeVec(
        prometheus.GaugeOpts{
            Name: "db_connections",
            Help: "Database connections",
        },
        []string{"state"}, // idle, in_use, open
    )
)

type DB struct {
    *sql.DB
}

func (db *DB) Query(operation, table, query string, args ...interface{}) (*sql.Rows, error) {
    start := time.Now()
    
    rows, err := db.DB.Query(query, args...)
    
    duration := time.Since(start).Seconds()
    dbDuration.WithLabelValues(operation, table).Observe(duration)
    dbQueries.WithLabelValues(operation, table).Inc()
    
    return rows, err
}

// Update connection stats periodically
func (db *DB) UpdateConnectionMetrics() {
    stats := db.Stats()
    
    dbConnections.WithLabelValues("idle").Set(float64(stats.Idle))
    dbConnections.WithLabelValues("in_use").Set(float64(stats.InUse))
    dbConnections.WithLabelValues("open").Set(float64(stats.OpenConnections))
}
```

## Custom Registry

Avoid global registry for better testing.

```go
package metrics

import (
    "github.com/prometheus/client_golang/prometheus"
)

type Metrics struct {
    Registry *prometheus.Registry
    
    RequestsTotal   *prometheus.CounterVec
    RequestDuration *prometheus.HistogramVec
    ActiveUsers     prometheus.Gauge
}

func NewMetrics() *Metrics {
    reg := prometheus.NewRegistry()
    
    requestsTotal := prometheus.NewCounterVec(
        prometheus.CounterOpts{
            Name: "http_requests_total",
            Help: "Total HTTP requests",
        },
        []string{"method", "path", "status"},
    )
    
    requestDuration := prometheus.NewHistogramVec(
        prometheus.HistogramOpts{
            Name:    "http_request_duration_seconds",
            Help:    "HTTP request duration",
            Buckets: prometheus.DefBuckets,
        },
        []string{"method", "path"},
    )
    
    activeUsers := prometheus.NewGauge(
        prometheus.GaugeOpts{
            Name: "active_users",
            Help: "Active users",
        },
    )
    
    // Register metrics
    reg.MustRegister(requestsTotal, requestDuration, activeUsers)
    
    return &Metrics{
        Registry:        reg,
        RequestsTotal:   requestsTotal,
        RequestDuration: requestDuration,
        ActiveUsers:     activeUsers,
    }
}

// Usage
metrics := NewMetrics()

r.GET("/metrics", gin.WrapH(promhttp.HandlerFor(
    metrics.Registry,
    promhttp.HandlerOpts{},
)))
```

## Health Checks

```go
package health

import (
    "context"
    "database/sql"
    "time"
    
    "github.com/gin-gonic/gin"
    "github.com/go-redis/redis/v8"
)

type HealthChecker struct {
    DB    *sql.DB
    Redis *redis.Client
}

type HealthStatus struct {
    Status    string            `json:"status"`
    Timestamp time.Time         `json:"timestamp"`
    Checks    map[string]string `json:"checks"`
}

func (h *HealthChecker) HealthCheck(c *gin.Context) {
    ctx := context.Background()
    checks := make(map[string]string)
    status := "healthy"
    
    // Check database
    if err := h.DB.PingContext(ctx); err != nil {
        checks["database"] = "unhealthy: " + err.Error()
        status = "unhealthy"
    } else {
        checks["database"] = "healthy"
    }
    
    // Check Redis
    if err := h.Redis.Ping(ctx).Err(); err != nil {
        checks["redis"] = "unhealthy: " + err.Error()
        status = "unhealthy"
    } else {
        checks["redis"] = "healthy"
    }
    
    response := HealthStatus{
        Status:    status,
        Timestamp: time.Now(),
        Checks:    checks,
    }
    
    if status == "healthy" {
        c.JSON(200, response)
    } else {
        c.JSON(503, response)
    }
}

// Liveness probe (is app running?)
func (h *HealthChecker) Liveness(c *gin.Context) {
    c.JSON(200, gin.H{"status": "alive"})
}

// Readiness probe (can app handle traffic?)
func (h *HealthChecker) Readiness(c *gin.Context) {
    ctx, cancel := context.WithTimeout(context.Background(), 2*time.Second)
    defer cancel()
    
    // Check critical dependencies
    if err := h.DB.PingContext(ctx); err != nil {
        c.JSON(503, gin.H{"status": "not_ready", "reason": "database"})
        return
    }
    
    c.JSON(200, gin.H{"status": "ready"})
}

// Usage
func main() {
    checker := &HealthChecker{DB: db, Redis: redisClient}
    
    r.GET("/health", checker.HealthCheck)
    r.GET("/health/live", checker.Liveness)
    r.GET("/health/ready", checker.Readiness)
}
```

## Prometheus Configuration

`prometheus.yml`:
```yaml
global:
  scrape_interval: 15s
  evaluation_interval: 15s

scrape_configs:
  - job_name: 'go-backend'
    static_configs:
      - targets: ['localhost:8080']
    metrics_path: '/metrics'
    scrape_interval: 10s
```

## PromQL Examples

```promql
# Request rate (requests per second)
rate(http_requests_total[5m])

# Average request duration
rate(http_request_duration_seconds_sum[5m]) / rate(http_request_duration_seconds_count[5m])

# 95th percentile latency
histogram_quantile(0.95, rate(http_request_duration_seconds_bucket[5m]))

# Error rate
rate(http_requests_total{status=~"5.."}[5m]) / rate(http_requests_total[5m])

# Active connections
active_connections

# Database query rate by operation
sum(rate(db_queries_total[5m])) by (operation)
```

## Grafana Dashboard

JSON snippet for Grafana:
```json
{
  "title": "Go Backend Metrics",
  "panels": [
    {
      "title": "Request Rate",
      "targets": [
        {
          "expr": "rate(http_requests_total[5m])"
        }
      ]
    },
    {
      "title": "P95 Latency",
      "targets": [
        {
          "expr": "histogram_quantile(0.95, rate(http_request_duration_seconds_bucket[5m]))"
        }
      ]
    }
  ]
}
```

## Best Practices

1. **Meaningful Names**: `http_requests_total`, not `requests`
2. **Use Labels Wisely**: Don't create high cardinality (avoid user IDs)
3. **Choose Right Type**: Counter for totals, Gauge for current values, Histogram for distributions
4. **Instrument Critical Paths**: HTTP requests, database queries, external calls
5. **Monitor Business Metrics**: Not just technical metrics
6. **Set Realistic Buckets**: Match your expected latencies
7. **Expose `/metrics` Separately**: Don't add middleware overhead

## Summary

Prometheus monitoring provides:
- **Real-time Metrics**: Track application performance
- **Alerting**: Detect issues automatically
- **Visualization**: Grafana dashboards
- **Time-Series Analysis**: Historical trends
- **Flexible Queries**: PromQL for insights

Essential for production Go backends.
