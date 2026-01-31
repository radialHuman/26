# Go Syntax Fundamentals

## What are Go Syntax Fundamentals?

Go syntax fundamentals are the basic building blocks of the Go programming language - the rules and structures for writing valid Go code. This includes package declarations, imports, variables, constants, data types, and comments.

## Why are Syntax Fundamentals Important?

- **Foundation**: All Go programs are built on these basics
- **Readability**: Consistent syntax makes code easier to understand
- **Compiler Requirements**: Incorrect syntax prevents compilation
- **Best Practices**: Following Go conventions ensures idiomatic code
- **Team Collaboration**: Standard syntax enables better code review
- **Tooling**: Formatters and linters depend on proper syntax

## Package Declaration and Imports

### What is a Package?

Every Go file belongs to a package. Packages organize related code and provide encapsulation.

### How It Works

```go
// Package declaration - MUST be first non-comment line
package main

// Import single package
import "fmt"

// Import multiple packages (preferred)
import (
    "fmt"
    "os"
    "time"
)

// Named imports (alias)
import (
    f "fmt"              // Alias fmt as f
    _ "image/png"        // Blank import (side effects only)
    . "math"             // Dot import (not recommended)
)
```

### Practical Examples

#### Example 1: Basic Program Structure

```go
package main

import (
    "fmt"
    "time"
)

func main() {
    fmt.Println("Current time:", time.Now())
}
```

#### Example 2: Multiple File Package

```go
// File: user.go
package models

type User struct {
    ID   int
    Name string
}

// File: product.go
package models  // Same package

type Product struct {
    ID    int
    Price float64
}

// File: main.go
package main

import (
    "fmt"
    "myproject/models"  // Import the models package
)

func main() {
    u := models.User{ID: 1, Name: "Alice"}
    fmt.Println(u)
}
```

#### Example 3: Import Aliases in Practice

```go
package main

import (
    "encoding/json"
    ejson "encoding/json"  // Same package with alias
    myjson "github.com/custom/json"  // Different implementation
)

func main() {
    // Using standard library
    data1, _ := json.Marshal(map[string]int{"a": 1})
    
    // Using alias
    data2, _ := ejson.Marshal(map[string]int{"b": 2})
    
    // Using custom package
    data3, _ := myjson.Marshal(map[string]int{"c": 3})
}
```

### Configuration: Import Organization

```go
// Best practice: Group imports
import (
    // Standard library
    "context"
    "fmt"
    "time"
    
    // Third-party
    "github.com/gin-gonic/gin"
    "github.com/sirupsen/logrus"
    
    // Internal/local
    "myproject/internal/auth"
    "myproject/pkg/utils"
)
```

### When to Use What

| Import Type | Use Case | Example |
|------------|----------|---------|
| Normal | Standard usage | `import "fmt"` |
| Alias | Name conflict, clarity | `import sql "database/sql"` |
| Blank | Driver registration, init | `import _ "github.com/lib/pq"` |
| Dot | Testing, rarely production | `import . "testing"` |

## Variables

### Declaration Methods

Go offers multiple ways to declare variables, each with specific use cases.

```go
package main

import "fmt"

func main() {
    // Method 1: var with type
    var name string
    name = "Alice"
    fmt.Println(name)  // Alice
    
    // Method 2: var with initialization
    var age = 25
    fmt.Println(age)  // 25
    
    // Method 3: var with type and initialization
    var height float64 = 5.9
    fmt.Println(height)  // 5.9
    
    // Method 4: Short declaration (only inside functions)
    city := "New York"
    fmt.Println(city)  // New York
    
    // Method 5: Multiple variables
    var x, y int = 10, 20
    fmt.Println(x, y)  // 10 20
    
    // Method 6: Multiple with short declaration
    a, b := 100, 200
    fmt.Println(a, b)  // 100 200
    
    // Method 7: Grouped declaration
    var (
        username string = "admin"
        password string = "secret"
        port     int    = 8080
    )
    fmt.Println(username, password, port)
}
```

### Detailed Examples

#### Example 1: Zero Values

