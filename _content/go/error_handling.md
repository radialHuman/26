# Error Handling in Go

Error handling in Go is explicit and straightforward, making it easier to identify and manage errors in your code. This chapter covers Go's error handling mechanisms, best practices, and common patterns.

---

## Errors in Go

### The `error` Type
In Go, errors are represented by the built-in `error` type.

```go
package main

import (
    "errors"
    "fmt"
)

func divide(a, b int) (int, error) {
    if b == 0 {
        return 0, errors.New("division by zero")
    }
    return a / b, nil
}

func main() {
    result, err := divide(10, 0)
    if err != nil {
        fmt.Println("Error:", err)
        return
    }
    fmt.Println("Result:", result)
}
```

---

## Custom Errors

You can create custom error types by implementing the `Error()` method.

```go
type CustomError struct {
    Code    int
    Message string
}

func (e CustomError) Error() string {
    return fmt.Sprintf("Error %d: %s", e.Code, e.Message)
}

func main() {
    err := CustomError{Code: 404, Message: "Not Found"}
    fmt.Println(err)
}
```

---

## Panic and Recover

### Panic
`panic` is used to terminate the program when an unrecoverable error occurs.

```go
func main() {
    panic("Something went wrong!")
}
```

### Recover
`recover` is used to regain control of a panicking program.

```go
func main() {
    defer func() {
        if r := recover(); r != nil {
            fmt.Println("Recovered from panic:", r)
        }
    }()

    panic("Unexpected error")
}
```

---

## Best Practices

1. **Check Errors Explicitly:**
   - Always check the return value of functions that return an error.

2. **Use Descriptive Error Messages:**
   - Provide meaningful error messages to help with debugging.

3. **Avoid Panics in Production Code:**
   - Use `panic` only for unrecoverable errors.

4. **Wrap Errors:**
   - Use `fmt.Errorf` to add context to errors.
   ```go
   if err != nil {
       return fmt.Errorf("failed to open file: %w", err)
   }
   ```

5. **Log Errors:**
   - Use logging libraries like `log` or `zap` to record errors.

---

## Common Patterns

### Sentinel Errors
Predefined errors that can be compared using `==`.

```go
var ErrNotFound = errors.New("not found")

func findItem(id int) error {
    return ErrNotFound
}

func main() {
    err := findItem(1)
    if errors.Is(err, ErrNotFound) {
        fmt.Println("Item not found")
    }
}
```

### Error Wrapping
Wrap errors to provide additional context.

```go
import "fmt"

func openFile(filename string) error {
    return fmt.Errorf("error opening file %s: %w", filename, errors.New("file not found"))
}
```

---

Error handling in Go emphasizes simplicity and clarity. By following best practices, you can write robust and maintainable code. In the next chapter, we will explore Go's package management and modularity.