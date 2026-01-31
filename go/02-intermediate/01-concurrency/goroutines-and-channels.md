# Concurrency in Go - Goroutines and Channels

## What is Concurrency?

Concurrency is the ability to execute multiple tasks simultaneously. Go's concurrency model is based on goroutines (lightweight threads) and channels (communication between goroutines), following the principle: "Don't communicate by sharing memory; share memory by communicating."

## Why is Concurrency Important?

- **Performance**: Utilize multiple CPU cores effectively
- **Responsiveness**: Handle multiple requests simultaneously
- **Scalability**: Build systems that handle thousands of concurrent operations
- **Efficiency**: Better resource utilization
- **Modern Architecture**: Essential for microservices and distributed systems

## Goroutines

### What are Goroutines?

Goroutines are lightweight threads managed by the Go runtime. They're much cheaper than OS threads - you can run thousands or even millions of goroutines in a single program.

### Creating Goroutines

```go
package main

import (
    "fmt"
    "time"
)

func sayHello() {
    fmt.Println("Hello from goroutine!")
}

func count(name string) {
    for i := 1; i <= 5; i++ {
        fmt.Printf("%s: %d\n", name, i)
        time.Sleep(100 * time.Millisecond)
    }
}

func main() {
    // Run function as goroutine
    go sayHello()
    
    // Run multiple goroutines
    go count("A")
    go count("B")
    go count("C")
    
    // Anonymous function as goroutine
    go func() {
        fmt.Println("Anonymous goroutine")
    }()
    
    // Wait for goroutines to finish
    time.Sleep(1 * time.Second)
    fmt.Println("Main function ending")
}
```

### Goroutine Characteristics

```go
package main

import (
    "fmt"
    "runtime"
    "time"
)

func main() {
    // Check number of CPUs
    fmt.Println("CPUs:", runtime.NumCPU())
    
    // Check number of goroutines
    fmt.Println("Goroutines at start:", runtime.NumGoroutine())
    
    // Launch 1000 goroutines
    for i := 0; i < 1000; i++ {
        go func(id int) {
            time.Sleep(1 * time.Second)
        }(i)
    }
    
    fmt.Println("Goroutines after launch:", runtime.NumGoroutine())
    time.Sleep(2 * time.Second)
    fmt.Println("Goroutines at end:", runtime.NumGoroutine())
}
```

## Channels

### What are Channels?

Channels are typed conduits for communication between goroutines. They allow goroutines to synchronize and exchange data safely.

### Creating and Using Channels

```go
package main

import "fmt"

func main() {
    // Create unbuffered channel
    ch := make(chan int)
    
    // Send to channel (in goroutine to avoid deadlock)
    go func() {
        ch <- 42  // Send value to channel
    }()
    
    // Receive from channel
    value := <-ch  // Receive value from channel
    fmt.Println("Received:", value)
    
    // Bidirectional channel
    messages := make(chan string)
    
    go func() {
        messages <- "Hello"
        messages <- "World"
    }()
    
    msg1 := <-messages
    msg2 := <-messages
    fmt.Println(msg1, msg2)
}
```

### Buffered Channels

```go
package main

import "fmt"

func main() {
    // Buffered channel with capacity 3
    ch := make(chan int, 3)
    
    // Can send up to 3 values without blocking
    ch <- 1
    ch <- 2
    ch <- 3
    
    // Receive values
    fmt.Println(<-ch)  // 1
    fmt.Println(<-ch)  // 2
    fmt.Println(<-ch)  // 3
    
    // Send more after receiving
    ch <- 4
    fmt.Println(<-ch)  // 4
}
```

### Channel Direction

```go
package main

import "fmt"

// Send-only channel
func sendOnly(ch chan<- int) {
    ch <- 42
    // value := <-ch  // ERROR: cannot receive from send-only channel
}

// Receive-only channel
func receiveOnly(ch <-chan int) {
    value := <-ch
    fmt.Println(value)
    // ch <- 10  // ERROR: cannot send to receive-only channel
}

func main() {
    ch := make(chan int)
    
    go sendOnly(ch)
    receiveOnly(ch)
}
```

