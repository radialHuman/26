# Control Structures in Go

## What are Control Structures?

Control structures are programming constructs that control the flow of execution in a program. They determine which code blocks run, how many times they run, and under what conditions.

## Why are Control Structures Important?

- **Program Logic**: Implement business rules and decision-making
- **Flow Control**: Direct execution based on conditions
- **Iteration**: Process collections and repeat operations
- **Error Handling**: Handle different scenarios and edge cases
- **Performance**: Optimize execution paths
- **Code Organization**: Structure complex logic clearly

## if/else Statements

### Basic if Statement

```go
package main

import "fmt"

func main() {
    age := 18
    
    // Simple if
    if age >= 18 {
        fmt.Println("Adult")
    }
    
    // if with else
    if age >= 18 {
        fmt.Println("Adult")
    } else {
        fmt.Println("Minor")
    }
    
    // if-else if-else chain
    score := 85
    if score >= 90 {
        fmt.Println("A")
    } else if score >= 80 {
        fmt.Println("B")
    } else if score >= 70 {
        fmt.Println("C")
    } else {
        fmt.Println("F")
    }
}
```

### if with Initialization Statement

One of Go's unique features is the ability to include an initialization statement in if conditions.

```go
package main

import (
    "fmt"
    "math/rand"
)

func main() {
    // Variable scope limited to if block
    if num := rand.Intn(10); num%2 == 0 {
        fmt.Printf("%d is even\n", num)
    } else {
        fmt.Printf("%d is odd\n", num)
    }
    // num is not accessible here
    
    // Practical example: error handling
    if err := doSomething(); err != nil {
        fmt.Println("Error:", err)
        return
    }
    fmt.Println("Success!")
}

func doSomething() error {
    return nil  // or return an error
}
```

### Practical Examples

#### Example 1: HTTP Request Validation

```go
package api

import (
    "errors"
    "net/http"
)

func validateRequest(r *http.Request) error {
    // Check authentication
    if token := r.Header.Get("Authorization"); token == "" {
        return errors.New("missing authorization token")
    }
    
    // Check content type
    if ct := r.Header.Get("Content-Type"); ct != "application/json" {
        return errors.New("invalid content type")
    }
    
    // Check method
    if r.Method != http.MethodPost {
        return errors.New("only POST method allowed")
    }
    
    return nil
}

func handleRequest(w http.ResponseWriter, r *http.Request) {
    if err := validateRequest(r); err != nil {
        http.Error(w, err.Error(), http.StatusBadRequest)
        return
    }
    
    // Process request
    w.WriteHeader(http.StatusOK)
}
```

#### Example 2: Database Query with Error Handling

```go
package db

import (
    "database/sql"
    "errors"
)

type User struct {
    ID   int
    Name string
}

func GetUser(db *sql.DB, id int) (*User, error) {
    user := &User{}
    
    // Query with initialization in if
    if err := db.QueryRow("SELECT id, name FROM users WHERE id = $1", id).
        Scan(&user.ID, &user.Name); err != nil {
        
        if errors.Is(err, sql.ErrNoRows) {
            return nil, errors.New("user not found")
        }
        return nil, err
    }
    
    return user, nil
}
```

#### Example 3: Configuration Validation

```go
package config

import (
    "errors"
    "os"
    "strconv"
)

type Config struct {
    Port     int
    DBHost   string
    CacheURL string
}

func LoadConfig() (*Config, error) {
    cfg := &Config{}
    
    // Port validation
    if portStr := os.Getenv("PORT"); portStr == "" {
        cfg.Port = 8080  // Default
    } else {
        if port, err := strconv.Atoi(portStr); err != nil {
            return nil, errors.New("invalid PORT value")
        } else if port < 1 || port > 65535 {
            return nil, errors.New("PORT out of range")
        } else {
            cfg.Port = port
        }
    }
    
    // Database host
    if dbHost := os.Getenv("DB_HOST"); dbHost == "" {
        return nil, errors.New("DB_HOST is required")
    } else {
        cfg.DBHost = dbHost
    }
    
    // Cache (optional)
    cfg.CacheURL = os.Getenv("CACHE_URL")
    
    return cfg, nil
}
```

## switch Statements

### Expression Switch

