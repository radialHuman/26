# Gin Web Framework

## What is Gin?

Gin is a high-performance HTTP web framework for Go. It provides a martini-like API with much better performance.

## Installation

```bash
go get -u github.com/gin-gonic/gin
```

## Basic Server

```go
package main

import (
    "github.com/gin-gonic/gin"
)

func main() {
    // Create router with default middleware (logger, recovery)
    r := gin.Default()
    
    // Define route
    r.GET("/", func(c *gin.Context) {
        c.JSON(200, gin.H{
            "message": "Hello, Gin!",
        })
    })
    
    // Start server
    r.Run(":8080")
}
```

## Routing

### HTTP Methods

```go
package main

import (
    "github.com/gin-gonic/gin"
    "net/http"
)

func main() {
    r := gin.Default()
    
    r.GET("/users", getUsers)
    r.POST("/users", createUser)
    r.PUT("/users/:id", updateUser)
    r.DELETE("/users/:id", deleteUser)
    r.PATCH("/users/:id", patchUser)
    
    r.Run(":8080")
}

func getUsers(c *gin.Context) {
    c.JSON(http.StatusOK, gin.H{"users": []string{"Alice", "Bob"}})
}

func createUser(c *gin.Context) {
    c.JSON(http.StatusCreated, gin.H{"message": "User created"})
}

func updateUser(c *gin.Context) {
    id := c.Param("id")
    c.JSON(http.StatusOK, gin.H{"message": "User " + id + " updated"})
}

func deleteUser(c *gin.Context) {
    id := c.Param("id")
    c.JSON(http.StatusOK, gin.H{"message": "User " + id + " deleted"})
}

func patchUser(c *gin.Context) {
    id := c.Param("id")
    c.JSON(http.StatusOK, gin.H{"message": "User " + id + " patched"})
}
```

### Path Parameters

```go
package main

import (
    "github.com/gin-gonic/gin"
    "net/http"
)

func main() {
    r := gin.Default()
    
    // Single parameter
    r.GET("/users/:id", func(c *gin.Context) {
        id := c.Param("id")
        c.JSON(http.StatusOK, gin.H{"user_id": id})
    })
    
    // Multiple parameters
    r.GET("/users/:id/posts/:postId", func(c *gin.Context) {
        userID := c.Param("id")
        postID := c.Param("postId")
        c.JSON(http.StatusOK, gin.H{
            "user_id": userID,
            "post_id": postID,
        })
    })
    
    // Wildcard
    r.GET("/files/*filepath", func(c *gin.Context) {
        filepath := c.Param("filepath")
        c.JSON(http.StatusOK, gin.H{"filepath": filepath})
    })
    
    r.Run(":8080")
}
```

### Query Parameters

```go
package main

import (
    "github.com/gin-gonic/gin"
    "net/http"
)

func main() {
    r := gin.Default()
    
    // GET /search?q=golang&page=1
    r.GET("/search", func(c *gin.Context) {
        query := c.Query("q")              // Get query param
        page := c.DefaultQuery("page", "1") // With default value
        
        c.JSON(http.StatusOK, gin.H{
            "query": query,
            "page":  page,
        })
    })
    
    // Get all query params
    r.GET("/filter", func(c *gin.Context) {
        filters := c.QueryMap("filter")
        c.JSON(http.StatusOK, filters)
    })
    
    r.Run(":8080")
}
```

## Request Binding

### JSON Binding

```go
package main

import (
    "github.com/gin-gonic/gin"
    "net/http"
)

type CreateUserRequest struct {
    Name  string `json:"name" binding:"required"`
    Email string `json:"email" binding:"required,email"`
    Age   int    `json:"age" binding:"required,gte=0,lte=150"`
}

func main() {
    r := gin.Default()
    
    r.POST("/users", func(c *gin.Context) {
        var req CreateUserRequest
        
        if err := c.ShouldBindJSON(&req); err != nil {
            c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
            return
        }
        
        c.JSON(http.StatusCreated, gin.H{
            "name":  req.Name,
            "email": req.Email,
            "age":   req.Age,
        })
    })
    
    r.Run(":8080")
}
```

### Form Binding

```go
package main

import (
    "github.com/gin-gonic/gin"
    "net/http"
)

type LoginForm struct {
    Username string `form:"username" binding:"required"`
    Password string `form:"password" binding:"required"`
}

func main() {
    r := gin.Default()
    
    r.POST("/login", func(c *gin.Context) {
        var form LoginForm
        
        if err := c.ShouldBind(&form); err != nil {
            c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
            return
        }
        
        c.JSON(http.StatusOK, gin.H{
            "username": form.Username,
            "status":   "logged in",
        })
    })
    
    r.Run(":8080")
}
```

