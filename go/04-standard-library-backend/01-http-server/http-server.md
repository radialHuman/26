# HTTP Server Development in Go

## What is HTTP Server Development?

HTTP server development in Go involves creating web servers that handle HTTP requests and responses using the `net/http` package. Go's standard library provides robust tools for building production-ready web services without external dependencies.

## Why is HTTP Important for Backend?

- **Web APIs**: Foundation of REST and GraphQL services
- **Microservices**: Service-to-service communication
- **Client Communication**: Browsers, mobile apps, IoT devices
- **Standard Protocol**: Universal, well-understood
- **Scalability**: Go's concurrency excels at handling many concurrent connections

## Basic HTTP Server

### Simple Server

```go
package main

import (
    "fmt"
    "log"
    "net/http"
)

func main() {
    // Handler function
    http.HandleFunc("/", func(w http.ResponseWriter, r *http.Request) {
        fmt.Fprintf(w, "Hello, World!")
    })
    
    http.HandleFunc("/api/users", func(w http.ResponseWriter, r *http.Request) {
        fmt.Fprintf(w, "Users endpoint")
    })
    
    // Start server
    log.Println("Server starting on :8080")
    if err := http.ListenAndServe(":8080", nil); err != nil {
        log.Fatal(err)
    }
}
```

### HTTP Handler Interface

```go
package main

import (
    "fmt"
    "net/http"
)

// Handler interface (from net/http)
// type Handler interface {
//     ServeHTTP(ResponseWriter, *Request)
// }

// Custom handler type
type HelloHandler struct {
    Message string
}

func (h *HelloHandler) ServeHTTP(w http.ResponseWriter, r *http.Request) {
    fmt.Fprintf(w, h.Message)
}

func main() {
    handler := &HelloHandler{Message: "Hello from custom handler!"}
    
    http.Handle("/hello", handler)
    http.ListenAndServe(":8080", nil)
}
```

### Custom ServeMux

```go
package main

import (
    "fmt"
    "log"
    "net/http"
)

func main() {
    // Create custom mux instead of using default
    mux := http.NewServeMux()
    
    mux.HandleFunc("/", homeHandler)
    mux.HandleFunc("/api/users", usersHandler)
    mux.HandleFunc("/api/products", productsHandler)
    
    server := &http.Server{
        Addr:    ":8080",
        Handler: mux,
    }
    
    log.Println("Server starting on :8080")
    log.Fatal(server.ListenAndServe())
}

func homeHandler(w http.ResponseWriter, r *http.Request) {
    fmt.Fprintf(w, "Home Page")
}

func usersHandler(w http.ResponseWriter, r *http.Request) {
    fmt.Fprintf(w, "Users API")
}

func productsHandler(w http.ResponseWriter, r *http.Request) {
    fmt.Fprintf(w, "Products API")
}
```

## HTTP Request Handling

### Request Methods

```go
package main

import (
    "fmt"
    "net/http"
)

func handler(w http.ResponseWriter, r *http.Request) {
    switch r.Method {
    case http.MethodGet:
        handleGet(w, r)
    case http.MethodPost:
        handlePost(w, r)
    case http.MethodPut:
        handlePut(w, r)
    case http.MethodDelete:
        handleDelete(w, r)
    default:
        http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
    }
}

func handleGet(w http.ResponseWriter, r *http.Request) {
    fmt.Fprintf(w, "GET request")
}

func handlePost(w http.ResponseWriter, r *http.Request) {
    fmt.Fprintf(w, "POST request")
}

func handlePut(w http.ResponseWriter, r *http.Request) {
    fmt.Fprintf(w, "PUT request")
}

func handleDelete(w http.ResponseWriter, r *http.Request) {
    fmt.Fprintf(w, "DELETE request")
}
```

### Reading Request Data

