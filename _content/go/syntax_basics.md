# Go Syntax Basics

Go's syntax is designed to be simple, clean, and easy to learn. This chapter covers the fundamental syntax of Go, including variables, functions, control structures, and more.

---

## Variables

### Declaring Variables
Variables in Go can be declared using the `var` keyword or the shorthand `:=` operator.

```go
package main

import "fmt"

func main() {
    // Using var keyword
    var name string = "Alice"
    var age int = 25

    // Using shorthand
    city := "New York"

    fmt.Println(name, age, city)
}
```

### Constants
Constants are declared using the `const` keyword and cannot be changed.

```go
const Pi = 3.14
const Greeting = "Hello, World!"
```

---

## Functions

### Declaring Functions
Functions in Go are declared using the `func` keyword.

```go
func add(a int, b int) int {
    return a + b
}

func main() {
    result := add(3, 5)
    fmt.Println("Sum:", result)
}
```

### Multiple Return Values
Go functions can return multiple values.

```go
func divide(a, b int) (int, int) {
    return a / b, a % b
}

func main() {
    quotient, remainder := divide(10, 3)
    fmt.Println("Quotient:", quotient, "Remainder:", remainder)
}
```

---

## Control Structures

### If-Else
```go
if age := 25; age > 18 {
    fmt.Println("Adult")
} else {
    fmt.Println("Minor")
}
```

### Switch
Switch statements in Go are more flexible than in many other languages.

```go
switch day := "Monday"; day {
case "Monday":
    fmt.Println("Start of the week")
case "Friday":
    fmt.Println("End of the work week")
default:
    fmt.Println("Midweek")
}
```

### For Loop
Go uses a single `for` loop for all looping needs.

```go
for i := 0; i < 5; i++ {
    fmt.Println(i)
}
```

---

## Pointers

Go supports pointers, allowing you to work with memory addresses.

```go
func main() {
    x := 10
    p := &x // Pointer to x

    fmt.Println(*p) // Dereference pointer
    *p = 20         // Modify value through pointer
    fmt.Println(x)
}
}
```

---

## Structs

Structs are used to define custom data types.

```go
type Person struct {
    Name string
    Age  int
}

func main() {
    p := Person{Name: "Alice", Age: 25}
    fmt.Println(p.Name, p.Age)
}
```

---

## Interfaces

Interfaces define a set of methods that a type must implement.

```go
type Shape interface {
    Area() float64
}

type Circle struct {
    Radius float64
}

func (c Circle) Area() float64 {
    return 3.14 * c.Radius * c.Radius
}

func main() {
    var s Shape = Circle{Radius: 5}
    fmt.Println("Area:", s.Area())
}
```

---

This chapter provides an overview of Go's basic syntax. In the next sections, we will explore advanced features like error handling, concurrency, and package management.