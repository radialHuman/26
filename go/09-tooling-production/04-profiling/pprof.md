# Performance Profiling (pprof)

## What is pprof?

**pprof** is Go's built-in profiling tool for:
- **CPU Profiling**: Where time is spent
- **Memory Profiling**: Allocation patterns
- **Goroutine Profiling**: Concurrency analysis
- **Block Profiling**: Blocking operations
- **Mutex Profiling**: Lock contention

## Why Profile?

Find performance bottlenecks:
- **Slow Functions**: CPU-intensive code
- **Memory Leaks**: Growing memory usage
- **Goroutine Leaks**: Too many goroutines
- **Lock Contention**: Blocked by mutexes

## Enable pprof in Web App

```go
package main

import (
    "net/http"
    _ "net/http/pprof" // Import for side effects
    
    "github.com/gin-gonic/gin"
)

func main() {
    r := gin.Default()
    
    // Your routes
    r.GET("/api/users", getUsers)
    
    // Start pprof server on separate port
    go func() {
        http.ListenAndServe("localhost:6060", nil)
    }()
    
    r.Run(":8080")
}
```

Access profiles at:
- `http://localhost:6060/debug/pprof/` - Index
- `http://localhost:6060/debug/pprof/profile` - CPU profile
- `http://localhost:6060/debug/pprof/heap` - Memory profile
- `http://localhost:6060/debug/pprof/goroutine` - Goroutines

## CPU Profiling

### Capture CPU Profile

```bash
# Capture 30 seconds of CPU profile
curl -o cpu.prof http://localhost:6060/debug/pprof/profile?seconds=30

# Analyze with pprof
go tool pprof cpu.prof
```

### pprof Commands

```bash
# Interactive mode
(pprof) top
# Shows top CPU consumers

(pprof) top10
# Top 10 functions

(pprof) list functionName
# Show source code with annotations

(pprof) web
# Open graph in browser (requires Graphviz)

(pprof) pdf > profile.pdf
# Export to PDF
```

### Example Output

```
(pprof) top10
Showing nodes accounting for 2.50s, 83.33% of 3.00s total
      flat  flat%   sum%        cum   cum%
     1.20s 40.00% 40.00%      1.20s 40.00%  runtime.mallocgc
     0.50s 16.67% 56.67%      0.50s 16.67%  encoding/json.(*decodeState).scanWhile
     0.30s 10.00% 66.67%      0.40s 13.33%  myapp/service.(*UserService).GetUsers
     0.25s  8.33% 75.00%      0.25s  8.33%  runtime.memmove
     0.15s  5.00% 80.00%      0.80s 26.67%  database/sql.(*DB).QueryContext
```

### Programmatic Profiling

```go
package main

import (
    "os"
    "runtime/pprof"
    "time"
)

func profileCPU() {
    f, err := os.Create("cpu.prof")
    if err != nil {
        panic(err)
    }
    defer f.Close()
    
    // Start CPU profiling
    pprof.StartCPUProfile(f)
    defer pprof.StopCPUProfile()
    
    // Run your code
    runBenchmark()
}

func runBenchmark() {
    // Simulate work
    for i := 0; i < 1000000; i++ {
        processData(i)
    }
}
```

## Memory Profiling

### Capture Heap Profile

```bash
# Current memory usage
curl -o mem.prof http://localhost:6060/debug/pprof/heap

# Analyze
go tool pprof mem.prof
```

### Memory Stats

```bash
(pprof) top
Showing nodes accounting for 512MB, 85.33% of 600MB total
      flat  flat%   sum%        cum   cum%
   200.00MB 33.33% 33.33%   200.00MB 33.33%  main.(*Cache).Set
   150.00MB 25.00% 58.33%   150.00MB 25.00%  encoding/json.Marshal
   100.00MB 16.67% 75.00%   100.00MB 16.67%  main.loadUsers
    62.00MB 10.33% 85.33%    62.00MB 10.33%  bytes.makeSlice
```

### Memory in Code