```go
package main

import (
    "encoding/json"
    "fmt"
    "io"
    "log"
    "net/http"
)

type User struct {
    Name  string `json:"name"`
    Email string `json:"email"`
}

func main() {
    http.HandleFunc("/query", queryHandler)
    http.HandleFunc("/form", formHandler)
    http.HandleFunc("/json", jsonHandler)
    http.HandleFunc("/headers", headersHandler)
    
    log.Fatal(http.ListenAndServe(":8080", nil))
}

// Query parameters: /query?name=Alice&age=25
func queryHandler(w http.ResponseWriter, r *http.Request) {
    name := r.URL.Query().Get("name")
    age := r.URL.Query().Get("age")
    
    fmt.Fprintf(w, "Name: %s, Age: %s", name, age)
}

// Form data
func formHandler(w http.ResponseWriter, r *http.Request) {
    if r.Method != http.MethodPost {
        http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
        return
    }
    
    if err := r.ParseForm(); err != nil {
        http.Error(w, "Failed to parse form", http.StatusBadRequest)
        return
    }
    
    name := r.FormValue("name")
    email := r.FormValue("email")
    
    fmt.Fprintf(w, "Name: %s, Email: %s", name, email)
}

// JSON body
func jsonHandler(w http.ResponseWriter, r *http.Request) {
    if r.Method != http.MethodPost {
        http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
        return
    }
    
    var user User
    
    // Read body
    body, err := io.ReadAll(r.Body)
    if err != nil {
        http.Error(w, "Failed to read body", http.StatusBadRequest)
        return
    }
    defer r.Body.Close()
    
    // Parse JSON
    if err := json.Unmarshal(body, &user); err != nil {
        http.Error(w, "Invalid JSON", http.StatusBadRequest)
        return
    }
    
    // Or use decoder directly
    // if err := json.NewDecoder(r.Body).Decode(&user); err != nil {
    //     http.Error(w, "Invalid JSON", http.StatusBadRequest)
    //     return
    // }
    
    w.Header().Set("Content-Type", "application/json")
    json.NewEncoder(w).Encode(map[string]interface{}{
        "message": "User received",
        "user":    user,
    })
}

// Headers
func headersHandler(w http.ResponseWriter, r *http.Request) {
    userAgent := r.Header.Get("User-Agent")
    contentType := r.Header.Get("Content-Type")
    authorization := r.Header.Get("Authorization")
    
    fmt.Fprintf(w, "User-Agent: %s\nContent-Type: %s\nAuth: %s", 
        userAgent, contentType, authorization)
}
```

### Path Parameters (Manual Parsing)

```go
package main

import (
    "fmt"
    "net/http"
    "strings"
)

func userHandler(w http.ResponseWriter, r *http.Request) {
    // URL: /users/123
    path := strings.TrimPrefix(r.URL.Path, "/users/")
    userID := path
    
    if userID == "" {
        http.Error(w, "User ID required", http.StatusBadRequest)
        return
    }
    
    fmt.Fprintf(w, "User ID: %s", userID)
}

func main() {
    http.HandleFunc("/users/", userHandler)
    http.ListenAndServe(":8080", nil)
}
```

## HTTP Response Handling

### Setting Response Headers and Status

```go
package main

import (
    "encoding/json"
    "net/http"
)

type Response struct {
    Status  string      `json:"status"`
    Data    interface{} `json:"data,omitempty"`
    Message string      `json:"message,omitempty"`
}

func respondJSON(w http.ResponseWriter, status int, data interface{}) {
    w.Header().Set("Content-Type", "application/json")
    w.WriteHeader(status)
    json.NewEncoder(w).Encode(data)
}

func respondError(w http.ResponseWriter, status int, message string) {
    respondJSON(w, status, Response{
        Status:  "error",
        Message: message,
    })
}

func handler(w http.ResponseWriter, r *http.Request) {
    // Success response
    respondJSON(w, http.StatusOK, Response{
        Status: "success",
        Data: map[string]string{
            "name": "Alice",
            "role": "admin",
        },
    })
}

func errorHandler(w http.ResponseWriter, r *http.Request) {
    // Error response
    respondError(w, http.StatusNotFound, "Resource not found")
}
```

