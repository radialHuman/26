# Functions in Go

## What are Functions?

Functions are reusable blocks of code that perform specific tasks. They are fundamental building blocks in Go programming, enabling code organization, reusability, and modularity.

## Why are Functions Important?

- **Code Reusability**: Write once, use many times
- **Modularity**: Break complex problems into smaller pieces
- **Testability**: Isolate functionality for testing
- **Maintainability**: Easier to update and debug
- **Abstraction**: Hide implementation details
- **Organization**: Structure code logically

## Basic Function Declaration

```go
package main

import "fmt"

// Basic function with no parameters and no return value
func sayHello() {
    fmt.Println("Hello!")
}

// Function with parameters
func greet(name string) {
    fmt.Println("Hello,", name)
}

// Function with return value
func add(a, b int) int {
    return a + b
}

// Function with multiple parameters of same type
func multiply(x, y, z int) int {
    return x * y * z
}

// Function with multiple parameters of different types
func createUser(name string, age int, active bool) {
    fmt.Printf("User: %s, Age: %d, Active: %t\n", name, age, active)
}

func main() {
    sayHello()
    greet("Alice")
    result := add(5, 3)
    fmt.Println("Sum:", result)
    
    product := multiply(2, 3, 4)
    fmt.Println("Product:", product)
    
    createUser("Bob", 30, true)
}
```

## Multiple Return Values

One of Go's most powerful features is the ability to return multiple values.

```go
package main

import (
    "errors"
    "fmt"
)

// Multiple return values
func divide(a, b float64) (float64, error) {
    if b == 0 {
        return 0, errors.New("division by zero")
    }
    return a / b, nil
}

// Multiple return values of same type
func getCoordinates() (int, int) {
    return 10, 20
}

// Named return values (implicitly declared)
func rectangleArea(width, height float64) (area float64) {
    area = width * height
    return  // Naked return (returns named values)
}

// Multiple named return values
func getUserInfo() (name string, age int, active bool) {
    name = "Alice"
    age = 25
    active = true
    return  // Returns all named values
}

func main() {
    // Handle multiple returns
    result, err := divide(10, 2)
    if err != nil {
        fmt.Println("Error:", err)
        return
    }
    fmt.Println("Result:", result)
    
    // Ignore return value with _
    _, err = divide(10, 0)
    if err != nil {
        fmt.Println("Error occurred:", err)
    }
    
    x, y := getCoordinates()
    fmt.Printf("X: %d, Y: %d\n", x, y)
    
    area := rectangleArea(5, 10)
    fmt.Println("Area:", area)
    
    name, age, active := getUserInfo()
    fmt.Printf("Name: %s, Age: %d, Active: %t\n", name, age, active)
}
```

## Variadic Functions

Functions that accept variable number of arguments.

```go
package main

import "fmt"

// Variadic function
func sum(numbers ...int) int {
    total := 0
    for _, num := range numbers {
        total += num
    }
    return total
}

// Variadic with other parameters (variadic must be last)
func createMessage(prefix string, words ...string) string {
    message := prefix + ": "
    for i, word := range words {
        if i > 0 {
            message += " "
        }
        message += word
    }
    return message
}

// Printf-style variadic function
func log(format string, args ...interface{}) {
    fmt.Printf("[LOG] "+format+"\n", args...)
}

func main() {
    // Call with different number of arguments
    fmt.Println(sum())                    // 0
    fmt.Println(sum(1))                   // 1
    fmt.Println(sum(1, 2, 3))            // 6
    fmt.Println(sum(1, 2, 3, 4, 5))      // 15
    
    // Spread slice into variadic function
    numbers := []int{10, 20, 30}
    fmt.Println(sum(numbers...))          // 60
    
    msg := createMessage("Status", "Server", "is", "running")
    fmt.Println(msg)  // Status: Server is running
    
    log("User %s logged in at %d", "Alice", 1234567890)
}
```

## Anonymous Functions and Closures

```go
package main

import "fmt"

func main() {
    // Anonymous function assigned to variable
    add := func(a, b int) int {
        return a + b
    }
    fmt.Println(add(3, 4))  // 7
    
    // Immediately invoked function
    result := func(x, y int) int {
        return x * y
    }(5, 6)
    fmt.Println(result)  // 30
    
    // Closure - captures variables from outer scope
    counter := 0
    increment := func() int {
        counter++
        return counter
    }
    
    fmt.Println(increment())  // 1
    fmt.Println(increment())  // 2
    fmt.Println(increment())  // 3
    fmt.Println(counter)      // 3
    
    // Closure factory
    multiplier := makeMultiplier(10)
    fmt.Println(multiplier(5))   // 50
    fmt.Println(multiplier(3))   // 30
}

func makeMultiplier(factor int) func(int) int {
    return func(n int) func(n int) int {
        return n * factor
    }
}
```

