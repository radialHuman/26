# Clean Architecture Pattern

## What is Clean Architecture?

**Clean Architecture** is a software design philosophy that emphasizes:
- **Independence**: Framework, UI, database, and external agency independence
- **Testability**: Business rules can be tested without UI, database, etc.
- **Maintainability**: Easy to understand and modify
- **Separation of Concerns**: Each layer has a single responsibility

## Core Principles

### 1. Dependency Rule

Dependencies point **inward**. Outer layers depend on inner layers, never the reverse.

```
┌─────────────────────────────────────┐
│     Frameworks & Drivers            │  ← External (DB, Web, UI)
│  ┌──────────────────────────────┐   │
│  │  Interface Adapters          │   │  ← Controllers, Presenters, Gateways
│  │  ┌────────────────────────┐  │   │
│  │  │  Use Cases             │  │   │  ← Business logic
│  │  │  ┌──────────────────┐  │  │   │
│  │  │  │    Entities      │  │  │   │  ← Core business rules
│  │  │  └──────────────────┘  │  │   │
│  │  └────────────────────────┘  │   │
│  └──────────────────────────────┘   │
└─────────────────────────────────────┘
```

### 2. Layers

1. **Entities**: Enterprise business rules
2. **Use Cases**: Application business rules
3. **Interface Adapters**: Convert data formats
4. **Frameworks & Drivers**: External tools

## Project Structure

```
myapp/
├── cmd/
│   └── api/
│       └── main.go              # Application entry point
├── internal/
│   ├── domain/                  # Layer 1: Entities
│   │   ├── user.go
│   │   ├── post.go
│   │   └── errors.go
│   ├── usecase/                 # Layer 2: Use Cases
│   │   ├── user_usecase.go
│   │   └── post_usecase.go
│   ├── repository/              # Layer 3: Interface Adapters
│   │   ├── user_repository.go
│   │   └── post_repository.go
│   ├── delivery/                # Layer 3: Interface Adapters
│   │   ├── http/
│   │   │   ├── user_handler.go
│   │   │   ├── post_handler.go
│   │   │   └── middleware.go
│   │   └── grpc/
│   │       └── user_service.go
│   └── infrastructure/          # Layer 4: Frameworks & Drivers
│       ├── database/
│       │   ├── postgres.go
│       │   └── migrations/
│       ├── cache/
│       │   └── redis.go
│       └── config/
│           └── config.go
├── pkg/                         # Public libraries
│   ├── logger/
│   └── validator/
└── go.mod
```

## Layer 1: Entities (Domain)

Core business entities with no external dependencies.

```go
// internal/domain/user.go
package domain

import (
    "errors"
    "time"
)

// Domain errors
var (
    ErrUserNotFound      = errors.New("user not found")
    ErrInvalidEmail      = errors.New("invalid email")
    ErrDuplicateEmail    = errors.New("email already exists")
)

// User entity
type User struct {
    ID        int
    Name      string
    Email     string
    Password  string
    Role      string
    CreatedAt time.Time
    UpdatedAt time.Time
}

// Business rules
func (u *User) Validate() error {
    if u.Name == "" {
        return errors.New("name is required")
    }
    if !isValidEmail(u.Email) {
        return ErrInvalidEmail
    }
    if len(u.Password) < 8 {
        return errors.New("password must be at least 8 characters")
    }
    return nil
}

func (u *User) IsAdmin() bool {
    return u.Role == "admin"
}

func (u *User) CanEdit(targetUser *User) bool {
    return u.ID == targetUser.ID || u.IsAdmin()
}
```

```go
// internal/domain/post.go
package domain

import "time"

type Post struct {
    ID        int
    UserID    int
    Title     string
    Content   string
    Published bool
    CreatedAt time.Time
    UpdatedAt time.Time
}

func (p *Post) Validate() error {
    if p.Title == "" {
        return errors.New("title is required")
    }
    if len(p.Content) < 10 {
        return errors.New("content too short")
    }
    return nil
}

func (p *Post) CanBeEditedBy(user *User) bool {
    return p.UserID == user.ID || user.IsAdmin()
}
```

