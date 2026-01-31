# Circuit Breaker and Resilience Patterns

## What is a Circuit Breaker?

**Circuit Breaker** prevents cascading failures by stopping requests to failing services:
- **Fail Fast**: Return errors immediately when service is down
- **Auto Recovery**: Test service health automatically
- **Resource Protection**: Prevent thread/connection exhaustion

## Why Resilience Patterns?

Distributed systems fail:
- **Network Issues**: Timeouts, packet loss
- **Service Overload**: Too many requests
- **Cascading Failures**: One failure triggers others
- **Resource Exhaustion**: Connection pool depletion

## Circuit Breaker States

```
Closed → Open → Half-Open → Closed
```

### Closed
Normal operation, requests pass through.

### Open
Failures exceeded threshold, requests fail immediately.

### Half-Open
Testing if service recovered, limited requests allowed.

## Installation

```bash
go get github.com/sony/gobreaker
go get github.com/avast/retry-go/v4
```

## Basic Circuit Breaker

```go
package resilience

import (
    "errors"
    "time"
    
    "github.com/sony/gobreaker"
)

var (
    ErrCircuitOpen = errors.New("circuit breaker is open")
)

func NewCircuitBreaker(name string) *gobreaker.CircuitBreaker {
    settings := gobreaker.Settings{
        Name:        name,
        MaxRequests: 3,                // Half-open: max successful requests before closing
        Interval:    10 * time.Second, // Reset failure count after this duration
        Timeout:     60 * time.Second, // Open state duration before half-open
        ReadyToTrip: func(counts gobreaker.Counts) bool {
            // Open circuit if 5 consecutive failures
            failureRatio := float64(counts.TotalFailures) / float64(counts.Requests)
            return counts.Requests >= 3 && failureRatio >= 0.6
        },
        OnStateChange: func(name string, from, to gobreaker.State) {
            log.Printf("Circuit breaker '%s' changed from %s to %s", name, from, to)
        },
    }
    
    return gobreaker.NewCircuitBreaker(settings)
}

// Usage
func CallExternalAPI(cb *gobreaker.CircuitBreaker, url string) (interface{}, error) {
    result, err := cb.Execute(func() (interface{}, error) {
        // Your API call here
        resp, err := http.Get(url)
        if err != nil {
            return nil, err
        }
        defer resp.Body.Close()
        
        if resp.StatusCode >= 500 {
            return nil, errors.New("server error")
        }
        
        return parseResponse(resp)
    })
    
    if err != nil {
        if err == gobreaker.ErrOpenState {
            return nil, ErrCircuitOpen
        }
        return nil, err
    }
    
    return result, nil
}
```

## Retry Pattern

```go
package resilience

import (
    "context"
    "time"
    
    "github.com/avast/retry-go/v4"
)

func CallWithRetry(ctx context.Context, fn func() error) error {
    return retry.Do(
        fn,
        retry.Attempts(3),
        retry.Delay(time.Second),
        retry.DelayType(retry.BackOffDelay),
        retry.OnRetry(func(n uint, err error) {
            log.Printf("Retry attempt %d: %v", n, err)
        }),
        retry.RetryIf(func(err error) bool {
            // Retry on network errors, not on validation errors
            return isRetryableError(err)
        }),
        retry.Context(ctx),
    )
}

func isRetryableError(err error) bool {
    // Network errors, timeouts, 5xx errors
    if netErr, ok := err.(net.Error); ok && netErr.Timeout() {
        return true
    }
    // Add more conditions
    return false
}

// Example usage
func FetchUserData(ctx context.Context, userID string) (*User, error) {
    var user *User
    
    err := CallWithRetry(ctx, func() error {
        var err error
        user, err = apiClient.GetUser(userID)
        return err
    })
    
    return user, err
}
```

## Exponential Backoff

```go
package resilience

import (
    "context"
    "time"
    
    "github.com/avast/retry-go/v4"
)

func CallWithExponentialBackoff(ctx context.Context, fn func() error) error {
    return retry.Do(
        fn,
        retry.Attempts(5),
        retry.Delay(100*time.Millisecond),
        retry.MaxDelay(10*time.Second),
        retry.DelayType(retry.BackOffDelay),
        retry.Context(ctx),
    )
}

// Custom exponential backoff
func CustomBackoff(ctx context.Context, fn func() error, maxAttempts int) error {
    var lastErr error
    
    for attempt := 0; attempt < maxAttempts; attempt++ {
        if err := fn(); err == nil {
            return nil
        } else {
            lastErr = err
        }
        
        if attempt < maxAttempts-1 {
            // Exponential delay: 100ms, 200ms, 400ms, 800ms, 1600ms
            delay := time.Duration(100*(1<<attempt)) * time.Millisecond
            
            select {
            case <-time.After(delay):
                // Continue to next attempt
            case <-ctx.Done():
                return ctx.Err()
            }
        }
    }
    
    return lastErr
}
```