```go
package main

import "fmt"

func main() {
    // All variables have zero values if not initialized
    var i int         // 0
    var f float64     // 0.0
    var b bool        // false
    var s string      // "" (empty string)
    var p *int        // nil
    var sl []int      // nil
    var m map[string]int  // nil
    
    fmt.Printf("int: %v\n", i)       // 0
    fmt.Printf("float: %v\n", f)     // 0
    fmt.Printf("bool: %v\n", b)      // false
    fmt.Printf("string: %q\n", s)    // ""
    fmt.Printf("pointer: %v\n", p)   // <nil>
    fmt.Printf("slice: %v\n", sl)    // []
    fmt.Printf("map: %v\n", m)       // map[]
}
```

#### Example 2: Variable Scope

```go
package main

import "fmt"

// Package-level variable (accessible throughout package)
var globalVar = "I'm global"

func main() {
    // Function-level variable
    localVar := "I'm local"
    
    fmt.Println(globalVar)  // Accessible
    fmt.Println(localVar)   // Accessible
    
    if true {
        // Block-level variable
        blockVar := "I'm in a block"
        fmt.Println(blockVar)  // Accessible
        fmt.Println(localVar)  // Still accessible
    }
    
    // fmt.Println(blockVar)  // ERROR: undefined
}
```

#### Example 3: Variable Reassignment and Shadowing

```go
package main

import "fmt"

var count = 10  // Package level

func main() {
    fmt.Println(count)  // 10 (package level)
    
    count := 20  // New variable (shadows package level)
    fmt.Println(count)  // 20 (local)
    
    if true {
        count := 30  // Another new variable (shadows local)
        fmt.Println(count)  // 30
    }
    
    fmt.Println(count)  // 20 (local, not affected by block)
}
```

#### Example 4: Practical Backend Use Cases

```go
package main

import (
    "database/sql"
    "fmt"
    "log"
    "net/http"
)

// Configuration variables
var (
    dbConnection *sql.DB
    serverPort   = ":8080"
    apiKey       string
)

func initDB() {
    var err error
    // Note: Using = not := to assign to package variable
    dbConnection, err = sql.Open("postgres", "connection-string")
    if err != nil {
        log.Fatal(err)
    }
}

func handleRequest(w http.ResponseWriter, r *http.Request) {
    // Short declaration for local variables
    userID := r.URL.Query().Get("user_id")
    
    // Multiple variable declaration
    var (
        userData map[string]interface{}
        err      error
    )
    
    // Reusing err variable (common pattern)
    userData, err = fetchUserData(userID)
    if err != nil {
        http.Error(w, err.Error(), http.StatusInternalServerError)
        return
    }
    
    fmt.Fprintf(w, "User data: %v", userData)
}

func fetchUserData(userID string) (map[string]interface{}, error) {
    // Implementation
    return map[string]interface{}{"id": userID}, nil
}
```

## Constants

### What are Constants?

Constants are immutable values defined at compile time that cannot be changed during program execution.

```go
package main

import "fmt"

func main() {
    // Simple constants
    const pi = 3.14159
    const greeting = "Hello"
    
    // Typed constants
    const maxUsers int = 1000
    const timeout float64 = 30.5
    
    // Multiple constants
    const (
        statusOK    = 200
        statusError = 500
    )
    
    // Untyped constants (more flexible)
    const billion = 1000000000
    var x int = billion       // Works
    var y float64 = billion   // Also works
    
    fmt.Println(pi, greeting, maxUsers)
}
```

### iota: The Constant Generator

```go
package main

import "fmt"

func main() {
    // iota starts at 0 and increments
    const (
        Sunday = iota     // 0
        Monday            // 1
        Tuesday           // 2
        Wednesday         // 3
        Thursday          // 4
        Friday            // 5
        Saturday          // 6
    )
    
    fmt.Println(Sunday, Monday, Saturday)  // 0 1 6
    
    // Reset iota in new const block
    const (
        Read = iota   // 0
        Write         // 1
        Execute       // 2
    )
    
    // Skip values with blank identifier
    const (
        _ = iota  // Skip 0
        KB = 1 << (10 * iota)  // 1024
        MB                      // 1048576
        GB                      // 1073741824
        TB                      // 1099511627776
    )
    
    fmt.Println(KB, MB, GB)  // 1024 1048576 1073741824
}
```

### Practical Examples with Constants

#### Example 1: HTTP Status Codes

