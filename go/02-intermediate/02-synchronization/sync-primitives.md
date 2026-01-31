# Synchronization Primitives

## What is Synchronization?

Synchronization ensures safe concurrent access to shared resources. Go's `sync` package provides primitives to coordinate goroutines.

## sync.Mutex

### Basic Mutex Usage

```go
package main

import (
    "fmt"
    "sync"
)

type Counter struct {
    mu    sync.Mutex
    value int
}

func (c *Counter) Increment() {
    c.mu.Lock()
    defer c.mu.Unlock()
    c.value++
}

func (c *Counter) Value() int {
    c.mu.Lock()
    defer c.mu.Unlock()
    return c.value
}

func main() {
    counter := &Counter{}
    var wg sync.WaitGroup
    
    // Start 1000 goroutines
    for i := 0; i < 1000; i++ {
        wg.Add(1)
        go func() {
            defer wg.Done()
            counter.Increment()
        }()
    }
    
    wg.Wait()
    fmt.Println("Final count:", counter.Value())  // 1000
}
```

### Without Mutex (Race Condition)

```go
package main

import (
    "fmt"
    "sync"
)

type UnsafeCounter struct {
    value int
}

func (c *UnsafeCounter) Increment() {
    c.value++  // RACE CONDITION!
}

func main() {
    counter := &UnsafeCounter{}
    var wg sync.WaitGroup
    
    for i := 0; i < 1000; i++ {
        wg.Add(1)
        go func() {
            defer wg.Done()
            counter.Increment()
        }()
    }
    
    wg.Wait()
    fmt.Println("Final count:", counter.value)  // Unpredictable! (< 1000)
}
```

## sync.RWMutex

### Read-Write Mutex

Allows multiple readers OR one writer.

```go
package main

import (
    "fmt"
    "sync"
    "time"
)

type Cache struct {
    mu   sync.RWMutex
    data map[string]string
}

func NewCache() *Cache {
    return &Cache{
        data: make(map[string]string),
    }
}

// Write operation - exclusive lock
func (c *Cache) Set(key, value string) {
    c.mu.Lock()
    defer c.mu.Unlock()
    c.data[key] = value
}

// Read operation - shared lock
func (c *Cache) Get(key string) (string, bool) {
    c.mu.RLock()
    defer c.mu.RUnlock()
    val, ok := c.data[key]
    return val, ok
}

func main() {
    cache := NewCache()
    var wg sync.WaitGroup
    
    // Writer
    wg.Add(1)
    go func() {
        defer wg.Done()
        for i := 0; i < 5; i++ {
            cache.Set(fmt.Sprintf("key%d", i), fmt.Sprintf("value%d", i))
            time.Sleep(10 * time.Millisecond)
        }
    }()
    
    // Multiple readers (can read simultaneously)
    for i := 0; i < 10; i++ {
        wg.Add(1)
        go func(id int) {
            defer wg.Done()
            for j := 0; j < 5; j++ {
                if val, ok := cache.Get("key0"); ok {
                    fmt.Printf("Reader %d: %s\n", id, val)
                }
                time.Sleep(5 * time.Millisecond)
            }
        }(i)
    }
    
    wg.Wait()
}
```

### When to Use RWMutex

```go
package main

import (
    "sync"
    "time"
)

type Config struct {
    mu       sync.RWMutex
    settings map[string]string
}

func (c *Config) Get(key string) string {
    c.mu.RLock()  // Many readers can access simultaneously
    defer c.mu.RUnlock()
    return c.settings[key]
}

func (c *Config) Set(key, value string) {
    c.mu.Lock()  // Exclusive access for writes
    defer c.mu.Unlock()
    c.settings[key] = value
}

// Use RWMutex when:
// - Many reads, few writes
// - Read operations are slower
// - Want to maximize read throughput
```

## sync.WaitGroup

### Waiting for Goroutines

```go
package main

import (
    "fmt"
    "sync"
    "time"
)

func worker(id int, wg *sync.WaitGroup) {
    defer wg.Done()  // Decrement counter when done
    
    fmt.Printf("Worker %d starting\n", id)
    time.Sleep(time.Second)
    fmt.Printf("Worker %d done\n", id)
}

func main() {
    var wg sync.WaitGroup
    
    for i := 1; i <= 5; i++ {
        wg.Add(1)  // Increment counter
        go worker(i, &wg)
    }
    
    wg.Wait()  // Block until counter is 0
    fmt.Println("All workers done")
}
```

