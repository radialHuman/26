# Concurrency Best Practices in Go

## Goroutine Management

### When to Use Goroutines
```go
// Good: I/O-bound operations
func FetchAllUsers(ctx context.Context, ids []string) ([]*User, error) {
    results := make(chan *User, len(ids))
    errors := make(chan error, len(ids))
    
    for _, id := range ids {
        go func(id string) {
            user, err := fetchUser(ctx, id)
            if err != nil {
                errors <- err
                return
            }
            results <- user
        }(id)
    }
    
    var users []*User
    for i := 0; i < len(ids); i++ {
        select {
        case user := <-results:
            users = append(users, user)
        case err := <-errors:
            return nil, err
        }
    }
    
    return users, nil
}

// Avoid: CPU-bound operations without limiting concurrency
// Use worker pools instead
```

### Worker Pool Pattern
```go
package worker

import (
    "context"
    "sync"
)

type Worker struct {
    id      int
    jobChan <-chan Job
    quit    chan struct{}
}

type Job struct {
    ID   int
    Data interface{}
}

type Pool struct {
    workers    []*Worker
    jobChan    chan Job
    resultChan chan Result
    wg         sync.WaitGroup
}

func NewPool(numWorkers int) *Pool {
    jobChan := make(chan Job, numWorkers*2)
    resultChan := make(chan Result, numWorkers*2)
    
    pool := &Pool{
        workers:    make([]*Worker, numWorkers),
        jobChan:    jobChan,
        resultChan: resultChan,
    }
    
    for i := 0; i < numWorkers; i++ {
        worker := &Worker{
            id:      i,
            jobChan: jobChan,
            quit:    make(chan struct{}),
        }
        pool.workers[i] = worker
        
        pool.wg.Add(1)
        go worker.Start(resultChan, &pool.wg)
    }
    
    return pool
}

func (w *Worker) Start(resultChan chan<- Result, wg *sync.WaitGroup) {
    defer wg.Done()
    
    for {
        select {
        case job := <-w.jobChan:
            result := processJob(job)
            resultChan <- result
        case <-w.quit:
            return
        }
    }
}

func (p *Pool) Submit(job Job) {
    p.jobChan <- job
}

func (p *Pool) Shutdown() {
    close(p.jobChan)
    for _, worker := range p.workers {
        close(worker.quit)
    }
    p.wg.Wait()
    close(p.resultChan)
}
```

## Channel Patterns

### Buffered vs Unbuffered Channels
```go
// Unbuffered: Synchronous communication
ch := make(chan int)

// Buffered: Asynchronous with capacity
ch := make(chan int, 10)

// Good: Use buffered channels to prevent goroutine leaks
func fetchWithTimeout(ctx context.Context, url string) (string, error) {
    result := make(chan string, 1) // Buffer size 1
    errors := make(chan error, 1)
    
    go func() {
        data, err := fetch(url)
        if err != nil {
            errors <- err
            return
        }
        result <- data
    }()
    
    select {
    case data := <-result:
        return data, nil
    case err := <-errors:
        return "", err
    case <-ctx.Done():
        return "", ctx.Err()
    }
}
```

### Channel Direction
```go
// Producer: send-only channel
func produce(ch chan<- int) {
    for i := 0; i < 10; i++ {
        ch <- i
    }
    close(ch)
}

// Consumer: receive-only channel
func consume(ch <-chan int) {
    for val := range ch {
        process(val)
    }
}

// Good: Use channel direction for clarity
func pipeline() {
    ch := make(chan int)
    go produce(ch)
    consume(ch)
}
```

### Fan-Out, Fan-In Pattern
```go
package patterns

func fanOut(input <-chan int, workers int) []<-chan int {
    channels := make([]<-chan int, workers)
    
    for i := 0; i < workers; i++ {
        ch := make(chan int)
        channels[i] = ch
        
        go func(out chan<- int) {
            defer close(out)
            for val := range input {
                out <- val * 2
            }
        }(ch)
    }
    
    return channels
}

func fanIn(channels ...<-chan int) <-chan int {
    out := make(chan int)
    var wg sync.WaitGroup
    
    for _, ch := range channels {
        wg.Add(1)
        go func(c <-chan int) {
            defer wg.Done()
            for val := range c {
                out <- val
            }
        }(ch)
    }
    
    go func() {
        wg.Wait()
        close(out)
    }()
    
    return out
}
```

## Context Usage

### Context for Cancellation
```go
func ProcessWithContext(ctx context.Context, data []string) error {
    for _, item := range data {
        select {
        case <-ctx.Done():
            return ctx.Err()
        default:
            if err := processItem(item); err != nil {
                return err
            }
        }
    }
    return nil
}

// Usage
ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
defer cancel()

if err := ProcessWithContext(ctx, data); err != nil {
    log.Printf("processing failed: %v", err)
}
```

### Context for Request Scoped Values
```go
type contextKey string

const userIDKey contextKey = "user_id"

func WithUserID(ctx context.Context, userID string) context.Context {
    return context.WithValue(ctx, userIDKey, userID)
}

func GetUserID(ctx context.Context) (string, bool) {
    userID, ok := ctx.Value(userIDKey).(string)
    return userID, ok
}
```

## Race Condition Prevention

### Using Mutexes
```go
type SafeCounter struct {
    mu    sync.RWMutex
    count map[string]int
}

func (c *SafeCounter) Inc(key string) {
    c.mu.Lock()
    defer c.mu.Unlock()
    c.count[key]++
}

func (c *SafeCounter) Get(key string) int {
    c.mu.RLock()
    defer c.mu.RUnlock()
    return c.count[key]
}
```

### Using Atomic Operations
```go
import "sync/atomic"

type Counter struct {
    count int64
}

func (c *Counter) Inc() {
    atomic.AddInt64(&c.count, 1)
}

func (c *Counter) Get() int64 {
    return atomic.LoadInt64(&c.count)
}
```

## Best Practices Summary

### DO:
- Use worker pools for bounded concurrency
- Always close channels when done sending
- Use buffered channels to prevent goroutine leaks
- Pass context for cancellation
- Use `sync.WaitGroup` to wait for goroutines
- Protect shared state with mutexes
- Use `select` with `default` for non-blocking operations
- Test concurrent code with `-race` flag

### DON'T:
- Create unbounded goroutines
- Share memory without synchronization
- Forget to handle context cancellation
- Close channels from receiver side
- Use goroutines for CPU-bound work without limits
- Ignore goroutine leaks
- Use global variables in concurrent code
- Assume operation ordering without synchronization

## Testing Concurrent Code

```go
func TestConcurrentAccess(t *testing.T) {
    counter := &SafeCounter{count: make(map[string]int)}
    var wg sync.WaitGroup
    
    for i := 0; i < 100; i++ {
        wg.Add(1)
        go func() {
            defer wg.Done()
            counter.Inc("test")
        }()
    }
    
    wg.Wait()
    
    if got := counter.Get("test"); got != 100 {
        t.Errorf("expected 100, got %d", got)
    }
}

// Run with race detector
// go test -race ./...
```

## Summary

Effective concurrency in Go:
- **Use CSP**: Communicate by sharing memory, don't share memory to communicate
- **Limit concurrency**: Use worker pools and bounded channels
- **Handle cancellation**: Always respect context cancellation
- **Prevent leaks**: Ensure all goroutines can exit
- **Synchronize access**: Protect shared state properly
- **Test thoroughly**: Use race detector and stress tests

Go's concurrency primitives make concurrent programming accessible but require discipline to avoid common pitfalls.