## Defer Statement

`defer` schedules a function call to execute after the surrounding function returns.

```go
package main

import (
    "fmt"
    "os"
)

func main() {
    // Basic defer
    defer fmt.Println("World")
    fmt.Println("Hello")
    // Output:
    // Hello
    // World
    
    // Multiple defers (LIFO - Last In First Out)
    defer fmt.Println("1")
    defer fmt.Println("2")
    defer fmt.Println("3")
    // Output: 3, 2, 1
    
    // Defer with function call
    processFile()
}

func processFile() {
    file, err := os.Open("data.txt")
    if err != nil {
        fmt.Println("Error:", err)
        return
    }
    defer file.Close()  // Ensures file is closed when function exits
    
    // Work with file...
    // Even if error occurs, file.Close() will be called
}

// Defer captures arguments immediately
func deferArguments() {
    x := 10
    defer fmt.Println(x)  // Captures x=10
    x = 20
    // Prints: 10 (not 20)
}

// Defer with closure
func deferClosure() {
    x := 10
    defer func() {
        fmt.Println(x)  // Closure, captures reference
    }()
    x = 20
    // Prints: 20
}
```

## Panic and Recover

```go
package main

import "fmt"

func main() {
    // Panic stops normal execution
    safeDivide(10, 2)
    safeDivide(10, 0)  // Will panic but recover
    fmt.Println("Program continues...")
}

func safeDivide(a, b int) {
    defer func() {
        if r := recover(); r != nil {
            fmt.Println("Recovered from:", r)
        }
    }()
    
    fmt.Println("Result:", divide(a, b))
}

func divide(a, b int) int {
    if b == 0 {
        panic("division by zero")
    }
    return a / b
}

// Panic with defer cleanup
func processData() {
    file, _ := os.Open("data.txt")
    defer func() {
        file.Close()
        if r := recover(); r != nil {
            fmt.Println("Recovered and cleaned up:", r)
        }
    }()
    
    // Code that might panic
    // File will still be closed
}
```

## Function Types and Higher-Order Functions

```go
package main

import "fmt"

// Function type declaration
type MathOperation func(int, int) int

// Function that takes function as parameter
func apply(a, b int, op MathOperation) int {
    return op(a, b)
}

// Function that returns function
func getOperation(name string) MathOperation {
    switch name {
    case "add":
        return func(a, b int) int { return a + b }
    case "multiply":
        return func(a, b int) int { return a * b }
    default:
        return func(a, b int) int { return 0 }
    }
}

func main() {
    // Pass function as argument
    add := func(a, b int) int { return a + b }
    result := apply(5, 3, add)
    fmt.Println("Result:", result)  // 8
    
    // Get function from function
    operation := getOperation("multiply")
    fmt.Println(operation(4, 5))  // 20
    
    // Map, Filter, Reduce patterns
    numbers := []int{1, 2, 3, 4, 5}
    
    doubled := mapInt(numbers, func(n int) int {
        return n * 2
    })
    fmt.Println("Doubled:", doubled)  // [2 4 6 8 10]
    
    evens := filterInt(numbers, func(n int) bool {
        return n%2 == 0
    })
    fmt.Println("Evens:", evens)  // [2 4]
    
    sum := reduceInt(numbers, 0, func(acc, n int) int {
        return acc + n
    })
    fmt.Println("Sum:", sum)  // 15
}

func mapInt(arr []int, fn func(int) int) []int {
    result := make([]int, len(arr))
    for i, v := range arr {
        result[i] = fn(v)
    }
    return result
}

func filterInt(arr []int, fn func(int) bool) []int {
    var result []int
    for _, v := range arr {
        if fn(v) {
            result = append(result, v)
        }
    }
    return result
}

func reduceInt(arr []int, initial int, fn func(int, int) int) int {
    result := initial
    for _, v := range arr {
        result = fn(result, v)
    }
    return result
}
```

## Recursive Functions

