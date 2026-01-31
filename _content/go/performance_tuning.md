# Performance Tuning in Go

Optimizing performance is crucial for scalable Go applications. This chapter covers profiling, benchmarking, memory management, and garbage collector (GC) tuning.

---

## Profiling
- Use the `pprof` tool to profile CPU, memory, and goroutine usage:
  ```go
  import _ "net/http/pprof"
  // Start HTTP server for pprof
  go http.ListenAndServe(":6060", nil)
  ```
- Analyze profiles with:
  ```sh
  go tool pprof http://localhost:6060/debug/pprof/profile
  ```

---

## Benchmarking
- Write benchmarks using the `testing` package:
  ```go
  func BenchmarkAdd(b *testing.B) {
      for i := 0; i < b.N; i++ {
          Add(2, 3)
      }
  }
  ```
- Run with:
  ```sh
  go test -bench .
  ```

---

## Memory Management
- Minimize allocations by reusing objects (sync.Pool).
- Avoid unnecessary slices/maps growth.
- Use escape analysis (`go build -gcflags="-m"`).

---

## GC Tuning
- Go's GC is automatic, but you can tune it with `GOGC`:
  ```sh
  GOGC=200 ./app  # Increase GC target percentage
  ```
- Monitor GC stats with `runtime.ReadMemStats`.

---

## Best Practices
- Profile before optimizing.
- Focus on bottlenecks, not micro-optimizations.
- Use benchmarks to validate improvements.
- Monitor performance in production.

---

Performance tuning is an ongoing process. Use Go's tools to keep your applications fast and efficient.