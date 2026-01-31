# API Gateway Pattern

## What is an API Gateway?

**API Gateway** is a single entry point for all client requests:
- **Request Routing**: Route to appropriate microservice
- **Authentication**: Validate tokens before forwarding
- **Rate Limiting**: Protect backend services
- **Load Balancing**: Distribute requests evenly
- **Protocol Translation**: REST to gRPC conversion

## Why API Gateway?

- **Single Entry Point**: Simplify client integration
- **Security**: Centralized authentication/authorization
- **Performance**: Caching, compression
- **Monitoring**: Centralized logging and metrics
- **Decoupling**: Clients don't need to know backend structure

## Core Features

1. **Routing**: Path-based, header-based
2. **Authentication**: JWT validation, OAuth2
3. **Rate Limiting**: Per-client, global
4. **Load Balancing**: Round-robin, least connections
5. **Circuit Breaking**: Fault tolerance
6. **Response Transformation**: Aggregate multiple services
7. **Caching**: Reduce backend load
8. **Logging & Tracing**: Request correlation

## Installation

```bash
go get github.com/gin-gonic/gin
go get github.com/sony/gobreaker
go get golang.org/x/time/rate
go get github.com/redis/go-redis/v9
```

## Basic API Gateway

```go
package main

import (
    "net/http"
    "net/http/httputil"
    "net/url"
    
    "github.com/gin-gonic/gin"
)

type Route struct {
    Path    string
    Service string
}

var routes = []Route{
    {Path: "/users", Service: "http://user-service:8081"},
    {Path: "/orders", Service: "http://order-service:8082"},
    {Path: "/products", Service: "http://product-service:8083"},
}

func main() {
    r := gin.Default()
    
    // Setup routes
    for _, route := range routes {
        setupProxy(r, route.Path, route.Service)
    }
    
    r.Run(":8080")
}

func setupProxy(r *gin.Engine, path, target string) {
    targetURL, _ := url.Parse(target)
    proxy := httputil.NewSingleHostReverseProxy(targetURL)
    
    r.Any(path+"/*any", func(c *gin.Context) {
        proxy.ServeHTTP(c.Writer, c.Request)
    })
}
```

## Advanced API Gateway

```go
package gateway

import (
    "context"
    "net/http"
    "net/http/httputil"
    "net/url"
    "sync"
    "time"
    
    "github.com/gin-gonic/gin"
    "github.com/sony/gobreaker"
    "golang.org/x/time/rate"
)

type ServiceConfig struct {
    Name            string
    URL             string
    Timeout         time.Duration
    MaxRetries      int
    CircuitBreaker  *gobreaker.CircuitBreaker
    RateLimiter     *rate.Limiter
}

type Gateway struct {
    services map[string]*ServiceConfig
    mu       sync.RWMutex
}

func NewGateway() *Gateway {
    return &Gateway{
        services: make(map[string]*ServiceConfig),
    }
}

func (gw *Gateway) RegisterService(name, serviceURL string) {
    gw.mu.Lock()
    defer gw.mu.Unlock()
    
    targetURL, _ := url.Parse(serviceURL)
    
    gw.services[name] = &ServiceConfig{
        Name:    name,
        URL:     serviceURL,
        Timeout: 30 * time.Second,
        CircuitBreaker: gobreaker.NewCircuitBreaker(gobreaker.Settings{
            Name:        name,
            MaxRequests: 3,
            Timeout:     60 * time.Second,
            ReadyToTrip: func(counts gobreaker.Counts) bool {
                return counts.ConsecutiveFailures > 5
            },
        }),
        RateLimiter: rate.NewLimiter(100, 200), // 100 req/sec, burst 200
    }
}

func (gw *Gateway) ProxyRequest(serviceName string) gin.HandlerFunc {
    return func(c *gin.Context) {
        gw.mu.RLock()
        service, exists := gw.services[serviceName]
        gw.mu.RUnlock()
        
        if !exists {
            c.JSON(404, gin.H{"error": "Service not found"})
            return
        }
        
        // Rate limiting
        if !service.RateLimiter.Allow() {
            c.JSON(429, gin.H{"error": "Rate limit exceeded"})
            return
        }
        
        // Circuit breaker
        _, err := service.CircuitBreaker.Execute(func() (interface{}, error) {
            return nil, gw.forwardRequest(c, service)
        })
        
        if err != nil {
            if err == gobreaker.ErrOpenState {
                c.JSON(503, gin.H{"error": "Service unavailable"})
            } else {
                c.JSON(500, gin.H{"error": err.Error()})
            }
            return
        }
    }
}

func (gw *Gateway) forwardRequest(c *gin.Context, service *ServiceConfig) error {
    targetURL, _ := url.Parse(service.URL)
    proxy := httputil.NewSingleHostReverseProxy(targetURL)
    
    // Modify request
    originalDirector := proxy.Director
    proxy.Director = func(req *http.Request) {
        originalDirector(req)
        
        // Add correlation ID
        if corrID := c.GetHeader("X-Correlation-ID"); corrID == "" {
            req.Header.Set("X-Correlation-ID", generateCorrelationID())
        }
        
        // Forward auth token
        if token := c.GetHeader("Authorization"); token != "" {
            req.Header.Set("Authorization", token)
        }
    }
    
    // Set timeout
    ctx, cancel := context.WithTimeout(c.Request.Context(), service.Timeout)
    defer cancel()
    c.Request = c.Request.WithContext(ctx)
    
    proxy.ServeHTTP(c.Writer, c.Request)
    return nil
}
```

