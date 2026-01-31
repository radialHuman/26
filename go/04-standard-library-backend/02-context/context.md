# Context Package

## What is Context?

The `context` package provides a way to carry deadlines, cancellation signals, and request-scoped values across API boundaries and between processes. It's essential for managing goroutine lifecycles and request chains.

## Why Use Context?

- **Cancellation Propagation**: Cancel operations across goroutine boundaries
- **Timeout Management**: Set deadlines for operations
- **Request Scoping**: Pass request-specific data through call chains
- **Resource Cleanup**: Prevent goroutine leaks
- **API Consistency**: Standard pattern used across Go ecosystem

## Context Types

### Background Context

Root context that is never cancelled.

```go
package main

import "context"

func main() {
    // Use for main function, initialization, tests
    ctx := context.Background()
    
    // Pass to functions that need context
    doWork(ctx)
}
```

### TODO Context

Placeholder when you're unsure which context to use.

```go
func processData() {
    // Use when refactoring or planning
    ctx := context.TODO()
    
    // Will replace with proper context later
    fetchData(ctx)
}
```

## Creating Contexts

### WithCancel

Manually cancel operations.

```go
package main

import (
    "context"
    "fmt"
    "time"
)

func main() {
    ctx, cancel := context.WithCancel(context.Background())
    
    go worker(ctx, "worker-1")
    
    time.Sleep(2 * time.Second)
    fmt.Println("Cancelling...")
    cancel()  // Signal all workers to stop
    
    time.Sleep(1 * time.Second)
}

func worker(ctx context.Context, name string) {
    for {
        select {
        case <-ctx.Done():
            fmt.Printf("%s: stopping (reason: %v)\n", name, ctx.Err())
            return
        default:
            fmt.Printf("%s: working...\n", name)
            time.Sleep(500 * time.Millisecond)
        }
    }
}
```

### WithTimeout

Automatically cancel after duration.

```go
package main

import (
    "context"
    "fmt"
    "time"
)

func main() {
    // Context will cancel after 3 seconds
    ctx, cancel := context.WithTimeout(context.Background(), 3*time.Second)
    defer cancel()  // Always call cancel to release resources
    
    result := make(chan string)
    
    go slowOperation(ctx, result)
    
    select {
    case res := <-result:
        fmt.Println("Result:", res)
    case <-ctx.Done():
        fmt.Println("Operation timed out:", ctx.Err())
    }
}

func slowOperation(ctx context.Context, result chan<- string) {
    // Simulate slow work
    select {
    case <-time.After(5 * time.Second):
        result <- "completed"
    case <-ctx.Done():
        fmt.Println("Work cancelled:", ctx.Err())
        return
    }
}
```

### WithDeadline

Cancel at specific time.

```go
package main

import (
    "context"
    "fmt"
    "time"
)

func main() {
    // Cancel at specific time
    deadline := time.Now().Add(2 * time.Second)
    ctx, cancel := context.WithDeadline(context.Background(), deadline)
    defer cancel()
    
    // Check deadline
    if d, ok := ctx.Deadline(); ok {
        fmt.Println("Deadline:", d)
        fmt.Println("Time until deadline:", time.Until(d))
    }
    
    processWithDeadline(ctx)
}

func processWithDeadline(ctx context.Context) {
    select {
    case <-time.After(3 * time.Second):
        fmt.Println("Work completed")
    case <-ctx.Done():
        fmt.Println("Deadline exceeded:", ctx.Err())
    }
}
```

### WithValue

Carry request-scoped data.

```go
package main

import (
    "context"
    "fmt"
)

// Define custom type for context keys (avoid string collisions)
type contextKey string

const (
    userIDKey    contextKey = "userID"
    requestIDKey contextKey = "requestID"
)

func main() {
    ctx := context.Background()
    
    // Add values to context
    ctx = context.WithValue(ctx, userIDKey, 12345)
    ctx = context.WithValue(ctx, requestIDKey, "req-abc-123")
    
    processRequest(ctx)
}

func processRequest(ctx context.Context) {
    // Retrieve values
    if userID, ok := ctx.Value(userIDKey).(int); ok {
        fmt.Println("User ID:", userID)
    }
    
    if requestID, ok := ctx.Value(requestIDKey).(string); ok {
        fmt.Println("Request ID:", requestID)
    }
    
    // Pass to other functions
    saveToDatabase(ctx)
}

func saveToDatabase(ctx context.Context) {
    userID := ctx.Value(userIDKey).(int)
    fmt.Printf("Saving data for user %d\n", userID)
}
```