### Setting Cookies

```go
package main

import (
    "net/http"
    "time"
)

func setCookieHandler(w http.ResponseWriter, r *http.Request) {
    cookie := &http.Cookie{
        Name:     "session_id",
        Value:    "abc123",
        Path:     "/",
        MaxAge:   3600,  // 1 hour
        HttpOnly: true,
        Secure:   true,
        SameSite: http.SameSiteStrictMode,
    }
    
    http.SetCookie(w, cookie)
    w.Write([]byte("Cookie set!"))
}

func getCookieHandler(w http.ResponseWriter, r *http.Request) {
    cookie, err := r.Cookie("session_id")
    if err != nil {
        http.Error(w, "Cookie not found", http.StatusBadRequest)
        return
    }
    
    w.Write([]byte("Cookie value: " + cookie.Value))
}

func deleteCookieHandler(w http.ResponseWriter, r *http.Request) {
    cookie := &http.Cookie{
        Name:   "session_id",
        Value:  "",
        Path:   "/",
        MaxAge: -1,  // Delete cookie
    }
    
    http.SetCookie(w, cookie)
    w.Write([]byte("Cookie deleted!"))
}
```

## Middleware

### Basic Middleware Pattern

```go
package main

import (
    "log"
    "net/http"
    "time"
)

// Middleware type
type Middleware func(http.Handler) http.Handler

// Logging middleware
func loggingMiddleware(next http.Handler) http.Handler {
    return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
        start := time.Now()
        
        // Call next handler
        next.ServeHTTP(w, r)
        
        log.Printf("%s %s %v", r.Method, r.URL.Path, time.Since(start))
    })
}

// Authentication middleware
func authMiddleware(next http.Handler) http.Handler {
    return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
        token := r.Header.Get("Authorization")
        
        if token == "" {
            http.Error(w, "Unauthorized", http.StatusUnauthorized)
            return
        }
        
        // Validate token...
        if token != "Bearer valid-token" {
            http.Error(w, "Invalid token", http.StatusUnauthorized)
            return
        }
        
        next.ServeHTTP(w, r)
    })
}

// Recovery middleware
func recoveryMiddleware(next http.Handler) http.Handler {
    return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
        defer func() {
            if err := recover(); err != nil {
                log.Printf("Panic recovered: %v", err)
                http.Error(w, "Internal Server Error", http.StatusInternalServerError)
            }
        }()
        
        next.ServeHTTP(w, r)
    })
}

// CORS middleware
func corsMiddleware(next http.Handler) http.Handler {
    return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
        w.Header().Set("Access-Control-Allow-Origin", "*")
        w.Header().Set("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS")
        w.Header().Set("Access-Control-Allow-Headers", "Content-Type, Authorization")
        
        if r.Method == http.MethodOptions {
            w.WriteHeader(http.StatusOK)
            return
        }
        
        next.ServeHTTP(w, r)
    })
}

// Chain multiple middlewares
func chain(h http.Handler, middlewares ...Middleware) http.Handler {
    for i := len(middlewares) - 1; i >= 0; i-- {
        h = middlewares[i](h)
    }
    return h
}

func main() {
    handler := http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
        w.Write([]byte("Hello, World!"))
    })
    
    // Apply middlewares
    wrapped := chain(handler,
        recoveryMiddleware,
        loggingMiddleware,
        corsMiddleware,
        authMiddleware,
    )
    
    http.Handle("/", wrapped)
    http.ListenAndServe(":8080", nil)
}
```

## Complete REST API Example