### URI Binding

```go
package main

import (
    "github.com/gin-gonic/gin"
    "net/http"
)

type UserURI struct {
    ID int `uri:"id" binding:"required,min=1"`
}

func main() {
    r := gin.Default()
    
    r.GET("/users/:id", func(c *gin.Context) {
        var uri UserURI
        
        if err := c.ShouldBindUri(&uri); err != nil {
            c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
            return
        }
        
        c.JSON(http.StatusOK, gin.H{"user_id": uri.ID})
    })
    
    r.Run(":8080")
}
```

## Middleware

### Built-in Middleware

```go
package main

import (
    "github.com/gin-gonic/gin"
    "net/http"
)

func main() {
    r := gin.New()
    
    // Logger middleware
    r.Use(gin.Logger())
    
    // Recovery middleware (recover from panics)
    r.Use(gin.Recovery())
    
    r.GET("/", func(c *gin.Context) {
        c.JSON(http.StatusOK, gin.H{"message": "Hello"})
    })
    
    r.Run(":8080")
}
```

### Custom Middleware

```go
package main

import (
    "github.com/gin-gonic/gin"
    "log"
    "time"
)

func Logger() gin.HandlerFunc {
    return func(c *gin.Context) {
        start := time.Now()
        path := c.Request.URL.Path
        
        // Process request
        c.Next()
        
        // Log after request
        latency := time.Since(start)
        status := c.Writer.Status()
        
        log.Printf("%s %s %d %v", c.Request.Method, path, status, latency)
    }
}

func main() {
    r := gin.New()
    r.Use(Logger())
    
    r.GET("/", func(c *gin.Context) {
        c.JSON(200, gin.H{"message": "Hello"})
    })
    
    r.Run(":8080")
}
```

### Authentication Middleware

```go
package main

import (
    "github.com/gin-gonic/gin"
    "net/http"
    "strings"
)

func AuthRequired() gin.HandlerFunc {
    return func(c *gin.Context) {
        token := c.GetHeader("Authorization")
        
        if token == "" {
            c.JSON(http.StatusUnauthorized, gin.H{"error": "No authorization header"})
            c.Abort()
            return
        }
        
        // Remove "Bearer " prefix
        token = strings.TrimPrefix(token, "Bearer ")
        
        // Validate token (simplified)
        if token != "valid-token" {
            c.JSON(http.StatusUnauthorized, gin.H{"error": "Invalid token"})
            c.Abort()
            return
        }
        
        // Set user in context
        c.Set("user_id", 123)
        c.Next()
    }
}

func main() {
    r := gin.Default()
    
    // Public route
    r.GET("/public", func(c *gin.Context) {
        c.JSON(http.StatusOK, gin.H{"message": "Public endpoint"})
    })
    
    // Protected routes
    protected := r.Group("/api")
    protected.Use(AuthRequired())
    {
        protected.GET("/profile", func(c *gin.Context) {
            userID := c.GetInt("user_id")
            c.JSON(http.StatusOK, gin.H{"user_id": userID})
        })
    }
    
    r.Run(":8080")
}
```

## Route Groups

```go
package main

import (
    "github.com/gin-gonic/gin"
    "net/http"
)

func main() {
    r := gin.Default()
    
    // API v1
    v1 := r.Group("/api/v1")
    {
        v1.GET("/users", func(c *gin.Context) {
            c.JSON(http.StatusOK, gin.H{"version": "v1", "users": []string{}})
        })
        
        v1.POST("/users", func(c *gin.Context) {
            c.JSON(http.StatusCreated, gin.H{"version": "v1"})
        })
    }
    
    // API v2
    v2 := r.Group("/api/v2")
    {
        v2.GET("/users", func(c *gin.Context) {
            c.JSON(http.StatusOK, gin.H{"version": "v2", "users": []string{}})
        })
    }
    
    r.Run(":8080")
}
```

## Complete REST API Example