```go
package main

import (
    "fmt"
    "time"
)

func main() {
    // Basic switch
    day := time.Now().Weekday()
    
    switch day {
    case time.Saturday:
        fmt.Println("Weekend!")
    case time.Sunday:
        fmt.Println("Weekend!")
    case time.Monday:
        fmt.Println("Start of week")
    default:
        fmt.Println("Weekday")
    }
    
    // Switch with multiple values
    switch day {
    case time.Saturday, time.Sunday:
        fmt.Println("Weekend!")
    default:
        fmt.Println("Weekday")
    }
    
    // Switch with initialization
    switch today := time.Now().Weekday(); today {
    case time.Saturday, time.Sunday:
        fmt.Println("It's the weekend!")
    default:
        fmt.Printf("It's %v\n", today)
    }
    
    // Switch without condition (like if-else chain)
    hour := time.Now().Hour()
    switch {
    case hour < 12:
        fmt.Println("Morning")
    case hour < 17:
        fmt.Println("Afternoon")
    case hour < 21:
        fmt.Println("Evening")
    default:
        fmt.Println("Night")
    }
}
```

### fallthrough Keyword

```go
package main

import "fmt"

func main() {
    num := 2
    
    switch num {
    case 1:
        fmt.Println("One")
    case 2:
        fmt.Println("Two")
        fallthrough  // Continue to next case
    case 3:
        fmt.Println("Three or fallthrough from Two")
    default:
        fmt.Println("Other")
    }
    // Output:
    // Two
    // Three or fallthrough from Two
}
```

### Type Switch

```go
package main

import "fmt"

func processValue(i interface{}) {
    switch v := i.(type) {
    case int:
        fmt.Printf("Integer: %d\n", v)
    case string:
        fmt.Printf("String: %s (length: %d)\n", v, len(v))
    case bool:
        fmt.Printf("Boolean: %t\n", v)
    case []int:
        fmt.Printf("Int slice: %v (length: %d)\n", v, len(v))
    case map[string]interface{}:
        fmt.Printf("Map with %d keys\n", len(v))
    case nil:
        fmt.Println("Nil value")
    default:
        fmt.Printf("Unknown type: %T\n", v)
    }
}

func main() {
    processValue(42)
    processValue("hello")
    processValue(true)
    processValue([]int{1, 2, 3})
    processValue(map[string]interface{}{"key": "value"})
    processValue(nil)
    processValue(3.14)
}
```

### Practical Examples

#### Example 1: HTTP Status Code Handling

```go
package api

import (
    "fmt"
    "net/http"
)

func handleResponse(statusCode int) string {
    switch statusCode {
    case http.StatusOK:
        return "Success"
    case http.StatusCreated:
        return "Resource created"
    case http.StatusNoContent:
        return "No content"
    case http.StatusBadRequest:
        return "Bad request"
    case http.StatusUnauthorized:
        return "Unauthorized"
    case http.StatusForbidden:
        return "Forbidden"
    case http.StatusNotFound:
        return "Not found"
    case http.StatusInternalServerError:
        return "Internal server error"
    default:
        return fmt.Sprintf("Status code: %d", statusCode)
    }
}

// Switch with ranges (using switch without condition)
func categorizeStatus(code int) string {
    switch {
    case code >= 200 && code < 300:
        return "Success"
    case code >= 300 && code < 400:
        return "Redirection"
    case code >= 400 && code < 500:
        return "Client error"
    case code >= 500 && code < 600:
        return "Server error"
    default:
        return "Unknown"
    }
}
```

#### Example 2: Request Router

```go
package router

import (
    "net/http"
)

func RouteHandler(w http.ResponseWriter, r *http.Request) {
    switch {
    case r.URL.Path == "/" && r.Method == http.MethodGet:
        homeHandler(w, r)
    case r.URL.Path == "/users" && r.Method == http.MethodGet:
        listUsersHandler(w, r)
    case r.URL.Path == "/users" && r.Method == http.MethodPost:
        createUserHandler(w, r)
    case r.URL.Path == "/login" && r.Method == http.MethodPost:
        loginHandler(w, r)
    default:
        http.NotFound(w, r)
    }
}

func homeHandler(w http.ResponseWriter, r *http.Request) {
    w.Write([]byte("Home"))
}

func listUsersHandler(w http.ResponseWriter, r *http.Request) {
    w.Write([]byte("User list"))
}

func createUserHandler(w http.ResponseWriter, r *http.Request) {
    w.Write([]byte("User created"))
}

func loginHandler(w http.ResponseWriter, r *http.Request) {
    w.Write([]byte("Login"))
}
```

#### Example 3: JSON Response Handler

```go
package api

import (
    "encoding/json"
    "net/http"
)

type Response struct {
    Data    interface{} `json:"data,omitempty"`
    Error   string      `json:"error,omitempty"`
    Message string      `json:"message,omitempty"`
}

func sendResponse(w http.ResponseWriter, statusCode int, data interface{}, err error) {
    w.Header().Set("Content-Type", "application/json")
    w.WriteHeader(statusCode)
    
    var resp Response
    
    switch {
    case err != nil && statusCode >= 400:
        resp.Error = err.Error()
    case statusCode == http.StatusOK && data != nil:
        resp.Data = data
        resp.Message = "Success"
    case statusCode == http.StatusCreated:
        resp.Data = data
        resp.Message = "Resource created"
    case statusCode == http.StatusNoContent:
        // No response body
        return
    default:
        resp.Message = http.StatusText(statusCode)
    }
    
    json.NewEncoder(w).Encode(resp)
}
```

