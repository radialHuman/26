# Synchronization Primitives in Go

Go provides several synchronization primitives in the `sync` and `sync/atomic` packages to help you write safe concurrent code. This chapter covers mutexes, RWMutex, WaitGroups, Once, Cond, and atomic operations.

---

## Mutex
A `Mutex` is used to provide mutual exclusion, allowing only one goroutine to access a critical section at a time.

```go
import "sync"

var mu sync.Mutex
var count int

func increment() {
    mu.Lock()
    count++
    mu.Unlock()
}
```

---

## RWMutex
An `RWMutex` allows multiple readers or one writer at a time.

```go
import "sync"

var rw sync.RWMutex
var data int

func read() int {
    rw.RLock()
    defer rw.RUnlock()
    return data
}

func write(val int) {
    rw.Lock()
    data = val
    rw.Unlock()
}
```

---

## WaitGroup
A `WaitGroup` waits for a collection of goroutines to finish.

```go
import "sync"

var wg sync.WaitGroup

func worker(id int) {
    defer wg.Done()
    // work
}

func main() {
    for i := 0; i < 5; i++ {
        wg.Add(1)
        go worker(i)
    }
    wg.Wait()
}
```

---

## sync.Once
Ensures a function is only executed once.

```go
import "sync"

var once sync.Once

func initialize() {
    // initialization code
}

func main() {
    once.Do(initialize)
}
```

---

## sync.Cond
Used for advanced signaling between goroutines.

```go
import "sync"

var mu sync.Mutex
var cond = sync.NewCond(&mu)

func waitForCondition() {
    mu.Lock()
    cond.Wait()
    // proceed
    mu.Unlock()
}

func signalCondition() {
    mu.Lock()
    cond.Signal()
    mu.Unlock()
}
```

---

## Atomic Operations
The `sync/atomic` package provides low-level atomic memory primitives.

```go
import (
    "sync/atomic"
)

var counter int64

func increment() {
    atomic.AddInt64(&counter, 1)
}
```

---

## Best Practices
- Use mutexes for shared state.
- Prefer channels for communication when possible.
- Use WaitGroups for goroutine coordination.
- Use atomic operations for simple counters/flags.
- Avoid deadlocks by careful lock management.

---

Mastering these primitives is essential for safe and efficient concurrent programming in Go.