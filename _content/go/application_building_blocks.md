# Go Application Building Blocks

Go provides a set of core features and patterns that are essential for building robust applications. This chapter summarizes key building blocks and practical advice for real-world Go development.

---

## Structs and Composition

- **Structs** group related data:
  ```go
  type User struct {
      ID    int
      Name  string
      Email string
  }
  ```
- **Composition** is preferred over inheritance:
  ```go
  type Logger struct { /* ... */ }
  type Service struct {
      Logger
      // other fields
  }
  ```

---

## Interfaces and Polymorphism

- **Interfaces** define behavior, not data:
  ```go
  type Reader interface {
      Read(p []byte) (n int, err error)
  }
  ```
- Any type that implements the interface's methods satisfies it.

---

## Slices and Maps

- **Slices** are dynamic arrays:
  ```go
  users := []User{}
  users = append(users, User{ID: 1, Name: "Alice"})
  ```
- **Maps** are key-value stores:
  ```go
  userMap := map[int]User{}
  userMap[1] = User{ID: 1, Name: "Alice"}
  ```

---

## Error Patterns

- **Error values** are returned as the last return value:
  ```go
  func ReadFile(path string) ([]byte, error) {
      // ...
  }
  ```
- **Custom error types** for richer error handling:
  ```go
  type NotFoundError struct {
      Path string
  }
  func (e NotFoundError) Error() string {
      return "not found: " + e.Path
  }
  ```

---

## Context for Cancellation

- Use the `context` package to manage timeouts and cancellation:
  ```go
  import "context"
  ctx, cancel := context.WithTimeout(context.Background(), time.Second)
  defer cancel()
  ```

---

## Dependency Injection

- Pass dependencies as interfaces for testability and flexibility.
- Avoid global state.

---

## Logging and Observability

- Use structured logging (e.g., `log`, `zap`, `logrus`).
- Add metrics and tracing for production systems.

---

## Practical Tips

- Keep functions small and focused.
- Use idiomatic Go patterns (see https://golang.org/doc/effective_go.html).
- Write tests for all critical logic.
- Prefer composition and interfaces for extensibility.

---

Mastering these building blocks will help you design maintainable, scalable Go applications.