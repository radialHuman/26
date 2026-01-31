# Distributed Tracing with OpenTelemetry

## What is Distributed Tracing?

**Distributed tracing** tracks requests across multiple services:
- **Request Flow**: Visualize path through microservices
- **Performance**: Identify slow services/operations
- **Debugging**: Find errors in distributed systems
- **Dependencies**: Understand service relationships

## Why OpenTelemetry?

**OpenTelemetry** is the industry standard for:
- **Vendor Neutral**: Works with Jaeger, Zipkin, DataDog, etc.
- **Unified API**: Single SDK for traces, metrics, logs
- **Auto-instrumentation**: Automatic HTTP/database tracing
- **Context Propagation**: Track requests across services

## Core Concepts

### Trace
Complete journey of a request through system.

### Span
Single operation within a trace (HTTP request, database query).

### Context
Carries trace information between services.

## Installation

```bash
go get go.opentelemetry.io/otel
go get go.opentelemetry.io/otel/sdk
go get go.opentelemetry.io/otel/exporters/jaeger
go get go.opentelemetry.io/contrib/instrumentation/github.com/gin-gonic/gin/otelgin
go get go.opentelemetry.io/contrib/instrumentation/gorm.io/gorm/otelgorm
```

## Basic Setup

```go
package tracing

import (
    "context"
    "log"
    
    "go.opentelemetry.io/otel"
    "go.opentelemetry.io/otel/attribute"
    "go.opentelemetry.io/otel/exporters/jaeger"
    "go.opentelemetry.io/otel/sdk/resource"
    sdktrace "go.opentelemetry.io/otel/sdk/trace"
    semconv "go.opentelemetry.io/otel/semconv/v1.4.0"
)

func InitTracer(serviceName string) (*sdktrace.TracerProvider, error) {
    // Create Jaeger exporter
    exporter, err := jaeger.New(
        jaeger.WithCollectorEndpoint(
            jaeger.WithEndpoint("http://localhost:14268/api/traces"),
        ),
    )
    if err != nil {
        return nil, err
    }
    
    // Create tracer provider
    tp := sdktrace.NewTracerProvider(
        sdktrace.WithBatcher(exporter),
        sdktrace.WithResource(resource.NewWithAttributes(
            semconv.SchemaURL,
            semconv.ServiceNameKey.String(serviceName),
            attribute.String("environment", "production"),
            attribute.String("version", "1.0.0"),
        )),
        sdktrace.WithSampler(sdktrace.AlwaysSample()),
    )
    
    // Set global tracer provider
    otel.SetTracerProvider(tp)
    
    return tp, nil
}

// Shutdown gracefully
func Shutdown(ctx context.Context, tp *sdktrace.TracerProvider) error {
    return tp.Shutdown(ctx)
}
```

## Gin Middleware

```go
package main

import (
    "context"
    "log"
    "time"
    
    "github.com/gin-gonic/gin"
    "go.opentelemetry.io/contrib/instrumentation/github.com/gin-gonic/gin/otelgin"
    "go.opentelemetry.io/otel"
    "go.opentelemetry.io/otel/attribute"
    "go.opentelemetry.io/otel/codes"
)

func main() {
    // Initialize tracer
    tp, err := InitTracer("user-service")
    if err != nil {
        log.Fatal(err)
    }
    defer tp.Shutdown(context.Background())
    
    r := gin.Default()
    
    // Add OpenTelemetry middleware
    r.Use(otelgin.Middleware("user-service"))
    
    r.GET("/users/:id", getUser)
    r.POST("/users", createUser)
    
    r.Run(":8080")
}

func getUser(c *gin.Context) {
    // Automatically traced by otelgin middleware
    userID := c.Param("id")
    
    // Create custom span for database query
    ctx := c.Request.Context()
    tracer := otel.Tracer("user-service")
    
    ctx, span := tracer.Start(ctx, "database.query.user")
    span.SetAttributes(
        attribute.String("user.id", userID),
        attribute.String("db.system", "postgresql"),
    )
    defer span.End()
    
    // Simulate database query
    user, err := getUserFromDB(ctx, userID)
    if err != nil {
        span.RecordError(err)
        span.SetStatus(codes.Error, "Failed to fetch user")
        c.JSON(500, gin.H{"error": err.Error()})
        return
    }
    
    span.SetStatus(codes.Ok, "User fetched successfully")
    c.JSON(200, user)
}
```

## Manual Span Creation