### WaitGroup Best Practices

```go
package main

import (
    "fmt"
    "sync"
)

func processItems(items []int) {
    var wg sync.WaitGroup
    
    for _, item := range items {
        wg.Add(1)  // Add before starting goroutine
        
        // Capture loop variable
        item := item
        
        go func() {
            defer wg.Done()
            fmt.Printf("Processing %d\n", item)
        }()
    }
    
    wg.Wait()
}

func main() {
    processItems([]int{1, 2, 3, 4, 5})
}
```

## sync.Once

### Initialize Once

```go
package main

import (
    "fmt"
    "sync"
)

var (
    instance *Database
    once     sync.Once
)

type Database struct {
    connection string
}

func GetDatabase() *Database {
    once.Do(func() {
        fmt.Println("Initializing database...")
        instance = &Database{connection: "db-connection"}
    })
    return instance
}

func main() {
    var wg sync.WaitGroup
    
    // Even with multiple goroutines, init happens only once
    for i := 0; i < 10; i++ {
        wg.Add(1)
        go func() {
            defer wg.Done()
            db := GetDatabase()
            fmt.Printf("Got database: %p\n", db)
        }()
    }
    
    wg.Wait()
}
```

### Singleton Pattern

```go
package main

import (
    "fmt"
    "sync"
)

type Config struct {
    settings map[string]string
}

var (
    config *Config
    once   sync.Once
)

func GetConfig() *Config {
    once.Do(func() {
        config = &Config{
            settings: map[string]string{
                "host": "localhost",
                "port": "8080",
            },
        }
    })
    return config
}

func main() {
    cfg1 := GetConfig()
    cfg2 := GetConfig()
    
    fmt.Println("Same instance?", cfg1 == cfg2)  // true
}
```

## sync.Map

### Concurrent Map

```go
package main

import (
    "fmt"
    "sync"
)

func main() {
    var sm sync.Map
    
    // Store
    sm.Store("key1", "value1")
    sm.Store("key2", "value2")
    
    // Load
    if val, ok := sm.Load("key1"); ok {
        fmt.Println("key1:", val)
    }
    
    // LoadOrStore
    actual, loaded := sm.LoadOrStore("key3", "value3")
    fmt.Println("Loaded:", loaded, "Value:", actual)
    
    // Delete
    sm.Delete("key2")
    
    // Range
    sm.Range(func(key, value any) bool {
        fmt.Printf("%v: %v\n", key, value)
        return true  // continue iteration
    })
}
```

### When to Use sync.Map

```go
package main

import (
    "sync"
)

// Use sync.Map when:
// 1. Entry is written once, read many times
// 2. Multiple goroutines read/write disjoint sets of keys

type SessionStore struct {
    sessions sync.Map
}

func (s *SessionStore) Set(sessionID, userID string) {
    s.sessions.Store(sessionID, userID)
}

func (s *SessionStore) Get(sessionID string) (string, bool) {
    val, ok := s.sessions.Load(sessionID)
    if !ok {
        return "", false
    }
    return val.(string), true
}

func (s *SessionStore) Delete(sessionID string) {
    s.sessions.Delete(sessionID)
}

// For most use cases, prefer map with Mutex or RWMutex
type PreferredCache struct {
    mu   sync.RWMutex
    data map[string]string
}
```

## sync.Cond

### Condition Variables

```go
package main

import (
    "fmt"
    "sync"
    "time"
)

type Queue struct {
    mu    sync.Mutex
    cond  *sync.Cond
    items []int
}

func NewQueue() *Queue {
    q := &Queue{items: make([]int, 0)}
    q.cond = sync.NewCond(&q.mu)
    return q
}

func (q *Queue) Push(item int) {
    q.mu.Lock()
    defer q.mu.Unlock()
    
    q.items = append(q.items, item)
    q.cond.Signal()  // Wake one waiting goroutine
}

func (q *Queue) Pop() int {
    q.mu.Lock()
    defer q.mu.Unlock()
    
    // Wait until items available
    for len(q.items) == 0 {
        q.cond.Wait()
    }
    
    item := q.items[0]
    q.items = q.items[1:]
    return item
}

func main() {
    queue := NewQueue()
    
    // Consumer
    go func() {
        for i := 0; i < 5; i++ {
            item := queue.Pop()
            fmt.Println("Consumed:", item)
        }
    }()
    
    // Producer
    time.Sleep(time.Second)
    for i := 1; i <= 5; i++ {
        queue.Push(i)
        time.Sleep(500 * time.Millisecond)
    }
    
    time.Sleep(time.Second)
}
```