### Closing Channels

```go
package main

import "fmt"

func main() {
    ch := make(chan int, 3)
    
    // Send values
    ch <- 1
    ch <- 2
    ch <- 3
    
    // Close channel (no more sends possible)
    close(ch)
    
    // Can still receive from closed channel
    fmt.Println(<-ch)  // 1
    fmt.Println(<-ch)  // 2
    fmt.Println(<-ch)  // 3
    fmt.Println(<-ch)  // 0 (zero value, channel closed)
    
    // Check if channel is closed
    value, ok := <-ch
    if !ok {
        fmt.Println("Channel is closed")
    }
    
    // Range over channel (exits when closed)
    numbers := make(chan int, 5)
    go func() {
        for i := 1; i <= 5; i++ {
            numbers <- i
        }
        close(numbers)
    }()
    
    for num := range numbers {
        fmt.Println(num)
    }
}
```

### Select Statement

Multiplexing for channels - like switch for channel operations.

```go
package main

import (
    "fmt"
    "time"
)

func main() {
    ch1 := make(chan string)
    ch2 := make(chan string)
    
    go func() {
        time.Sleep(1 * time.Second)
        ch1 <- "from ch1"
    }()
    
    go func() {
        time.Sleep(2 * time.Second)
        ch2 <- "from ch2"
    }()
    
    // Select waits for first available channel
    select {
    case msg1 := <-ch1:
        fmt.Println(msg1)
    case msg2 := <-ch2:
        fmt.Println(msg2)
    }
    
    // Select with default (non-blocking)
    select {
    case msg := <-ch1:
        fmt.Println(msg)
    default:
        fmt.Println("No message available")
    }
    
    // Select with timeout
    select {
    case msg := <-ch2:
        fmt.Println(msg)
    case <-time.After(3 * time.Second):
        fmt.Println("Timeout!")
    }
}
```

## Practical Concurrency Patterns

### Pattern 1: Worker Pool

```go
package main

import (
    "fmt"
    "time"
)

func worker(id int, jobs <-chan int, results chan<- int) {
    for job := range jobs {
        fmt.Printf("Worker %d processing job %d\n", id, job)
        time.Sleep(500 * time.Millisecond)  // Simulate work
        results <- job * 2
    }
}

func main() {
    const numWorkers = 3
    const numJobs = 9
    
    jobs := make(chan int, numJobs)
    results := make(chan int, numJobs)
    
    // Start workers
    for w := 1; w <= numWorkers; w++ {
        go worker(w, jobs, results)
    }
    
    // Send jobs
    for j := 1; j <= numJobs; j++ {
        jobs <- j
    }
    close(jobs)
    
    // Collect results
    for r := 1; r <= numJobs; r++ {
        result := <-results
        fmt.Println("Result:", result)
    }
}
```

### Pattern 2: Pipeline

```go
package main

import "fmt"

// Stage 1: Generate numbers
func generate(nums ...int) <-chan int {
    out := make(chan int)
    go func() {
        for _, n := range nums {
            out <- n
        }
        close(out)
    }()
    return out
}

// Stage 2: Square numbers
func square(in <-chan int) <-chan int {
    out := make(chan int)
    go func() {
        for n := range in {
            out <- n * n
        }
        close(out)
    }()
    return out
}

// Stage 3: Sum numbers
func sum(in <-chan int) <-chan int {
    out := make(chan int)
    go func() {
        total := 0
        for n := range in {
            total += n
        }
        out <- total
        close(out)
    }()
    return out
}

func main() {
    // Pipeline: generate -> square -> sum
    numbers := generate(1, 2, 3, 4, 5)
    squared := square(numbers)
    result := sum(squared)
    
    fmt.Println("Sum of squares:", <-result)  // 55
}
```

### Pattern 3: Fan-Out, Fan-In

