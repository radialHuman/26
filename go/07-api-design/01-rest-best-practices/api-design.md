# API Design Best Practices

## What is Good API Design?

A well-designed API is:
- **Consistent**: Predictable patterns
- **Intuitive**: Easy to understand
- **Documented**: Clear documentation
- **Versioned**: Backward compatible
- **Performant**: Fast and efficient
- **Secure**: Protected from threats

## RESTful API Principles

### 1. Resource-Based URLs

✅ **Good**: Nouns representing resources
```
GET    /users              # List users
GET    /users/123          # Get user 123
POST   /users              # Create user
PUT    /users/123          # Update user 123
DELETE /users/123          # Delete user 123

GET    /users/123/posts    # Get posts by user 123
POST   /users/123/posts    # Create post for user 123
```

❌ **Bad**: Verbs in URLs
```
GET    /getUsers
POST   /createUser
POST   /deleteUser/123
```

### 2. HTTP Methods (Verbs)

| Method | Purpose | Idempotent | Safe |
|--------|---------|------------|------|
| GET | Retrieve resource | Yes | Yes |
| POST | Create resource | No | No |
| PUT | Update/Replace resource | Yes | No |
| PATCH | Partial update | No | No |
| DELETE | Delete resource | Yes | No |

```go
func setupRoutes(r *gin.Engine) {
    users := r.Group("/api/v1/users")
    {
        users.GET("", listUsers)           // List
        users.GET("/:id", getUser)         // Read
        users.POST("", createUser)         // Create
        users.PUT("/:id", updateUser)      // Update (full)
        users.PATCH("/:id", patchUser)     // Update (partial)
        users.DELETE("/:id", deleteUser)   // Delete
    }
}
```

### 3. HTTP Status Codes

#### Success (2xx)
```go
// 200 OK - Successful GET, PUT, PATCH
c.JSON(http.StatusOK, user)

// 201 Created - Successful POST
c.JSON(http.StatusCreated, user)

// 204 No Content - Successful DELETE
c.Status(http.StatusNoContent)
```

#### Client Errors (4xx)
```go
// 400 Bad Request - Invalid input
c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid email format"})

// 401 Unauthorized - Authentication required
c.JSON(http.StatusUnauthorized, gin.H{"error": "Authentication required"})

// 403 Forbidden - Insufficient permissions
c.JSON(http.StatusForbidden, gin.H{"error": "Access denied"})

// 404 Not Found - Resource not found
c.JSON(http.StatusNotFound, gin.H{"error": "User not found"})

// 409 Conflict - Conflict with existing resource
c.JSON(http.StatusConflict, gin.H{"error": "Email already exists"})

// 422 Unprocessable Entity - Validation error
c.JSON(http.StatusUnprocessableEntity, gin.H{
    "error": "Validation failed",
    "details": validationErrors,
})

// 429 Too Many Requests - Rate limit exceeded
c.JSON(http.StatusTooManyRequests, gin.H{"error": "Rate limit exceeded"})
```

#### Server Errors (5xx)
```go
// 500 Internal Server Error
c.JSON(http.StatusInternalServerError, gin.H{"error": "Internal server error"})

// 503 Service Unavailable
c.JSON(http.StatusServiceUnavailable, gin.H{"error": "Service temporarily unavailable"})
```

## Request/Response Design

### Request Structure

```go
// Query Parameters - Filtering, sorting, pagination
GET /users?status=active&sort=created_at&limit=20&offset=0

func listUsers(c *gin.Context) {
    status := c.DefaultQuery("status", "all")
    sort := c.DefaultQuery("sort", "id")
    limit := c.DefaultQuery("limit", "20")
    offset := c.DefaultQuery("offset", "0")
    
    // Use parameters
}

// Path Parameters - Resource identification
GET /users/123/posts/456

func getPost(c *gin.Context) {
    userID := c.Param("userId")
    postID := c.Param("postId")
}

// Request Body - Creating/updating resources
POST /users
{
    "name": "John Doe",
    "email": "john@example.com"
}

func createUser(c *gin.Context) {
    var req CreateUserRequest
    if err := c.ShouldBindJSON(&req); err != nil {
        c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
        return
    }
}
```

### Response Structure