```go
package api

const (
    // Success codes
    StatusOK       = 200
    StatusCreated  = 201
    StatusAccepted = 202
    
    // Client error codes
    StatusBadRequest   = 400
    StatusUnauthorized = 401
    StatusForbidden    = 403
    StatusNotFound     = 404
    
    // Server error codes
    StatusInternalServerError = 500
    StatusBadGateway          = 502
    StatusServiceUnavailable  = 503
)

func handleError(code int) string {
    switch code {
    case StatusNotFound:
        return "Resource not found"
    case StatusUnauthorized:
        return "Authentication required"
    default:
        return "Unknown error"
    }
}
```

#### Example 2: Application Configuration

```go
package config

const (
    // Database configuration
    DBHost     = "localhost"
    DBPort     = 5432
    DBName     = "myapp"
    DBTimeout  = 30  // seconds
    
    // API configuration
    APIVersion     = "v1"
    APIRateLimit   = 1000  // requests per hour
    APIMaxPageSize = 100
    
    // Cache configuration
    CacheTTL       = 300  // seconds
    CacheMaxSize   = 1000 // items
)
```

#### Example 3: Enum-like Patterns with iota

```go
package models

type OrderStatus int

const (
    OrderPending OrderStatus = iota
    OrderConfirmed
    OrderProcessing
    OrderShipped
    OrderDelivered
    OrderCancelled
)

// String representation
func (s OrderStatus) String() string {
    return [...]string{
        "Pending",
        "Confirmed",
        "Processing",
        "Shipped",
        "Delivered",
        "Cancelled",
    }[s]
}

// Usage
func main() {
    order := OrderPending
    fmt.Println(order)  // Pending
    
    if order == OrderPending {
        fmt.Println("Order is pending")
    }
}
```

#### Example 4: Bit Flags with iota

```go
package permissions

type Permission int

const (
    PermissionRead Permission = 1 << iota  // 1 (binary: 001)
    PermissionWrite                         // 2 (binary: 010)
    PermissionDelete                        // 4 (binary: 100)
)

// Check if user has permission
func HasPermission(userPerms, checkPerm Permission) bool {
    return userPerms&checkPerm != 0
}

func main() {
    // User has read and write permissions
    userPerms := PermissionRead | PermissionWrite
    
    fmt.Println(HasPermission(userPerms, PermissionRead))    // true
    fmt.Println(HasPermission(userPerms, PermissionWrite))   // true
    fmt.Println(HasPermission(userPerms, PermissionDelete))  // false
    
    // Grant delete permission
    userPerms |= PermissionDelete
    fmt.Println(HasPermission(userPerms, PermissionDelete))  // true
    
    // Revoke write permission
    userPerms &^= PermissionWrite
    fmt.Println(HasPermission(userPerms, PermissionWrite))   // false
}
```

## Data Types

### Basic Types

```go
package main

import "fmt"

func main() {
    // Boolean
    var isActive bool = true
    
    // Integers
    var age int = 25                    // Platform dependent (32 or 64 bit)
    var count int8 = 127                // -128 to 127
    var value int16 = 32767             // -32768 to 32767
    var bigNum int32 = 2147483647       // -2^31 to 2^31-1
    var hugeNum int64 = 9223372036854775807  // -2^63 to 2^63-1
    
    // Unsigned integers
    var positiveCount uint = 100        // 0 to 2^32-1 or 2^64-1
    var byte1 uint8 = 255              // Same as byte, 0 to 255
    var word uint16 = 65535            // 0 to 65535
    var dword uint32 = 4294967295      // 0 to 2^32-1
    var qword uint64 = 18446744073709551615  // 0 to 2^64-1
    
    // Floating point
    var price float32 = 19.99          // 32-bit IEEE-754
    var precise float64 = 3.14159265359  // 64-bit IEEE-754 (default)
    
    // Complex numbers
    var c complex64 = 1 + 2i
    var c2 complex128 = complex(1, 2)  // 1+2i
    
    // String
    var name string = "Alice"
    var multiline string = `Line 1
Line 2
Line 3`  // Raw string literal
    
    // Byte (alias for uint8)
    var b byte = 'A'  // ASCII value: 65
    
    // Rune (alias for int32, represents Unicode code point)
    var r rune = '世'  // Unicode character
    
    fmt.Println(isActive, age, name, b, r)
}
```

### Type Inference

