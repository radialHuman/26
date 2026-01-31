# Message Queues - RabbitMQ

## What is RabbitMQ?

**RabbitMQ** is an open-source message broker that implements AMQP (Advanced Message Queuing Protocol). It enables:
- **Asynchronous Communication**: Decouple services
- **Task Queues**: Distribute work across workers
- **Pub/Sub**: Broadcast messages to multiple consumers
- **Reliability**: Message persistence and acknowledgments

## Why Use Message Queues?

- **Decoupling**: Services don't need to know about each other
- **Scalability**: Add more workers to handle load
- **Reliability**: Messages aren't lost if service is down
- **Load Leveling**: Handle traffic spikes
- **Async Processing**: Long-running tasks don't block requests

## Installation

```bash
# Install RabbitMQ client for Go
go get github.com/rabbitmq/amqp091-go
```

## Basic Concepts

### Key Components

1. **Producer**: Sends messages
2. **Queue**: Buffer that stores messages
3. **Consumer**: Receives messages
4. **Exchange**: Routes messages to queues
5. **Binding**: Link between exchange and queue

### Exchange Types

- **Direct**: Route by exact routing key match
- **Fanout**: Broadcast to all bound queues
- **Topic**: Route by pattern matching
- **Headers**: Route by message headers

## Simple Queue (Work Queue)

### Producer

```go
package main

import (
    "context"
    "log"
    "time"
    
    amqp "github.com/rabbitmq/amqp091-go"
)

func main() {
    // Connect to RabbitMQ
    conn, err := amqp.Dial("amqp://guest:guest@localhost:5672/")
    if err != nil {
        log.Fatal(err)
    }
    defer conn.Close()
    
    // Create channel
    ch, err := conn.Channel()
    if err != nil {
        log.Fatal(err)
    }
    defer ch.Close()
    
    // Declare queue
    q, err := ch.QueueDeclare(
        "tasks",    // name
        true,       // durable
        false,      // delete when unused
        false,      // exclusive
        false,      // no-wait
        nil,        // arguments
    )
    if err != nil {
        log.Fatal(err)
    }
    
    ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
    defer cancel()
    
    // Publish message
    body := "Hello, RabbitMQ!"
    err = ch.PublishWithContext(ctx,
        "",     // exchange
        q.Name, // routing key
        false,  // mandatory
        false,  // immediate
        amqp.Publishing{
            DeliveryMode: amqp.Persistent,
            ContentType:  "text/plain",
            Body:         []byte(body),
        },
    )
    if err != nil {
        log.Fatal(err)
    }
    
    log.Printf("Sent: %s", body)
}
```

### Consumer

```go
package main

import (
    "log"
    "time"
    
    amqp "github.com/rabbitmq/amqp091-go"
)

func main() {
    conn, err := amqp.Dial("amqp://guest:guest@localhost:5672/")
    if err != nil {
        log.Fatal(err)
    }
    defer conn.Close()
    
    ch, err := conn.Channel()
    if err != nil {
        log.Fatal(err)
    }
    defer ch.Close()
    
    q, err := ch.QueueDeclare(
        "tasks",
        true,
        false,
        false,
        false,
        nil,
    )
    if err != nil {
        log.Fatal(err)
    }
    
    // Set QoS (prefetch count)
    err = ch.Qos(
        1,     // prefetch count
        0,     // prefetch size
        false, // global
    )
    if err != nil {
        log.Fatal(err)
    }
    
    // Start consuming
    msgs, err := ch.Consume(
        q.Name, // queue
        "",     // consumer
        false,  // auto-ack
        false,  // exclusive
        false,  // no-local
        false,  // no-wait
        nil,    // args
    )
    if err != nil {
        log.Fatal(err)
    }
    
    log.Println("Waiting for messages...")
    
    forever := make(chan bool)
    
    go func() {
        for msg := range msgs {
            log.Printf("Received: %s", msg.Body)
            
            // Simulate work
            time.Sleep(1 * time.Second)
            
            log.Println("Done processing")
            
            // Acknowledge message
            msg.Ack(false)
        }
    }()
    
    <-forever
}
```

## Task Queue with Struct