#### Success Response
```go
type Response struct {
    Success bool        `json:"success"`
    Data    interface{} `json:"data,omitempty"`
    Meta    *Meta       `json:"meta,omitempty"`
}

type Meta struct {
    Page       int `json:"page"`
    PerPage    int `json:"per_page"`
    Total      int `json:"total"`
    TotalPages int `json:"total_pages"`
}

// Single resource
{
    "success": true,
    "data": {
        "id": 123,
        "name": "John Doe",
        "email": "john@example.com"
    }
}

// List with pagination
{
    "success": true,
    "data": [
        {"id": 1, "name": "User 1"},
        {"id": 2, "name": "User 2"}
    ],
    "meta": {
        "page": 1,
        "per_page": 20,
        "total": 100,
        "total_pages": 5
    }
}
```

#### Error Response
```go
type ErrorResponse struct {
    Success bool          `json:"success"`
    Error   ErrorDetail   `json:"error"`
}

type ErrorDetail struct {
    Code    string                 `json:"code"`
    Message string                 `json:"message"`
    Details map[string]interface{} `json:"details,omitempty"`
}

{
    "success": false,
    "error": {
        "code": "VALIDATION_ERROR",
        "message": "Validation failed",
        "details": {
            "email": "Invalid email format",
            "age": "Must be at least 18"
        }
    }
}
```

## Pagination

### Offset-Based Pagination

```go
type PaginationParams struct {
    Page    int `form:"page" binding:"min=1"`
    PerPage int `form:"per_page" binding:"min=1,max=100"`
}

func listUsers(c *gin.Context) {
    var params PaginationParams
    params.Page = 1
    params.PerPage = 20
    
    if err := c.ShouldBindQuery(&params); err != nil {
        c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
        return
    }
    
    offset := (params.Page - 1) * params.PerPage
    
    var users []User
    var total int64
    
    db.Model(&User{}).Count(&total)
    db.Limit(params.PerPage).Offset(offset).Find(&users)
    
    c.JSON(http.StatusOK, Response{
        Success: true,
        Data:    users,
        Meta: &Meta{
            Page:       params.Page,
            PerPage:    params.PerPage,
            Total:      int(total),
            TotalPages: int((total + int64(params.PerPage) - 1) / int64(params.PerPage)),
        },
    })
}

// Usage
GET /users?page=2&per_page=20
```

### Cursor-Based Pagination

```go
type CursorParams struct {
    Cursor string `form:"cursor"`
    Limit  int    `form:"limit" binding:"min=1,max=100"`
}

func listUsersCursor(c *gin.Context) {
    var params CursorParams
    params.Limit = 20
    
    c.ShouldBindQuery(&params)
    
    var users []User
    query := db.Order("id ASC").Limit(params.Limit + 1)
    
    if params.Cursor != "" {
        // Decode cursor (base64 encoded ID)
        cursorID, _ := decodeCursor(params.Cursor)
        query = query.Where("id > ?", cursorID)
    }
    
    query.Find(&users)
    
    var nextCursor string
    if len(users) > params.Limit {
        // Has more data
        users = users[:params.Limit]
        nextCursor = encodeCursor(users[len(users)-1].ID)
    }
    
    c.JSON(http.StatusOK, gin.H{
        "data":   users,
        "cursor": nextCursor,
    })
}

func encodeCursor(id int) string {
    return base64.StdEncoding.EncodeToString([]byte(fmt.Sprintf("%d", id)))
}

func decodeCursor(cursor string) (int, error) {
    decoded, _ := base64.StdEncoding.DecodeString(cursor)
    return strconv.Atoi(string(decoded))
}

// Usage
GET /users?limit=20
GET /users?cursor=MjA=&limit=20
```

## Filtering and Sorting

```go
type UserFilters struct {
    Status    string `form:"status"`
    Role      string `form:"role"`
    CreatedAt string `form:"created_at"`
    Sort      string `form:"sort"`
    Order     string `form:"order"`
}

func listUsersWithFilters(c *gin.Context) {
    var filters UserFilters
    c.ShouldBindQuery(&filters)
    
    query := db.Model(&User{})
    
    // Filtering
    if filters.Status != "" {
        query = query.Where("status = ?", filters.Status)
    }
    if filters.Role != "" {
        query = query.Where("role = ?", filters.Role)
    }
    if filters.CreatedAt != "" {
        query = query.Where("created_at >= ?", filters.CreatedAt)
    }
    
    // Sorting
    sortField := "id"
    if filters.Sort != "" {
        // Whitelist allowed sort fields
        allowedFields := map[string]bool{
            "id": true, "name": true, "created_at": true,
        }
        if allowedFields[filters.Sort] {
            sortField = filters.Sort
        }
    }
    
    order := "ASC"
    if filters.Order == "desc" {
        order = "DESC"
    }
    
    query = query.Order(sortField + " " + order)
    
    var users []User
    query.Find(&users)
    
    c.JSON(http.StatusOK, users)
}

// Usage
GET /users?status=active&role=admin&sort=created_at&order=desc
```