## Layer 2: Use Cases (Business Logic)

Application-specific business rules.

```go
// internal/usecase/user_usecase.go
package usecase

import (
    "context"
    "myapp/internal/domain"
)

// Port (interface) - dependency inversion
type UserRepository interface {
    GetByID(ctx context.Context, id int) (*domain.User, error)
    GetByEmail(ctx context.Context, email string) (*domain.User, error)
    Create(ctx context.Context, user *domain.User) error
    Update(ctx context.Context, user *domain.User) error
    Delete(ctx context.Context, id int) error
    List(ctx context.Context, limit, offset int) ([]*domain.User, error)
}

type PasswordHasher interface {
    Hash(password string) (string, error)
    Compare(hashedPassword, password string) error
}

type UserUseCase struct {
    repo   UserRepository
    hasher PasswordHasher
}

func NewUserUseCase(repo UserRepository, hasher PasswordHasher) *UserUseCase {
    return &UserUseCase{
        repo:   repo,
        hasher: hasher,
    }
}

func (uc *UserUseCase) Register(ctx context.Context, name, email, password string) (*domain.User, error) {
    // Check if email exists
    existing, _ := uc.repo.GetByEmail(ctx, email)
    if existing != nil {
        return nil, domain.ErrDuplicateEmail
    }
    
    // Hash password
    hashedPassword, err := uc.hasher.Hash(password)
    if err != nil {
        return nil, err
    }
    
    // Create user
    user := &domain.User{
        Name:     name,
        Email:    email,
        Password: hashedPassword,
        Role:     "user",
    }
    
    // Validate business rules
    if err := user.Validate(); err != nil {
        return nil, err
    }
    
    // Save
    if err := uc.repo.Create(ctx, user); err != nil {
        return nil, err
    }
    
    return user, nil
}

func (uc *UserUseCase) Authenticate(ctx context.Context, email, password string) (*domain.User, error) {
    user, err := uc.repo.GetByEmail(ctx, email)
    if err != nil {
        return nil, err
    }
    
    if err := uc.hasher.Compare(user.Password, password); err != nil {
        return nil, errors.New("invalid credentials")
    }
    
    return user, nil
}

func (uc *UserUseCase) GetProfile(ctx context.Context, id int) (*domain.User, error) {
    return uc.repo.GetByID(ctx, id)
}

func (uc *UserUseCase) UpdateProfile(ctx context.Context, id int, name, email string) (*domain.User, error) {
    user, err := uc.repo.GetByID(ctx, id)
    if err != nil {
        return nil, err
    }
    
    user.Name = name
    user.Email = email
    
    if err := user.Validate(); err != nil {
        return nil, err
    }
    
    if err := uc.repo.Update(ctx, user); err != nil {
        return nil, err
    }
    
    return user, nil
}

func (uc *UserUseCase) DeleteAccount(ctx context.Context, id int) error {
    return uc.repo.Delete(ctx, id)
}
```

```go
// internal/usecase/post_usecase.go
package usecase

type PostRepository interface {
    GetByID(ctx context.Context, id int) (*domain.Post, error)
    Create(ctx context.Context, post *domain.Post) error
    Update(ctx context.Context, post *domain.Post) error
    Delete(ctx context.Context, id int) error
    List(ctx context.Context, userID int, limit, offset int) ([]*domain.Post, error)
}

type PostUseCase struct {
    repo     PostRepository
    userRepo UserRepository
}

func NewPostUseCase(repo PostRepository, userRepo UserRepository) *PostUseCase {
    return &PostUseCase{
        repo:     repo,
        userRepo: userRepo,
    }
}

func (uc *PostUseCase) CreatePost(ctx context.Context, userID int, title, content string) (*domain.Post, error) {
    user, err := uc.userRepo.GetByID(ctx, userID)
    if err != nil {
        return nil, err
    }
    
    post := &domain.Post{
        UserID:  user.ID,
        Title:   title,
        Content: content,
    }
    
    if err := post.Validate(); err != nil {
        return nil, err
    }
    
    if err := uc.repo.Create(ctx, post); err != nil {
        return nil, err
    }
    
    return post, nil
}

func (uc *PostUseCase) UpdatePost(ctx context.Context, postID, userID int, title, content string) (*domain.Post, error) {
    post, err := uc.repo.GetByID(ctx, postID)
    if err != nil {
        return nil, err
    }
    
    user, err := uc.userRepo.GetByID(ctx, userID)
    if err != nil {
        return nil, err
    }
    
    // Check permissions
    if !post.CanBeEditedBy(user) {
        return nil, errors.New("permission denied")
    }
    
    post.Title = title
    post.Content = content
    
    if err := post.Validate(); err != nil {
        return nil, err
    }
    
    if err := uc.repo.Update(ctx, post); err != nil {
        return nil, err
    }
    
    return post, nil
}
```