```go
package service

import (
    "context"
    
    "go.opentelemetry.io/otel"
    "go.opentelemetry.io/otel/attribute"
    "go.opentelemetry.io/otel/codes"
    "go.opentelemetry.io/otel/trace"
)

type UserService struct {
    tracer trace.Tracer
}

func NewUserService() *UserService {
    return &UserService{
        tracer: otel.Tracer("user-service"),
    }
}

func (s *UserService) CreateUser(ctx context.Context, user *User) error {
    // Start span
    ctx, span := s.tracer.Start(ctx, "UserService.CreateUser")
    defer span.End()
    
    // Add attributes
    span.SetAttributes(
        attribute.String("user.email", user.Email),
        attribute.String("user.role", user.Role),
    )
    
    // Validate user
    if err := s.validateUser(ctx, user); err != nil {
        span.RecordError(err)
        span.SetStatus(codes.Error, "Validation failed")
        return err
    }
    
    // Save to database
    if err := s.saveUser(ctx, user); err != nil {
        span.RecordError(err)
        span.SetStatus(codes.Error, "Database save failed")
        return err
    }
    
    // Send welcome email (child span)
    if err := s.sendWelcomeEmail(ctx, user); err != nil {
        // Log error but don't fail
        span.AddEvent("email_send_failed", trace.WithAttributes(
            attribute.String("error", err.Error()),
        ))
    }
    
    span.SetStatus(codes.Ok, "User created successfully")
    return nil
}

func (s *UserService) validateUser(ctx context.Context, user *User) error {
    // Create child span
    ctx, span := s.tracer.Start(ctx, "UserService.validateUser")
    defer span.End()
    
    // Validation logic
    if user.Email == "" {
        err := errors.New("email required")
        span.RecordError(err)
        span.SetStatus(codes.Error, err.Error())
        return err
    }
    
    span.SetStatus(codes.Ok, "Validation passed")
    return nil
}

func (s *UserService) sendWelcomeEmail(ctx context.Context, user *User) error {
    ctx, span := s.tracer.Start(ctx, "UserService.sendWelcomeEmail")
    defer span.End()
    
    span.SetAttributes(
        attribute.String("email.to", user.Email),
        attribute.String("email.template", "welcome"),
    )
    
    // Send email logic
    time.Sleep(100 * time.Millisecond) // Simulate
    
    span.SetStatus(codes.Ok, "Email sent")
    return nil
}
```

## Database Tracing (GORM)

```go
package database

import (
    "gorm.io/driver/postgres"
    "gorm.io/gorm"
    "go.opentelemetry.io/contrib/instrumentation/gorm.io/gorm/otelgorm"
)

func InitDB() (*gorm.DB, error) {
    dsn := "host=localhost user=postgres password=secret dbname=mydb"
    db, err := gorm.Open(postgres.Open(dsn), &gorm.Config{})
    if err != nil {
        return nil, err
    }
    
    // Add OpenTelemetry plugin
    if err := db.Use(otelgorm.NewPlugin()); err != nil {
        return nil, err
    }
    
    return db, nil
}

// Usage - automatically traced
func getUser(ctx context.Context, db *gorm.DB, id int) (*User, error) {
    var user User
    // This query will be traced automatically
    err := db.WithContext(ctx).First(&user, id).Error
    return &user, err
}
```

## HTTP Client Tracing

```go
package client

import (
    "context"
    "net/http"
    
    "go.opentelemetry.io/contrib/instrumentation/net/http/otelhttp"
    "go.opentelemetry.io/otel"
    "go.opentelemetry.io/otel/attribute"
)

func CallExternalService(ctx context.Context, url string) (*Response, error) {
    // Create traced HTTP client
    client := http.Client{
        Transport: otelhttp.NewTransport(http.DefaultTransport),
    }
    
    // Create request with context
    req, err := http.NewRequestWithContext(ctx, "GET", url, nil)
    if err != nil {
        return nil, err
    }
    
    // Add custom span
    tracer := otel.Tracer("external-service")
    ctx, span := tracer.Start(ctx, "external.api.call")
    span.SetAttributes(
        attribute.String("http.url", url),
        attribute.String("http.method", "GET"),
    )
    defer span.End()
    
    // Make request (automatically propagates trace context)
    resp, err := client.Do(req)
    if err != nil {
        span.RecordError(err)
        return nil, err
    }
    defer resp.Body.Close()
    
    span.SetAttributes(
        attribute.Int("http.status_code", resp.StatusCode),
    )
    
    // Process response
    return processResponse(resp)
}
```

## Context Propagation

Automatically propagate trace context between services.

