# Pointers, Methods, and Interfaces

## Pointers

### What are Pointers?

A pointer holds the memory address of a value. The zero value of a pointer is `nil`.

```go
package main

import "fmt"

func main() {
    var x int = 42
    var p *int = &x  // p holds the address of x
    
    fmt.Println("Value of x:", x)      // 42
    fmt.Println("Address of x:", &x)   // 0xc0000... (memory address)
    fmt.Println("Value of p:", p)      // 0xc0000... (same address)
    fmt.Println("Value at p:", *p)     // 42 (dereferencing)
    
    *p = 21  // Change value through pointer
    fmt.Println("New value of x:", x)  // 21
}
```

### Pointer Operators

```go
// & (address-of operator)
x := 42
p := &x  // p is a pointer to x

// * (dereference operator)
fmt.Println(*p)  // Get value at pointer
*p = 100         // Set value at pointer
```

### Zero Value and nil

```go
package main

import "fmt"

func main() {
    var p *int
    fmt.Println(p)  // <nil>
    
    if p == nil {
        fmt.Println("Pointer is nil")
    }
    
    // Dereferencing nil pointer causes panic!
    // fmt.Println(*p)  // PANIC: runtime error
    
    // Safe check
    if p != nil {
        fmt.Println(*p)
    }
}
```

### Pointers with Structs

```go
package main

import "fmt"

type Person struct {
    Name string
    Age  int
}

func main() {
    // Method 1: Create struct then get pointer
    p1 := Person{Name: "John", Age: 30}
    ptr1 := &p1
    
    // Method 2: Create pointer directly
    ptr2 := &Person{Name: "Jane", Age: 25}
    
    // Access fields (no need for (*ptr).Field)
    fmt.Println(ptr1.Name)  // Go auto-dereferences
    fmt.Println(ptr2.Age)
    
    // Modify through pointer
    ptr1.Age = 31
    fmt.Println(p1.Age)  // 31 (original modified)
}
```

### new() Function

```go
package main

import "fmt"

func main() {
    // new() allocates memory and returns pointer
    p := new(int)
    fmt.Println(p)   // 0xc0000...
    fmt.Println(*p)  // 0 (zero value)
    
    *p = 42
    fmt.Println(*p)  // 42
    
    // Equivalent to:
    var x int
    p2 := &x
}
```

### Pointers as Function Parameters

```go
package main

import "fmt"

// Pass by value (copy)
func incrementValue(x int) {
    x++  // Only modifies local copy
}

// Pass by pointer (reference)
func incrementPointer(x *int) {
    *x++  // Modifies original
}

func main() {
    n := 5
    
    incrementValue(n)
    fmt.Println(n)  // Still 5
    
    incrementPointer(&n)
    fmt.Println(n)  // 6
}
```

### Pointers with Slices and Maps

```go
package main

import "fmt"

func main() {
    // Slices and maps are already reference types
    // Usually no need for pointers
    
    slice := []int{1, 2, 3}
    modifySlice(slice)
    fmt.Println(slice)  // [10, 2, 3] - modified!
    
    // But pointer to slice is different
    var s []int
    initSlice(&s)
    fmt.Println(s)  // [1, 2, 3]
}

func modifySlice(s []int) {
    s[0] = 10  // Modifies original
}

func initSlice(s *[]int) {
    *s = []int{1, 2, 3}  // Replaces entire slice
}
```

## Methods

### What are Methods?

Methods are functions with a receiver argument.

```go
package main

import "fmt"

type Rectangle struct {
    Width  float64
    Height float64
}

// Method with value receiver
func (r Rectangle) Area() float64 {
    return r.Width * r.Height
}

// Method with pointer receiver
func (r *Rectangle) Scale(factor float64) {
    r.Width *= factor
    r.Height *= factor
}

func main() {
    rect := Rectangle{Width: 10, Height: 5}
    
    fmt.Println("Area:", rect.Area())  // 50
    
    rect.Scale(2)
    fmt.Println("After scaling:", rect.Width, rect.Height)  // 20, 10
}
```

### Value vs Pointer Receivers

```go
package main

import "fmt"

type Counter struct {
    value int
}

// Value receiver - gets a copy
func (c Counter) ValueIncrement() {
    c.value++  // Modifies copy, not original
}

// Pointer receiver - gets reference
func (c *Counter) PointerIncrement() {
    c.value++  // Modifies original
}

func main() {
    counter := Counter{value: 0}
    
    counter.ValueIncrement()
    fmt.Println(counter.value)  // Still 0
    
    counter.PointerIncrement()
    fmt.Println(counter.value)  // 1
}
```

### When to Use Pointer Receivers

