# Graceful Shutdown

## What is Graceful Shutdown?

Graceful shutdown ensures your application stops cleanly by:
- Finishing in-flight requests
- Closing database connections
- Releasing resources
- Saving state

## Why Graceful Shutdown?

- **Data Integrity**: No partial writes or corrupted data
- **User Experience**: Requests complete successfully
- **Resource Cleanup**: Prevent leaks
- **Zero Downtime**: Smooth deployments

## Basic Graceful Shutdown

### HTTP Server

```go
package main

import (
    "context"
    "log"
    "net/http"
    "os"
    "os/signal"
    "syscall"
    "time"
)

func main() {
    server := &http.Server{
        Addr: ":8080",
        Handler: http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
            time.Sleep(2 * time.Second) // Simulate work
            w.Write([]byte("Hello, World!"))
        }),
    }
    
    // Start server in goroutine
    go func() {
        log.Println("Server starting on :8080")
        if err := server.ListenAndServe(); err != nil && err != http.ErrServerClosed {
            log.Fatal("Server error:", err)
        }
    }()
    
    // Wait for interrupt signal
    quit := make(chan os.Signal, 1)
    signal.Notify(quit, os.Interrupt, syscall.SIGTERM)
    <-quit
    
    log.Println("Server shutting down...")
    
    // Graceful shutdown with timeout
    ctx, cancel := context.WithTimeout(context.Background(), 30*time.Second)
    defer cancel()
    
    if err := server.Shutdown(ctx); err != nil {
        log.Fatal("Server forced to shutdown:", err)
    }
    
    log.Println("Server exited")
}
```

## Complete Application Shutdown

### With Multiple Components

```go
package main

import (
    "context"
    "database/sql"
    "log"
    "net/http"
    "os"
    "os/signal"
    "syscall"
    "time"
    
    _ "github.com/lib/pq"
)

type Application struct {
    server *http.Server
    db     *sql.DB
    // Other resources
}

func NewApplication() (*Application, error) {
    // Setup database
    db, err := sql.Open("postgres", "postgres://...")
    if err != nil {
        return nil, err
    }
    
    app := &Application{
        db: db,
    }
    
    // Setup HTTP server
    mux := http.NewServeMux()
    mux.HandleFunc("/", app.handleRequest)
    
    app.server = &http.Server{
        Addr:         ":8080",
        Handler:      mux,
        ReadTimeout:  15 * time.Second,
        WriteTimeout: 15 * time.Second,
        IdleTimeout:  60 * time.Second,
    }
    
    return app, nil
}

func (app *Application) handleRequest(w http.ResponseWriter, r *http.Request) {
    // Use database
    var count int
    app.db.QueryRow("SELECT COUNT(*) FROM users").Scan(&count)
    
    w.Write([]byte("Users: " + string(rune(count))))
}

func (app *Application) Start() error {
    log.Println("Starting server on :8080")
    return app.server.ListenAndServe()
}

func (app *Application) Shutdown(ctx context.Context) error {
    log.Println("Shutting down gracefully...")
    
    // Shutdown HTTP server
    if err := app.server.Shutdown(ctx); err != nil {
        log.Printf("HTTP server shutdown error: %v", err)
        return err
    }
    log.Println("HTTP server stopped")
    
    // Close database
    if err := app.db.Close(); err != nil {
        log.Printf("Database close error: %v", err)
        return err
    }
    log.Println("Database connection closed")
    
    return nil
}

func main() {
    app, err := NewApplication()
    if err != nil {
        log.Fatal("Failed to create application:", err)
    }
    
    // Start server in goroutine
    go func() {
        if err := app.Start(); err != nil && err != http.ErrServerClosed {
            log.Fatal("Server error:", err)
        }
    }()
    
    // Wait for shutdown signal
    quit := make(chan os.Signal, 1)
    signal.Notify(quit, os.Interrupt, syscall.SIGTERM)
    <-quit
    
    // Graceful shutdown with 30-second timeout
    ctx, cancel := context.WithTimeout(context.Background(), 30*time.Second)
    defer cancel()
    
    if err := app.Shutdown(ctx); err != nil {
        log.Fatal("Shutdown error:", err)
    }
    
    log.Println("Application exited cleanly")
}
```

## Shutdown with Background Workers