### Service A (Caller)
```go
package main

import (
    "context"
    "net/http"
    
    "go.opentelemetry.io/contrib/instrumentation/net/http/otelhttp"
    "go.opentelemetry.io/otel"
)

func callServiceB(ctx context.Context) error {
    tracer := otel.Tracer("service-a")
    ctx, span := tracer.Start(ctx, "call.service.b")
    defer span.End()
    
    // Create traced HTTP client
    client := http.Client{
        Transport: otelhttp.NewTransport(http.DefaultTransport),
    }
    
    req, _ := http.NewRequestWithContext(ctx, "GET", "http://service-b:8080/data", nil)
    
    // Trace context automatically added to headers
    resp, err := client.Do(req)
    if err != nil {
        span.RecordError(err)
        return err
    }
    defer resp.Body.Close()
    
    return nil
}
```

### Service B (Receiver)
```go
package main

import (
    "github.com/gin-gonic/gin"
    "go.opentelemetry.io/contrib/instrumentation/github.com/gin-gonic/gin/otelgin"
)

func main() {
    tp, _ := InitTracer("service-b")
    defer tp.Shutdown(context.Background())
    
    r := gin.Default()
    
    // Middleware extracts trace context from headers
    r.Use(otelgin.Middleware("service-b"))
    
    r.GET("/data", getData)
    r.Run(":8080")
}

func getData(c *gin.Context) {
    // Context contains parent trace from Service A
    ctx := c.Request.Context()
    
    // This span will be child of Service A's span
    tracer := otel.Tracer("service-b")
    ctx, span := tracer.Start(ctx, "getData")
    defer span.End()
    
    // Process request
    c.JSON(200, gin.H{"data": "value"})
}
```

## Span Events and Attributes

```go
package service

import (
    "context"
    "time"
    
    "go.opentelemetry.io/otel"
    "go.opentelemetry.io/otel/attribute"
    "go.opentelemetry.io/otel/codes"
    "go.opentelemetry.io/otel/trace"
)

func ProcessOrder(ctx context.Context, order *Order) error {
    tracer := otel.Tracer("order-service")
    ctx, span := tracer.Start(ctx, "ProcessOrder")
    defer span.End()
    
    // Add attributes
    span.SetAttributes(
        attribute.String("order.id", order.ID),
        attribute.Float64("order.total", order.Total),
        attribute.Int("order.items", len(order.Items)),
        attribute.String("customer.id", order.CustomerID),
    )
    
    // Add event
    span.AddEvent("order.validated", trace.WithAttributes(
        attribute.String("validation.status", "passed"),
    ))
    
    // Validate payment
    if err := validatePayment(ctx, order); err != nil {
        span.AddEvent("payment.failed", trace.WithAttributes(
            attribute.String("error", err.Error()),
            attribute.String("payment.method", order.PaymentMethod),
        ))
        span.RecordError(err)
        span.SetStatus(codes.Error, "Payment validation failed")
        return err
    }
    
    span.AddEvent("payment.validated")
    
    // Process items
    for i, item := range order.Items {
        span.AddEvent("item.processing", trace.WithAttributes(
            attribute.Int("item.index", i),
            attribute.String("item.id", item.ID),
            attribute.Float64("item.price", item.Price),
        ))
        
        if err := processItem(ctx, item); err != nil {
            span.RecordError(err)
            continue // Process remaining items
        }
    }
    
    span.AddEvent("order.completed", trace.WithAttributes(
        attribute.String("completion.time", time.Now().Format(time.RFC3339)),
    ))
    
    span.SetStatus(codes.Ok, "Order processed successfully")
    return nil
}
```

## Custom Exporters

### Jaeger
```go
import (
    "go.opentelemetry.io/otel/exporters/jaeger"
)

func InitJaegerExporter() (sdktrace.SpanExporter, error) {
    return jaeger.New(
        jaeger.WithCollectorEndpoint(
            jaeger.WithEndpoint("http://jaeger:14268/api/traces"),
        ),
    )
}
```

### OTLP (OpenTelemetry Protocol)
```go
import (
    "go.opentelemetry.io/otel/exporters/otlp/otlptrace/otlptracegrpc"
)

func InitOTLPExporter(ctx context.Context) (sdktrace.SpanExporter, error) {
    return otlptracegrpc.New(ctx,
        otlptracegrpc.WithEndpoint("otel-collector:4317"),
        otlptracegrpc.WithInsecure(),
    )
}
```

### Stdout (Development)
```go
import (
    "go.opentelemetry.io/otel/exporters/stdout/stdouttrace"
)

func InitStdoutExporter() (sdktrace.SpanExporter, error) {
    return stdouttrace.New(
        stdouttrace.WithPrettyPrint(),
    )
}
```

## Sampling Strategies

