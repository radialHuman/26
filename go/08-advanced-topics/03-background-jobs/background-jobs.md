# Background Job Processing

## What are Background Jobs?

**Background jobs** are tasks executed asynchronously, outside the request-response cycle:
- **Email Sending**: Welcome emails, notifications
- **Report Generation**: PDF reports, CSV exports
- **Data Processing**: Image resizing, video encoding
- **Scheduled Tasks**: Daily cleanups, weekly reports
- **External API Calls**: Third-party integrations

## Why Background Jobs?

Without background jobs:
```go
func registerUser(c *gin.Context) {
    // Create user (fast)
    user := createUser()
    
    // Send welcome email (slow, 2-5 seconds)
    sendEmail(user.Email, "Welcome!")
    
    // Update analytics (slow)
    analytics.Track(user.ID, "registered")
    
    // Total: 3-7 seconds response time
    c.JSON(200, user)
}
```

With background jobs:
```go
func registerUser(c *gin.Context) {
    // Create user (fast)
    user := createUser()
    
    // Queue background jobs (instant)
    jobQueue.Enqueue("send_welcome_email", user.Email)
    jobQueue.Enqueue("track_registration", user.ID)
    
    // Total: <100ms response time
    c.JSON(200, user)
}
```

## Worker Pool Pattern

Simple worker pool without external dependencies.

```go
package worker

import (
    "context"
    "fmt"
    "log"
    "sync"
)

type Job struct {
    ID      string
    Type    string
    Payload interface{}
}

type Worker struct {
    ID         int
    JobQueue   chan Job
    WorkerPool chan chan Job
    QuitChan   chan bool
}

func NewWorker(id int, workerPool chan chan Job) *Worker {
    return &Worker{
        ID:         id,
        JobQueue:   make(chan Job),
        WorkerPool: workerPool,
        QuitChan:   make(chan bool),
    }
}

func (w *Worker) Start() {
    go func() {
        for {
            // Register worker in pool
            w.WorkerPool <- w.JobQueue
            
            select {
            case job := <-w.JobQueue:
                // Process job
                w.processJob(job)
            case <-w.QuitChan:
                return
            }
        }
    }()
}

func (w *Worker) processJob(job Job) {
    log.Printf("Worker %d processing job %s (type: %s)", w.ID, job.ID, job.Type)
    
    switch job.Type {
    case "send_email":
        sendEmail(job.Payload)
    case "resize_image":
        resizeImage(job.Payload)
    case "generate_report":
        generateReport(job.Payload)
    default:
        log.Printf("Unknown job type: %s", job.Type)
    }
}

func (w *Worker) Stop() {
    w.QuitChan <- true
}

// Dispatcher
type Dispatcher struct {
    WorkerPool chan chan Job
    MaxWorkers int
    JobQueue   chan Job
    Workers    []*Worker
}

func NewDispatcher(maxWorkers, maxQueue int) *Dispatcher {
    return &Dispatcher{
        WorkerPool: make(chan chan Job, maxWorkers),
        MaxWorkers: maxWorkers,
        JobQueue:   make(chan Job, maxQueue),
    }
}

func (d *Dispatcher) Start() {
    // Start workers
    for i := 0; i < d.MaxWorkers; i++ {
        worker := NewWorker(i+1, d.WorkerPool)
        worker.Start()
        d.Workers = append(d.Workers, worker)
    }
    
    // Dispatch jobs
    go d.dispatch()
}

func (d *Dispatcher) dispatch() {
    for job := range d.JobQueue {
        // Wait for available worker
        jobChannel := <-d.WorkerPool
        
        // Send job to worker
        jobChannel <- job
    }
}

func (d *Dispatcher) Enqueue(jobType string, payload interface{}) {
    job := Job{
        ID:      generateID(),
        Type:    jobType,
        Payload: payload,
    }
    
    d.JobQueue <- job
}

func (d *Dispatcher) Stop() {
    close(d.JobQueue)
    for _, worker := range d.Workers {
        worker.Stop()
    }
}

// Usage
func main() {
    // Create dispatcher with 5 workers and queue size 100
    dispatcher := NewDispatcher(5, 100)
    dispatcher.Start()
    
    // Enqueue jobs
    dispatcher.Enqueue("send_email", map[string]string{
        "to":      "user@example.com",
        "subject": "Welcome!",
    })
    
    dispatcher.Enqueue("resize_image", map[string]string{
        "path":   "/uploads/image.jpg",
        "width":  "800",
        "height": "600",
    })
}
```

## Asynq (Redis-based)

Production-ready job queue backed by Redis.

```bash
go get github.com/hibiken/asynq
```

