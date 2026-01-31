# Middleware Patterns

## What is Middleware?

Middleware is code that executes **before** or **after** your main handler. It intercepts HTTP requests to add cross-cutting concerns like logging, authentication, error handling, etc.

## Why Use Middleware?

- **Code Reuse**: Don't repeat yourself
- **Separation of Concerns**: Keep handlers focused
- **Composability**: Chain multiple behaviors
- **Maintainability**: Centralize common logic

## Basic Middleware Pattern

### Standard Library

```go
package main

import (
    "fmt"
    "log"
    "net/http"
    "time"
)

// Middleware function signature
type Middleware func(http.Handler) http.Handler

// Logging middleware
func LoggingMiddleware(next http.Handler) http.Handler {
    return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
        start := time.Now()
        
        log.Printf("Started %s %s", r.Method, r.URL.Path)
        
        // Call next handler
        next.ServeHTTP(w, r)
        
        log.Printf("Completed in %v", time.Since(start))
    })
}

// Authentication middleware
func AuthMiddleware(next http.Handler) http.Handler {
    return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
        token := r.Header.Get("Authorization")
        
        if token == "" {
            http.Error(w, "Unauthorized", http.StatusUnauthorized)
            return
        }
        
        // Validate token...
        
        next.ServeHTTP(w, r)
    })
}

// Chain middleware
func Chain(h http.Handler, middlewares ...Middleware) http.Handler {
    for i := len(middlewares) - 1; i >= 0; i-- {
        h = middlewares[i](h)
    }
    return h
}

func main() {
    handler := http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
        w.Write([]byte("Hello, World!"))
    })
    
    // Apply middleware
    wrapped := Chain(handler, LoggingMiddleware, AuthMiddleware)
    
    http.ListenAndServe(":8080", wrapped)
}
```

## Gin Framework Middleware

### Basic Gin Middleware

```go
package main

import (
    "log"
    "time"
    
    "github.com/gin-gonic/gin"
)

// Logging middleware
func Logger() gin.HandlerFunc {
    return func(c *gin.Context) {
        start := time.Now()
        path := c.Request.URL.Path
        
        // Process request
        c.Next()
        
        // After request
        latency := time.Since(start)
        status := c.Writer.Status()
        
        log.Printf("%s %s %d %v", c.Request.Method, path, status, latency)
    }
}

// Recovery middleware (panic recovery)
func Recovery() gin.HandlerFunc {
    return func(c *gin.Context) {
        defer func() {
            if err := recover(); err != nil {
                log.Printf("Panic: %v", err)
                c.JSON(500, gin.H{"error": "Internal server error"})
            }
        }()
        
        c.Next()
    }
}

func main() {
    r := gin.New()
    
    // Global middleware
    r.Use(Logger())
    r.Use(Recovery())
    
    r.GET("/", func(c *gin.Context) {
        c.JSON(200, gin.H{"message": "Hello"})
    })
    
    r.Run(":8080")
}
```

## Common Middleware Patterns

### 1. Request ID

```go
import "github.com/google/uuid"

func RequestID() gin.HandlerFunc {
    return func(c *gin.Context) {
        requestID := c.GetHeader("X-Request-ID")
        
        if requestID == "" {
            requestID = uuid.New().String()
        }
        
        // Store in context
        c.Set("request_id", requestID)
        
        // Add to response headers
        c.Header("X-Request-ID", requestID)
        
        c.Next()
    }
}

// Usage
r.Use(RequestID())

func handler(c *gin.Context) {
    requestID := c.GetString("request_id")
    log.Printf("Request ID: %s", requestID)
}
```

### 2. CORS (Cross-Origin Resource Sharing)

