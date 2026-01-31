# Error Handling in Go

## What is Error Handling?

Error handling in Go is the practice of managing and responding to exceptional conditions and failures in your program. Unlike many languages that use exceptions, Go uses explicit error returns and the built-in `error` interface.

## Why is Error Handling Important?

- **Reliability**: Properly handled errors prevent crashes
- **Debugging**: Clear error messages speed up troubleshooting
- **User Experience**: Graceful error handling improves UX
- **Production Stability**: Prevents cascading failures
- **Monitoring**: Enables error tracking and alerting
- **Compliance**: Required for audit trails and logging

## The error Interface

```go
// Built-in error interface
type error interface {
    Error() string
}
```

Any type with an `Error() string` method satisfies the error interface.

## Basic Error Handling

### Creating Errors

```go
package main

import (
    "errors"
    "fmt"
)

func main() {
    // Method 1: errors.New()
    err1 := errors.New("something went wrong")
    fmt.Println(err1)  // something went wrong
    
    // Method 2: fmt.Errorf() - allows formatting
    name := "database"
    err2 := fmt.Errorf("failed to connect to %s", name)
    fmt.Println(err2)  // failed to connect to database
    
    // Method 3: Custom error type
    err3 := &CustomError{
        Code:    404,
        Message: "resource not found",
    }
    fmt.Println(err3)  // Error 404: resource not found
}

type CustomError struct {
    Code    int
    Message string
}

func (e *CustomError) Error() string {
    return fmt.Sprintf("Error %d: %s", e.Code, e.Message)
}
```

### Checking and Returning Errors

```go
package main

import (
    "errors"
    "fmt"
)

func divide(a, b float64) (float64, error) {
    if b == 0 {
        return 0, errors.New("division by zero")
    }
    return a / b, nil
}

func main() {
    // Check for error
    result, err := divide(10, 2)
    if err != nil {
        fmt.Println("Error:", err)
        return
    }
    fmt.Println("Result:", result)
    
    // Error case
    result, err = divide(10, 0)
    if err != nil {
        fmt.Println("Error:", err)  // Error: division by zero
        return
    }
}
```

## Error Wrapping (Go 1.13+)

Error wrapping adds context while preserving the original error.

```go
package main

import (
    "errors"
    "fmt"
)

var ErrDatabase = errors.New("database error")
var ErrNotFound = errors.New("not found")

func fetchUser(id int) error {
    // Simulate database error
    if id < 0 {
        // Wrap error with %w
        return fmt.Errorf("failed to fetch user %d: %w", id, ErrDatabase)
    }
    
    if id == 0 {
        return fmt.Errorf("user %d: %w", id, ErrNotFound)
    }
    
    return nil
}

func main() {
    err := fetchUser(-1)
    if err != nil {
        fmt.Println(err)
        // Output: failed to fetch user -1: database error
        
        // Check if error is or wraps a specific error
        if errors.Is(err, ErrDatabase) {
            fmt.Println("This is a database error")
        }
    }
}
```

### errors.Is() and errors.As()

```go
package main

import (
    "errors"
    "fmt"
)

var ErrInvalidInput = errors.New("invalid input")

type ValidationError struct {
    Field string
    Value interface{}
}

func (e *ValidationError) Error() string {
    return fmt.Sprintf("validation failed for field %s with value %v", e.Field, e.Value)
}

func validateAge(age int) error {
    if age < 0 {
        return &ValidationError{Field: "age", Value: age}
    }
    if age < 18 {
        return fmt.Errorf("age too low: %w", ErrInvalidInput)
    }
    return nil
}

func main() {
    // errors.Is() - checks error chain
    err1 := validateAge(15)
    if errors.Is(err1, ErrInvalidInput) {
        fmt.Println("Invalid input detected")
    }
    
    // errors.As() - extracts specific error type
    err2 := validateAge(-5)
    var valErr *ValidationError
    if errors.As(err2, &valErr) {
        fmt.Printf("Validation error: field=%s, value=%v\n", 
            valErr.Field, valErr.Value)
    }
}
```

