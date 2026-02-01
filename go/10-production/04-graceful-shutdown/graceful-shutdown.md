# Graceful Shutdown in Go Applications

## Overview
Graceful shutdown ensures that your application properly handles shutdown signals, completes in-flight requests, closes connections, and cleans up resources before terminating.

## Basic Signal Handling

### Simple Graceful Shutdown
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
        Addr:    ":8080",
        Handler: http.HandlerFunc(handler),
    }
    
    // Channel to listen for errors from server
    serverErrors := make(chan error, 1)
    
    // Start server
    go func() {
        log.Println("Server starting on :8080")
        serverErrors <- server.ListenAndServe()
    }()
    
    // Channel to listen for interrupt or terminate signal
    shutdown := make(chan os.Signal, 1)
    signal.Notify(shutdown, os.Interrupt, syscall.SIGTERM)
    
    // Block until signal received or server error
    select {
    case err := <-serverErrors:
        log.Fatalf("Server error: %v", err)
        
    case sig := <-shutdown:
        log.Printf("Shutdown signal received: %v", sig)
        
        // Give outstanding requests 30 seconds to complete
        ctx, cancel := context.WithTimeout(context.Background(), 30*time.Second)
        defer cancel()
        
        if err := server.Shutdown(ctx); err != nil {
            log.Printf("Graceful shutdown failed: %v", err)
            if err := server.Close(); err != nil {
                log.Printf("Could not close server: %v", err)
            }
        }
        
        log.Println("Server stopped gracefully")
    }
}

func handler(w http.ResponseWriter, r *http.Request) {
    time.Sleep(5 * time.Second) // Simulate work
    w.Write([]byte("OK"))
}
```

## Advanced Graceful Shutdown Pattern

### Complete Server with Resource Cleanup
```go
package main

import (
    "context"
    "database/sql"
    "fmt"
    "log"
    "net/http"
    "os"
    "os/signal"
    "sync"
    "syscall"
    "time"
    
    "github.com/redis/go-redis/v9"
)

type Application struct {
    server *http.Server
    db     *sql.DB
    redis  *redis.Client
    logger *log.Logger
    wg     sync.WaitGroup
}

func NewApplication() (*Application, error) {
    // Initialize database
    db, err := sql.Open("postgres", "connection-string")
    if err != nil {
        return nil, fmt.Errorf("failed to connect to database: %w", err)
    }
    
    // Initialize Redis
    rdb := redis.NewClient(&redis.Options{
        Addr: "localhost:6379",
    })
    
    // Initialize server
    mux := http.NewServeMux()
    server := &http.Server{
        Addr:         ":8080",
        Handler:      mux,
        ReadTimeout:  15 * time.Second,
        WriteTimeout: 15 * time.Second,
        IdleTimeout:  60 * time.Second,
    }
    
    app := &Application{
        server: server,
        db:     db,
        redis:  rdb,
        logger: log.New(os.Stdout, "APP: ", log.LstdFlags),
    }
    
    // Register routes
    mux.HandleFunc("/health", app.healthHandler)
    mux.HandleFunc("/", app.indexHandler)
    
    return app, nil
}

func (app *Application) Run() error {
    // Channel for server errors
    serverErrors := make(chan error, 1)
    
    // Start HTTP server
    go func() {
        app.logger.Printf("Starting server on %s", app.server.Addr)
        serverErrors <- app.server.ListenAndServe()
    }()
    
    // Start background workers
    app.startBackgroundWorkers()
    
    // Setup signal handling
    shutdown := make(chan os.Signal, 1)
    signal.Notify(shutdown, os.Interrupt, syscall.SIGTERM)
    
    // Block until we receive signal or error
    select {
    case err := <-serverErrors:
        return fmt.Errorf("server error: %w", err)
        
    case sig := <-shutdown:
        app.logger.Printf("Received shutdown signal: %v", sig)
        
        // Create shutdown context with timeout
        ctx, cancel := context.WithTimeout(context.Background(), 30*time.Second)
        defer cancel()
        
        return app.Shutdown(ctx)
    }
}

