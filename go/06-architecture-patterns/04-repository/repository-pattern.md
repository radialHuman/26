# Repository Pattern

## What is Repository Pattern?

**Repository pattern** abstracts data access logic:
- **Separation**: Business logic separate from data access
- **Testability**: Easy to mock repositories
- **Flexibility**: Switch databases without changing business code
- **Consistency**: Centralized data access methods

## Why Use Repository Pattern?

Without repository:
```go
// Business logic mixed with database code
func createUser(c *gin.Context) {
    var req CreateUserRequest
    c.ShouldBindJSON(&req)
    
    // Direct database access
    user := User{Name: req.Name, Email: req.Email}
    db.Create(&user) // Tightly coupled to GORM
    
    c.JSON(200, user)
}
```

With repository:
```go
// Clean separation
func createUser(c *gin.Context) {
    var req CreateUserRequest
    c.ShouldBindJSON(&req)
    
    // Use repository interface
    user, err := userRepo.Create(req.Name, req.Email)
    if err != nil {
        c.JSON(500, gin.H{"error": err.Error()})
        return
    }
    
    c.JSON(200, user)
}
```

## Basic Repository Interface

```go
package repository

import (
    "context"
)

// User model
type User struct {
    ID        int       `json:"id"`
    Name      string    `json:"name"`
    Email     string    `json:"email"`
    Status    string    `json:"status"`
    CreatedAt time.Time `json:"created_at"`
    UpdatedAt time.Time `json:"updated_at"`
}

// Repository interface
type UserRepository interface {
    Create(ctx context.Context, user *User) error
    GetByID(ctx context.Context, id int) (*User, error)
    GetByEmail(ctx context.Context, email string) (*User, error)
    List(ctx context.Context, limit, offset int) ([]*User, error)
    Update(ctx context.Context, user *User) error
    Delete(ctx context.Context, id int) error
}
```

## GORM Implementation

```go
package repository

import (
    "context"
    "errors"
    
    "gorm.io/gorm"
)

type userRepository struct {
    db *gorm.DB
}

// Constructor
func NewUserRepository(db *gorm.DB) UserRepository {
    return &userRepository{db: db}
}

func (r *userRepository) Create(ctx context.Context, user *User) error {
    return r.db.WithContext(ctx).Create(user).Error
}

func (r *userRepository) GetByID(ctx context.Context, id int) (*User, error) {
    var user User
    err := r.db.WithContext(ctx).First(&user, id).Error
    if err != nil {
        if errors.Is(err, gorm.ErrRecordNotFound) {
            return nil, errors.New("user not found")
        }
        return nil, err
    }
    
    return &user, nil
}

func (r *userRepository) GetByEmail(ctx context.Context, email string) (*User, error) {
    var user User
    err := r.db.WithContext(ctx).Where("email = ?", email).First(&user).Error
    if err != nil {
        if errors.Is(err, gorm.ErrRecordNotFound) {
            return nil, errors.New("user not found")
        }
        return nil, err
    }
    
    return &user, nil
}

func (r *userRepository) List(ctx context.Context, limit, offset int) ([]*User, error) {
    var users []*User
    err := r.db.WithContext(ctx).
        Limit(limit).
        Offset(offset).
        Order("created_at DESC").
        Find(&users).Error
    
    return users, err
}

func (r *userRepository) Update(ctx context.Context, user *User) error {
    return r.db.WithContext(ctx).Save(user).Error
}

func (r *userRepository) Delete(ctx context.Context, id int) error {
    return r.db.WithContext(ctx).Delete(&User{}, id).Error
}
```

## Advanced Queries

