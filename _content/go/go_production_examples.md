# Go Production Examples

This chapter provides targeted production examples for Go: gRPC streaming, worker pools, and an overview of service meshes (Istio / Linkerd) and where to use them.

---

## gRPC Streaming
- Use server-side, client-side, and bidirectional streams for efficient data transfer.
- Example: server streaming for log/event feeds.

---

## Worker Pools
- Implement worker pools to limit concurrency and control resource usage.
```go
type Job func()

func worker(id int, jobs <-chan Job, wg *sync.WaitGroup) {
    defer wg.Done()
    for job := range jobs {
        job()
    }
}
```

---

## Service Mesh Overview
- Service meshes add observability, routing, and security at the network layer.
- **Istio:** rich feature set, steeper learning curve.
- **Linkerd:** lightweight, simpler to operate.

When to use:
- Use service mesh for complex microservice environments needing advanced traffic control, mTLS, and observability.

---

These examples and patterns help bridge the gap between local development and production operations in Go.