```go
package main

import (
    "encoding/json"
    "fmt"
    "log"
    "net/http"
    "strconv"
    "strings"
    "sync"
)

type User struct {
    ID    int    `json:"id"`
    Name  string `json:"name"`
    Email string `json:"email"`
}

type UserStore struct {
    users  map[int]User
    nextID int
    mu     sync.RWMutex
}

func NewUserStore() *UserStore {
    return &UserStore{
        users:  make(map[int]User),
        nextID: 1,
    }
}

func (s *UserStore) Create(user User) User {
    s.mu.Lock()
    defer s.mu.Unlock()
    
    user.ID = s.nextID
    s.users[user.ID] = user
    s.nextID++
    
    return user
}

func (s *UserStore) GetAll() []User {
    s.mu.RLock()
    defer s.mu.RUnlock()
    
    users := make([]User, 0, len(s.users))
    for _, user := range s.users {
        users = append(users, user)
    }
    
    return users
}

func (s *UserStore) GetByID(id int) (User, bool) {
    s.mu.RLock()
    defer s.mu.RUnlock()
    
    user, exists := s.users[id]
    return user, exists
}

func (s *UserStore) Update(id int, user User) bool {
    s.mu.Lock()
    defer s.mu.Unlock()
    
    if _, exists := s.users[id]; !exists {
        return false
    }
    
    user.ID = id
    s.users[id] = user
    return true
}

func (s *UserStore) Delete(id int) bool {
    s.mu.Lock()
    defer s.mu.Unlock()
    
    if _, exists := s.users[id]; !exists {
        return false
    }
    
    delete(s.users, id)
    return true
}

type UserHandler struct {
    store *UserStore
}

func NewUserHandler(store *UserStore) *UserHandler {
    return &UserHandler{store: store}
}

func (h *UserHandler) ServeHTTP(w http.ResponseWriter, r *http.Request) {
    path := strings.TrimPrefix(r.URL.Path, "/api/users")
    
    if path == "" || path == "/" {
        switch r.Method {
        case http.MethodGet:
            h.listUsers(w, r)
        case http.MethodPost:
            h.createUser(w, r)
        default:
            http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
        }
        return
    }
    
    // Extract ID from path: /api/users/123
    idStr := strings.TrimPrefix(path, "/")
    id, err := strconv.Atoi(idStr)
    if err != nil {
        http.Error(w, "Invalid user ID", http.StatusBadRequest)
        return
    }
    
    switch r.Method {
    case http.MethodGet:
        h.getUser(w, r, id)
    case http.MethodPut:
        h.updateUser(w, r, id)
    case http.MethodDelete:
        h.deleteUser(w, r, id)
    default:
        http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
    }
}

func (h *UserHandler) listUsers(w http.ResponseWriter, r *http.Request) {
    users := h.store.GetAll()
    respondJSON(w, http.StatusOK, users)
}

func (h *UserHandler) createUser(w http.ResponseWriter, r *http.Request) {
    var user User
    if err := json.NewDecoder(r.Body).Decode(&user); err != nil {
        http.Error(w, "Invalid request body", http.StatusBadRequest)
        return
    }
    
    if user.Name == "" || user.Email == "" {
        http.Error(w, "Name and email are required", http.StatusBadRequest)
        return
    }
    
    created := h.store.Create(user)
    respondJSON(w, http.StatusCreated, created)
}

func (h *UserHandler) getUser(w http.ResponseWriter, r *http.Request, id int) {
    user, exists := h.store.GetByID(id)
    if !exists {
        http.Error(w, "User not found", http.StatusNotFound)
        return
    }
    
    respondJSON(w, http.StatusOK, user)
}

func (h *UserHandler) updateUser(w http.ResponseWriter, r *http.Request, id int) {
    var user User
    if err := json.NewDecoder(r.Body).Decode(&user); err != nil {
        http.Error(w, "Invalid request body", http.StatusBadRequest)
        return
    }
    
    if !h.store.Update(id, user) {
        http.Error(w, "User not found", http.StatusNotFound)
        return
    }
    
    user.ID = id
    respondJSON(w, http.StatusOK, user)
}

func (h *UserHandler) deleteUser(w http.ResponseWriter, r *http.Request, id int) {
    if !h.store.Delete(id) {
        http.Error(w, "User not found", http.StatusNotFound)
        return
    }
    
    w.WriteHeader(http.StatusNoContent)
}

func respondJSON(w http.ResponseWriter, status int, data interface{}) {
    w.Header().Set("Content-Type", "application/json")
    w.WriteHeader(status)
    json.NewEncoder(w).Encode(data)
}

func main() {
    store := NewUserStore()
    userHandler := NewUserHandler(store)
    
    mux := http.NewServeMux()
    mux.Handle("/api/users", userHandler)
    mux.Handle("/api/users/", userHandler)
    
    // Add middleware
    handler := loggingMiddleware(mux)
    handler = recoveryMiddleware(handler)
    
    server := &http.Server{
        Addr:    ":8080",
        Handler: handler,
    }
    
    log.Println("Server starting on :8080")
    log.Fatal(server.ListenAndServe())
}
```