## Authentication Middleware

```go
package middleware

import (
    "strings"
    
    "github.com/gin-gonic/gin"
    "github.com/golang-jwt/jwt/v5"
)

func AuthMiddleware(jwtSecret string) gin.HandlerFunc {
    return func(c *gin.Context) {
        authHeader := c.GetHeader("Authorization")
        if authHeader == "" {
            c.JSON(401, gin.H{"error": "Missing authorization header"})
            c.Abort()
            return
        }
        
        tokenString := strings.TrimPrefix(authHeader, "Bearer ")
        
        token, err := jwt.Parse(tokenString, func(token *jwt.Token) (interface{}, error) {
            return []byte(jwtSecret), nil
        })
        
        if err != nil || !token.Valid {
            c.JSON(401, gin.H{"error": "Invalid token"})
            c.Abort()
            return
        }
        
        if claims, ok := token.Claims.(jwt.MapClaims); ok {
            c.Set("user_id", claims["user_id"])
            c.Set("email", claims["email"])
        }
        
        c.Next()
    }
}
```

## Rate Limiting

```go
package middleware

import (
    "sync"
    "time"
    
    "github.com/gin-gonic/gin"
    "golang.org/x/time/rate"
)

type IPRateLimiter struct {
    limiters map[string]*rate.Limiter
    mu       sync.RWMutex
    rate     rate.Limit
    burst    int
}

func NewIPRateLimiter(r rate.Limit, burst int) *IPRateLimiter {
    return &IPRateLimiter{
        limiters: make(map[string]*rate.Limiter),
        rate:     r,
        burst:    burst,
    }
}

func (rl *IPRateLimiter) GetLimiter(ip string) *rate.Limiter {
    rl.mu.RLock()
    limiter, exists := rl.limiters[ip]
    rl.mu.RUnlock()
    
    if exists {
        return limiter
    }
    
    rl.mu.Lock()
    defer rl.mu.Unlock()
    
    // Double check
    if limiter, exists := rl.limiters[ip]; exists {
        return limiter
    }
    
    limiter = rate.NewLimiter(rl.rate, rl.burst)
    rl.limiters[ip] = limiter
    
    return limiter
}

func RateLimitMiddleware(rl *IPRateLimiter) gin.HandlerFunc {
    return func(c *gin.Context) {
        ip := c.ClientIP()
        limiter := rl.GetLimiter(ip)
        
        if !limiter.Allow() {
            c.JSON(429, gin.H{
                "error": "Rate limit exceeded",
                "retry_after": time.Second.String(),
            })
            c.Abort()
            return
        }
        
        c.Next()
    }
}
```

## Request Aggregation

Combine multiple backend calls into one response.

