# Logging in Go

## Standard Library logging

### Basic Logging with log Package

```go
package main

import (
    "log"
)

func main() {
    // Simple logging
    log.Println("Application started")
    log.Printf("Port: %d", 8080)
    
    // With prefix
    log.SetPrefix("[APP] ")
    log.Println("This has a prefix")
    
    // Fatal - logs and exits with status 1
    // log.Fatal("Critical error")  // Don't use unless needed
    
    // Panic - logs and panics
    // log.Panic("Something went wrong")
}
```

### Log Flags

```go
package main

import (
    "log"
)

func main() {
    // Default flags: Ldate | Ltime
    log.Println("Default format")
    
    // Custom flags
    log.SetFlags(log.Ldate | log.Ltime | log.Lmicroseconds | log.Llongfile)
    log.Println("With file and microseconds")
    
    // Short file name
    log.SetFlags(log.Ltime | log.Lshortfile)
    log.Println("Short format")
}
```

### Custom Logger

```go
package main

import (
    "log"
    "os"
)

func main() {
    // Log to file
    file, err := os.OpenFile("app.log", os.O_CREATE|os.O_WRONLY|os.O_APPEND, 0666)
    if err != nil {
        log.Fatal(err)
    }
    defer file.Close()
    
    logger := log.New(file, "[INFO] ", log.Ldate|log.Ltime|log.Lshortfile)
    logger.Println("Application started")
    logger.Printf("User %s logged in", "john")
}
```

## Structured Logging with slog (Go 1.21+)

### Basic slog Usage

```go
package main

import (
    "log/slog"
    "os"
)

func main() {
    // Default logger
    slog.Info("Application started")
    slog.Debug("Debug message")  // Won't show by default
    slog.Warn("Warning message")
    slog.Error("Error message")
    
    // With attributes
    slog.Info("User logged in",
        "user_id", 123,
        "username", "john",
        "ip", "192.168.1.1",
    )
}
```

### JSON Handler

```go
package main

import (
    "log/slog"
    "os"
)

func main() {
    // JSON format
    logger := slog.New(slog.NewJSONHandler(os.Stdout, nil))
    slog.SetDefault(logger)
    
    slog.Info("User action",
        "action", "login",
        "user_id", 123,
        "success", true,
    )
}

// Output: {"time":"2024-01-01T10:00:00.123Z","level":"INFO","msg":"User action","action":"login","user_id":123,"success":true}
```

### Text Handler

```go
package main

import (
    "log/slog"
    "os"
)

func main() {
    // Text format
    logger := slog.New(slog.NewTextHandler(os.Stdout, nil))
    slog.SetDefault(logger)
    
    slog.Info("Server started", "port", 8080, "env", "production")
}

// Output: time=2024-01-01T10:00:00.123Z level=INFO msg="Server started" port=8080 env=production
```

### Custom Log Levels

```go
package main

import (
    "log/slog"
    "os"
)

func main() {
    opts := &slog.HandlerOptions{
        Level: slog.LevelDebug,  // Show debug messages
    }
    
    logger := slog.New(slog.NewJSONHandler(os.Stdout, opts))
    slog.SetDefault(logger)
    
    slog.Debug("This will now be visible")
    slog.Info("Info message")
    slog.Warn("Warning message")
    slog.Error("Error message")
}
```

### Grouping Attributes

```go
package main

import "log/slog"

func main() {
    slog.Info("User request",
        slog.Group("user",
            "id", 123,
            "name", "john",
            "role", "admin",
        ),
        slog.Group("request",
            "method", "POST",
            "path", "/api/users",
            "duration_ms", 45,
        ),
    )
}

// Output: {"time":"...","level":"INFO","msg":"User request","user":{"id":123,"name":"john","role":"admin"},"request":{"method":"POST","path":"/api/users","duration_ms":45}}
```

### Context-Based Logging

```go
package main

import (
    "context"
    "log/slog"
)

type contextKey string

const loggerKey contextKey = "logger"

func WithLogger(ctx context.Context, logger *slog.Logger) context.Context {
    return context.WithValue(ctx, loggerKey, logger)
}

func GetLogger(ctx context.Context) *slog.Logger {
    if logger, ok := ctx.Value(loggerKey).(*slog.Logger); ok {
        return logger
    }
    return slog.Default()
}

func processRequest(ctx context.Context, userID int) {
    logger := GetLogger(ctx)
    logger.Info("Processing request", "user_id", userID)
}

func main() {
    logger := slog.With("request_id", "abc-123")
    ctx := WithLogger(context.Background(), logger)
    
    processRequest(ctx, 456)
}
```

## Middleware Logging

### HTTP Request Logger

