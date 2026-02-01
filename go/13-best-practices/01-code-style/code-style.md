# Go Code Style and Best Practices

## Following Effective Go Guidelines

### Naming Conventions

```go
// Package names: short, lowercase, single-word
package user

// Exported identifiers: PascalCase
type UserService struct {}
func NewUserService() *UserService {}

// Unexported identifiers: camelCase
type userRepository struct {}
func validateEmail(email string) bool {}

// Constants: PascalCase or SCREAMING_SNAKE_CASE
const MaxRetries = 3
const DEFAULT_TIMEOUT = 30

// Acronyms: all caps or all lowercase
type HTTPServer struct {}  // Exported
type httpClient struct {}  // Unexported
var APIKey string
var userID int64
```

### Package Organization

```go
// Good: Package comments describe the package purpose
// Package user provides user management functionality including
// authentication, authorization, and profile management.
package user

// Imports organized by standard library, external, internal
import (
    // Standard library
    "context"
    "fmt"
    "net/http"
    
    // External packages
    "github.com/go-chi/chi/v5"
    "github.com/google/uuid"
    
    // Internal packages
    "myapp/internal/database"
    "myapp/pkg/logger"
)
```

### Function Design

```go
// Good: Small, focused functions with clear names
func (s *UserService) CreateUser(ctx context.Context, email, username string) (*User, error) {
    if err := validateEmail(email); err != nil {
        return nil, fmt.Errorf("invalid email: %w", err)
    }
    
    user := &User{
        ID:       uuid.New().String(),
        Email:    email,
        Username: username,
    }
    
    if err := s.repo.Save(ctx, user); err != nil {
        return nil, fmt.Errorf("failed to save user: %w", err)
    }
    
    return user, nil
}

// Avoid: Large functions with multiple responsibilities
// Avoid: Generic names like ProcessData, HandleRequest, DoWork
```

### Error Handling Patterns

```go
// Good: Wrap errors with context
if err != nil {
    return fmt.Errorf("failed to connect to database: %w", err)
}

// Good: Handle errors immediately
user, err := s.GetUser(ctx, id)
if err != nil {
    return err
}

// Avoid: Naked returns with named return values
// Avoid: Ignoring errors: _ = doSomething()
```

### Interface Design

```go
// Good: Small, focused interfaces
type UserReader interface {
    GetUser(ctx context.Context, id string) (*User, error)
}

type UserWriter interface {
    CreateUser(ctx context.Context, user *User) error
    UpdateUser(ctx context.Context, user *User) error
}

// Interfaces at consumer side, not implementation
type UserService struct {
    reader UserReader
    writer UserWriter
}

// Avoid: Large, monolithic interfaces
// Avoid: Interfaces with too many methods
```

### Struct Design

```go
// Good: Embed for composition
type BaseService struct {
    logger *Logger
    config *Config
}

type UserService struct {
    BaseService
    repo UserRepository
}

// Good: Use constructors
func NewUserService(logger *Logger, config *Config, repo UserRepository) *UserService {
    return &UserService{
        BaseService: BaseService{
            logger: logger,
            config: config,
        },
        repo: repo,
    }
}
```

## Code Comments

```go
// Package-level comment before package declaration
// Package user provides comprehensive user management functionality.
package user

// Type comments for exported types
// User represents a system user with authentication credentials.
type User struct {
    // ID is the unique identifier for the user
    ID string
    // Email is the user's email address (must be unique)
    Email string
}

// Function comments for exported functions
// CreateUser creates a new user with the provided email and username.
// It returns an error if the email is invalid or already exists.
func CreateUser(email, username string) (*User, error) {
    // Implementation
}

// Don't comment obvious code
// Avoid: i++ // increment i
```

## Formatting and Style

```go
// Use gofmt/goimports automatically
// Line length: aim for 80-100 characters
// Indentation: tabs, not spaces

// Good: Align struct fields for readability
type Config struct {
    Host        string
    Port        int
    Database    string
    MaxRetries  int
}

// Good: Group related code with blank lines
func ProcessUser(user *User) error {
    // Validate user
    if err := validateUser(user); err != nil {
        return err
    }
    
    // Save to database
    if err := saveUser(user); err != nil {
        return err
    }
    
    // Send notification
    sendNotification(user)
    
    return nil
}
```

## Best Practices Summary

### DO:
- Use meaningful variable names
- Keep functions small and focused
- Follow Go naming conventions
- Use gofmt/goimports
- Write package documentation
- Handle errors explicitly
- Use interfaces for abstraction
- Prefer composition over inheritance

### DON'T:
- Use generic names like data, info, temp
- Create God objects or functions
- Ignore errors
- Use panic for normal error handling
- Export everything
- Use global variables (except for rare cases)
- Mutate shared state without synchronization

## Code Review Checklist

- [ ] Does it follow Go naming conventions?
- [ ] Are errors handled properly?
- [ ] Is the code formatted with gofmt?
- [ ] Are exported identifiers documented?
- [ ] Is the code testable?
- [ ] Are there any race conditions?
- [ ] Is context used appropriately?
- [ ] Are resources cleaned up properly?
- [ ] Is the code idiomatic Go?
- [ ] Can it be simplified?

## Tools for Code Quality

```bash
# Format code
gofmt -w .
goimports -w .

# Lint code
golangci-lint run

# Vet code
go vet ./...

# Check for common mistakes
staticcheck ./...

# Security scan
gosec ./...
```

## Summary

Following Go conventions ensures:
- **Readability**: Code is easy to understand
- **Maintainability**: Changes are straightforward
- **Consistency**: Codebase looks uniform
- **Tooling**: Standard tools work seamlessly
- **Community**: Aligns with Go ecosystem expectations

Idiomatic Go code is simple, clear, and leverages the language's strengths.
