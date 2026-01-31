# Testing in Go

## What is Testing?

Go has built-in testing support through the `testing` package. Tests are written alongside your code and run with the `go test` command.

## Why Test in Go?

- **Built-in Support**: No external frameworks needed
- **Fast Execution**: Compiled tests run quickly
- **Simple Syntax**: Easy to write and understand
- **Table-Driven**: Natural pattern for testing multiple cases
- **Benchmarking**: Performance testing built-in
- **Code Coverage**: Track which code is tested

## Basic Unit Tests

### File Naming Convention

Test files must end with `_test.go`:
- `math.go` → `math_test.go`
- `user.go` → `user_test.go`

### Simple Test

```go
// math.go
package math

func Add(a, b int) int {
    return a + b
}

func Subtract(a, b int) int {
    return a - b
}
```

```go
// math_test.go
package math

import "testing"

func TestAdd(t *testing.T) {
    result := Add(2, 3)
    expected := 5
    
    if result != expected {
        t.Errorf("Add(2, 3) = %d; want %d", result, expected)
    }
}

func TestSubtract(t *testing.T) {
    result := Subtract(5, 3)
    expected := 2
    
    if result != expected {
        t.Errorf("Subtract(5, 3) = %d; want %d", result, expected)
    }
}
```

Run tests:
```bash
go test
go test -v  # Verbose output
go test ./...  # Test all packages
```

## Table-Driven Tests

Best practice for testing multiple cases.

```go
package math

import "testing"

func TestAdd(t *testing.T) {
    tests := []struct {
        name     string
        a        int
        b        int
        expected int
    }{
        {"positive numbers", 2, 3, 5},
        {"negative numbers", -2, -3, -5},
        {"mixed signs", -2, 3, 1},
        {"zeros", 0, 0, 0},
        {"with zero", 5, 0, 5},
    }
    
    for _, tt := range tests {
        t.Run(tt.name, func(t *testing.T) {
            result := Add(tt.a, tt.b)
            if result != tt.expected {
                t.Errorf("Add(%d, %d) = %d; want %d", 
                    tt.a, tt.b, result, tt.expected)
            }
        })
    }
}
```

### Complex Table-Driven Test

```go
package validation

import "testing"

func TestValidateEmail(t *testing.T) {
    tests := []struct {
        name    string
        email   string
        valid   bool
        errMsg  string
    }{
        {
            name:  "valid email",
            email: "user@example.com",
            valid: true,
        },
        {
            name:   "missing @",
            email:  "userexample.com",
            valid:  false,
            errMsg: "missing @ symbol",
        },
        {
            name:   "missing domain",
            email:  "user@",
            valid:  false,
            errMsg: "invalid domain",
        },
        {
            name:   "empty email",
            email:  "",
            valid:  false,
            errMsg: "email cannot be empty",
        },
    }
    
    for _, tt := range tests {
        t.Run(tt.name, func(t *testing.T) {
            err := ValidateEmail(tt.email)
            
            if tt.valid && err != nil {
                t.Errorf("expected valid email, got error: %v", err)
            }
            
            if !tt.valid {
                if err == nil {
                    t.Error("expected error, got nil")
                } else if err.Error() != tt.errMsg {
                    t.Errorf("error message = %q; want %q", err.Error(), tt.errMsg)
                }
            }
        })
    }
}
```

## Testing Methods

### Testing Assertions

```go
func TestUser(t *testing.T) {
    user := User{Name: "John", Age: 30}
    
    // Simple assertion
    if user.Name != "John" {
        t.Errorf("Name = %s; want John", user.Name)
    }
    
    // Fatal stops test immediately
    if user.Age < 0 {
        t.Fatalf("Age cannot be negative: %d", user.Age)
    }
    
    // Log for debugging (doesn't fail test)
    t.Logf("User: %+v", user)
}
```

### Helper Functions

```go
package user

import "testing"

// Mark as helper (better error reporting)
func assertEqual(t *testing.T, got, want interface{}) {
    t.Helper()
    if got != want {
        t.Errorf("got %v; want %v", got, want)
    }
}

func TestUserAge(t *testing.T) {
    user := User{Age: 30}
    assertEqual(t, user.Age, 30)  // Error reported at this line
}
```

## Testing with Setup/Teardown

### Setup and Cleanup

```go
package database

import (
    "testing"
)

func setupTestDB(t *testing.T) *DB {
    t.Helper()
    
    db := NewDB(":memory:")
    if err := db.Migrate(); err != nil {
        t.Fatalf("failed to migrate: %v", err)
    }
    
    // Cleanup after test
    t.Cleanup(func() {
        db.Close()
    })
    
    return db
}

func TestCreateUser(t *testing.T) {
    db := setupTestDB(t)
    
    user := &User{Name: "John"}
    err := db.CreateUser(user)
    
    if err != nil {
        t.Fatalf("CreateUser failed: %v", err)
    }
    
    if user.ID == 0 {
        t.Error("expected user ID to be set")
    }
}
```

### TestMain for Package Setup

