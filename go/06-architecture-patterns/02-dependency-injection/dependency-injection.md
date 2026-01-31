# Dependency Injection

## What is Dependency Injection?

**Dependency Injection (DI)** is a design pattern where dependencies are provided to an object rather than the object creating them itself. This promotes:
- **Loose Coupling**: Components don't depend on concrete implementations
- **Testability**: Easy to substitute mocks for testing
- **Flexibility**: Change implementations without modifying code
- **Maintainability**: Clear dependencies

## Why Use Dependency Injection?

Without DI (tightly coupled):
```go
type UserService struct {
    db *sql.DB
}

func NewUserService() *UserService {
    // Hard-coded dependency
    db, _ := sql.Open("postgres", "postgres://localhost/mydb")
    return &UserService{db: db}
}
```

With DI (loosely coupled):
```go
type UserService struct {
    db *sql.DB
}

// Dependency injected via constructor
func NewUserService(db *sql.DB) *UserService {
    return &UserService{db: db}
}
```

## Constructor Injection

The most common pattern in Go.

```go
package service

type UserRepository interface {
    GetByID(id int) (*User, error)
    Create(user *User) error
}

type EmailService interface {
    Send(to, subject, body string) error
}

type UserService struct {
    repo  UserRepository
    email EmailService
}

// Constructor with dependencies
func NewUserService(repo UserRepository, email EmailService) *UserService {
    return &UserService{
        repo:  repo,
        email: email,
    }
}

func (s *UserService) RegisterUser(name, email string) error {
    user := &User{Name: name, Email: email}
    
    if err := s.repo.Create(user); err != nil {
        return err
    }
    
    // Send welcome email
    return s.email.Send(email, "Welcome!", "Thanks for registering")
}
```

### Usage

```go
func main() {
    // Create dependencies
    db, _ := sql.Open("postgres", "...")
    repo := repository.NewPostgresUserRepository(db)
    emailSvc := email.NewSMTPService("smtp.gmail.com:587")
    
    // Inject dependencies
    userService := service.NewUserService(repo, emailSvc)
    
    // Use service
    userService.RegisterUser("John", "john@example.com")
}
```

## Interface-Based DI

Define interfaces for dependencies.

```go
// domain/interfaces.go
package domain

type UserRepository interface {
    GetByID(ctx context.Context, id int) (*User, error)
    Create(ctx context.Context, user *User) error
    Update(ctx context.Context, user *User) error
}

type CacheService interface {
    Get(key string) (interface{}, error)
    Set(key string, value interface{}, ttl time.Duration) error
    Delete(key string) error
}

type NotificationService interface {
    SendEmail(to, subject, body string) error
    SendSMS(phone, message string) error
}

// usecase/user_usecase.go
package usecase

type UserUseCase struct {
    repo         domain.UserRepository
    cache        domain.CacheService
    notification domain.NotificationService
}

func NewUserUseCase(
    repo domain.UserRepository,
    cache domain.CacheService,
    notification domain.NotificationService,
) *UserUseCase {
    return &UserUseCase{
        repo:         repo,
        cache:        cache,
        notification: notification,
    }
}

func (uc *UserUseCase) GetUser(ctx context.Context, id int) (*domain.User, error) {
    // Try cache first
    cacheKey := fmt.Sprintf("user:%d", id)
    if cached, err := uc.cache.Get(cacheKey); err == nil {
        return cached.(*domain.User), nil
    }
    
    // Get from repository
    user, err := uc.repo.GetByID(ctx, id)
    if err != nil {
        return nil, err
    }
    
    // Cache for next time
    uc.cache.Set(cacheKey, user, 15*time.Minute)
    
    return user, nil
}
```

## Manual Dependency Container

Simple container for organizing dependencies.

```go
package container

import (
    "database/sql"
    "myapp/repository"
    "myapp/service"
    "myapp/usecase"
)

type Container struct {
    // Infrastructure
    DB    *sql.DB
    Redis *redis.Client
    
    // Repositories
    UserRepo repository.UserRepository
    PostRepo repository.PostRepository
    
    // Services
    EmailService     service.EmailService
    CacheService     service.CacheService
    
    // Use Cases
    UserUseCase *usecase.UserUseCase
    PostUseCase *usecase.PostUseCase
}

func NewContainer(cfg *config.Config) (*Container, error) {
    c := &Container{}
    
    // Database
    db, err := sql.Open("postgres", cfg.DatabaseDSN)
    if err != nil {
        return nil, err
    }
    c.DB = db
    
    // Redis
    c.Redis = redis.NewClient(&redis.Options{
        Addr: cfg.RedisAddr,
    })
    
    // Repositories
    c.UserRepo = repository.NewPostgresUserRepository(db)
    c.PostRepo = repository.NewPostgresPostRepository(db)
    
    // Services
    c.EmailService = service.NewSMTPEmailService(cfg.SMTPConfig)
    c.CacheService = service.NewRedisCache(c.Redis)
    
    // Use Cases
    c.UserUseCase = usecase.NewUserUseCase(c.UserRepo, c.CacheService, c.EmailService)
    c.PostUseCase = usecase.NewPostUseCase(c.PostRepo, c.UserRepo)
    
    return c, nil
}

func (c *Container) Close() error {
    c.DB.Close()
    c.Redis.Close()
    return nil
}

// Usage in main
func main() {
    cfg := config.Load()
    
    container, err := NewContainer(cfg)
    if err != nil {
        log.Fatal(err)
    }
    defer container.Close()
    
    // Setup HTTP handlers with dependencies
    userHandler := http.NewUserHandler(container.UserUseCase)
    postHandler := http.NewPostHandler(container.PostUseCase)
    
    r := setupRouter(userHandler, postHandler)
    r.Run(":8080")
}
```