### Server Setup

```go
package main

import (
    "context"
    "encoding/json"
    "fmt"
    "log"
    "time"
    
    "github.com/hibiken/asynq"
)

// Task payloads
type EmailPayload struct {
    To      string
    Subject string
    Body    string
}

type ImagePayload struct {
    Path   string
    Width  int
    Height int
}

// Task types
const (
    TypeEmailDelivery  = "email:deliver"
    TypeImageResize    = "image:resize"
    TypeReportGenerate = "report:generate"
)

// Task handlers
func HandleEmailDeliveryTask(ctx context.Context, t *asynq.Task) error {
    var p EmailPayload
    if err := json.Unmarshal(t.Payload(), &p); err != nil {
        return fmt.Errorf("json.Unmarshal failed: %w", err)
    }
    
    log.Printf("Sending email to %s: %s", p.To, p.Subject)
    
    // Send email
    time.Sleep(2 * time.Second) // Simulate sending
    
    log.Printf("Email sent to %s", p.To)
    return nil
}

func HandleImageResizeTask(ctx context.Context, t *asynq.Task) error {
    var p ImagePayload
    if err := json.Unmarshal(t.Payload(), &p); err != nil {
        return fmt.Errorf("json.Unmarshal failed: %w", err)
    }
    
    log.Printf("Resizing image %s to %dx%d", p.Path, p.Width, p.Height)
    
    // Resize image
    time.Sleep(5 * time.Second) // Simulate processing
    
    log.Printf("Image resized: %s", p.Path)
    return nil
}

func main() {
    // Redis connection
    redisOpt := asynq.RedisClientOpt{
        Addr: "localhost:6379",
    }
    
    // Create server
    srv := asynq.NewServer(
        redisOpt,
        asynq.Config{
            Concurrency: 10, // Number of concurrent workers
            Queues: map[string]int{
                "critical": 6, // 60% of workers
                "default":  3, // 30% of workers
                "low":      1, // 10% of workers
            },
            // Retry configuration
            RetryDelayFunc: func(n int, err error, task *asynq.Task) time.Duration {
                return time.Duration(n*n) * time.Second // Exponential backoff
            },
            // Error handler
            ErrorHandler: asynq.ErrorHandlerFunc(func(ctx context.Context, task *asynq.Task, err error) {
                log.Printf("Task %s failed: %v", task.Type(), err)
            }),
        },
    )
    
    // Register handlers
    mux := asynq.NewServeMux()
    mux.HandleFunc(TypeEmailDelivery, HandleEmailDeliveryTask)
    mux.HandleFunc(TypeImageResize, HandleImageResizeTask)
    
    // Start server
    if err := srv.Run(mux); err != nil {
        log.Fatalf("Could not run server: %v", err)
    }
}
```

### Client (Enqueue Jobs)

```go
package jobs

import (
    "encoding/json"
    "time"
    
    "github.com/hibiken/asynq"
)

type Client struct {
    asynq *asynq.Client
}

func NewClient() *Client {
    client := asynq.NewClient(asynq.RedisClientOpt{
        Addr: "localhost:6379",
    })
    
    return &Client{asynq: client}
}

// Enqueue email
func (c *Client) EnqueueEmailDelivery(to, subject, body string) error {
    payload, err := json.Marshal(EmailPayload{
        To:      to,
        Subject: subject,
        Body:    body,
    })
    if err != nil {
        return err
    }
    
    task := asynq.NewTask(TypeEmailDelivery, payload)
    
    // Enqueue with options
    _, err = c.asynq.Enqueue(
        task,
        asynq.Queue("critical"),           // High priority queue
        asynq.MaxRetry(3),                 // Retry up to 3 times
        asynq.Timeout(30*time.Second),     // Task timeout
    )
    
    return err
}

// Schedule email for later
func (c *Client) ScheduleEmail(to, subject, body string, when time.Time) error {
    payload, err := json.Marshal(EmailPayload{
        To:      to,
        Subject: subject,
        Body:    body,
    })
    if err != nil {
        return err
    }
    
    task := asynq.NewTask(TypeEmailDelivery, payload)
    
    _, err = c.asynq.Enqueue(
        task,
        asynq.ProcessAt(when), // Schedule for specific time
    )
    
    return err
}

// Enqueue with delay
func (c *Client) EnqueueImageResize(path string, width, height int, delay time.Duration) error {
    payload, err := json.Marshal(ImagePayload{
        Path:   path,
        Width:  width,
        Height: height,
    })
    if err != nil {
        return err
    }
    
    task := asynq.NewTask(TypeImageResize, payload)
    
    _, err = c.asynq.Enqueue(
        task,
        asynq.Queue("low"),         // Low priority
        asynq.ProcessIn(delay),     // Delay execution
    )
    
    return err
}

// Usage in HTTP handler
func registerUser(c *gin.Context) {
    // Create user
    user := createUser()
    
    // Enqueue welcome email
    jobClient := NewClient()
    err := jobClient.EnqueueEmailDelivery(
        user.Email,
        "Welcome to Our Service!",
        "Thank you for registering...",
    )
    if err != nil {
        log.Printf("Failed to enqueue email: %v", err)
        // Don't fail registration if email queueing fails
    }
    
    c.JSON(200, user)
}
```

