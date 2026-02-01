# Advanced HTTP Routing and Validation

## Chi Router Advanced Features

### Router with Middleware Groups
```go
package routing

import (
    "net/http"
    
    "github.com/go-chi/chi/v5"
    "github.com/go-chi/chi/v5/middleware"
)

func NewRouter() *chi.Mux {
    r := chi.NewRouter()
    
    // Global middleware
    r.Use(middleware.Logger)
    r.Use(middleware.Recoverer)
    r.Use(middleware.RequestID)
    
    // Public routes
    r.Group(func(r chi.Router) {
        r.Post("/register", handleRegister)
        r.Post("/login", handleLogin)
    })
    
    // Protected routes
    r.Group(func(r chi.Router) {
        r.Use(AuthMiddleware)
        
        r.Route("/users", func(r chi.Router) {
            r.Get("/", listUsers)
            r.Post("/", createUser)
            
            r.Route("/{userID}", func(r chi.Router) {
                r.Use(UserCtx)
                r.Get("/", getUser)
                r.Put("/", updateUser)
                r.Delete("/", deleteUser)
            })
        })
    })
    
    return r
}
```

## Request Validation with go-playground/validator

```go
package validation

import (
    "github.com/go-playground/validator/v10"
)

type CreateUserRequest struct {
    Email    string `json:"email" validate:"required,email"`
    Username string `json:"username" validate:"required,min=3,max=50,alphanum"`
    Password string `json:"password" validate:"required,min=8,containsany=!@#$%"`
    Age      int    `json:"age" validate:"required,gte=18,lte=120"`
    Role     string `json:"role" validate:"required,oneof=admin user guest"`
}

var validate *validator.Validate

func init() {
    validate = validator.New()
    
    // Custom validation
    validate.RegisterValidation("strong_password", validateStrongPassword)
}

func validateStrongPassword(fl validator.FieldLevel) bool {
    password := fl.Field().String()
    // Custom logic for strong password
    return len(password) >= 8
}

func ValidateStruct(s interface{}) error {
    return validate.Struct(s)
}
```

### Validation Middleware
```go
func ValidationMiddleware(next http.Handler) http.Handler {
    return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
        var req CreateUserRequest
        if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
            http.Error(w, err.Error(), http.StatusBadRequest)
            return
        }
        
        if err := ValidateStruct(req); err != nil {
            http.Error(w, err.Error(), http.StatusUnprocessableEntity)
            return
        }
        
        // Store validated request in context
        ctx := context.WithValue(r.Context(), "request", req)
        next.ServeHTTP(w, r.WithContext(ctx))
    })
}
```

## Response Handling

### JSON Response Helper
```go
package response

import (
    "encoding/json"
    "net/http"
)

type Response struct {
    Success bool        `json:"success"`
    Data    interface{} `json:"data,omitempty"`
    Error   string      `json:"error,omitempty"`
}

func JSON(w http.ResponseWriter, code int, data interface{}) {
    w.Header().Set("Content-Type", "application/json")
    w.WriteHeader(code)
    json.NewEncoder(w).Encode(Response{
        Success: code < 400,
        Data:    data,
    })
}

func Error(w http.ResponseWriter, code int, message string) {
    w.Header().Set("Content-Type", "application/json")
    w.WriteHeader(code)
    json.NewEncoder(w).Encode(Response{
        Success: false,
        Error:   message,
    })
}
```

## Summary
Advanced routing with Chi includes middleware groups, request validation with go-playground/validator, and standardized response handling for consistent APIs.