```go
package main

import (
    "fmt"
    "sync"
)

func producer(nums ...int) <-chan int {
    out := make(chan int)
    go func() {
        for _, n := range nums {
            out <- n
        }
        close(out)
    }()
    return out
}

func square(in <-chan int) <-chan int {
    out := make(chan int)
    go func() {
        for n := range in {
            out <- n * n
        }
        close(out)
    }()
    return out
}

// Fan-in: merge multiple channels into one
func merge(channels ...<-chan int) <-chan int {
    var wg sync.WaitGroup
    out := make(chan int)
    
    // Start goroutine for each channel
    output := func(ch <-chan int) {
        defer wg.Done()
        for n := range ch {
            out <- n
        }
    }
    
    wg.Add(len(channels))
    for _, ch := range channels {
        go output(ch)
    }
    
    // Close out when all inputs are closed
    go func() {
        wg.Wait()
        close(out)
    }()
    
    return out
}

func main() {
    in := producer(1, 2, 3, 4, 5, 6, 7, 8)
    
    // Fan-out: distribute work across multiple workers
    c1 := square(in)
    c2 := square(in)
    c3 := square(in)
    
    // Fan-in: merge results
    for result := range merge(c1, c2, c3) {
        fmt.Println(result)
    }
}
```

### Pattern 4: Timeout and Cancellation

```go
package main

import (
    "context"
    "fmt"
    "time"
)

func longRunningTask(ctx context.Context) <-chan string {
    result := make(chan string)
    
    go func() {
        defer close(result)
        
        // Simulate long operation
        select {
        case <-time.After(5 * time.Second):
            result <- "Task completed"
        case <-ctx.Done():
            fmt.Println("Task cancelled:", ctx.Err())
            return
        }
    }()
    
    return result
}

func main() {
    // With timeout
    ctx, cancel := context.WithTimeout(context.Background(), 2*time.Second)
    defer cancel()
    
    result := longRunningTask(ctx)
    
    select {
    case res := <-result:
        fmt.Println(res)
    case <-ctx.Done():
        fmt.Println("Operation timed out")
    }
}
```

### Pattern 5: Rate Limiting

```go
package main

import (
    "fmt"
    "time"
)

func main() {
    requests := make(chan int, 5)
    for i := 1; i <= 5; i++ {
        requests <- i
    }
    close(requests)
    
    // Rate limiter: 1 request per 200ms
    limiter := time.Tick(200 * time.Millisecond)
    
    for req := range requests {
        <-limiter  // Wait for rate limiter
        fmt.Println("Processing request", req, "at", time.Now().Format("15:04:05"))
    }
}
```

### Pattern 6: Semaphore (Limited Concurrency)

```go
package main

import (
    "fmt"
    "sync"
    "time"
)

type Semaphore chan struct{}

func NewSemaphore(max int) Semaphore {
    return make(Semaphore, max)
}

func (s Semaphore) Acquire() {
    s <- struct{}{}
}

func (s Semaphore) Release() {
    <-s
}

func main() {
    const maxConcurrent = 3
    sem := NewSemaphore(maxConcurrent)
    var wg sync.WaitGroup
    
    for i := 1; i <= 10; i++ {
        wg.Add(1)
        go func(id int) {
            defer wg.Done()
            
            sem.Acquire()
            defer sem.Release()
            
            fmt.Printf("Task %d starting\n", id)
            time.Sleep(1 * time.Second)
            fmt.Printf("Task %d done\n", id)
        }(i)
    }
    
    wg.Wait()
}
```

## Backend Application Examples

### Example 1: Concurrent API Requests