## Scheduled Tasks (Cron Jobs)

### Using Asynq Periodic Tasks

```go
package main

import (
    "context"
    "log"
    "time"
    
    "github.com/hibiken/asynq"
)

func main() {
    // Redis connection
    redisOpt := asynq.RedisClientOpt{Addr: "localhost:6379"}
    
    // Scheduler
    scheduler := asynq.NewScheduler(redisOpt, &asynq.SchedulerOpts{
        Location: time.UTC,
    })
    
    // Daily cleanup at 2 AM
    _, err := scheduler.Register(
        "0 2 * * *", // Cron expression
        asynq.NewTask("cleanup:daily", nil),
        asynq.Queue("maintenance"),
    )
    if err != nil {
        log.Fatal(err)
    }
    
    // Send weekly report every Monday at 9 AM
    _, err = scheduler.Register(
        "0 9 * * MON",
        asynq.NewTask("report:weekly", nil),
        asynq.Queue("reports"),
    )
    if err != nil {
        log.Fatal(err)
    }
    
    // Check for expired subscriptions every hour
    _, err = scheduler.Register(
        "@every 1h",
        asynq.NewTask("subscription:check_expired", nil),
    )
    if err != nil {
        log.Fatal(err)
    }
    
    // Start scheduler
    if err := scheduler.Run(); err != nil {
        log.Fatal(err)
    }
}
```

### Using Cron Library

```bash
go get github.com/robfig/cron/v3
```

```go
package main

import (
    "log"
    "time"
    
    "github.com/robfig/cron/v3"
)

func main() {
    c := cron.New()
    
    // Daily cleanup at 2 AM
    c.AddFunc("0 2 * * *", func() {
        log.Println("Running daily cleanup")
        cleanupOldData()
    })
    
    // Every 15 minutes
    c.AddFunc("*/15 * * * *", func() {
        log.Println("Checking for new notifications")
        checkNotifications()
    })
    
    // Every Monday at 9 AM
    c.AddFunc("0 9 * * MON", func() {
        log.Println("Generating weekly report")
        generateWeeklyReport()
    })
    
    // Start cron
    c.Start()
    
    // Keep running
    select {}
}

func cleanupOldData() {
    // Delete records older than 30 days
    db.Exec("DELETE FROM logs WHERE created_at < NOW() - INTERVAL 30 DAY")
}

func checkNotifications() {
    // Check for new notifications to send
}

func generateWeeklyReport() {
    // Generate and email weekly report
}
```

## Job Retry and Error Handling

```go
package jobs

import (
    "context"
    "errors"
    "fmt"
    "log"
    "time"
    
    "github.com/hibiken/asynq"
)

func HandlePaymentProcessingTask(ctx context.Context, t *asynq.Task) error {
    var p PaymentPayload
    if err := json.Unmarshal(t.Payload(), &p); err != nil {
        // Don't retry on invalid payload
        return fmt.Errorf("invalid payload: %w", asynq.SkipRetry)
    }
    
    // Process payment
    err := processPayment(p.OrderID, p.Amount)
    if err != nil {
        // Check if retryable error
        if isRetryable(err) {
            return err // Will retry with backoff
        }
        
        // Non-retryable error (e.g., card declined)
        log.Printf("Payment failed permanently: %v", err)
        return fmt.Errorf("payment failed: %w", asynq.SkipRetry)
    }
    
    return nil
}

func isRetryable(err error) bool {
    // Retry on network errors, timeouts, etc.
    if errors.Is(err, context.DeadlineExceeded) {
        return true
    }
    
    // Check for specific error codes
    // Don't retry on "card declined", "insufficient funds"
    
    return false
}

// Custom retry configuration
func EnqueueWithRetry(client *asynq.Client, task *asynq.Task) error {
    _, err := client.Enqueue(
        task,
        asynq.MaxRetry(5),
        asynq.Timeout(2*time.Minute),
        asynq.Deadline(time.Now().Add(1*time.Hour)), // Absolute deadline
        // Custom retry schedule
        asynq.Retention(24*time.Hour), // Keep for 24 hours
    )
    
    return err
}
```