## Versioning

### URL Versioning (Recommended)

```go
func setupRoutes(r *gin.Engine) {
    // Version 1
    v1 := r.Group("/api/v1")
    {
        v1.GET("/users", getUsersV1)
        v1.POST("/users", createUserV1)
    }
    
    // Version 2
    v2 := r.Group("/api/v2")
    {
        v2.GET("/users", getUsersV2)
        v2.POST("/users", createUserV2)
    }
}

// Usage
GET /api/v1/users
GET /api/v2/users
```

### Header Versioning

```go
func versionMiddleware() gin.HandlerFunc {
    return func(c *gin.Context) {
        version := c.GetHeader("API-Version")
        if version == "" {
            version = "v1" // Default
        }
        c.Set("api_version", version)
        c.Next()
    }
}

// Usage
GET /api/users
Headers: API-Version: v2
```

## Validation

```go
type CreateUserRequest struct {
    Name     string `json:"name" binding:"required,min=2,max=100"`
    Email    string `json:"email" binding:"required,email"`
    Age      int    `json:"age" binding:"required,min=18,max=120"`
    Password string `json:"password" binding:"required,min=8"`
}

func createUser(c *gin.Context) {
    var req CreateUserRequest
    
    if err := c.ShouldBindJSON(&req); err != nil {
        // Parse validation errors
        errors := make(map[string]string)
        
        for _, err := range err.(validator.ValidationErrors) {
            field := err.Field()
            switch err.Tag() {
            case "required":
                errors[field] = "This field is required"
            case "email":
                errors[field] = "Invalid email format"
            case "min":
                errors[field] = fmt.Sprintf("Minimum length is %s", err.Param())
            case "max":
                errors[field] = fmt.Sprintf("Maximum length is %s", err.Param())
            }
        }
        
        c.JSON(http.StatusUnprocessableEntity, ErrorResponse{
            Success: false,
            Error: ErrorDetail{
                Code:    "VALIDATION_ERROR",
                Message: "Validation failed",
                Details: errors,
            },
        })
        return
    }
    
    // Create user...
    c.JSON(http.StatusCreated, user)
}
```

## Error Handling

```go
// Custom error types
type APIError struct {
    Code       string                 `json:"code"`
    Message    string                 `json:"message"`
    StatusCode int                    `json:"-"`
    Details    map[string]interface{} `json:"details,omitempty"`
}

func (e *APIError) Error() string {
    return e.Message
}

// Predefined errors
var (
    ErrNotFound = &APIError{
        Code:       "NOT_FOUND",
        Message:    "Resource not found",
        StatusCode: http.StatusNotFound,
    }
    
    ErrUnauthorized = &APIError{
        Code:       "UNAUTHORIZED",
        Message:    "Authentication required",
        StatusCode: http.StatusUnauthorized,
    }
    
    ErrValidation = &APIError{
        Code:       "VALIDATION_ERROR",
        Message:    "Validation failed",
        StatusCode: http.StatusUnprocessableEntity,
    }
)

// Error middleware
func ErrorHandler() gin.HandlerFunc {
    return func(c *gin.Context) {
        c.Next()
        
        if len(c.Errors) > 0 {
            err := c.Errors.Last().Err
            
            if apiErr, ok := err.(*APIError); ok {
                c.JSON(apiErr.StatusCode, ErrorResponse{
                    Success: false,
                    Error:   *apiErr,
                })
                return
            }
            
            // Unknown error
            c.JSON(http.StatusInternalServerError, ErrorResponse{
                Success: false,
                Error: ErrorDetail{
                    Code:    "INTERNAL_ERROR",
                    Message: "Internal server error",
                },
            })
        }
    }
}

// Usage in handlers
func getUser(c *gin.Context) {
    id := c.Param("id")
    
    var user User
    if err := db.First(&user, id).Error; err != nil {
        c.Error(ErrNotFound)
        return
    }
    
    c.JSON(http.StatusOK, user)
}
```

## Rate Limiting