## sync/atomic

### Atomic Operations

```go
package main

import (
    "fmt"
    "sync"
    "sync/atomic"
)

func main() {
    var counter int64
    var wg sync.WaitGroup
    
    for i := 0; i < 1000; i++ {
        wg.Add(1)
        go func() {
            defer wg.Done()
            atomic.AddInt64(&counter, 1)
        }()
    }
    
    wg.Wait()
    fmt.Println("Counter:", atomic.LoadInt64(&counter))  // 1000
}
```

### Atomic Operations Available

```go
package main

import (
    "fmt"
    "sync/atomic"
)

func main() {
    var x int64 = 100
    
    // Add
    atomic.AddInt64(&x, 5)
    fmt.Println(x)  // 105
    
    // Compare and Swap
    swapped := atomic.CompareAndSwapInt64(&x, 105, 200)
    fmt.Println("Swapped:", swapped, "Value:", x)  // true, 200
    
    // Load
    val := atomic.LoadInt64(&x)
    fmt.Println("Loaded:", val)  // 200
    
    // Store
    atomic.StoreInt64(&x, 300)
    fmt.Println(x)  // 300
    
    // Swap
    old := atomic.SwapInt64(&x, 400)
    fmt.Println("Old:", old, "New:", x)  // 300, 400
}
```

### Atomic vs Mutex

```go
package main

import (
    "sync"
    "sync/atomic"
    "testing"
)

// Atomic counter
type AtomicCounter struct {
    value int64
}

func (c *AtomicCounter) Increment() {
    atomic.AddInt64(&c.value, 1)
}

func (c *AtomicCounter) Value() int64 {
    return atomic.LoadInt64(&c.value)
}

// Mutex counter
type MutexCounter struct {
    mu    sync.Mutex
    value int64
}

func (c *MutexCounter) Increment() {
    c.mu.Lock()
    c.value++
    c.mu.Unlock()
}

func (c *MutexCounter) Value() int64 {
    c.mu.Lock()
    defer c.mu.Unlock()
    return c.value
}

// Atomic is faster for simple operations
// Use Mutex for complex critical sections
```

## Practical Examples

### Connection Pool

```go
package main

import (
    "errors"
    "sync"
    "time"
)

type Connection struct {
    ID string
}

type ConnectionPool struct {
    mu          sync.Mutex
    connections []*Connection
    maxSize     int
}

func NewConnectionPool(maxSize int) *ConnectionPool {
    return &ConnectionPool{
        connections: make([]*Connection, 0, maxSize),
        maxSize:     maxSize,
    }
}

func (p *ConnectionPool) Acquire() (*Connection, error) {
    p.mu.Lock()
    defer p.mu.Unlock()
    
    if len(p.connections) > 0 {
        conn := p.connections[len(p.connections)-1]
        p.connections = p.connections[:len(p.connections)-1]
        return conn, nil
    }
    
    return nil, errors.New("no connections available")
}

func (p *ConnectionPool) Release(conn *Connection) {
    p.mu.Lock()
    defer p.mu.Unlock()
    
    if len(p.connections) < p.maxSize {
        p.connections = append(p.connections, conn)
    }
}
```

### Request Counter

```go
package main

import (
    "fmt"
    "sync/atomic"
    "time"
)

type RequestCounter struct {
    total   int64
    success int64
    failed  int64
}

func (rc *RequestCounter) IncrementTotal() {
    atomic.AddInt64(&rc.total, 1)
}

func (rc *RequestCounter) IncrementSuccess() {
    atomic.AddInt64(&rc.success, 1)
}

func (rc *RequestCounter) IncrementFailed() {
    atomic.AddInt64(&rc.failed, 1)
}

func (rc *RequestCounter) Stats() (total, success, failed int64) {
    return atomic.LoadInt64(&rc.total),
           atomic.LoadInt64(&rc.success),
           atomic.LoadInt64(&rc.failed)
}

func main() {
    counter := &RequestCounter{}
    
    // Simulate requests
    for i := 0; i < 100; i++ {
        go func() {
            counter.IncrementTotal()
            if time.Now().Unix()%2 == 0 {
                counter.IncrementSuccess()
            } else {
                counter.IncrementFailed()
            }
        }()
    }
    
    time.Sleep(time.Second)
    total, success, failed := counter.Stats()
    fmt.Printf("Total: %d, Success: %d, Failed: %d\n", total, success, failed)
}
```