```go
package main

import (
    "log/slog"
    "net/http"
    "time"
)

type responseWriter struct {
    http.ResponseWriter
    statusCode int
    bytes      int
}

func (rw *responseWriter) WriteHeader(statusCode int) {
    rw.statusCode = statusCode
    rw.ResponseWriter.WriteHeader(statusCode)
}

func (rw *responseWriter) Write(b []byte) (int, error) {
    n, err := rw.ResponseWriter.Write(b)
    rw.bytes += n
    return n, err
}

func LoggingMiddleware(next http.Handler) http.Handler {
    return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
        start := time.Now()
        
        rw := &responseWriter{
            ResponseWriter: w,
            statusCode:     http.StatusOK,
        }
        
        next.ServeHTTP(rw, r)
        
        duration := time.Since(start)
        
        slog.Info("HTTP request",
            "method", r.Method,
            "path", r.URL.Path,
            "status", rw.statusCode,
            "bytes", rw.bytes,
            "duration_ms", duration.Milliseconds(),
            "remote_addr", r.RemoteAddr,
            "user_agent", r.UserAgent(),
        )
    })
}

func main() {
    mux := http.NewServeMux()
    mux.HandleFunc("/", func(w http.ResponseWriter, r *http.Request) {
        w.Write([]byte("Hello, World!"))
    })
    
    handler := LoggingMiddleware(mux)
    http.ListenAndServe(":8080", handler)
}
```

### Request ID Middleware

```go
package main

import (
    "context"
    "log/slog"
    "net/http"
    
    "github.com/google/uuid"
)

type contextKey string

const requestIDKey contextKey = "request_id"

func RequestIDMiddleware(next http.Handler) http.Handler {
    return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
        requestID := uuid.New().String()
        
        // Add to context
        ctx := context.WithValue(r.Context(), requestIDKey, requestID)
        r = r.WithContext(ctx)
        
        // Add to response header
        w.Header().Set("X-Request-ID", requestID)
        
        // Create logger with request ID
        logger := slog.With("request_id", requestID)
        ctx = context.WithValue(ctx, "logger", logger)
        r = r.WithContext(ctx)
        
        logger.Info("Request started", "method", r.Method, "path", r.URL.Path)
        
        next.ServeHTTP(w, r)
    })
}
```

## Application-Wide Logger

### Logger Configuration

```go
package logger

import (
    "log/slog"
    "os"
)

var log *slog.Logger

func Init(level slog.Level, format string) {
    var handler slog.Handler
    
    opts := &slog.HandlerOptions{
        Level: level,
    }
    
    switch format {
    case "json":
        handler = slog.NewJSONHandler(os.Stdout, opts)
    default:
        handler = slog.NewTextHandler(os.Stdout, opts)
    }
    
    log = slog.New(handler)
    slog.SetDefault(log)
}

func Info(msg string, args ...any) {
    log.Info(msg, args...)
}

func Error(msg string, args ...any) {
    log.Error(msg, args...)
}

func Warn(msg string, args ...any) {
    log.Warn(msg, args...)
}

func Debug(msg string, args ...any) {
    log.Debug(msg, args...)
}
```

```go
// main.go
package main

import (
    "log/slog"
    "myapp/logger"
)

func main() {
    logger.Init(slog.LevelInfo, "json")
    
    logger.Info("Application starting", "version", "1.0.0")
    logger.Error("Database connection failed", "error", "timeout")
}
```

## Log Rotation

### Using lumberjack

```go
package main

import (
    "log/slog"
    
    "gopkg.in/natefinch/lumberjack.v2"
)

func main() {
    // Rotating file logger
    logWriter := &lumberjack.Logger{
        Filename:   "logs/app.log",
        MaxSize:    10,    // MB
        MaxBackups: 3,     // Number of old files to keep
        MaxAge:     28,    // Days
        Compress:   true,  // Compress old files
    }
    
    logger := slog.New(slog.NewJSONHandler(logWriter, nil))
    slog.SetDefault(logger)
    
    slog.Info("Application started")
}
```

## Error Logging

### Logging Errors with Context

```go
package main

import (
    "errors"
    "fmt"
    "log/slog"
)

func processData(id int) error {
    if id < 0 {
        err := errors.New("invalid ID")
        slog.Error("Data processing failed",
            "error", err,
            "id", id,
            "function", "processData",
        )
        return err
    }
    return nil
}

func main() {
    if err := processData(-1); err != nil {
        slog.Error("Operation failed", "error", err)
    }
}
```

### Logging Stack Traces

```go
package main

import (
    "fmt"
    "log/slog"
    "runtime/debug"
)

func logPanic() {
    if r := recover(); r != nil {
        slog.Error("Panic recovered",
            "panic", r,
            "stack", string(debug.Stack()),
        )
    }
}

func riskyOperation() {
    defer logPanic()
    
    // Risky code
    panic("something went wrong")
}

func main() {
    riskyOperation()
    fmt.Println("Application continues...")
}
```

