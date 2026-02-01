# Health Checks in Production Go Applications

## Overview
Health checks are essential endpoints that allow monitoring systems, load balancers, and orchestrators (like Kubernetes) to determine if your application is running correctly and ready to serve traffic.

## Types of Health Checks

### 1. Liveness Probe
Determines if the application is alive and running.

### 2. Readiness Probe
Determines if the application is ready to accept traffic.

### 3. Startup Probe
Determines if the application has finished starting up.

## Basic Health Check Implementation

```go
package health

import (
    "encoding/json"
    "net/http"
    "sync"
    "time"
)

type Status string

const (
    StatusOK   Status = "ok"
    StatusFail Status = "fail"
)

type HealthCheck struct {
    mu        sync.RWMutex
    checks    map[string]Checker
    startTime time.Time
}

type Checker interface {
    Check() error
}

type Response struct {
    Status  Status            `json:"status"`
    Version string            `json:"version,omitempty"`
    Uptime  string            `json:"uptime,omitempty"`
    Checks  map[string]Detail `json:"checks,omitempty"`
}

type Detail struct {
    Status  Status `json:"status"`
    Message string `json:"message,omitempty"`
}

func New() *HealthCheck {
    return &HealthCheck{
        checks:    make(map[string]Checker),
        startTime: time.Now(),
    }
}

func (h *HealthCheck) Register(name string, checker Checker) {
    h.mu.Lock()
    defer h.mu.Unlock()
    h.checks[name] = checker
}

func (h *HealthCheck) Handler(version string) http.HandlerFunc {
    return func(w http.ResponseWriter, r *http.Request) {
        h.mu.RLock()
        checks := make(map[string]Checker, len(h.checks))
        for k, v := range h.checks {
            checks[k] = v
        }
        h.mu.RUnlock()
        
        response := Response{
            Status:  StatusOK,
            Version: version,
            Uptime:  time.Since(h.startTime).String(),
            Checks:  make(map[string]Detail),
        }
        
        // Run all checks
        for name, checker := range checks {
            if err := checker.Check(); err != nil {
                response.Status = StatusFail
                response.Checks[name] = Detail{
                    Status:  StatusFail,
                    Message: err.Error(),
                }
            } else {
                response.Checks[name] = Detail{
                    Status: StatusOK,
                }
            }
        }
        
        // Set status code based on overall health
        statusCode := http.StatusOK
        if response.Status == StatusFail {
            statusCode = http.StatusServiceUnavailable
        }
        
        w.Header().Set("Content-Type", "application/json")
        w.WriteHeader(statusCode)
        json.NewEncoder(w).Encode(response)
    }
}

// Liveness handler - simple check if app is running
func (h *HealthCheck) LivenessHandler() http.HandlerFunc {
    return func(w http.ResponseWriter, r *http.Request) {
        w.WriteHeader(http.StatusOK)
        w.Write([]byte("OK"))
    }
}

// Readiness handler - check if app is ready to serve traffic
func (h *HealthCheck) ReadinessHandler() http.HandlerFunc {
    return h.Handler("")
}
```

## Database Health Check

```go
package health

import (
    "context"
    "database/sql"
    "fmt"
    "time"
)

type DatabaseChecker struct {
    db      *sql.DB
    timeout time.Duration
}

func NewDatabaseChecker(db *sql.DB, timeout time.Duration) *DatabaseChecker {
    return &DatabaseChecker{
        db:      db,
        timeout: timeout,
    }
}

func (d *DatabaseChecker) Check() error {
    ctx, cancel := context.WithTimeout(context.Background(), d.timeout)
    defer cancel()
    
    // Test database connectivity
    if err := d.db.PingContext(ctx); err != nil {
        return fmt.Errorf("database ping failed: %w", err)
    }
    
    // Test database query
    var result int
    query := "SELECT 1"
    if err := d.db.QueryRowContext(ctx, query).Scan(&result); err != nil {
        return fmt.Errorf("database query failed: %w", err)
    }
    
    // Check connection pool stats
    stats := d.db.Stats()
    if stats.OpenConnections == 0 {
        return fmt.Errorf("no open database connections")
    }
    
    return nil
}
```

