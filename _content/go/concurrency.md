# Concurrency in Go

Concurrency is one of Go's standout features, enabling developers to build highly efficient and scalable applications. This chapter explores Go's concurrency model, its key components, and best practices.

---

## What is Concurrency?
Concurrency is the ability of a program to perform multiple tasks simultaneously. In Go, concurrency is achieved using goroutines and channels.

### Concurrency vs Parallelism
- **Concurrency:** Structuring a program to handle multiple tasks at once.
- **Parallelism:** Executing multiple tasks simultaneously on multiple processors.

Go focuses on concurrency, making it easier to write programs that handle many tasks efficiently.

---

## Goroutines

### What are Goroutines?
Goroutines are lightweight threads managed by the Go runtime. They allow you to run functions concurrently without the overhead of traditional threads.

### Creating a Goroutine
```go
package main

import (
    "fmt"
    "time"
)

func printMessage(message string) {
    for i := 0; i < 5; i++ {
        fmt.Println(message)
        time.Sleep(500 * time.Millisecond)
    }
}

func main() {
    go printMessage("Goroutine 1")
    go printMessage("Goroutine 2")

    time.Sleep(3 * time.Second)
    fmt.Println("Main function ends")
}
```

### Key Features of Goroutines
1. **Lightweight:** Thousands of goroutines can run on a single machine.
2. **Efficient Scheduling:** Managed by the Go runtime.
3. **Automatic Stack Growth:** Starts with a small stack and grows as needed.

---

## Channels

### What are Channels?
Channels provide a way for goroutines to communicate and synchronize. They allow you to send and receive values between goroutines.

### Creating and Using Channels
```go
package main

import "fmt"

func sendMessage(channel chan string) {
    channel <- "Hello from Goroutine"
}

func main() {
    channel := make(chan string)

    go sendMessage(channel)

    message := <-channel
    fmt.Println(message)
}
```

### Types of Channels
1. **Unbuffered Channels:** Block until both sender and receiver are ready.
2. **Buffered Channels:** Allow a fixed number of values to be stored.

### Closing Channels
Channels can be closed to indicate no more values will be sent:
```go
close(channel)
```

---

## Select Statement
The `select` statement allows a goroutine to wait on multiple communication operations:
```go
select {
case msg := <-channel1:
    fmt.Println("Received from channel1:", msg)
case msg := <-channel2:
    fmt.Println("Received from channel2:", msg)
default:
    fmt.Println("No messages received")
}
```

---

## Best Practices

1. **Avoid Blocking:**
   - Use buffered channels or `select` to prevent blocking.

2. **Limit Goroutines:**
   - Use worker pools to manage the number of active goroutines.

3. **Handle Panics:**
   - Use `recover` to handle panics in goroutines.

4. **Close Channels Properly:**
   - Ensure channels are closed to avoid deadlocks.

5. **Use Context:**
   - Use the `context` package to manage goroutine lifecycles.

---

Concurrency in Go is a powerful tool for building scalable and efficient applications. In the next chapter, we will explore how to design scalable systems using Go's concurrency model.