## Timeout Pattern

```go
package resilience

import (
    "context"
    "time"
)

func CallWithTimeout(timeout time.Duration, fn func(context.Context) error) error {
    ctx, cancel := context.WithTimeout(context.Background(), timeout)
    defer cancel()
    
    errChan := make(chan error, 1)
    
    go func() {
        errChan <- fn(ctx)
    }()
    
    select {
    case err := <-errChan:
        return err
    case <-ctx.Done():
        return ctx.Err() // timeout or cancelled
    }
}

// HTTP client with timeout
func NewHTTPClientWithTimeout(timeout time.Duration) *http.Client {
    return &http.Client{
        Timeout: timeout,
        Transport: &http.Transport{
            DialContext: (&net.Dialer{
                Timeout:   5 * time.Second,
                KeepAlive: 30 * time.Second,
            }).DialContext,
            TLSHandshakeTimeout:   5 * time.Second,
            ResponseHeaderTimeout: 5 * time.Second,
            ExpectContinueTimeout: 1 * time.Second,
            MaxIdleConns:          100,
            MaxIdleConnsPerHost:   10,
            IdleConnTimeout:       90 * time.Second,
        },
    }
}
```

## Bulkhead Pattern

Isolate resources to prevent one failure from affecting others.

```go
package resilience

import (
    "context"
    "errors"
)

type Bulkhead struct {
    maxConcurrent int
    sem           chan struct{}
}

func NewBulkhead(maxConcurrent int) *Bulkhead {
    return &Bulkhead{
        maxConcurrent: maxConcurrent,
        sem:           make(chan struct{}, maxConcurrent),
    }
}

func (b *Bulkhead) Execute(ctx context.Context, fn func() error) error {
    select {
    case b.sem <- struct{}{}:
        // Acquired semaphore
        defer func() { <-b.sem }()
        return fn()
    case <-ctx.Done():
        return ctx.Err()
    default:
        return errors.New("bulkhead full")
    }
}

// Example: Separate bulkheads for different resources
type ServiceClient struct {
    dbBulkhead    *Bulkhead
    cacheBulkhead *Bulkhead
    apiBulkhead   *Bulkhead
}

func NewServiceClient() *ServiceClient {
    return &ServiceClient{
        dbBulkhead:    NewBulkhead(50),  // Max 50 concurrent DB calls
        cacheBulkhead: NewBulkhead(100), // Max 100 concurrent cache calls
        apiBulkhead:   NewBulkhead(20),  // Max 20 concurrent API calls
    }
}

func (s *ServiceClient) GetUserFromDB(ctx context.Context, id string) (*User, error) {
    var user *User
    err := s.dbBulkhead.Execute(ctx, func() error {
        var err error
        user, err = queryDatabase(id)
        return err
    })
    return user, err
}
```

## Rate Limiter

```go
package resilience

import (
    "context"
    "time"
    
    "golang.org/x/time/rate"
)

type RateLimiter struct {
    limiter *rate.Limiter
}

func NewRateLimiter(requestsPerSecond int) *RateLimiter {
    return &RateLimiter{
        limiter: rate.NewLimiter(rate.Limit(requestsPerSecond), requestsPerSecond),
    }
}

func (rl *RateLimiter) Allow() bool {
    return rl.limiter.Allow()
}

func (rl *RateLimiter) Wait(ctx context.Context) error {
    return rl.limiter.Wait(ctx)
}

// Usage with HTTP handler
func RateLimitMiddleware(rps int) gin.HandlerFunc {
    limiter := NewRateLimiter(rps)
    
    return func(c *gin.Context) {
        if !limiter.Allow() {
            c.JSON(429, gin.H{"error": "rate limit exceeded"})
            c.Abort()
            return
        }
        c.Next()
    }
}

// Per-user rate limiting
type UserRateLimiter struct {
    limiters map[string]*rate.Limiter
    mu       sync.RWMutex
    rate     rate.Limit
    burst    int
}

func NewUserRateLimiter(r rate.Limit, burst int) *UserRateLimiter {
    return &UserRateLimiter{
        limiters: make(map[string]*rate.Limiter),
        rate:     r,
        burst:    burst,
    }
}

func (url *UserRateLimiter) GetLimiter(userID string) *rate.Limiter {
    url.mu.RLock()
    limiter, exists := url.limiters[userID]
    url.mu.RUnlock()
    
    if exists {
        return limiter
    }
    
    url.mu.Lock()
    defer url.mu.Unlock()
    
    // Double check
    if limiter, exists := url.limiters[userID]; exists {
        return limiter
    }
    
    limiter = rate.NewLimiter(url.rate, url.burst)
    url.limiters[userID] = limiter
    return limiter
}
```

