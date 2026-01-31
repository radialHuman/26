# Advanced Types and Enums in Go

Go's type system is simple yet powerful, supporting custom types, constants, and patterns that mimic enums. This chapter covers enums (using `iota`), custom types, and other advanced type features useful for building robust applications.

---

## Enums in Go (Using `iota`)

Go does not have a native `enum` type, but you can create enumerated constants using `const` and `iota`.

```go
package main
import "fmt"

type Status int

const (
    Pending Status = iota
    Active
    Inactive
    Deleted
)

func main() {
    var s Status = Active
    fmt.Println(s) // Output: 1
}
```

- `iota` auto-increments with each line, making it ideal for enums.
- Use custom types for type safety.

---

## Custom Types

You can define your own types based on built-in types:

```go
type UserID int

type Email string
```

Custom types improve code clarity and type safety.

---

## Structs

Structs are collections of fields:

```go
type User struct {
    ID    UserID
    Name  string
    Email Email
}
```

---

## Interfaces

Interfaces define behavior:

```go
type Stringer interface {
    String() string
}
```

Any type that implements the methods of an interface satisfies it implicitly.

---

## Type Aliases

Type aliases let you create alternative names for existing types:

```go
type Rune = int32
```

---

## Practical Tips

- Use `iota` for enums and state machines.
- Prefer custom types for domain-specific concepts.
- Use interfaces to decouple code and enable testing.
- Use structs to group related data.

---

Understanding Go's type system helps you write safer, more maintainable code. Next, explore Go's application building blocks and patterns.