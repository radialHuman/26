# API Design in Go: REST and gRPC

Designing robust APIs is essential for scalable applications. This chapter covers REST and gRPC best practices, versioning, documentation, and error handling in Go.

---

## REST APIs
- Use the `net/http` package or frameworks like Gin, Fiber.
- Follow RESTful conventions: resources, HTTP verbs, status codes.

```go
http.HandleFunc("/users", func(w http.ResponseWriter, r *http.Request) {
    // Handle GET, POST, etc.
})
```

---

## gRPC APIs
- Use `google.golang.org/grpc` for high-performance RPC.
- Define services and messages in `.proto` files.
- Generate Go code with `protoc`.

---

## Versioning
- Use URL versioning (`/v1/users`) or headers.
- Maintain backward compatibility.

---

## Documentation
- Use Swagger/OpenAPI for REST (`github.com/swaggo/swag`).
- Use `protoc-gen-doc` for gRPC.

---

## Error Handling
- Return appropriate HTTP status codes and error messages.
- For gRPC, use standard error codes and messages.

---

## Best Practices
- Validate input and output.
- Use context for timeouts and cancellation.
- Secure APIs with authentication and authorization.
- Write tests for all endpoints.

---

Well-designed APIs are critical for maintainable, scalable Go applications.