```go
package queue

import (
    "context"
    "encoding/json"
    "fmt"
    "time"
    
    amqp "github.com/rabbitmq/amqp091-go"
)

// Task represents a job to be processed
type Task struct {
    ID        string                 `json:"id"`
    Type      string                 `json:"type"`
    Payload   map[string]interface{} `json:"payload"`
    CreatedAt time.Time              `json:"created_at"`
}

// Queue wraps RabbitMQ connection and channel
type Queue struct {
    conn    *amqp.Connection
    channel *amqp.Channel
    name    string
}

func NewQueue(url, queueName string) (*Queue, error) {
    conn, err := amqp.Dial(url)
    if err != nil {
        return nil, err
    }
    
    ch, err := conn.Channel()
    if err != nil {
        conn.Close()
        return nil, err
    }
    
    // Declare queue
    _, err = ch.QueueDeclare(
        queueName,
        true,  // durable
        false, // delete when unused
        false, // exclusive
        false, // no-wait
        nil,
    )
    if err != nil {
        ch.Close()
        conn.Close()
        return nil, err
    }
    
    return &Queue{
        conn:    conn,
        channel: ch,
        name:    queueName,
    }, nil
}

func (q *Queue) Publish(task *Task) error {
    body, err := json.Marshal(task)
    if err != nil {
        return err
    }
    
    ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
    defer cancel()
    
    return q.channel.PublishWithContext(ctx,
        "",
        q.name,
        false,
        false,
        amqp.Publishing{
            DeliveryMode: amqp.Persistent,
            ContentType:  "application/json",
            Body:         body,
        },
    )
}

func (q *Queue) Consume(handler func(*Task) error) error {
    msgs, err := q.channel.Consume(
        q.name,
        "",
        false, // manual ack
        false,
        false,
        false,
        nil,
    )
    if err != nil {
        return err
    }
    
    forever := make(chan bool)
    
    go func() {
        for msg := range msgs {
            var task Task
            if err := json.Unmarshal(msg.Body, &task); err != nil {
                msg.Nack(false, false) // Don't requeue
                continue
            }
            
            if err := handler(&task); err != nil {
                msg.Nack(false, true) // Requeue
                continue
            }
            
            msg.Ack(false)
        }
    }()
    
    <-forever
    return nil
}

func (q *Queue) Close() error {
    if err := q.channel.Close(); err != nil {
        return err
    }
    return q.conn.Close()
}

// Usage
func main() {
    q, err := NewQueue("amqp://guest:guest@localhost:5672/", "tasks")
    if err != nil {
        log.Fatal(err)
    }
    defer q.Close()
    
    // Publish task
    task := &Task{
        ID:        uuid.New().String(),
        Type:      "send_email",
        Payload: map[string]interface{}{
            "to":      "user@example.com",
            "subject": "Hello",
            "body":    "Test email",
        },
        CreatedAt: time.Now(),
    }
    
    if err := q.Publish(task); err != nil {
        log.Fatal(err)
    }
    
    // Consume tasks
    q.Consume(func(task *Task) error {
        log.Printf("Processing task: %s (%s)", task.ID, task.Type)
        
        switch task.Type {
        case "send_email":
            return sendEmail(task.Payload)
        case "process_image":
            return processImage(task.Payload)
        default:
            return fmt.Errorf("unknown task type: %s", task.Type)
        }
    })
}
```

## Pub/Sub (Fanout Exchange)

```go
package main

// Publisher
func publishEvent(ch *amqp.Channel, eventType string, data interface{}) error {
    // Declare exchange
    err := ch.ExchangeDeclare(
        "events",  // name
        "fanout",  // type
        true,      // durable
        false,     // auto-deleted
        false,     // internal
        false,     // no-wait
        nil,       // arguments
    )
    if err != nil {
        return err
    }
    
    body, _ := json.Marshal(data)
    
    return ch.PublishWithContext(
        context.Background(),
        "events", // exchange
        "",       // routing key (ignored for fanout)
        false,
        false,
        amqp.Publishing{
            ContentType: "application/json",
            Body:        body,
        },
    )
}

// Subscriber
func subscribe(ch *amqp.Channel, serviceName string) error {
    // Declare exchange
    err := ch.ExchangeDeclare(
        "events",
        "fanout",
        true,
        false,
        false,
        false,
        nil,
    )
    if err != nil {
        return err
    }
    
    // Declare exclusive queue
    q, err := ch.QueueDeclare(
        "",    // auto-generate name
        false, // not durable
        true,  // delete when unused
        true,  // exclusive
        false,
        nil,
    )
    if err != nil {
        return err
    }
    
    // Bind queue to exchange
    err = ch.QueueBind(
        q.Name,   // queue name
        "",       // routing key
        "events", // exchange
        false,
        nil,
    )
    if err != nil {
        return err
    }
    
    msgs, err := ch.Consume(
        q.Name,
        serviceName,
        true, // auto-ack
        false,
        false,
        false,
        nil,
    )
    if err != nil {
        return err
    }
    
    go func() {
        for msg := range msgs {
            log.Printf("[%s] Received event: %s", serviceName, msg.Body)
        }
    }()
    
    return nil
}

// Example: User registration event
type UserRegisteredEvent struct {
    UserID    int       `json:"user_id"`
    Email     string    `json:"email"`
    Timestamp time.Time `json:"timestamp"`
}

func main() {
    conn, _ := amqp.Dial("amqp://localhost")
    defer conn.Close()
    
    ch, _ := conn.Channel()
    defer ch.Close()
    
    // Multiple services subscribe
    subscribe(ch, "email-service")
    subscribe(ch, "analytics-service")
    subscribe(ch, "notification-service")
    
    // Publish event
    event := UserRegisteredEvent{
        UserID:    123,
        Email:     "user@example.com",
        Timestamp: time.Now(),
    }
    publishEvent(ch, "user.registered", event)
    
    // Keep running
    select {}
}
```