## Redis Health Check

```go
package health

import (
    "context"
    "fmt"
    "time"
    
    "github.com/redis/go-redis/v9"
)

type RedisChecker struct {
    client  *redis.Client
    timeout time.Duration
}

func NewRedisChecker(client *redis.Client, timeout time.Duration) *RedisChecker {
    return &RedisChecker{
        client:  client,
        timeout: timeout,
    }
}

func (r *RedisChecker) Check() error {
    ctx, cancel := context.WithTimeout(context.Background(), r.timeout)
    defer cancel()
    
    // Ping Redis
    if err := r.client.Ping(ctx).Err(); err != nil {
        return fmt.Errorf("redis ping failed: %w", err)
    }
    
    // Check connection pool stats
    stats := r.client.PoolStats()
    if stats.TotalConns == 0 {
        return fmt.Errorf("no redis connections")
    }
    
    return nil
}
```

## HTTP Dependency Health Check

```go
package health

import (
    "context"
    "fmt"
    "net/http"
    "time"
)

type HTTPChecker struct {
    url     string
    client  *http.Client
    timeout time.Duration
}

func NewHTTPChecker(url string, timeout time.Duration) *HTTPChecker {
    return &HTTPChecker{
        url:     url,
        timeout: timeout,
        client: &http.Client{
            Timeout: timeout,
        },
    }
}

func (h *HTTPChecker) Check() error {
    ctx, cancel := context.WithTimeout(context.Background(), h.timeout)
    defer cancel()
    
    req, err := http.NewRequestWithContext(ctx, http.MethodGet, h.url, nil)
    if err != nil {
        return fmt.Errorf("failed to create request: %w", err)
    }
    
    resp, err := h.client.Do(req)
    if err != nil {
        return fmt.Errorf("health check request failed: %w", err)
    }
    defer resp.Body.Close()
    
    if resp.StatusCode != http.StatusOK {
        return fmt.Errorf("unhealthy status code: %d", resp.StatusCode)
    }
    
    return nil
}
```

## Complete Health Check Setup

```go
package main

import (
    "database/sql"
    "log"
    "net/http"
    "time"
    
    "github.com/redis/go-redis/v9"
    "myapp/health"
)

func main() {
    // Initialize dependencies
    db, _ := sql.Open("postgres", "connection-string")
    rdb := redis.NewClient(&redis.Options{Addr: "localhost:6379"})
    
    // Create health check system
    healthCheck := health.New()
    
    // Register checkers
    healthCheck.Register("database", health.NewDatabaseChecker(db, 2*time.Second))
    healthCheck.Register("redis", health.NewRedisChecker(rdb, 2*time.Second))
    healthCheck.Register("external_api", health.NewHTTPChecker(
        "https://api.example.com/health",
        3*time.Second,
    ))
    
    // Setup routes
    http.HandleFunc("/health", healthCheck.Handler("v1.0.0"))
    http.HandleFunc("/health/live", healthCheck.LivenessHandler())
    http.HandleFunc("/health/ready", healthCheck.ReadinessHandler())
    
    log.Fatal(http.ListenAndServe(":8080", nil))
}
```

## Advanced Health Check with Custom Metrics