```go
package main

import "fmt"

// Factorial using recursion
func factorial(n int) int {
    if n <= 1 {
        return 1
    }
    return n * factorial(n-1)
}

// Fibonacci using recursion
func fibonacci(n int) int {
    if n <= 1 {
        return n
    }
    return fibonacci(n-1) + fibonacci(n-2)
}

// Fibonacci with memoization (optimization)
func fibonacciMemo(n int, memo map[int]int) int {
    if n <= 1 {
        return n
    }
    
    if val, exists := memo[n]; exists {
        return val
    }
    
    memo[n] = fibonacciMemo(n-1, memo) + fibonacciMemo(n-2, memo)
    return memo[n]
}

// Tree traversal
type TreeNode struct {
    Value int
    Left  *TreeNode
    Right *TreeNode
}

func (t *TreeNode) InorderTraversal(visit func(int)) {
    if t == nil {
        return
    }
    t.Left.InorderTraversal(visit)
    visit(t.Value)
    t.Right.InorderTraversal(visit)
}

func main() {
    fmt.Println("Factorial(5):", factorial(5))  // 120
    fmt.Println("Fibonacci(10):", fibonacci(10))  // 55
    
    memo := make(map[int]int)
    fmt.Println("Fibonacci(40):", fibonacciMemo(40, memo))  // Fast with memoization
}
```

## init Function

Special function that runs before main.

```go
package main

import "fmt"

var config map[string]string

// init runs automatically before main
func init() {
    fmt.Println("Initializing...")
    config = make(map[string]string)
    config["host"] = "localhost"
    config["port"] = "8080"
}

// Multiple init functions execute in order
func init() {
    fmt.Println("Second init")
}

func main() {
    fmt.Println("Main function")
    fmt.Println("Config:", config)
}

// Output:
// Initializing...
// Second init
// Main function
// Config: map[host:localhost port:8080]
```

## Practical Backend Examples

### Example 1: HTTP Handler Pattern

```go
package api

import (
    "encoding/json"
    "net/http"
)

type Response struct {
    Success bool        `json:"success"`
    Data    interface{} `json:"data,omitempty"`
    Error   string      `json:"error,omitempty"`
}

// Handler function type
type HandlerFunc func(w http.ResponseWriter, r *http.Request) error

// Wrapper that handles errors
func ErrorHandler(h HandlerFunc) http.HandlerFunc {
    return func(w http.ResponseWriter, r *http.Request) {
        if err := h(w, r); err != nil {
            respondError(w, err)
        }
    }
}

// Business logic handlers
func GetUserHandler(w http.ResponseWriter, r *http.Request) error {
    userID := r.URL.Query().Get("id")
    if userID == "" {
        return NewBadRequestError("user ID required")
    }
    
    user, err := fetchUser(userID)
    if err != nil {
        return err
    }
    
    return respondJSON(w, http.StatusOK, Response{
        Success: true,
        Data:    user,
    })
}

func CreateUserHandler(w http.ResponseWriter, r *http.Request) error {
    var user User
    if err := json.NewDecoder(r.Body).Decode(&user); err != nil {
        return NewBadRequestError("invalid request body")
    }
    
    if err := user.Validate(); err != nil {
        return err
    }
    
    if err := saveUser(&user); err != nil {
        return err
    }
    
    return respondJSON(w, http.StatusCreated, Response{
        Success: true,
        Data:    user,
    })
}

func respondJSON(w http.ResponseWriter, status int, data interface{}) error {
    w.Header().Set("Content-Type", "application/json")
    w.WriteHeader(status)
    return json.NewEncoder(w).Encode(data)
}

func respondError(w http.ResponseWriter, err error) {
    // Error handling logic
}

type User struct{ ID string }
func (u *User) Validate() error { return nil }
func fetchUser(id string) (*User, error) { return nil, nil }
func saveUser(u *User) error { return nil }
func NewBadRequestError(msg string) error { return errors.New(msg) }
```

### Example 2: Middleware Pattern

