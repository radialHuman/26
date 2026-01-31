# Operators in Go

## What are Operators?

Operators are special symbols that perform operations on operands (variables and values).

## Arithmetic Operators

### Basic Arithmetic

```go
package main

import "fmt"

func main() {
    a, b := 10, 3
    
    // Addition
    fmt.Println("a + b =", a + b)  // 13
    
    // Subtraction
    fmt.Println("a - b =", a - b)  // 7
    
    // Multiplication
    fmt.Println("a * b =", a * b)  // 30
    
    // Division
    fmt.Println("a / b =", a / b)  // 3 (integer division)
    
    // Modulus (remainder)
    fmt.Println("a % b =", a % b)  // 1
}
```

### Integer vs Float Division

```go
package main

import "fmt"

func main() {
    // Integer division
    fmt.Println(10 / 3)  // 3 (truncated)
    
    // Float division
    fmt.Println(10.0 / 3.0)  // 3.3333...
    
    // Mixed
    fmt.Println(float64(10) / 3)  // 3.3333...
}
```

### Increment and Decrement

```go
package main

import "fmt"

func main() {
    x := 5
    
    x++  // Increment by 1
    fmt.Println(x)  // 6
    
    x--  // Decrement by 1
    fmt.Println(x)  // 5
    
    // Note: ++x and --x are NOT valid in Go
    // Only postfix notation is supported
}
```

## Comparison Operators

### Relational Operators

```go
package main

import "fmt"

func main() {
    a, b := 10, 5
    
    // Equal to
    fmt.Println("a == b:", a == b)  // false
    
    // Not equal to
    fmt.Println("a != b:", a != b)  // true
    
    // Greater than
    fmt.Println("a > b:", a > b)    // true
    
    // Less than
    fmt.Println("a < b:", a < b)    // false
    
    // Greater than or equal
    fmt.Println("a >= b:", a >= b)  // true
    
    // Less than or equal
    fmt.Println("a <= b:", a <= b)  // false
}
```

### String Comparison

```go
package main

import "fmt"

func main() {
    s1, s2 := "apple", "banana"
    
    fmt.Println(s1 == s2)  // false
    fmt.Println(s1 != s2)  // true
    fmt.Println(s1 < s2)   // true (lexicographic)
    fmt.Println(s1 > s2)   // false
}
```

## Logical Operators

### AND, OR, NOT

```go
package main

import "fmt"

func main() {
    a, b := true, false
    
    // Logical AND
    fmt.Println("a && b:", a && b)  // false
    
    // Logical OR
    fmt.Println("a || b:", a || b)  // true
    
    // Logical NOT
    fmt.Println("!a:", !a)          // false
    fmt.Println("!b:", !b)          // true
}
```

### Short-Circuit Evaluation

```go
package main

import "fmt"

func expensiveCheck() bool {
    fmt.Println("Expensive check called")
    return true
}

func main() {
    x := false
    
    // expensiveCheck() is NOT called (short-circuit)
    if x && expensiveCheck() {
        fmt.Println("Both true")
    }
    
    y := true
    
    // expensiveCheck() is NOT called (short-circuit)
    if y || expensiveCheck() {
        fmt.Println("At least one true")
    }
}
```

### Practical Examples

```go
package main

import "fmt"

func isValidAge(age int) bool {
    return age >= 0 && age <= 150
}

func isWeekend(day string) bool {
    return day == "Saturday" || day == "Sunday"
}

func isEligibleForDiscount(age int, isMember bool) bool {
    return (age < 18 || age > 65) || isMember
}

func main() {
    fmt.Println(isValidAge(25))                    // true
    fmt.Println(isValidAge(-5))                    // false
    fmt.Println(isWeekend("Monday"))               // false
    fmt.Println(isEligibleForDiscount(70, false))  // true
}
```

## Bitwise Operators

### Basic Bitwise Operations

```go
package main

import "fmt"

func main() {
    a, b := 12, 25  // 1100, 11001 in binary
    
    // AND
    fmt.Printf("%d & %d = %d\n", a, b, a & b)  // 8 (1000)
    
    // OR
    fmt.Printf("%d | %d = %d\n", a, b, a | b)  // 29 (11101)
    
    // XOR
    fmt.Printf("%d ^ %d = %d\n", a, b, a ^ b)  // 21 (10101)
    
    // NOT (bit complement)
    fmt.Printf("^%d = %d\n", a, ^a)  // -13
    
    // Left shift
    fmt.Printf("%d << 2 = %d\n", a, a << 2)  // 48 (110000)
    
    // Right shift
    fmt.Printf("%d >> 2 = %d\n", a, a >> 2)  // 3 (11)
}
```

### Practical Use Cases