## HTTP Server with Context

### Request Context

```go
package main

import (
    "context"
    "fmt"
    "log"
    "net/http"
    "time"
)

func main() {
    http.HandleFunc("/", handler)
    log.Fatal(http.ListenAndServe(":8080", nil))
}

func handler(w http.ResponseWriter, r *http.Request) {
    // Get request context
    ctx := r.Context()
    
    // Context is cancelled when:
    // - Client disconnects
    // - Request completes
    // - Server shuts down
    
    select {
    case <-time.After(2 * time.Second):
        fmt.Fprintln(w, "Request completed")
    case <-ctx.Done():
        // Client disconnected or request cancelled
        err := ctx.Err()
        log.Println("Request cancelled:", err)
        http.Error(w, err.Error(), http.StatusRequestTimeout)
    }
}
```

### Middleware with Context

```go
package main

import (
    "context"
    "fmt"
    "net/http"
    "github.com/google/uuid"
)

type contextKey string

const requestIDKey contextKey = "requestID"

// Middleware to add request ID
func requestIDMiddleware(next http.Handler) http.Handler {
    return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
        requestID := uuid.New().String()
        
        // Add request ID to context
        ctx := context.WithValue(r.Context(), requestIDKey, requestID)
        
        // Create new request with updated context
        r = r.WithContext(ctx)
        
        // Add to response header
        w.Header().Set("X-Request-ID", requestID)
        
        next.ServeHTTP(w, r)
    })
}

// Middleware to add timeout
func timeoutMiddleware(timeout time.Duration) func(http.Handler) http.Handler {
    return func(next http.Handler) http.Handler {
        return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
            ctx, cancel := context.WithTimeout(r.Context(), timeout)
            defer cancel()
            
            r = r.WithContext(ctx)
            next.ServeHTTP(w, r)
        })
    }
}

func handler(w http.ResponseWriter, r *http.Request) {
    requestID := r.Context().Value(requestIDKey).(string)
    fmt.Fprintf(w, "Request ID: %s\n", requestID)
}

func main() {
    mux := http.NewServeMux()
    mux.HandleFunc("/", handler)
    
    // Apply middleware
    var h http.Handler = mux
    h = requestIDMiddleware(h)
    h = timeoutMiddleware(5 * time.Second)(h)
    
    http.ListenAndServe(":8080", h)
}
```

## Database Operations with Context

```go
package main

import (
    "context"
    "database/sql"
    "fmt"
    "time"
)

type User struct {
    ID   int
    Name string
}

func getUserByID(ctx context.Context, db *sql.DB, id int) (*User, error) {
    query := "SELECT id, name FROM users WHERE id = $1"
    
    var user User
    err := db.QueryRowContext(ctx, query, id).Scan(&user.ID, &user.Name)
    if err != nil {
        return nil, err
    }
    
    return &user, nil
}

func getUsers(ctx context.Context, db *sql.DB) ([]User, error) {
    query := "SELECT id, name FROM users"
    
    rows, err := db.QueryContext(ctx, query)
    if err != nil {
        return nil, err
    }
    defer rows.Close()
    
    var users []User
    for rows.Next() {
        // Check if context cancelled during iteration
        select {
        case <-ctx.Done():
            return nil, ctx.Err()
        default:
        }
        
        var user User
        if err := rows.Scan(&user.ID, &user.Name); err != nil {
            return nil, err
        }
        users = append(users, user)
    }
    
    return users, rows.Err()
}

func updateUserWithTimeout(db *sql.DB, id int, name string) error {
    ctx, cancel := context.WithTimeout(context.Background(), 3*time.Second)
    defer cancel()
    
    query := "UPDATE users SET name = $1 WHERE id = $2"
    
    _, err := db.ExecContext(ctx, query, name, id)
    return err
}
```