```go
package main

import "fmt"

func main() {
    // Type inferred from value
    age := 25              // int
    price := 19.99         // float64
    name := "Alice"        // string
    isActive := true       // bool
    
    // Print types
    fmt.Printf("age type: %T\n", age)          // int
    fmt.Printf("price type: %T\n", price)      // float64
    fmt.Printf("name type: %T\n", name)        // string
    fmt.Printf("isActive type: %T\n", isActive)  // bool
}
```

### Practical Examples

#### Example 1: Choosing the Right Integer Type

```go
package main

import "fmt"

func main() {
    // Use int for general purposes
    var userCount int = 1000
    
    // Use int64 for IDs (database compatibility)
    var userID int64 = 123456789
    
    // Use uint for always-positive values
    var fileSize uint64 = 1024 * 1024  // 1MB
    
    // Use int8/int16 for memory-constrained scenarios
    type Status int8
    const (
        Inactive Status = 0
        Active   Status = 1
        Banned   Status = 2
    )
    
    // Use byte for binary data
    var buffer []byte = []byte{0x48, 0x65, 0x6C, 0x6C, 0x6F}  // "Hello"
    
    fmt.Println(userCount, userID, fileSize, buffer)
}
```

#### Example 2: String Manipulation

```go
package main

import (
    "fmt"
    "strings"
)

func main() {
    // String basics
    message := "Hello, World!"
    
    // Length (in bytes, not characters)
    fmt.Println(len(message))  // 13
    
    // Indexing (returns byte)
    fmt.Println(message[0])  // 72 (ASCII 'H')
    
    // String is immutable - cannot modify
    // message[0] = 'h'  // ERROR
    
    // String concatenation
    greeting := "Hello" + " " + "World"
    fmt.Println(greeting)
    
    // Multi-line strings
    html := `
        <html>
            <body>
                <h1>Title</h1>
            </body>
        </html>
    `
    fmt.Println(html)
    
    // Working with Unicode
    text := "Hello, 世界"
    fmt.Println(len(text))              // 13 bytes (not 9 characters)
    fmt.Println(len([]rune(text)))      // 9 characters
    
    // Iterate over runes (characters)
    for i, r := range text {
        fmt.Printf("Index %d: %c\n", i, r)
    }
    
    // String functions
    fmt.Println(strings.ToUpper(message))     // HELLO, WORLD!
    fmt.Println(strings.Contains(message, "World"))  // true
    fmt.Println(strings.Split(message, ", "))  // [Hello World!]
}
```

#### Example 3: Backend API Types

```go
package api

import (
    "encoding/json"
    "time"
)

// User model with various types
type User struct {
    ID        int64     `json:"id"`
    Username  string    `json:"username"`
    Email     string    `json:"email"`
    Age       uint8     `json:"age"`            // 0-255
    Balance   float64   `json:"balance"`
    IsActive  bool      `json:"is_active"`
    CreatedAt time.Time `json:"created_at"`
    Metadata  map[string]interface{} `json:"metadata"`
}

// Request/Response types
type CreateUserRequest struct {
    Username string  `json:"username"`
    Email    string  `json:"email"`
    Age      uint8   `json:"age"`
}

type PaginationRequest struct {
    Page     int `json:"page"`
    PageSize int `json:"page_size"`
}

type APIResponse struct {
    Success bool        `json:"success"`
    Data    interface{} `json:"data,omitempty"`
    Error   string      `json:"error,omitempty"`
    Code    int         `json:"code"`
}

func main() {
    user := User{
        ID:       1,
        Username: "alice",
        Email:    "alice@example.com",
        Age:      25,
        Balance:  1000.50,
        IsActive: true,
        CreatedAt: time.Now(),
        Metadata: map[string]interface{}{
            "role": "admin",
            "department": "engineering",
        },
    }
    
    data, _ := json.MarshalIndent(user, "", "  ")
    fmt.Println(string(data))
}
```

## Type Conversion and Type Assertion

### Type Conversion (Between Similar Types)