```go
package main

import "fmt"

// Flags using bitwise operations
const (
    Read    = 1 << iota  // 1 (001)
    Write                // 2 (010)
    Execute              // 4 (100)
)

func hasPermission(userPerms, requiredPerm int) bool {
    return userPerms & requiredPerm == requiredPerm
}

func main() {
    // User has read and write permissions
    userPerms := Read | Write
    
    fmt.Println("Has read?", hasPermission(userPerms, Read))      // true
    fmt.Println("Has write?", hasPermission(userPerms, Write))    // true
    fmt.Println("Has execute?", hasPermission(userPerms, Execute))// false
    
    // Grant execute permission
    userPerms |= Execute
    fmt.Println("Has execute now?", hasPermission(userPerms, Execute))  // true
    
    // Revoke write permission
    userPerms &^= Write  // AND NOT
    fmt.Println("Has write now?", hasPermission(userPerms, Write))  // false
}
```

### Power of 2 Checks

```go
package main

import "fmt"

func isPowerOfTwo(n int) bool {
    return n > 0 && (n & (n - 1)) == 0
}

func main() {
    fmt.Println(isPowerOfTwo(8))   // true
    fmt.Println(isPowerOfTwo(10))  // false
    fmt.Println(isPowerOfTwo(16))  // true
}
```

## Assignment Operators

### Basic Assignment

```go
package main

import "fmt"

func main() {
    x := 10
    
    // Add and assign
    x += 5  // x = x + 5
    fmt.Println(x)  // 15
    
    // Subtract and assign
    x -= 3  // x = x - 3
    fmt.Println(x)  // 12
    
    // Multiply and assign
    x *= 2  // x = x * 2
    fmt.Println(x)  // 24
    
    // Divide and assign
    x /= 4  // x = x / 4
    fmt.Println(x)  // 6
    
    // Modulus and assign
    x %= 4  // x = x % 4
    fmt.Println(x)  // 2
}
```

### Bitwise Assignment

```go
package main

import "fmt"

func main() {
    x := 12
    
    x &= 10   // x = x & 10
    fmt.Println(x)  // 8
    
    x |= 5    // x = x | 5
    fmt.Println(x)  // 13
    
    x ^= 7    // x = x ^ 7
    fmt.Println(x)  // 10
    
    x <<= 2   // x = x << 2
    fmt.Println(x)  // 40
    
    x >>= 1   // x = x >> 1
    fmt.Println(x)  // 20
}
```

## Address and Pointer Operators

### & (Address-of) and * (Dereference)

```go
package main

import "fmt"

func main() {
    x := 42
    
    // & gets the address
    p := &x
    fmt.Printf("Address of x: %p\n", p)
    fmt.Printf("Value at address: %d\n", *p)
    
    // * dereferences the pointer
    *p = 100
    fmt.Println("x is now:", x)  // 100
}
```

## Channel Operators

### <- (Send/Receive)

```go
package main

import "fmt"

func main() {
    ch := make(chan int)
    
    go func() {
        ch <- 42  // Send to channel
    }()
    
    value := <-ch  // Receive from channel
    fmt.Println(value)  // 42
}
```

## Operator Precedence

From highest to lowest:

```go
package main

import "fmt"

func main() {
    // Precedence matters!
    result := 2 + 3 * 4
    fmt.Println(result)  // 14 (not 20)
    
    // Use parentheses for clarity
    result = (2 + 3) * 4
    fmt.Println(result)  // 20
    
    // Complex expression
    x := 5
    y := 10
    z := x + y * 2 / 3 - 1
    fmt.Println(z)  // 10
    
    // Same with parentheses for clarity
    z = x + ((y * 2) / 3) - 1
    fmt.Println(z)  // 10
}
```

### Precedence Table

```
Highest:
    *  /  %  <<  >>  &  &^
    +  -  |  ^
    ==  !=  <  <=  >  >=
    &&
    ||
Lowest
```

## Practical Backend Examples

### Request Validation

```go
package main

import (
    "errors"
    "fmt"
)

type User struct {
    Name  string
    Email string
    Age   int
}

func validateUser(u User) error {
    // Logical AND for multiple conditions
    if u.Name == "" || u.Email == "" {
        return errors.New("name and email are required")
    }
    
    // Range check
    if u.Age < 0 || u.Age > 150 {
        return errors.New("invalid age")
    }
    
    // Complex condition
    if len(u.Name) < 2 || len(u.Name) > 50 {
        return errors.New("name must be 2-50 characters")
    }
    
    return nil
}

func main() {
    user := User{Name: "John", Email: "john@example.com", Age: 30}
    
    if err := validateUser(user); err != nil {
        fmt.Println("Validation error:", err)
    } else {
        fmt.Println("User is valid")
    }
}
```

### Permission Checks

