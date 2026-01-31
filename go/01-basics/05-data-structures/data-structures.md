# Data Structures in Go

## What are Data Structures?

Data structures are ways to organize and store data efficiently in Go programs. Go provides built-in data structures like arrays, slices, maps, and structs that are fundamental to building robust backend systems.

## Why are Data Structures Important?

- **Efficiency**: Choose the right structure for optimal performance
- **Organization**: Structure data logically
- **Memory Management**: Control memory usage
- **Type Safety**: Compile-time type checking
- **Scalability**: Handle growing data needs
- **API Design**: Model domain entities effectively

## Arrays

Fixed-size sequences of elements of the same type.

### Basic Arrays

```go
package main

import "fmt"

func main() {
    // Declaration with size
    var numbers [5]int
    fmt.Println(numbers)  // [0 0 0 0 0] - zero values
    
    // Declaration with initialization
    var fruits [3]string = [3]string{"apple", "banana", "orange"}
    fmt.Println(fruits)
    
    // Short declaration with initialization
    colors := [4]string{"red", "green", "blue", "yellow"}
    fmt.Println(colors)
    
    // Compiler determines size
    animals := [...]string{"dog", "cat", "bird"}
    fmt.Println(len(animals))  // 3
    
    // Access elements
    fmt.Println(colors[0])  // red
    colors[1] = "purple"
    fmt.Println(colors)     // [red purple blue yellow]
    
    // Iterate over array
    for i, color := range colors {
        fmt.Printf("%d: %s\n", i, color)
    }
}
```

### Array Characteristics

```go
package main

import "fmt"

func main() {
    // Arrays are values (not references)
    a := [3]int{1, 2, 3}
    b := a  // Copies the array
    b[0] = 100
    
    fmt.Println(a)  // [1 2 3] - unchanged
    fmt.Println(b)  // [100 2 3]
    
    // Array size is part of type
    var x [3]int
    var y [4]int
    // x = y  // ERROR: cannot assign [4]int to [3]int
    
    // Multidimensional arrays
    matrix := [2][3]int{
        {1, 2, 3},
        {4, 5, 6},
    }
    fmt.Println(matrix[0][1])  // 2
}
```

### When to Use Arrays

- Fixed-size collections
- Performance-critical code (no allocation overhead)
- Small, known-size datasets
- Matrix operations

**Limitation**: Size is fixed at compile time, cannot grow dynamically.

## Slices

Dynamic, flexible view into arrays. Most commonly used in Go.

### Creating Slices

```go
package main

import "fmt"

func main() {
    // Create slice from array
    arr := [5]int{1, 2, 3, 4, 5}
    slice1 := arr[1:4]  // [2 3 4] - elements 1,2,3
    
    // Slice literal (creates underlying array automatically)
    slice2 := []int{10, 20, 30, 40}
    
    // Using make function
    slice3 := make([]int, 5)       // length 5, capacity 5
    slice4 := make([]int, 3, 10)   // length 3, capacity 10
    
    // Nil slice
    var slice5 []int
    fmt.Println(slice5 == nil)  // true
    fmt.Println(len(slice5))    // 0
    
    // Empty slice (not nil)
    slice6 := []int{}
    fmt.Println(slice6 == nil)  // false
    fmt.Println(len(slice6))    // 0
}
```

### Slice Operations

```go
package main

import "fmt"

func main() {
    numbers := []int{1, 2, 3, 4, 5}
    
    // Length and capacity
    fmt.Println(len(numbers))  // 5
    fmt.Println(cap(numbers))  // 5
    
    // Append elements
    numbers = append(numbers, 6)
    fmt.Println(numbers)  // [1 2 3 4 5 6]
    
    // Append multiple elements
    numbers = append(numbers, 7, 8, 9)
    fmt.Println(numbers)  // [1 2 3 4 5 6 7 8 9]
    
    // Append another slice
    more := []int{10, 11, 12}
    numbers = append(numbers, more...)
    fmt.Println(numbers)
    
    // Slicing operations
    subset := numbers[2:5]    // [3 4 5]
    fmt.Println(subset)
    
    prefix := numbers[:3]     // [1 2 3]
    suffix := numbers[7:]     // [8 9 10 11 12]
    
    // Copy slices
    original := []int{1, 2, 3}
    copied := make([]int, len(original))
    copy(copied, original)
    copied[0] = 100
    
    fmt.Println(original)  // [1 2 3] - unchanged
    fmt.Println(copied)    // [100 2 3]
}
```