## Fallback Pattern

```go
package resilience

import (
    "context"
)

type FallbackFunc func(ctx context.Context) (interface{}, error)

func CallWithFallback(ctx context.Context, primary, fallback FallbackFunc) (interface{}, error) {
    result, err := primary(ctx)
    if err != nil {
        log.Printf("Primary call failed: %v, using fallback", err)
        return fallback(ctx)
    }
    return result, nil
}

// Example: Cache fallback
func GetUserWithFallback(ctx context.Context, userID string) (*User, error) {
    primary := func(ctx context.Context) (interface{}, error) {
        return getUserFromDatabase(ctx, userID)
    }
    
    fallback := func(ctx context.Context) (interface{}, error) {
        return getUserFromCache(ctx, userID)
    }
    
    result, err := CallWithFallback(ctx, primary, fallback)
    if err != nil {
        return nil, err
    }
    
    return result.(*User), nil
}

// Multiple fallbacks
func GetUserWithMultipleFallbacks(ctx context.Context, userID string) (*User, error) {
    // Try primary database
    user, err := getUserFromDatabase(ctx, userID)
    if err == nil {
        return user, nil
    }
    
    // Fallback 1: Redis cache
    user, err = getUserFromCache(ctx, userID)
    if err == nil {
        return user, nil
    }
    
    // Fallback 2: Read replica
    user, err = getUserFromReplica(ctx, userID)
    if err == nil {
        return user, nil
    }
    
    // Fallback 3: Default user
    return &User{ID: userID, Name: "Unknown"}, nil
}
```

## Complete Resilient HTTP Client

```go
package client

import (
    "context"
    "net/http"
    "time"
    
    "github.com/sony/gobreaker"
    "github.com/avast/retry-go/v4"
)

type ResilientClient struct {
    httpClient     *http.Client
    circuitBreaker *gobreaker.CircuitBreaker
    timeout        time.Duration
}

func NewResilientClient() *ResilientClient {
    return &ResilientClient{
        httpClient: &http.Client{
            Timeout: 10 * time.Second,
            Transport: &http.Transport{
                MaxIdleConns:        100,
                MaxIdleConnsPerHost: 10,
                IdleConnTimeout:     90 * time.Second,
            },
        },
        circuitBreaker: NewCircuitBreaker("api-client"),
        timeout:        30 * time.Second,
    }
}

func (rc *ResilientClient) Get(ctx context.Context, url string) (*Response, error) {
    ctx, cancel := context.WithTimeout(ctx, rc.timeout)
    defer cancel()
    
    var response *Response
    
    // Retry with exponential backoff
    err := retry.Do(
        func() error {
            // Circuit breaker
            result, err := rc.circuitBreaker.Execute(func() (interface{}, error) {
                req, err := http.NewRequestWithContext(ctx, "GET", url, nil)
                if err != nil {
                    return nil, err
                }
                
                resp, err := rc.httpClient.Do(req)
                if err != nil {
                    return nil, err
                }
                defer resp.Body.Close()
                
                if resp.StatusCode >= 500 {
                    return nil, errors.New("server error")
                }
                
                return parseResponse(resp)
            })
            
            if err != nil {
                return err
            }
            
            response = result.(*Response)
            return nil
        },
        retry.Attempts(3),
        retry.Delay(500*time.Millisecond),
        retry.DelayType(retry.BackOffDelay),
        retry.RetryIf(func(err error) bool {
            return err != gobreaker.ErrOpenState
        }),
        retry.Context(ctx),
    )
    
    return response, err
}
```

## Service with Full Resilience