```go
package middleware

import (
    "log"
    "net/http"
    "time"
)

type Middleware func(http.Handler) http.Handler

// Logging middleware
func LoggingMiddleware(next http.Handler) http.Handler {
    return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
        start := time.Now()
        
        // Call next handler
        next.ServeHTTP(w, r)
        
        log.Printf("%s %s %v", r.Method, r.URL.Path, time.Since(start))
    })
}

// Authentication middleware
func AuthMiddleware(next http.Handler) http.Handler {
    return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
        token := r.Header.Get("Authorization")
        if token == "" {
            http.Error(w, "Unauthorized", http.StatusUnauthorized)
            return
        }
        
        // Validate token...
        next.ServeHTTP(w, r)
    })
}

// Recovery middleware
func RecoveryMiddleware(next http.Handler) http.Handler {
    return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
        defer func() {
            if err := recover(); err != nil {
                log.Printf("Panic: %v", err)
                http.Error(w, "Internal Server Error", http.StatusInternalServerError)
            }
        }()
        next.ServeHTTP(w, r)
    })
}

// Chain multiple middlewares
func Chain(h http.Handler, middlewares ...Middleware) http.Handler {
    for i := len(middlewares) - 1; i >= 0; i-- {
        h = middlewares[i](h)
    }
    return h
}

// Usage
func main() {
    handler := http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
        w.Write([]byte("Hello"))
    })
    
    wrapped := Chain(handler,
        RecoveryMiddleware,
        LoggingMiddleware,
        AuthMiddleware,
    )
    
    http.ListenAndServe(":8080", wrapped)
}
```

### Example 3: Database Repository Pattern

```go
package repository

import (
    "database/sql"
    "fmt"
)

type User struct {
    ID    int
    Name  string
    Email string
}

// Repository interface
type UserRepository interface {
    Create(user *User) error
    FindByID(id int) (*User, error)
    FindAll() ([]*User, error)
    Update(user *User) error
    Delete(id int) error
}

// Implementation
type userRepository struct {
    db *sql.DB
}

func NewUserRepository(db *sql.DB) UserRepository {
    return &userRepository{db: db}
}

func (r *userRepository) Create(user *User) error {
    query := "INSERT INTO users (name, email) VALUES ($1, $2) RETURNING id"
    return r.db.QueryRow(query, user.Name, user.Email).Scan(&user.ID)
}

func (r *userRepository) FindByID(id int) (*User, error) {
    user := &User{}
    query := "SELECT id, name, email FROM users WHERE id = $1"
    err := r.db.QueryRow(query, id).Scan(&user.ID, &user.Name, &user.Email)
    if err != nil {
        return nil, err
    }
    return user, nil
}

func (r *userRepository) FindAll() ([]*User, error) {
    query := "SELECT id, name, email FROM users"
    rows, err := r.db.Query(query)
    if err != nil {
        return nil, err
    }
    defer rows.Close()
    
    var users []*User
    for rows.Next() {
        user := &User{}
        if err := rows.Scan(&user.ID, &user.Name, &user.Email); err != nil {
            return nil, err
        }
        users = append(users, user)
    }
    
    return users, rows.Err()
}

func (r *userRepository) Update(user *User) error {
    query := "UPDATE users SET name = $1, email = $2 WHERE id = $3"
    _, err := r.db.Exec(query, user.Name, user.Email, user.ID)
    return err
}

func (r *userRepository) Delete(id int) error {
    query := "DELETE FROM users WHERE id = $1"
    _, err := r.db.Exec(query, id)
    return err
}
```

### Example 4: Service Layer with Business Logic

```go
package service

import (
    "errors"
    "fmt"
)

type UserService struct {
    repo UserRepository
}

func NewUserService(repo UserRepository) *UserService {
    return &UserService{repo: repo}
}

func (s *UserService) RegisterUser(name, email string) (*User, error) {
    // Validation
    if err := validateEmail(email); err != nil {
        return nil, err
    }
    
    // Check if user exists
    existing, _ := s.repo.FindByEmail(email)
    if existing != nil {
        return nil, errors.New("user already exists")
    }
    
    // Create user
    user := &User{
        Name:  name,
        Email: email,
    }
    
    if err := s.repo.Create(user); err != nil {
        return nil, fmt.Errorf("failed to create user: %w", err)
    }
    
    // Send welcome email (async)
    go s.sendWelcomeEmail(user)
    
    return user, nil
}

func (s *UserService) GetUserProfile(userID int) (*UserProfile, error) {
    user, err := s.repo.FindByID(userID)
    if err != nil {
        return nil, err
    }
    
    // Fetch additional data
    orders, _ := s.fetchUserOrders(userID)
    
    return &UserProfile{
        User:       user,
        OrderCount: len(orders),
    }, nil
}

func (s *UserService) sendWelcomeEmail(user *User) {
    // Email sending logic
}

func (s *UserService) fetchUserOrders(userID int) ([]Order, error) {
    // Fetch orders
    return nil, nil
}

func validateEmail(email string) error {
    // Email validation
    return nil
}

type UserProfile struct {
    User       *User
    OrderCount int
}

type Order struct{}
```