```go
package health

import (
    "encoding/json"
    "net/http"
    "runtime"
    "sync"
    "time"
)

type AdvancedHealthCheck struct {
    *HealthCheck
    metrics *Metrics
}

type Metrics struct {
    mu              sync.RWMutex
    requestCount    int64
    errorCount      int64
    lastRequestTime time.Time
}

type AdvancedResponse struct {
    Response
    Metrics MetricsDetail `json:"metrics,omitempty"`
    System  SystemInfo    `json:"system,omitempty"`
}

type MetricsDetail struct {
    RequestCount    int64  `json:"request_count"`
    ErrorCount      int64  `json:"error_count"`
    LastRequestTime string `json:"last_request_time,omitempty"`
}

type SystemInfo struct {
    Goroutines   int    `json:"goroutines"`
    MemoryAlloc  uint64 `json:"memory_alloc_mb"`
    MemorySys    uint64 `json:"memory_sys_mb"`
    NumGC        uint32 `json:"num_gc"`
}

func NewAdvanced() *AdvancedHealthCheck {
    return &AdvancedHealthCheck{
        HealthCheck: New(),
        metrics:     &Metrics{},
    }
}

func (h *AdvancedHealthCheck) IncrementRequest() {
    h.metrics.mu.Lock()
    defer h.metrics.mu.Unlock()
    h.metrics.requestCount++
    h.metrics.lastRequestTime = time.Now()
}

func (h *AdvancedHealthCheck) IncrementError() {
    h.metrics.mu.Lock()
    defer h.metrics.mu.Unlock()
    h.metrics.errorCount++
}

func (h *AdvancedHealthCheck) DetailedHandler(version string) http.HandlerFunc {
    return func(w http.ResponseWriter, r *http.Request) {
        // Get system info
        var m runtime.MemStats
        runtime.ReadMemStats(&m)
        
        systemInfo := SystemInfo{
            Goroutines:  runtime.NumGoroutine(),
            MemoryAlloc: m.Alloc / 1024 / 1024,
            MemorySys:   m.Sys / 1024 / 1024,
            NumGC:       m.NumGC,
        }
        
        // Get metrics
        h.metrics.mu.RLock()
        metricsDetail := MetricsDetail{
            RequestCount: h.metrics.requestCount,
            ErrorCount:   h.metrics.errorCount,
        }
        if !h.metrics.lastRequestTime.IsZero() {
            metricsDetail.LastRequestTime = h.metrics.lastRequestTime.Format(time.RFC3339)
        }
        h.metrics.mu.RUnlock()
        
        // Run health checks
        h.HealthCheck.mu.RLock()
        checks := make(map[string]Checker, len(h.HealthCheck.checks))
        for k, v := range h.HealthCheck.checks {
            checks[k] = v
        }
        h.HealthCheck.mu.RUnlock()
        
        response := AdvancedResponse{
            Response: Response{
                Status:  StatusOK,
                Version: version,
                Uptime:  time.Since(h.HealthCheck.startTime).String(),
                Checks:  make(map[string]Detail),
            },
            Metrics: metricsDetail,
            System:  systemInfo,
        }
        
        for name, checker := range checks {
            if err := checker.Check(); err != nil {
                response.Status = StatusFail
                response.Checks[name] = Detail{
                    Status:  StatusFail,
                    Message: err.Error(),
                }
            } else {
                response.Checks[name] = Detail{
                    Status: StatusOK,
                }
            }
        }
        
        statusCode := http.StatusOK
        if response.Status == StatusFail {
            statusCode = http.StatusServiceUnavailable
        }
        
        w.Header().Set("Content-Type", "application/json")
        w.WriteHeader(statusCode)
        json.NewEncoder(w).Encode(response)
    }
}
```

## Kubernetes Health Check Configuration

```yaml
# deployment.yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: myapp
spec:
  replicas: 3
  template:
    spec:
      containers:
      - name: myapp
        image: myapp:latest
        ports:
        - containerPort: 8080
        
        # Liveness probe - restart if this fails
        livenessProbe:
          httpGet:
            path: /health/live
            port: 8080
          initialDelaySeconds: 30
          periodSeconds: 10
          timeoutSeconds: 5
          failureThreshold: 3
        
        # Readiness probe - remove from service if this fails
        readinessProbe:
          httpGet:
            path: /health/ready
            port: 8080
          initialDelaySeconds: 10
          periodSeconds: 5
          timeoutSeconds: 3
          failureThreshold: 3
        
        # Startup probe - for slow starting apps
        startupProbe:
          httpGet:
            path: /health/live
            port: 8080
          initialDelaySeconds: 0
          periodSeconds: 10
          timeoutSeconds: 3
          failureThreshold: 30  # 30 * 10 = 300 seconds max startup time
```