func (app *Application) Shutdown(ctx context.Context) error {
    app.logger.Println("Starting graceful shutdown...")
    
    var shutdownErr error
    
    // Stop accepting new requests
    if err := app.server.Shutdown(ctx); err != nil {
        app.logger.Printf("HTTP server shutdown error: %v", err)
        shutdownErr = err
        
        // Force close if graceful shutdown fails
        if err := app.server.Close(); err != nil {
            app.logger.Printf("HTTP server close error: %v", err)
        }
    }
    
    // Wait for background workers to finish
    done := make(chan struct{})
    go func() {
        app.wg.Wait()
        close(done)
    }()
    
    select {
    case <-done:
        app.logger.Println("All background workers stopped")
    case <-ctx.Done():
        app.logger.Println("Timeout waiting for background workers")
        shutdownErr = ctx.Err()
    }
    
    // Close database connections
    if err := app.db.Close(); err != nil {
        app.logger.Printf("Database close error: %v", err)
        if shutdownErr == nil {
            shutdownErr = err
        }
    } else {
        app.logger.Println("Database connection closed")
    }
    
    // Close Redis connection
    if err := app.redis.Close(); err != nil {
        app.logger.Printf("Redis close error: %v", err)
        if shutdownErr == nil {
            shutdownErr = err
        }
    } else {
        app.logger.Println("Redis connection closed")
    }
    
    if shutdownErr == nil {
        app.logger.Println("Graceful shutdown completed successfully")
    }
    
    return shutdownErr
}

func (app *Application) startBackgroundWorkers() {
    // Example: Start a metrics reporter
    app.wg.Add(1)
    go app.metricsReporter()
    
    // Example: Start a cleanup worker
    app.wg.Add(1)
    go app.cleanupWorker()
}

func (app *Application) metricsReporter() {
    defer app.wg.Done()
    
    ticker := time.NewTicker(10 * time.Second)
    defer ticker.Stop()
    
    for {
        select {
        case <-ticker.C:
            app.logger.Println("Reporting metrics...")
            // Report metrics logic
        case <-app.server.BaseContext(nil).Done():
            app.logger.Println("Metrics reporter stopping...")
            return
        }
    }
}

func (app *Application) cleanupWorker() {
    defer app.wg.Done()
    
    ticker := time.NewTicker(1 * time.Minute)
    defer ticker.Stop()
    
    for {
        select {
        case <-ticker.C:
            app.logger.Println("Running cleanup...")
            // Cleanup logic
        case <-app.server.BaseContext(nil).Done():
            app.logger.Println("Cleanup worker stopping...")
            return
        }
    }
}

func (app *Application) healthHandler(w http.ResponseWriter, r *http.Request) {
    w.WriteHeader(http.StatusOK)
    w.Write([]byte("OK"))
}

func (app *Application) indexHandler(w http.ResponseWriter, r *http.Request) {
    // Simulate some work
    time.Sleep(2 * time.Second)
    w.Write([]byte("Hello, World!"))
}

func main() {
    app, err := NewApplication()
    if err != nil {
        log.Fatal(err)
    }
    
    if err := app.Run(); err != nil {
        log.Fatal(err)
    }
}
```

## Graceful Shutdown with Gin Framework

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
    
    "github.com/gin-gonic/gin"
)

func main() {
    router := gin.Default()
    
    router.GET("/", func(c *gin.Context) {
        time.Sleep(5 * time.Second) // Simulate work
        c.String(http.StatusOK, "OK")
    })
    
    srv := &http.Server{
        Addr:    ":8080",
        Handler: router,
    }
    
    // Run server in goroutine
    go func() {
        if err := srv.ListenAndServe(); err != nil && err != http.ErrServerClosed {
            log.Fatalf("listen: %s\n", err)
        }
    }()
    
    // Wait for interrupt signal
    quit := make(chan os.Signal, 1)
    signal.Notify(quit, syscall.SIGINT, syscall.SIGTERM)
    <-quit
    
    log.Println("Shutting down server...")
    
    // Context with timeout
    ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
    defer cancel()
    
    if err := srv.Shutdown(ctx); err != nil {
        log.Fatal("Server forced to shutdown:", err)
    }
    
    log.Println("Server exited")
}
```