```go
package api

import (
    "encoding/json"
    "fmt"
    "net/http"
    "sync"
)

type User struct {
    ID   int    `json:"id"`
    Name string `json:"name"`
}

type Result struct {
    User *User
    Err  error
}

func fetchUser(id int) (*User, error) {
    resp, err := http.Get(fmt.Sprintf("https://api.example.com/users/%d", id))
    if err != nil {
        return nil, err
    }
    defer resp.Body.Close()
    
    var user User
    if err := json.NewDecoder(resp.Body).Decode(&user); err != nil {
        return nil, err
    }
    
    return &user, nil
}

func fetchUsersConcurrently(ids []int) ([]*User, error) {
    results := make(chan Result, len(ids))
    var wg sync.WaitGroup
    
    for _, id := range ids {
        wg.Add(1)
        go func(userID int) {
            defer wg.Done()
            user, err := fetchUser(userID)
            results <- Result{User: user, Err: err}
        }(id)
    }
    
    // Close results channel when all goroutines finish
    go func() {
        wg.Wait()
        close(results)
    }()
    
    // Collect results
    var users []*User
    for result := range results {
        if result.Err != nil {
            return nil, result.Err
        }
        users = append(users, result.User)
    }
    
    return users, nil
}

func main() {
    ids := []int{1, 2, 3, 4, 5}
    users, err := fetchUsersConcurrently(ids)
    if err != nil {
        fmt.Println("Error:", err)
        return
    }
    
    for _, user := range users {
        fmt.Printf("User: %+v\n", user)
    }
}
```

### Example 2: Background Job Processor

```go
package jobs

import (
    "context"
    "fmt"
    "log"
    "time"
)

type Job struct {
    ID   int
    Data interface{}
}

type Processor struct {
    jobs    chan Job
    workers int
    ctx     context.Context
    cancel  context.CancelFunc
}

func NewProcessor(workers int) *Processor {
    ctx, cancel := context.WithCancel(context.Background())
    return &Processor{
        jobs:    make(chan Job, 100),
        workers: workers,
        ctx:     ctx,
        cancel:  cancel,
    }
}

func (p *Processor) Start() {
    for i := 0; i < p.workers; i++ {
        go p.worker(i)
    }
}

func (p *Processor) worker(id int) {
    for {
        select {
        case job := <-p.jobs:
            log.Printf("Worker %d processing job %d\n", id, job.ID)
            p.processJob(job)
        case <-p.ctx.Done():
            log.Printf("Worker %d shutting down\n", id)
            return
        }
    }
}

func (p *Processor) processJob(job Job) {
    // Simulate job processing
    time.Sleep(100 * time.Millisecond)
    log.Printf("Job %d completed\n", job.ID)
}

func (p *Processor) Submit(job Job) {
    select {
    case p.jobs <- job:
        log.Printf("Job %d submitted\n", job.ID)
    case <-time.After(5 * time.Second):
        log.Printf("Job %d submission timeout\n", job.ID)
    }
}

func (p *Processor) Stop() {
    log.Println("Stopping processor...")
    p.cancel()
    close(p.jobs)
}

func main() {
    processor := NewProcessor(3)
    processor.Start()
    
    // Submit jobs
    for i := 1; i <= 10; i++ {
        processor.Submit(Job{ID: i, Data: fmt.Sprintf("data-%d", i)})
    }
    
    time.Sleep(2 * time.Second)
    processor.Stop()
    time.Sleep(1 * time.Second)
}
```

### Example 3: Real-time Data Stream Processor

```go
package stream

import (
    "context"
    "fmt"
    "time"
)

type Event struct {
    ID        string
    Type      string
    Timestamp time.Time
    Data      map[string]interface{}
}

type StreamProcessor struct {
    input   <-chan Event
    output  chan<- Event
    filters []func(Event) bool
    ctx     context.Context
}

func NewStreamProcessor(ctx context.Context, input <-chan Event, output chan<- Event) *StreamProcessor {
    return &StreamProcessor{
        input:   input,
        output:  output,
        filters: make([]func(Event) bool, 0),
        ctx:     ctx,
    }
}

func (sp *StreamProcessor) AddFilter(filter func(Event) bool) {
    sp.filters = append(sp.filters, filter)
}

func (sp *StreamProcessor) Process() {
    for {
        select {
        case event := <-sp.input:
            if sp.shouldProcess(event) {
                processedEvent := sp.transform(event)
                sp.output <- processedEvent
            }
        case <-sp.ctx.Done():
            fmt.Println("Stream processor shutting down")
            return
        }
    }
}

func (sp *StreamProcessor) shouldProcess(event Event) bool {
    for _, filter := range sp.filters {
        if !filter(event) {
            return false
        }
    }
    return true
}

func (sp *StreamProcessor) transform(event Event) Event {
    // Transform event data
    event.Data["processed"] = true
    event.Data["processed_at"] = time.Now()
    return event
}

func main() {
    ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
    defer cancel()
    
    input := make(chan Event, 10)
    output := make(chan Event, 10)
    
    processor := NewStreamProcessor(ctx, input, output)
    
    // Add filters
    processor.AddFilter(func(e Event) bool {
        return e.Type == "important"
    })
    
    // Start processor
    go processor.Process()
    
    // Send events
    go func() {
        for i := 0; i < 10; i++ {
            input <- Event{
                ID:        fmt.Sprintf("event-%d", i),
                Type:      []string{"normal", "important"}[i%2],
                Timestamp: time.Now(),
                Data:      map[string]interface{}{"value": i},
            }
            time.Sleep(100 * time.Millisecond)
        }
    }()
    
    // Receive processed events
    go func() {
        for event := range output {
            fmt.Printf("Processed: %+v\n", event)
        }
    }()
    
    <-ctx.Done()
}
```