Use pointer receivers when:
1. Method needs to modify the receiver
2. Receiver is large (avoid copying)
3. Consistency (if some methods use pointer receivers)

```go
package main

type User struct {
    ID       int
    Name     string
    Email    string
    Settings map[string]string  // Large field
}

// Pointer receiver - modifies state
func (u *User) UpdateEmail(email string) {
    u.Email = email
}

// Pointer receiver - avoid copying large struct
func (u *User) GetSetting(key string) string {
    return u.Settings[key]
}

// Value receiver - read-only, simple field
func (u User) GetID() int {
    return u.ID
}
```

### Methods on Non-Struct Types

```go
package main

import (
    "fmt"
    "strings"
)

// Custom type
type MyString string

func (s MyString) ToUpper() string {
    return strings.ToUpper(string(s))
}

func (s MyString) Length() int {
    return len(s)
}

type IntSlice []int

func (is IntSlice) Sum() int {
    total := 0
    for _, v := range is {
        total += v
    }
    return total
}

func main() {
    str := MyString("hello")
    fmt.Println(str.ToUpper())  // HELLO
    
    nums := IntSlice{1, 2, 3, 4, 5}
    fmt.Println(nums.Sum())  // 15
}
```

## Interfaces

### What are Interfaces?

Interfaces define behavior (method sets). Types implicitly satisfy interfaces.

```go
package main

import "fmt"

// Interface definition
type Speaker interface {
    Speak() string
}

// Types that implement Speaker
type Dog struct {
    Name string
}

func (d Dog) Speak() string {
    return "Woof!"
}

type Cat struct {
    Name string
}

func (c Cat) Speak() string {
    return "Meow!"
}

// Function accepts any Speaker
func makeItSpeak(s Speaker) {
    fmt.Println(s.Speak())
}

func main() {
    dog := Dog{Name: "Rex"}
    cat := Cat{Name: "Whiskers"}
    
    makeItSpeak(dog)  // Woof!
    makeItSpeak(cat)  // Meow!
}
```

### Interface Satisfaction

No explicit declaration needed - types automatically satisfy interfaces.

```go
package main

import "fmt"

type Writer interface {
    Write(data []byte) (int, error)
}

type FileWriter struct {
    filename string
}

// Implements Writer interface implicitly
func (f FileWriter) Write(data []byte) (int, error) {
    fmt.Printf("Writing to %s: %s\n", f.filename, data)
    return len(data), nil
}

func main() {
    var w Writer = FileWriter{filename: "output.txt"}
    w.Write([]byte("Hello, World!"))
}
```

### Empty Interface

`interface{}` (or `any` in Go 1.18+) can hold any value.

```go
package main

import "fmt"

func printAnything(v interface{}) {
    fmt.Printf("Value: %v, Type: %T\n", v, v)
}

func main() {
    printAnything(42)
    printAnything("hello")
    printAnything([]int{1, 2, 3})
    printAnything(struct{ Name string }{"John"})
}
```

### Type Assertions

```go
package main

import "fmt"

func describe(i interface{}) {
    // Type assertion
    s, ok := i.(string)
    if ok {
        fmt.Printf("String: %q\n", s)
        return
    }
    
    n, ok := i.(int)
    if ok {
        fmt.Printf("Integer: %d\n", n)
        return
    }
    
    fmt.Println("Unknown type")
}

func main() {
    describe("hello")  // String: "hello"
    describe(42)       // Integer: 42
    describe(3.14)     // Unknown type
}
```

### Type Switch

```go
package main

import "fmt"

func classify(i interface{}) {
    switch v := i.(type) {
    case int:
        fmt.Printf("Integer: %d\n", v)
    case string:
        fmt.Printf("String: %q (length: %d)\n", v, len(v))
    case bool:
        fmt.Printf("Boolean: %t\n", v)
    case []int:
        fmt.Printf("Integer slice: %v\n", v)
    default:
        fmt.Printf("Unknown type: %T\n", v)
    }
}

func main() {
    classify(42)
    classify("hello")
    classify(true)
    classify([]int{1, 2, 3})
    classify(3.14)
}
```

### Common Standard Interfaces

#### io.Reader and io.Writer

```go
package main

import (
    "fmt"
    "io"
    "strings"
)

func main() {
    // io.Reader interface
    reader := strings.NewReader("Hello, World!")
    
    buf := make([]byte, 5)
    for {
        n, err := reader.Read(buf)
        if err == io.EOF {
            break
        }
        fmt.Printf("Read %d bytes: %q\n", n, buf[:n])
    }
}
```

#### fmt.Stringer