## Concurrent Operations with Context

### Worker Pool with Cancellation

```go
package main

import (
    "context"
    "fmt"
    "sync"
    "time"
)

func workerPool(ctx context.Context, numWorkers int, jobs <-chan int) <-chan int {
    results := make(chan int)
    var wg sync.WaitGroup
    
    // Start workers
    for i := 0; i < numWorkers; i++ {
        wg.Add(1)
        go func(workerID int) {
            defer wg.Done()
            
            for {
                select {
                case <-ctx.Done():
                    fmt.Printf("Worker %d: cancelled\n", workerID)
                    return
                case job, ok := <-jobs:
                    if !ok {
                        return
                    }
                    
                    // Process job
                    fmt.Printf("Worker %d processing job %d\n", workerID, job)
                    time.Sleep(100 * time.Millisecond)
                    
                    select {
                    case results <- job * 2:
                    case <-ctx.Done():
                        return
                    }
                }
            }
        }(i)
    }
    
    // Close results when all workers done
    go func() {
        wg.Wait()
        close(results)
    }()
    
    return results
}

func main() {
    ctx, cancel := context.WithTimeout(context.Background(), 1*time.Second)
    defer cancel()
    
    jobs := make(chan int, 10)
    results := workerPool(ctx, 3, jobs)
    
    // Send jobs
    go func() {
        for i := 1; i <= 20; i++ {
            select {
            case jobs <- i:
            case <-ctx.Done():
                close(jobs)
                return
            }
        }
        close(jobs)
    }()
    
    // Collect results
    for result := range results {
        fmt.Println("Result:", result)
    }
}
```

### Fan-Out with Context

```go
package main

import (
    "context"
    "fmt"
    "sync"
)

func fanOut(ctx context.Context, input <-chan int, numWorkers int) []<-chan int {
    outputs := make([]<-chan int, numWorkers)
    
    for i := 0; i < numWorkers; i++ {
        outputs[i] = worker(ctx, input, i)
    }
    
    return outputs
}

func worker(ctx context.Context, input <-chan int, id int) <-chan int {
    output := make(chan int)
    
    go func() {
        defer close(output)
        
        for {
            select {
            case <-ctx.Done():
                return
            case val, ok := <-input:
                if !ok {
                    return
                }
                
                // Process
                result := val * 2
                
                select {
                case output <- result:
                case <-ctx.Done():
                    return
                }
            }
        }
    }()
    
    return output
}

func fanIn(ctx context.Context, channels ...<-chan int) <-chan int {
    output := make(chan int)
    var wg sync.WaitGroup
    
    multiplex := func(ch <-chan int) {
        defer wg.Done()
        for {
            select {
            case <-ctx.Done():
                return
            case val, ok := <-ch:
                if !ok {
                    return
                }
                select {
                case output <- val:
                case <-ctx.Done():
                    return
                }
            }
        }
    }
    
    wg.Add(len(channels))
    for _, ch := range channels {
        go multiplex(ch)
    }
    
    go func() {
        wg.Wait()
        close(output)
    }()
    
    return output
}
```

## API Client with Context

```go
package main

import (
    "context"
    "encoding/json"
    "fmt"
    "net/http"
    "time"
)

type APIClient struct {
    baseURL string
    client  *http.Client
}

func NewAPIClient(baseURL string) *APIClient {
    return &APIClient{
        baseURL: baseURL,
        client: &http.Client{
            Timeout: 10 * time.Second,
        },
    }
}

func (c *APIClient) GetUser(ctx context.Context, userID int) (*User, error) {
    url := fmt.Sprintf("%s/users/%d", c.baseURL, userID)
    
    req, err := http.NewRequestWithContext(ctx, "GET", url, nil)
    if err != nil {
        return nil, err
    }
    
    resp, err := c.client.Do(req)
    if err != nil {
        return nil, err
    }
    defer resp.Body.Close()
    
    if resp.StatusCode != http.StatusOK {
        return nil, fmt.Errorf("unexpected status: %d", resp.StatusCode)
    }
    
    var user User
    if err := json.NewDecoder(resp.Body).Decode(&user); err != nil {
        return nil, err
    }
    
    return &user, nil
}

func (c *APIClient) GetUserWithRetry(ctx context.Context, userID int, maxRetries int) (*User, error) {
    var lastErr error
    
    for i := 0; i < maxRetries; i++ {
        user, err := c.GetUser(ctx, userID)
        if err == nil {
            return user, nil
        }
        
        lastErr = err
        
        // Check if context cancelled
        select {
        case <-ctx.Done():
            return nil, ctx.Err()
        case <-time.After(time.Second * time.Duration(i+1)):
            // Exponential backoff
        }
    }
    
    return nil, fmt.Errorf("max retries exceeded: %w", lastErr)
}

// Usage
func main() {
    client := NewAPIClient("https://api.example.com")
    
    ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
    defer cancel()
    
    user, err := client.GetUser(ctx, 123)
    if err != nil {
        fmt.Println("Error:", err)
        return
    }
    
    fmt.Printf("User: %+v\n", user)
}
```