```go
package main

import (
    "context"
    "log"
    "os"
    "os/signal"
    "sync"
    "syscall"
    "time"
)

type Worker struct {
    id   int
    stop chan struct{}
    wg   *sync.WaitGroup
}

func NewWorker(id int, wg *sync.WaitGroup) *Worker {
    return &Worker{
        id:   id,
        stop: make(chan struct{}),
        wg:   wg,
    }
}

func (w *Worker) Start() {
    w.wg.Add(1)
    go func() {
        defer w.wg.Done()
        log.Printf("Worker %d started", w.id)
        
        ticker := time.NewTicker(1 * time.Second)
        defer ticker.Stop()
        
        for {
            select {
            case <-ticker.C:
                log.Printf("Worker %d processing...", w.id)
            case <-w.stop:
                log.Printf("Worker %d stopping...", w.id)
                return
            }
        }
    }()
}

func (w *Worker) Stop() {
    close(w.stop)
}

type Application struct {
    workers []*Worker
    wg      sync.WaitGroup
}

func NewApplication(numWorkers int) *Application {
    app := &Application{
        workers: make([]*Worker, numWorkers),
    }
    
    for i := 0; i < numWorkers; i++ {
        app.workers[i] = NewWorker(i+1, &app.wg)
    }
    
    return app
}

func (app *Application) Start() {
    for _, worker := range app.workers {
        worker.Start()
    }
}

func (app *Application) Shutdown() {
    log.Println("Stopping all workers...")
    
    // Signal all workers to stop
    for _, worker := range app.workers {
        worker.Stop()
    }
    
    // Wait for all workers to finish
    app.wg.Wait()
    
    log.Println("All workers stopped")
}

func main() {
    app := NewApplication(5)
    app.Start()
    
    // Wait for shutdown signal
    quit := make(chan os.Signal, 1)
    signal.Notify(quit, os.Interrupt, syscall.SIGTERM)
    <-quit
    
    app.Shutdown()
    log.Println("Application exited")
}
```

## Production-Ready Shutdown Handler

```go
package main

import (
    "context"
    "database/sql"
    "log/slog"
    "net/http"
    "os"
    "os/signal"
    "sync"
    "syscall"
    "time"
)

type ShutdownFunc func(context.Context) error

type GracefulShutdown struct {
    logger    *slog.Logger
    timeout   time.Duration
    callbacks []ShutdownFunc
    mu        sync.Mutex
}

func NewGracefulShutdown(timeout time.Duration, logger *slog.Logger) *GracefulShutdown {
    return &GracefulShutdown{
        logger:    logger,
        timeout:   timeout,
        callbacks: make([]ShutdownFunc, 0),
    }
}

func (gs *GracefulShutdown) Register(name string, fn ShutdownFunc) {
    gs.mu.Lock()
    defer gs.mu.Unlock()
    
    wrapped := func(ctx context.Context) error {
        gs.logger.Info("Shutting down component", "component", name)
        if err := fn(ctx); err != nil {
            gs.logger.Error("Shutdown failed", "component", name, "error", err)
            return err
        }
        gs.logger.Info("Component shut down successfully", "component", name)
        return nil
    }
    
    gs.callbacks = append(gs.callbacks, wrapped)
}

func (gs *GracefulShutdown) Wait() {
    quit := make(chan os.Signal, 1)
    signal.Notify(quit, os.Interrupt, syscall.SIGTERM, syscall.SIGQUIT)
    
    sig := <-quit
    gs.logger.Info("Received shutdown signal", "signal", sig)
    
    ctx, cancel := context.WithTimeout(context.Background(), gs.timeout)
    defer cancel()
    
    gs.Shutdown(ctx)
}

func (gs *GracefulShutdown) Shutdown(ctx context.Context) {
    gs.mu.Lock()
    callbacks := make([]ShutdownFunc, len(gs.callbacks))
    copy(callbacks, gs.callbacks)
    gs.mu.Unlock()
    
    // Execute shutdown callbacks in reverse order
    for i := len(callbacks) - 1; i >= 0; i-- {
        if err := callbacks[i](ctx); err != nil {
            gs.logger.Error("Shutdown callback failed", "error", err)
        }
    }
    
    gs.logger.Info("Graceful shutdown complete")
}

// Example usage
func main() {
    logger := slog.New(slog.NewJSONHandler(os.Stdout, nil))
    
    // Create shutdown manager
    shutdown := NewGracefulShutdown(30*time.Second, logger)
    
    // Setup HTTP server
    server := &http.Server{Addr: ":8080"}
    shutdown.Register("http-server", func(ctx context.Context) error {
        return server.Shutdown(ctx)
    })
    
    // Setup database
    db, _ := sql.Open("postgres", "...")
    shutdown.Register("database", func(ctx context.Context) error {
        return db.Close()
    })
    
    // Setup background worker
    workerStop := make(chan struct{})
    shutdown.Register("background-worker", func(ctx context.Context) error {
        close(workerStop)
        // Wait for worker to finish or timeout
        select {
        case <-ctx.Done():
            return ctx.Err()
        case <-time.After(5 * time.Second):
            return nil
        }
    })
    
    // Start server
    go func() {
        logger.Info("Server starting", "addr", server.Addr)
        if err := server.ListenAndServe(); err != http.ErrServerClosed {
            logger.Error("Server error", "error", err)
        }
    }()
    
    // Wait for shutdown signal
    shutdown.Wait()
}
```

## Health Checks During Shutdown