## Best Practices

### 1. Always Close Channels When Done Sending

```go
// Good
ch := make(chan int)
go func() {
    for i := 0; i < 10; i++ {
        ch <- i
    }
    close(ch)  // Signal no more values
}()

for val := range ch {  // Will exit when channel closed
    fmt.Println(val)
}
```

### 2. Use Context for Cancellation

```go
func doWork(ctx context.Context) error {
    for {
        select {
        case <-ctx.Done():
            return ctx.Err()
        default:
            // Do work
        }
    }
}
```

### 3. Avoid Goroutine Leaks

```go
// Bad - goroutine leak
func leak() {
    ch := make(chan int)
    go func() {
        val := <-ch  // Blocks forever if nothing sends
        fmt.Println(val)
    }()
    // Channel never receives, goroutine leaks
}

// Good - use context or timeout
func noLeak() {
    ch := make(chan int)
    ctx, cancel := context.WithTimeout(context.Background(), 1*time.Second)
    defer cancel()
    
    go func() {
        select {
        case val := <-ch:
            fmt.Println(val)
        case <-ctx.Done():
            return  // Cleanup
        }
    }()
}
```

### 4. Use sync.WaitGroup for Coordination

```go
var wg sync.WaitGroup

for i := 0; i < 5; i++ {
    wg.Add(1)
    go func(id int) {
        defer wg.Done()
        // Do work
    }(i)
}

wg.Wait()  // Wait for all goroutines
```

### 5. Limit Goroutine Count

```go
// Bad - unlimited goroutines
for i := 0; i < 1000000; i++ {
    go doWork(i)
}

// Good - worker pool with limited workers
sem := make(chan struct{}, 100)
for i := 0; i < 1000000; i++ {
    sem <- struct{}{}
    go func(id int) {
        defer func() { <-sem }()
        doWork(id)
    }(i)
}
```

## Common Pitfalls

### 1. Race Conditions

```go
// Bad - race condition
counter := 0
for i := 0; i < 1000; i++ {
    go func() {
        counter++  // RACE!
    }()
}

// Good - use sync.Mutex or atomic
var mu sync.Mutex
counter := 0
for i := 0; i < 1000; i++ {
    go func() {
        mu.Lock()
        counter++
        mu.Unlock()
    }()
}
```

### 2. Deadlocks

```go
// Bad - deadlock
ch := make(chan int)
ch <- 42  // Blocks forever (unbuffered, no receiver)

// Good
ch := make(chan int, 1)  // Buffered
ch <- 42  // Doesn't block
```

## Summary

Go's concurrency model provides:
- **Goroutines**: Lightweight, efficient concurrent execution
- **Channels**: Safe communication between goroutines
- **Select**: Multiplexing for channel operations
- **Patterns**: Worker pools, pipelines, fan-out/fan-in
- **Context**: Cancellation and timeouts

Master these for building high-performance, concurrent backend systems.