```go
package database

import (
    "os"
    "testing"
)

func TestMain(m *testing.M) {
    // Setup before all tests
    setup()
    
    // Run tests
    code := m.Run()
    
    // Cleanup after all tests
    teardown()
    
    os.Exit(code)
}

func setup() {
    // Initialize database, load fixtures, etc.
}

func teardown() {
    // Cleanup resources
}
```

## Testing HTTP Handlers

### Using httptest

```go
package api

import (
    "net/http"
    "net/http/httptest"
    "testing"
)

func TestHealthHandler(t *testing.T) {
    req := httptest.NewRequest("GET", "/health", nil)
    w := httptest.NewRecorder()
    
    HealthHandler(w, req)
    
    resp := w.Result()
    
    if resp.StatusCode != http.StatusOK {
        t.Errorf("status = %d; want %d", resp.StatusCode, http.StatusOK)
    }
    
    body := w.Body.String()
    expected := `{"status":"ok"}`
    if body != expected {
        t.Errorf("body = %s; want %s", body, expected)
    }
}
```

### Testing JSON API

```go
package api

import (
    "bytes"
    "encoding/json"
    "net/http"
    "net/http/httptest"
    "testing"
)

func TestCreateUser(t *testing.T) {
    // Prepare request body
    user := User{Name: "John", Email: "john@example.com"}
    body, _ := json.Marshal(user)
    
    req := httptest.NewRequest("POST", "/users", bytes.NewReader(body))
    req.Header.Set("Content-Type", "application/json")
    
    w := httptest.NewRecorder()
    
    CreateUserHandler(w, req)
    
    resp := w.Result()
    
    if resp.StatusCode != http.StatusCreated {
        t.Errorf("status = %d; want %d", resp.StatusCode, http.StatusCreated)
    }
    
    var created User
    if err := json.NewDecoder(resp.Body).Decode(&created); err != nil {
        t.Fatalf("failed to decode response: %v", err)
    }
    
    if created.Name != user.Name {
        t.Errorf("name = %s; want %s", created.Name, user.Name)
    }
}
```

### Testing Middleware

```go
package middleware

import (
    "net/http"
    "net/http/httptest"
    "testing"
)

func TestLoggingMiddleware(t *testing.T) {
    // Create a test handler
    nextHandler := http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
        w.WriteHeader(http.StatusOK)
        w.Write([]byte("OK"))
    })
    
    // Wrap with middleware
    handler := LoggingMiddleware(nextHandler)
    
    req := httptest.NewRequest("GET", "/test", nil)
    w := httptest.NewRecorder()
    
    handler.ServeHTTP(w, req)
    
    if w.Code != http.StatusOK {
        t.Errorf("status = %d; want %d", w.Code, http.StatusOK)
    }
}
```

## Mocking

### Interface-based Mocking

```go
// user.go
package user

type Repository interface {
    GetByID(id int) (*User, error)
    Create(user *User) error
}

type Service struct {
    repo Repository
}

func (s *Service) GetUser(id int) (*User, error) {
    return s.repo.GetByID(id)
}
```

```go
// user_test.go
package user

import (
    "errors"
    "testing"
)

// Mock implementation
type mockRepository struct {
    users map[int]*User
    err   error
}

func (m *mockRepository) GetByID(id int) (*User, error) {
    if m.err != nil {
        return nil, m.err
    }
    if user, ok := m.users[id]; ok {
        return user, nil
    }
    return nil, errors.New("user not found")
}

func (m *mockRepository) Create(user *User) error {
    if m.err != nil {
        return m.err
    }
    m.users[user.ID] = user
    return nil
}

func TestGetUser(t *testing.T) {
    mock := &mockRepository{
        users: map[int]*User{
            1: {ID: 1, Name: "John"},
        },
    }
    
    service := &Service{repo: mock}
    
    user, err := service.GetUser(1)
    if err != nil {
        t.Fatalf("unexpected error: %v", err)
    }
    
    if user.Name != "John" {
        t.Errorf("name = %s; want John", user.Name)
    }
}

func TestGetUser_NotFound(t *testing.T) {
    mock := &mockRepository{
        users: map[int]*User{},
    }
    
    service := &Service{repo: mock}
    
    _, err := service.GetUser(999)
    if err == nil {
        t.Error("expected error, got nil")
    }
}
```

## Benchmarks

### Writing Benchmarks

```go
package math

import "testing"

func BenchmarkAdd(b *testing.B) {
    for i := 0; i < b.N; i++ {
        Add(2, 3)
    }
}

func BenchmarkSubtract(b *testing.B) {
    for i := 0; i < b.N; i++ {
        Subtract(5, 3)
    }
}
```

Run benchmarks:
```bash
go test -bench=.
go test -bench=. -benchmem  # Include memory stats
go test -bench=Add  # Run specific benchmark
```

### Table-Driven Benchmarks