```go
package main

import "fmt"

type Person struct {
    Name string
    Age  int
}

// Implement fmt.Stringer
func (p Person) String() string {
    return fmt.Sprintf("%s (age %d)", p.Name, p.Age)
}

func main() {
    p := Person{Name: "John", Age: 30}
    fmt.Println(p)  // John (age 30)
}
```

#### error Interface

```go
package main

import "fmt"

// error interface
// type error interface {
//     Error() string
// }

type ValidationError struct {
    Field   string
    Message string
}

func (e ValidationError) Error() string {
    return fmt.Sprintf("%s: %s", e.Field, e.Message)
}

func validateAge(age int) error {
    if age < 0 {
        return ValidationError{
            Field:   "age",
            Message: "must be non-negative",
        }
    }
    return nil
}

func main() {
    err := validateAge(-5)
    if err != nil {
        fmt.Println("Error:", err)  // Error: age: must be non-negative
    }
}
```

### Interface Composition

```go
package main

import "io"

// Composing interfaces
type ReadWriter interface {
    io.Reader
    io.Writer
}

type ReadWriteCloser interface {
    io.Reader
    io.Writer
    io.Closer
}

// Custom composition
type DataStore interface {
    Read(key string) ([]byte, error)
    Write(key string, value []byte) error
}

type Cache interface {
    DataStore
    Delete(key string) error
    Clear() error
}
```

### Practical Backend Example

```go
package main

import (
    "errors"
    "fmt"
)

// Repository interface
type UserRepository interface {
    GetByID(id int) (*User, error)
    Create(user *User) error
    Update(user *User) error
    Delete(id int) error
}

type User struct {
    ID    int
    Name  string
    Email string
}

// In-memory implementation
type InMemoryUserRepository struct {
    users map[int]*User
    nextID int
}

func NewInMemoryUserRepository() *InMemoryUserRepository {
    return &InMemoryUserRepository{
        users: make(map[int]*User),
        nextID: 1,
    }
}

func (r *InMemoryUserRepository) GetByID(id int) (*User, error) {
    user, exists := r.users[id]
    if !exists {
        return nil, errors.New("user not found")
    }
    return user, nil
}

func (r *InMemoryUserRepository) Create(user *User) error {
    user.ID = r.nextID
    r.users[user.ID] = user
    r.nextID++
    return nil
}

func (r *InMemoryUserRepository) Update(user *User) error {
    if _, exists := r.users[user.ID]; !exists {
        return errors.New("user not found")
    }
    r.users[user.ID] = user
    return nil
}

func (r *InMemoryUserRepository) Delete(id int) error {
    if _, exists := r.users[id]; !exists {
        return errors.New("user not found")
    }
    delete(r.users, id)
    return nil
}

// Service uses interface
type UserService struct {
    repo UserRepository
}

func NewUserService(repo UserRepository) *UserService {
    return &UserService{repo: repo}
}

func (s *UserService) RegisterUser(name, email string) (*User, error) {
    user := &User{Name: name, Email: email}
    if err := s.repo.Create(user); err != nil {
        return nil, err
    }
    return user, nil
}

func main() {
    // Easy to swap implementations
    repo := NewInMemoryUserRepository()
    service := NewUserService(repo)
    
    user, _ := service.RegisterUser("John", "john@example.com")
    fmt.Printf("Created user: %+v\n", user)
}
```

## Best Practices

### 1. Accept Interfaces, Return Structs

```go
// GOOD
func ProcessData(r io.Reader) (*Result, error) {
    // Function accepts interface
    // Returns concrete type
}

// BAD
func ProcessData(f *os.File) (io.Reader, error) {
    // Too specific parameter
    // Returns interface
}
```

### 2. Keep Interfaces Small

```go
// GOOD - small, focused
type Reader interface {
    Read(p []byte) (n int, err error)
}

// BAD - too many methods
type DataManager interface {
    Read() error
    Write() error
    Update() error
    Delete() error
    Validate() error
    Transform() error
}
```

### 3. Use Pointer Receivers for Consistency

```go
type User struct {
    ID   int
    Name string
}

// If any method uses pointer receiver, use it for all
func (u *User) UpdateName(name string) {
    u.Name = name
}

func (u *User) GetID() int {  // Use pointer even for read-only
    return u.ID
}
```

### 4. Check for nil Pointers

```go
func process(u *User) error {
    if u == nil {
        return errors.New("user cannot be nil")
    }
    // Process user
    return nil
}
```

## Summary

- **Pointers**: Reference to memory location, use `&` and `*`
- **Methods**: Functions with receivers, use pointers for mutation
- **Interfaces**: Define behavior, implicitly satisfied
- **Type Assertions**: Extract concrete type from interface
- **Composition**: Build complex interfaces from simple ones

Essential for building flexible, testable Go applications.