```go
package main

import "fmt"

func main() {
    // Numeric conversions
    var i int = 42
    var f float64 = float64(i)  // Explicit conversion required
    var u uint = uint(i)
    
    fmt.Printf("int: %d, float: %f, uint: %d\n", i, f, u)
    
    // String to bytes and vice versa
    str := "Hello"
    bytes := []byte(str)         // String to byte slice
    backToStr := string(bytes)   // Byte slice to string
    
    fmt.Println(bytes)          // [72 101 108 108 111]
    fmt.Println(backToStr)      // Hello
    
    // Rune to string
    r := 'A'
    s := string(r)  // "A"
    fmt.Println(s)
    
    // Integer to string (NOT what you might expect)
    num := 65
    fmt.Println(string(num))  // "A" (ASCII 65), NOT "65"
    
    // Precision loss warning
    var bigFloat float64 = 123.456
    var smallInt int = int(bigFloat)  // 123 (decimal part lost)
    fmt.Println(smallInt)
}
```

### Type Assertion (Interface to Concrete Type)

```go
package main

import "fmt"

func main() {
    var i interface{} = "Hello"
    
    // Type assertion (unsafe)
    s := i.(string)
    fmt.Println(s)  // Hello
    
    // Type assertion with safety check
    s2, ok := i.(string)
    if ok {
        fmt.Println("String:", s2)
    } else {
        fmt.Println("Not a string")
    }
    
    // Wrong type assertion (panics without ok)
    // n := i.(int)  // PANIC: interface conversion
    
    // Safe wrong type assertion
    n, ok := i.(int)
    if !ok {
        fmt.Println("Not an integer, value:", n)  // Not an integer, value: 0
    }
    
    // Type switch
    checkType(42)
    checkType("Hello")
    checkType(3.14)
    checkType(true)
}

func checkType(i interface{}) {
    switch v := i.(type) {
    case int:
        fmt.Printf("Integer: %d\n", v)
    case string:
        fmt.Printf("String: %s\n", v)
    case float64:
        fmt.Printf("Float: %f\n", v)
    default:
        fmt.Printf("Unknown type: %T\n", v)
    }
}
```

## Comments

```go
package main

import "fmt"

// This is a single-line comment

/*
This is a multi-line comment.
It can span multiple lines.
Useful for longer explanations.
*/

// Package-level documentation comment.
// This appears in godoc.
// Should describe what the package does.

// User represents a user in the system.
// It contains basic user information.
type User struct {
    ID   int    // User's unique identifier
    Name string // User's full name
}

// NewUser creates a new User with the given name.
// It automatically assigns a unique ID.
func NewUser(name string) *User {
    return &User{
        ID:   generateID(),  // Helper function
        Name: name,
    }
}

func generateID() int {
    // TODO: Implement proper ID generation
    // FIXME: This is not thread-safe
    // NOTE: Consider using UUID instead
    return 1
}

func main() {
    user := NewUser("Alice")
    fmt.Println(user)
}
```

## Pros and Cons of Go Syntax

### Pros

✅ **Simplicity**: Limited keywords, easy to learn
✅ **Consistency**: gofmt ensures uniform formatting
✅ **Explicit**: No implicit type conversions
✅ **Fast Compilation**: Simple syntax helps compiler speed
✅ **Readability**: Clean, minimal syntax
✅ **Strong Typing**: Catches errors at compile time

### Cons

❌ **Verbose**: Requires explicit error handling
❌ **Limited Type Inference**: Not as powerful as Rust or Haskell
❌ **No Operator Overloading**: Can't customize operators
❌ **Uppercase for Export**: Not intuitive for some
❌ **No Default Parameters**: Function parameters can be repetitive
❌ **Short Declaration Limitation**: Only works in functions

## Best Practices

1. **Use short declarations** for local variables
   ```go
   // Good
   name := "Alice"
   
   // Avoid (unless type is ambiguous)
   var name string = "Alice"
   ```

2. **Group related declarations**
   ```go
   const (
       StatusOK    = 200
       StatusError = 500
   )
   ```

3. **Use meaningful variable names**
   ```go
   // Good
   userCount := 10
   
   // Bad
   uc := 10
   ```

4. **Leverage zero values**
   ```go
   var users []User  // nil slice, ready to append
   ```

5. **Use constants for fixed values**
   ```go
   const maxRetries = 3
   ```

## Summary

Go syntax fundamentals provide:
- Clear package and import system
- Multiple variable declaration methods
- Powerful constant generation with iota
- Rich set of built-in types
- Explicit type conversion
- Simple comment syntax

Master these basics for solid Go programming foundation.