### Cache with Expiration

```go
package main

import (
    "sync"
    "time"
)

type CacheItem struct {
    Value      interface{}
    Expiration time.Time
}

type Cache struct {
    mu    sync.RWMutex
    items map[string]*CacheItem
}

func NewCache() *Cache {
    c := &Cache{items: make(map[string]*CacheItem)}
    go c.cleanup()
    return c
}

func (c *Cache) Set(key string, value interface{}, ttl time.Duration) {
    c.mu.Lock()
    defer c.mu.Unlock()
    
    c.items[key] = &CacheItem{
        Value:      value,
        Expiration: time.Now().Add(ttl),
    }
}

func (c *Cache) Get(key string) (interface{}, bool) {
    c.mu.RLock()
    defer c.mu.RUnlock()
    
    item, ok := c.items[key]
    if !ok {
        return nil, false
    }
    
    if time.Now().After(item.Expiration) {
        return nil, false
    }
    
    return item.Value, true
}

func (c *Cache) cleanup() {
    ticker := time.NewTicker(time.Minute)
    defer ticker.Stop()
    
    for range ticker.C {
        c.mu.Lock()
        for key, item := range c.items {
            if time.Now().After(item.Expiration) {
                delete(c.items, key)
            }
        }
        c.mu.Unlock()
    }
}
```

## Best Practices

### 1. Always Use defer with Unlock

```go
// GOOD
func (c *Counter) Increment() {
    c.mu.Lock()
    defer c.mu.Unlock()
    c.value++
}

// BAD - might forget to unlock
func (c *Counter) Increment() {
    c.mu.Lock()
    c.value++
    c.mu.Unlock()  // What if panic happens above?
}
```

### 2. Don't Copy Mutexes

```go
// BAD - copying mutex
type Counter struct {
    mu    sync.Mutex
    value int
}

func copyCounter(c Counter) Counter {
    return c  // DON'T DO THIS
}

// GOOD - use pointers
func copyCounter(c *Counter) *Counter {
    return c
}
```

### 3. Keep Critical Sections Small

```go
// GOOD - lock only what's needed
func (c *Cache) Get(key string) string {
    c.mu.RLock()
    val := c.data[key]
    c.mu.RUnlock()
    
    // Process outside lock
    return strings.ToUpper(val)
}

// BAD - holding lock too long
func (c *Cache) Get(key string) string {
    c.mu.RLock()
    defer c.mu.RUnlock()
    
    val := c.data[key]
    // Expensive operation while holding lock
    time.Sleep(time.Second)
    return strings.ToUpper(val)
}
```

### 4. Avoid Deadlocks

```go
// BAD - can deadlock
func transfer(from, to *Account, amount int) {
    from.mu.Lock()
    to.mu.Lock()  // Deadlock if another goroutine locks in reverse order
    // ...
    from.mu.Unlock()
    to.mu.Unlock()
}

// GOOD - consistent lock ordering
func transfer(from, to *Account, amount int) {
    // Always lock in same order (e.g., by ID)
    first, second := from, to
    if from.ID > to.ID {
        first, second = to, from
    }
    
    first.mu.Lock()
    defer first.mu.Unlock()
    second.mu.Lock()
    defer second.mu.Unlock()
    
    // Transfer logic
}
```

## Summary

Synchronization primitives:
- **sync.Mutex**: Mutual exclusion for critical sections
- **sync.RWMutex**: Multiple readers or one writer
- **sync.WaitGroup**: Wait for goroutines to complete
- **sync.Once**: Initialize exactly once
- **sync.Map**: Concurrent map (special cases)
- **sync.Cond**: Condition variables
- **sync/atomic**: Lock-free atomic operations

Essential for building safe concurrent Go applications.