### Slice Internals

```go
package main

import "fmt"

func main() {
    // Slice is a descriptor: pointer, length, capacity
    slice := make([]int, 3, 5)
    fmt.Printf("Len: %d, Cap: %d\n", len(slice), cap(slice))
    // Len: 3, Cap: 5
    
    // Append beyond capacity triggers reallocation
    slice = append(slice, 1, 2, 3)  // Now needs 6 elements
    fmt.Printf("Len: %d, Cap: %d\n", len(slice), cap(slice))
    // Len: 6, Cap: 10 (capacity doubled)
    
    // Slices share underlying array
    original := []int{1, 2, 3, 4, 5}
    slice1 := original[1:4]  // [2 3 4]
    slice2 := original[2:5]  // [3 4 5]
    
    slice1[1] = 100  // Modifies original array
    fmt.Println(original)  // [1 2 100 4 5]
    fmt.Println(slice2)    // [100 4 5] - also affected
}
```

### Practical Slice Examples

#### Example 1: Dynamic List Management

```go
package main

import "fmt"

type User struct {
    ID   int
    Name string
}

type UserList struct {
    users []User
}

func (ul *UserList) Add(user User) {
    ul.users = append(ul.users, user)
}

func (ul *UserList) Remove(id int) {
    for i, user := range ul.users {
        if user.ID == id {
            // Remove by creating new slice without element
            ul.users = append(ul.users[:i], ul.users[i+1:]...)
            return
        }
    }
}

func (ul *UserList) Find(id int) *User {
    for _, user := range ul.users {
        if user.ID == id {
            return &user
        }
    }
    return nil
}

func (ul *UserList) GetAll() []User {
    // Return copy to prevent external modification
    result := make([]User, len(ul.users))
    copy(result, ul.users)
    return result
}

func main() {
    list := &UserList{}
    list.Add(User{ID: 1, Name: "Alice"})
    list.Add(User{ID: 2, Name: "Bob"})
    list.Add(User{ID: 3, Name: "Charlie"})
    
    list.Remove(2)
    users := list.GetAll()
    fmt.Println(users)  // [{1 Alice} {3 Charlie}]
}
```

#### Example 2: Batch Processing

```go
package processor

func ProcessInBatches(items []string, batchSize int, process func([]string) error) error {
    for i := 0; i < len(items); i += batchSize {
        end := i + batchSize
        if end > len(items) {
            end = len(items)
        }
        
        batch := items[i:end]
        if err := process(batch); err != nil {
            return err
        }
    }
    return nil
}

// Usage
func main() {
    items := []string{"a", "b", "c", "d", "e", "f", "g"}
    
    ProcessInBatches(items, 3, func(batch []string) error {
        fmt.Println("Processing:", batch)
        return nil
    })
    // Output:
    // Processing: [a b c]
    // Processing: [d e f]
    // Processing: [g]
}
```

## Maps

Key-value pairs, like hash tables or dictionaries.

### Creating Maps

```go
package main

import "fmt"

func main() {
    // Map literal
    ages := map[string]int{
        "Alice": 25,
        "Bob":   30,
        "Charlie": 35,
    }
    
    // Using make
    scores := make(map[string]int)
    
    // Nil map (cannot add to nil map)
    var nilMap map[string]int
    fmt.Println(nilMap == nil)  // true
    // nilMap["key"] = 1  // PANIC: assignment to entry in nil map
    
    // Empty map (can add elements)
    emptyMap := map[string]int{}
    emptyMap["key"] = 1  // OK
    
    fmt.Println(ages)
}
```