## Topic Exchange (Pattern Matching)

```go
package main

// Publish with routing key
func publishLog(ch *amqp.Channel, severity, message string) error {
    err := ch.ExchangeDeclare(
        "logs_topic",
        "topic", // topic exchange
        true,
        false,
        false,
        false,
        nil,
    )
    if err != nil {
        return err
    }
    
    routingKey := severity // e.g., "error.payment", "info.user"
    
    return ch.PublishWithContext(
        context.Background(),
        "logs_topic",
        routingKey,
        false,
        false,
        amqp.Publishing{
            ContentType: "text/plain",
            Body:        []byte(message),
        },
    )
}

// Subscribe with pattern
func subscribeLogs(ch *amqp.Channel, patterns []string) error {
    err := ch.ExchangeDeclare(
        "logs_topic",
        "topic",
        true,
        false,
        false,
        false,
        nil,
    )
    if err != nil {
        return err
    }
    
    q, err := ch.QueueDeclare("", false, true, true, false, nil)
    if err != nil {
        return err
    }
    
    // Bind to multiple patterns
    for _, pattern := range patterns {
        err = ch.QueueBind(
            q.Name,
            pattern,      // e.g., "error.*", "*.payment", "#"
            "logs_topic",
            false,
            nil,
        )
        if err != nil {
            return err
        }
    }
    
    msgs, _ := ch.Consume(q.Name, "", true, false, false, false, nil)
    
    go func() {
        for msg := range msgs {
            log.Printf("[%s] %s", msg.RoutingKey, msg.Body)
        }
    }()
    
    return nil
}

func main() {
    conn, _ := amqp.Dial("amqp://localhost")
    defer conn.Close()
    
    ch, _ := conn.Channel()
    defer ch.Close()
    
    // Subscribe to all errors
    subscribeLogs(ch, []string{"error.*"})
    
    // Subscribe to all payment-related logs
    subscribeLogs(ch, []string{"*.payment"})
    
    // Subscribe to everything
    subscribeLogs(ch, []string{"#"})
    
    // Publish logs
    publishLog(ch, "error.payment", "Payment failed")
    publishLog(ch, "info.user", "User logged in")
    publishLog(ch, "error.database", "Connection timeout")
    
    select {}
}
```

## Worker Pool Pattern