## Best Practices

### 1. Always Pass Context as First Parameter

```go
// GOOD
func doWork(ctx context.Context, data string) error {
    // ...
}

// BAD - context not first
func doWork(data string, ctx context.Context) error {
    // ...
}
```

### 2. Don't Store Context in Structs

```go
// BAD
type Server struct {
    ctx context.Context  // Don't do this
}

// GOOD
type Server struct {
    // Store config, not context
}

func (s *Server) HandleRequest(ctx context.Context) {
    // Pass context as parameter
}
```

### 3. Always Call Cancel Function

```go
ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
defer cancel()  // IMPORTANT - prevents resource leak
```

### 4. Check Context Cancellation

```go
func longOperation(ctx context.Context) error {
    for i := 0; i < 1000; i++ {
        select {
        case <-ctx.Done():
            return ctx.Err()
        default:
            // Do work
        }
    }
    return nil
}
```

### 5. Use Custom Types for Context Values

```go
// GOOD - prevents collisions
type contextKey string
const userIDKey contextKey = "userID"

// BAD - string keys can collide
ctx = context.WithValue(ctx, "userID", 123)
```

### 6. Don't Use Context for Optional Parameters

```go
// BAD - use context for optional params
func process(ctx context.Context) {
    timeout := ctx.Value("timeout").(time.Duration)  // Don't do this
}

// GOOD - explicit parameters
func process(ctx context.Context, timeout time.Duration) {
    // ...
}
```

## Common Patterns

### Request Scoped Logger

```go
type contextKey string

const loggerKey contextKey = "logger"

func WithLogger(ctx context.Context, logger *log.Logger) context.Context {
    return context.WithValue(ctx, loggerKey, logger)
}

func GetLogger(ctx context.Context) *log.Logger {
    if logger, ok := ctx.Value(loggerKey).(*log.Logger); ok {
        return logger
    }
    return log.Default()
}

func handler(w http.ResponseWriter, r *http.Request) {
    logger := log.New(os.Stdout, fmt.Sprintf("[%s] ", requestID), log.LstdFlags)
    ctx := WithLogger(r.Context(), logger)
    
    processRequest(ctx)
}

func processRequest(ctx context.Context) {
    logger := GetLogger(ctx)
    logger.Println("Processing request...")
}
```

### Graceful Shutdown

```go
func main() {
    ctx, cancel := context.WithCancel(context.Background())
    
    // Start workers
    var wg sync.WaitGroup
    for i := 0; i < 5; i++ {
        wg.Add(1)
        go worker(ctx, &wg, i)
    }
    
    // Wait for signal
    sigChan := make(chan os.Signal, 1)
    signal.Notify(sigChan, os.Interrupt, syscall.SIGTERM)
    
    <-sigChan
    fmt.Println("Shutting down...")
    
    cancel()  // Signal all workers to stop
    wg.Wait() // Wait for cleanup
    
    fmt.Println("Shutdown complete")
}
```

## Summary

Context provides:
- **Cancellation**: Propagate cancellation signals
- **Timeouts**: Automatic time-based cancellation
- **Values**: Request-scoped data
- **Best Practices**: Standard patterns across Go ecosystem

Essential for building robust, cancellable operations in concurrent applications.