## for Loops

Go has only one looping construct: `for`. However, it can be used in multiple ways.

### Traditional for Loop

```go
package main

import "fmt"

func main() {
    // Standard for loop
    for i := 0; i < 5; i++ {
        fmt.Println(i)
    }
    
    // Multiple variables
    for i, j := 0, 10; i < j; i, j = i+1, j-1 {
        fmt.Printf("i=%d, j=%d\n", i, j)
    }
}
```

### While-Style Loop

```go
package main

import "fmt"

func main() {
    // While-style loop
    count := 0
    for count < 5 {
        fmt.Println(count)
        count++
    }
    
    // Infinite loop (like while(true))
    counter := 0
    for {
        if counter >= 5 {
            break
        }
        fmt.Println(counter)
        counter++
    }
}
```

### Range Loop

```go
package main

import "fmt"

func main() {
    // Range over slice
    numbers := []int{10, 20, 30, 40, 50}
    for index, value := range numbers {
        fmt.Printf("Index: %d, Value: %d\n", index, value)
    }
    
    // Range with index only
    for index := range numbers {
        fmt.Printf("Index: %d\n", index)
    }
    
    // Range with value only (use _ for index)
    for _, value := range numbers {
        fmt.Printf("Value: %d\n", value)
    }
    
    // Range over map
    users := map[string]int{
        "Alice": 25,
        "Bob":   30,
        "Charlie": 35,
    }
    for name, age := range users {
        fmt.Printf("%s is %d years old\n", name, age)
    }
    
    // Range over string (iterates over runes)
    text := "Hello, 世界"
    for index, char := range text {
        fmt.Printf("Index: %d, Char: %c\n", index, char)
    }
    
    // Range over channel
    ch := make(chan int, 3)
    ch <- 1
    ch <- 2
    ch <- 3
    close(ch)
    
    for value := range ch {
        fmt.Println(value)
    }
}
```

### break and continue

```go
package main

import "fmt"

func main() {
    // break exits the loop
    for i := 0; i < 10; i++ {
        if i == 5 {
            break  // Exit loop when i is 5
        }
        fmt.Println(i)
    }
    
    // continue skips to next iteration
    for i := 0; i < 10; i++ {
        if i%2 == 0 {
            continue  // Skip even numbers
        }
        fmt.Println(i)  // Only prints odd numbers
    }
    
    // Labeled break (break outer loop)
outer:
    for i := 0; i < 3; i++ {
        for j := 0; j < 3; j++ {
            if i == 1 && j == 1 {
                break outer  // Break outer loop
            }
            fmt.Printf("i=%d, j=%d\n", i, j)
        }
    }
    
    // Labeled continue
outer2:
    for i := 0; i < 3; i++ {
        for j := 0; j < 3; j++ {
            if j == 1 {
                continue outer2  // Continue outer loop
            }
            fmt.Printf("i=%d, j=%d\n", i, j)
        }
    }
}
```

### Practical Examples

#### Example 1: Processing Database Rows

```go
package db

import (
    "database/sql"
    "fmt"
)

type User struct {
    ID   int
    Name string
}

func GetAllUsers(db *sql.DB) ([]User, error) {
    rows, err := db.Query("SELECT id, name FROM users")
    if err != nil {
        return nil, err
    }
    defer rows.Close()
    
    var users []User
    
    // Iterate over database rows
    for rows.Next() {
        var user User
        if err := rows.Scan(&user.ID, &user.Name); err != nil {
            // Log error but continue processing other rows
            fmt.Printf("Error scanning row: %v\n", err)
            continue
        }
        users = append(users, user)
    }
    
    // Check for errors during iteration
    if err := rows.Err(); err != nil {
        return nil, err
    }
    
    return users, nil
}
```

#### Example 2: Batch Processing

```go
package processor

import (
    "fmt"
    "time"
)

func ProcessBatch(items []string, batchSize int) {
    for i := 0; i < len(items); i += batchSize {
        end := i + batchSize
        if end > len(items) {
            end = len(items)
        }
        
        batch := items[i:end]
        fmt.Printf("Processing batch %d-%d\n", i, end)
        
        // Process each item in batch
        for _, item := range batch {
            if err := processItem(item); err != nil {
                fmt.Printf("Error processing %s: %v\n", item, err)
                continue
            }
        }
        
        // Delay between batches
        if end < len(items) {
            time.Sleep(100 * time.Millisecond)
        }
    }
}

func processItem(item string) error {
    // Processing logic
    return nil
}
```