## Wire - Compile-Time Dependency Injection

Google's Wire generates code at compile time.

### Installation

```bash
go get github.com/google/wire/cmd/wire
```

### Define Providers

```go
// wire.go
//go:build wireinject
// +build wireinject

package main

import (
    "github.com/google/wire"
    "myapp/repository"
    "myapp/service"
    "myapp/usecase"
)

// Provider sets
var repositorySet = wire.NewSet(
    repository.NewPostgresUserRepository,
    repository.NewPostgresPostRepository,
)

var serviceSet = wire.NewSet(
    service.NewEmailService,
    service.NewCacheService,
)

var useCaseSet = wire.NewSet(
    usecase.NewUserUseCase,
    usecase.NewPostUseCase,
)

// Injector
func InitializeApp(db *sql.DB, redis *redis.Client) (*App, error) {
    wire.Build(
        repositorySet,
        serviceSet,
        useCaseSet,
        NewApp,
    )
    return &App{}, nil
}

type App struct {
    UserUseCase *usecase.UserUseCase
    PostUseCase *usecase.PostUseCase
}

func NewApp(
    userUC *usecase.UserUseCase,
    postUC *usecase.PostUseCase,
) *App {
    return &App{
        UserUseCase: userUC,
        PostUseCase: postUC,
    }
}
```

### Generate Code

```bash
wire gen
```

This generates `wire_gen.go`:

```go
// Code generated by Wire. DO NOT EDIT.

func InitializeApp(db *sql.DB, redis *redis.Client) (*App, error) {
    userRepository := repository.NewPostgresUserRepository(db)
    cacheService := service.NewCacheService(redis)
    emailService := service.NewEmailService()
    userUseCase := usecase.NewUserUseCase(userRepository, cacheService, emailService)
    postRepository := repository.NewPostgresPostRepository(db)
    postUseCase := usecase.NewPostUseCase(postRepository, userRepository)
    app := NewApp(userUseCase, postUseCase)
    return app, nil
}
```

### Usage

```go
func main() {
    db, _ := sql.Open("postgres", "...")
    redis := redis.NewClient(&redis.Options{})
    
    app, err := InitializeApp(db, redis)
    if err != nil {
        log.Fatal(err)
    }
    
    // Use app
    userHandler := http.NewUserHandler(app.UserUseCase)
    // ...
}
```

## Dig - Runtime Dependency Injection

Uber's Dig provides runtime DI container.

```bash
go get go.uber.org/dig
```

### Basic Usage

```go
package main

import (
    "database/sql"
    "log"
    
    "go.uber.org/dig"
)

func main() {
    container := dig.New()
    
    // Register constructors
    container.Provide(NewDatabase)
    container.Provide(repository.NewUserRepository)
    container.Provide(service.NewEmailService)
    container.Provide(usecase.NewUserUseCase)
    
    // Invoke
    err := container.Invoke(func(uc *usecase.UserUseCase) {
        // Use user use case
        user, _ := uc.GetUser(context.Background(), 1)
        log.Printf("User: %+v", user)
    })
    
    if err != nil {
        log.Fatal(err)
    }
}

func NewDatabase() (*sql.DB, error) {
    return sql.Open("postgres", "postgres://localhost/mydb")
}
```

### With Groups

```go
type Handler interface {
    Register(r *gin.Engine)
}

// Provide handlers as group
container.Provide(NewUserHandler, dig.Group("handlers"))
container.Provide(NewPostHandler, dig.Group("handlers"))

// Consume group
type Handlers struct {
    dig.In
    Handlers []Handler `group:"handlers"`
}

func SetupRouter(h Handlers) *gin.Engine {
    r := gin.Default()
    
    for _, handler := range h.Handlers {
        handler.Register(r)
    }
    
    return r
}

container.Provide(SetupRouter)
```

## Functional Options Pattern

Alternative to constructor injection.

```go
package service

type UserService struct {
    repo         UserRepository
    cache        CacheService
    notification NotificationService
    logger       Logger
}

type Option func(*UserService)

func WithCache(cache CacheService) Option {
    return func(s *UserService) {
        s.cache = cache
    }
}

func WithNotification(notification NotificationService) Option {
    return func(s *UserService) {
        s.notification = notification
    }
}

func WithLogger(logger Logger) Option {
    return func(s *UserService) {
        s.logger = logger
    }
}

func NewUserService(repo UserRepository, opts ...Option) *UserService {
    s := &UserService{
        repo:   repo,
        logger: &DefaultLogger{}, // Default
    }
    
    for _, opt := range opts {
        opt(s)
    }
    
    return s
}

// Usage
userService := NewUserService(
    repo,
    WithCache(cacheService),
    WithNotification(notificationService),
    WithLogger(logger),
)
```