## Handling Multiple Services

```go
package main

import (
    "context"
    "fmt"
    "log"
    "os"
    "os/signal"
    "sync"
    "syscall"
    "time"
)

type Service interface {
    Start() error
    Shutdown(ctx context.Context) error
}

type ServiceManager struct {
    services []Service
    logger   *log.Logger
}

func NewServiceManager() *ServiceManager {
    return &ServiceManager{
        services: make([]Service, 0),
        logger:   log.New(os.Stdout, "ServiceManager: ", log.LstdFlags),
    }
}

func (sm *ServiceManager) AddService(service Service) {
    sm.services = append(sm.services, service)
}

func (sm *ServiceManager) Start() error {
    errors := make(chan error, len(sm.services))
    
    // Start all services
    for _, service := range sm.services {
        go func(s Service) {
            if err := s.Start(); err != nil {
                errors <- err
            }
        }(service)
    }
    
    // Wait for shutdown signal
    quit := make(chan os.Signal, 1)
    signal.Notify(quit, os.Interrupt, syscall.SIGTERM)
    
    select {
    case err := <-errors:
        return fmt.Errorf("service failed: %w", err)
    case sig := <-quit:
        sm.logger.Printf("Received signal: %v", sig)
        return sm.shutdown()
    }
}

func (sm *ServiceManager) shutdown() error {
    sm.logger.Println("Initiating graceful shutdown...")
    
    ctx, cancel := context.WithTimeout(context.Background(), 30*time.Second)
    defer cancel()
    
    var wg sync.WaitGroup
    errors := make(chan error, len(sm.services))
    
    // Shutdown all services concurrently
    for _, service := range sm.services {
        wg.Add(1)
        go func(s Service) {
            defer wg.Done()
            if err := s.Shutdown(ctx); err != nil {
                errors <- err
            }
        }(service)
    }
    
    // Wait for all services to shutdown
    wg.Wait()
    close(errors)
    
    // Collect errors
    var shutdownErrors []error
    for err := range errors {
        shutdownErrors = append(shutdownErrors, err)
    }
    
    if len(shutdownErrors) > 0 {
        return fmt.Errorf("shutdown errors: %v", shutdownErrors)
    }
    
    sm.logger.Println("All services shut down successfully")
    return nil
}
```

## Draining Connections

### HTTP Connection Draining
```go
package main

import (
    "context"
    "log"
    "net/http"
    "sync/atomic"
    "time"
)

type Server struct {
    server      *http.Server
    activeConns int64
}

func NewServer() *Server {
    s := &Server{}
    
    mux := http.NewServeMux()
    mux.HandleFunc("/", s.trackConnection(s.handler))
    
    s.server = &http.Server{
        Addr:           ":8080",
        Handler:        mux,
        ReadTimeout:    15 * time.Second,
        WriteTimeout:   15 * time.Second,
        MaxHeaderBytes: 1 << 20,
        ConnState:      s.connStateHandler,
    }
    
    return s
}

func (s *Server) connStateHandler(conn net.Conn, state http.ConnState) {
    switch state {
    case http.StateNew:
        atomic.AddInt64(&s.activeConns, 1)
    case http.StateClosed, http.StateHijacked:
        atomic.AddInt64(&s.activeConns, -1)
    }
}

func (s *Server) trackConnection(next http.HandlerFunc) http.HandlerFunc {
    return func(w http.ResponseWriter, r *http.Request) {
        next(w, r)
    }
}

func (s *Server) handler(w http.ResponseWriter, r *http.Request) {
    w.Write([]byte("OK"))
}

func (s *Server) Shutdown(ctx context.Context) error {
    log.Println("Shutting down server...")
    
    // Stop accepting new connections
    if err := s.server.Shutdown(ctx); err != nil {
        return err
    }
    
    // Wait for active connections to drain
    ticker := time.NewTicker(500 * time.Millisecond)
    defer ticker.Stop()
    
    for {
        select {
        case <-ticker.C:
            active := atomic.LoadInt64(&s.activeConns)
            log.Printf("Active connections: %d", active)
            if active == 0 {
                log.Println("All connections drained")
                return nil
            }
        case <-ctx.Done():
            active := atomic.LoadInt64(&s.activeConns)
            log.Printf("Timeout: %d connections still active", active)
            return ctx.Err()
        }
    }
}
```