```go
package main

import (
    "runtime"
    "runtime/pprof"
)

func profileMemory() {
    f, _ := os.Create("mem.prof")
    defer f.Close()
    
    // Run your code
    runMemoryIntensive()
    
    // Force GC to get accurate stats
    runtime.GC()
    
    // Write heap profile
    pprof.WriteHeapProfile(f)
}

func runMemoryIntensive() {
    data := make([][]byte, 1000)
    for i := range data {
        data[i] = make([]byte, 1024*1024) // 1MB each
    }
}
```

## Goroutine Profiling

### Check Goroutine Count

```bash
# Get goroutine dump
curl http://localhost:6060/debug/pprof/goroutine?debug=2
```

### Output

```
goroutine profile: total 42
10 @ 0x4365c6 0x4449f9 0x96fa26 0x96f65f 0x4619e1
#   10 goroutines stuck in database/sql.(*DB).connectionOpener

5 @ 0x4365c6 0x430a0a 0x96e6c5 0x4619e1
#   5 goroutines stuck in net/http.(*conn).serve

1 @ 0x4365c6 0x4449f9 0x96fb06 0x4619e1
#   main goroutine
```

### Monitor Goroutines

```go
package main

import (
    "runtime"
    "time"
    
    "github.com/prometheus/client_golang/prometheus"
    "github.com/prometheus/client_golang/prometheus/promauto"
)

var goroutineCount = promauto.NewGauge(prometheus.GaugeOpts{
    Name: "goroutine_count",
    Help: "Current number of goroutines",
})

func monitorGoroutines() {
    ticker := time.NewTicker(10 * time.Second)
    defer ticker.Stop()
    
    for range ticker.C {
        count := runtime.NumGoroutine()
        goroutineCount.Set(float64(count))
        
        if count > 1000 {
            log.Printf("WARNING: High goroutine count: %d", count)
        }
    }
}

// Start monitoring
go monitorGoroutines()
```

## Benchmarking

### Write Benchmarks

```go
package main

import (
    "testing"
)

func BenchmarkGetUsers(b *testing.B) {
    // Setup
    db := setupTestDB()
    repo := NewUserRepository(db)
    
    b.ResetTimer() // Reset timer after setup
    
    for i := 0; i < b.N; i++ {
        repo.GetByID(context.Background(), 1)
    }
}

func BenchmarkJSONMarshal(b *testing.B) {
    user := User{
        ID:    1,
        Name:  "John Doe",
        Email: "john@example.com",
    }
    
    for i := 0; i < b.N; i++ {
        json.Marshal(user)
    }
}

// Run with memory allocation stats
func BenchmarkAllocation(b *testing.B) {
    b.ReportAllocs() // Report allocations
    
    for i := 0; i < b.N; i++ {
        data := make([]byte, 1024)
        _ = data
    }
}
```

### Run Benchmarks

```bash
# Run all benchmarks
go test -bench=. -benchmem

# Output:
# BenchmarkGetUsers-8       10000    150000 ns/op    5000 B/op    50 allocs/op
# BenchmarkJSONMarshal-8   100000     12000 ns/op    1024 B/op    10 allocs/op

# Run specific benchmark
go test -bench=BenchmarkGetUsers

# Generate CPU profile
go test -bench=. -cpuprofile=cpu.prof

# Generate memory profile
go test -bench=. -memprofile=mem.prof
```

## Trace Analysis

Detailed execution trace.

```go
package main

import (
    "os"
    "runtime/trace"
)

func main() {
    f, _ := os.Create("trace.out")
    defer f.Close()
    
    // Start trace
    trace.Start(f)
    defer trace.Stop()
    
    // Run your code
    runApplication()
}
```

View trace:
```bash
go tool trace trace.out
# Opens browser with interactive trace viewer
```

## Common Performance Issues

### 1. Too Many Allocations

```go
// BAD: Allocates on every call
func formatUser(user User) string {
    return fmt.Sprintf("User: %s (%s)", user.Name, user.Email)
}

// GOOD: Preallocate buffer
func formatUserEfficient(user User) string {
    var buf strings.Builder
    buf.Grow(100) // Preallocate
    buf.WriteString("User: ")
    buf.WriteString(user.Name)
    buf.WriteString(" (")
    buf.WriteString(user.Email)
    buf.WriteString(")")
    return buf.String()
}
```