```go
package handlers

import (
    "context"
    "encoding/json"
    "net/http"
    "sync"
    
    "github.com/gin-gonic/gin"
)

type UserDashboard struct {
    User    *User    `json:"user"`
    Orders  []Order  `json:"orders"`
    Profile *Profile `json:"profile"`
}

func GetUserDashboard(c *gin.Context) {
    userID := c.Param("id")
    ctx := c.Request.Context()
    
    var wg sync.WaitGroup
    var mu sync.Mutex
    
    dashboard := &UserDashboard{}
    var errors []error
    
    // Fetch user
    wg.Add(1)
    go func() {
        defer wg.Done()
        user, err := fetchUser(ctx, userID)
        mu.Lock()
        defer mu.Unlock()
        if err != nil {
            errors = append(errors, err)
        } else {
            dashboard.User = user
        }
    }()
    
    // Fetch orders
    wg.Add(1)
    go func() {
        defer wg.Done()
        orders, err := fetchOrders(ctx, userID)
        mu.Lock()
        defer mu.Unlock()
        if err != nil {
            errors = append(errors, err)
        } else {
            dashboard.Orders = orders
        }
    }()
    
    // Fetch profile
    wg.Add(1)
    go func() {
        defer wg.Done()
        profile, err := fetchProfile(ctx, userID)
        mu.Lock()
        defer mu.Unlock()
        if err != nil {
            errors = append(errors, err)
        } else {
            dashboard.Profile = profile
        }
    }()
    
    wg.Wait()
    
    if len(errors) > 0 {
        c.JSON(500, gin.H{"errors": errors})
        return
    }
    
    c.JSON(200, dashboard)
}

func fetchUser(ctx context.Context, userID string) (*User, error) {
    req, _ := http.NewRequestWithContext(ctx, "GET", "http://user-service/users/"+userID, nil)
    resp, err := http.DefaultClient.Do(req)
    if err != nil {
        return nil, err
    }
    defer resp.Body.Close()
    
    var user User
    json.NewDecoder(resp.Body).Decode(&user)
    return &user, nil
}
```

## Response Caching

```go
package middleware

import (
    "crypto/md5"
    "encoding/hex"
    "encoding/json"
    "time"
    
    "github.com/gin-gonic/gin"
    "github.com/redis/go-redis/v9"
)

func CacheMiddleware(redis *redis.Client, ttl time.Duration) gin.HandlerFunc {
    return func(c *gin.Context) {
        // Only cache GET requests
        if c.Request.Method != "GET" {
            c.Next()
            return
        }
        
        // Generate cache key
        cacheKey := generateCacheKey(c.Request.URL.Path, c.Request.URL.RawQuery)
        
        // Check cache
        cached, err := redis.Get(c.Request.Context(), cacheKey).Bytes()
        if err == nil {
            var response CachedResponse
            if json.Unmarshal(cached, &response) == nil {
                c.Header("X-Cache", "HIT")
                c.Data(response.Status, response.ContentType, response.Body)
                c.Abort()
                return
            }
        }
        
        // Capture response
        writer := &responseWriter{ResponseWriter: c.Writer}
        c.Writer = writer
        
        c.Next()
        
        // Cache response
        if writer.status == 200 {
            response := CachedResponse{
                Status:      writer.status,
                ContentType: c.GetHeader("Content-Type"),
                Body:        writer.body.Bytes(),
            }
            
            data, _ := json.Marshal(response)
            redis.Set(c.Request.Context(), cacheKey, data, ttl)
        }
        
        c.Header("X-Cache", "MISS")
    }
}

func generateCacheKey(path, query string) string {
    h := md5.New()
    h.Write([]byte(path + query))
    return "cache:" + hex.EncodeToString(h.Sum(nil))
}

type CachedResponse struct {
    Status      int    `json:"status"`
    ContentType string `json:"content_type"`
    Body        []byte `json:"body"`
}

type responseWriter struct {
    gin.ResponseWriter
    status int
    body   bytes.Buffer
}

func (w *responseWriter) Write(b []byte) (int, error) {
    w.body.Write(b)
    return w.ResponseWriter.Write(b)
}

func (w *responseWriter) WriteHeader(code int) {
    w.status = code
    w.ResponseWriter.WriteHeader(code)
}
```

## Load Balancing

```go
package gateway

import (
    "net/http"
    "net/http/httputil"
    "net/url"
    "sync"
    "sync/atomic"
)

type LoadBalancer struct {
    backends []*Backend
    current  uint64
}

type Backend struct {
    URL          *url.URL
    Alive        bool
    mu           sync.RWMutex
    ReverseProxy *httputil.ReverseProxy
}

func NewLoadBalancer(urls []string) *LoadBalancer {
    lb := &LoadBalancer{
        backends: make([]*Backend, len(urls)),
    }
    
    for i, u := range urls {
        parsedURL, _ := url.Parse(u)
        lb.backends[i] = &Backend{
            URL:          parsedURL,
            Alive:        true,
            ReverseProxy: httputil.NewSingleHostReverseProxy(parsedURL),
        }
    }
    
    return lb
}

func (lb *LoadBalancer) GetNextBackend() *Backend {
    // Round-robin
    idx := atomic.AddUint64(&lb.current, 1) % uint64(len(lb.backends))
    
    // Find alive backend
    for i := 0; i < len(lb.backends); i++ {
        backend := lb.backends[(int(idx)+i)%len(lb.backends)]
        backend.mu.RLock()
        alive := backend.Alive
        backend.mu.RUnlock()
        
        if alive {
            return backend
        }
    }
    
    return nil
}

func (lb *LoadBalancer) ServeHTTP(w http.ResponseWriter, r *http.Request) {
    backend := lb.GetNextBackend()
    if backend == nil {
        http.Error(w, "No available backends", http.StatusServiceUnavailable)
        return
    }
    
    backend.ReverseProxy.ServeHTTP(w, r)
}

// Health check
func (lb *LoadBalancer) HealthCheck() {
    for _, backend := range lb.backends {
        alive := isBackendAlive(backend.URL)
        backend.mu.Lock()
        backend.Alive = alive
        backend.mu.Unlock()
    }
}

func isBackendAlive(url *url.URL) bool {
    timeout := 2 * time.Second
    conn, err := net.DialTimeout("tcp", url.Host, timeout)
    if err != nil {
        return false
    }
    defer conn.Close()
    return true
}
```