## Layer 3: Repository (Data Access)

Implements the repository interface defined in use cases.

```go
// internal/repository/user_repository.go
package repository

import (
    "context"
    "database/sql"
    "myapp/internal/domain"
)

type PostgresUserRepository struct {
    db *sql.DB
}

func NewPostgresUserRepository(db *sql.DB) *PostgresUserRepository {
    return &PostgresUserRepository{db: db}
}

func (r *PostgresUserRepository) GetByID(ctx context.Context, id int) (*domain.User, error) {
    var user domain.User
    
    err := r.db.QueryRowContext(ctx, `
        SELECT id, name, email, password, role, created_at, updated_at
        FROM users WHERE id = $1
    `, id).Scan(
        &user.ID, &user.Name, &user.Email, &user.Password,
        &user.Role, &user.CreatedAt, &user.UpdatedAt,
    )
    
    if err == sql.ErrNoRows {
        return nil, domain.ErrUserNotFound
    }
    if err != nil {
        return nil, err
    }
    
    return &user, nil
}

func (r *PostgresUserRepository) GetByEmail(ctx context.Context, email string) (*domain.User, error) {
    var user domain.User
    
    err := r.db.QueryRowContext(ctx, `
        SELECT id, name, email, password, role, created_at, updated_at
        FROM users WHERE email = $1
    `, email).Scan(
        &user.ID, &user.Name, &user.Email, &user.Password,
        &user.Role, &user.CreatedAt, &user.UpdatedAt,
    )
    
    if err == sql.ErrNoRows {
        return nil, domain.ErrUserNotFound
    }
    if err != nil {
        return nil, err
    }
    
    return &user, nil
}

func (r *PostgresUserRepository) Create(ctx context.Context, user *domain.User) error {
    return r.db.QueryRowContext(ctx, `
        INSERT INTO users (name, email, password, role, created_at, updated_at)
        VALUES ($1, $2, $3, $4, NOW(), NOW())
        RETURNING id, created_at, updated_at
    `, user.Name, user.Email, user.Password, user.Role).Scan(
        &user.ID, &user.CreatedAt, &user.UpdatedAt,
    )
}

func (r *PostgresUserRepository) Update(ctx context.Context, user *domain.User) error {
    _, err := r.db.ExecContext(ctx, `
        UPDATE users
        SET name = $1, email = $2, updated_at = NOW()
        WHERE id = $3
    `, user.Name, user.Email, user.ID)
    
    return err
}

func (r *PostgresUserRepository) Delete(ctx context.Context, id int) error {
    _, err := r.db.ExecContext(ctx, "DELETE FROM users WHERE id = $1", id)
    return err
}

func (r *PostgresUserRepository) List(ctx context.Context, limit, offset int) ([]*domain.User, error) {
    rows, err := r.db.QueryContext(ctx, `
        SELECT id, name, email, role, created_at, updated_at
        FROM users
        ORDER BY created_at DESC
        LIMIT $1 OFFSET $2
    `, limit, offset)
    if err != nil {
        return nil, err
    }
    defer rows.Close()
    
    var users []*domain.User
    for rows.Next() {
        var user domain.User
        if err := rows.Scan(
            &user.ID, &user.Name, &user.Email,
            &user.Role, &user.CreatedAt, &user.UpdatedAt,
        ); err != nil {
            return nil, err
        }
        users = append(users, &user)
    }
    
    return users, nil
}
```

