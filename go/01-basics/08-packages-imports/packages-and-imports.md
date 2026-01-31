# Packages and Imports

## What are Packages?

Packages are Go's way of organizing and reusing code. Every Go file belongs to a package.

## Package Basics

### Package Declaration

Every Go file starts with a package declaration:

```go
// main.go
package main

import "fmt"

func main() {
    fmt.Println("Hello, World!")
}
```

### Main Package

- `package main` is special - creates an executable
- Must have a `main()` function as entry point
- Other packages are libraries

```go
// Executable program
package main

func main() {
    // Entry point
}
```

```go
// Library package
package mylib

func Helper() string {
    return "I'm a library"
}
```

## Imports

### Single Import

```go
package main

import "fmt"

func main() {
    fmt.Println("Hello")
}
```

### Multiple Imports

```go
package main

import (
    "fmt"
    "time"
    "strings"
)

func main() {
    fmt.Println(time.Now())
    fmt.Println(strings.ToUpper("hello"))
}
```

### Import Aliases

```go
package main

import (
    "fmt"
    f "fmt"  // Alias
)

func main() {
    fmt.Println("Using fmt")
    f.Println("Using f alias")
}
```

### Dot Import (Not Recommended)

```go
package main

import (
    . "fmt"  // Import into current namespace
)

func main() {
    Println("No prefix needed")  // Can use Println directly
}
```

### Blank Import

Used for side effects (init functions):

```go
package main

import (
    "database/sql"
    _ "github.com/lib/pq"  // Initialize PostgreSQL driver
)

func main() {
    db, _ := sql.Open("postgres", "...")
}
```

## Creating Packages

### Package Structure

```
myproject/
├── go.mod
├── main.go
├── config/
│   └── config.go
├── models/
│   └── user.go
└── handlers/
    └── user.go
```

### Example Package

```go
// models/user.go
package models

type User struct {
    ID    int
    Name  string
    Email string
}

func NewUser(name, email string) *User {
    return &User{
        Name:  name,
        Email: email,
    }
}
```

```go
// main.go
package main

import (
    "fmt"
    "myproject/models"
)

func main() {
    user := models.NewUser("John", "john@example.com")
    fmt.Printf("%+v\n", user)
}
```

## Exported vs Unexported

### Naming Convention

- **Capitalized** = Exported (public)
- **Lowercase** = Unexported (private to package)

```go
// user.go
package user

// Exported - can be used outside package
type User struct {
    ID   int     // Exported field
    name string  // Unexported field
}

// Exported function
func NewUser() *User {
    return &User{}
}

// Unexported function
func validateEmail(email string) bool {
    return true
}

// Exported method
func (u *User) GetName() string {
    return u.name
}

// Unexported method
func (u *User) setName(name string) {
    u.name = name
}
```

```go
// main.go
package main

import "myproject/user"

func main() {
    u := user.NewUser()        // OK - exported
    name := u.GetName()        // OK - exported
    
    // u.name = "John"         // ERROR - unexported
    // u.setName("John")       // ERROR - unexported
    // user.validateEmail()    // ERROR - unexported
}
```

## Package Initialization

### init() Function

Runs automatically before main():

```go
package config

import "fmt"

var Config map[string]string

func init() {
    fmt.Println("Initializing config...")
    Config = make(map[string]string)
    Config["version"] = "1.0"
}
```

Multiple `init()` functions execute in order:

```go
package main

import "fmt"

func init() {
    fmt.Println("First init")
}

func init() {
    fmt.Println("Second init")
}

func main() {
    fmt.Println("Main")
}

// Output:
// First init
// Second init
// Main
```

### Initialization Order

1. Imported packages initialized first (depth-first)
2. Package-level variables
3. init() functions
4. main() function

```go
// config/config.go
package config

import "fmt"

var Version = "1.0"

func init() {
    fmt.Println("Config package initialized")
}
```

```go
// main.go
package main

import (
    "fmt"
    "myproject/config"
)

var appName = "MyApp"

func init() {
    fmt.Println("Main package initialized")
}

func main() {
    fmt.Println("Main function")
    fmt.Println(config.Version)
}

// Output:
// Config package initialized
// Main package initialized
// Main function
// 1.0
```

## Internal Packages

`internal/` directory creates private packages:

```
myproject/
├── go.mod
├── main.go
├── api/
│   └── handler.go
└── internal/
    ├── database/
    │   └── db.go
    └── utils/
        └── helper.go
```

```go
// internal/utils/helper.go
package utils

func FormatName(name string) string {
    return strings.Title(name)
}
```

```go
// api/handler.go
package api

import "myproject/internal/utils"  // OK - same module

func Handle() {
    utils.FormatName("john")
}
```

```go
// external-project/main.go
package main

import "myproject/internal/utils"  // ERROR - cannot import internal

func main() {
    utils.FormatName("john")
}
```

## Module System (go.mod)

### Creating a Module

```bash
go mod init github.com/username/myproject
```

Creates `go.mod`:
```
module github.com/username/myproject

go 1.22
```

### Adding Dependencies

```bash
go get github.com/gin-gonic/gin
```

Updates `go.mod`:
```
module github.com/username/myproject

go 1.22

require github.com/gin-gonic/gin v1.9.1
```