## Custom Error Types

### Example 1: HTTP Error

```go
package api

import (
    "fmt"
    "net/http"
)

type HTTPError struct {
    StatusCode int
    Message    string
    Err        error
}

func (e *HTTPError) Error() string {
    if e.Err != nil {
        return fmt.Sprintf("HTTP %d: %s: %v", e.StatusCode, e.Message, e.Err)
    }
    return fmt.Sprintf("HTTP %d: %s", e.StatusCode, e.Message)
}

func (e *HTTPError) Unwrap() error {
    return e.Err
}

// Helper functions
func NewBadRequestError(message string) *HTTPError {
    return &HTTPError{
        StatusCode: http.StatusBadRequest,
        Message:    message,
    }
}

func NewNotFoundError(resource string) *HTTPError {
    return &HTTPError{
        StatusCode: http.StatusNotFound,
        Message:    fmt.Sprintf("%s not found", resource),
    }
}

func NewInternalError(err error) *HTTPError {
    return &HTTPError{
        StatusCode: http.StatusInternalServerError,
        Message:    "internal server error",
        Err:        err,
    }
}

// Usage in handler
func GetUserHandler(w http.ResponseWriter, r *http.Request) {
    userID := r.URL.Query().Get("id")
    if userID == "" {
        err := NewBadRequestError("user ID is required")
        http.Error(w, err.Error(), err.StatusCode)
        return
    }
    
    user, err := fetchUser(userID)
    if err != nil {
        var httpErr *HTTPError
        if errors.As(err, &httpErr) {
            http.Error(w, httpErr.Error(), httpErr.StatusCode)
        } else {
            http.Error(w, "internal error", http.StatusInternalServerError)
        }
        return
    }
    
    // Success response
    respondJSON(w, user)
}

func fetchUser(id string) (interface{}, error) {
    // Simulate not found
    return nil, NewNotFoundError("user")
}

func respondJSON(w http.ResponseWriter, data interface{}) {
    // JSON response logic
}
```

### Example 2: Database Error

```go
package db

import (
    "database/sql"
    "errors"
    "fmt"
)

type DBError struct {
    Operation string
    Table     string
    Err       error
}

func (e *DBError) Error() string {
    return fmt.Sprintf("database error during %s on table %s: %v", 
        e.Operation, e.Table, e.Err)
}

func (e *DBError) Unwrap() error {
    return e.Err
}

// Check if error is due to no rows
func IsNotFound(err error) bool {
    return errors.Is(err, sql.ErrNoRows)
}

// Check if error is constraint violation
func IsConstraintViolation(err error) bool {
    // PostgreSQL example - would check specific error codes
    var dbErr *DBError
    if errors.As(err, &dbErr) {
        // Check underlying error for constraint violations
        return true  // Simplified
    }
    return false
}

func GetUser(db *sql.DB, id int) (*User, error) {
    user := &User{}
    err := db.QueryRow("SELECT id, name, email FROM users WHERE id = $1", id).
        Scan(&user.ID, &user.Name, &user.Email)
    
    if err != nil {
        if errors.Is(err, sql.ErrNoRows) {
            return nil, fmt.Errorf("user %d: %w", id, ErrNotFound)
        }
        return nil, &DBError{
            Operation: "select",
            Table:     "users",
            Err:       err,
        }
    }
    
    return user, nil
}

type User struct {
    ID    int
    Name  string
    Email string
}

var ErrNotFound = errors.New("not found")
```

### Example 3: Validation Error with Multiple Fields