## Production Logging Setup

### Complete Example

```go
package main

import (
    "context"
    "log/slog"
    "net/http"
    "os"
    "time"
    
    "github.com/google/uuid"
)

// Logger setup
func setupLogger(env string) *slog.Logger {
    var handler slog.Handler
    
    opts := &slog.HandlerOptions{
        Level: getLogLevel(env),
    }
    
    if env == "production" {
        handler = slog.NewJSONHandler(os.Stdout, opts)
    } else {
        handler = slog.NewTextHandler(os.Stdout, opts)
    }
    
    return slog.New(handler)
}

func getLogLevel(env string) slog.Level {
    switch env {
    case "production":
        return slog.LevelInfo
    case "development":
        return slog.LevelDebug
    default:
        return slog.LevelInfo
    }
}

// Request context
type contextKey string

const (
    loggerKey   contextKey = "logger"
    requestIDKey contextKey = "request_id"
)

// Middleware
func LoggingMiddleware(logger *slog.Logger) func(http.Handler) http.Handler {
    return func(next http.Handler) http.Handler {
        return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
            start := time.Now()
            requestID := uuid.New().String()
            
            // Create request-scoped logger
            reqLogger := logger.With(
                "request_id", requestID,
                "method", r.Method,
                "path", r.URL.Path,
            )
            
            // Add to context
            ctx := context.WithValue(r.Context(), loggerKey, reqLogger)
            ctx = context.WithValue(ctx, requestIDKey, requestID)
            r = r.WithContext(ctx)
            
            // Add to headers
            w.Header().Set("X-Request-ID", requestID)
            
            reqLogger.Info("Request started")
            
            // Wrap response writer
            rw := &responseWriter{ResponseWriter: w, statusCode: http.StatusOK}
            
            next.ServeHTTP(rw, r)
            
            duration := time.Since(start)
            
            reqLogger.Info("Request completed",
                "status", rw.statusCode,
                "bytes", rw.bytes,
                "duration_ms", duration.Milliseconds(),
            )
        })
    }
}

type responseWriter struct {
    http.ResponseWriter
    statusCode int
    bytes      int
}

func (rw *responseWriter) WriteHeader(code int) {
    rw.statusCode = code
    rw.ResponseWriter.WriteHeader(code)
}

func (rw *responseWriter) Write(b []byte) (int, error) {
    n, err := rw.ResponseWriter.Write(b)
    rw.bytes += n
    return n, err
}

// Helper to get logger from context
func GetLogger(ctx context.Context) *slog.Logger {
    if logger, ok := ctx.Value(loggerKey).(*slog.Logger); ok {
        return logger
    }
    return slog.Default()
}

// Handler example
func handleUser(w http.ResponseWriter, r *http.Request) {
    logger := GetLogger(r.Context())
    
    logger.Info("Fetching user", "user_id", 123)
    
    // Business logic
    time.Sleep(50 * time.Millisecond)
    
    w.Write([]byte("User data"))
}

func main() {
    logger := setupLogger("development")
    slog.SetDefault(logger)
    
    logger.Info("Starting server", "port", 8080)
    
    mux := http.NewServeMux()
    mux.HandleFunc("/users", handleUser)
    
    handler := LoggingMiddleware(logger)(mux)
    
    http.ListenAndServe(":8080", handler)
}
```

## Best Practices

### 1. Use Structured Logging

```go
// GOOD - structured
slog.Info("User login", "user_id", 123, "ip", "192.168.1.1")

// BAD - unstructured
log.Printf("User %d logged in from %s", 123, "192.168.1.1")
```

### 2. Log at Appropriate Levels

```go
slog.Debug("Detailed debugging info")  // Development only
slog.Info("Normal operations")          // Production events
slog.Warn("Something unusual")          // Potential issues
slog.Error("Something failed")          // Errors requiring attention
```

### 3. Include Context

```go
slog.Error("Database query failed",
    "error", err,
    "query", "SELECT ...",
    "duration_ms", 1500,
    "user_id", 123,
)
```

### 4. Don't Log Sensitive Data

```go
// GOOD
slog.Info("User authenticated", "user_id", 123)

// BAD - logging password!
slog.Info("Login attempt", "password", "secret123")
```

### 5. Use Request IDs

```go
logger := slog.With("request_id", uuid.New().String())
logger.Info("Processing request")
```

## Summary

Logging in Go provides:
- **Standard log**: Simple, built-in logging
- **slog**: Structured, leveled logging (Go 1.21+)
- **JSON/Text**: Multiple output formats
- **Middleware**: Request tracking and monitoring
- **Context**: Request-scoped loggers
- **Production Ready**: Rotation, levels, structured data

Essential for debugging, monitoring, and maintaining production applications.