```go
import "golang.org/x/time/rate"

type RateLimiter struct {
    limiters map[string]*rate.Limiter
    mu       sync.Mutex
}

func NewRateLimiter() *RateLimiter {
    return &RateLimiter{
        limiters: make(map[string]*rate.Limiter),
    }
}

func (rl *RateLimiter) GetLimiter(key string) *rate.Limiter {
    rl.mu.Lock()
    defer rl.mu.Unlock()
    
    limiter, exists := rl.limiters[key]
    if !exists {
        limiter = rate.NewLimiter(rate.Limit(100), 200) // 100 req/sec, burst 200
        rl.limiters[key] = limiter
    }
    
    return limiter
}

func RateLimitMiddleware(rl *RateLimiter) gin.HandlerFunc {
    return func(c *gin.Context) {
        // Use IP address as key
        key := c.ClientIP()
        
        limiter := rl.GetLimiter(key)
        if !limiter.Allow() {
            c.JSON(http.StatusTooManyRequests, gin.H{
                "error": "Rate limit exceeded",
                "retry_after": "60s",
            })
            c.Abort()
            return
        }
        
        c.Next()
    }
}
```

## CORS

```go
import "github.com/gin-contrib/cors"

func setupCORS(r *gin.Engine) {
    config := cors.Config{
        AllowOrigins:     []string{"https://example.com"},
        AllowMethods:     []string{"GET", "POST", "PUT", "PATCH", "DELETE"},
        AllowHeaders:     []string{"Origin", "Content-Type", "Authorization"},
        ExposeHeaders:    []string{"Content-Length"},
        AllowCredentials: true,
        MaxAge:           12 * time.Hour,
    }
    
    r.Use(cors.New(config))
}
```

## Documentation

### OpenAPI/Swagger

```go
// @title User API
// @version 1.0
// @description API for managing users
// @host localhost:8080
// @BasePath /api/v1

// @Summary List users
// @Description Get list of all users
// @Tags users
// @Accept json
// @Produce json
// @Param page query int false "Page number"
// @Param per_page query int false "Items per page"
// @Success 200 {object} Response
// @Failure 400 {object} ErrorResponse
// @Router /users [get]
func listUsers(c *gin.Context) {
    // Implementation
}
```

## Complete Example

```go
package main

import (
    "github.com/gin-gonic/gin"
    "gorm.io/gorm"
)

type User struct {
    ID    int    `json:"id"`
    Name  string `json:"name"`
    Email string `json:"email"`
}

type UserAPI struct {
    db *gorm.DB
}

func (api *UserAPI) List(c *gin.Context) {
    var params PaginationParams
    if err := c.ShouldBindQuery(&params); err != nil {
        c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
        return
    }
    
    var users []User
    var total int64
    
    api.db.Model(&User{}).Count(&total)
    api.db.Limit(params.PerPage).Offset((params.Page-1)*params.PerPage).Find(&users)
    
    c.JSON(http.StatusOK, Response{
        Success: true,
        Data:    users,
        Meta:    buildMeta(params.Page, params.PerPage, int(total)),
    })
}

func (api *UserAPI) Get(c *gin.Context) {
    var user User
    if err := api.db.First(&user, c.Param("id")).Error; err != nil {
        c.JSON(http.StatusNotFound, gin.H{"error": "User not found"})
        return
    }
    
    c.JSON(http.StatusOK, Response{Success: true, Data: user})
}

func (api *UserAPI) Create(c *gin.Context) {
    var req CreateUserRequest
    if err := c.ShouldBindJSON(&req); err != nil {
        c.JSON(http.StatusUnprocessableEntity, gin.H{"error": err.Error()})
        return
    }
    
    user := User{Name: req.Name, Email: req.Email}
    if err := api.db.Create(&user).Error; err != nil {
        c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to create user"})
        return
    }
    
    c.JSON(http.StatusCreated, Response{Success: true, Data: user})
}

func main() {
    r := gin.Default()
    
    api := &UserAPI{db: db}
    
    v1 := r.Group("/api/v1")
    {
        users := v1.Group("/users")
        {
            users.GET("", api.List)
            users.GET("/:id", api.Get)
            users.POST("", api.Create)
            users.PUT("/:id", api.Update)
            users.DELETE("/:id", api.Delete)
        }
    }
    
    r.Run(":8080")
}
```

## Summary

Good API design includes:
- **RESTful principles**: Resource-based URLs
- **Proper HTTP methods**: GET, POST, PUT, DELETE
- **Status codes**: Meaningful responses
- **Pagination**: Handle large datasets
- **Filtering/Sorting**: Flexible queries
- **Versioning**: Backward compatibility
- **Validation**: Input validation
- **Error handling**: Consistent errors
- **Documentation**: Clear API docs

Follow these patterns for maintainable, scalable APIs.