```go
package validator

import (
    "fmt"
    "strings"
)

type FieldError struct {
    Field   string
    Message string
}

type ValidationErrors []FieldError

func (v ValidationErrors) Error() string {
    var messages []string
    for _, err := range v {
        messages = append(messages, fmt.Sprintf("%s: %s", err.Field, err.Message))
    }
    return strings.Join(messages, "; ")
}

func (v ValidationErrors) HasErrors() bool {
    return len(v) > 0
}

// Add error to validation errors
func (v *ValidationErrors) Add(field, message string) {
    *v = append(*v, FieldError{Field: field, Message: message})
}

type CreateUserRequest struct {
    Username string `json:"username"`
    Email    string `json:"email"`
    Age      int    `json:"age"`
}

func (r *CreateUserRequest) Validate() error {
    var errs ValidationErrors
    
    if r.Username == "" {
        errs.Add("username", "username is required")
    } else if len(r.Username) < 3 {
        errs.Add("username", "username must be at least 3 characters")
    }
    
    if r.Email == "" {
        errs.Add("email", "email is required")
    } else if !strings.Contains(r.Email, "@") {
        errs.Add("email", "invalid email format")
    }
    
    if r.Age < 18 {
        errs.Add("age", "must be at least 18 years old")
    }
    
    if errs.HasErrors() {
        return errs
    }
    
    return nil
}

// Usage
func CreateUserHandler(w http.ResponseWriter, r *http.Request) {
    var req CreateUserRequest
    // Decode JSON...
    
    if err := req.Validate(); err != nil {
        var valErrs ValidationErrors
        if errors.As(err, &valErrs) {
            // Return 400 with all validation errors
            respondError(w, http.StatusBadRequest, err.Error())
            return
        }
    }
    
    // Create user...
}

func respondError(w http.ResponseWriter, code int, message string) {
    // Error response logic
}
```

## Error Handling Patterns

### Pattern 1: Early Return

```go
func processOrder(orderID int) error {
    // Validate
    if orderID <= 0 {
        return errors.New("invalid order ID")
    }
    
    // Fetch order
    order, err := fetchOrder(orderID)
    if err != nil {
        return fmt.Errorf("failed to fetch order: %w", err)
    }
    
    // Check inventory
    if err := checkInventory(order); err != nil {
        return fmt.Errorf("inventory check failed: %w", err)
    }
    
    // Process payment
    if err := processPayment(order); err != nil {
        return fmt.Errorf("payment processing failed: %w", err)
    }
    
    // Ship order
    if err := shipOrder(order); err != nil {
        return fmt.Errorf("shipping failed: %w", err)
    }
    
    return nil
}

func fetchOrder(id int) (*Order, error)   { return nil, nil }
func checkInventory(o *Order) error       { return nil }
func processPayment(o *Order) error       { return nil }
func shipOrder(o *Order) error            { return nil }

type Order struct{}
```

### Pattern 2: Error Aggregation

```go
package aggregator

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
    return strings.Join(messages, "; ")
}

func (m *MultiError) Add(err error) {
    if err != nil {
        m.Errors = append(m.Errors, err)
    }
}

func (m *MultiError) HasErrors() bool {
    return len(m.Errors) > 0
}

// Process multiple items and collect errors
func ProcessBatch(items []string) error {
    var errs MultiError
    
    for _, item := range items {
        if err := processItem(item); err != nil {
            errs.Add(fmt.Errorf("failed to process %s: %w", item, err))
        }
    }
    
    if errs.HasErrors() {
        return &errs
    }
    
    return nil
}

func processItem(item string) error {
    return nil
}
```

### Pattern 3: Sentinel Errors

