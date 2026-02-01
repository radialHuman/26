# Testing Best Practices in Go

## Table-Driven Tests

### Basic Table-Driven Test
```go
package user

import (
    "testing"
)

func TestValidateEmail(t *testing.T) {
    tests := []struct {
        name    string
        email   string
        wantErr bool
    }{
        {
            name:    "valid email",
            email:   "user@example.com",
            wantErr: false,
        },
        {
            name:    "missing @",
            email:   "userexample.com",
            wantErr: true,
        },
        {
            name:    "missing domain",
            email:   "user@",
            wantErr: true,
        },
        {
            name:    "empty email",
            email:   "",
            wantErr: true,
        },
    }
    
    for _, tt := range tests {
        t.Run(tt.name, func(t *testing.T) {
            err := ValidateEmail(tt.email)
            if (err != nil) != tt.wantErr {
                t.Errorf("ValidateEmail() error = %v, wantErr %v", err, tt.wantErr)
            }
        })
    }
}
```

### Using testify for Assertions
```go
package user

import (
    "testing"
    
    "github.com/stretchr/testify/assert"
    "github.com/stretchr/testify/require"
)

func TestCreateUser(t *testing.T) {
    service := NewUserService()
    
    user, err := service.CreateUser("test@example.com", "testuser")
    
    require.NoError(t, err)
    assert.NotNil(t, user)
    assert.Equal(t, "test@example.com", user.Email)
    assert.Equal(t, "testuser", user.Username)
    assert.NotEmpty(t, user.ID)
}
```

## Mocking and Interfaces

### Interface-Based Mocking
```go
package user

// Define interface for dependencies
type UserRepository interface {
    Save(ctx context.Context, user *User) error
    FindByID(ctx context.Context, id string) (*User, error)
}

// Mock implementation
type MockUserRepository struct {
    SaveFunc    func(ctx context.Context, user *User) error
    FindByIDFunc func(ctx context.Context, id string) (*User, error)
}

func (m *MockUserRepository) Save(ctx context.Context, user *User) error {
    if m.SaveFunc != nil {
        return m.SaveFunc(ctx, user)
    }
    return nil
}

func (m *MockUserRepository) FindByID(ctx context.Context, id string) (*User, error) {
    if m.FindByIDFunc != nil {
        return m.FindByIDFunc(ctx, id)
    }
    return &User{ID: id}, nil
}

// Test with mock
func TestUserService_CreateUser(t *testing.T) {
    mockRepo := &MockUserRepository{
        SaveFunc: func(ctx context.Context, user *User) error {
            assert.NotEmpty(t, user.ID)
            return nil
        },
    }
    
    service := &UserService{repo: mockRepo}
    user, err := service.CreateUser(context.Background(), "test@example.com", "testuser")
    
    require.NoError(t, err)
    assert.NotNil(t, user)
}
```

## Integration Testing

### Database Integration Test
```go
package integration

import (
    "context"
    "testing"
    
    "github.com/stretchr/testify/require"
)

func TestUserRepository_Integration(t *testing.T) {
    if testing.Short() {
        t.Skip("skipping integration test")
    }
    
    // Setup test database
    db := setupTestDB(t)
    defer cleanupTestDB(t, db)
    
    repo := NewUserRepository(db)
    
    t.Run("create and retrieve user", func(t *testing.T) {
        ctx := context.Background()
        user := &User{
            ID:       "test-id",
            Email:    "test@example.com",
            Username: "testuser",
        }
        
        err := repo.Save(ctx, user)
        require.NoError(t, err)
        
        retrieved, err := repo.FindByID(ctx, user.ID)
        require.NoError(t, err)
        require.Equal(t, user.Email, retrieved.Email)
    })
}

func setupTestDB(t *testing.T) *sql.DB {
    db, err := sql.Open("postgres", "postgres://test:test@localhost/testdb")
    require.NoError(t, err)
    
    // Run migrations
    _, err = db.Exec(`CREATE TABLE IF NOT EXISTS users (
        id TEXT PRIMARY KEY,
        email TEXT NOT NULL,
        username TEXT NOT NULL
    )`)
    require.NoError(t, err)
    
    return db
}

func cleanupTestDB(t *testing.T, db *sql.DB) {
    _, err := db.Exec(`DROP TABLE IF EXISTS users`)
    require.NoError(t, err)
    db.Close()
}
```