#### Example 3: Retry Logic

```go
package retry

import (
    "errors"
    "fmt"
    "time"
)

func RetryOperation(maxRetries int, delay time.Duration, operation func() error) error {
    var err error
    
    for attempt := 0; attempt < maxRetries; attempt++ {
        err = operation()
        
        if err == nil {
            // Success
            return nil
        }
        
        fmt.Printf("Attempt %d failed: %v\n", attempt+1, err)
        
        // Don't sleep after last attempt
        if attempt < maxRetries-1 {
            time.Sleep(delay)
            // Exponential backoff
            delay *= 2
        }
    }
    
    return fmt.Errorf("operation failed after %d attempts: %w", maxRetries, err)
}

// Usage example
func main() {
    operation := func() error {
        // Simulated operation that might fail
        return errors.New("temporary failure")
    }
    
    err := RetryOperation(3, 1*time.Second, operation)
    if err != nil {
        fmt.Println("Operation failed:", err)
    }
}
```

#### Example 4: Concurrent Worker Pool

```go
package workers

import (
    "fmt"
    "sync"
)

type Job struct {
    ID   int
    Data string
}

func ProcessJobs(jobs []Job, numWorkers int) {
    jobChan := make(chan Job, len(jobs))
    var wg sync.WaitGroup
    
    // Start workers
    for w := 0; w < numWorkers; w++ {
        wg.Add(1)
        go func(workerID int) {
            defer wg.Done()
            
            // Worker loop
            for job := range jobChan {
                fmt.Printf("Worker %d processing job %d\n", workerID, job.ID)
                processJob(job)
            }
        }(w)
    }
    
    // Send jobs to channel
    for _, job := range jobs {
        jobChan <- job
    }
    close(jobChan)
    
    // Wait for all workers to complete
    wg.Wait()
}

func processJob(job Job) {
    // Processing logic
}
```

## goto and Labels

While generally discouraged, `goto` can be useful in specific scenarios.

```go
package main

import "fmt"

func main() {
    // goto example (use sparingly)
    i := 0
loop:
    if i < 5 {
        fmt.Println(i)
        i++
        goto loop
    }
    
    // More practical use: error cleanup
    if err := step1(); err != nil {
        goto cleanup
    }
    
    if err := step2(); err != nil {
        goto cleanup
    }
    
    fmt.Println("All steps completed")
    return
    
cleanup:
    fmt.Println("Cleaning up resources")
    cleanupResources()
}

func step1() error { return nil }
func step2() error { return nil }
func cleanupResources() {}
```

## Best Practices

### 1. Use switch over long if-else chains

```go
// Good
switch status {
case "active":
    // ...
case "inactive":
    // ...
case "pending":
    // ...
}

// Avoid
if status == "active" {
    // ...
} else if status == "inactive" {
    // ...
} else if status == "pending" {
    // ...
}
```

### 2. Leverage if initialization for scope limitation

```go
// Good
if err := operation(); err != nil {
    return err
}

// Less ideal
err := operation()
if err != nil {
    return err
}
// err is still in scope here (unnecessary)
```

### 3. Use range for iteration when possible

```go
// Good
for i, v := range slice {
    // ...
}

// Avoid
for i := 0; i < len(slice); i++ {
    v := slice[i]
    // ...
}
```

### 4. Avoid goto except for cleanup

```go
// Acceptable use case
if err := acquireResource(); err != nil {
    goto cleanup
}
// ... more operations
cleanup:
    releaseResource()
```

## Common Pitfalls

### 1. Range Loop Variable Capture

```go
// WRONG
var funcs []func()
for _, v := range []int{1, 2, 3} {
    funcs = append(funcs, func() {
        fmt.Println(v)  // Captures loop variable (always 3)
    })
}

// CORRECT
var funcs []func()
for _, v := range []int{1, 2, 3} {
    v := v  // Create new variable
    funcs = append(funcs, func() {
        fmt.Println(v)  // Captures correct value
    })
}
```

### 2. Infinite Loops Without Break Condition

```go
// WRONG
for {
    // No break condition - runs forever
}

// CORRECT
for {
    if shouldStop() {
        break
    }
    // ... operations
}
```

## Summary

Go's control structures are:
- **Simple**: Only for loops, no while/do-while
- **Powerful**: Range, type switch, initialization in conditions
- **Clear**: Explicit flow control
- **Flexible**: Multiple loop styles with one keyword

Master these for effective Go programming.