## Layer 3: HTTP Delivery (Handlers)

Converts HTTP requests to use case calls.

```go
// internal/delivery/http/user_handler.go
package http

import (
    "net/http"
    
    "github.com/gin-gonic/gin"
    "myapp/internal/usecase"
)

type UserHandler struct {
    useCase *usecase.UserUseCase
}

func NewUserHandler(useCase *usecase.UserUseCase) *UserHandler {
    return &UserHandler{useCase: useCase}
}

func (h *UserHandler) Register(c *gin.Context) {
    var req struct {
        Name     string `json:"name" binding:"required"`
        Email    string `json:"email" binding:"required,email"`
        Password string `json:"password" binding:"required,min=8"`
    }
    
    if err := c.ShouldBindJSON(&req); err != nil {
        c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
        return
    }
    
    user, err := h.useCase.Register(c.Request.Context(), req.Name, req.Email, req.Password)
    if err != nil {
        c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
        return
    }
    
    c.JSON(http.StatusCreated, gin.H{
        "id":    user.ID,
        "name":  user.Name,
        "email": user.Email,
    })
}

func (h *UserHandler) Login(c *gin.Context) {
    var req struct {
        Email    string `json:"email" binding:"required,email"`
        Password string `json:"password" binding:"required"`
    }
    
    if err := c.ShouldBindJSON(&req); err != nil {
        c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
        return
    }
    
    user, err := h.useCase.Authenticate(c.Request.Context(), req.Email, req.Password)
    if err != nil {
        c.JSON(http.StatusUnauthorized, gin.H{"error": "Invalid credentials"})
        return
    }
    
    // Generate token (JWT)
    token := generateToken(user)
    
    c.JSON(http.StatusOK, gin.H{
        "token": token,
        "user": gin.H{
            "id":    user.ID,
            "name":  user.Name,
            "email": user.Email,
        },
    })
}

func (h *UserHandler) GetProfile(c *gin.Context) {
    userID := getUserIDFromContext(c)
    
    user, err := h.useCase.GetProfile(c.Request.Context(), userID)
    if err != nil {
        c.JSON(http.StatusNotFound, gin.H{"error": "User not found"})
        return
    }
    
    c.JSON(http.StatusOK, gin.H{
        "id":    user.ID,
        "name":  user.Name,
        "email": user.Email,
        "role":  user.Role,
    })
}
```

## Layer 4: Main (Dependency Injection)

Wire everything together.

```go
// cmd/api/main.go
package main

import (
    "database/sql"
    "log"
    
    "github.com/gin-gonic/gin"
    _ "github.com/lib/pq"
    
    "myapp/internal/delivery/http"
    "myapp/internal/infrastructure"
    "myapp/internal/repository"
    "myapp/internal/usecase"
)

func main() {
    // Load config
    cfg := infrastructure.LoadConfig()
    
    // Database
    db, err := sql.Open("postgres", cfg.DatabaseDSN)
    if err != nil {
        log.Fatal(err)
    }
    defer db.Close()
    
    // Repositories
    userRepo := repository.NewPostgresUserRepository(db)
    postRepo := repository.NewPostgresPostRepository(db)
    
    // Password hasher
    hasher := infrastructure.NewBcryptHasher()
    
    // Use cases
    userUC := usecase.NewUserUseCase(userRepo, hasher)
    postUC := usecase.NewPostUseCase(postRepo, userRepo)
    
    // Handlers
    userHandler := http.NewUserHandler(userUC)
    postHandler := http.NewPostHandler(postUC)
    
    // Router
    r := gin.Default()
    
    // Routes
    api := r.Group("/api/v1")
    {
        // Public
        api.POST("/register", userHandler.Register)
        api.POST("/login", userHandler.Login)
        
        // Protected
        protected := api.Group("")
        protected.Use(authMiddleware())
        {
            protected.GET("/profile", userHandler.GetProfile)
            protected.PUT("/profile", userHandler.UpdateProfile)
            
            protected.POST("/posts", postHandler.Create)
            protected.GET("/posts", postHandler.List)
            protected.GET("/posts/:id", postHandler.Get)
            protected.PUT("/posts/:id", postHandler.Update)
            protected.DELETE("/posts/:id", postHandler.Delete)
        }
    }
    
    log.Fatal(r.Run(":8080"))
}
```