```go
package main

import (
    "github.com/gin-gonic/gin"
    "net/http"
    "strconv"
    "sync"
)

type User struct {
    ID    int    `json:"id"`
    Name  string `json:"name" binding:"required"`
    Email string `json:"email" binding:"required,email"`
}

type UserStore struct {
    mu     sync.RWMutex
    users  map[int]*User
    nextID int
}

func NewUserStore() *UserStore {
    return &UserStore{
        users:  make(map[int]*User),
        nextID: 1,
    }
}

func (s *UserStore) Create(user *User) {
    s.mu.Lock()
    defer s.mu.Unlock()
    
    user.ID = s.nextID
    s.users[user.ID] = user
    s.nextID++
}

func (s *UserStore) GetAll() []*User {
    s.mu.RLock()
    defer s.mu.RUnlock()
    
    users := make([]*User, 0, len(s.users))
    for _, user := range s.users {
        users = append(users, user)
    }
    return users
}

func (s *UserStore) GetByID(id int) (*User, bool) {
    s.mu.RLock()
    defer s.mu.RUnlock()
    
    user, ok := s.users[id]
    return user, ok
}

func (s *UserStore) Update(id int, user *User) bool {
    s.mu.Lock()
    defer s.mu.Unlock()
    
    if _, ok := s.users[id]; !ok {
        return false
    }
    
    user.ID = id
    s.users[id] = user
    return true
}

func (s *UserStore) Delete(id int) bool {
    s.mu.Lock()
    defer s.mu.Unlock()
    
    if _, ok := s.users[id]; !ok {
        return false
    }
    
    delete(s.users, id)
    return true
}

func main() {
    store := NewUserStore()
    r := gin.Default()
    
    // List users
    r.GET("/users", func(c *gin.Context) {
        users := store.GetAll()
        c.JSON(http.StatusOK, users)
    })
    
    // Get user
    r.GET("/users/:id", func(c *gin.Context) {
        id, err := strconv.Atoi(c.Param("id"))
        if err != nil {
            c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid ID"})
            return
        }
        
        user, ok := store.GetByID(id)
        if !ok {
            c.JSON(http.StatusNotFound, gin.H{"error": "User not found"})
            return
        }
        
        c.JSON(http.StatusOK, user)
    })
    
    // Create user
    r.POST("/users", func(c *gin.Context) {
        var user User
        
        if err := c.ShouldBindJSON(&user); err != nil {
            c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
            return
        }
        
        store.Create(&user)
        c.JSON(http.StatusCreated, user)
    })
    
    // Update user
    r.PUT("/users/:id", func(c *gin.Context) {
        id, err := strconv.Atoi(c.Param("id"))
        if err != nil {
            c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid ID"})
            return
        }
        
        var user User
        if err := c.ShouldBindJSON(&user); err != nil {
            c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
            return
        }
        
        if !store.Update(id, &user) {
            c.JSON(http.StatusNotFound, gin.H{"error": "User not found"})
            return
        }
        
        c.JSON(http.StatusOK, user)
    })
    
    // Delete user
    r.DELETE("/users/:id", func(c *gin.Context) {
        id, err := strconv.Atoi(c.Param("id"))
        if err != nil {
            c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid ID"})
            return
        }
        
        if !store.Delete(id) {
            c.JSON(http.StatusNotFound, gin.H{"error": "User not found"})
            return
        }
        
        c.JSON(http.StatusOK, gin.H{"message": "User deleted"})
    })
    
    r.Run(":8080")
}
```

## Error Handling

```go
package main

import (
    "github.com/gin-gonic/gin"
    "net/http"
)

func main() {
    r := gin.Default()
    
    r.GET("/error", func(c *gin.Context) {
        // Add error to context
        c.Error(gin.Error{
            Err:  errors.New("something went wrong"),
            Type: gin.ErrorTypePrivate,
        })
        
        c.JSON(http.StatusInternalServerError, gin.H{
            "error": "Internal server error",
        })
    })
    
    r.Run(":8080")
}
```

## File Upload

```go
package main

import (
    "github.com/gin-gonic/gin"
    "net/http"
    "path/filepath"
)

func main() {
    r := gin.Default()
    
    // Single file
    r.POST("/upload", func(c *gin.Context) {
        file, err := c.FormFile("file")
        if err != nil {
            c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
            return
        }
        
        // Save file
        filename := filepath.Base(file.Filename)
        if err := c.SaveUploadedFile(file, "./uploads/"+filename); err != nil {
            c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
            return
        }
        
        c.JSON(http.StatusOK, gin.H{"filename": filename})
    })
    
    // Multiple files
    r.POST("/uploads", func(c *gin.Context) {
        form, err := c.MultipartForm()
        if err != nil {
            c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
            return
        }
        
        files := form.File["files"]
        for _, file := range files {
            c.SaveUploadedFile(file, "./uploads/"+file.Filename)
        }
        
        c.JSON(http.StatusOK, gin.H{"count": len(files)})
    })
    
    r.Run(":8080")
}
```

## Summary

Gin provides:
- **Fast**: High-performance HTTP router
- **Middleware**: Built-in and custom middleware
- **Binding**: Automatic request validation
- **Routing**: Flexible route patterns
- **Groups**: Organize routes
- **JSON**: Easy JSON responses

Perfect for building production-ready REST APIs in Go.