## HTTP Handler Testing

### Testing HTTP Handlers
```go
package handler

import (
    "net/http"
    "net/http/httptest"
    "strings"
    "testing"
    
    "github.com/stretchr/testify/assert"
)

func TestCreateUserHandler(t *testing.T) {
    tests := []struct {
        name           string
        body           string
        wantStatusCode int
        wantBody       string
    }{
        {
            name:           "valid request",
            body:           `{"email":"test@example.com","username":"testuser"}`,
            wantStatusCode: http.StatusCreated,
            wantBody:       `"email":"test@example.com"`,
        },
        {
            name:           "invalid json",
            body:           `{invalid}`,
            wantStatusCode: http.StatusBadRequest,
            wantBody:       "error",
        },
    }
    
    for _, tt := range tests {
        t.Run(tt.name, func(t *testing.T) {
            req := httptest.NewRequest(http.MethodPost, "/users", strings.NewReader(tt.body))
            req.Header.Set("Content-Type", "application/json")
            
            w := httptest.NewRecorder()
            
            handler := CreateUserHandler(mockService)
            handler.ServeHTTP(w, req)
            
            assert.Equal(t, tt.wantStatusCode, w.Code)
            assert.Contains(t, w.Body.String(), tt.wantBody)
        })
    }
}
```

## Test Fixtures and Helpers

```go
package testutil

import (
    "testing"
    "time"
)

type UserFixture struct {
    Email     string
    Username  string
    CreatedAt time.Time
}

func NewUserFixture() *UserFixture {
    return &UserFixture{
        Email:     "test@example.com",
        Username:  "testuser",
        CreatedAt: time.Now(),
    }
}

func (f *UserFixture) WithEmail(email string) *UserFixture {
    f.Email = email
    return f
}

func (f *UserFixture) Build() *User {
    return &User{
        Email:     f.Email,
        Username:  f.Username,
        CreatedAt: f.CreatedAt,
    }
}

// Usage in tests
func TestSomething(t *testing.T) {
    user := NewUserFixture().
        WithEmail("custom@example.com").
        Build()
    
    // Use user in test
}
```

## Best Practices Summary

### DO:
- Write table-driven tests
- Use subtests with `t.Run()`
- Test edge cases and error conditions
- Use interfaces for mocking
- Name tests descriptively
- Keep tests independent
- Use test helpers and fixtures
- Run tests with race detector
- Check test coverage
- Use `testing.Short()` for long tests

### DON'T:
- Test implementation details
- Share state between tests
- Ignore test failures
- Write flaky tests
- Mock everything
- Test third-party libraries
- Commit failing tests
- Skip writing tests for complex logic

## Running Tests

```bash
# Run all tests
go test ./...

# Run with coverage
go test -cover ./...

# Generate coverage report
go test -coverprofile=coverage.out ./...
go tool cover -html=coverage.out

# Run with race detector
go test -race ./...

# Run specific test
go test -run TestCreateUser ./...

# Skip long tests
go test -short ./...

# Verbose output
go test -v ./...

# Parallel execution
go test -parallel 4 ./...
```

## Summary

Effective testing in Go:
- **Table-driven**: Comprehensive test coverage
- **Isolation**: Independent, reproducible tests
- **Mocking**: Test units in isolation
- **Integration**: Verify system behavior
- **Coverage**: Aim for meaningful coverage
- **Fast**: Quick feedback loops
- **Maintainable**: Easy to understand and update

Good tests serve as documentation and enable confident refactoring.