## Complete API Gateway Example

```go
package main

import (
    "context"
    "log"
    "os"
    "os/signal"
    "syscall"
    "time"
    
    "github.com/gin-gonic/gin"
    "github.com/redis/go-redis/v9"
    "golang.org/x/time/rate"
)

func main() {
    // Initialize Redis
    rdb := redis.NewClient(&redis.Options{
        Addr: "localhost:6379",
    })
    defer rdb.Close()
    
    // Initialize gateway
    gateway := NewGateway()
    gateway.RegisterService("user", "http://user-service:8081")
    gateway.RegisterService("order", "http://order-service:8082")
    gateway.RegisterService("product", "http://product-service:8083")
    
    // Setup Gin
    r := gin.Default()
    
    // Global middleware
    r.Use(CORSMiddleware())
    r.Use(LoggingMiddleware())
    r.Use(RateLimitMiddleware(NewIPRateLimiter(rate.Limit(100), 200)))
    
    // Public routes (no auth)
    public := r.Group("/api/v1")
    {
        public.GET("/products/*any", gateway.ProxyRequest("product"))
    }
    
    // Protected routes (require auth)
    protected := r.Group("/api/v1")
    protected.Use(AuthMiddleware(os.Getenv("JWT_SECRET")))
    {
        protected.GET("/users/*any", gateway.ProxyRequest("user"))
        protected.GET("/orders/*any", gateway.ProxyRequest("order"))
        
        // Aggregated endpoint
        protected.GET("/dashboard/:id", GetUserDashboard)
    }
    
    // Admin routes
    admin := r.Group("/api/v1/admin")
    admin.Use(AuthMiddleware(os.Getenv("JWT_SECRET")))
    admin.Use(RequireRole("admin"))
    {
        admin.GET("/users/*any", gateway.ProxyRequest("user"))
    }
    
    // Health check
    r.GET("/health", func(c *gin.Context) {
        c.JSON(200, gin.H{"status": "healthy"})
    })
    
    // Graceful shutdown
    srv := &http.Server{
        Addr:    ":8080",
        Handler: r,
    }
    
    go func() {
        if err := srv.ListenAndServe(); err != nil && err != http.ErrServerClosed {
            log.Fatalf("Server error: %v", err)
        }
    }()
    
    quit := make(chan os.Signal, 1)
    signal.Notify(quit, syscall.SIGINT, syscall.SIGTERM)
    <-quit
    
    log.Println("Shutting down server...")
    
    ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
    defer cancel()
    
    if err := srv.Shutdown(ctx); err != nil {
        log.Fatal("Server forced to shutdown:", err)
    }
    
    log.Println("Server exited")
}
```

## Best Practices

1. **Authentication at Gateway**: Don't duplicate in services
2. **Rate Limiting**: Per-client and global limits
3. **Circuit Breakers**: Protect backend services
4. **Timeouts**: Set appropriate request timeouts
5. **Caching**: Cache GET requests when possible
6. **Load Balancing**: Distribute traffic evenly
7. **Logging**: Log all requests with correlation IDs
8. **Monitoring**: Track latency, errors, throughput
9. **Versioning**: Support API versioning (/v1, /v2)
10. **Security**: Validate input, prevent injection

## Summary

API Gateway provides:
- **Single Entry Point**: Simplify client integration
- **Security**: Centralized authentication/authorization
- **Performance**: Caching, load balancing
- **Resilience**: Circuit breakers, retries
- **Monitoring**: Centralized logging and tracing

Essential for microservices architecture.