```go
package main

import "fmt"

const (
    PermRead   = 1 << iota  // 1
    PermWrite               // 2
    PermDelete              // 4
    PermAdmin               // 8
)

type User struct {
    Permissions int
}

func (u User) CanRead() bool {
    return u.Permissions & PermRead != 0
}

func (u User) CanWrite() bool {
    return u.Permissions & PermWrite != 0
}

func (u User) CanDelete() bool {
    return u.Permissions & PermDelete != 0
}

func (u User) IsAdmin() bool {
    return u.Permissions & PermAdmin != 0
}

func main() {
    // Regular user with read and write
    user := User{Permissions: PermRead | PermWrite}
    
    fmt.Println("Can read:", user.CanRead())      // true
    fmt.Println("Can write:", user.CanWrite())    // true
    fmt.Println("Can delete:", user.CanDelete())  // false
    fmt.Println("Is admin:", user.IsAdmin())      // false
    
    // Admin user
    admin := User{Permissions: PermRead | PermWrite | PermDelete | PermAdmin}
    fmt.Println("Admin can delete:", admin.CanDelete())  // true
}
```

### Filtering and Pagination

```go
package main

import "fmt"

type Product struct {
    Name      string
    Price     float64
    InStock   bool
    Category  string
}

func filterProducts(products []Product, minPrice, maxPrice float64, category string) []Product {
    var filtered []Product
    
    for _, p := range products {
        // Complex filter condition
        if p.InStock && 
           p.Price >= minPrice && 
           p.Price <= maxPrice &&
           (category == "" || p.Category == category) {
            filtered = append(filtered, p)
        }
    }
    
    return filtered
}

func main() {
    products := []Product{
        {"Laptop", 1200, true, "Electronics"},
        {"Mouse", 25, true, "Electronics"},
        {"Desk", 300, false, "Furniture"},
        {"Chair", 150, true, "Furniture"},
    }
    
    // Filter: Electronics, price 20-1500, in stock
    result := filterProducts(products, 20, 1500, "Electronics")
    
    for _, p := range result {
        fmt.Printf("%s - $%.2f\n", p.Name, p.Price)
    }
}
```

### Status Codes

```go
package main

import "fmt"

const (
    StatusOK          = 200
    StatusCreated     = 201
    StatusBadRequest  = 400
    StatusNotFound    = 404
    StatusServerError = 500
)

func isSuccess(status int) bool {
    return status >= 200 && status < 300
}

func isClientError(status int) bool {
    return status >= 400 && status < 500
}

func isServerError(status int) bool {
    return status >= 500 && status < 600
}

func main() {
    status := 404
    
    if isSuccess(status) {
        fmt.Println("Success!")
    } else if isClientError(status) {
        fmt.Println("Client error")
    } else if isServerError(status) {
        fmt.Println("Server error")
    }
}
```

### Nil Checks

```go
package main

import (
    "errors"
    "fmt"
)

type User struct {
    Name  string
    Email *string  // Pointer can be nil
}

func processUser(u *User) error {
    // Nil pointer check
    if u == nil {
        return errors.New("user cannot be nil")
    }
    
    // Check required fields
    if u.Name == "" {
        return errors.New("name is required")
    }
    
    // Check optional field
    if u.Email != nil && *u.Email == "" {
        return errors.New("email cannot be empty string")
    }
    
    return nil
}

func main() {
    email := "john@example.com"
    user := &User{Name: "John", Email: &email}
    
    if err := processUser(user); err != nil {
        fmt.Println("Error:", err)
    } else {
        fmt.Println("User processed successfully")
    }
}
```

## Common Mistakes

### 1. Assignment vs Comparison

```go
package main

import "fmt"

func main() {
    x := 5
    
    // WRONG - assignment, not comparison
    // if x = 10 {  // Compilation error
    //     fmt.Println("Equal")
    // }
    
    // CORRECT - comparison
    if x == 10 {
        fmt.Println("Equal")
    }
}
```

### 2. Integer Division

```go
package main

import "fmt"

func main() {
    // Integer division truncates
    result := 5 / 2
    fmt.Println(result)  // 2 (not 2.5)
    
    // Use float for decimal result
    result2 := float64(5) / 2
    fmt.Println(result2)  // 2.5
}
```

### 3. Modulo with Negatives

```go
package main

import "fmt"

func main() {
    fmt.Println(5 % 3)    // 2
    fmt.Println(-5 % 3)   // -2 (takes sign of dividend)
    fmt.Println(5 % -3)   // 2
    fmt.Println(-5 % -3)  // -2
}
```

## Summary

Operators in Go:
- **Arithmetic**: +, -, *, /, %, ++, --
- **Comparison**: ==, !=, <, >, <=, >=
- **Logical**: &&, ||, !
- **Bitwise**: &, |, ^, <<, >>, &^
- **Assignment**: =, +=, -=, *=, /=, %=, &=, |=, ^=, <<=, >>=
- **Pointer**: & (address), * (dereference)
- **Channel**: <- (send/receive)

Essential for control flow, calculations, and decision-making in Go programs.
