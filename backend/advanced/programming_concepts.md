# Advanced Programming Concepts: Concurrency, Patterns & Memory

## Table of Contents
1. [Concurrency vs Parallelism](#concurrency-vs-parallelism)
2. [Go Concurrency Patterns](#go-concurrency-patterns)
3. [Python Async Programming](#python-async-programming)
4. [Memory Management](#memory-management)
5. [Design Patterns](#design-patterns)
6. [SOLID Principles](#solid-principles)
7. [Functional Programming](#functional-programming)
8. [Code Optimization](#code-optimization)

---

## Concurrency vs Parallelism

### Definitions

**Concurrency**: Dealing with multiple things at once (structure).
**Parallelism**: Doing multiple things at once (execution).

**Analogy**:
```
Concurrency:  Juggling (one person, multiple balls in air)
Parallelism:  Multiple jugglers (each with own ball)
```

**Example**:
```
Single-core CPU:
- Concurrency: ✅ (time-slicing)
- Parallelism: ❌ (only one instruction at a time)

Multi-core CPU:
- Concurrency: ✅
- Parallelism: ✅ (truly simultaneous execution)
```

### Concurrency Models

**1. Threading** (Shared Memory):
```
Thread 1  Thread 2  Thread 3
   ↓        ↓        ↓
   └────────┴────────┘
     Shared Memory
```

**2. Message Passing** (Go channels, Erlang actors):
```
Goroutine 1  →  Channel  →  Goroutine 2
```

**3. Async/Await** (Event loop):
```
Event Loop
   ├── Task 1 (I/O waiting)
   ├── Task 2 (executing)
   └── Task 3 (I/O waiting)
```

---

## Go Concurrency Patterns

### Goroutines & Channels

**Basic Goroutine**:
```go
package main

import (
	"fmt"
	"time"
)

func worker(id int) {
	fmt.Printf("Worker %d starting\n", id)
	time.Sleep(time.Second)
	fmt.Printf("Worker %d done\n", id)
}

func main() {
	for i := 1; i <= 5; i++ {
		go worker(i)  // Launches goroutine
	}
	
	time.Sleep(2 * time.Second)  // Wait for goroutines
	fmt.Println("All workers done")
}
```

**Channels (Communication)**:
```go
func main() {
	ch := make(chan int)
	
	// Producer
	go func() {
		for i := 1; i <= 5; i++ {
			ch <- i  // Send to channel
		}
		close(ch)  // Close when done
	}()
	
	// Consumer
	for val := range ch {  // Receive until closed
		fmt.Println(val)
	}
}
```

### Worker Pool Pattern

```go
package main

import (
	"fmt"
	"time"
)

func worker(id int, jobs <-chan int, results chan<- int) {
	for job := range jobs {
		fmt.Printf("Worker %d processing job %d\n", id, job)
		time.Sleep(time.Second)  // Simulate work
		results <- job * 2
	}
}

func main() {
	jobs := make(chan int, 100)
	results := make(chan int, 100)
	
	// Start 3 workers
	for w := 1; w <= 3; w++ {
		go worker(w, jobs, results)
	}
	
	// Send 9 jobs
	for j := 1; j <= 9; j++ {
		jobs <- j
	}
	close(jobs)
	
	// Collect results
	for r := 1; r <= 9; r++ {
		fmt.Println("Result:", <-results)
	}
}
```

### Fan-Out, Fan-In Pattern

```go
func fanOut(input <-chan int, workers int) []<-chan int {
	outputs := make([]<-chan int, workers)
	
	for i := 0; i < workers; i++ {
		ch := make(chan int)
		outputs[i] = ch
		
		go func(output chan<- int) {
			for val := range input {
				// Process
				output <- val * 2
			}
			close(output)
		}(ch)
	}
	
	return outputs
}

func fanIn(channels ...<-chan int) <-chan int {
	merged := make(chan int)
	
	for _, ch := range channels {
		go func(c <-chan int) {
			for val := range c {
				merged <- val
			}
		}(ch)
	}
	
	return merged
}

func main() {
	input := make(chan int)
	
	// Send data
	go func() {
		for i := 1; i <= 10; i++ {
			input <- i
		}
		close(input)
	}()
	
	// Fan-out to 3 workers
	outputs := fanOut(input, 3)
	
	// Fan-in results
	merged := fanIn(outputs...)
	
	for result := range merged {
		fmt.Println(result)
	}
}
```

### Select Statement (Multiplexing)

```go
func main() {
	ch1 := make(chan string)
	ch2 := make(chan string)
	
	go func() {
		time.Sleep(1 * time.Second)
		ch1 <- "from channel 1"
	}()
	
	go func() {
		time.Sleep(2 * time.Second)
		ch2 <- "from channel 2"
	}()
	
	for i := 0; i < 2; i++ {
		select {
		case msg1 := <-ch1:
			fmt.Println(msg1)
		case msg2 := <-ch2:
			fmt.Println(msg2)
		case <-time.After(3 * time.Second):
			fmt.Println("timeout")
		}
	}
}
```

### Context (Cancellation & Timeouts)

```go
package main

import (
	"context"
	"fmt"
	"time"
)

func worker(ctx context.Context, id int) {
	for {
		select {
		case <-ctx.Done():
			fmt.Printf("Worker %d cancelled\n", id)
			return
		default:
			fmt.Printf("Worker %d working\n", id)
			time.Sleep(500 * time.Millisecond)
		}
	}
}

func main() {
	// Context with timeout
	ctx, cancel := context.WithTimeout(context.Background(), 2*time.Second)
	defer cancel()
	
	for i := 1; i <= 3; i++ {
		go worker(ctx, i)
	}
	
	time.Sleep(3 * time.Second)
	fmt.Println("Main done")
}
```

---

## Python Async Programming

### Async/Await Basics

```python
import asyncio

async def fetch_data(id):
    print(f"Fetching data {id}...")
    await asyncio.sleep(1)  # Simulate I/O
    print(f"Data {id} fetched")
    return f"Data {id}"

async def main():
    # Run sequentially (3 seconds total)
    data1 = await fetch_data(1)
    data2 = await fetch_data(2)
    data3 = await fetch_data(3)
    
    print([data1, data2, data3])

# Run
asyncio.run(main())
```

### Concurrent Execution

```python
async def main():
    # Run concurrently (1 second total!)
    results = await asyncio.gather(
        fetch_data(1),
        fetch_data(2),
        fetch_data(3)
    )
    print(results)

asyncio.run(main())
```

### Async Web Scraper

```python
import asyncio
import aiohttp
from typing import List

async def fetch_url(session: aiohttp.ClientSession, url: str) -> str:
    async with session.get(url) as response:
        return await response.text()

async def scrape_urls(urls: List[str]):
    async with aiohttp.ClientSession() as session:
        tasks = [fetch_url(session, url) for url in urls]
        results = await asyncio.gather(*tasks)
        return results

urls = [
    'https://example.com/1',
    'https://example.com/2',
    'https://example.com/3'
]

results = asyncio.run(scrape_urls(urls))
```

### Async Queue (Producer-Consumer)

```python
import asyncio
from asyncio import Queue

async def producer(queue: Queue):
    for i in range(10):
        await asyncio.sleep(0.5)
        await queue.put(i)
        print(f"Produced: {i}")
    
    # Signal completion
    await queue.put(None)

async def consumer(queue: Queue):
    while True:
        item = await queue.get()
        
        if item is None:
            break
        
        await asyncio.sleep(1)
        print(f"Consumed: {item}")
        queue.task_done()

async def main():
    queue = Queue(maxsize=5)
    
    await asyncio.gather(
        producer(queue),
        consumer(queue)
    )

asyncio.run(main())
```

---

## Memory Management

### Go Memory Model

**Stack vs Heap**:
```go
func createUser() *User {
	user := User{Name: "Alice"}  // Allocated on stack
	return &user                  // Escapes to heap (pointer returned)
}

func processValue() {
	x := 42  // Stays on stack (not returned)
	fmt.Println(x)
}
```

**Garbage Collection**:
```
Go uses tri-color mark-and-sweep GC:
1. Mark: Traverse from roots, mark reachable objects
2. Sweep: Free unreachable objects
3. Compact: (Optional) Defragment memory
```

**Escape Analysis**:
```bash
# Check if variable escapes to heap
go build -gcflags="-m" main.go

# Output:
./main.go:5:2: moved to heap: user  # Escapes
./main.go:10:2: x does not escape   # Stack
```

**Memory Profiling**:
```go
package main

import (
	"fmt"
	"runtime"
	"time"
)

func printMemUsage() {
	var m runtime.MemStats
	runtime.ReadMemStats(&m)
	
	fmt.Printf("Alloc = %v MB", m.Alloc/1024/1024)
	fmt.Printf("\tTotalAlloc = %v MB", m.TotalAlloc/1024/1024)
	fmt.Printf("\tSys = %v MB", m.Sys/1024/1024)
	fmt.Printf("\tNumGC = %v\n", m.NumGC)
}

func main() {
	printMemUsage()
	
	// Allocate memory
	var data [][]int
	for i := 0; i < 10; i++ {
		data = append(data, make([]int, 1000000))
		time.Sleep(100 * time.Millisecond)
		printMemUsage()
	}
}
```

### Python Memory Management

**Reference Counting**:
```python
import sys

x = []
print(sys.getrefcount(x))  # 2 (x + temporary in getrefcount)

y = x  # Share reference
print(sys.getrefcount(x))  # 3

del y
print(sys.getrefcount(x))  # 2
```

**Memory Profiling**:
```python
from memory_profiler import profile

@profile
def my_func():
    a = [i for i in range(1000000)]
    b = [i * 2 for i in range(1000000)]
    return a, b

my_func()

# Output:
# Line #    Mem usage    Increment   Line Contents
# ================================================
#      4   38.5 MiB     38.5 MiB   def my_func():
#      5   46.1 MiB      7.6 MiB       a = [i for i in range(1000000)]
#      6   53.7 MiB      7.6 MiB       b = [i * 2 for i in range(1000000)]
#      7   53.7 MiB      0.0 MiB       return a, b
```

---

## Design Patterns

### Singleton Pattern

**Go**:
```go
package main

import "sync"

type Database struct {
	connection string
}

var (
	instance *Database
	once     sync.Once
)

func GetInstance() *Database {
	once.Do(func() {
		instance = &Database{connection: "connected"}
	})
	return instance
}

func main() {
	db1 := GetInstance()
	db2 := GetInstance()
	
	fmt.Println(db1 == db2)  // true (same instance)
}
```

**Python**:
```python
class Singleton:
    _instance = None
    _lock = threading.Lock()
    
    def __new__(cls):
        if cls._instance is None:
            with cls._lock:
                if cls._instance is None:
                    cls._instance = super().__new__(cls)
        return cls._instance

db1 = Singleton()
db2 = Singleton()
print(db1 is db2)  # True
```

### Factory Pattern

```go
type Animal interface {
	Speak() string
}

type Dog struct{}
func (d Dog) Speak() string { return "Woof" }

type Cat struct{}
func (c Cat) Speak() string { return "Meow" }

func AnimalFactory(animalType string) Animal {
	switch animalType {
	case "dog":
		return Dog{}
	case "cat":
		return Cat{}
	default:
		return nil
	}
}

func main() {
	dog := AnimalFactory("dog")
	fmt.Println(dog.Speak())  // Woof
}
```

### Observer Pattern

```python
from typing import List

class Subject:
    def __init__(self):
        self._observers: List[Observer] = []
    
    def attach(self, observer):
        self._observers.append(observer)
    
    def notify(self, message):
        for observer in self._observers:
            observer.update(message)

class Observer:
    def update(self, message):
        pass

class EmailObserver(Observer):
    def update(self, message):
        print(f"Email: {message}")

class SMSObserver(Observer):
    def update(self, message):
        print(f"SMS: {message}")

# Usage
subject = Subject()
subject.attach(EmailObserver())
subject.attach(SMSObserver())

subject.notify("New order placed")
# Output:
# Email: New order placed
# SMS: New order placed
```

### Strategy Pattern

```go
type PaymentStrategy interface {
	Pay(amount float64)
}

type CreditCard struct{}
func (c CreditCard) Pay(amount float64) {
	fmt.Printf("Paid %.2f via credit card\n", amount)
}

type PayPal struct{}
func (p PayPal) Pay(amount float64) {
	fmt.Printf("Paid %.2f via PayPal\n", amount)
}

type Checkout struct {
	strategy PaymentStrategy
}

func (c *Checkout) SetStrategy(strategy PaymentStrategy) {
	c.strategy = strategy
}

func (c *Checkout) Process(amount float64) {
	c.strategy.Pay(amount)
}

func main() {
	checkout := &Checkout{}
	
	checkout.SetStrategy(CreditCard{})
	checkout.Process(100.00)
	
	checkout.SetStrategy(PayPal{})
	checkout.Process(200.00)
}
```

---

## SOLID Principles

### S - Single Responsibility

**Bad**:
```python
class User:
    def __init__(self, name, email):
        self.name = name
        self.email = email
    
    def save(self):
        # DB logic (violates SRP)
        db.execute("INSERT INTO users...")
    
    def send_email(self):
        # Email logic (violates SRP)
        smtp.send(self.email, "Welcome")
```

**Good**:
```python
class User:
    def __init__(self, name, email):
        self.name = name
        self.email = email

class UserRepository:
    def save(self, user):
        db.execute("INSERT INTO users...")

class EmailService:
    def send_welcome(self, user):
        smtp.send(user.email, "Welcome")
```

### O - Open/Closed

**Bad**:
```python
def calculate_area(shapes):
    total = 0
    for shape in shapes:
        if isinstance(shape, Circle):
            total += 3.14 * shape.radius ** 2
        elif isinstance(shape, Rectangle):
            total += shape.width * shape.height
    return total
```

**Good**:
```python
from abc import ABC, abstractmethod

class Shape(ABC):
    @abstractmethod
    def area(self):
        pass

class Circle(Shape):
    def __init__(self, radius):
        self.radius = radius
    
    def area(self):
        return 3.14 * self.radius ** 2

class Rectangle(Shape):
    def __init__(self, width, height):
        self.width = width
        self.height = height
    
    def area(self):
        return self.width * self.height

def calculate_area(shapes):
    return sum(shape.area() for shape in shapes)
```

### L - Liskov Substitution

**Bad**:
```python
class Bird:
    def fly(self):
        print("Flying")

class Penguin(Bird):
    def fly(self):
        raise Exception("Can't fly")  # Violates LSP
```

**Good**:
```python
class Bird:
    pass

class FlyingBird(Bird):
    def fly(self):
        print("Flying")

class Penguin(Bird):
    def swim(self):
        print("Swimming")
```

---

This comprehensive guide covers advanced concurrency, memory management, design patterns, and SOLID principles with hands-on Go and Python examples. Continuing with the final files.