```go
package worker

import (
    "log"
    "sync"
    
    amqp "github.com/rabbitmq/amqp091-go"
)

type Worker struct {
    id       int
    channel  *amqp.Channel
    queue    string
    handler  func(*amqp.Delivery) error
}

type WorkerPool struct {
    conn     *amqp.Connection
    workers  []*Worker
    size     int
    queue    string
    handler  func(*amqp.Delivery) error
    wg       sync.WaitGroup
}

func NewWorkerPool(url, queue string, size int, handler func(*amqp.Delivery) error) (*WorkerPool, error) {
    conn, err := amqp.Dial(url)
    if err != nil {
        return nil, err
    }
    
    return &WorkerPool{
        conn:    conn,
        size:    size,
        queue:   queue,
        handler: handler,
    }, nil
}

func (wp *WorkerPool) Start() error {
    for i := 0; i < wp.size; i++ {
        ch, err := wp.conn.Channel()
        if err != nil {
            return err
        }
        
        // Set prefetch
        ch.Qos(1, 0, false)
        
        worker := &Worker{
            id:      i + 1,
            channel: ch,
            queue:   wp.queue,
            handler: wp.handler,
        }
        
        wp.workers = append(wp.workers, worker)
        wp.wg.Add(1)
        
        go worker.start(&wp.wg)
    }
    
    return nil
}

func (w *Worker) start(wg *sync.WaitGroup) {
    defer wg.Done()
    
    msgs, err := w.channel.Consume(
        w.queue,
        "",
        false, // manual ack
        false,
        false,
        false,
        nil,
    )
    if err != nil {
        log.Printf("Worker %d: consume error: %v", w.id, err)
        return
    }
    
    log.Printf("Worker %d started", w.id)
    
    for msg := range msgs {
        log.Printf("Worker %d processing message", w.id)
        
        if err := w.handler(&msg); err != nil {
            log.Printf("Worker %d: handler error: %v", w.id, err)
            msg.Nack(false, true) // Requeue
        } else {
            msg.Ack(false)
        }
    }
}

func (wp *WorkerPool) Stop() {
    for _, worker := range wp.workers {
        worker.channel.Close()
    }
    wp.conn.Close()
    wp.wg.Wait()
}

// Usage
func main() {
    pool, err := NewWorkerPool(
        "amqp://localhost",
        "tasks",
        5, // 5 workers
        func(msg *amqp.Delivery) error {
            log.Printf("Processing: %s", msg.Body)
            time.Sleep(1 * time.Second)
            return nil
        },
    )
    if err != nil {
        log.Fatal(err)
    }
    
    pool.Start()
    
    // Wait for interrupt
    quit := make(chan os.Signal, 1)
    signal.Notify(quit, os.Interrupt)
    <-quit
    
    pool.Stop()
}
```

## Dead Letter Queue (DLQ)

```go
package main

func setupWithDLQ(ch *amqp.Channel) error {
    // Declare DLQ
    _, err := ch.QueueDeclare(
        "tasks.dlq",
        true,
        false,
        false,
        false,
        nil,
    )
    if err != nil {
        return err
    }
    
    // Declare main queue with DLQ
    _, err = ch.QueueDeclare(
        "tasks",
        true,
        false,
        false,
        false,
        amqp.Table{
            "x-dead-letter-exchange":    "",
            "x-dead-letter-routing-key": "tasks.dlq",
            "x-message-ttl":             300000, // 5 minutes
        },
    )
    
    return err
}

// Reject message (send to DLQ)
func handleMessage(msg *amqp.Delivery) {
    // Process...
    
    if err := processTask(msg.Body); err != nil {
        // Reject and don't requeue (goes to DLQ)
        msg.Reject(false)
        return
    }
    
    msg.Ack(false)
}
```

## Best Practices

### 1. Connection Management

```go
type RabbitMQ struct {
    conn    *amqp.Connection
    channel *amqp.Channel
}

func (r *RabbitMQ) reconnect() error {
    if r.conn != nil && !r.conn.IsClosed() {
        return nil
    }
    
    conn, err := amqp.Dial("amqp://localhost")
    if err != nil {
        return err
    }
    
    ch, err := conn.Channel()
    if err != nil {
        conn.Close()
        return err
    }
    
    r.conn = conn
    r.channel = ch
    
    return nil
}
```

### 2. Message Acknowledgment

```go
// Manual acknowledgment for reliability
msg.Ack(false) // Success

// Negative acknowledgment
msg.Nack(false, true) // Requeue
msg.Nack(false, false) // Don't requeue (DLQ)

// Reject single message
msg.Reject(true) // Requeue
```

### 3. Prefetch Count

```go
// Limit unacknowledged messages per worker
ch.Qos(
    1,     // Prefetch count
    0,     // Prefetch size
    false, // Global
)
```

### 4. Durability

```go
// Durable queue
ch.QueueDeclare(name, true, false, false, false, nil)

// Persistent messages
ch.PublishWithContext(ctx, "", queue, false, false, amqp.Publishing{
    DeliveryMode: amqp.Persistent,
    Body:         body,
})
```

## Summary

RabbitMQ enables:
- **Task Queues**: Distribute work
- **Pub/Sub**: Event broadcasting
- **Routing**: Pattern-based message delivery
- **Reliability**: Acknowledgments, persistence
- **Scalability**: Worker pools

Essential for distributed, asynchronous systems.