## Database Connection Cleanup

```go
package database

import (
    "context"
    "database/sql"
    "log"
    "time"
)

type DB struct {
    *sql.DB
}

func (db *DB) Shutdown(ctx context.Context) error {
    log.Println("Closing database connections...")
    
    // Set connection limits to prevent new connections
    db.SetMaxOpenConns(0)
    db.SetMaxIdleConns(0)
    
    // Close in a goroutine
    done := make(chan error, 1)
    go func() {
        done <- db.Close()
    }()
    
    // Wait for close or timeout
    select {
    case err := <-done:
        if err != nil {
            return err
        }
        log.Println("Database connections closed successfully")
        return nil
    case <-ctx.Done():
        log.Println("Database close timeout")
        return ctx.Err()
    }
}
```

## Best Practices

### 1. **Set Appropriate Timeouts**
```go
ctx, cancel := context.WithTimeout(context.Background(), 30*time.Second)
defer cancel()
```

### 2. **Handle Multiple Signals**
```go
signal.Notify(shutdown, os.Interrupt, syscall.SIGTERM, syscall.SIGQUIT)
```

### 3. **Log Shutdown Progress**
```go
log.Println("Starting shutdown...")
log.Println("Stopping HTTP server...")
log.Println("Waiting for workers...")
log.Println("Shutdown complete")
```

### 4. **Use WaitGroups for Background Tasks**
```go
var wg sync.WaitGroup
wg.Add(1)
go func() {
    defer wg.Done()
    // background work
}()
wg.Wait()
```

### 5. **Return Proper Exit Codes**
```go
func main() {
    if err := run(); err != nil {
        log.Println(err)
        os.Exit(1)
    }
}
```

## Testing Graceful Shutdown

```go
package main

import (
    "os"
    "syscall"
    "testing"
    "time"
)

func TestGracefulShutdown(t *testing.T) {
    app, err := NewApplication()
    if err != nil {
        t.Fatal(err)
    }
    
    // Run app in goroutine
    done := make(chan error, 1)
    go func() {
        done <- app.Run()
    }()
    
    // Wait for server to start
    time.Sleep(100 * time.Millisecond)
    
    // Send shutdown signal
    proc, _ := os.FindProcess(os.Getpid())
    proc.Signal(syscall.SIGTERM)
    
    // Wait for shutdown
    select {
    case err := <-done:
        if err != nil {
            t.Errorf("Shutdown error: %v", err)
        }
    case <-time.After(5 * time.Second):
        t.Error("Shutdown timeout")
    }
}
```

## Summary

Key aspects of graceful shutdown:
- **Signal Handling**: Listen for OS signals (SIGINT, SIGTERM)
- **Request Draining**: Complete in-flight requests
- **Resource Cleanup**: Close database connections, file handles
- **Background Workers**: Wait for goroutines to finish
- **Timeouts**: Prevent indefinite hangs
- **Logging**: Track shutdown progress
- **Error Handling**: Handle cleanup failures gracefully

Proper graceful shutdown ensures zero data loss and minimal service disruption during deployments and restarts.