### Example 5: Options Pattern (Functional Options)

```go
package config

import "time"

type Server struct {
    host         string
    port         int
    timeout      time.Duration
    maxConns     int
    enableLogging bool
}

// Option is a function that modifies Server
type Option func(*Server)

// Default values
func NewServer(opts ...Option) *Server {
    // Default configuration
    s := &Server{
        host:         "localhost",
        port:         8080,
        timeout:      30 * time.Second,
        maxConns:     100,
        enableLogging: false,
    }
    
    // Apply options
    for _, opt := range opts {
        opt(s)
    }
    
    return s
}

// Option functions
func WithHost(host string) Option {
    return func(s *Server) {
        s.host = host
    }
}

func WithPort(port int) Option {
    return func(s *Server) {
        s.port = port
    }
}

func WithTimeout(timeout time.Duration) Option {
    return func(s *Server) {
        s.timeout = timeout
    }
}

func WithMaxConnections(max int) Option {
    return func(s *Server) {
        s.maxConns = max
    }
}

func WithLogging() Option {
    return func(s *Server) {
        s.enableLogging = true
    }
}

// Usage
func main() {
    // Use defaults
    server1 := NewServer()
    
    // Customize
    server2 := NewServer(
        WithHost("0.0.0.0"),
        WithPort(3000),
        WithTimeout(60*time.Second),
        WithLogging(),
    )
    
    fmt.Printf("Server 1: %+v\n", server1)
    fmt.Printf("Server 2: %+v\n", server2)
}
```

## Best Practices

### 1. Keep Functions Small and Focused

```go
// GOOD - Single responsibility
func validateUser(user *User) error {
    if user.Name == "" {
        return errors.New("name required")
    }
    return nil
}

func saveUser(db *sql.DB, user *User) error {
    // Save logic
    return nil
}

// AVOID - Doing too much
func validateAndSaveUser(db *sql.DB, user *User) error {
    // Validation and saving mixed
}
```

### 2. Use Named Return Values for Documentation

```go
// Clear what's being returned
func divide(a, b float64) (result float64, err error) {
    if b == 0 {
        err = errors.New("division by zero")
        return
    }
    result = a / b
    return
}
```

### 3. Defer for Cleanup

```go
func processFile(filename string) error {
    file, err := os.Open(filename)
    if err != nil {
        return err
    }
    defer file.Close()  // Always closes, even on error
    
    // Process file...
    return nil
}
```

### 4. Use Variadic Functions for Flexibility

```go
func log(level string, messages ...string) {
    for _, msg := range messages {
        fmt.Printf("[%s] %s\n", level, msg)
    }
}
```

### 5. Return Errors, Don't Panic

```go
// GOOD
func divide(a, b int) (int, error) {
    if b == 0 {
        return 0, errors.New("division by zero")
    }
    return a / b, nil
}

// AVOID (unless truly exceptional)
func divide(a, b int) int {
    if b == 0 {
        panic("division by zero")
    }
    return a / b
}
```

## Common Pitfalls

### 1. Defer in Loops

```go
// WRONG - defers accumulate
func processFiles(files []string) {
    for _, file := range files {
        f, _ := os.Open(file)
        defer f.Close()  // All close at end of function
    }
}

// CORRECT - use separate function
func processFiles(files []string) {
    for _, file := range files {
        processFile(file)
    }
}

func processFile(filename string) {
    f, _ := os.Open(filename)
    defer f.Close()  // Closes when this function returns
    // Process file
}
```

### 2. Naked Returns in Long Functions

```go
// AVOID - confusing in long functions
func complex() (x int, y int) {
    // 50 lines of code...
    x = 10
    // 50 more lines...
    y = 20
    return  // What's being returned?
}

// BETTER
func complex() (x int, y int) {
    // Code...
    x = 10
    y = 20
    return x, y  // Explicit
}
```

## Summary

Go functions provide:
- Multiple return values (especially for errors)
- First-class functions (can be passed around)
- Closures (capture surrounding state)
- Defer for guaranteed cleanup
- Variadic parameters for flexibility
- Named returns for clarity

Master these patterns for effective Go backend development.
