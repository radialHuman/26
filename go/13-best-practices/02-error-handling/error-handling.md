# Error Handling Best Practices in Go

## Error Wrapping and Context

### Proper Error Wrapping
```go
package errors

import (
    "fmt"
)

// Good: Wrap errors with context using %w
func (s *UserService) GetUser(id string) (*User, error) {
    user, err := s.repo.FindByID(id)
    if err != nil {
        return nil, fmt.Errorf("user service: get user %s: %w", id, err)
    }
    return user, nil
}

// Repository layer
func (r *UserRepository) FindByID(id string) (*User, error) {
    var user User
    err := r.db.QueryRow("SELECT * FROM users WHERE id = $1", id).Scan(&user)
    if err != nil {
        return nil, fmt.Errorf("repository: find user by id: %w", err)
    }
    return &user, nil
}

// Error chain provides full context:
// "user service: get user 123: repository: find user by id: sql: no rows in result set"
```

### Custom Error Types

```go
package errors

import (
    "errors"
    "fmt"
)

// Define sentinel errors for known error conditions
var (
    ErrNotFound      = errors.New("resource not found")
    ErrUnauthorized  = errors.New("unauthorized access")
    ErrInvalidInput  = errors.New("invalid input")
    ErrAlreadyExists = errors.New("resource already exists")
)

// Custom error type for structured errors
type ValidationError struct {
    Field   string
    Message string
}

func (e *ValidationError) Error() string {
    return fmt.Sprintf("validation error: %s - %s", e.Field, e.Message)
}

// Usage
func ValidateUser(user *User) error {
    if user.Email == "" {
        return &ValidationError{
            Field:   "email",
            Message: "email is required",
        }
    }
    return nil
}
```

### Error Checking with errors.Is and errors.As

```go
package service

import (
    "errors"
    "fmt"
)

func HandleUserError(err error) {
    // Check if error is a specific sentinel error
    if errors.Is(err, ErrNotFound) {
        // Handle not found case
        log.Info("user not found")
        return
    }
    
    // Extract custom error type
    var validationErr *ValidationError
    if errors.As(err, &validationErr) {
        log.Warnf("validation failed: field=%s, message=%s",
            validationErr.Field,
            validationErr.Message,
        )
        return
    }
    
    // Unknown error
    log.Errorf("unexpected error: %v", err)
}
```

## Error Handling Patterns

### Early Returns
```go
// Good: Return early to reduce nesting
func ProcessUser(user *User) error {
    if user == nil {
        return ErrInvalidInput
    }
    
    if err := validateUser(user); err != nil {
        return fmt.Errorf("validation failed: %w", err)
    }
    
    if err := saveUser(user); err != nil {
        return fmt.Errorf("save failed: %w", err)
    }
    
    return nil
}

// Avoid: Deep nesting
func ProcessUserBad(user *User) error {
    if user != nil {
        if err := validateUser(user); err == nil {
            if err := saveUser(user); err == nil {
                return nil
            } else {
                return err
            }
        } else {
            return err
        }
    } else {
        return ErrInvalidInput
    }
}
```

### Error Aggregation

```go
package errors

import (
    "fmt"
    "strings"
)

type MultiError struct {
    Errors []error
}

func (m *MultiError) Error() string {
    var messages []string
    for _, err := range m.Errors {
        messages = append(messages, err.Error())
    }
    return fmt.Sprintf("multiple errors: %s", strings.Join(messages, "; "))
}

func (m *MultiError) Add(err error) {
    if err != nil {
        m.Errors = append(m.Errors, err)
    }
}

func (m *MultiError) HasErrors() bool {
    return len(m.Errors) > 0
}

// Usage
func ValidateAllFields(user *User) error {
    var errs MultiError
    
    if user.Email == "" {
        errs.Add(fmt.Errorf("email is required"))
    }
    
    if user.Username == "" {
        errs.Add(fmt.Errorf("username is required"))
    }
    
    if errs.HasErrors() {
        return &errs
    }
    
    return nil
}
```

### HTTP Error Handling

```go
package http

import (
    "encoding/json"
    "errors"
    "net/http"
)

type ErrorResponse struct {
    Error   string `json:"error"`
    Code    string `json:"code,omitempty"`
    Details map[string]interface{} `json:"details,omitempty"`
}

func HandleError(w http.ResponseWriter, err error) {
    var statusCode int
    var errorCode string
    
    switch {
    case errors.Is(err, ErrNotFound):
        statusCode = http.StatusNotFound
        errorCode = "NOT_FOUND"
    case errors.Is(err, ErrUnauthorized):
        statusCode = http.StatusUnauthorized
        errorCode = "UNAUTHORIZED"
    case errors.Is(err, ErrInvalidInput):
        statusCode = http.StatusBadRequest
        errorCode = "INVALID_INPUT"
    case errors.Is(err, ErrAlreadyExists):
        statusCode = http.StatusConflict
        errorCode = "ALREADY_EXISTS"
    default:
        statusCode = http.StatusInternalServerError
        errorCode = "INTERNAL_ERROR"
    }
    
    response := ErrorResponse{
        Error: err.Error(),
        Code:  errorCode,
    }
    
    w.Header().Set("Content-Type", "application/json")
    w.WriteHeader(statusCode)
    json.NewEncoder(w).Encode(response)
}
```

## Panic and Recover

```go
// Use panic only for unrecoverable errors
func MustConnectDB(dsn string) *sql.DB {
    db, err := sql.Open("postgres", dsn)
    if err != nil {
        panic(fmt.Sprintf("failed to connect to database: %v", err))
    }
    return db
}

// Recover from panics in HTTP handlers
func RecoverMiddleware(next http.Handler) http.Handler {
    return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
        defer func() {
            if err := recover(); err != nil {
                log.Errorf("panic recovered: %v", err)
                http.Error(w, "Internal Server Error", http.StatusInternalServerError)
            }
        }()
        next.ServeHTTP(w, r)
    })
}
```

## Best Practices Summary

### DO:
- Always handle errors explicitly
- Wrap errors with context using `%w`
- Use `errors.Is` and `errors.As` for error checking
- Define sentinel errors for known conditions
- Create custom error types for structured errors
- Return early to reduce nesting
- Log errors at appropriate levels
- Provide clear error messages

### DON'T:
- Ignore errors with `_`
- Use panic for normal error conditions
- Return error strings without wrapping
- Lose error context
- Use error codes instead of error types
- Create generic error messages
- Log and return errors (pick one)
- Swallow errors silently

## Error Logging

```go
package logging

import (
    "fmt"
    "log/slog"
)

func LogError(logger *slog.Logger, operation string, err error) {
    logger.Error("operation failed",
        "operation", operation,
        "error", err,
        "type", fmt.Sprintf("%T", err),
    )
}

// With structured context
func (s *UserService) CreateUser(ctx context.Context, user *User) error {
    if err := s.repo.Save(ctx, user); err != nil {
        s.logger.ErrorContext(ctx, "failed to create user",
            "user_id", user.ID,
            "error", err,
        )
        return fmt.Errorf("create user: %w", err)
    }
    return nil
}
```

## Summary

Effective error handling:
- **Provides context**: Error chains explain what happened
- **Enables recovery**: Different error types allow different handling
- **Aids debugging**: Clear error messages speed up troubleshooting
- **Improves UX**: Meaningful errors help users understand issues
- **Maintains robustness**: Proper handling prevents crashes

Go's error handling is verbose but explicit, making error paths clear and forcing developers to consider failure cases.