```go
package main

import (
    "context"
    "net/http"
    "sync/atomic"
    "time"
)

type Server struct {
    server      *http.Server
    shutting    atomic.Bool
}

func NewServer() *Server {
    s := &Server{}
    
    mux := http.NewServeMux()
    mux.HandleFunc("/health", s.healthHandler)
    mux.HandleFunc("/ready", s.readyHandler)
    mux.HandleFunc("/", s.handler)
    
    s.server = &http.Server{
        Addr:    ":8080",
        Handler: mux,
    }
    
    return s
}

func (s *Server) healthHandler(w http.ResponseWriter, r *http.Request) {
    // Always healthy (liveness check)
    w.WriteHeader(http.StatusOK)
    w.Write([]byte("OK"))
}

func (s *Server) readyHandler(w http.ResponseWriter, r *http.Request) {
    // Not ready during shutdown (readiness check)
    if s.shutting.Load() {
        w.WriteHeader(http.StatusServiceUnavailable)
        w.Write([]byte("Shutting down"))
        return
    }
    
    w.WriteHeader(http.StatusOK)
    w.Write([]byte("Ready"))
}

func (s *Server) handler(w http.ResponseWriter, r *http.Request) {
    if s.shutting.Load() {
        w.WriteHeader(http.StatusServiceUnavailable)
        w.Write([]byte("Service shutting down"))
        return
    }
    
    // Process request
    time.Sleep(100 * time.Millisecond)
    w.Write([]byte("Hello, World!"))
}

func (s *Server) Shutdown(ctx context.Context) error {
    // Mark as shutting down
    s.shutting.Store(true)
    
    // Wait a bit for load balancers to notice
    time.Sleep(5 * time.Second)
    
    // Shutdown server
    return s.server.Shutdown(ctx)
}
```

## Kubernetes Graceful Shutdown

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
        
        # Liveness probe
        livenessProbe:
          httpGet:
            path: /health
            port: 8080
          initialDelaySeconds: 10
          periodSeconds: 10
        
        # Readiness probe
        readinessProbe:
          httpGet:
            path: /ready
            port: 8080
          initialDelaySeconds: 5
          periodSeconds: 5
        
        # Lifecycle hooks
        lifecycle:
          preStop:
            exec:
              command: ["/bin/sh", "-c", "sleep 15"]
        
        # Termination grace period
      terminationGracePeriodSeconds: 60
```

## Best Practices

### 1. Set Appropriate Timeouts

```go
// Allow enough time for:
// - Current requests to complete
// - Graceful connection closure
// - Resource cleanup

ctx, cancel := context.WithTimeout(
    context.Background(),
    30*time.Second, // Adjust based on your needs
)
defer cancel()
```

### 2. Handle All Resources

```go
type App struct {
    server   *http.Server
    db       *sql.DB
    cache    *redis.Client
    queue    *amqp.Connection
    logger   *slog.Logger
}

func (app *App) Shutdown(ctx context.Context) error {
    // Shutdown in reverse dependency order
    
    // 1. Stop accepting new requests
    app.server.Shutdown(ctx)
    
    // 2. Finish background jobs
    // app.stopWorkers(ctx)
    
    // 3. Close connections
    app.db.Close()
    app.cache.Close()
    app.queue.Close()
    
    // 4. Flush logs
    // app.logger.Sync()
    
    return nil
}
```

### 3. Log Shutdown Progress

```go
func (app *App) Shutdown(ctx context.Context) error {
    app.logger.Info("Starting graceful shutdown")
    
    app.logger.Info("Stopping HTTP server")
    if err := app.server.Shutdown(ctx); err != nil {
        app.logger.Error("HTTP shutdown failed", "error", err)
        return err
    }
    
    app.logger.Info("Closing database")
    if err := app.db.Close(); err != nil {
        app.logger.Error("Database close failed", "error", err)
        return err
    }
    
    app.logger.Info("Graceful shutdown complete")
    return nil
}
```

### 4. Drain Connections

```go
func (app *App) Shutdown(ctx context.Context) error {
    // Mark as draining
    app.draining.Store(true)
    
    // Wait for connections to drain
    time.Sleep(5 * time.Second)
    
    // Force shutdown remaining
    return app.server.Shutdown(ctx)
}
```

## Testing Graceful Shutdown

```go
package main

import (
    "context"
    "net/http"
    "testing"
    "time"
)

func TestGracefulShutdown(t *testing.T) {
    server := &http.Server{
        Addr: ":8080",
        Handler: http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
            time.Sleep(2 * time.Second)
            w.Write([]byte("OK"))
        }),
    }
    
    go server.ListenAndServe()
    time.Sleep(100 * time.Millisecond) // Let server start
    
    // Make request
    done := make(chan bool)
    go func() {
        resp, _ := http.Get("http://localhost:8080")
        resp.Body.Close()
        done <- true
    }()
    
    // Shutdown while request is processing
    time.Sleep(100 * time.Millisecond)
    ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
    defer cancel()
    
    server.Shutdown(ctx)
    
    // Request should complete
    select {
    case <-done:
        t.Log("Request completed during shutdown")
    case <-time.After(10 * time.Second):
        t.Fatal("Request did not complete")
    }
}
```

## Summary

Graceful shutdown:
- **Complete Requests**: Finish in-flight operations
- **Release Resources**: Clean up connections
- **Signal Handling**: Respond to SIGTERM/SIGINT
- **Timeouts**: Prevent hanging
- **Health Checks**: Notify load balancers
- **Logging**: Track shutdown progress

Essential for zero-downtime deployments and data integrity.