### Map Operations

```go
package main

import "fmt"

func main() {
    users := make(map[int]string)
    
    // Add/Update elements
    users[1] = "Alice"
    users[2] = "Bob"
    users[3] = "Charlie"
    
    // Access elements
    fmt.Println(users[1])  // Alice
    
    // Check if key exists
    name, exists := users[2]
    if exists {
        fmt.Println("Found:", name)
    }
    
    // Accessing non-existent key returns zero value
    fmt.Println(users[999])  // "" (empty string)
    
    // Delete element
    delete(users, 2)
    fmt.Println(users)  // map[1:Alice 3:Charlie]
    
    // Iterate over map
    for id, name := range users {
        fmt.Printf("ID: %d, Name: %s\n", id, name)
    }
    
    // Get length
    fmt.Println(len(users))  // 2
}
```

### Map with Struct Values

```go
package main

import "fmt"

type User struct {
    Name  string
    Email string
    Age   int
}

func main() {
    users := make(map[int]User)
    
    users[1] = User{
        Name:  "Alice",
        Email: "alice@example.com",
        Age:   25,
    }
    
    users[2] = User{
        Name:  "Bob",
        Email: "bob@example.com",
        Age:   30,
    }
    
    // Access user
    if user, exists := users[1]; exists {
        fmt.Printf("%s is %d years old\n", user.Name, user.Age)
    }
    
    // Cannot modify struct fields directly in map
    // users[1].Age = 26  // ERROR
    
    // Must retrieve, modify, and put back
    user := users[1]
    user.Age = 26
    users[1] = user
}
```

### Practical Map Examples

#### Example 1: Caching

```go
package cache

import (
    "sync"
    "time"
)

type CacheItem struct {
    Value      interface{}
    Expiration time.Time
}

type Cache struct {
    items map[string]CacheItem
    mu    sync.RWMutex
}

func NewCache() *Cache {
    c := &Cache{
        items: make(map[string]CacheItem),
    }
    go c.cleanup()
    return c
}

func (c *Cache) Set(key string, value interface{}, ttl time.Duration) {
    c.mu.Lock()
    defer c.mu.Unlock()
    
    c.items[key] = CacheItem{
        Value:      value,
        Expiration: time.Now().Add(ttl),
    }
}

func (c *Cache) Get(key string) (interface{}, bool) {
    c.mu.RLock()
    defer c.mu.RUnlock()
    
    item, exists := c.items[key]
    if !exists {
        return nil, false
    }
    
    if time.Now().After(item.Expiration) {
        return nil, false
    }
    
    return item.Value, true
}

func (c *Cache) Delete(key string) {
    c.mu.Lock()
    defer c.mu.Unlock()
    delete(c.items, key)
}

func (c *Cache) cleanup() {
    ticker := time.NewTicker(1 * time.Minute)
    defer ticker.Stop()
    
    for range ticker.C {
        c.mu.Lock()
        for key, item := range c.items {
            if time.Now().After(item.Expiration) {
                delete(c.items, key)
            }
        }
        c.mu.Unlock()
    }
}
```

#### Example 2: Request Counter

```go
package analytics

import "sync"

type RequestCounter struct {
    counts map[string]int
    mu     sync.Mutex
}

func NewRequestCounter() *RequestCounter {
    return &RequestCounter{
        counts: make(map[string]int),
    }
}

func (rc *RequestCounter) Increment(endpoint string) {
    rc.mu.Lock()
    defer rc.mu.Unlock()
    rc.counts[endpoint]++
}

func (rc *RequestCounter) Get(endpoint string) int {
    rc.mu.Lock()
    defer rc.mu.Unlock()
    return rc.counts[endpoint]
}

func (rc *RequestCounter) GetAll() map[string]int {
    rc.mu.Lock()
    defer rc.mu.Unlock()
    
    // Return copy
    result := make(map[string]int)
    for k, v := range rc.counts {
        result[k] = v
    }
    return result
}

func (rc *RequestCounter) Reset() {
    rc.mu.Lock()
    defer rc.mu.Unlock()
    rc.counts = make(map[string]int)
}
```

