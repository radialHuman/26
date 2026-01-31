# Microservices Architecture: Complete Guide

## Table of Contents
1. [Monolith vs Microservices](#monolith-vs-microservices)
2. [When to Use Microservices](#when-to-use-microservices)
3. [Microservices Patterns](#microservices-patterns)
4. [Service Communication](#service-communication)
5. [Service Discovery](#service-discovery)
6. [API Gateway](#api-gateway)
7. [Resilience Patterns](#resilience-patterns)
8. [Saga Pattern](#saga-pattern)
9. [CQRS & Event Sourcing](#cqrs--event-sourcing)
10. [Complete Implementation](#complete-implementation)

---

## Monolith vs Microservices

### Monolithic Architecture

```
┌───────────────────────────────────┐
│        Monolithic App             │
│  ┌─────────────────────────────┐  │
│  │   User Module               │  │
│  ├─────────────────────────────┤  │
│  │   Order Module              │  │
│  ├─────────────────────────────┤  │
│  │   Payment Module            │  │
│  ├─────────────────────────────┤  │
│  │   Inventory Module          │  │
│  └─────────────────────────────┘  │
│             ↓                     │
│      Single Database              │
└───────────────────────────────────┘
```

**Pros**:
- ✅ Simple development, deployment
- ✅ Single codebase, easy to understand
- ✅ No network overhead
- ✅ Easy transactions (single DB)

**Cons**:
- ❌ Tight coupling
- ❌ Difficult to scale independently
- ❌ One bug can crash entire app
- ❌ Technology lock-in

### Microservices Architecture

```
┌─────────┐   ┌─────────┐   ┌─────────┐   ┌─────────┐
│  User   │   │ Order   │   │ Payment │   │Inventory│
│ Service │   │ Service │   │ Service │   │ Service │
└────┬────┘   └────┬────┘   └────┬────┘   └────┬────┘
     │             │              │             │
     ▼             ▼              ▼             ▼
┌─────────┐   ┌─────────┐   ┌─────────┐   ┌─────────┐
│ User DB │   │Order DB │   │ Pay DB  │   │ Inv DB  │
└─────────┘   └─────────┘   └─────────┘   └─────────┘
```

**Pros**:
- ✅ Independent deployment
- ✅ Technology diversity (polyglot)
- ✅ Fault isolation
- ✅ Scalability (scale hot services)

**Cons**:
- ❌ Distributed system complexity
- ❌ Network latency
- ❌ Data consistency challenges
- ❌ Testing complexity

---

## When to Use Microservices

### Decision Framework

**Use Monolith when**:
```
- Team size: < 10 developers
- Traffic: < 1000 requests/sec
- Clear requirements
- Rapid prototyping
- Startup/MVP
```

**Use Microservices when**:
```
- Team size: > 20 developers
- Traffic: > 10K requests/sec
- Different scaling needs per module
- Polyglot requirements
- Frequent deployments
```

**Migration Path** (Don't start with microservices!):
```
1. Start with Monolith
2. Identify bounded contexts
3. Extract one service (e.g., payments)
4. Validate approach
5. Continue extraction
```

---

## Microservices Patterns

### Domain-Driven Design (DDD)

**Bounded Context**: Independent domain with clear boundaries.

**Example: E-commerce**:
```
┌──────────────────┐
│ User Context     │
│ - User entity    │
│ - Authentication │
└──────────────────┘

┌──────────────────┐
│ Order Context    │
│ - Order entity   │
│ - Order lifecycle│
└──────────────────┘

┌──────────────────┐
│ Payment Context  │
│ - Transaction    │
│ - Billing        │
└──────────────────┘
```

**Aggregate**: Cluster of entities treated as a unit.

```python
# Order Aggregate
class Order:
    def __init__(self, order_id):
        self.order_id = order_id
        self.items = []
        self.status = "pending"
    
    def add_item(self, product_id, quantity):
        # Business logic
        self.items.append(OrderItem(product_id, quantity))
    
    def place_order(self):
        if not self.items:
            raise ValueError("Cannot place empty order")
        self.status = "placed"
        # Publish OrderPlaced event
```

### Database per Service

**Principle**: Each service owns its database.

```
User Service    → User DB (PostgreSQL)
Order Service   → Order DB (MongoDB)
Payment Service → Payment DB (PostgreSQL)
```

**Challenges**:
1. **Joins across services**: Use API calls or events
2. **Transactions**: Use Saga pattern
3. **Data duplication**: Eventual consistency

---

## Service Communication

### Synchronous (HTTP/REST)

**Use when**: Immediate response needed.

```python
# Order Service calls User Service
import requests

def get_user(user_id):
    response = requests.get(f"http://user-service/users/{user_id}")
    if response.status_code == 200:
        return response.json()
    else:
        raise Exception("User not found")

def create_order(user_id, items):
    user = get_user(user_id)  # Synchronous call
    
    order = {
        'user_id': user_id,
        'user_name': user['name'],
        'items': items
    }
    
    db.insert(order)
```

**Pros**: Simple, immediate response  
**Cons**: Tight coupling, cascading failures

### Asynchronous (Message Queue)

**Use when**: Fire-and-forget, decoupling needed.

```python
# Order Service publishes event
from kafka import KafkaProducer

producer = KafkaProducer(bootstrap_servers='localhost:9092')

def create_order(user_id, items):
    order = db.insert({'user_id': user_id, 'items': items})
    
    # Publish event
    event = {
        'type': 'OrderCreated',
        'order_id': order['id'],
        'user_id': user_id,
        'items': items
    }
    
    producer.send('orders', json.dumps(event).encode())

# Payment Service listens
from kafka import KafkaConsumer

consumer = KafkaConsumer('orders', bootstrap_servers='localhost:9092')

for message in consumer:
    event = json.loads(message.value.decode())
    
    if event['type'] == 'OrderCreated':
        process_payment(event['order_id'], event['items'])
```

**Pros**: Decoupling, fault tolerance  
**Cons**: Eventual consistency, complexity

---

## Service Discovery

### Problem

```
Order Service needs to call User Service
But User Service IP changes (auto-scaling, restarts)
How does Order Service find it?
```

### Solution: Service Registry

**Options**:
1. **Client-Side Discovery**: Client queries registry
2. **Server-Side Discovery**: Load balancer queries registry

**Example: Consul**

```go
// Register service
package main

import (
	"github.com/hashicorp/consul/api"
)

func registerService(name, address string, port int) error {
	config := api.DefaultConfig()
	client, _ := api.NewClient(config)
	
	registration := &api.AgentServiceRegistration{
		ID:      name,
		Name:    name,
		Address: address,
		Port:    port,
		Check: &api.AgentServiceCheck{
			HTTP:     fmt.Sprintf("http://%s:%d/health", address, port),
			Interval: "10s",
		},
	}
	
	return client.Agent().ServiceRegister(registration)
}

// Discover service
func discoverService(name string) (string, int, error) {
	config := api.DefaultConfig()
	client, _ := api.NewClient(config)
	
	services, _, err := client.Health().Service(name, "", true, nil)
	if err != nil {
		return "", 0, err
	}
	
	if len(services) == 0 {
		return "", 0, fmt.Errorf("no healthy instances")
	}
	
	service := services[0].Service
	return service.Address, service.Port, nil
}
```

---

## API Gateway

### Pattern

```
┌─────────┐
│ Client  │
└────┬────┘
     │
     ▼
┌─────────────────┐
│  API Gateway    │
│  - Routing      │
│  - Auth         │
│  - Rate Limit   │
│  - Aggregation  │
└────┬────────────┘
     │
     ├──────────┬──────────┬──────────┐
     ▼          ▼          ▼          ▼
┌─────────┬─────────┬─────────┬─────────┐
│  User   │ Order   │ Payment │Inventory│
│ Service │ Service │ Service │ Service │
└─────────┴─────────┴─────────┴─────────┘
```

**Responsibilities**:
1. **Routing**: Route requests to appropriate service
2. **Authentication**: Verify JWT tokens
3. **Rate Limiting**: Prevent abuse
4. **Request Aggregation**: Combine multiple service calls
5. **Protocol Translation**: REST → gRPC

### Implementation (Go)

```go
package main

import (
	"encoding/json"
	"net/http"
	"net/http/httputil"
	"net/url"
)

type Gateway struct {
	services map[string]*httputil.ReverseProxy
}

func NewGateway() *Gateway {
	return &Gateway{
		services: make(map[string]*httputil.ReverseProxy),
	}
}

func (g *Gateway) RegisterService(name, targetURL string) {
	target, _ := url.Parse(targetURL)
	g.services[name] = httputil.NewSingleHostReverseProxy(target)
}

func (g *Gateway) ServeHTTP(w http.ResponseWriter, r *http.Request) {
	// Extract service from path (/user/... → user service)
	service := extractService(r.URL.Path)
	
	// Authenticate
	if !g.authenticate(r) {
		http.Error(w, "Unauthorized", http.StatusUnauthorized)
		return
	}
	
	// Rate limit
	if !g.checkRateLimit(r) {
		http.Error(w, "Rate limit exceeded", http.StatusTooManyRequests)
		return
	}
	
	// Route to service
	if proxy, ok := g.services[service]; ok {
		proxy.ServeHTTP(w, r)
	} else {
		http.Error(w, "Service not found", http.StatusNotFound)
	}
}

func (g *Gateway) authenticate(r *http.Request) bool {
	token := r.Header.Get("Authorization")
	// Verify JWT...
	return token != ""
}

func (g *Gateway) checkRateLimit(r *http.Request) bool {
	// Check rate limit...
	return true
}

func main() {
	gateway := NewGateway()
	gateway.RegisterService("user", "http://localhost:8001")
	gateway.RegisterService("order", "http://localhost:8002")
	
	http.ListenAndServe(":8080", gateway)
}
```

---

## Resilience Patterns

### Circuit Breaker

**Problem**: Service A calls failing Service B repeatedly.

**Solution**: Circuit Breaker stops calls after threshold.

```
States:
Closed  → Open (after failures) → Half-Open (test) → Closed
```

**Implementation** (Go):
```go
package main

import (
	"errors"
	"sync"
	"time"
)

type State int

const (
	StateClosed State = iota
	StateOpen
	StateHalfOpen
)

type CircuitBreaker struct {
	mu            sync.Mutex
	state         State
	failureCount  int
	successCount  int
	threshold     int
	timeout       time.Duration
	lastStateTime time.Time
}

func NewCircuitBreaker(threshold int, timeout time.Duration) *CircuitBreaker {
	return &CircuitBreaker{
		state:     StateClosed,
		threshold: threshold,
		timeout:   timeout,
	}
}

func (cb *CircuitBreaker) Call(fn func() error) error {
	cb.mu.Lock()
	defer cb.mu.Unlock()
	
	if cb.state == StateOpen {
		if time.Since(cb.lastStateTime) > cb.timeout {
			cb.state = StateHalfOpen
			cb.successCount = 0
		} else {
			return errors.New("circuit breaker open")
		}
	}
	
	err := fn()
	
	if err != nil {
		cb.failureCount++
		
		if cb.failureCount >= cb.threshold {
			cb.state = StateOpen
			cb.lastStateTime = time.Now()
		}
		
		return err
	}
	
	if cb.state == StateHalfOpen {
		cb.successCount++
		if cb.successCount >= 3 {
			cb.state = StateClosed
			cb.failureCount = 0
		}
	}
	
	return nil
}

// Usage
func main() {
	cb := NewCircuitBreaker(3, 10*time.Second)
	
	for i := 0; i < 10; i++ {
		err := cb.Call(func() error {
			// Call external service
			resp, err := http.Get("http://failing-service/api")
			if err != nil {
				return err
			}
			defer resp.Body.Close()
			
			if resp.StatusCode != 200 {
				return errors.New("service error")
			}
			
			return nil
		})
		
		if err != nil {
			fmt.Printf("Call %d failed: %v\n", i, err)
		}
	}
}
```

### Retry Pattern

```go
func retryWithBackoff(fn func() error, maxRetries int) error {
	var err error
	
	for i := 0; i < maxRetries; i++ {
		err = fn()
		
		if err == nil {
			return nil
		}
		
		// Exponential backoff
		backoff := time.Duration(math.Pow(2, float64(i))) * time.Second
		time.Sleep(backoff)
	}
	
	return err
}

// Usage
err := retryWithBackoff(func() error {
	return callExternalService()
}, 5)
```

---

## Saga Pattern

### Problem

**Distributed Transaction** across multiple services.

**Example**: Order → Payment → Inventory
- If Payment succeeds but Inventory fails, need to rollback Payment.

### Saga Solution

**Choreography** (Event-driven):
```
Order Service:
1. Create order
2. Publish OrderCreated

Payment Service:
1. Listen OrderCreated
2. Process payment
3. Publish PaymentSuccess OR PaymentFailed

Inventory Service:
1. Listen PaymentSuccess
2. Reserve inventory
3. Publish InventoryReserved OR InventoryFailed

If InventoryFailed:
  Payment Service listens, issues refund
```

**Implementation**:
```python
# Order Service
def create_order(user_id, items):
    order = db.insert({'user_id': user_id, 'items': items, 'status': 'pending'})
    
    publish_event({
        'type': 'OrderCreated',
        'order_id': order['id'],
        'items': items,
        'total': calculate_total(items)
    })

# Payment Service
def handle_order_created(event):
    try:
        payment = process_payment(event['total'])
        
        publish_event({
            'type': 'PaymentSuccess',
            'order_id': event['order_id'],
            'payment_id': payment['id']
        })
    except Exception as e:
        publish_event({
            'type': 'PaymentFailed',
            'order_id': event['order_id'],
            'reason': str(e)
        })

# Inventory Service
def handle_payment_success(event):
    try:
        reserve_inventory(event['order_id'])
        
        publish_event({
            'type': 'InventoryReserved',
            'order_id': event['order_id']
        })
    except Exception as e:
        # Compensating transaction
        publish_event({
            'type': 'InventoryFailed',
            'order_id': event['order_id']
        })

# Payment Service (compensate)
def handle_inventory_failed(event):
    refund_payment(event['order_id'])
    
    publish_event({
        'type': 'PaymentRefunded',
        'order_id': event['order_id']
    })
```

---

This comprehensive microservices guide covers architecture, patterns, communication, resilience, and saga with production-ready implementations! Final files coming next.