```go
// Filter options
type UserFilter struct {
    Status string
    Search string
    SortBy string
    Order  string
}

// Extended interface
type UserRepository interface {
    // ... basic methods
    
    ListWithFilter(ctx context.Context, filter UserFilter, limit, offset int) ([]*User, error)
    Count(ctx context.Context, filter UserFilter) (int64, error)
    ExistsByEmail(ctx context.Context, email string) (bool, error)
}

// Implementation
func (r *userRepository) ListWithFilter(ctx context.Context, filter UserFilter, limit, offset int) ([]*User, error) {
    query := r.db.WithContext(ctx)
    
    // Apply filters
    if filter.Status != "" {
        query = query.Where("status = ?", filter.Status)
    }
    
    if filter.Search != "" {
        searchTerm := "%" + filter.Search + "%"
        query = query.Where("name LIKE ? OR email LIKE ?", searchTerm, searchTerm)
    }
    
    // Apply sorting
    sortClause := "created_at DESC" // Default
    if filter.SortBy != "" && filter.Order != "" {
        sortClause = filter.SortBy + " " + filter.Order
    }
    query = query.Order(sortClause)
    
    // Pagination
    var users []*User
    err := query.Limit(limit).Offset(offset).Find(&users).Error
    
    return users, err
}

func (r *userRepository) Count(ctx context.Context, filter UserFilter) (int64, error) {
    query := r.db.WithContext(ctx).Model(&User{})
    
    // Apply same filters
    if filter.Status != "" {
        query = query.Where("status = ?", filter.Status)
    }
    
    if filter.Search != "" {
        searchTerm := "%" + filter.Search + "%"
        query = query.Where("name LIKE ? OR email LIKE ?", searchTerm, searchTerm)
    }
    
    var count int64
    err := query.Count(&count).Error
    
    return count, err
}

func (r *userRepository) ExistsByEmail(ctx context.Context, email string) (bool, error) {
    var count int64
    err := r.db.WithContext(ctx).
        Model(&User{}).
        Where("email = ?", email).
        Count(&count).Error
    
    return count > 0, err
}
```

## Generic Repository

Reusable repository for any model.

```go
package repository

import (
    "context"
    
    "gorm.io/gorm"
)

type Repository[T any] interface {
    Create(ctx context.Context, entity *T) error
    GetByID(ctx context.Context, id int) (*T, error)
    List(ctx context.Context, limit, offset int) ([]*T, error)
    Update(ctx context.Context, entity *T) error
    Delete(ctx context.Context, id int) error
}

type repository[T any] struct {
    db *gorm.DB
}

func NewRepository[T any](db *gorm.DB) Repository[T] {
    return &repository[T]{db: db}
}

func (r *repository[T]) Create(ctx context.Context, entity *T) error {
    return r.db.WithContext(ctx).Create(entity).Error
}

func (r *repository[T]) GetByID(ctx context.Context, id int) (*T, error) {
    var entity T
    err := r.db.WithContext(ctx).First(&entity, id).Error
    if err != nil {
        return nil, err
    }
    return &entity, nil
}

func (r *repository[T]) List(ctx context.Context, limit, offset int) ([]*T, error) {
    var entities []*T
    err := r.db.WithContext(ctx).
        Limit(limit).
        Offset(offset).
        Find(&entities).Error
    
    return entities, err
}

func (r *repository[T]) Update(ctx context.Context, entity *T) error {
    return r.db.WithContext(ctx).Save(entity).Error
}

func (r *repository[T]) Delete(ctx context.Context, id int) error {
    var entity T
    return r.db.WithContext(ctx).Delete(&entity, id).Error
}

// Usage
userRepo := NewRepository[User](db)
postRepo := NewRepository[Post](db)

// Create user
user := &User{Name: "John", Email: "john@example.com"}
userRepo.Create(ctx, user)

// Get user
user, _ = userRepo.GetByID(ctx, 1)
```

## Transactions