#### Example 3: Configuration Store

```go
package config

type Config struct {
    settings map[string]interface{}
}

func NewConfig() *Config {
    return &Config{
        settings: make(map[string]interface{}),
    }
}

func (c *Config) Set(key string, value interface{}) {
    c.settings[key] = value
}

func (c *Config) GetString(key string, defaultValue string) string {
    if val, exists := c.settings[key]; exists {
        if str, ok := val.(string); ok {
            return str
        }
    }
    return defaultValue
}

func (c *Config) GetInt(key string, defaultValue int) int {
    if val, exists := c.settings[key]; exists {
        if num, ok := val.(int); ok {
            return num
        }
    }
    return defaultValue
}

func (c *Config) GetBool(key string, defaultValue bool) bool {
    if val, exists := c.settings[key]; exists {
        if b, ok := val.(bool); ok {
            return b
        }
    }
    return defaultValue
}

// Usage
func main() {
    cfg := NewConfig()
    cfg.Set("host", "localhost")
    cfg.Set("port", 8080)
    cfg.Set("debug", true)
    
    host := cfg.GetString("host", "0.0.0.0")
    port := cfg.GetInt("port", 3000)
    debug := cfg.GetBool("debug", false)
    
    fmt.Printf("Server: %s:%d, Debug: %t\n", host, port, debug)
}
```

## Structs

Composite data type that groups together variables.

### Basic Structs

```go
package main

import "fmt"

// Struct definition
type Person struct {
    Name string
    Age  int
}

// Struct with various field types
type User struct {
    ID        int
    Username  string
    Email     string
    Active    bool
    CreatedAt time.Time
    Tags      []string
    Metadata  map[string]string
}

func main() {
    // Create struct - method 1
    var p1 Person
    p1.Name = "Alice"
    p1.Age = 25
    
    // Create struct - method 2
    p2 := Person{
        Name: "Bob",
        Age:  30,
    }
    
    // Create struct - method 3 (positional)
    p3 := Person{"Charlie", 35}
    
    // Create pointer to struct
    p4 := &Person{
        Name: "Diana",
        Age:  28,
    }
    
    fmt.Println(p1, p2, p3, *p4)
}
```

### Embedded Structs (Composition)

```go
package main

import "fmt"

type Address struct {
    Street  string
    City    string
    Country string
}

type Person struct {
    Name    string
    Age     int
    Address Address  // Nested struct
}

type Employee struct {
    Person           // Embedded struct (anonymous field)
    EmployeeID int
    Department string
}

func main() {
    // Nested struct
    person := Person{
        Name: "Alice",
        Age:  30,
        Address: Address{
            Street:  "123 Main St",
            City:    "New York",
            Country: "USA",
        },
    }
    fmt.Println(person.Address.City)  // New York
    
    // Embedded struct
    employee := Employee{
        Person: Person{
            Name: "Bob",
            Age:  35,
        },
        EmployeeID: 12345,
        Department: "Engineering",
    }
    
    // Can access Person fields directly
    fmt.Println(employee.Name)        // Bob (promoted field)
    fmt.Println(employee.Person.Name) // Bob (explicit)
    fmt.Println(employee.EmployeeID)  // 12345
}
```

### Struct Tags

Used for metadata, especially with JSON/XML encoding.

