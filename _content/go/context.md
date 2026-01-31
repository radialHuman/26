# Deep Dive: Context in Go

The `context` package in Go is essential for managing deadlines, cancellation signals, and request-scoped values across API boundaries. It is widely used for graceful shutdowns, timeouts, and propagating metadata.

---

## What is Context?
A `Context` carries deadlines, cancellation signals, and other request-scoped values across goroutines and API boundaries.

---

## Creating a Context
- **Background Context:**
  ```go
  ctx := context.Background()
  ```
- **TODO Context:**
  ```go
  ctx := context.TODO()
  ```

---

## Cancellation and Timeouts
- **WithCancel:**
  ```go
  ctx, cancel := context.WithCancel(context.Background())
  defer cancel()
  ```
- **WithTimeout:**
  ```go
  ctx, cancel := context.WithTimeout(context.Background(), 2*time.Second)
  defer cancel()
  ```
- **WithDeadline:**
  ```go
  ctx, cancel := context.WithDeadline(context.Background(), time.Now().Add(2*time.Second))
  defer cancel()
  ```

---

## Passing Context
Always pass context as the first argument to functions and methods:
```go
func Process(ctx context.Context, data string) error {
    // ...
}
```

---

## Checking for Cancellation
```go
select {
case <-ctx.Done():
    // handle cancellation or timeout
    return ctx.Err()
default:
    // continue work
}
```

---

## Storing and Retrieving Values
Use context values sparingly for request-scoped data:
```go
ctx = context.WithValue(ctx, "userID", 123)
userID := ctx.Value("userID")
```

---

## Graceful Shutdown Example
```go
srv := &http.Server{Addr: ":8080"}
go func() {
    if err := srv.ListenAndServe(); err != http.ErrServerClosed {
        log.Fatalf("ListenAndServe(): %s", err)
    }
}()
// Wait for interrupt signal
<-stop
ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
defer cancel()
if err := srv.Shutdown(ctx); err != nil {
    log.Fatalf("Server Shutdown Failed:%+v", err)
}
```

---

## Best Practices
- Always pass context explicitly.
- Use context for cancellation, timeouts, and request-scoped data.
- Avoid storing large or global data in context.
- Cancel contexts to free resources.

---

Mastering context is crucial for building robust, scalable, and maintainable Go applications.