```go
func CORS() gin.HandlerFunc {
    return func(c *gin.Context) {
        c.Header("Access-Control-Allow-Origin", "*")
        c.Header("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS")
        c.Header("Access-Control-Allow-Headers", "Content-Type, Authorization")
        c.Header("Access-Control-Max-Age", "86400")
        
        if c.Request.Method == "OPTIONS" {
            c.AbortWithStatus(204)
            return
        }
        
        c.Next()
    }
}

// Or use official middleware
import "github.com/gin-contrib/cors"

func setupCORS(r *gin.Engine) {
    r.Use(cors.New(cors.Config{
        AllowOrigins:     []string{"https://example.com"},
        AllowMethods:     []string{"GET", "POST", "PUT", "DELETE"},
        AllowHeaders:     []string{"Origin", "Content-Type", "Authorization"},
        ExposeHeaders:    []string{"Content-Length"},
        AllowCredentials: true,
        MaxAge:           12 * time.Hour,
    }))
}
```

### 3. Rate Limiting

```go
import (
    "sync"
    "time"
    "golang.org/x/time/rate"
)

type RateLimiter struct {
    limiters map[string]*rate.Limiter
    mu       sync.RWMutex
    rate     rate.Limit
    burst    int
}

func NewRateLimiter(r rate.Limit, b int) *RateLimiter {
    return &RateLimiter{
        limiters: make(map[string]*rate.Limiter),
        rate:     r,
        burst:    b,
    }
}

func (rl *RateLimiter) GetLimiter(key string) *rate.Limiter {
    rl.mu.Lock()
    defer rl.mu.Unlock()
    
    limiter, exists := rl.limiters[key]
    if !exists {
        limiter = rate.NewLimiter(rl.rate, rl.burst)
        rl.limiters[key] = limiter
    }
    
    return limiter
}

func RateLimit(rl *RateLimiter) gin.HandlerFunc {
    return func(c *gin.Context) {
        key := c.ClientIP()
        limiter := rl.GetLimiter(key)
        
        if !limiter.Allow() {
            c.JSON(429, gin.H{
                "error": "Rate limit exceeded",
                "retry_after": "60s",
            })
            c.Abort()
            return
        }
        
        c.Next()
    }
}

// Usage
limiter := NewRateLimiter(rate.Limit(100), 200) // 100 req/sec, burst 200
r.Use(RateLimit(limiter))
```

### 4. Authentication

```go
func AuthRequired() gin.HandlerFunc {
    return func(c *gin.Context) {
        authHeader := c.GetHeader("Authorization")
        
        if authHeader == "" {
            c.JSON(401, gin.H{"error": "Missing authorization header"})
            c.Abort()
            return
        }
        
        // Parse token
        parts := strings.Split(authHeader, " ")
        if len(parts) != 2 || parts[0] != "Bearer" {
            c.JSON(401, gin.H{"error": "Invalid authorization header"})
            c.Abort()
            return
        }
        
        token := parts[1]
        
        // Validate token
        claims, err := ValidateJWT(token)
        if err != nil {
            c.JSON(401, gin.H{"error": "Invalid token"})
            c.Abort()
            return
        }
        
        // Store user info in context
        c.Set("user_id", claims.UserID)
        c.Set("user_role", claims.Role)
        
        c.Next()
    }
}

// Role-based access control
func RequireRole(role string) gin.HandlerFunc {
    return func(c *gin.Context) {
        userRole := c.GetString("user_role")
        
        if userRole != role {
            c.JSON(403, gin.H{"error": "Insufficient permissions"})
            c.Abort()
            return
        }
        
        c.Next()
    }
}

// Usage
protected := r.Group("/api")
protected.Use(AuthRequired())
{
    protected.GET("/profile", getProfile)
    
    admin := protected.Group("/admin")
    admin.Use(RequireRole("admin"))
    {
        admin.GET("/users", listUsers)
    }
}
```

### 5. Request Validation

```go
func ValidateContentType(contentType string) gin.HandlerFunc {
    return func(c *gin.Context) {
        if c.Request.Method != "GET" && c.Request.Method != "DELETE" {
            ct := c.GetHeader("Content-Type")
            if ct != contentType {
                c.JSON(415, gin.H{
                    "error": fmt.Sprintf("Content-Type must be %s", contentType),
                })
                c.Abort()
                return
            }
        }
        
        c.Next()
    }
}

// Max body size
func MaxBodySize(size int64) gin.HandlerFunc {
    return func(c *gin.Context) {
        c.Request.Body = http.MaxBytesReader(c.Writer, c.Request.Body, size)
        c.Next()
    }
}

// Usage
r.Use(ValidateContentType("application/json"))
r.Use(MaxBodySize(1024 * 1024)) // 1 MB
```