```go
// Interface with transaction support
type UserRepository interface {
    // ... basic methods
    
    WithTransaction(tx *gorm.DB) UserRepository
}

// Implementation
func (r *userRepository) WithTransaction(tx *gorm.DB) UserRepository {
    return &userRepository{db: tx}
}

// Usage
func transferCredits(userRepo UserRepository, fromID, toID int, amount int) error {
    return db.Transaction(func(tx *gorm.DB) error {
        // Use transaction
        txRepo := userRepo.WithTransaction(tx)
        
        // Deduct from sender
        sender, err := txRepo.GetByID(ctx, fromID)
        if err != nil {
            return err
        }
        sender.Credits -= amount
        if err := txRepo.Update(ctx, sender); err != nil {
            return err
        }
        
        // Add to receiver
        receiver, err := txRepo.GetByID(ctx, toID)
        if err != nil {
            return err
        }
        receiver.Credits += amount
        if err := txRepo.Update(ctx, receiver); err != nil {
            return err
        }
        
        return nil
    })
}
```

## Multiple Models Example

```go
package repository

// Post repository
type Post struct {
    ID        int
    UserID    int
    Title     string
    Content   string
    Status    string
    CreatedAt time.Time
}

type PostRepository interface {
    Create(ctx context.Context, post *Post) error
    GetByID(ctx context.Context, id int) (*Post, error)
    GetByUserID(ctx context.Context, userID int) ([]*Post, error)
    Update(ctx context.Context, post *Post) error
    Delete(ctx context.Context, id int) error
}

type postRepository struct {
    db *gorm.DB
}

func NewPostRepository(db *gorm.DB) PostRepository {
    return &postRepository{db: db}
}

func (r *postRepository) Create(ctx context.Context, post *Post) error {
    return r.db.WithContext(ctx).Create(post).Error
}

func (r *postRepository) GetByID(ctx context.Context, id int) (*Post, error) {
    var post Post
    err := r.db.WithContext(ctx).First(&post, id).Error
    return &post, err
}

func (r *postRepository) GetByUserID(ctx context.Context, userID int) ([]*Post, error) {
    var posts []*Post
    err := r.db.WithContext(ctx).
        Where("user_id = ?", userID).
        Order("created_at DESC").
        Find(&posts).Error
    
    return posts, err
}

func (r *postRepository) Update(ctx context.Context, post *Post) error {
    return r.db.WithContext(ctx).Save(post).Error
}

func (r *postRepository) Delete(ctx context.Context, id int) error {
    return r.db.WithContext(ctx).Delete(&Post{}, id).Error
}
```

## Testing with Mock Repository

```go
package repository

import (
    "context"
    "testing"
)

// Mock implementation
type mockUserRepository struct {
    users map[int]*User
}

func NewMockUserRepository() UserRepository {
    return &mockUserRepository{
        users: make(map[int]*User),
    }
}

func (m *mockUserRepository) Create(ctx context.Context, user *User) error {
    user.ID = len(m.users) + 1
    m.users[user.ID] = user
    return nil
}

func (m *mockUserRepository) GetByID(ctx context.Context, id int) (*User, error) {
    user, exists := m.users[id]
    if !exists {
        return nil, errors.New("user not found")
    }
    return user, nil
}

// ... other methods

// Test
func TestCreateUser(t *testing.T) {
    repo := NewMockUserRepository()
    
    user := &User{Name: "John", Email: "john@example.com"}
    err := repo.Create(context.Background(), user)
    
    if err != nil {
        t.Errorf("Expected no error, got %v", err)
    }
    
    if user.ID != 1 {
        t.Errorf("Expected ID 1, got %d", user.ID)
    }
}
```

## Service Layer with Repository

```go
package service

import (
    "context"
    "errors"
)

type UserService struct {
    userRepo UserRepository
}

func NewUserService(userRepo UserRepository) *UserService {
    return &UserService{userRepo: userRepo}
}

func (s *UserService) Register(ctx context.Context, name, email, password string) (*User, error) {
    // Check if user exists
    exists, err := s.userRepo.ExistsByEmail(ctx, email)
    if err != nil {
        return nil, err
    }
    if exists {
        return nil, errors.New("email already registered")
    }
    
    // Hash password
    hashedPassword, err := hashPassword(password)
    if err != nil {
        return nil, err
    }
    
    // Create user
    user := &User{
        Name:     name,
        Email:    email,
        Password: hashedPassword,
        Status:   "active",
    }
    
    if err := s.userRepo.Create(ctx, user); err != nil {
        return nil, err
    }
    
    return user, nil
}

func (s *UserService) GetProfile(ctx context.Context, userID int) (*User, error) {
    return s.userRepo.GetByID(ctx, userID)
}

func (s *UserService) UpdateProfile(ctx context.Context, userID int, name string) error {
    user, err := s.userRepo.GetByID(ctx, userID)
    if err != nil {
        return err
    }
    
    user.Name = name
    return s.userRepo.Update(ctx, user)
}
```

