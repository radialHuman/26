# Middleware Patterns in Go

Middleware is a function that wraps HTTP handlers to add cross-cutting concerns like logging, authentication, or error handling. Go supports middleware both in the standard library and in web frameworks.

---

## Middleware with net/http

You can create middleware by writing a function that takes and returns an `http.Handler`:

```go
func LoggingMiddleware(next http.Handler) http.Handler {
    return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
        log.Printf("%s %s", r.Method, r.URL.Path)
        next.ServeHTTP(w, r)
    })
}

// Usage
mux := http.NewServeMux()
mux.HandleFunc("/", handler)
http.ListenAndServe(":8080", LoggingMiddleware(mux))
```

---

## Middleware in Fiber

Fiber uses a similar pattern, but with its own API:

```go
app.Use(func(c *fiber.Ctx) error {
    fmt.Println("Request: ", c.Path())
    return c.Next()
})
```

---

## Middleware Chaining

You can chain multiple middleware functions:

```go
func ChainMiddleware(h http.Handler, mws ...func(http.Handler) http.Handler) http.Handler {
    for i := len(mws) - 1; i >= 0; i-- {
        h = mws[i](h)
    }
    return h
}
```

---

## Common Middleware Use Cases
- Logging
- Authentication/Authorization
- Panic recovery
- CORS
- Rate limiting
- Request/response modification

---

## When to Use Middleware
- For reusable, cross-cutting logic
- To keep handlers focused on business logic

## When Not to Use Middleware
- For logic that is specific to a single handler
- When it adds unnecessary complexity

---

Middleware is a powerful pattern for structuring Go web applications. Use it to keep your code modular, reusable, and maintainable.