```go
package service

import (
    "context"
    "time"
)

type UserService struct {
    db             *gorm.DB
    cache          *redis.Client
    apiClient      *ResilientClient
    circuitBreaker *gobreaker.CircuitBreaker
    bulkhead       *Bulkhead
    rateLimiter    *RateLimiter
}

func NewUserService(db *gorm.DB, cache *redis.Client) *UserService {
    return &UserService{
        db:             db,
        cache:          cache,
        apiClient:      NewResilientClient(),
        circuitBreaker: NewCircuitBreaker("user-service"),
        bulkhead:       NewBulkhead(50),
        rateLimiter:    NewRateLimiter(100),
    }
}

func (s *UserService) GetUser(ctx context.Context, userID string) (*User, error) {
    // Rate limiting
    if !s.rateLimiter.Allow() {
        return nil, errors.New("rate limit exceeded")
    }
    
    // Bulkhead
    var user *User
    err := s.bulkhead.Execute(ctx, func() error {
        // Circuit breaker
        result, err := s.circuitBreaker.Execute(func() (interface{}, error) {
            // Timeout
            ctx, cancel := context.WithTimeout(ctx, 5*time.Second)
            defer cancel()
            
            // Try cache first
            if cachedUser, err := s.getUserFromCache(ctx, userID); err == nil {
                return cachedUser, nil
            }
            
            // Fallback to database with retry
            var dbUser *User
            retryErr := retry.Do(
                func() error {
                    var err error
                    dbUser, err = s.getUserFromDB(ctx, userID)
                    return err
                },
                retry.Attempts(3),
                retry.Delay(100*time.Millisecond),
                retry.Context(ctx),
            )
            
            if retryErr != nil {
                return nil, retryErr
            }
            
            // Cache result
            s.cacheUser(ctx, dbUser)
            
            return dbUser, nil
        })
        
        if err != nil {
            return err
        }
        
        user = result.(*User)
        return nil
    })
    
    return user, err
}

func (s *UserService) getUserFromCache(ctx context.Context, userID string) (*User, error) {
    key := "user:" + userID
    data, err := s.cache.Get(ctx, key).Bytes()
    if err != nil {
        return nil, err
    }
    
    var user User
    if err := json.Unmarshal(data, &user); err != nil {
        return nil, err
    }
    
    return &user, nil
}

func (s *UserService) getUserFromDB(ctx context.Context, userID string) (*User, error) {
    var user User
    err := s.db.WithContext(ctx).First(&user, "id = ?", userID).Error
    return &user, err
}

func (s *UserService) cacheUser(ctx context.Context, user *User) {
    key := "user:" + user.ID
    data, _ := json.Marshal(user)
    s.cache.Set(ctx, key, data, 10*time.Minute)
}
```

## Health Check with Circuit Breaker

```go
package health

import (
    "context"
    "time"
    
    "github.com/sony/gobreaker"
)

type HealthChecker struct {
    services map[string]*ServiceHealth
}

type ServiceHealth struct {
    name           string
    checkFunc      func(context.Context) error
    circuitBreaker *gobreaker.CircuitBreaker
}

func NewHealthChecker() *HealthChecker {
    return &HealthChecker{
        services: make(map[string]*ServiceHealth),
    }
}

func (hc *HealthChecker) AddService(name string, checkFunc func(context.Context) error) {
    hc.services[name] = &ServiceHealth{
        name:           name,
        checkFunc:      checkFunc,
        circuitBreaker: NewCircuitBreaker(name),
    }
}

func (hc *HealthChecker) Check(ctx context.Context) map[string]string {
    results := make(map[string]string)
    
    for name, service := range hc.services {
        _, err := service.circuitBreaker.Execute(func() (interface{}, error) {
            return nil, service.checkFunc(ctx)
        })
        
        if err != nil {
            if err == gobreaker.ErrOpenState {
                results[name] = "circuit_open"
            } else {
                results[name] = "unhealthy"
            }
        } else {
            results[name] = "healthy"
        }
    }
    
    return results
}

// Usage
func setupHealthCheck(db *gorm.DB, redis *redis.Client) *HealthChecker {
    hc := NewHealthChecker()
    
    hc.AddService("database", func(ctx context.Context) error {
        return db.WithContext(ctx).Exec("SELECT 1").Error
    })
    
    hc.AddService("redis", func(ctx context.Context) error {
        return redis.Ping(ctx).Err()
    })
    
    return hc
}
```

## Best Practices

1. **Combine Patterns**: Use circuit breaker + retry + timeout together
2. **Set Proper Timeouts**: Avoid waiting forever
3. **Monitor State Changes**: Log circuit breaker state transitions
4. **Graceful Degradation**: Use fallbacks when possible
5. **Rate Limiting**: Protect your service from overload
6. **Bulkheads**: Isolate critical resources
7. **Health Checks**: Monitor circuit breaker states
8. **Metrics**: Track failure rates, response times
9. **Idempotency**: Make retries safe
10. **Context Propagation**: Respect cancellation

## Common Configurations

```go
// Fast failing (public API)
CircuitBreaker{
    Timeout:     10 * time.Second,
    MaxRequests: 3,
    Interval:    5 * time.Second,
}

// Tolerant (internal service)
CircuitBreaker{
    Timeout:     60 * time.Second,
    MaxRequests: 10,
    Interval:    30 * time.Second,
}

// Aggressive retry (transient failures)
Retry{
    Attempts: 5,
    Delay:    100 * time.Millisecond,
    MaxDelay: 2 * time.Second,
}

// Conservative retry (expensive operations)
Retry{
    Attempts: 3,
    Delay:    1 * time.Second,
    MaxDelay: 10 * time.Second,
}
```

## Summary

Resilience patterns prevent failures:
- **Circuit Breaker**: Fail fast when service is down
- **Retry**: Handle transient failures
- **Timeout**: Prevent hanging requests
- **Bulkhead**: Isolate resource pools
- **Rate Limiting**: Control request rate
- **Fallback**: Provide alternative responses

Essential for production microservices.