## HTTP Handler with Service

```go
package handler

import (
    "github.com/gin-gonic/gin"
)

type UserHandler struct {
    userService *UserService
}

func NewUserHandler(userService *UserService) *UserHandler {
    return &UserHandler{userService: userService}
}

func (h *UserHandler) Register(c *gin.Context) {
    var req RegisterRequest
    if err := c.ShouldBindJSON(&req); err != nil {
        c.JSON(400, gin.H{"error": err.Error()})
        return
    }
    
    user, err := h.userService.Register(
        c.Request.Context(),
        req.Name,
        req.Email,
        req.Password,
    )
    if err != nil {
        c.JSON(400, gin.H{"error": err.Error()})
        return
    }
    
    c.JSON(201, user)
}

func (h *UserHandler) GetProfile(c *gin.Context) {
    userID := c.GetInt("user_id") // From JWT middleware
    
    user, err := h.userService.GetProfile(c.Request.Context(), userID)
    if err != nil {
        c.JSON(404, gin.H{"error": err.Error()})
        return
    }
    
    c.JSON(200, user)
}
```

## Full Application Wiring

```go
package main

import (
    "log"
    
    "github.com/gin-gonic/gin"
    "gorm.io/driver/postgres"
    "gorm.io/gorm"
)

func main() {
    // Database
    dsn := "host=localhost user=postgres password=secret dbname=mydb"
    db, err := gorm.Open(postgres.Open(dsn), &gorm.Config{})
    if err != nil {
        log.Fatal(err)
    }
    
    // Auto migrate
    db.AutoMigrate(&User{}, &Post{})
    
    // Repositories
    userRepo := NewUserRepository(db)
    postRepo := NewPostRepository(db)
    
    // Services
    userService := NewUserService(userRepo)
    postService := NewPostService(postRepo, userRepo)
    
    // Handlers
    userHandler := NewUserHandler(userService)
    postHandler := NewPostHandler(postService)
    
    // Router
    r := gin.Default()
    
    // Routes
    r.POST("/register", userHandler.Register)
    r.POST("/login", userHandler.Login)
    
    authorized := r.Group("/")
    authorized.Use(JWTAuthMiddleware())
    {
        authorized.GET("/profile", userHandler.GetProfile)
        authorized.PUT("/profile", userHandler.UpdateProfile)
        
        authorized.POST("/posts", postHandler.Create)
        authorized.GET("/posts", postHandler.List)
        authorized.GET("/posts/:id", postHandler.GetByID)
    }
    
    r.Run(":8080")
}
```

## Benefits

1. **Testability**: Easy to mock repositories
2. **Maintainability**: Centralized data access
3. **Flexibility**: Swap databases (Postgres → MySQL → MongoDB)
4. **Consistency**: Standard interface for data operations
5. **Separation**: Business logic independent of persistence

## When to Use

Use repository pattern when:
- Building large applications
- Need to switch databases
- Want testable code
- Have complex queries
- Working in teams

Skip for:
- Simple CRUD apps
- Rapid prototypes
- Single-developer projects

## Summary

Repository pattern provides:
- **Abstraction**: Hide database implementation details
- **Interface**: Consistent data access methods
- **Testing**: Easy mocking for unit tests
- **Flexibility**: Database-agnostic business logic
- **Organization**: Clean architecture layers

Essential for maintainable, testable backends.