## Testing

Clean architecture makes testing easy.

```go
// internal/usecase/user_usecase_test.go
package usecase_test

import (
    "context"
    "testing"
    
    "myapp/internal/domain"
    "myapp/internal/usecase"
)

// Mock repository
type mockUserRepository struct {
    users map[int]*domain.User
}

func (m *mockUserRepository) GetByID(ctx context.Context, id int) (*domain.User, error) {
    user, ok := m.users[id]
    if !ok {
        return nil, domain.ErrUserNotFound
    }
    return user, nil
}

func (m *mockUserRepository) GetByEmail(ctx context.Context, email string) (*domain.User, error) {
    for _, user := range m.users {
        if user.Email == email {
            return user, nil
        }
    }
    return nil, domain.ErrUserNotFound
}

func (m *mockUserRepository) Create(ctx context.Context, user *domain.User) error {
    user.ID = len(m.users) + 1
    m.users[user.ID] = user
    return nil
}

// Mock hasher
type mockHasher struct{}

func (m *mockHasher) Hash(password string) (string, error) {
    return "hashed_" + password, nil
}

func (m *mockHasher) Compare(hashedPassword, password string) error {
    if hashedPassword != "hashed_"+password {
        return errors.New("password mismatch")
    }
    return nil
}

func TestRegister(t *testing.T) {
    repo := &mockUserRepository{users: make(map[int]*domain.User)}
    hasher := &mockHasher{}
    uc := usecase.NewUserUseCase(repo, hasher)
    
    user, err := uc.Register(context.Background(), "John Doe", "john@example.com", "password123")
    
    if err != nil {
        t.Fatalf("Expected no error, got %v", err)
    }
    
    if user.ID == 0 {
        t.Error("Expected user ID to be set")
    }
    
    if user.Password != "hashed_password123" {
        t.Error("Expected password to be hashed")
    }
}

func TestAuthenticate(t *testing.T) {
    repo := &mockUserRepository{
        users: map[int]*domain.User{
            1: {
                ID:       1,
                Email:    "john@example.com",
                Password: "hashed_password123",
            },
        },
    }
    hasher := &mockHasher{}
    uc := usecase.NewUserUseCase(repo, hasher)
    
    user, err := uc.Authenticate(context.Background(), "john@example.com", "password123")
    
    if err != nil {
        t.Fatalf("Expected no error, got %v", err)
    }
    
    if user.ID != 1 {
        t.Errorf("Expected user ID 1, got %d", user.ID)
    }
}
```

## Benefits

### 1. Testability

Test business logic without database or HTTP:

```go
// No database needed
repo := &mockUserRepository{}
uc := usecase.NewUserUseCase(repo, hasher)
user, err := uc.Register(ctx, "John", "john@example.com", "pass123")
```

### 2. Flexibility

Swap implementations easily:

```go
// Switch from Postgres to MongoDB
userRepo := repository.NewMongoUserRepository(mongoClient)

// Switch from REST to gRPC
// Business logic stays the same
```

### 3. Maintainability

Each layer has clear responsibility:

- **Domain**: Business rules
- **Use Case**: Application logic
- **Repository**: Data access
- **Handler**: HTTP/gRPC delivery

## Summary

Clean Architecture provides:
- **Independence**: Decoupled layers
- **Testability**: Easy to test business logic
- **Flexibility**: Swap implementations
- **Maintainability**: Clear structure

Essential for large, long-lived applications.