### 2. String Concatenation

```go
// BAD: Multiple allocations
func buildQuery(fields []string) string {
    query := "SELECT "
    for i, field := range fields {
        query += field
        if i < len(fields)-1 {
            query += ", "
        }
    }
    return query
}

// GOOD: Use strings.Builder
func buildQueryEfficient(fields []string) string {
    var b strings.Builder
    b.WriteString("SELECT ")
    for i, field := range fields {
        b.WriteString(field)
        if i < len(fields)-1 {
            b.WriteString(", ")
        }
    }
    return b.String()
}
```

### 3. Unnecessary JSON Marshal/Unmarshal

```go
// BAD: Marshal then unmarshal
func copyUser(user User) User {
    data, _ := json.Marshal(user)
    var copy User
    json.Unmarshal(data, &copy)
    return copy
}

// GOOD: Direct copy
func copyUserEfficient(user User) User {
    return User{
        ID:    user.ID,
        Name:  user.Name,
        Email: user.Email,
    }
}
```

### 4. Goroutine Leaks

```go
// BAD: Goroutine never exits
func processEvents() {
    ch := make(chan Event)
    go func() {
        for event := range ch {
            process(event)
        }
    }()
    // Goroutine leaks if ch is never closed
}

// GOOD: Use context for cancellation
func processEventsWithContext(ctx context.Context) {
    ch := make(chan Event)
    go func() {
        for {
            select {
            case event := <-ch:
                process(event)
            case <-ctx.Done():
                return // Exit goroutine
            }
        }
    }()
}
```

## Performance Monitoring in Production

```go
package metrics

import (
    "runtime"
    "time"
    
    "github.com/prometheus/client_golang/prometheus"
    "github.com/prometheus/client_golang/prometheus/promauto"
)

var (
    memoryUsage = promauto.NewGauge(prometheus.GaugeOpts{
        Name: "memory_usage_bytes",
        Help: "Current memory usage in bytes",
    })
    
    goroutines = promauto.NewGauge(prometheus.GaugeOpts{
        Name: "goroutine_count",
        Help: "Current number of goroutines",
    })
    
    gcPauses = promauto.NewHistogram(prometheus.HistogramOpts{
        Name:    "gc_pause_seconds",
        Help:    "GC pause duration",
        Buckets: prometheus.DefBuckets,
    })
)

func CollectMetrics() {
    ticker := time.NewTicker(10 * time.Second)
    defer ticker.Stop()
    
    for range ticker.C {
        var m runtime.MemStats
        runtime.ReadMemStats(&m)
        
        memoryUsage.Set(float64(m.Alloc))
        goroutines.Set(float64(runtime.NumGoroutine()))
        
        // GC stats
        gcPauses.Observe(float64(m.PauseNs[(m.NumGC+255)%256]) / 1e9)
    }
}

// Start in main
go CollectMetrics()
```

## Best Practices

1. **Profile in Production**: Use pprof endpoints
2. **Benchmark Regularly**: Track performance over time
3. **Monitor Goroutines**: Detect leaks early
4. **Optimize Allocations**: Reduce GC pressure
5. **Use Pools**: `sync.Pool` for reusable objects
6. **Preallocate Slices**: When size is known
7. **Profile Before Optimizing**: Measure, don't guess

## Tools

- **pprof**: Built-in profiler
- **trace**: Execution tracer
- **benchstat**: Compare benchmark results
- **go-torch**: Flame graphs (deprecated, use pprof)
- **Prometheus**: Production metrics

## Summary

Performance profiling:
- **CPU Profile**: Find slow functions
- **Memory Profile**: Detect leaks and allocations
- **Goroutine Profile**: Monitor concurrency
- **Benchmarks**: Measure improvements
- **Trace**: Detailed execution analysis

Essential for optimizing Go applications.
