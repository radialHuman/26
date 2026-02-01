# Reliability Patterns for Production Go Applications

## Circuit Breaker Pattern

### Implementation with gobreaker
```go
package reliability

import (
    "errors"
    "time"
    
    "github.com/sony/gobreaker"
)

type CircuitBreakerService struct {
    cb *gobreaker.CircuitBreaker
}

func NewCircuitBreakerService() *CircuitBreakerService {
    settings := gobreaker.Settings{
        Name:        "ServiceA",
        MaxRequests: 3,
        Interval:    time.Second * 60,
        Timeout:     time.Second * 30,
        ReadyToTrip: func(counts gobreaker.Counts) bool {
            failureRatio := float64(counts.TotalFailures) / float64(counts.Requests)
            return counts.Requests >= 3 && failureRatio >= 0.6
        },
        OnStateChange: func(name string, from gobreaker.State, to gobreaker.State) {
            log.Printf("Circuit Breaker '%s' changed from '%s' to '%s'", name, from, to)
        },
    }
    
    return &CircuitBreakerService{
        cb: gobreaker.NewCircuitBreaker(settings),
    }
}

func (s *CircuitBreakerService) Call(operation func() (interface{}, error)) (interface{}, error) {
    return s.cb.Execute(operation)
}
```

## Retry Logic with Exponential Backoff

```go
package reliability

import (
    "context"
    "math"
    "time"
)

type RetryConfig struct {
    MaxAttempts int
    InitialDelay time.Duration
    MaxDelay time.Duration
    Multiplier float64
}

func RetryWithBackoff(ctx context.Context, cfg RetryConfig, operation func() error) error {
    var err error
    delay := cfg.InitialDelay
    
    for attempt := 1; attempt <= cfg.MaxAttempts; attempt++ {
        if err = operation(); err == nil {
            return nil
        }
        
        if attempt == cfg.MaxAttempts {
            return fmt.Errorf("max attempts reached: %w", err)
        }
        
        select {
        case <-time.After(delay):
            delay = time.Duration(math.Min(
                float64(delay)*cfg.Multiplier,
                float64(cfg.MaxDelay),
            ))
        case <-ctx.Done():
            return ctx.Err()
        }
    }
    
    return err
}
```

## Rate Limiting

```go
package reliability

import (
    "context"
    "golang.org/x/time/rate"
    "net/http"
)

type RateLimiter struct {
    limiter *rate.Limiter
}

func NewRateLimiter(requestsPerSecond int, burst int) *RateLimiter {
    return &RateLimiter{
        limiter: rate.NewLimiter(rate.Limit(requestsPerSecond), burst)
    }
}

func (rl *RateLimiter) Middleware(next http.Handler) http.Handler {
    return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
        if !rl.limiter.Allow() {
            http.Error(w, "Too Many Requests", http.StatusTooManyRequests)
            return
        }
        next.ServeHTTP(w, r)
    })
}
```

## Timeout Patterns

```go
package reliability

import (
    "context"
    "time"
)

func WithTimeout(ctx context.Context, timeout time.Duration, operation func(context.Context) error) error {
    ctx, cancel := context.WithTimeout(ctx, timeout)
    defer cancel()
    
    errChan := make(chan error, 1)
    go func() {
        errChan <- operation(ctx)
    }()
    
    select {
    case err := <-errChan:
        return err
    case <-ctx.Done():
        return ctx.Err()
    }
}
```

## Bulkhead Pattern

```go
package reliability

import (
    "context"
    "errors"
)

type Bulkhead struct {
    sem chan struct{}
}

func NewBulkhead(maxConcurrent int) *Bulkhead {
    return &Bulkhead{
        sem: make(chan struct{}, maxConcurrent),
    }
}

func (b *Bulkhead) Execute(ctx context.Context, operation func() error) error {
    select {
    case b.sem <- struct{}{}:
        defer func() { <-b.sem }()
        return operation()
    case <-ctx.Done():
        return errors.New("bulkhead full")
    }
}
```

## Summary
Reliability patterns ensure system resilience through circuit breakers, retries, rate limiting, timeouts, and bulkheads.