## Server Configuration

### Timeouts and Limits

```go
package main

import (
    "log"
    "net/http"
    "time"
)

func main() {
    mux := http.NewServeMux()
    mux.HandleFunc("/", handler)
    
    server := &http.Server{
        Addr:    ":8080",
        Handler: mux,
        
        // Timeouts
        ReadTimeout:       10 * time.Second,
        ReadHeaderTimeout: 5 * time.Second,
        WriteTimeout:      10 * time.Second,
        IdleTimeout:       120 * time.Second,
        
        // Maximum header size
        MaxHeaderBytes: 1 << 20,  // 1 MB
    }
    
    log.Printf("Server starting on %s", server.Addr)
    log.Fatal(server.ListenAndServe())
}

func handler(w http.ResponseWriter, r *http.Request) {
    w.Write([]byte("Hello, World!"))
}
```

### Graceful Shutdown

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
    mux := http.NewServeMux()
    mux.HandleFunc("/", func(w http.ResponseWriter, r *http.Request) {
        time.Sleep(5 * time.Second)  // Simulate slow request
        w.Write([]byte("Done!"))
    })
    
    server := &http.Server{
        Addr:    ":8080",
        Handler: mux,
    }
    
    // Start server in goroutine
    go func() {
        log.Println("Server starting on :8080")
        if err := server.ListenAndServe(); err != nil && err != http.ErrServerClosed {
            log.Fatalf("Server failed: %v", err)
        }
    }()
    
    // Wait for interrupt signal
    quit := make(chan os.Signal, 1)
    signal.Notify(quit, syscall.SIGINT, syscall.SIGTERM)
    <-quit
    
    log.Println("Shutting down server...")
    
    // Graceful shutdown with timeout
    ctx, cancel := context.WithTimeout(context.Background(), 30*time.Second)
    defer cancel()
    
    if err := server.Shutdown(ctx); err != nil {
        log.Fatalf("Server forced to shutdown: %v", err)
    }
    
    log.Println("Server exited")
}
```

## HTTPS/TLS

```go
package main

import (
    "log"
    "net/http"
)

func main() {
    mux := http.NewServeMux()
    mux.HandleFunc("/", func(w http.ResponseWriter, r *http.Request) {
        w.Write([]byte("Secure Hello!"))
    })
    
    // HTTPS server
    log.Println("HTTPS server starting on :443")
    log.Fatal(http.ListenAndServeTLS(":443", "cert.pem", "key.pem", mux))
}
```

## Best Practices

1. **Use Custom ServeMux** instead of default
2. **Set Timeouts** to prevent resource exhaustion
3. **Implement Graceful Shutdown** for zero-downtime deployments
4. **Use Middleware** for cross-cutting concerns
5. **Validate Input** always
6. **Return Proper HTTP Status Codes**
7. **Use Context** for request cancellation
8. **Log Errors** comprehensively
9. **Handle Panics** with recovery middleware
10. **Use HTTPS** in production

## Summary

Go's `net/http` package provides:
- Built-in HTTP server capabilities
- Flexible handler interface
- Middleware support
- TLS/HTTPS support
- Production-ready features

Perfect for building scalable backend APIs and microservices.
