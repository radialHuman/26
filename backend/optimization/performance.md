# Performance Optimization: Complete Production Guide

## Table of Contents
1. [Performance Fundamentals](#performance-fundamentals)
2. [Profiling & Measurement](#profiling--measurement)
3. [Algorithmic Optimization](#algorithmic-optimization)
4. [Database Optimization](#database-optimization)
5. [Caching Strategies](#caching-strategies)
6. [Concurrency & Parallelism](#concurrency--parallelism)
7. [Network Optimization](#network-optimization)
8. [Memory Optimization](#memory-optimization)
9. [Production Monitoring](#production-monitoring)
10. [Complete Optimization Checklist](#complete-optimization-checklist)

---

## Performance Fundamentals

### The Golden Rule

> **"Premature optimization is the root of all evil"** - Donald Knuth

**Approach**:
```
1. Measure (establish baseline)
2. Identify bottleneck
3. Optimize bottleneck
4. Measure again (verify improvement)
5. Repeat
```

### Performance Metrics

**Latency**: Time to complete request
```
p50 (median):  50% of requests complete in X ms
p95:           95% of requests complete in X ms
p99:           99% of requests complete in X ms
p99.9:         99.9% of requests complete in X ms

Example:
p50 = 50ms   (Good for most users)
p95 = 100ms  (5% experience 100ms)
p99 = 500ms  (1% experience 500ms - tail latency!)
```

**Throughput**: Requests per second (RPS/QPS)
```
Measure: requests/second
Target: Maximize while maintaining acceptable latency
```

**Resource Utilization**:
```
CPU:    < 70% (leave headroom for spikes)
Memory: < 80% (avoid OOM)
Disk:   < 80% I/O
Network: < 70% bandwidth
```

---

## Profiling & Measurement

### Go Profiling

**CPU Profiling**:
```go
package main

import (
	"log"
	"os"
	"runtime/pprof"
)

func main() {
	// Start CPU profiling
	f, err := os.Create("cpu.prof")
	if err != nil {
		log.Fatal(err)
	}
	defer f.Close()
	
	pprof.StartCPUProfile(f)
	defer pprof.StopCPUProfile()
	
	// Your code here
	heavyComputation()
}

func heavyComputation() {
	for i := 0; i < 1000000; i++ {
		_ = fibonacci(30)
	}
}

func fibonacci(n int) int {
	if n <= 1 {
		return n
	}
	return fibonacci(n-1) + fibonacci(n-2)
}
```

**Analyze**:
```bash
go tool pprof cpu.prof

# Interactive commands:
(pprof) top      # Show top functions by CPU time
(pprof) list fibonacci  # Show source with annotations
(pprof) web      # Generate call graph (requires graphviz)
```

**Memory Profiling**:
```go
package main

import (
	"log"
	"os"
	"runtime"
	"runtime/pprof"
)

func main() {
	defer func() {
		f, _ := os.Create("mem.prof")
		defer f.Close()
		runtime.GC()
		pprof.WriteHeapProfile(f)
	}()
	
	allocateMemory()
}

func allocateMemory() {
	var data [][]int
	for i := 0; i < 1000; i++ {
		data = append(data, make([]int, 10000))
	}
}
```

**Analyze**:
```bash
go tool pprof mem.prof

(pprof) top          # Top memory consumers
(pprof) list allocateMemory
```

### Python Profiling

**cProfile**:
```python
import cProfile
import pstats

def slow_function():
    total = 0
    for i in range(1000000):
        total += i
    return total

# Profile
cProfile.run('slow_function()', 'profile.stats')

# Analyze
p = pstats.Stats('profile.stats')
p.strip_dirs().sort_stats('cumulative').print_stats(10)
```

**line_profiler** (Line-by-line):
```python
from line_profiler import LineProfiler

@profile
def slow_function():
    total = 0
    for i in range(1000000):
        total += i
    
    result = []
    for i in range(100000):
        result.append(i ** 2)
    
    return total, result

# Run: kernprof -l -v script.py
```

**Output**:
```
Line #      Hits         Time  Per Hit   % Time  Line Contents
==============================================================
     3                                           @profile
     4                                           def slow_function():
     5         1          1.0      1.0      0.0      total = 0
     6   1000001     148023.0      0.1     23.5      for i in range(1000000):
     7   1000000     143718.0      0.1     22.8          total += i
     8                                           
     9         1          1.0      1.0      0.0      result = []
    10    100001      17965.0      0.2      2.8      for i in range(100000):
    11    100000     320912.0      3.2     50.9          result.append(i ** 2)
    12                                           
    13         1          0.0      0.0      0.0      return total, result
```

---

## Algorithmic Optimization

### Time Complexity Analysis

**Common Complexities**:
```
O(1)        Constant    Hash table lookup
O(log n)    Logarithmic Binary search
O(n)        Linear      Single loop
O(n log n)  Linearithmic Efficient sorting
O(n²)       Quadratic   Nested loops
O(2ⁿ)       Exponential Recursive fibonacci
```

**Example Optimization**:

**Slow O(n²)**:
```python
def has_duplicates(arr):
    for i in range(len(arr)):
        for j in range(i + 1, len(arr)):
            if arr[i] == arr[j]:
                return True
    return False

# Time: O(n²)
# For n=10,000: ~100,000,000 operations
```

**Fast O(n)**:
```python
def has_duplicates(arr):
    seen = set()
    for num in arr:
        if num in seen:
            return True
        seen.add(num)
    return False

# Time: O(n)
# For n=10,000: ~10,000 operations (10,000x faster!)
```

### Fibonacci Optimization

**Naive Recursive O(2ⁿ)**:
```python
def fib(n):
    if n <= 1:
        return n
    return fib(n-1) + fib(n-2)

# fib(40) = ~1 second
# fib(50) = ~20 minutes!
```

**Memoization O(n)**:
```python
def fib(n, memo={}):
    if n in memo:
        return memo[n]
    
    if n <= 1:
        return n
    
    memo[n] = fib(n-1, memo) + fib(n-2, memo)
    return memo[n]

# fib(50) = instant!
```

**Iterative O(n)**:
```python
def fib(n):
    if n <= 1:
        return n
    
    a, b = 0, 1
    for _ in range(2, n + 1):
        a, b = b, a + b
    
    return b

# Even faster, no recursion overhead
```

---

## Database Optimization

### Indexing

**Problem**: Slow queries.

**Example**:
```sql
-- Slow (full table scan)
SELECT * FROM users WHERE email = 'alice@example.com';

-- Execution time: 500ms for 1M rows
```

**Solution**: Add index.
```sql
CREATE INDEX idx_users_email ON users(email);

-- Now: 5ms (100x faster!)
```

**Explain Query**:
```sql
EXPLAIN SELECT * FROM users WHERE email = 'alice@example.com';

-- Without index:
Seq Scan on users  (cost=0.00..25000.00 rows=1 width=100)
  Filter: (email = 'alice@example.com'::text)

-- With index:
Index Scan using idx_users_email on users  (cost=0.43..8.45 rows=1 width=100)
  Index Cond: (email = 'alice@example.com'::text)
```

### Query Optimization

**N+1 Problem**:
```python
# Bad: 1 + N queries
users = db.execute("SELECT * FROM users LIMIT 100")

for user in users:
    orders = db.execute("SELECT * FROM orders WHERE user_id = ?", user['id'])
    # 1 query for users + 100 queries for orders = 101 queries!
```

**Solution: Join**:
```python
# Good: 1 query
result = db.execute("""
    SELECT u.*, o.*
    FROM users u
    LEFT JOIN orders o ON u.id = o.user_id
    LIMIT 100
""")
```

**Pagination Optimization**:

**Slow (OFFSET)**:
```sql
-- Offset-based pagination (slow for large offsets)
SELECT * FROM users
ORDER BY created_at DESC
LIMIT 20 OFFSET 1000000;

-- Execution time: 5s (scans 1M rows)
```

**Fast (Cursor)**:
```sql
-- Cursor-based pagination
SELECT * FROM users
WHERE id > 1000000
ORDER BY id
LIMIT 20;

-- Execution time: 10ms (uses index)
```

### Connection Pooling

**Problem**: Opening DB connection is expensive (~10-100ms).

**Solution**: Reuse connections.

```python
from sqlalchemy import create_engine
from sqlalchemy.pool import QueuePool

engine = create_engine(
    'postgresql://user:pass@localhost/db',
    poolclass=QueuePool,
    pool_size=10,        # Keep 10 connections open
    max_overflow=20,     # Allow 20 extra connections
    pool_timeout=30,     # Wait 30s for connection
    pool_recycle=3600    # Recycle connections after 1 hour
)
```

---

## Caching Strategies

### Cache Layers

```
┌─────────────────────────────────┐
│ Client (Browser Cache)          │ ← Static assets (CSS, JS)
└────────────┬────────────────────┘
             ▼
┌─────────────────────────────────┐
│ CDN (CloudFlare, CloudFront)    │ ← Images, videos
└────────────┬────────────────────┘
             ▼
┌─────────────────────────────────┐
│ Application Cache (Redis)       │ ← API responses, sessions
└────────────┬────────────────────┘
             ▼
┌─────────────────────────────────┐
│ Database Query Cache            │ ← Query results
└────────────┬────────────────────┘
             ▼
┌─────────────────────────────────┐
│ Database (PostgreSQL)           │
└─────────────────────────────────┘
```

### Redis Caching (Go)

```go
package main

import (
	"context"
	"encoding/json"
	"time"
	
	"github.com/go-redis/redis/v8"
)

var ctx = context.Background()
var rdb *redis.Client

func init() {
	rdb = redis.NewClient(&redis.Options{
		Addr: "localhost:6379",
	})
}

type User struct {
	ID    int    `json:"id"`
	Name  string `json:"name"`
	Email string `json:"email"`
}

func getUser(userID int) (*User, error) {
	// Try cache first
	cacheKey := fmt.Sprintf("user:%d", userID)
	cached, err := rdb.Get(ctx, cacheKey).Result()
	
	if err == redis.Nil {
		// Cache miss, query database
		user, err := queryUserFromDB(userID)
		if err != nil {
			return nil, err
		}
		
		// Store in cache (TTL: 1 hour)
		data, _ := json.Marshal(user)
		rdb.Set(ctx, cacheKey, data, time.Hour)
		
		return user, nil
	} else if err != nil {
		return nil, err
	}
	
	// Cache hit
	var user User
	json.Unmarshal([]byte(cached), &user)
	return &user, nil
}

func queryUserFromDB(userID int) (*User, error) {
	// Simulate slow DB query
	time.Sleep(100 * time.Millisecond)
	
	return &User{
		ID:    userID,
		Name:  "Alice",
		Email: "alice@example.com",
	}, nil
}
```

**Result**:
```
First request:  100ms (DB query)
Cached requests: 1ms (Redis lookup, 100x faster!)
```

### Cache Invalidation

**Strategies**:

**1. TTL (Time To Live)**:
```python
cache.set('user:123', user_data, ttl=3600)  # Expires after 1 hour
```

**2. Cache-Aside (Lazy Loading)**:
```python
def get_user(user_id):
    # Check cache
    user = cache.get(f'user:{user_id}')
    
    if not user:
        # Query DB
        user = db.get_user(user_id)
        # Update cache
        cache.set(f'user:{user_id}', user, ttl=3600)
    
    return user
```

**3. Write-Through**:
```python
def update_user(user_id, data):
    # Update DB
    db.update_user(user_id, data)
    
    # Update cache
    user = db.get_user(user_id)
    cache.set(f'user:{user_id}', user, ttl=3600)
```

**4. Event-Driven Invalidation**:
```python
# On user update event
def handle_user_updated(event):
    user_id = event['user_id']
    cache.delete(f'user:{user_id}')
```

---

## Concurrency & Parallelism

### Go Goroutines

**Sequential**:
```go
func processItems(items []int) {
	for _, item := range items {
		process(item)  // 100ms each
	}
}

// 1000 items × 100ms = 100 seconds
```

**Concurrent**:
```go
func processItems(items []int) {
	var wg sync.WaitGroup
	
	for _, item := range items {
		wg.Add(1)
		
		go func(i int) {
			defer wg.Done()
			process(i)
		}(item)
	}
	
	wg.Wait()
}

// 1000 items, all in parallel = ~100ms total!
```

**Worker Pool** (Control Parallelism):
```go
func processItems(items []int, numWorkers int) {
	jobs := make(chan int, len(items))
	var wg sync.WaitGroup
	
	// Start workers
	for w := 0; w < numWorkers; w++ {
		wg.Add(1)
		
		go func() {
			defer wg.Done()
			
			for item := range jobs {
				process(item)
			}
		}()
	}
	
	// Send jobs
	for _, item := range items {
		jobs <- item
	}
	close(jobs)
	
	wg.Wait()
}

// 1000 items, 10 workers: ~10 seconds (10x faster)
```

---

## Complete Optimization Checklist

**Application Level**:
```
✅ Profile first (CPU, memory)
✅ Optimize hot paths (functions consuming most time)
✅ Use efficient algorithms (O(n) vs O(n²))
✅ Minimize allocations
✅ Reuse objects (object pooling)
✅ Lazy loading
```

**Database Level**:
```
✅ Add indexes for frequent queries
✅ Avoid N+1 queries (use joins)
✅ Use connection pooling
✅ Optimize query plans (EXPLAIN)
✅ Denormalization for read-heavy workloads
✅ Pagination (cursor-based for large datasets)
```

**Caching**:
```
✅ Cache at multiple layers (CDN, Redis, in-memory)
✅ Set appropriate TTLs
✅ Invalidate on writes
✅ Cache hot data (80/20 rule)
```

**Network**:
```
✅ Use HTTP/2 (multiplexing)
✅ Compress responses (gzip, Brotli)
✅ Minimize payload size
✅ CDN for static assets
✅ Keep-alive connections
```

**Infrastructure**:
```
✅ Horizontal scaling (add more servers)
✅ Load balancing
✅ Auto-scaling based on metrics
✅ Monitor and alert (Prometheus, Grafana)
```

---

This comprehensive performance guide covers profiling, algorithmic optimization, database tuning, caching, and concurrency with production-ready implementations!