```go
package strings

import "testing"

func BenchmarkConcat(b *testing.B) {
    tests := []struct {
        name string
        strs []string
    }{
        {"small", []string{"a", "b", "c"}},
        {"medium", []string{"hello", "world", "from", "golang"}},
        {"large", make([]string, 100)},
    }
    
    for _, tt := range tests {
        b.Run(tt.name, func(b *testing.B) {
            for i := 0; i < b.N; i++ {
                Concat(tt.strs...)
            }
        })
    }
}
```

### Benchmark with Setup

```go
func BenchmarkMapLookup(b *testing.B) {
    // Setup (not timed)
    m := make(map[string]int)
    for i := 0; i < 10000; i++ {
        m[fmt.Sprintf("key%d", i)] = i
    }
    
    // Reset timer
    b.ResetTimer()
    
    // Benchmark
    for i := 0; i < b.N; i++ {
        _ = m["key5000"]
    }
}
```

## Code Coverage

### Running Coverage

```bash
# Generate coverage
go test -cover

# Detailed coverage report
go test -coverprofile=coverage.out
go tool cover -html=coverage.out

# Coverage by function
go tool cover -func=coverage.out
```

### Coverage Example

```go
// calc.go
package calc

func Divide(a, b float64) (float64, error) {
    if b == 0 {
        return 0, errors.New("division by zero")
    }
    return a / b, nil
}
```

```go
// calc_test.go
package calc

import "testing"

func TestDivide(t *testing.T) {
    // This test covers both branches
    result, err := Divide(10, 2)
    if err != nil {
        t.Fatalf("unexpected error: %v", err)
    }
    if result != 5 {
        t.Errorf("result = %f; want 5", result)
    }
    
    // Test error case
    _, err = Divide(10, 0)
    if err == nil {
        t.Error("expected error for division by zero")
    }
}
```

## Examples (Documentation Tests)

```go
package math

import "fmt"

func ExampleAdd() {
    result := Add(2, 3)
    fmt.Println(result)
    // Output: 5
}

func ExampleAdd_negative() {
    result := Add(-2, -3)
    fmt.Println(result)
    // Output: -5
}

func ExampleDivide() {
    result, err := Divide(10, 2)
    if err != nil {
        fmt.Println("Error:", err)
        return
    }
    fmt.Println(result)
    // Output: 5
}
```

## Test Helpers

### Custom Assertions

```go
package testutil

import (
    "reflect"
    "testing"
)

func AssertEqual(t *testing.T, got, want interface{}) {
    t.Helper()
    if !reflect.DeepEqual(got, want) {
        t.Errorf("\ngot:  %+v\nwant: %+v", got, want)
    }
}

func AssertError(t *testing.T, err error, wantErr bool) {
    t.Helper()
    if (err != nil) != wantErr {
        t.Errorf("error = %v; wantErr = %v", err, wantErr)
    }
}

func AssertNoError(t *testing.T, err error) {
    t.Helper()
    if err != nil {
        t.Fatalf("unexpected error: %v", err)
    }
}
```

## Integration Tests

### Build Tags

```go
// +build integration

package database

import "testing"

func TestDatabaseIntegration(t *testing.T) {
    if testing.Short() {
        t.Skip("skipping integration test")
    }
    
    // Test real database
    db := connectToRealDB()
    defer db.Close()
    
    // Integration test code
}
```

Run integration tests:
```bash
go test -tags=integration
go test -short  # Skip slow tests
```

## Best Practices

### 1. Test File Organization

```
mypackage/
├── user.go
├── user_test.go       # Unit tests
├── integration_test.go # Integration tests
└── testdata/          # Test fixtures
    ├── input.json
    └── expected.json
```

### 2. Clear Test Names

```go
func TestUserService_Create_ValidUser_Success(t *testing.T) {
    // Clear what's being tested
}

func TestUserService_Create_DuplicateEmail_ReturnsError(t *testing.T) {
    // Clear expected behavior
}
```

### 3. Use Table-Driven Tests

```go
func TestValidation(t *testing.T) {
    tests := []struct {
        name    string
        input   string
        wantErr bool
    }{
        // Multiple test cases
    }
    
    for _, tt := range tests {
        t.Run(tt.name, func(t *testing.T) {
            // Test code
        })
    }
}
```

### 4. Test Error Cases

```go
func TestDivide(t *testing.T) {
    // Test success case
    result, err := Divide(10, 2)
    // assertions...
    
    // Test error case
    _, err = Divide(10, 0)
    if err == nil {
        t.Error("expected error")
    }
}
```

### 5. Use Parallel Tests

```go
func TestParallel(t *testing.T) {
    tests := []struct{
        // test cases
    }
    
    for _, tt := range tests {
        tt := tt  // Capture range variable
        t.Run(tt.name, func(t *testing.T) {
            t.Parallel()  // Run in parallel
            // Test code
        })
    }
}
```

## Summary

Go testing provides:
- **Built-in Framework**: No external dependencies
- **Table-Driven Tests**: Clean multiple case testing
- **Benchmarking**: Performance measurement
- **Coverage**: Track tested code
- **HTTP Testing**: httptest package
- **Mocking**: Interface-based mocking

Essential for building reliable, maintainable Go applications.