## Testing with Dependency Injection

DI makes testing easy.

```go
package service_test

import (
    "errors"
    "testing"
)

// Mock repository
type mockUserRepository struct {
    users map[int]*User
}

func (m *mockUserRepository) GetByID(id int) (*User, error) {
    user, ok := m.users[id]
    if !ok {
        return nil, errors.New("not found")
    }
    return user, nil
}

func (m *mockUserRepository) Create(user *User) error {
    m.users[user.ID] = user
    return nil
}

// Mock email service
type mockEmailService struct {
    sentEmails []Email
}

type Email struct {
    To      string
    Subject string
    Body    string
}

func (m *mockEmailService) Send(to, subject, body string) error {
    m.sentEmails = append(m.sentEmails, Email{to, subject, body})
    return nil
}

// Test
func TestRegisterUser(t *testing.T) {
    // Setup mocks
    repo := &mockUserRepository{users: make(map[int]*User)}
    email := &mockEmailService{}
    
    // Inject mocks
    service := NewUserService(repo, email)
    
    // Test
    err := service.RegisterUser("John", "john@example.com")
    if err != nil {
        t.Fatalf("Expected no error, got %v", err)
    }
    
    // Verify
    if len(repo.users) != 1 {
        t.Error("Expected user to be created")
    }
    
    if len(email.sentEmails) != 1 {
        t.Error("Expected welcome email to be sent")
    }
}
```

## Best Practices

### 1. Depend on Interfaces

```go
// Good: Depend on interface
type UserService struct {
    repo UserRepository // interface
}

// Bad: Depend on concrete type
type UserService struct {
    repo *PostgresUserRepository // concrete
}
```

### 2. Keep Constructors Simple

```go
// Good: Simple constructor
func NewUserService(repo UserRepository) *UserService {
    return &UserService{repo: repo}
}

// Bad: Complex initialization in constructor
func NewUserService(db *sql.DB) *UserService {
    // Don't do complex initialization here
    repo := setupRepository(db)
    cache := setupCache()
    // ...
}
```

### 3. Use Constructor Injection

```go
// Preferred in Go
func NewService(dep Dependency) *Service {
    return &Service{dep: dep}
}

// Avoid setter injection (not idiomatic in Go)
func (s *Service) SetDependency(dep Dependency) {
    s.dep = dep
}
```

### 4. Validate Dependencies

```go
func NewUserService(repo UserRepository, email EmailService) *UserService {
    if repo == nil {
        panic("repository is required")
    }
    if email == nil {
        panic("email service is required")
    }
    
    return &UserService{
        repo:  repo,
        email: email,
    }
}
```

### 5. Group Related Dependencies

```go
type UserDependencies struct {
    Repo         UserRepository
    Cache        CacheService
    Notification NotificationService
}

func NewUserService(deps UserDependencies) *UserService {
    return &UserService{
        repo:         deps.Repo,
        cache:        deps.Cache,
        notification: deps.Notification,
    }
}
```

## Complete Example

```go
// main.go
package main

import (
    "database/sql"
    "log"
    
    "myapp/config"
    "myapp/delivery/http"
    "myapp/repository"
    "myapp/service"
    "myapp/usecase"
)

func main() {
    // Load configuration
    cfg := config.Load()
    
    // Initialize infrastructure
    db, err := sql.Open("postgres", cfg.DatabaseDSN)
    if err != nil {
        log.Fatal(err)
    }
    defer db.Close()
    
    redis := redis.NewClient(&redis.Options{
        Addr: cfg.RedisAddr,
    })
    defer redis.Close()
    
    // Repositories (Data Layer)
    userRepo := repository.NewPostgresUserRepository(db)
    postRepo := repository.NewPostgresPostRepository(db)
    
    // Services (Infrastructure)
    cacheService := service.NewRedisCache(redis)
    emailService := service.NewSMTPEmailService(cfg.SMTP)
    logger := service.NewLogger()
    
    // Use Cases (Business Logic)
    userUC := usecase.NewUserUseCase(userRepo, cacheService, emailService, logger)
    postUC := usecase.NewPostUseCase(postRepo, userRepo, logger)
    
    // Handlers (HTTP Layer)
    userHandler := http.NewUserHandler(userUC)
    postHandler := http.NewPostHandler(postUC)
    
    // Setup router
    r := gin.Default()
    
    api := r.Group("/api/v1")
    {
        api.POST("/users", userHandler.Create)
        api.GET("/users/:id", userHandler.Get)
        
        api.POST("/posts", postHandler.Create)
        api.GET("/posts", postHandler.List)
    }
    
    log.Fatal(r.Run(":8080"))
}
```

## Summary

Dependency Injection provides:
- **Loose Coupling**: Components are independent
- **Testability**: Easy to mock dependencies
- **Flexibility**: Swap implementations
- **Maintainability**: Clear dependencies

Use constructor injection and interfaces for clean, testable Go code.