## Monitoring Jobs

```go
package main

import (
    "github.com/hibiken/asynq"
    "github.com/hibiken/asynq/x/metrics"
    "github.com/prometheus/client_golang/prometheus"
)

func main() {
    // Create Prometheus registry
    registry := prometheus.NewRegistry()
    
    // Create inspector
    inspector := asynq.NewInspector(asynq.RedisClientOpt{
        Addr: "localhost:6379",
    })
    
    // Create metrics collector
    collector := metrics.NewQueueMetricsCollector(inspector)
    registry.MustRegister(collector)
    
    // Server with metrics
    srv := asynq.NewServer(
        asynq.RedisClientOpt{Addr: "localhost:6379"},
        asynq.Config{
            Concurrency: 10,
        },
    )
    
    // Expose metrics endpoint
    r.GET("/metrics", gin.WrapH(promhttp.HandlerFor(registry, promhttp.HandlerOpts{})))
}
```

### Inspect Jobs

```go
package main

import (
    "log"
    
    "github.com/hibiken/asynq"
)

func inspectJobs() {
    inspector := asynq.NewInspector(asynq.RedisClientOpt{
        Addr: "localhost:6379",
    })
    
    // Get queue stats
    stats, err := inspector.GetQueueInfo("default")
    if err != nil {
        log.Fatal(err)
    }
    
    log.Printf("Queue: %s", stats.Queue)
    log.Printf("Size: %d", stats.Size)
    log.Printf("Pending: %d", stats.Pending)
    log.Printf("Active: %d", stats.Active)
    log.Printf("Scheduled: %d", stats.Scheduled)
    log.Printf("Retry: %d", stats.Retry)
    log.Printf("Archived: %d", stats.Archived)
    
    // List pending tasks
    tasks, err := inspector.ListPendingTasks("default")
    if err != nil {
        log.Fatal(err)
    }
    
    for _, task := range tasks {
        log.Printf("Task: %s, ID: %s", task.Type, task.ID)
    }
    
    // Delete task
    err = inspector.DeleteTask("default", taskID)
    if err != nil {
        log.Fatal(err)
    }
}
```

## Best Practices

### 1. Keep Jobs Small

```go
// Bad: One big job
func processOrder(orderID int) {
    // Validate payment
    // Update inventory
    // Send confirmation email
    // Update analytics
    // Generate invoice
}

// Good: Multiple small jobs
func processOrder(orderID int) {
    jobQueue.Enqueue("validate_payment", orderID)
    jobQueue.Enqueue("update_inventory", orderID)
    jobQueue.Enqueue("send_confirmation", orderID)
    jobQueue.Enqueue("track_order", orderID)
    jobQueue.Enqueue("generate_invoice", orderID)
}
```

### 2. Make Jobs Idempotent

```go
func HandleOrderConfirmationEmail(ctx context.Context, t *asynq.Task) error {
    var p EmailPayload
    json.Unmarshal(t.Payload(), &p)
    
    // Check if already sent
    sent, err := db.Query("SELECT sent FROM email_log WHERE order_id = ?", p.OrderID)
    if err != nil {
        return err
    }
    if sent {
        log.Printf("Email already sent for order %d", p.OrderID)
        return nil // Already processed
    }
    
    // Send email
    sendEmail(p.To, p.Subject, p.Body)
    
    // Mark as sent
    db.Exec("INSERT INTO email_log (order_id, sent) VALUES (?, true)", p.OrderID)
    
    return nil
}
```

### 3. Use Dead Letter Queue

```go
// Configure DLQ
srv := asynq.NewServer(
    redisOpt,
    asynq.Config{
        Queues: map[string]int{
            "default": 10,
        },
        // Failed tasks after max retries go here
        RetryDelayFunc: func(n int, err error, task *asynq.Task) time.Duration {
            if n >= 3 {
                // Move to DLQ after 3 retries
                return 0
            }
            return time.Duration(n*n) * time.Second
        },
    },
)

// Inspect archived (DLQ) tasks
archived, err := inspector.ListArchivedTasks("default")
for _, task := range archived {
    log.Printf("Failed task: %s, Error: %s", task.Type, task.LastErr)
}
```

## Summary

Background jobs provide:
- **Async Processing**: Non-blocking operations
- **Reliability**: Retry failed jobs
- **Scalability**: Horizontal scaling with workers
- **Scheduling**: Cron-like periodic tasks
- **Monitoring**: Track job status and performance

Essential for responsive, scalable backends.