```go
package repository

import (
    "errors"
)

// Sentinel errors - predefined errors for specific conditions
var (
    ErrNotFound          = errors.New("resource not found")
    ErrAlreadyExists     = errors.New("resource already exists")
    ErrInvalidInput      = errors.New("invalid input")
    ErrUnauthorized      = errors.New("unauthorized")
    ErrForbidden         = errors.New("forbidden")
    ErrInternalError     = errors.New("internal error")
    ErrConnectionFailed  = errors.New("connection failed")
    ErrTimeout           = errors.New("operation timeout")
)

func GetUser(id int) (*User, error) {
    if id <= 0 {
        return nil, ErrInvalidInput
    }
    
    // Database lookup
    user, err := dbLookup(id)
    if err != nil {
        if errors.Is(err, sql.ErrNoRows) {
            return nil, ErrNotFound
        }
        return nil, fmt.Errorf("database error: %w", err)
    }
    
    return user, nil
}

// Caller can check specific errors
func main() {
    user, err := GetUser(123)
    if err != nil {
        switch {
        case errors.Is(err, ErrNotFound):
            // Handle not found
            fmt.Println("User not found")
        case errors.Is(err, ErrInvalidInput):
            // Handle invalid input
            fmt.Println("Invalid user ID")
        default:
            // Handle other errors
            fmt.Println("Error:", err)
        }
        return
    }
    
    fmt.Println("User:", user)
}

func dbLookup(id int) (*User, error) {
    return nil, nil
}
```

### Pattern 4: Panic and Recover (Use Sparingly)

```go
package main

import "fmt"

func safeDivide(a, b float64) (result float64, err error) {
    // Recover from panic
    defer func() {
        if r := recover(); r != nil {
            err = fmt.Errorf("recovered from panic: %v", r)
        }
    }()
    
    if b == 0 {
        panic("division by zero")
    }
    
    return a / b, nil
}

func main() {
    result, err := safeDivide(10, 0)
    if err != nil {
        fmt.Println("Error:", err)
        return
    }
    fmt.Println("Result:", result)
}
```

## Practical Backend Examples

### Example 1: REST API Error Handling

```go
package api

import (
    "encoding/json"
    "log"
    "net/http"
)

type ErrorResponse struct {
    Error   string `json:"error"`
    Message string `json:"message"`
    Code    int    `json:"code"`
}

func HandleError(w http.ResponseWriter, err error) {
    log.Printf("Error: %v", err)
    
    var httpErr *HTTPError
    if errors.As(err, &httpErr) {
        respondJSON(w, httpErr.StatusCode, ErrorResponse{
            Error:   http.StatusText(httpErr.StatusCode),
            Message: httpErr.Message,
            Code:    httpErr.StatusCode,
        })
        return
    }
    
    // Default to internal server error
    respondJSON(w, http.StatusInternalServerError, ErrorResponse{
        Error:   "Internal Server Error",
        Message: "An unexpected error occurred",
        Code:    http.StatusInternalServerError,
    })
}

func respondJSON(w http.ResponseWriter, status int, data interface{}) {
    w.Header().Set("Content-Type", "application/json")
    w.WriteHeader(status)
    json.NewEncoder(w).Encode(data)
}

// Middleware for panic recovery
func RecoveryMiddleware(next http.Handler) http.Handler {
    return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
        defer func() {
            if err := recover(); err != nil {
                log.Printf("Panic recovered: %v", err)
                HandleError(w, fmt.Errorf("internal error: %v", err))
            }
        }()
        next.ServeHTTP(w, r)
    })
}
```

### Example 2: Database Transaction Error Handling