```go
import (
    sdktrace "go.opentelemetry.io/otel/sdk/trace"
)

// Always sample (development)
sampler := sdktrace.AlwaysSample()

// Never sample
sampler := sdktrace.NeverSample()

// Sample based on parent decision
sampler := sdktrace.ParentBased(sdktrace.AlwaysSample())

// Sample 10% of traces
sampler := sdktrace.TraceIDRatioBased(0.1)

// Custom sampling
sampler := sdktrace.ParentBased(
    sdktrace.TraceIDRatioBased(0.5), // Root spans: 50%
    sdktrace.WithRemoteParentSampled(sdktrace.AlwaysSample()),
    sdktrace.WithRemoteParentNotSampled(sdktrace.NeverSample()),
)
```

## Complete Application Example

```go
package main

import (
    "context"
    "log"
    "os"
    "os/signal"
    "syscall"
    "time"
    
    "github.com/gin-gonic/gin"
    "go.opentelemetry.io/contrib/instrumentation/github.com/gin-gonic/gin/otelgin"
    "go.opentelemetry.io/otel"
    "go.opentelemetry.io/otel/attribute"
    "go.opentelemetry.io/otel/exporters/jaeger"
    "go.opentelemetry.io/otel/sdk/resource"
    sdktrace "go.opentelemetry.io/otel/sdk/trace"
    semconv "go.opentelemetry.io/otel/semconv/v1.4.0"
)

func main() {
    // Initialize tracer
    tp, err := initTracer()
    if err != nil {
        log.Fatal(err)
    }
    
    // Graceful shutdown
    ctx, cancel := context.WithCancel(context.Background())
    defer cancel()
    
    go func() {
        sigCh := make(chan os.Signal, 1)
        signal.Notify(sigCh, syscall.SIGINT, syscall.SIGTERM)
        <-sigCh
        
        log.Println("Shutting down tracer...")
        shutdownCtx, shutdownCancel := context.WithTimeout(context.Background(), 5*time.Second)
        defer shutdownCancel()
        
        if err := tp.Shutdown(shutdownCtx); err != nil {
            log.Printf("Error shutting down tracer: %v", err)
        }
        cancel()
    }()
    
    // Setup Gin
    r := gin.Default()
    r.Use(otelgin.Middleware("user-service"))
    
    // Routes
    r.GET("/users/:id", getUser)
    r.POST("/users", createUser)
    
    log.Println("Server starting on :8080")
    if err := r.Run(":8080"); err != nil {
        log.Fatal(err)
    }
}

func initTracer() (*sdktrace.TracerProvider, error) {
    exporter, err := jaeger.New(
        jaeger.WithCollectorEndpoint(
            jaeger.WithEndpoint("http://jaeger:14268/api/traces"),
        ),
    )
    if err != nil {
        return nil, err
    }
    
    tp := sdktrace.NewTracerProvider(
        sdktrace.WithBatcher(exporter),
        sdktrace.WithResource(resource.NewWithAttributes(
            semconv.SchemaURL,
            semconv.ServiceNameKey.String("user-service"),
            attribute.String("environment", os.Getenv("ENV")),
        )),
        sdktrace.WithSampler(sdktrace.ParentBased(
            sdktrace.TraceIDRatioBased(0.5),
        )),
    )
    
    otel.SetTracerProvider(tp)
    return tp, nil
}
```

## Docker Compose with Jaeger

```yaml
version: '3.8'

services:
  jaeger:
    image: jaegertracing/all-in-one:latest
    ports:
      - "6831:6831/udp"  # Jaeger agent
      - "16686:16686"    # Jaeger UI
      - "14268:14268"    # Jaeger collector
    environment:
      - COLLECTOR_ZIPKIN_HTTP_PORT=9411
  
  user-service:
    build: .
    ports:
      - "8080:8080"
    environment:
      - JAEGER_ENDPOINT=http://jaeger:14268/api/traces
    depends_on:
      - jaeger
```

## Best Practices

1. **Name Spans Clearly**: Use operation names like `service.method`
2. **Add Relevant Attributes**: User ID, request ID, database table
3. **Record Errors**: Use `span.RecordError(err)`
4. **Set Status**: Use `span.SetStatus(codes.Ok/Error, message)`
5. **Context Propagation**: Always pass `context.Context`
6. **Sampling**: Use appropriate sampling in production
7. **Resource Attributes**: Add service name, version, environment
8. **Events**: Use for important milestones
9. **Avoid High Cardinality**: Don't add unique IDs to span names
10. **Close Spans**: Always `defer span.End()`

## Summary

Distributed tracing provides:
- **Visibility**: See request flow across services
- **Performance**: Identify bottlenecks
- **Debugging**: Trace errors through system
- **Dependencies**: Understand service relationships
- **Monitoring**: Track latency and failures

Essential for debugging and optimizing microservices.