### 6. Compression

```go
import "github.com/gin-contrib/gzip"

func setupCompression(r *gin.Engine) {
    r.Use(gzip.Gzip(gzip.DefaultCompression))
}
```

### 7. Timeout

```go
func Timeout(timeout time.Duration) gin.HandlerFunc {
    return func(c *gin.Context) {
        ctx, cancel := context.WithTimeout(c.Request.Context(), timeout)
        defer cancel()
        
        c.Request = c.Request.WithContext(ctx)
        
        finished := make(chan struct{})
        go func() {
            c.Next()
            finished <- struct{}{}
        }()
        
        select {
        case <-finished:
            return
        case <-ctx.Done():
            c.JSON(408, gin.H{"error": "Request timeout"})
            c.Abort()
        }
    }
}

// Usage
r.Use(Timeout(30 * time.Second))
```

### 8. Error Handling

```go
func ErrorHandler() gin.HandlerFunc {
    return func(c *gin.Context) {
        c.Next()
        
        if len(c.Errors) > 0 {
            err := c.Errors.Last()
            
            // Log error
            log.Printf("Error: %v", err.Err)
            
            // Send error response
            var statusCode int
            var message string
            
            switch e := err.Err.(type) {
            case *APIError:
                statusCode = e.StatusCode
                message = e.Message
            default:
                statusCode = 500
                message = "Internal server error"
            }
            
            c.JSON(statusCode, gin.H{
                "error": message,
                "request_id": c.GetString("request_id"),
            })
        }
    }
}
```

### 9. Structured Logging

```go
import "log/slog"

func StructuredLogger(logger *slog.Logger) gin.HandlerFunc {
    return func(c *gin.Context) {
        start := time.Now()
        path := c.Request.URL.Path
        
        c.Next()
        
        latency := time.Since(start)
        
        logger.Info("Request completed",
            "method", c.Request.Method,
            "path", path,
            "status", c.Writer.Status(),
            "latency", latency,
            "ip", c.ClientIP(),
            "user_agent", c.Request.UserAgent(),
            "request_id", c.GetString("request_id"),
        )
    }
}
```

### 10. Database Transaction

```go
func DBTransaction(db *gorm.DB) gin.HandlerFunc {
    return func(c *gin.Context) {
        tx := db.Begin()
        defer func() {
            if r := recover(); r != nil {
                tx.Rollback()
                panic(r)
            }
        }()
        
        c.Set("db", tx)
        c.Next()
        
        if len(c.Errors) > 0 {
            tx.Rollback()
        } else {
            tx.Commit()
        }
    }
}

// Usage in handler
func createUser(c *gin.Context) {
    tx := c.MustGet("db").(*gorm.DB)
    
    var user User
    if err := c.ShouldBindJSON(&user); err != nil {
        c.Error(err)
        return
    }
    
    if err := tx.Create(&user).Error; err != nil {
        c.Error(err)
        return
    }
    
    c.JSON(200, user)
}
```

## Middleware Ordering

Order matters! Apply middleware from general to specific:

```go
r := gin.New()

// 1. Recovery (catch panics)
r.Use(gin.Recovery())

// 2. Request ID (for tracking)
r.Use(RequestID())

// 3. Logging (log with request ID)
r.Use(Logger())

// 4. CORS (before auth)
r.Use(CORS())

// 5. Rate limiting (prevent abuse)
r.Use(RateLimit(limiter))

// 6. Authentication (route-specific)
protected := r.Group("/api")
protected.Use(AuthRequired())

// 7. Authorization (after auth)
admin := protected.Group("/admin")
admin.Use(RequireRole("admin"))
```

## Custom Response Writer

Capture response for logging:

```go
type ResponseWriter struct {
    gin.ResponseWriter
    body *bytes.Buffer
}

func (w *ResponseWriter) Write(b []byte) (int, error) {
    w.body.Write(b)
    return w.ResponseWriter.Write(b)
}

func CaptureResponse() gin.HandlerFunc {
    return func(c *gin.Context) {
        blw := &ResponseWriter{
            ResponseWriter: c.Writer,
            body:          bytes.NewBufferString(""),
        }
        c.Writer = blw
        
        c.Next()
        
        // Log response body
        log.Printf("Response: %s", blw.body.String())
    }
}
```

## Conditional Middleware

Apply middleware based on conditions:

```go
func ConditionalMiddleware(condition func(*gin.Context) bool, middleware gin.HandlerFunc) gin.HandlerFunc {
    return func(c *gin.Context) {
        if condition(c) {
            middleware(c)
        } else {
            c.Next()
        }
    }
}

// Usage: Only apply auth to non-public routes
r.Use(ConditionalMiddleware(
    func(c *gin.Context) bool {
        return !strings.HasPrefix(c.Request.URL.Path, "/public")
    },
    AuthRequired(),
))
```

## Complete Example

```go
package main

import (
    "log"
    "time"
    
    "github.com/gin-gonic/gin"
    "golang.org/x/time/rate"
)

func main() {
    r := gin.New()
    
    // Global middleware
    r.Use(gin.Recovery())
    r.Use(RequestID())
    r.Use(Logger())
    r.Use(CORS())
    
    limiter := NewRateLimiter(rate.Limit(100), 200)
    r.Use(RateLimit(limiter))
    
    // Public routes
    r.POST("/login", login)
    r.POST("/register", register)
    
    // Protected routes
    api := r.Group("/api")
    api.Use(AuthRequired())
    {
        api.GET("/profile", getProfile)
        api.PUT("/profile", updateProfile)
        
        // Admin routes
        admin := api.Group("/admin")
        admin.Use(RequireRole("admin"))
        {
            admin.GET("/users", listUsers)
            admin.DELETE("/users/:id", deleteUser)
        }
    }
    
    r.Run(":8080")
}
```

## Testing Middleware

```go
func TestAuthMiddleware(t *testing.T) {
    r := gin.New()
    r.Use(AuthRequired())
    r.GET("/test", func(c *gin.Context) {
        c.JSON(200, gin.H{"message": "success"})
    })
    
    // Test without token
    w := httptest.NewRecorder()
    req, _ := http.NewRequest("GET", "/test", nil)
    r.ServeHTTP(w, req)
    
    assert.Equal(t, 401, w.Code)
    
    // Test with valid token
    w = httptest.NewRecorder()
    req, _ = http.NewRequest("GET", "/test", nil)
    req.Header.Set("Authorization", "Bearer valid-token")
    r.ServeHTTP(w, req)
    
    assert.Equal(t, 200, w.Code)
}
```

## Best Practices

### 1. Keep Middleware Focused

```go
// Good: Single responsibility
func RequestID() gin.HandlerFunc { /* ... */ }
func Logger() gin.HandlerFunc { /* ... */ }

// Bad: Multiple responsibilities
func RequestIDAndLogger() gin.HandlerFunc { /* ... */ }
```

### 2. Use Context for Data Passing

```go
// Store data
c.Set("user_id", 123)

// Retrieve data
userID := c.GetInt("user_id")
```

### 3. Call c.Next() Appropriately

```go
func Middleware() gin.HandlerFunc {
    return func(c *gin.Context) {
        // Before handler
        
        c.Next() // Call next middleware/handler
        
        // After handler
    }
}
```

### 4. Abort When Needed

```go
if !authorized {
    c.JSON(403, gin.H{"error": "Forbidden"})
    c.Abort() // Stop chain
    return
}
```

## Summary

Middleware provides:
- **Logging**: Track requests
- **Authentication**: Verify users
- **Authorization**: Check permissions
- **Rate Limiting**: Prevent abuse
- **CORS**: Enable cross-origin requests
- **Error Handling**: Centralized errors
- **Validation**: Input validation

Essential for building robust, maintainable backends.