## Circuit Breaker Health Check

```go
package health

import (
    "fmt"
    "sync"
    "time"
)

type CircuitBreaker struct {
    mu              sync.RWMutex
    maxFailures     int
    resetTimeout    time.Duration
    failures        int
    lastFailureTime time.Time
    state           string
}

func NewCircuitBreaker(maxFailures int, resetTimeout time.Duration) *CircuitBreaker {
    return &CircuitBreaker{
        maxFailures:  maxFailures,
        resetTimeout: resetTimeout,
        state:        "closed",
    }
}

func (cb *CircuitBreaker) Check() error {
    cb.mu.Lock()
    defer cb.mu.Unlock()
    
    // Check if we should reset
    if cb.state == "open" && time.Since(cb.lastFailureTime) > cb.resetTimeout {
        cb.state = "half-open"
        cb.failures = 0
    }
    
    if cb.state == "open" {
        return fmt.Errorf("circuit breaker is open")
    }
    
    return nil
}

func (cb *CircuitBreaker) RecordFailure() {
    cb.mu.Lock()
    defer cb.mu.Unlock()
    
    cb.failures++
    cb.lastFailureTime = time.Now()
    
    if cb.failures >= cb.maxFailures {
        cb.state = "open"
    }
}

func (cb *CircuitBreaker) RecordSuccess() {
    cb.mu.Lock()
    defer cb.mu.Unlock()
    
    if cb.state == "half-open" {
        cb.state = "closed"
        cb.failures = 0
    }
}

func (cb *CircuitBreaker) State() string {
    cb.mu.RLock()
    defer cb.mu.RUnlock()
    return cb.state
}
```

## Best Practices

### 1. **Separate Liveness and Readiness**
- Liveness: Simple check if app is running
- Readiness: Check if app can handle traffic

### 2. **Set Appropriate Timeouts**
```go
checker := NewDatabaseChecker(db, 2*time.Second)
```

### 3. **Include Dependency Checks in Readiness Only**
```go
// Readiness includes all dependencies
readinessCheck.Register("database", dbChecker)
readinessCheck.Register("redis", redisChecker)

// Liveness is just app running
func LivenessHandler(w http.ResponseWriter, r *http.Request) {
    w.WriteHeader(http.StatusOK)
}
```

### 4. **Return Proper Status Codes**
- 200 OK: Healthy
- 503 Service Unavailable: Unhealthy

### 5. **Include Version Information**
```go
response := Response{
    Version: "v1.2.3",
    Commit:  "abc123",
}
```

## Testing Health Checks

```go
package health_test

import (
    "net/http"
    "net/http/httptest"
    "testing"
    
    "github.com/stretchr/testify/assert"
)

func TestHealthHandler(t *testing.T) {
    healthCheck := health.New()
    
    req := httptest.NewRequest(http.MethodGet, "/health", nil)
    w := httptest.NewRecorder()
    
    healthCheck.Handler("v1.0.0")(w, req)
    
    assert.Equal(t, http.StatusOK, w.Code)
}

func TestDatabaseHealthCheck(t *testing.T) {
    db, mock, _ := sqlmock.New(sqlmock.MonitorPingsOption(true))
    defer db.Close()
    
    checker := health.NewDatabaseChecker(db, 2*time.Second)
    
    // Test successful check
    mock.ExpectPing()
    mock.ExpectQuery("SELECT 1").WillReturnRows(sqlmock.NewRows([]string{"1"}).AddRow(1))
    
    err := checker.Check()
    assert.NoError(t, err)
    
    // Test failed check
    mock.ExpectPing().WillReturnError(fmt.Errorf("connection failed"))
    
    err = checker.Check()
    assert.Error(t, err)
}
```

## Summary

Effective health checks provide:
- **Liveness**: Detect and restart failed applications
- **Readiness**: Prevent traffic to unhealthy instances
- **Dependency Monitoring**: Track external service health
- **Metrics**: Application performance indicators
- **Proper Status Codes**: Clear communication with orchestrators

Health checks are critical for production reliability and enable automated recovery from failures.