```go
package db

import (
    "database/sql"
    "fmt"
)

func CreateUserWithProfile(db *sql.DB, user *User, profile *Profile) error {
    // Start transaction
    tx, err := db.Begin()
    if err != nil {
        return fmt.Errorf("failed to start transaction: %w", err)
    }
    
    // Ensure rollback on error
    defer func() {
        if err != nil {
            tx.Rollback()
        }
    }()
    
    // Insert user
    err = insertUser(tx, user)
    if err != nil {
        return fmt.Errorf("failed to insert user: %w", err)
    }
    
    // Insert profile
    err = insertProfile(tx, profile)
    if err != nil {
        return fmt.Errorf("failed to insert profile: %w", err)
    }
    
    // Commit transaction
    if err = tx.Commit(); err != nil {
        return fmt.Errorf("failed to commit transaction: %w", err)
    }
    
    return nil
}

func insertUser(tx *sql.Tx, user *User) error {
    _, err := tx.Exec("INSERT INTO users (name, email) VALUES ($1, $2)", 
        user.Name, user.Email)
    return err
}

func insertProfile(tx *sql.Tx, profile *Profile) error {
    _, err := tx.Exec("INSERT INTO profiles (user_id, bio) VALUES ($1, $2)", 
        profile.UserID, profile.Bio)
    return err
}

type Profile struct {
    UserID int
    Bio    string
}
```

### Example 3: Retry with Error Handling

```go
package retry

import (
    "errors"
    "fmt"
    "time"
)

type RetryableError struct {
    Err       error
    Retryable bool
}

func (e *RetryableError) Error() string {
    return e.Err.Error()
}

func (e *RetryableError) Unwrap() error {
    return e.Err
}

func IsRetryable(err error) bool {
    var retryErr *RetryableError
    if errors.As(err, &retryErr) {
        return retryErr.Retryable
    }
    return false
}

func RetryWithBackoff(operation func() error, maxRetries int) error {
    var lastErr error
    
    for attempt := 0; attempt < maxRetries; attempt++ {
        err := operation()
        
        if err == nil {
            return nil  // Success
        }
        
        lastErr = err
        
        // Check if error is retryable
        if !IsRetryable(err) {
            return err  // Don't retry non-retryable errors
        }
        
        // Don't sleep after last attempt
        if attempt < maxRetries-1 {
            backoff := time.Duration(attempt+1) * time.Second
            time.Sleep(backoff)
        }
    }
    
    return fmt.Errorf("max retries exceeded: %w", lastErr)
}

// Usage
func fetchDataFromAPI() error {
    // Simulate temporary failure
    return &RetryableError{
        Err:       errors.New("temporary network error"),
        Retryable: true,
    }
}

func main() {
    err := RetryWithBackoff(fetchDataFromAPI, 3)
    if err != nil {
        fmt.Println("Failed:", err)
    }
}
```

## Best Practices

### 1. Always Check Errors

```go
// WRONG
data, _ := os.ReadFile("config.json")

// CORRECT
data, err := os.ReadFile("config.json")
if err != nil {
    return fmt.Errorf("failed to read config: %w", err)
}
```

### 2. Wrap Errors with Context

```go
// WRONG
if err != nil {
    return err
}

// CORRECT
if err != nil {
    return fmt.Errorf("failed to process user %d: %w", userID, err)
}
```

### 3. Use Sentinel Errors for Known Conditions

```go
var ErrNotFound = errors.New("not found")

// Callers can check specifically
if errors.Is(err, ErrNotFound) {
    // Handle not found case
}
```

### 4. Create Custom Error Types for Rich Context

```go
type ValidationError struct {
    Field string
    Value interface{}
    Rule  string
}

func (e *ValidationError) Error() string {
    return fmt.Sprintf("%s: %v failed %s validation", 
        e.Field, e.Value, e.Rule)
}
```

### 5. Don't Ignore Errors in Defer

```go
// WRONG
defer file.Close()

// CORRECT
defer func() {
    if err := file.Close(); err != nil {
        log.Printf("failed to close file: %v", err)
    }
}()
```

## Common Pitfalls

1. **Swallowing errors**: Using `_` to ignore errors
2. **Not wrapping errors**: Losing context of error origin
3. **Overusing panic**: Panic should be for truly exceptional cases
4. **Not checking error types**: Missing opportunities for specific handling

## Summary

Effective error handling in Go requires:
- Understanding the error interface
- Using error wrapping for context
- Creating custom error types when needed
- Following idiomatic patterns
- Always checking and handling errors explicitly