```go
package main

import (
    "encoding/json"
    "fmt"
)

type User struct {
    ID        int       `json:"id"`
    Username  string    `json:"username"`
    Email     string    `json:"email,omitempty"`
    Password  string    `json:"-"`  // Never serialized
    CreatedAt time.Time `json:"created_at"`
}

func main() {
    user := User{
        ID:        1,
        Username:  "alice",
        Email:     "alice@example.com",
        Password:  "secret123",
        CreatedAt: time.Now(),
    }
    
    // Marshal to JSON
    jsonData, _ := json.MarshalIndent(user, "", "  ")
    fmt.Println(string(jsonData))
    // Output (Password not included):
    // {
    //   "id": 1,
    //   "username": "alice",
    //   "email": "alice@example.com",
    //   "created_at": "2026-01-31T..."
    // }
    
    // Unmarshal from JSON
    jsonStr := `{"id":2,"username":"bob","email":"bob@example.com"}`
    var newUser User
    json.Unmarshal([]byte(jsonStr), &newUser)
    fmt.Printf("%+v\n", newUser)
}
```

### Practical Struct Examples

#### Example 1: API Request/Response Models

```go
package models

import "time"

// Request models
type CreateUserRequest struct {
    Username string `json:"username" validate:"required,min=3"`
    Email    string `json:"email" validate:"required,email"`
    Password string `json:"password" validate:"required,min=8"`
}

type UpdateUserRequest struct {
    Username *string `json:"username,omitempty"`
    Email    *string `json:"email,omitempty"`
}

type LoginRequest struct {
    Username string `json:"username" validate:"required"`
    Password string `json:"password" validate:"required"`
}

// Response models
type UserResponse struct {
    ID        int       `json:"id"`
    Username  string    `json:"username"`
    Email     string    `json:"email"`
    CreatedAt time.Time `json:"created_at"`
}

type APIResponse struct {
    Success bool        `json:"success"`
    Data    interface{} `json:"data,omitempty"`
    Error   string      `json:"error,omitempty"`
    Message string      `json:"message,omitempty"`
}

type PaginatedResponse struct {
    Data       interface{} `json:"data"`
    Page       int         `json:"page"`
    PageSize   int         `json:"page_size"`
    TotalPages int         `json:"total_pages"`
    TotalItems int         `json:"total_items"`
}
```

#### Example 2: Database Models

```go
package models

import (
    "database/sql"
    "time"
)

type User struct {
    ID        int
    Username  string
    Email     string
    Password  string
    Active    bool
    CreatedAt time.Time
    UpdatedAt time.Time
    DeletedAt sql.NullTime
}

type Post struct {
    ID        int
    UserID    int
    Title     string
    Content   string
    Published bool
    CreatedAt time.Time
    UpdatedAt time.Time
    
    // Relationships
    Author   *User
    Comments []Comment
    Tags     []Tag
}

type Comment struct {
    ID        int
    PostID    int
    UserID    int
    Content   string
    CreatedAt time.Time
}

type Tag struct {
    ID   int
    Name string
}
```

## Best Practices

### 1. Use Slices Over Arrays

```go
// Prefer
func processItems(items []string) {}

// Over
func processItems(items [10]string) {}
```

### 2. Check Map Existence

```go
// Always check if key exists
if value, exists := myMap[key]; exists {
    // Use value
}

// Don't rely on zero value alone
value := myMap[key]  // Could be zero value or missing
```

### 3. Pre-allocate Slices When Size is Known

```go
// Good - avoids reallocations
users := make([]User, 0, 100)

// Less efficient for known size
var users []User
```

### 4. Use Struct Pointers for Large Structs

```go
// Large struct - use pointer to avoid copying
func processUser(u *User) {}

// Small struct - value is fine
func processPoint(p Point) {}
```

### 5. Initialize Maps Before Use

```go
// Wrong
var m map[string]int
m["key"] = 1  // PANIC

// Correct
m := make(map[string]int)
m["key"] = 1  // OK
```

## Summary

Go's data structures provide:
- **Arrays**: Fixed-size, value types
- **Slices**: Dynamic, flexible, most common
- **Maps**: Key-value storage, reference types
- **Structs**: Composite types, foundation of OOP

Choose the right structure for your use case to build efficient, maintainable backend systems.