### Using Dependencies

```go
package main

import (
    "github.com/gin-gonic/gin"
)

func main() {
    r := gin.Default()
    r.GET("/", func(c *gin.Context) {
        c.JSON(200, gin.H{"message": "Hello"})
    })
    r.Run()
}
```

## Project Structure Best Practices

### Standard Layout

```
myproject/
├── go.mod
├── go.sum
├── main.go
├── README.md
├── cmd/                    # Main applications
│   ├── server/
│   │   └── main.go
│   └── worker/
│       └── main.go
├── internal/               # Private code
│   ├── config/
│   ├── database/
│   └── middleware/
├── pkg/                    # Public libraries
│   └── utils/
├── api/                    # API definitions
│   └── handlers/
├── models/                 # Data models
├── repository/             # Data access
├── service/                # Business logic
└── tests/                  # Additional tests
    └── integration/
```

### Domain-Driven Design Layout

```
myproject/
├── go.mod
├── main.go
├── user/                   # Domain: User
│   ├── user.go            # Domain model
│   ├── repository.go      # Data access interface
│   ├── service.go         # Business logic
│   └── handler.go         # HTTP handlers
├── product/                # Domain: Product
│   ├── product.go
│   ├── repository.go
│   ├── service.go
│   └── handler.go
└── infrastructure/         # Infrastructure concerns
    ├── database/
    ├── cache/
    └── messaging/
```

### Practical Example

```
ecommerce/
├── go.mod
├── cmd/
│   └── api/
│       └── main.go
├── internal/
│   ├── config/
│   │   └── config.go
│   ├── database/
│   │   └── postgres.go
│   └── middleware/
│       ├── auth.go
│       └── logging.go
├── user/
│   ├── model.go
│   ├── repository.go
│   ├── service.go
│   └── handler.go
└── product/
    ├── model.go
    ├── repository.go
    ├── service.go
    └── handler.go
```

```go
// user/model.go
package user

type User struct {
    ID    int
    Name  string
    Email string
}
```

```go
// user/repository.go
package user

import "context"

type Repository interface {
    GetByID(ctx context.Context, id int) (*User, error)
    Create(ctx context.Context, user *User) error
}
```

```go
// user/service.go
package user

import (
    "context"
    "errors"
)

type Service struct {
    repo Repository
}

func NewService(repo Repository) *Service {
    return &Service{repo: repo}
}

func (s *Service) GetUser(ctx context.Context, id int) (*User, error) {
    return s.repo.GetByID(ctx, id)
}

func (s *Service) CreateUser(ctx context.Context, name, email string) (*User, error) {
    if name == "" || email == "" {
        return nil, errors.New("name and email required")
    }
    
    user := &User{Name: name, Email: email}
    if err := s.repo.Create(ctx, user); err != nil {
        return nil, err
    }
    
    return user, nil
}
```

```go
// user/handler.go
package user

import (
    "encoding/json"
    "net/http"
    "strconv"
)

type Handler struct {
    service *Service
}

func NewHandler(service *Service) *Handler {
    return &Handler{service: service}
}

func (h *Handler) GetUser(w http.ResponseWriter, r *http.Request) {
    id, _ := strconv.Atoi(r.URL.Query().Get("id"))
    
    user, err := h.service.GetUser(r.Context(), id)
    if err != nil {
        http.Error(w, err.Error(), http.StatusNotFound)
        return
    }
    
    json.NewEncoder(w).Encode(user)
}
```

```go
// cmd/api/main.go
package main

import (
    "log"
    "net/http"
    
    "ecommerce/user"
    "ecommerce/internal/database"
)

func main() {
    // Setup
    db := database.Connect()
    userRepo := user.NewRepository(db)
    userService := user.NewService(userRepo)
    userHandler := user.NewHandler(userService)
    
    // Routes
    http.HandleFunc("/users", userHandler.GetUser)
    
    // Start
    log.Println("Server starting on :8080")
    log.Fatal(http.ListenAndServe(":8080", nil))
}
```

## Vendor Directory

Copy dependencies into project:

```bash
go mod vendor
```

Creates `vendor/` directory with dependencies.

## Best Practices

### 1. Package Naming

```go
// GOOD - short, lowercase, no underscores
package user
package http
package json

// BAD
package user_management
package HTTP
package myPackage
```

### 2. One Concern Per Package

```go
// GOOD - focused packages
package user
package product
package payment

// BAD - god package
package everything
```

### 3. Avoid Circular Dependencies

```go
// BAD - circular dependency
package A imports package B
package B imports package A

// GOOD - introduce third package
package A imports package C
package B imports package C
package C // Common dependencies
```

### 4. Export Only What's Needed

```go
package user

// Exported - part of public API
type User struct {
    ID int
}

// Unexported - internal implementation
type userCache struct {
    data map[int]*User
}
```

### 5. Use Internal Packages

```
myproject/
└── internal/         # Private to this module
    └── utils/
```

## Summary

- **Packages**: Organize code into reusable units
- **Exports**: Capitalized names are public
- **Imports**: Use standard library and third-party packages
- **Modules**: Dependency management with go.mod
- **Structure**: Organize by domain or layer
- **Internal**: Private packages with internal/

Essential for building maintainable, scalable Go applications.
