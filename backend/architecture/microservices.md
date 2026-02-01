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

**Advanced Topics**

11. [Deployment Strategies](#deployment-strategies)
12. [Observability & Monitoring](#observability--monitoring)
13. [Security in Microservices](#security-in-microservices)
14. [Configuration Management](#configuration-management)
15. [Data Management Patterns](#data-management-patterns)
16. [Testing Microservices](#testing-microservices)
17. [Performance & Scalability](#performance--scalability)
18. [Cost Optimization](#cost-optimization)
19. [Polyglot & Interoperability](#polyglot--interoperability)
20. [DevOps & CI/CD](#devops--cicd)
21. [Failure Injection & Chaos Engineering](#failure-injection--chaos-engineering)
22. [Documentation & Governance](#documentation--governance)
23. [Anti-patterns & Common Pitfalls](#anti-patterns--common-pitfalls)
24. [Case Studies & Real-world Examples](#case-studies--real-world-examples)
25. [Migration & Legacy Integration](#migration--legacy-integration)
26. [Tooling Comparison Tables](#tooling-comparison-tables)

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

**Orchestration** (Centralized):
```python
# Saga Orchestrator
class OrderSagaOrchestrator:
    def __init__(self):
        self.state_machine = {
            'CREATED': self.process_payment,
            'PAYMENT_SUCCESS': self.reserve_inventory,
            'INVENTORY_SUCCESS': self.complete_order,
            'PAYMENT_FAILED': self.cancel_order,
            'INVENTORY_FAILED': self.refund_payment
        }
    
    def execute_saga(self, order_id):
        order = db.get_order(order_id)
        
        while order.status != 'COMPLETED' and order.status != 'CANCELLED':
            handler = self.state_machine.get(order.status)
            if handler:
                handler(order)
            else:
                break
    
    def process_payment(self, order):
        try:
            payment_service.charge(order.total)
            order.status = 'PAYMENT_SUCCESS'
        except Exception:
            order.status = 'PAYMENT_FAILED'
        db.update_order(order)
    
    def reserve_inventory(self, order):
        try:
            inventory_service.reserve(order.items)
            order.status = 'INVENTORY_SUCCESS'
        except Exception:
            order.status = 'INVENTORY_FAILED'
        db.update_order(order)
    
    def complete_order(self, order):
        order.status = 'COMPLETED'
        db.update_order(order)
    
    def refund_payment(self, order):
        payment_service.refund(order.id)
        order.status = 'CANCELLED'
        db.update_order(order)
```

**Pros/Cons**:

| Aspect | Choreography | Orchestration |
|--------|-------------|---------------|
| **Complexity** | Distributed logic | Centralized logic |
| **Coupling** | Loose | Tighter |
| **Debugging** | Harder | Easier |
| **Scalability** | Better | Good |
| **Use When** | Simple flows | Complex flows with conditionals |

---

## CQRS & Event Sourcing

### CQRS (Command Query Responsibility Segregation)

**Principle**: Separate read and write models.

```
┌──────────┐
│ Command  │ ──────► Write Model (PostgreSQL)
│ (Write)  │              │
└──────────┘              │
                          ▼
                    Event Stream
                          │
                          ▼
┌──────────┐         Read Model (Elasticsearch)
│  Query   │ ◄────── (Optimized for queries)
│  (Read)  │
└──────────┘
```

**Why**:
- Different read/write patterns
- Scale reads and writes independently
- Optimize each for its purpose

**Implementation** (Python):
```python
# Write Model (Commands)
class OrderCommandHandler:
    def create_order(self, command):
        # Validate
        if not command.items:
            raise ValueError("Empty order")
        
        # Create in write DB
        order = Order(
            user_id=command.user_id,
            items=command.items,
            total=self.calculate_total(command.items)
        )
        write_db.insert(order)
        
        # Publish event
        event_bus.publish(OrderCreated(
            order_id=order.id,
            user_id=order.user_id,
            items=order.items,
            total=order.total
        ))
        
        return order.id

# Read Model (Queries)
class OrderQueryHandler:
    def get_order_summary(self, order_id):
        # Read from optimized read DB
        return read_db.orders.find_one({'_id': order_id})
    
    def get_user_orders(self, user_id, limit=10):
        # Full-text search in Elasticsearch
        return elasticsearch.search(
            index='orders',
            body={
                'query': {'match': {'user_id': user_id}},
                'size': limit
            }
        )

# Event Handler (updates read model)
def handle_order_created(event):
    # Denormalize for read model
    user = user_service.get_user(event.user_id)
    
    read_db.orders.insert_one({
        '_id': event.order_id,
        'user_id': event.user_id,
        'user_name': user['name'],
        'items': event.items,
        'total': event.total,
        'created_at': datetime.utcnow()
    })
    
    # Also index in Elasticsearch
    elasticsearch.index(
        index='orders',
        id=event.order_id,
        body={
            'user_id': event.user_id,
            'user_name': user['name'],
            'total': event.total,
            'status': 'pending'
        }
    )
```

### Event Sourcing

**Principle**: Store events, not state. Rebuild state by replaying events.

```
Traditional:
  Order {id: 1, status: "shipped", total: 100}

Event Sourcing:
  OrderCreated {id: 1, total: 100}
  PaymentReceived {id: 1, amount: 100}
  OrderShipped {id: 1}
  
Current state = replay all events
```

**Implementation** (Go):
```go
// Event Store
type Event struct {
	ID          string
	AggregateID string
	Type        string
	Data        json.RawMessage
	Timestamp   time.Time
	Version     int
}

type EventStore struct {
	db *sql.DB
}

func (es *EventStore) AppendEvent(event Event) error {
	_, err := es.db.Exec(`
		INSERT INTO events (id, aggregate_id, type, data, timestamp, version)
		VALUES ($1, $2, $3, $4, $5, $6)
	`, event.ID, event.AggregateID, event.Type, event.Data, event.Timestamp, event.Version)
	
	return err
}

func (es *EventStore) GetEvents(aggregateID string) ([]Event, error) {
	rows, err := es.db.Query(`
		SELECT id, aggregate_id, type, data, timestamp, version
		FROM events
		WHERE aggregate_id = $1
		ORDER BY version ASC
	`, aggregateID)
	
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	
	var events []Event
	for rows.Next() {
		var e Event
		err := rows.Scan(&e.ID, &e.AggregateID, &e.Type, &e.Data, &e.Timestamp, &e.Version)
		if err != nil {
			return nil, err
		}
		events = append(events, e)
	}
	
	return events, nil
}

// Order Aggregate
type Order struct {
	ID      string
	UserID  string
	Items   []OrderItem
	Status  string
	Total   float64
	Version int
}

func (o *Order) Apply(event Event) {
	switch event.Type {
	case "OrderCreated":
		var data struct {
			UserID string
			Items  []OrderItem
			Total  float64
		}
		json.Unmarshal(event.Data, &data)
		o.UserID = data.UserID
		o.Items = data.Items
		o.Total = data.Total
		o.Status = "pending"
	
	case "PaymentReceived":
		o.Status = "paid"
	
	case "OrderShipped":
		o.Status = "shipped"
	}
	
	o.Version = event.Version
}

func ReconstructOrder(eventStore *EventStore, orderID string) (*Order, error) {
	events, err := eventStore.GetEvents(orderID)
	if err != nil {
		return nil, err
	}
	
	order := &Order{ID: orderID}
	for _, event := range events {
		order.Apply(event)
	}
	
	return order, nil
}
```

**Benefits**:
- ✅ Full audit trail
- ✅ Time travel (replay to any point)
- ✅ Event-driven architecture
- ✅ Debugging (see exact sequence)

**Challenges**:
- ❌ Complexity
- ❌ Event versioning
- ❌ Eventual consistency
- ❌ Storage growth

**When to Use**:
- Financial systems (audit required)
- Complex domains with state changes
- Analytics (replay events for insights)

**Tools**:
- **Open Source**: EventStoreDB, Apache Kafka
- **Commercial**: AWS EventBridge, Azure Event Hubs

---

## Complete Implementation

### Full E-commerce Microservices System

**Architecture**:
```
┌─────────┐
│ Client  │
└────┬────┘
     │
     ▼
┌─────────────┐
│ API Gateway │ (Kong/Nginx)
└─────┬───────┘
      │
      ├──────────┬──────────┬──────────┐
      ▼          ▼          ▼          ▼
┌─────────┐┌─────────┐┌─────────┐┌─────────┐
│  User   ││ Product ││  Order  ││ Payment │
│ Service ││ Service ││ Service ││ Service │
└────┬────┘└────┬────┘└────┬────┘└────┬────┘
     │          │          │          │
     ▼          ▼          ▼          ▼
  UserDB    ProductDB   OrderDB    PaymentDB
  (PG)      (Mongo)     (PG)       (PG)
  
          Event Bus (Kafka)
```

**User Service** (Go):
```go
package main

import (
	"database/sql"
	"encoding/json"
	"net/http"
	
	"github.com/gorilla/mux"
	_ "github.com/lib/pq"
)

type User struct {
	ID       string `json:"id"`
	Name     string `json:"name"`
	Email    string `json:"email"`
	Password string `json:"-"`
}

type UserService struct {
	db *sql.DB
}

func (s *UserService) CreateUser(w http.ResponseWriter, r *http.Request) {
	var user User
	json.NewDecoder(r.Body).Decode(&user)
	
	// Hash password
	hashedPassword := hashPassword(user.Password)
	
	err := s.db.QueryRow(`
		INSERT INTO users (name, email, password)
		VALUES ($1, $2, $3)
		RETURNING id
	`, user.Name, user.Email, hashedPassword).Scan(&user.ID)
	
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}
	
	// Publish UserCreated event
	publishEvent("UserCreated", map[string]interface{}{
		"user_id": user.ID,
		"email":   user.Email,
	})
	
	w.WriteHeader(http.StatusCreated)
	json.NewEncoder(w).Encode(user)
}

func (s *UserService) GetUser(w http.ResponseWriter, r *http.Request) {
	vars := mux.Vars(r)
	userID := vars["id"]
	
	var user User
	err := s.db.QueryRow(`
		SELECT id, name, email FROM users WHERE id = $1
	`, userID).Scan(&user.ID, &user.Name, &user.Email)
	
	if err != nil {
		http.Error(w, "User not found", http.StatusNotFound)
		return
	}
	
	json.NewEncoder(w).Encode(user)
}

func main() {
	db, _ := sql.Open("postgres", "postgres://user:pass@localhost/userdb")
	defer db.Close()
	
	service := &UserService{db: db}
	
	// Register with Consul
	registerService("user-service", "localhost", 8001)
	
	router := mux.NewRouter()
	router.HandleFunc("/users", service.CreateUser).Methods("POST")
	router.HandleFunc("/users/{id}", service.GetUser).Methods("GET")
	router.HandleFunc("/health", healthCheck).Methods("GET")
	
	http.ListenAndServe(":8001", router)
}
```

**Order Service** (Python):
```python
from flask import Flask, request, jsonify
from kafka import KafkaProducer, KafkaConsumer
import psycopg2
import json
import uuid

app = Flask(__name__)

# Database
conn = psycopg2.connect("dbname=orderdb user=postgres password=pass")

# Kafka Producer
producer = KafkaProducer(
    bootstrap_servers='localhost:9092',
    value_serializer=lambda v: json.dumps(v).encode('utf-8')
)

@app.route('/orders', methods=['POST'])
def create_order():
    data = request.json
    order_id = str(uuid.uuid4())
    
    # Validate user exists (call User Service)
    user_response = requests.get(f"http://user-service:8001/users/{data['user_id']}")
    if user_response.status_code != 200:
        return jsonify({'error': 'User not found'}), 404
    
    # Create order
    cur = conn.cursor()
    cur.execute("""
        INSERT INTO orders (id, user_id, items, status, total)
        VALUES (%s, %s, %s, %s, %s)
    """, (order_id, data['user_id'], json.dumps(data['items']), 'pending', data['total']))
    conn.commit()
    
    # Publish OrderCreated event
    producer.send('orders', {
        'type': 'OrderCreated',
        'order_id': order_id,
        'user_id': data['user_id'],
        'items': data['items'],
        'total': data['total']
    })
    
    return jsonify({'order_id': order_id}), 201

@app.route('/orders/<order_id>', methods=['GET'])
def get_order(order_id):
    cur = conn.cursor()
    cur.execute("SELECT * FROM orders WHERE id = %s", (order_id,))
    order = cur.fetchone()
    
    if not order:
        return jsonify({'error': 'Order not found'}), 404
    
    return jsonify({
        'id': order[0],
        'user_id': order[1],
        'items': order[2],
        'status': order[3],
        'total': order[4]
    })

# Event listener (runs in separate process)
def listen_events():
    consumer = KafkaConsumer(
        'payments',
        bootstrap_servers='localhost:9092',
        value_deserializer=lambda m: json.loads(m.decode('utf-8'))
    )
    
    for message in consumer:
        event = message.value
        
        if event['type'] == 'PaymentSuccess':
            # Update order status
            cur = conn.cursor()
            cur.execute(
                "UPDATE orders SET status = %s WHERE id = %s",
                ('paid', event['order_id'])
            )
            conn.commit()

if __name__ == '__main__':
    app.run(port=8002)
```

**Docker Compose** (Deployment):
```yaml
version: '3.8'

services:
  # API Gateway
  kong:
    image: kong:latest
    environment:
      KONG_DATABASE: postgres
      KONG_PG_HOST: kong-db
    ports:
      - "8000:8000"
      - "8001:8001"
  
  # Service Registry
  consul:
    image: consul:latest
    ports:
      - "8500:8500"
  
  # Message Broker
  kafka:
    image: confluentinc/cp-kafka:latest
    environment:
      KAFKA_ZOOKEEPER_CONNECT: zookeeper:2181
    ports:
      - "9092:9092"
  
  zookeeper:
    image: confluentinc/cp-zookeeper:latest
    environment:
      ZOOKEEPER_CLIENT_PORT: 2181
  
  # User Service
  user-service:
    build: ./user-service
    ports:
      - "8001:8001"
    depends_on:
      - user-db
      - consul
      - kafka
  
  user-db:
    image: postgres:13
    environment:
      POSTGRES_DB: userdb
      POSTGRES_PASSWORD: pass
  
  # Order Service
  order-service:
    build: ./order-service
    ports:
      - "8002:8002"
    depends_on:
      - order-db
      - consul
      - kafka
  
  order-db:
    image: postgres:13
    environment:
      POSTGRES_DB: orderdb
      POSTGRES_PASSWORD: pass
  
  # Payment Service
  payment-service:
    build: ./payment-service
    ports:
      - "8003:8003"
    depends_on:
      - payment-db
      - consul
      - kafka
  
  payment-db:
    image: postgres:13
    environment:
      POSTGRES_DB: paymentdb
      POSTGRES_PASSWORD: pass
```

---

## Deployment Strategies

### Overview

Deployment strategies determine how you roll out new versions of microservices without downtime or user impact.

### 1. Blue/Green Deployment

**What**: Run two identical environments (Blue = current, Green = new). Switch traffic instantly.

```
┌─────────────┐
│Load Balancer│
└──────┬──────┘
       │
       ├──────────────┬──────────────┐
       ▼              ▼              ▼
   Blue Env       Green Env      (Switch)
   (v1.0)         (v2.0)
   Active         Standby
   
After validation:
   Blue Env       Green Env
   (v1.0)         (v2.0)
   Standby        Active ◄── Traffic
```

**Why**:
- Zero downtime
- Instant rollback (switch back to Blue)
- Easy validation in production

**How** (Kubernetes):
```yaml
# Blue Deployment (v1)
apiVersion: apps/v1
kind: Deployment
metadata:
  name: order-service-blue
spec:
  replicas: 3
  selector:
    matchLabels:
      app: order-service
      version: v1
  template:
    metadata:
      labels:
        app: order-service
        version: v1
    spec:
      containers:
      - name: order-service
        image: order-service:v1.0
        ports:
        - containerPort: 8080

---
# Green Deployment (v2)
apiVersion: apps/v1
kind: Deployment
metadata:
  name: order-service-green
spec:
  replicas: 3
  selector:
    matchLabels:
      app: order-service
      version: v2
  template:
    metadata:
      labels:
        app: order-service
        version: v2
    spec:
      containers:
      - name: order-service
        image: order-service:v2.0
        ports:
        - containerPort: 8080

---
# Service (switch by changing selector)
apiVersion: v1
kind: Service
metadata:
  name: order-service
spec:
  selector:
    app: order-service
    version: v1  # Change to v2 to switch
  ports:
  - port: 80
    targetPort: 8080
```

**Switch Script**:
```bash
# Deploy Green
kubectl apply -f green-deployment.yaml

# Test Green
kubectl port-forward deployment/order-service-green 8080:8080
# Run tests...

# Switch traffic to Green
kubectl patch service order-service -p '{"spec":{"selector":{"version":"v2"}}}'

# If issues, rollback
kubectl patch service order-service -p '{"spec":{"selector":{"version":"v1"}}}'

# Delete Blue after validation
kubectl delete deployment order-service-blue
```

**Pros**:
- ✅ Instant rollback
- ✅ Zero downtime
- ✅ Full validation before switch

**Cons**:
- ❌ Doubles infrastructure cost
- ❌ Database migrations tricky
- ❌ Not suitable for stateful apps

**Cost**: 2x during deployment (both environments running)

**Use When**:
- Critical services requiring instant rollback
- Stateless microservices
- Budget allows temporary doubling

---

### 2. Canary Deployment

**What**: Gradually shift traffic from old to new version (e.g., 5% → 25% → 50% → 100%).

```
┌─────────────┐
│Load Balancer│
└──────┬──────┘
       │
       ├─────────────┬────────────┐
       ▼ (95%)       ▼ (5%)       │
   v1 (stable)    v2 (canary)     │
   
After validation:
       ▼ (50%)       ▼ (50%)
   v1              v2
   
Finally:
       ▼ (0%)        ▼ (100%)
   v1 (delete)     v2 (stable)
```

**Why**:
- Minimize risk (blast radius)
- Test with real users gradually
- Easy rollback if issues

**How** (Istio + Kubernetes):
```yaml
# Deployment v1 (stable)
apiVersion: apps/v1
kind: Deployment
metadata:
  name: order-service-v1
spec:
  replicas: 9
  selector:
    matchLabels:
      app: order-service
      version: v1
  template:
    metadata:
      labels:
        app: order-service
        version: v1
    spec:
      containers:
      - name: order-service
        image: order-service:v1.0

---
# Deployment v2 (canary)
apiVersion: apps/v1
kind: Deployment
metadata:
  name: order-service-v2
spec:
  replicas: 1  # 10% traffic
  selector:
    matchLabels:
      app: order-service
      version: v2
  template:
    metadata:
      labels:
        app: order-service
        version: v2
    spec:
      containers:
      - name: order-service
        image: order-service:v2.0

---
# Istio VirtualService (traffic splitting)
apiVersion: networking.istio.io/v1beta1
kind: VirtualService
metadata:
  name: order-service
spec:
  hosts:
  - order-service
  http:
  - match:
    - headers:
        user-type:
          exact: beta-tester  # Route beta testers to v2
    route:
    - destination:
        host: order-service
        subset: v2
  - route:
    - destination:
        host: order-service
        subset: v1
      weight: 90
    - destination:
        host: order-service
        subset: v2
      weight: 10  # 10% canary traffic

---
# DestinationRule
apiVersion: networking.istio.io/v1beta1
kind: DestinationRule
metadata:
  name: order-service
spec:
  host: order-service
  subsets:
  - name: v1
    labels:
      version: v1
  - name: v2
    labels:
      version: v2
```

**Progressive Rollout Script**:
```python
import subprocess
import time

def update_traffic(v1_percent, v2_percent):
    yaml = f"""
apiVersion: networking.istio.io/v1beta1
kind: VirtualService
metadata:
  name: order-service
spec:
  hosts:
  - order-service
  http:
  - route:
    - destination:
        host: order-service
        subset: v1
      weight: {v1_percent}
    - destination:
        host: order-service
        subset: v2
      weight: {v2_percent}
"""
    
    with open('canary.yaml', 'w') as f:
        f.write(yaml)
    
    subprocess.run(['kubectl', 'apply', '-f', 'canary.yaml'])

# Gradual rollout
stages = [(90, 10), (75, 25), (50, 50), (25, 75), (0, 100)]

for v1, v2 in stages:
    print(f"Shifting to {v2}% canary...")
    update_traffic(v1, v2)
    
    # Monitor metrics
    time.sleep(300)  # Wait 5 minutes
    
    # Check error rate
    error_rate = get_error_rate()  # From Prometheus
    if error_rate > 0.05:  # > 5% errors
        print("High error rate! Rolling back...")
        update_traffic(100, 0)
        break
    
    print(f"Stage complete. Errors: {error_rate:.2%}")

print("Canary deployment complete!")
```

**Automated Canary with Flagger**:
```yaml
apiVersion: flagger.app/v1beta1
kind: Canary
metadata:
  name: order-service
spec:
  targetRef:
    apiVersion: apps/v1
    kind: Deployment
    name: order-service
  service:
    port: 8080
  analysis:
    interval: 1m
    threshold: 5
    maxWeight: 50
    stepWeight: 10
    metrics:
    - name: request-success-rate
      thresholdRange:
        min: 99
      interval: 1m
    - name: request-duration
      thresholdRange:
        max: 500
      interval: 1m
    webhooks:
    - name: load-test
      url: http://flagger-loadtester/
      metadata:
        cmd: "hey -z 1m -q 10 -c 2 http://order-service-canary:8080/"
```

**Pros**:
- ✅ Low risk (gradual rollout)
- ✅ Real user validation
- ✅ Easy rollback

**Cons**:
- ❌ Slower deployment
- ❌ Requires traffic routing (service mesh)
- ❌ Complex monitoring

**Cost**: Minimal (small percentage of new instances)

**Use When**:
- High-traffic services
- Risk-averse deployments
- A/B testing needed

---

### 3. Rolling Deployment

**What**: Replace instances one-by-one or in batches.

```
Initial:
[v1] [v1] [v1] [v1] [v1]

Step 1:
[v2] [v1] [v1] [v1] [v1]

Step 2:
[v2] [v2] [v1] [v1] [v1]

Final:
[v2] [v2] [v2] [v2] [v2]
```

**How** (Kubernetes - default strategy):
```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: order-service
spec:
  replicas: 5
  strategy:
    type: RollingUpdate
    rollingUpdate:
      maxSurge: 1        # Max extra pods during update
      maxUnavailable: 1  # Max pods down during update
  selector:
    matchLabels:
      app: order-service
  template:
    metadata:
      labels:
        app: order-service
    spec:
      containers:
      - name: order-service
        image: order-service:v2.0
        readinessProbe:
          httpGet:
            path: /health
            port: 8080
          initialDelaySeconds: 5
          periodSeconds: 5
        livenessProbe:
          httpGet:
            path: /health
            port: 8080
          initialDelaySeconds: 15
          periodSeconds: 10
```

**Deploy**:
```bash
# Update image
kubectl set image deployment/order-service order-service=order-service:v2.0

# Watch rollout
kubectl rollout status deployment/order-service

# Rollback if issues
kubectl rollout undo deployment/order-service
```

**Pros**:
- ✅ Simple, built-in
- ✅ No extra infrastructure
- ✅ Gradual replacement

**Cons**:
- ❌ Slower than blue/green
- ❌ Mixed versions during rollout
- ❌ Rollback slower

**Cost**: Minimal (1-2 extra pods temporarily)

**Use When**:
- Standard deployments
- Stateless services
- Cost-conscious

---

### 4. Shadow/Dark Launch

**What**: Deploy new version, mirror traffic to it, but don't return responses to users. Use for testing.

```
┌─────────────┐
│Load Balancer│
└──────┬──────┘
       │
       ├──────────────────┐
       ▼                  ▼ (mirrored)
   v1 (stable)        v2 (shadow)
   Returns to user    Logs only
```

**How** (Istio):
```yaml
apiVersion: networking.istio.io/v1beta1
kind: VirtualService
metadata:
  name: order-service
spec:
  hosts:
  - order-service
  http:
  - match:
    - uri:
        prefix: /orders
    route:
    - destination:
        host: order-service
        subset: v1
      weight: 100
    mirror:
      host: order-service
      subset: v2
    mirrorPercentage:
      value: 100  # Mirror 100% of traffic
```

**Pros**:
- ✅ Zero user impact
- ✅ Real production data
- ✅ Performance testing

**Cons**:
- ❌ Doubles load
- ❌ Requires service mesh
- ❌ No real validation (users don't see responses)

**Use When**:
- Testing performance at scale
- Validating new algorithm
- Pre-production validation

---

### 5. Feature Flags

**What**: Deploy code with features toggled off. Enable progressively.

```python
from flask import Flask, request
import feature_flags

app = Flask(__name__)

@app.route('/orders', methods=['POST'])
def create_order():
    if feature_flags.is_enabled('new_checkout_flow', request.user_id):
        # New code (v2)
        return new_checkout(request.json)
    else:
        # Old code (v1)
        return old_checkout(request.json)
```

**LaunchDarkly Integration**:
```python
import ldclient
from ldclient.config import Config

# Initialize
ldclient.set_config(Config("sdk-key"))
ld_client = ldclient.get()

def create_order(user_id, data):
    user = {"key": user_id}
    
    # Check feature flag
    use_new_flow = ld_client.variation("new-checkout-flow", user, False)
    
    if use_new_flow:
        return new_checkout_flow(data)
    else:
        return legacy_checkout_flow(data)
```

**Open Source Alternative (Unleash)**:
```python
from UnleashClient import UnleashClient

client = UnleashClient(
    url="http://unleash-server:4242/api",
    app_name="order-service",
    custom_headers={'Authorization': 'token'}
)
client.initialize_client()

def create_order(user_id, data):
    context = {"userId": user_id}
    
    if client.is_enabled("new-checkout-flow", context):
        return new_checkout_flow(data)
    else:
        return legacy_checkout_flow(data)
```

**Pros**:
- ✅ Decouple deployment from release
- ✅ Instant rollback (toggle off)
- ✅ Gradual rollout by user segment
- ✅ A/B testing

**Cons**:
- ❌ Code complexity (if/else everywhere)
- ❌ Technical debt (old code remains)
- ❌ Testing both paths

**Tools**:
- **Open Source**: Unleash, Flagr, GrowthBook
- **Commercial**: LaunchDarkly, Split.io, Optimizely

**Cost**: Free (self-hosted) to $50-500/month (SaaS)

---

### Deployment Strategy Comparison

| Strategy | Downtime | Risk | Rollback Speed | Cost | Complexity |
|----------|----------|------|----------------|------|------------|
| **Blue/Green** | None | Low | Instant | High (2x) | Medium |
| **Canary** | None | Very Low | Fast | Low | High |
| **Rolling** | None | Medium | Slow | Very Low | Low |
| **Shadow** | None | None | N/A | Medium (2x load) | High |
| **Feature Flags** | None | Low | Instant | Low | Medium |

**Recommendation**:
- **Startups/Small teams**: Rolling
- **Critical services**: Blue/Green
- **High-traffic services**: Canary
- **A/B testing**: Feature Flags
- **Performance validation**: Shadow

---

## Observability & Monitoring

### The Three Pillars

1. **Metrics**: Numbers (CPU, latency, requests/sec)
2. **Logs**: Event records (errors, warnings)
3. **Traces**: Request flow across services

```
User Request
    │
    ▼
[API Gateway] ─────► Metrics: request_count, latency
    │                Logs: "Request to /orders"
    │                Trace: span_id=1
    ▼
[Order Service] ───► Metrics: db_query_time
    │                Logs: "Creating order 123"
    │                Trace: span_id=2, parent=1
    ▼
[Payment Service] ─► Metrics: payment_success_rate
    │                Logs: "Payment processed"
    │                Trace: span_id=3, parent=2
    ▼
Response
```

---

### 1. Metrics (Prometheus + Grafana)

**What**: Time-series data for monitoring trends and alerting.

**Prometheus** (Open Source):
```yaml
# prometheus.yml
global:
  scrape_interval: 15s

scrape_configs:
  - job_name: 'order-service'
    static_configs:
      - targets: ['order-service:8080']
  
  - job_name: 'payment-service'
    static_configs:
      - targets: ['payment-service:8080']
```

**Instrument Service** (Go):
```go
package main

import (
	"net/http"
	"time"
	
	"github.com/prometheus/client_golang/prometheus"
	"github.com/prometheus/client_golang/prometheus/promauto"
	"github.com/prometheus/client_golang/prometheus/promhttp"
)

var (
	httpRequestsTotal = promauto.NewCounterVec(
		prometheus.CounterOpts{
			Name: "http_requests_total",
			Help: "Total HTTP requests",
		},
		[]string{"method", "endpoint", "status"},
	)
	
	httpRequestDuration = promauto.NewHistogramVec(
		prometheus.HistogramOpts{
			Name:    "http_request_duration_seconds",
			Help:    "HTTP request duration",
			Buckets: prometheus.DefBuckets,
		},
		[]string{"method", "endpoint"},
	)
	
	ordersCreated = promauto.NewCounter(
		prometheus.CounterOpts{
			Name: "orders_created_total",
			Help: "Total orders created",
		},
	)
)

func metricsMiddleware(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		start := time.Now()
		
		// Wrap response writer to capture status
		wrapped := &responseWriter{ResponseWriter: w, statusCode: 200}
		
		next.ServeHTTP(wrapped, r)
		
		duration := time.Since(start).Seconds()
		
		httpRequestsTotal.WithLabelValues(
			r.Method,
			r.URL.Path,
			fmt.Sprintf("%d", wrapped.statusCode),
		).Inc()
		
		httpRequestDuration.WithLabelValues(
			r.Method,
			r.URL.Path,
		).Observe(duration)
	})
}

func createOrderHandler(w http.ResponseWriter, r *http.Request) {
	// Business logic...
	
	ordersCreated.Inc()
	
	w.WriteHeader(http.StatusCreated)
	json.NewEncoder(w).Encode(map[string]string{"status": "created"})
}

func main() {
	http.Handle("/metrics", promhttp.Handler())
	http.Handle("/orders", metricsMiddleware(http.HandlerFunc(createOrderHandler)))
	
	http.ListenAndServe(":8080", nil)
}
```

**Python** (with `prometheus_client`):
```python
from flask import Flask, request
from prometheus_client import Counter, Histogram, generate_latest
import time

app = Flask(__name__)

# Metrics
REQUEST_COUNT = Counter(
    'http_requests_total',
    'Total HTTP requests',
    ['method', 'endpoint', 'status']
)

REQUEST_DURATION = Histogram(
    'http_request_duration_seconds',
    'HTTP request duration',
    ['method', 'endpoint']
)

ORDERS_CREATED = Counter('orders_created_total', 'Total orders created')

@app.before_request
def before_request():
    request.start_time = time.time()

@app.after_request
def after_request(response):
    duration = time.time() - request.start_time
    
    REQUEST_COUNT.labels(
        method=request.method,
        endpoint=request.path,
        status=response.status_code
    ).inc()
    
    REQUEST_DURATION.labels(
        method=request.method,
        endpoint=request.path
    ).observe(duration)
    
    return response

@app.route('/orders', methods=['POST'])
def create_order():
    # Business logic...
    ORDERS_CREATED.inc()
    return {'status': 'created'}, 201

@app.route('/metrics')
def metrics():
    return generate_latest()

if __name__ == '__main__':
    app.run(port=8080)
```

**Grafana Dashboard**:
```json
{
  "dashboard": {
    "title": "Order Service",
    "panels": [
      {
        "title": "Request Rate",
        "targets": [{
          "expr": "rate(http_requests_total[5m])"
        }]
      },
      {
        "title": "P95 Latency",
        "targets": [{
          "expr": "histogram_quantile(0.95, rate(http_request_duration_seconds_bucket[5m]))"
        }]
      },
      {
        "title": "Error Rate",
        "targets": [{
          "expr": "rate(http_requests_total{status=~\"5..\"}[5m])"
        }]
      }
    ]
  }
}
```

**Alerts** (Prometheus):
```yaml
# alerts.yml
groups:
  - name: order-service
    rules:
      - alert: HighErrorRate
        expr: rate(http_requests_total{status=~"5.."}[5m]) > 0.05
        for: 2m
        labels:
          severity: critical
        annotations:
          summary: "High error rate on order service"
          description: "Error rate is {{ $value }} (> 5%)"
      
      - alert: HighLatency
        expr: histogram_quantile(0.95, rate(http_request_duration_seconds_bucket[5m])) > 1
        for: 5m
        labels:
          severity: warning
        annotations:
          summary: "High latency on order service"
          description: "P95 latency is {{ $value }}s (> 1s)"
```

---

### 2. Distributed Tracing (Jaeger/OpenTelemetry)

**What**: Track requests across microservices to identify bottlenecks.

**Trace Example**:
```
Trace ID: abc123
│
├─ Span 1: API Gateway (100ms)
│  │
│  ├─ Span 2: Order Service (80ms)
│  │  │
│  │  ├─ Span 3: User Service (20ms)
│  │  └─ Span 4: Payment Service (40ms)
│  │     │
│  │     └─ Span 5: Database (15ms)
│  │
│  └─ Span 6: Notification Service (10ms)
```

**OpenTelemetry** (Go):
```go
package main

import (
	"context"
	"net/http"
	
	"go.opentelemetry.io/otel"
	"go.opentelemetry.io/otel/exporters/jaeger"
	"go.opentelemetry.io/otel/sdk/resource"
	sdktrace "go.opentelemetry.io/otel/sdk/trace"
	semconv "go.opentelemetry.io/otel/semconv/v1.4.0"
	"go.opentelemetry.io/otel/trace"
)

var tracer trace.Tracer

func initTracer() {
	exporter, _ := jaeger.New(jaeger.WithCollectorEndpoint(
		jaeger.WithEndpoint("http://jaeger:14268/api/traces"),
	))
	
	tp := sdktrace.NewTracerProvider(
		sdktrace.WithBatcher(exporter),
		sdktrace.WithResource(resource.NewWithAttributes(
			semconv.SchemaURL,
			semconv.ServiceNameKey.String("order-service"),
		)),
	)
	
	otel.SetTracerProvider(tp)
	tracer = tp.Tracer("order-service")
}

func createOrderHandler(w http.ResponseWriter, r *http.Request) {
	ctx := r.Context()
	
	// Start span
	ctx, span := tracer.Start(ctx, "createOrder")
	defer span.End()
	
	// Business logic with nested spans
	user := getUserInfo(ctx, "user123")
	processPayment(ctx, 100.0)
	
	span.SetAttributes(
		attribute.String("user.id", "user123"),
		attribute.Float64("order.total", 100.0),
	)
	
	w.WriteHeader(http.StatusCreated)
}

func getUserInfo(ctx context.Context, userID string) User {
	ctx, span := tracer.Start(ctx, "getUserInfo")
	defer span.End()
	
	// Call User Service with trace context propagation
	req, _ := http.NewRequestWithContext(ctx, "GET", "http://user-service/users/"+userID, nil)
	
	// Propagate trace context
	otel.GetTextMapPropagator().Inject(ctx, propagation.HeaderCarrier(req.Header))
	
	resp, _ := http.DefaultClient.Do(req)
	// ...parse response
	
	return user
}

func processPayment(ctx context.Context, amount float64) {
	ctx, span := tracer.Start(ctx, "processPayment")
	defer span.End()
	
	span.SetAttributes(attribute.Float64("payment.amount", amount))
	
	// Payment logic...
}

func main() {
	initTracer()
	
	http.HandleFunc("/orders", createOrderHandler)
	http.ListenAndServe(":8080", nil)
}
```

**Python** (OpenTelemetry):
```python
from opentelemetry import trace
from opentelemetry.exporter.jaeger.thrift import JaegerExporter
from opentelemetry.sdk.trace import TracerProvider
from opentelemetry.sdk.trace.export import BatchSpanProcessor
from opentelemetry.instrumentation.flask import FlaskInstrumentor
from opentelemetry.instrumentation.requests import RequestsInstrumentor
from flask import Flask
import requests

# Initialize tracing
trace.set_tracer_provider(TracerProvider())
jaeger_exporter = JaegerExporter(
    agent_host_name="jaeger",
    agent_port=6831,
)
trace.get_tracer_provider().add_span_processor(
    BatchSpanProcessor(jaeger_exporter)
)

tracer = trace.get_tracer(__name__)

app = Flask(__name__)

# Auto-instrument Flask and requests
FlaskInstrumentor().instrument_app(app)
RequestsInstrumentor().instrument()

@app.route('/orders', methods=['POST'])
def create_order():
    with tracer.start_as_current_span("create_order") as span:
        span.set_attribute("user.id", "user123")
        
        # Calls to other services are auto-traced
        user = requests.get("http://user-service/users/user123").json()
        
        with tracer.start_as_current_span("process_payment"):
            payment_result = process_payment(100.0)
        
        span.set_attribute("order.total", 100.0)
        
        return {'status': 'created'}, 201

if __name__ == '__main__':
    app.run(port=8080)
```

**Jaeger Deployment**:
```yaml
# docker-compose.yml
services:
  jaeger:
    image: jaegertracing/all-in-one:latest
    ports:
      - "16686:16686"  # UI
      - "14268:14268"  # Collector
      - "6831:6831/udp"  # Agent
    environment:
      COLLECTOR_ZIPKIN_HOST_PORT: ":9411"
```

**Query Traces**:
```bash
# Find slow requests
http://localhost:16686/search?service=order-service&minDuration=1s

# Find errors
http://localhost:16686/search?service=order-service&tags={"error":"true"}
```

---

### 3. Centralized Logging (ELK Stack)

**What**: Aggregate logs from all services into searchable database.

**Architecture**:
```
Services → Filebeat → Logstash → Elasticsearch → Kibana
                                       │
                                       └─ Alerting
```

**Structured Logging** (Go with Zap):
```go
package main

import (
	"go.uber.org/zap"
	"go.uber.org/zap/zapcore"
)

var logger *zap.Logger

func initLogger() {
	config := zap.NewProductionConfig()
	config.OutputPaths = []string{"/var/log/order-service.log", "stdout"}
	config.EncoderConfig.TimeKey = "timestamp"
	config.EncoderConfig.EncodeTime = zapcore.ISO8601TimeEncoder
	
	logger, _ = config.Build()
}

func createOrderHandler(w http.ResponseWriter, r *http.Request) {
	logger.Info("Creating order",
		zap.String("user_id", "user123"),
		zap.Float64("total", 100.0),
		zap.String("trace_id", getTraceID(r.Context())),
	)
	
	// Business logic...
	
	if err != nil {
		logger.Error("Failed to create order",
			zap.Error(err),
			zap.String("user_id", "user123"),
		)
		http.Error(w, "Internal error", 500)
		return
	}
	
	logger.Info("Order created successfully",
		zap.String("order_id", "order456"),
	)
	
	w.WriteHeader(http.StatusCreated)
}

func main() {
	initLogger()
	defer logger.Sync()
	
	http.HandleFunc("/orders", createOrderHandler)
	http.ListenAndServe(":8080", nil)
}
```

**Python** (structlog):
```python
import structlog
from flask import Flask, request, g
import uuid

# Configure structlog
structlog.configure(
    processors=[
        structlog.stdlib.filter_by_level,
        structlog.stdlib.add_logger_name,
        structlog.stdlib.add_log_level,
        structlog.processors.TimeStamper(fmt="iso"),
        structlog.processors.JSONRenderer()
    ],
    context_class=dict,
    logger_factory=structlog.stdlib.LoggerFactory(),
)

logger = structlog.get_logger()

app = Flask(__name__)

@app.before_request
def before_request():
    g.request_id = str(uuid.uuid4())
    g.log = logger.bind(
        request_id=g.request_id,
        method=request.method,
        path=request.path
    )

@app.route('/orders', methods=['POST'])
def create_order():
    g.log.info("creating_order", user_id="user123", total=100.0)
    
    try:
        # Business logic...
        order_id = "order456"
        
        g.log.info("order_created", order_id=order_id)
        return {'order_id': order_id}, 201
    
    except Exception as e:
        g.log.error("order_creation_failed", error=str(e), user_id="user123")
        return {'error': 'Internal error'}, 500

if __name__ == '__main__':
    app.run(port=8080)
```

**Filebeat Configuration**:
```yaml
# filebeat.yml
filebeat.inputs:
  - type: log
    enabled: true
    paths:
      - /var/log/order-service.log
    json.keys_under_root: true
    json.add_error_key: true
    fields:
      service: order-service
      environment: production

output.logstash:
  hosts: ["logstash:5044"]
```

**Logstash Pipeline**:
```ruby
# logstash.conf
input {
  beats {
    port => 5044
  }
}

filter {
  # Parse JSON logs
  json {
    source => "message"
  }
  
  # Add GeoIP for user locations
  geoip {
    source => "client_ip"
  }
}

output {
  elasticsearch {
    hosts => ["elasticsearch:9200"]
    index => "logs-%{[fields][service]}-%{+YYYY.MM.dd}"
  }
}
```

**Kibana Queries**:
```
# Find all errors in last hour
level:error AND service:order-service AND timestamp:[now-1h TO now]

# Find slow requests
duration:>1000 AND service:order-service

# Find specific user's orders
user_id:"user123" AND event:"order_created"
```

---

### SLIs, SLOs, SLAs

**SLI** (Service Level Indicator): Metric you measure
- Request latency, error rate, throughput

**SLO** (Service Level Objective): Target for SLI
- 99.9% requests < 200ms
- 99.95% success rate

**SLA** (Service Level Agreement): Contract with consequences
- 99.9% uptime or customer gets refund

**Example SLOs**:
```yaml
slos:
  - name: api-latency
    description: "95% of requests complete in < 200ms"
    sli:
      metric: http_request_duration_seconds
      threshold: 0.2
      percentile: 95
    target: 99.5
    window: 30d
  
  - name: api-availability
    description: "99.9% of requests succeed"
    sli:
      metric: http_requests_total
      error_query: 'status=~"5.."'
    target: 99.9
    window: 30d
```

**Error Budget**:
```
SLO: 99.9% success rate
Error Budget: 0.1% = 43 minutes downtime/month

If error budget exhausted:
- Freeze feature releases
- Focus on reliability
- Postmortem
```

---

### Observability Tools Comparison

| Tool | Type | Open Source | Cost | Best For |
|------|------|-------------|------|----------|
| **Prometheus** | Metrics | Yes | Free | Time-series metrics |
| **Grafana** | Visualization | Yes | Free | Dashboards |
| **Jaeger** | Tracing | Yes | Free | Distributed tracing |
| **Zipkin** | Tracing | Yes | Free | Distributed tracing (simpler) |
| **ELK Stack** | Logs | Yes | Free (self-hosted) | Centralized logging |
| **Loki** | Logs | Yes | Free | Lightweight logging |
| **OpenTelemetry** | All | Yes | Free | Vendor-neutral instrumentation |
| **Datadog** | All | No | $15-70/host/month | All-in-one, easy setup |
| **New Relic** | All | No | $25-99/user/month | APM, full-stack |
| **Dynatrace** | All | No | Enterprise pricing | AI-powered, auto-discovery |
| **Splunk** | Logs/Metrics | No | $150+/GB/month | Enterprise logging |
| **Honeycomb** | Observability | No | $100+/month | High-cardinality events |

**Recommendation**:
- **Startups**: Prometheus + Grafana + Jaeger (free, self-hosted)
- **Scale-ups**: OpenTelemetry + managed backends (Grafana Cloud, AWS X-Ray)
- **Enterprise**: Datadog or Dynatrace (comprehensive, support)

**Cost Estimation** (1000 req/sec, 10 services):
- **Self-hosted (Prometheus/Jaeger)**: $200-500/month (infrastructure)
- **Datadog**: $1500-3000/month
- **New Relic**: $2000-5000/month

---

## Security in Microservices

### Security Challenges

1. **Larger Attack Surface**: More services = more endpoints
2. **Service-to-Service Auth**: How does Order Service trust Payment Service?
3. **Data in Transit**: Network calls between services
4. **Secrets Management**: API keys, DB passwords across services
5. **API Gateway Security**: Single entry point vulnerabilities

---

### 1. Service-to-Service Authentication

#### Mutual TLS (mTLS)

**What**: Both client and server verify each other's certificates.

```
Order Service ──► (TLS Handshake) ──► Payment Service
  │                                        │
  ├─ Send client cert                     ├─ Verify client cert
  ├─ Verify server cert ◄─────────────────┴─ Send server cert
  │
  └─ Encrypted communication
```

**Implementation** (Istio Service Mesh):
```yaml
# Enable mTLS for all services
apiVersion: security.istio.io/v1beta1
kind: PeerAuthentication
metadata:
  name: default
  namespace: default
spec:
  mtls:
    mode: STRICT  # Require mTLS

---
# Authorization policy
apiVersion: security.istio.io/v1beta1
kind: AuthorizationPolicy
metadata:
  name: order-to-payment
spec:
  selector:
    matchLabels:
      app: payment-service
  action: ALLOW
  rules:
  - from:
    - source:
        principals: ["cluster.local/ns/default/sa/order-service"]
    to:
    - operation:
        methods: ["POST"]
        paths: ["/payments"]
```

**Manual mTLS** (Go):
```go
package main

import (
	"crypto/tls"
	"crypto/x509"
	"io/ioutil"
	"net/http"
)

// Server (Payment Service)
func startPaymentService() {
	// Load server cert/key
	cert, _ := tls.LoadX509KeyPair("server.crt", "server.key")
	
	// Load CA cert to verify clients
	caCert, _ := ioutil.ReadFile("ca.crt")
	caCertPool := x509.NewCertPool()
	caCertPool.AppendCertsFromPEM(caCert)
	
	tlsConfig := &tls.Config{
		Certificates: []tls.Certificate{cert},
		ClientCAs:    caCertPool,
		ClientAuth:   tls.RequireAndVerifyClientCert,
	}
	
	server := &http.Server{
		Addr:      ":8443",
		TLSConfig: tlsConfig,
	}
	
	http.HandleFunc("/payments", handlePayment)
	server.ListenAndServeTLS("", "")
}

// Client (Order Service)
func callPaymentService() {
	// Load client cert/key
	cert, _ := tls.LoadX509KeyPair("client.crt", "client.key")
	
	// Load CA cert to verify server
	caCert, _ := ioutil.ReadFile("ca.crt")
	caCertPool := x509.NewCertPool()
	caCertPool.AppendCertsFromPEM(caCert)
	
	tlsConfig := &tls.Config{
		Certificates: []tls.Certificate{cert},
		RootCAs:      caCertPool,
	}
	
	client := &http.Client{
		Transport: &http.Transport{
			TLSClientConfig: tlsConfig,
		},
	}
	
	resp, _ := client.Post("https://payment-service:8443/payments", "application/json", body)
	// Handle response...
}
```

**Generate Certificates**:
```bash
# Generate CA
openssl genrsa -out ca.key 4096
openssl req -new -x509 -key ca.key -out ca.crt -days 365

# Generate server cert
openssl genrsa -out server.key 4096
openssl req -new -key server.key -out server.csr
openssl x509 -req -in server.csr -CA ca.crt -CAkey ca.key -CAcreateserial -out server.crt -days 365

# Generate client cert
openssl genrsa -out client.key 4096
openssl req -new -key client.key -out client.csr
openssl x509 -req -in client.csr -CA ca.crt -CAkey ca.key -CAcreateserial -out client.crt -days 365
```

**Pros**:
- ✅ Strong authentication
- ✅ Encryption by default
- ✅ No application code changes (with service mesh)

**Cons**:
- ❌ Certificate management complexity
- ❌ Performance overhead

---

#### SPIFFE/SPIRE

**What**: Standard for service identity in dynamic environments (auto-rotates certs).

```
┌──────────┐
│  SPIRE   │ (Identity provider)
│  Server  │
└────┬─────┘
     │
     ├─────────────┬─────────────┐
     ▼             ▼             ▼
┌─────────┐   ┌─────────┐   ┌─────────┐
│ SPIRE   │   │ SPIRE   │   │ SPIRE   │
│ Agent 1 │   │ Agent 2 │   │ Agent 3 │
└────┬────┘   └────┬────┘   └────┬────┘
     │             │             │
     ▼             ▼             ▼
  Order Svc    Payment Svc   User Svc
```

**SPIRE Configuration**:
```hcl
# server.conf
server {
  bind_address = "0.0.0.0"
  bind_port = "8081"
  trust_domain = "example.org"
  data_dir = "/opt/spire/data/server"
}

plugins {
  NodeAttestor "k8s_psat" {
    plugin_data {
      clusters = {
        "prod-cluster" = {
          service_account_allow_list = ["default:order-service", "default:payment-service"]
        }
      }
    }
  }
}
```

**Usage** (Go):
```go
import (
	"github.com/spiffe/go-spiffe/v2/spiffeid"
	"github.com/spiffe/go-spiffe/v2/spiffetls/tlsconfig"
	"github.com/spiffe/go-spiffe/v2/workloadapi"
)

func callPaymentService() {
	ctx := context.Background()
	
	// Get X.509 source from Workload API
	source, _ := workloadapi.NewX509Source(ctx)
	defer source.Close()
	
	// Create TLS config that trusts payment service SPIFFE ID
	tlsConfig := tlsconfig.MTLSClientConfig(source, source, tlsconfig.AuthorizeID(
		spiffeid.RequireFromString("spiffe://example.org/payment-service"),
	))
	
	client := &http.Client{
		Transport: &http.Transport{
			TLSClientConfig: tlsConfig,
		},
	}
	
	resp, _ := client.Post("https://payment-service/payments", "application/json", body)
	// ...
}
```

**Pros**:
- ✅ Auto-rotating certs (short-lived)
- ✅ Dynamic service identity
- ✅ Zero-trust security

**Cons**:
- ❌ Additional infrastructure
- ❌ Learning curve

---

### 2. API Gateway Security

#### Authentication & Authorization

**JWT Validation**:
```go
package main

import (
	"github.com/golang-jwt/jwt/v4"
	"net/http"
	"strings"
)

var jwtSecret = []byte("your-secret-key")

func authMiddleware(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		authHeader := r.Header.Get("Authorization")
		if authHeader == "" {
			http.Error(w, "Missing authorization", http.StatusUnauthorized)
			return
		}
		
		tokenString := strings.TrimPrefix(authHeader, "Bearer ")
		
		token, err := jwt.Parse(tokenString, func(token *jwt.Token) (interface{}, error) {
			return jwtSecret, nil
		})
		
		if err != nil || !token.Valid {
			http.Error(w, "Invalid token", http.StatusUnauthorized)
			return
		}
		
		claims := token.Claims.(jwt.MapClaims)
		
		// Check permissions
		if !hasPermission(claims, r.URL.Path, r.Method) {
			http.Error(w, "Forbidden", http.StatusForbidden)
			return
		}
		
		// Add user context
		ctx := context.WithValue(r.Context(), "user_id", claims["user_id"])
		next.ServeHTTP(w, r.WithContext(ctx))
	})
}

func hasPermission(claims jwt.MapClaims, path, method string) bool {
	roles := claims["roles"].([]interface{})
	
	// RBAC logic
	if method == "POST" && path == "/orders" {
		return contains(roles, "customer")
	}
	
	if method == "DELETE" && path == "/users" {
		return contains(roles, "admin")
	}
	
	return false
}
```

**OAuth2 with Kong**:
```yaml
# kong.yml
_format_version: "2.1"

services:
  - name: order-service
    url: http://order-service:8080
    routes:
      - name: orders-route
        paths:
          - /orders
    plugins:
      - name: oauth2
        config:
          scopes: ["email", "profile"]
          mandatory_scope: true
          enable_client_credentials: true
```

---

#### Rate Limiting

**Token Bucket** (Redis):
```python
import redis
import time

redis_client = redis.Redis()

def rate_limit(user_id, limit=100, window=60):
    """
    Token bucket: 100 requests per minute per user
    """
    key = f"rate_limit:{user_id}"
    current_time = int(time.time())
    
    # Use Redis sorted set
    pipe = redis_client.pipeline()
    
    # Remove old entries
    pipe.zremrangebyscore(key, 0, current_time - window)
    
    # Count current requests
    pipe.zcard(key)
    
    # Add current request
    pipe.zadd(key, {current_time: current_time})
    
    # Set expiry
    pipe.expire(key, window)
    
    results = pipe.execute()
    request_count = results[1]
    
    if request_count >= limit:
        return False, 0
    
    remaining = limit - request_count - 1
    return True, remaining

# Flask middleware
@app.before_request
def check_rate_limit():
    user_id = request.headers.get('X-User-ID', 'anonymous')
    
    allowed, remaining = rate_limit(user_id)
    
    if not allowed:
        return jsonify({'error': 'Rate limit exceeded'}), 429
    
    g.rate_limit_remaining = remaining

@app.after_request
def add_rate_limit_headers(response):
    response.headers['X-RateLimit-Remaining'] = str(g.get('rate_limit_remaining', 0))
    return response
```

**Kong Rate Limiting**:
```bash
curl -X POST http://kong:8001/services/order-service/plugins \
  --data "name=rate-limiting" \
  --data "config.minute=100" \
  --data "config.policy=redis" \
  --data "config.redis_host=redis"
```

---

### 3. Secrets Management

#### HashiCorp Vault

**What**: Centralized secrets storage with encryption, rotation, and audit.

```
┌─────────────┐
│    Vault    │
│  (Secrets)  │
└──────┬──────┘
       │
       ├────────────┬────────────┐
       ▼            ▼            ▼
   Order Svc   Payment Svc   User Svc
   (DB pwd)    (API key)     (JWT secret)
```

**Vault Setup**:
```bash
# Start Vault
docker run --cap-add=IPC_LOCK -d --name=vault -p 8200:8200 vault

# Initialize
vault operator init

# Unseal (3 times with different keys)
vault operator unseal <key1>
vault operator unseal <key2>
vault operator unseal <key3>

# Login
vault login <root-token>

# Enable secrets engine
vault secrets enable -path=microservices kv-v2

# Store secrets
vault kv put microservices/order-service db_password=super_secret
vault kv put microservices/payment-service stripe_api_key=sk_live_xxx
```

**Read Secrets** (Go):
```go
package main

import (
	vault "github.com/hashicorp/vault/api"
)

func getDBPassword() string {
	config := vault.DefaultConfig()
	config.Address = "http://vault:8200"
	
	client, _ := vault.NewClient(config)
	client.SetToken(os.Getenv("VAULT_TOKEN"))
	
	secret, _ := client.Logical().Read("microservices/data/order-service")
	
	dbPassword := secret.Data["data"].(map[string]interface{})["db_password"].(string)
	return dbPassword
}

func main() {
	dbPassword := getDBPassword()
	
	db, _ := sql.Open("postgres", fmt.Sprintf(
		"user=app password=%s dbname=orderdb",
		dbPassword,
	))
	
	// Use db...
}
```

**Python**:
```python
import hvac

client = hvac.Client(url='http://vault:8200', token=os.getenv('VAULT_TOKEN'))

# Read secret
secret = client.secrets.kv.v2.read_secret_version(path='order-service', mount_point='microservices')
db_password = secret['data']['data']['db_password']

# Connect to DB
conn = psycopg2.connect(f"dbname=orderdb password={db_password}")
```

**Dynamic Secrets** (Auto-generated DB credentials):
```bash
# Enable database secrets engine
vault secrets enable database

# Configure PostgreSQL
vault write database/config/orderdb \
  plugin_name=postgresql-database-plugin \
  allowed_roles="order-service" \
  connection_url="postgresql://{{username}}:{{password}}@postgres:5432/orderdb" \
  username="vault" \
  password="vault-password"

# Create role
vault write database/roles/order-service \
  db_name=orderdb \
  creation_statements="CREATE ROLE \"{{name}}\" WITH LOGIN PASSWORD '{{password}}' VALID UNTIL '{{expiration}}'; \
    GRANT SELECT, INSERT, UPDATE ON ALL TABLES IN SCHEMA public TO \"{{name}}\";" \
  default_ttl="1h" \
  max_ttl="24h"

# Generate credentials (auto-expire in 1 hour)
vault read database/creds/order-service
```

**Kubernetes Integration**:
```yaml
apiVersion: v1
kind: ServiceAccount
metadata:
  name: order-service

---
apiVersion: apps/v1
kind: Deployment
metadata:
  name: order-service
spec:
  template:
    metadata:
      annotations:
        vault.hashicorp.com/agent-inject: "true"
        vault.hashicorp.com/role: "order-service"
        vault.hashicorp.com/agent-inject-secret-db-creds: "database/creds/order-service"
    spec:
      serviceAccountName: order-service
      containers:
      - name: order-service
        image: order-service:v1
        # Secrets injected to /vault/secrets/db-creds
```

**Pros**:
- ✅ Centralized secrets
- ✅ Encryption at rest/transit
- ✅ Audit logs
- ✅ Auto-rotation
- ✅ Dynamic credentials

**Cons**:
- ❌ Additional infrastructure
- ❌ Single point of failure (mitigate with HA)

**Alternatives**:
- **Open Source**: Sealed Secrets (Kubernetes), SOPS
- **Cloud**: AWS Secrets Manager, Azure Key Vault, GCP Secret Manager
- **Cost**: Self-hosted free, enterprise $0.30/secret/month

---

### 4. Network Security

#### Zero Trust with Service Mesh

**Principle**: Never trust, always verify (even inside network).

**Istio Policy**:
```yaml
# Deny all traffic by default
apiVersion: security.istio.io/v1beta1
kind: AuthorizationPolicy
metadata:
  name: deny-all
  namespace: default
spec:
  {}

---
# Allow specific service-to-service
apiVersion: security.istio.io/v1beta1
kind: AuthorizationPolicy
metadata:
  name: allow-order-to-payment
spec:
  selector:
    matchLabels:
      app: payment-service
  action: ALLOW
  rules:
  - from:
    - source:
        principals: ["cluster.local/ns/default/sa/order-service"]
    to:
    - operation:
        methods: ["POST"]
        paths: ["/payments"]

---
# Allow user-service to read users only
apiVersion: security.istio.io/v1beta1
kind: AuthorizationPolicy
metadata:
  name: allow-order-to-user
spec:
  selector:
    matchLabels:
      app: user-service
  action: ALLOW
  rules:
  - from:
    - source:
        principals: ["cluster.local/ns/default/sa/order-service"]
    to:
    - operation:
        methods: ["GET"]
        paths: ["/users/*"]
```

#### Network Policies (Kubernetes)

```yaml
# Deny all ingress
apiVersion: networking.k8s.io/v1
kind: NetworkPolicy
metadata:
  name: deny-all-ingress
spec:
  podSelector: {}
  policyTypes:
  - Ingress

---
# Allow Order Service → Payment Service
apiVersion: networking.k8s.io/v1
kind: NetworkPolicy
metadata:
  name: allow-order-to-payment
spec:
  podSelector:
    matchLabels:
      app: payment-service
  policyTypes:
  - Ingress
  ingress:
  - from:
    - podSelector:
        matchLabels:
          app: order-service
    ports:
    - protocol: TCP
      port: 8080
```

---

### 5. Security Best Practices Checklist

#### Service Level
- [ ] Use HTTPS/TLS for all communication
- [ ] Implement mTLS for service-to-service
- [ ] Validate all inputs (prevent injection)
- [ ] Use prepared statements for SQL
- [ ] Sanitize outputs (prevent XSS)
- [ ] Rate limit APIs
- [ ] Implement circuit breakers
- [ ] Use secrets manager (no hardcoded secrets)
- [ ] Enable audit logging
- [ ] Regular dependency updates (CVEs)

#### Infrastructure Level
- [ ] Network policies (isolate services)
- [ ] Least privilege IAM roles
- [ ] Private subnets for services
- [ ] WAF for API Gateway
- [ ] DDoS protection (Cloudflare, AWS Shield)
- [ ] Regular security scans (Trivy, Snyk)
- [ ] Encrypted storage (at rest)
- [ ] Rotate credentials regularly
- [ ] Multi-factor authentication for admins
- [ ] Disaster recovery plan

#### Code Level
- [ ] Static analysis (SonarQube, gosec)
- [ ] Dependency scanning (Dependabot)
- [ ] Secret scanning (git-secrets, trufflehog)
- [ ] Code reviews
- [ ] Threat modeling

---

### Security Tools Comparison

| Tool | Purpose | Open Source | Cost |
|------|---------|-------------|------|
| **HashiCorp Vault** | Secrets management | Yes (community) | Free / Enterprise |
| **AWS Secrets Manager** | Secrets management | No | $0.40/secret/month |
| **Istio** | Service mesh (mTLS) | Yes | Free |
| **SPIRE** | Service identity | Yes | Free |
| **OPA** | Policy engine | Yes | Free |
| **Falco** | Runtime security | Yes | Free |
| **Trivy** | Vulnerability scanning | Yes | Free |
| **Snyk** | Dependency scanning | No | $0-$500/month |
| **Cloudflare** | WAF, DDoS | No | $20-$200/month |
| **AWS WAF** | Web firewall | No | $5/rule/month + usage |

---

## Configuration Management

### Why Centralized Configuration?

**Problems with Local Config Files**:
- Config scattered across services
- Restart required for changes
- Environment-specific config duplication
- No audit trail

**Solution**: Centralized configuration server

```
┌─────────────────┐
│  Config Server  │
│  (Consul/etcd)  │
└────────┬────────┘
         │
         ├────────────┬────────────┐
         ▼            ▼            ▼
    Order Svc    Payment Svc   User Svc
    (reads config at runtime)
```

---

### 1. HashiCorp Consul

**Features**:
- Key-value store
- Service discovery
- Health checking
- Multi-datacenter

**Store Configuration**:
```bash
# Store config
consul kv put config/order-service/db_host "postgres.prod.local"
consul kv put config/order-service/db_port "5432"
consul kv put config/order-service/max_connections "100"
consul kv put config/order-service/log_level "info"

# Read config
consul kv get config/order-service/db_host
```

**Read Config** (Go):
```go
package main

import (
	"github.com/hashicorp/consul/api"
	"time"
)

type Config struct {
	DBHost         string
	DBPort         string
	MaxConnections int
	LogLevel       string
}

func loadConfig() (*Config, error) {
	client, _ := api.NewClient(api.DefaultConfig())
	kv := client.KV()
	
	cfg := &Config{}
	
	// Read all config keys
	pairs, _, err := kv.List("config/order-service/", nil)
	if err != nil {
		return nil, err
	}
	
	for _, pair := range pairs {
		switch pair.Key {
		case "config/order-service/db_host":
			cfg.DBHost = string(pair.Value)
		case "config/order-service/db_port":
			cfg.DBPort = string(pair.Value)
		case "config/order-service/log_level":
			cfg.LogLevel = string(pair.Value)
		}
	}
	
	return cfg, nil
}

// Watch for config changes
func watchConfig(updateChan chan *Config) {
	client, _ := api.NewClient(api.DefaultConfig())
	kv := client.KV()
	
	var lastIndex uint64
	
	for {
		pairs, meta, err := kv.List("config/order-service/", &api.QueryOptions{
			WaitIndex: lastIndex,
		})
		
		if err != nil {
			time.Sleep(5 * time.Second)
			continue
		}
		
		if meta.LastIndex > lastIndex {
			// Config changed
			cfg := parseConfig(pairs)
			updateChan <- cfg
			lastIndex = meta.LastIndex
		}
	}
}

func main() {
	// Initial load
	config, _ := loadConfig()
	
	// Watch for changes
	configChan := make(chan *Config)
	go watchConfig(configChan)
	
	for {
		select {
		case newConfig := <-configChan:
			// Reload configuration dynamically
			config = newConfig
			logger.SetLevel(config.LogLevel)
			db.SetMaxConnections(config.MaxConnections)
			log.Println("Configuration reloaded")
		}
	}
}
```

**Python** (with `python-consul`):
```python
import consul
import json
import time
from threading import Thread

class ConfigManager:
    def __init__(self, prefix="config/order-service/"):
        self.consul_client = consul.Consul()
        self.prefix = prefix
        self.config = {}
        self.callbacks = []
    
    def load(self):
        """Load all configuration"""
        index, data = self.consul_client.kv.get(self.prefix, recurse=True)
        
        if data:
            for item in data:
                key = item['Key'].replace(self.prefix, '')
                value = item['Value'].decode('utf-8')
                self.config[key] = value
        
        return self.config
    
    def get(self, key, default=None):
        """Get config value"""
        return self.config.get(key, default)
    
    def watch(self):
        """Watch for configuration changes"""
        index = None
        
        while True:
            index, data = self.consul_client.kv.get(
                self.prefix,
                recurse=True,
                index=index
            )
            
            if data:
                old_config = self.config.copy()
                self.load()
                
                if old_config != self.config:
                    print("Configuration changed!")
                    for callback in self.callbacks:
                        callback(self.config)
            
            time.sleep(1)
    
    def on_change(self, callback):
        """Register callback for config changes"""
        self.callbacks.append(callback)

# Usage
config_manager = ConfigManager()
config_manager.load()

def config_changed(new_config):
    # Reload app configuration
    app.config['DB_HOST'] = new_config.get('db_host')
    app.config['LOG_LEVEL'] = new_config.get('log_level')
    logging.setLevel(new_config.get('log_level', 'INFO'))

config_manager.on_change(config_changed)

# Start watching in background
watch_thread = Thread(target=config_manager.watch, daemon=True)
watch_thread.start()

# Use config
db_host = config_manager.get('db_host')
```

---

### 2. etcd

**What**: Distributed key-value store (used by Kubernetes).

**Store Config**:
```bash
# Put values
etcdctl put /config/order-service/db_host "postgres.prod.local"
etcdctl put /config/order-service/db_port "5432"

# Get values
etcdctl get /config/order-service/db_host

# Get with prefix
etcdctl get /config/order-service/ --prefix
```

**Read Config** (Go):
```go
package main

import (
	"context"
	"go.etcd.io/etcd/client/v3"
	"time"
)

func loadConfigFromEtcd() (map[string]string, error) {
	cli, err := clientv3.New(clientv3.Config{
		Endpoints:   []string{"localhost:2379"},
		DialTimeout: 5 * time.Second,
	})
	if err != nil {
		return nil, err
	}
	defer cli.Close()
	
	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()
	
	resp, err := cli.Get(ctx, "/config/order-service/", clientv3.WithPrefix())
	if err != nil {
		return nil, err
	}
	
	config := make(map[string]string)
	for _, kv := range resp.Kvs {
		config[string(kv.Key)] = string(kv.Value)
	}
	
	return config, nil
}

// Watch for changes
func watchEtcdConfig(updateChan chan map[string]string) {
	cli, _ := clientv3.New(clientv3.Config{
		Endpoints: []string{"localhost:2379"},
	})
	defer cli.Close()
	
	watchChan := cli.Watch(context.Background(), "/config/order-service/", clientv3.WithPrefix())
	
	for watchResp := range watchChan {
		for range watchResp.Events {
			// Config changed
			config, _ := loadConfigFromEtcd()
			updateChan <- config
		}
	}
}
```

---

### 3. Spring Cloud Config

**What**: Configuration server for Spring Boot (supports Git backend).

**Config Repository** (Git):
```yaml
# order-service-prod.yml
server:
  port: 8080

spring:
  datasource:
    url: jdbc:postgresql://postgres.prod:5432/orderdb
    username: ${DB_USER}
    password: ${DB_PASSWORD}
    hikari:
      maximum-pool-size: 20

logging:
  level:
    root: INFO
    com.example: DEBUG

feature-flags:
  new-checkout: true
  loyalty-program: false
```

**Config Server**:
```java
@SpringBootApplication
@EnableConfigServer
public class ConfigServerApplication {
    public static void main(String[] args) {
        SpringApplication.run(ConfigServerApplication.class, args);
    }
}
```

```yaml
# application.yml
server:
  port: 8888

spring:
  cloud:
    config:
      server:
        git:
          uri: https://github.com/myorg/config-repo
          default-label: main
          search-paths: '{application}'
```

**Client** (Order Service):
```yaml
# bootstrap.yml
spring:
  application:
    name: order-service
  cloud:
    config:
      uri: http://config-server:8888
      fail-fast: true
```

```java
@RestController
@RefreshScope  // Allows dynamic refresh
public class OrderController {
    
    @Value("${feature-flags.new-checkout}")
    private boolean newCheckoutEnabled;
    
    @PostMapping("/orders")
    public Order createOrder(@RequestBody OrderRequest request) {
        if (newCheckoutEnabled) {
            return newCheckoutFlow(request);
        } else {
            return legacyCheckoutFlow(request);
        }
    }
}
```

**Refresh Config** (without restart):
```bash
# Trigger refresh endpoint
curl -X POST http://order-service:8080/actuator/refresh
```

---

### 4. Feature Flags with Unleash

**Why**: Decouple deployment from feature release.

**Unleash Server** (self-hosted):
```bash
docker run -p 4242:4242 \
  -e DATABASE_URL=postgres://unleash:password@postgres/unleash \
  unleashorg/unleash-server
```

**Create Feature Flag** (UI or API):
```bash
curl -X POST http://unleash:4242/api/admin/projects/default/features \
  -H "Authorization: Bearer admin-token" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "new-checkout-flow",
    "description": "New checkout experience",
    "type": "release",
    "enabled": true,
    "strategies": [
      {
        "name": "flexibleRollout",
        "parameters": {
          "rollout": "25",
          "stickiness": "userId"
        }
      }
    ]
  }'
```

**Use Feature Flag** (Python):
```python
from UnleashClient import UnleashClient

client = UnleashClient(
    url="http://unleash:4242/api",
    app_name="order-service",
    custom_headers={'Authorization': 'Bearer client-token'}
)
client.initialize_client()

@app.route('/orders', methods=['POST'])
def create_order():
    user_id = request.json['user_id']
    context = {"userId": user_id}
    
    if client.is_enabled("new-checkout-flow", context):
        return new_checkout_flow()
    else:
        return legacy_checkout_flow()
```

**Go**:
```go
import unleash "github.com/Unleash/unleash-client-go/v3"

func init() {
	unleash.Initialize(
		unleash.WithUrl("http://unleash:4242/api"),
		unleash.WithAppName("order-service"),
		unleash.WithCustomHeaders(http.Header{"Authorization": {"Bearer client-token"}}),
	)
}

func createOrder(w http.ResponseWriter, r *http.Request) {
	userID := r.Header.Get("X-User-ID")
	
	ctx := context.WithValue(r.Context(), unleash.ContextKey, &unleash.Context{
		UserId: userID,
	})
	
	if unleash.IsEnabled("new-checkout-flow", unleash.WithContext(ctx)) {
		newCheckoutFlow(w, r)
	} else {
		legacyCheckoutFlow(w, r)
	}
}
```

**Gradual Rollout**:
```json
{
  "strategies": [
    {
      "name": "flexibleRollout",
      "parameters": {
        "rollout": "10",
        "stickiness": "userId"
      }
    }
  ]
}
```

**Targeting Specific Users**:
```json
{
  "strategies": [
    {
      "name": "userWithId",
      "parameters": {
        "userIds": "user123,user456,user789"
      }
    }
  ]
}
```

---

### Configuration Management Comparison

| Tool | Type | Open Source | Dynamic Reload | Cost | Best For |
|------|------|-------------|----------------|------|----------|
| **Consul** | KV Store | Yes | Yes | Free | Service discovery + config |
| **etcd** | KV Store | Yes | Yes | Free | Kubernetes environments |
| **Spring Cloud Config** | Config Server | Yes | Yes (with refresh) | Free | Spring Boot apps |
| **Unleash** | Feature Flags | Yes | Yes | Free (self-hosted) | Feature toggling |
| **LaunchDarkly** | Feature Flags | No | Yes | $50-500/month | Enterprise features |
| **AWS AppConfig** | Config + Flags | No | Yes | $0.0008/config request | AWS users |
| **ConfigCat** | Feature Flags | No | Yes | $15-200/month | Simple feature flags |

**Recommendation**:
- **Polyglot services**: Consul or etcd
- **Spring Boot**: Spring Cloud Config
- **Feature flags**: Unleash (open source) or LaunchDarkly (enterprise)
- **AWS-heavy**: AWS AppConfig

---

## Data Management Patterns

### Challenges

1. **No ACID Transactions** across services
2. **Data Duplication**: Each service owns its DB
3. **Joins Across Services**: No SQL JOINs
4. **Consistency**: Eventual vs Immediate

---

### 1. Eventual Consistency

**Accept**: Data will be consistent eventually, not immediately.

**Example**: Order created → Payment processed → Inventory reserved
- All happen asynchronously via events
- Short window where states are inconsistent

**Implementation**:
```python
# Order Service
def create_order(user_id, items):
    order = {
        'user_id': user_id,
        'items': items,
        'status': 'pending_payment',  # Not 'completed' yet
        'created_at': datetime.utcnow()
    }
    
    db.orders.insert_one(order)
    
    # Publish event
    publish_event('OrderCreated', {
        'order_id': str(order['_id']),
        'total': calculate_total(items)
    })
    
    return order

# Payment Service (eventually updates order status)
def handle_order_created(event):
    payment = process_payment(event['total'])
    
    if payment['success']:
        publish_event('PaymentCompleted', {
            'order_id': event['order_id']
        })

# Order Service (updates status eventually)
def handle_payment_completed(event):
    db.orders.update_one(
        {'_id': ObjectId(event['order_id'])},
        {'$set': {'status': 'completed'}}
    )
```

**When to Use**:
- ✅ Non-critical timing (order history, notifications)
- ✅ High availability more important than consistency
- ✅ Can tolerate temporary inconsistency

**When NOT to Use**:
- ❌ Financial transactions (need immediate consistency)
- ❌ Inventory (overselling risk)

---

### 2. Data Replication

**Pattern**: Replicate subset of data to other services.

```
User Service (source of truth)
├─ User DB (master)
│
└─ Publishes UserCreated, UserUpdated events
    │
    ├─► Order Service: Copies user.name, user.email (for denormalization)
    └─► Analytics Service: Copies full user data
```

**Implementation**:
```python
# User Service (publishes changes)
def update_user(user_id, updates):
    user = db.users.find_one_and_update(
        {'_id': user_id},
        {'$set': updates},
        return_document=True
    )
    
    # Publish event
    publish_event('UserUpdated', {
        'user_id': str(user['_id']),
        'name': user['name'],
        'email': user['email']
    })
    
    return user

# Order Service (replicates user data)
def handle_user_updated(event):
    # Update denormalized user data in orders
    db.orders.update_many(
        {'user_id': event['user_id']},
        {'$set': {
            'user_name': event['name'],
            'user_email': event['email']
        }}
    )
```

**Pros**:
- ✅ Fast reads (no cross-service calls)
- ✅ Service independence

**Cons**:
- ❌ Data duplication
- ❌ Consistency lag
- ❌ Storage overhead

---

### 3. API Composition (Join Pattern)

**Pattern**: Make multiple API calls and combine results.

```python
@app.route('/orders/<order_id>/details')
def get_order_details(order_id):
    # Get order from Order Service
    order = db.orders.find_one({'_id': ObjectId(order_id)})
    
    # Get user from User Service
    user_response = requests.get(f"http://user-service/users/{order['user_id']}")
    user = user_response.json()
    
    # Get product details from Product Service
    product_ids = [item['product_id'] for item in order['items']]
    products_response = requests.post(
        "http://product-service/products/batch",
        json={'ids': product_ids}
    )
    products = {p['id']: p for p in products_response.json()}
    
    # Combine
    return {
        'order_id': str(order['_id']),
        'status': order['status'],
        'user': {
            'name': user['name'],
            'email': user['email']
        },
        'items': [
            {
                'product_name': products[item['product_id']]['name'],
                'quantity': item['quantity'],
                'price': products[item['product_id']]['price']
            }
            for item in order['items']
        ],
        'total': order['total']
    }
```

**Pros**:
- ✅ No data duplication
- ✅ Always fresh data

**Cons**:
- ❌ Multiple network calls (latency)
- ❌ Cascading failures
- ❌ Complex error handling

**Optimization** (parallel calls):
```python
from concurrent.futures import ThreadPoolExecutor

def get_order_details(order_id):
    order = db.orders.find_one({'_id': ObjectId(order_id)})
    
    with ThreadPoolExecutor(max_workers=3) as executor:
        # Parallel API calls
        user_future = executor.submit(
            requests.get, f"http://user-service/users/{order['user_id']}"
        )
        products_future = executor.submit(
            requests.post, "http://product-service/products/batch",
            json={'ids': [item['product_id'] for item in order['items']]}
        )
        
        user = user_future.result().json()
        products = {p['id']: p for p in products_future.result().json()}
    
    # Combine...
```

---

### 4. CQRS (Covered Earlier)

**Separate read and write databases.**

---

### 5. Sharding

**Pattern**: Split data across multiple databases by key (e.g., user_id).

```
Users 0-999     → DB Shard 1
Users 1000-1999 → DB Shard 2
Users 2000-2999 → DB Shard 3
```

**Implementation**:
```python
import hashlib

def get_shard(user_id, num_shards=4):
    """Hash-based sharding"""
    hash_value = int(hashlib.md5(user_id.encode()).hexdigest(), 16)
    return hash_value % num_shards

def get_db_connection(user_id):
    shard_id = get_shard(user_id)
    
    db_hosts = {
        0: "shard0.db.local",
        1: "shard1.db.local",
        2: "shard2.db.local",
        3: "shard3.db.local"
    }
    
    return psycopg2.connect(f"host={db_hosts[shard_id]} dbname=userdb")

def get_user(user_id):
    conn = get_db_connection(user_id)
    cur = conn.cursor()
    cur.execute("SELECT * FROM users WHERE id = %s", (user_id,))
    return cur.fetchone()

def create_user(user_id, name, email):
    conn = get_db_connection(user_id)
    cur = conn.cursor()
    cur.execute(
        "INSERT INTO users (id, name, email) VALUES (%s, %s, %s)",
        (user_id, name, email)
    )
    conn.commit()
```

**Pros**:
- ✅ Horizontal scalability
- ✅ Load distribution

**Cons**:
- ❌ Complex queries across shards
- ❌ Rebalancing when adding shards

---

### 6. Multi-Region / Multi-Datacenter

**Pattern**: Replicate data across regions for low latency and disaster recovery.

```
┌──────────────┐        ┌──────────────┐
│  US-East     │ ◄────► │  EU-West     │
│  (Primary)   │        │  (Replica)   │
└──────────────┘        └──────────────┘
       │                       │
       ▼                       ▼
   User DB (master)      User DB (read replica)
```

**PostgreSQL Read Replicas**:
```python
class DBConnectionPool:
    def __init__(self):
        self.master = psycopg2.connect("host=master.db dbname=userdb")
        self.replicas = [
            psycopg2.connect("host=replica1.db dbname=userdb"),
            psycopg2.connect("host=replica2.db dbname=userdb"),
            psycopg2.connect("host=replica3.db dbname=userdb")
        ]
    
    def get_write_connection(self):
        return self.master
    
    def get_read_connection(self):
        # Round-robin across replicas
        return random.choice(self.replicas)

db_pool = DBConnectionPool()

def create_user(name, email):
    # Write to master
    conn = db_pool.get_write_connection()
    cur = conn.cursor()
    cur.execute("INSERT INTO users (name, email) VALUES (%s, %s)", (name, email))
    conn.commit()

def get_user(user_id):
    # Read from replica (eventual consistency)
    conn = db_pool.get_read_connection()
    cur = conn.cursor()
    cur.execute("SELECT * FROM users WHERE id = %s", (user_id,))
    return cur.fetchone()
```

**Multi-Master** (CockroachDB, Cassandra):
```python
from cassandra.cluster import Cluster

cluster = Cluster(['us-east', 'eu-west', 'ap-south'])
session = cluster.connect('users')

# Writes go to nearest datacenter, replicate globally
session.execute("""
    INSERT INTO users (id, name, email)
    VALUES (uuid(), %s, %s)
""", (name, email))

# Reads from nearest datacenter
rows = session.execute("SELECT * FROM users WHERE id = %s", (user_id,))
```

**Replication Lag Handling**:
```python
def create_user(name, email):
    # Write to master
    user_id = db.insert_user(name, email)
    
    # Tag request with timestamp
    cache.set(f"user:{user_id}:write_time", time.time(), ex=60)
    
    return user_id

def get_user(user_id, consistency='eventual'):
    if consistency == 'strong':
        # Read from master (slower but consistent)
        return master_db.get_user(user_id)
    else:
        # Check if recently written
        write_time = cache.get(f"user:{user_id}:write_time")
        
        if write_time and (time.time() - write_time) < 5:
            # Too recent, read from master
            return master_db.get_user(user_id)
        else:
            # Read from replica
            return replica_db.get_user(user_id)
```

---

### 7. Caching Strategies

**Pattern**: Cache frequently accessed data to reduce DB load and latency.

#### Cache-Aside (Lazy Loading)

```python
import redis

redis_client = redis.Redis()

def get_user(user_id):
    # Check cache first
    cached = redis_client.get(f"user:{user_id}")
    if cached:
        return json.loads(cached)
    
    # Cache miss - query DB
    user = db.users.find_one({'_id': user_id})
    
    # Store in cache
    redis_client.setex(
        f"user:{user_id}",
        3600,  # TTL: 1 hour
        json.dumps(user)
    )
    
    return user

def update_user(user_id, updates):
    # Update DB
    user = db.users.find_one_and_update(
        {'_id': user_id},
        {'$set': updates},
        return_document=True
    )
    
    # Invalidate cache
    redis_client.delete(f"user:{user_id}")
    
    return user
```

#### Write-Through Cache

```python
def update_user(user_id, updates):
    # Update DB
    user = db.users.find_one_and_update(
        {'_id': user_id},
        {'$set': updates},
        return_document=True
    )
    
    # Update cache immediately
    redis_client.setex(
        f"user:{user_id}",
        3600,
        json.dumps(user)
    )
    
    return user
```

#### Cache Warming

```python
def warm_cache():
    """Preload hot data into cache"""
    # Get top 1000 popular products
    hot_products = db.products.find().sort('views', -1).limit(1000)
    
    for product in hot_products:
        redis_client.setex(
            f"product:{product['_id']}",
            7200,
            json.dumps(product)
        )
```

---

### Data Management Best Practices

1. **Use Events for Cross-Service Data Sync**
2. **Denormalize Carefully** (only what's needed)
3. **Implement Idempotency** (retry-safe operations)
4. **Version Data Schemas** (backward compatibility)
5. **Monitor Replication Lag**
6. **Cache Invalidation Strategy** (clear on updates)
7. **Implement Data Retention Policies** (GDPR, cost)

---

## Testing Microservices

### Testing Pyramid

```
         ╱╲
        ╱  ╲
       ╱ E2E ╲          (Few, slow, expensive)
      ╱────────╲
     ╱          ╲
    ╱ Integration╲       (Moderate)
   ╱──────────────╲
  ╱                ╲
 ╱  Unit Tests     ╲    (Many, fast, cheap)
╱──────────────────╲
```

---

### 1. Unit Testing

**Test**: Individual functions, isolated from dependencies.

**Go Example**:
```go
// order_service.go
package main

type OrderService struct {
	db            Database
	paymentClient PaymentClient
}

func (s *OrderService) CreateOrder(userID string, items []Item) (*Order, error) {
	// Validate
	if len(items) == 0 {
		return nil, errors.New("empty order")
	}
	
	total := calculateTotal(items)
	
	// Create order
	order := &Order{
		ID:     uuid.New().String(),
		UserID: userID,
		Items:  items,
		Total:  total,
		Status: "pending",
	}
	
	err := s.db.Insert(order)
	if err != nil {
		return nil, err
	}
	
	return order, nil
}

// order_service_test.go
package main

import (
	"testing"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/mock"
)

// Mock Database
type MockDatabase struct {
	mock.Mock
}

func (m *MockDatabase) Insert(order *Order) error {
	args := m.Called(order)
	return args.Error(0)
}

func TestCreateOrder_Success(t *testing.T) {
	// Setup
	mockDB := new(MockDatabase)
	mockDB.On("Insert", mock.Anything).Return(nil)
	
	service := &OrderService{db: mockDB}
	
	// Execute
	order, err := service.CreateOrder("user123", []Item{
		{ProductID: "prod1", Quantity: 2, Price: 10.0},
	})
	
	// Assert
	assert.NoError(t, err)
	assert.NotNil(t, order)
	assert.Equal(t, "user123", order.UserID)
	assert.Equal(t, 20.0, order.Total)
	assert.Equal(t, "pending", order.Status)
	
	mockDB.AssertExpectations(t)
}

func TestCreateOrder_EmptyItems(t *testing.T) {
	service := &OrderService{}
	
	order, err := service.CreateOrder("user123", []Item{})
	
	assert.Error(t, err)
	assert.Nil(t, order)
	assert.Equal(t, "empty order", err.Error())
}
```

**Python Example**:
```python
# order_service.py
class OrderService:
    def __init__(self, db, payment_client):
        self.db = db
        self.payment_client = payment_client
    
    def create_order(self, user_id, items):
        if not items:
            raise ValueError("Empty order")
        
        total = sum(item['price'] * item['quantity'] for item in items)
        
        order = {
            'id': str(uuid.uuid4()),
            'user_id': user_id,
            'items': items,
            'total': total,
            'status': 'pending'
        }
        
        self.db.insert(order)
        return order

# test_order_service.py
import pytest
from unittest.mock import Mock, MagicMock

def test_create_order_success():
    # Setup
    mock_db = Mock()
    mock_payment = Mock()
    service = OrderService(mock_db, mock_payment)
    
    # Execute
    order = service.create_order('user123', [
        {'product_id': 'prod1', 'quantity': 2, 'price': 10.0}
    ])
    
    # Assert
    assert order['user_id'] == 'user123'
    assert order['total'] == 20.0
    assert order['status'] == 'pending'
    mock_db.insert.assert_called_once()

def test_create_order_empty_items():
    service = OrderService(Mock(), Mock())
    
    with pytest.raises(ValueError, match="Empty order"):
        service.create_order('user123', [])
```

**Coverage**:
```bash
# Go
go test -cover
go test -coverprofile=coverage.out
go tool cover -html=coverage.out

# Python
pytest --cov=order_service --cov-report=html
```

---

### 2. Integration Testing

**Test**: Service interactions with real dependencies (DB, message queue).

**Testcontainers** (Go):
```go
package main

import (
	"context"
	"testing"
	
	"github.com/testcontainers/testcontainers-go"
	"github.com/testcontainers/testcontainers-go/wait"
)

func TestOrderServiceIntegration(t *testing.T) {
	ctx := context.Background()
	
	// Start PostgreSQL container
	postgresReq := testcontainers.ContainerRequest{
		Image:        "postgres:13",
		ExposedPorts: []string{"5432/tcp"},
		Env: map[string]string{
			"POSTGRES_PASSWORD": "test",
			"POSTGRES_DB":       "orderdb",
		},
		WaitingFor: wait.ForLog("database system is ready"),
	}
	
	postgresContainer, _ := testcontainers.GenericContainer(ctx, testcontainers.GenericContainerRequest{
		ContainerRequest: postgresReq,
		Started:          true,
	})
	defer postgresContainer.Terminate(ctx)
	
	// Get connection details
	host, _ := postgresContainer.Host(ctx)
	port, _ := postgresContainer.MappedPort(ctx, "5432")
	
	// Connect to DB
	db, _ := sql.Open("postgres", fmt.Sprintf(
		"host=%s port=%s user=postgres password=test dbname=orderdb sslmode=disable",
		host, port.Port(),
	))
	defer db.Close()
	
	// Run migrations
	db.Exec(`CREATE TABLE orders (
		id TEXT PRIMARY KEY,
		user_id TEXT,
		total DECIMAL,
		status TEXT
	)`)
	
	// Test service with real DB
	service := &OrderService{db: &PostgresDB{conn: db}}
	
	order, err := service.CreateOrder("user123", []Item{
		{ProductID: "prod1", Quantity: 2, Price: 10.0},
	})
	
	assert.NoError(t, err)
	
	// Verify in DB
	var count int
	db.QueryRow("SELECT COUNT(*) FROM orders WHERE id = $1", order.ID).Scan(&count)
	assert.Equal(t, 1, count)
}
```

**Python** (with Docker Compose):
```python
# docker-compose.test.yml
version: '3.8'
services:
  postgres:
    image: postgres:13
    environment:
      POSTGRES_PASSWORD: test
      POSTGRES_DB: orderdb
    ports:
      - "5432:5432"
  
  redis:
    image: redis:6
    ports:
      - "6379:6379"

# test_integration.py
import pytest
import psycopg2
import redis
import subprocess

@pytest.fixture(scope="session", autouse=True)
def setup_infrastructure():
    # Start containers
    subprocess.run(["docker-compose", "-f", "docker-compose.test.yml", "up", "-d"])
    
    # Wait for services
    time.sleep(5)
    
    yield
    
    # Teardown
    subprocess.run(["docker-compose", "-f", "docker-compose.test.yml", "down"])

def test_create_order_with_real_db():
    # Connect to real Postgres
    conn = psycopg2.connect("host=localhost dbname=orderdb user=postgres password=test")
    
    # Create service with real dependencies
    db = PostgresDB(conn)
    cache = redis.Redis(host='localhost')
    service = OrderService(db, cache)
    
    # Test
    order = service.create_order('user123', [
        {'product_id': 'prod1', 'quantity': 2, 'price': 10.0}
    ])
    
    # Verify
    cur = conn.cursor()
    cur.execute("SELECT * FROM orders WHERE id = %s", (order['id'],))
    row = cur.fetchone()
    
    assert row is not None
    assert row[1] == 'user123'  # user_id
```

---

### 3. Contract Testing (Pact)

**Problem**: Order Service expects `GET /users/{id}` returns `{id, name, email}`.
User Service changes response to `{id, full_name, email}`. Order Service breaks!

**Solution**: Define contracts between services and test both sides.

**Provider** (User Service):
```python
# test_user_service_contract.py
from pact import Provider

provider = Provider('UserService')

# Define expected interactions
provider.setup() \
    .given('user exists') \
    .upon_receiving('a request for user details') \
    .with_request('GET', '/users/user123') \
    .will_respond_with(200, body={
        'id': 'user123',
        'name': 'John Doe',
        'email': 'john@example.com'
    })

# Verify provider honors contract
provider.verify()
```

**Consumer** (Order Service):
```python
# test_order_service_contract.py
from pact import Consumer, Provider

pact = Consumer('OrderService').has_pact_with(Provider('UserService'))

pact.given('user exists') \
    .upon_receiving('a request for user details') \
    .with_request('GET', '/users/user123') \
    .will_respond_with(200, body={
        'id': 'user123',
        'name': 'John Doe',
        'email': 'john@example.com'
    })

with pact:
    # Test Order Service with mock User Service
    user = user_client.get_user('user123')
    assert user['name'] == 'John Doe'
```

**Pact Broker** (stores contracts):
```bash
docker run -p 9292:9292 \
  -e PACT_BROKER_DATABASE_URL=postgres://user:pass@postgres/pact \
  pactfoundation/pact-broker

# Publish contract
pact-broker publish ./pacts --broker-base-url=http://localhost:9292
```

---

### 4. End-to-End Testing

**Test**: Entire workflow across all services.

**Test Scenario**: Create order → Process payment → Reserve inventory → Send notification

```python
import requests
import time

def test_order_flow_e2e():
    base_url = "http://api-gateway:8080"
    
    # 1. Create user
    user_response = requests.post(f"{base_url}/users", json={
        'name': 'Test User',
        'email': 'test@example.com'
    })
    user_id = user_response.json()['id']
    
    # 2. Create order
    order_response = requests.post(f"{base_url}/orders", json={
        'user_id': user_id,
        'items': [
            {'product_id': 'prod123', 'quantity': 2}
        ]
    }, headers={'Authorization': 'Bearer test-token'})
    
    assert order_response.status_code == 201
    order_id = order_response.json()['order_id']
    
    # 3. Wait for async processing (payment, inventory)
    time.sleep(5)
    
    # 4. Verify order status
    order_status = requests.get(f"{base_url}/orders/{order_id}").json()
    assert order_status['status'] == 'completed'
    
    # 5. Verify inventory reduced
    inventory = requests.get(f"{base_url}/inventory/prod123").json()
    assert inventory['quantity'] < 100  # Assuming starting quantity was 100
    
    # 6. Verify notification sent (check logs or mock email service)
    notifications = requests.get(f"{base_url}/notifications/user/{user_id}").json()
    assert any(n['type'] == 'order_confirmation' for n in notifications)
```

**With Playwright** (UI testing):
```python
from playwright.sync_api import sync_playwright

def test_order_flow_ui():
    with sync_playwright() as p:
        browser = p.chromium.launch()
        page = browser.new_page()
        
        # Login
        page.goto("http://localhost:3000/login")
        page.fill('#email', 'test@example.com')
        page.fill('#password', 'password123')
        page.click('#login-btn')
        
        # Add to cart
        page.goto("http://localhost:3000/products/prod123")
        page.click('#add-to-cart')
        
        # Checkout
        page.goto("http://localhost:3000/cart")
        page.click('#checkout-btn')
        page.fill('#card-number', '4111111111111111')
        page.click('#place-order')
        
        # Verify success
        page.wait_for_selector('.order-success')
        assert 'Order confirmed' in page.inner_text('.order-success')
        
        browser.close()
```

---

### 5. Load Testing

**Test**: Performance under load.

**Locust** (Python):
```python
# locustfile.py
from locust import HttpUser, task, between

class OrderServiceUser(HttpUser):
    wait_time = between(1, 3)
    
    def on_start(self):
        # Login
        response = self.client.post("/auth/login", json={
            'email': 'test@example.com',
            'password': 'password123'
        })
        self.token = response.json()['token']
    
    @task(3)  # Weight: 3x more frequent
    def view_products(self):
        self.client.get("/products", headers={
            'Authorization': f'Bearer {self.token}'
        })
    
    @task(1)
    def create_order(self):
        self.client.post("/orders", json={
            'items': [
                {'product_id': 'prod123', 'quantity': 1}
            ]
        }, headers={
            'Authorization': f'Bearer {self.token}'
        })

# Run: locust -f locustfile.py --host=http://localhost:8080
```

**k6** (JavaScript):
```javascript
// load-test.js
import http from 'k6/http';
import { check, sleep } from 'k6';

export let options = {
  stages: [
    { duration: '2m', target: 100 }, // Ramp up to 100 users
    { duration: '5m', target: 100 }, // Stay at 100 users
    { duration: '2m', target: 200 }, // Ramp up to 200 users
    { duration: '5m', target: 200 }, // Stay at 200 users
    { duration: '2m', target: 0 },   // Ramp down
  ],
  thresholds: {
    http_req_duration: ['p(95)<500'], // 95% requests < 500ms
    http_req_failed: ['rate<0.01'],   // Error rate < 1%
  },
};

export default function () {
  // Login
  let loginRes = http.post('http://api-gateway/auth/login', JSON.stringify({
    email: 'test@example.com',
    password: 'password123'
  }), {
    headers: { 'Content-Type': 'application/json' },
  });
  
  check(loginRes, {
    'login successful': (r) => r.status === 200,
  });
  
  let token = loginRes.json('token');
  
  // Create order
  let orderRes = http.post('http://api-gateway/orders', JSON.stringify({
    items: [{ product_id: 'prod123', quantity: 1 }]
  }), {
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
  });
  
  check(orderRes, {
    'order created': (r) => r.status === 201,
    'response time OK': (r) => r.timings.duration < 500,
  });
  
  sleep(1);
}

// Run: k6 run load-test.js
```

---

### 6. Chaos Testing

**Test**: Resilience to failures.

**Chaos Monkey** (Netflix):
```bash
# Randomly terminate instances
chaos-monkey --cluster=production --probability=0.1
```

**Chaos Mesh** (Kubernetes):
```yaml
apiVersion: chaos-mesh.org/v1alpha1
kind: PodChaos
metadata:
  name: pod-kill-example
spec:
  action: pod-kill
  mode: one
  selector:
    namespaces:
      - default
    labelSelectors:
      app: order-service
  scheduler:
    cron: '@every 10m'

---
# Network delay
apiVersion: chaos-mesh.org/v1alpha1
kind: NetworkChaos
metadata:
  name: network-delay
spec:
  action: delay
  mode: all
  selector:
    namespaces:
      - default
    labelSelectors:
      app: payment-service
  delay:
    latency: '500ms'
    jitter: '100ms'
  duration: '5m'
```

**Manual Chaos Testing**:
```bash
# Kill service
kubectl delete pod -l app=order-service --force

# Simulate network partition
iptables -A OUTPUT -p tcp --dport 5432 -j DROP

# Exhaust resources
stress --cpu 8 --io 4 --vm 2 --vm-bytes 1G --timeout 60s
```

---

### Testing Best Practices

1. **Test Pyramid**: More unit tests, fewer E2E tests
2. **Test Data Management**: Use fixtures, factories
3. **Idempotent Tests**: Can run multiple times
4. **Parallel Execution**: Speed up test suite
5. **Contract Testing**: Prevent breaking changes
6. **Continuous Testing**: Run on every commit
7. **Monitor Test Flakiness**: Fix flaky tests
8. **Performance Benchmarks**: Track regression

---

## Performance & Scalability

### Performance Challenges

1. **Network Latency**: Service-to-service calls
2. **Database Bottlenecks**: Slow queries, connection limits
3. **Resource Contention**: CPU, memory exhaustion
4. **Serialization Overhead**: JSON parsing
5. **N+1 Query Problem**: Multiple API calls in loops

---

### 1. Load Balancing

**Client-Side** (Service discovers instances, picks one):
```go
package main

import (
	"fmt"
	"math/rand"
	"net/http"
)

type LoadBalancer struct {
	instances []string
	index     int
}

// Round-robin
func (lb *LoadBalancer) RoundRobin() string {
	instance := lb.instances[lb.index]
	lb.index = (lb.index + 1) % len(lb.instances)
	return instance
}

// Random
func (lb *LoadBalancer) Random() string {
	return lb.instances[rand.Intn(len(lb.instances))]
}

// Weighted (based on instance capacity)
func (lb *LoadBalancer) Weighted(weights map[string]int) string {
	totalWeight := 0
	for _, weight := range weights {
		totalWeight += weight
	}
	
	r := rand.Intn(totalWeight)
	cumulative := 0
	
	for instance, weight := range weights {
		cumulative += weight
		if r < cumulative {
			return instance
		}
	}
	
	return lb.instances[0]
}

// Usage
func callPaymentService() {
	lb := &LoadBalancer{
		instances: []string{
			"http://payment1:8080",
			"http://payment2:8080",
			"http://payment3:8080",
		},
	}
	
	instance := lb.RoundRobin()
	resp, _ := http.Post(instance+"/payments", "application/json", body)
	// ...
}
```

**Server-Side** (Load balancer in front):
```yaml
# nginx.conf
upstream payment-service {
    least_conn;  # Least connections algorithm
    
    server payment1:8080 weight=3;
    server payment2:8080 weight=2;
    server payment3:8080 weight=1;
}

server {
    listen 80;
    
    location /payments {
        proxy_pass http://payment-service;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
}
```

**HAProxy** (Layer 7):
```cfg
# haproxy.cfg
frontend payment-frontend
    bind *:80
    default_backend payment-backend

backend payment-backend
    balance leastconn
    option httpchk GET /health
    
    server payment1 payment1:8080 check weight 100
    server payment2 payment2:8080 check weight 50
    server payment3 payment3:8080 check weight 25
```

**Service Mesh** (Istio):
```yaml
apiVersion: networking.istio.io/v1beta1
kind: DestinationRule
metadata:
  name: payment-service
spec:
  host: payment-service
  trafficPolicy:
    loadBalancer:
      consistentHash:
        httpHeaderName: X-User-ID  # Sticky sessions
    connectionPool:
      tcp:
        maxConnections: 100
      http:
        http1MaxPendingRequests: 50
        http2MaxRequests: 100
```

---

### 2. Caching

**Application-Level Cache**:
```python
from functools import lru_cache
import redis

redis_client = redis.Redis()

# In-memory cache (LRU)
@lru_cache(maxsize=1000)
def get_product(product_id):
    # Expensive operation
    return db.products.find_one({'_id': product_id})

# Redis cache
def get_user_cached(user_id):
    # Check cache
    cached = redis_client.get(f"user:{user_id}")
    if cached:
        return json.loads(cached)
    
    # Cache miss
    user = db.users.find_one({'_id': user_id})
    
    # Cache with TTL
    redis_client.setex(f"user:{user_id}", 3600, json.dumps(user))
    
    return user

# Cache warming
def warm_popular_products():
    products = db.products.find().sort('views', -1).limit(100)
    
    pipe = redis_client.pipeline()
    for product in products:
        pipe.setex(f"product:{product['_id']}", 7200, json.dumps(product))
    pipe.execute()
```

**HTTP Caching** (ETags, Cache-Control):
```python
from flask import Flask, request, make_response
import hashlib

app = Flask(__name__)

@app.route('/products/<product_id>')
def get_product(product_id):
    product = db.products.find_one({'_id': product_id})
    
    # Generate ETag
    etag = hashlib.md5(json.dumps(product).encode()).hexdigest()
    
    # Check If-None-Match header
    if request.headers.get('If-None-Match') == etag:
        return '', 304  # Not Modified
    
    response = make_response(jsonify(product))
    response.headers['ETag'] = etag
    response.headers['Cache-Control'] = 'max-age=3600, must-revalidate'
    
    return response
```

**CDN Caching** (CloudFront, Cloudflare):
```python
@app.route('/static/<path:filename>')
def static_file(filename):
    response = send_file(f'static/{filename}')
    
    # Cache in CDN for 1 year
    response.headers['Cache-Control'] = 'public, max-age=31536000, immutable'
    
    return response
```

---

### 3. Database Optimization

**Connection Pooling**:
```python
from sqlalchemy import create_engine
from sqlalchemy.pool import QueuePool

engine = create_engine(
    'postgresql://user:pass@localhost/db',
    poolclass=QueuePool,
    pool_size=20,        # Max connections
    max_overflow=10,     # Extra connections
    pool_timeout=30,     # Wait timeout
    pool_recycle=3600,   # Recycle after 1 hour
    pool_pre_ping=True   # Verify connection before use
)
```

**Query Optimization**:
```python
# Bad: N+1 queries
orders = db.orders.find({'user_id': user_id})
for order in orders:
    user = db.users.find_one({'_id': order['user_id']})  # N queries!
    print(f"{user['name']}: {order['total']}")

# Good: Single query with join
pipeline = [
    {'$match': {'user_id': user_id}},
    {'$lookup': {
        'from': 'users',
        'localField': 'user_id',
        'foreignField': '_id',
        'as': 'user'
    }},
    {'$unwind': '$user'}
]
orders = db.orders.aggregate(pipeline)

# Even better: Denormalize
# Store user.name in orders collection
```

**Indexing**:
```python
# Create indexes
db.orders.create_index('user_id')
db.orders.create_index([('created_at', -1)])
db.orders.create_index([('user_id', 1), ('status', 1)])  # Compound

# Explain query
db.orders.find({'user_id': 'user123'}).explain()
```

**Read Replicas**:
```python
class DatabasePool:
    def __init__(self):
        self.master = create_engine('postgresql://master/db')
        self.replicas = [
            create_engine('postgresql://replica1/db'),
            create_engine('postgresql://replica2/db')
        ]
    
    def get_write_connection(self):
        return self.master
    
    def get_read_connection(self):
        return random.choice(self.replicas)

# Usage
@app.route('/orders/<order_id>')
def get_order(order_id):
    conn = db_pool.get_read_connection()
    return conn.execute(f"SELECT * FROM orders WHERE id = '{order_id}'").fetchone()

@app.route('/orders', methods=['POST'])
def create_order():
    conn = db_pool.get_write_connection()
    conn.execute("INSERT INTO orders ...")
```

---

### 4. Asynchronous Processing

**Offload Heavy Tasks to Background**:
```python
from celery import Celery

celery = Celery('tasks', broker='redis://localhost:6379')

@celery.task
def send_order_confirmation_email(order_id):
    # Expensive email sending
    order = db.orders.find_one({'_id': order_id})
    send_email(order['user_email'], 'Order Confirmed', render_template(order))

@app.route('/orders', methods=['POST'])
def create_order():
    order = db.insert_order(request.json)
    
    # Queue background task (non-blocking)
    send_order_confirmation_email.delay(str(order['_id']))
    
    return {'order_id': str(order['_id'])}, 201
```

**Go** (goroutines + channels):
```go
func createOrder(w http.ResponseWriter, r *http.Request) {
	var req OrderRequest
	json.NewDecoder(r.Body).Decode(&req)
	
	order := db.InsertOrder(req)
	
	// Background processing
	go func() {
		sendOrderConfirmationEmail(order.ID)
		updateInventory(order.Items)
		notifyWarehouse(order.ID)
	}()
	
	// Immediate response
	w.WriteHeader(http.StatusCreated)
	json.NewEncoder(w).Encode(order)
}
```

---

### 5. Response Compression

```python
from flask_compress import Compress

app = Flask(__name__)
Compress(app)  # Automatically compresses responses

# Or manually
import gzip

@app.route('/large-data')
def large_data():
    data = json.dumps(get_large_dataset())
    
    compressed = gzip.compress(data.encode())
    
    response = make_response(compressed)
    response.headers['Content-Encoding'] = 'gzip'
    response.headers['Content-Type'] = 'application/json'
    
    return response
```

**nginx**:
```conf
gzip on;
gzip_types text/plain application/json application/javascript text/css;
gzip_min_length 1000;
gzip_comp_level 6;
```

---

### 6. HTTP/2 & gRPC

**HTTP/2 Benefits**:
- Multiplexing (multiple requests over one connection)
- Header compression
- Server push

**Enable HTTP/2** (nginx):
```conf
server {
    listen 443 ssl http2;
    
    ssl_certificate /path/to/cert.pem;
    ssl_certificate_key /path/to/key.pem;
    
    location / {
        proxy_pass http://backend;
    }
}
```

**gRPC** (faster than REST for service-to-service):
```protobuf
// payment.proto
syntax = "proto3";

service PaymentService {
  rpc ProcessPayment(PaymentRequest) returns (PaymentResponse);
}

message PaymentRequest {
  string order_id = 1;
  double amount = 2;
}

message PaymentResponse {
  string transaction_id = 1;
  string status = 2;
}
```

**Server** (Go):
```go
type server struct {
	pb.UnimplementedPaymentServiceServer
}

func (s *server) ProcessPayment(ctx context.Context, req *pb.PaymentRequest) (*pb.PaymentResponse, error) {
	// Process payment...
	
	return &pb.PaymentResponse{
		TransactionId: "txn123",
		Status:        "success",
	}, nil
}

func main() {
	lis, _ := net.Listen("tcp", ":50051")
	s := grpc.NewServer()
	pb.RegisterPaymentServiceServer(s, &server{})
	s.Serve(lis)
}
```

**Client** (Go):
```go
conn, _ := grpc.Dial("payment-service:50051", grpc.WithInsecure())
defer conn.Close()

client := pb.NewPaymentServiceClient(conn)

resp, _ := client.ProcessPayment(context.Background(), &pb.PaymentRequest{
	OrderId: "order123",
	Amount:  100.0,
})

fmt.Println(resp.TransactionId)
```

---

### 7. Auto-Scaling

**Horizontal Pod Autoscaler** (Kubernetes):
```yaml
apiVersion: autoscaling/v2
kind: HorizontalPodAutoscaler
metadata:
  name: order-service-hpa
spec:
  scaleTargetRef:
    apiVersion: apps/v1
    kind: Deployment
    name: order-service
  minReplicas: 3
  maxReplicas: 20
  metrics:
  - type: Resource
    resource:
      name: cpu
      target:
        type: Utilization
        averageUtilization: 70
  - type: Resource
    resource:
      name: memory
      target:
        type: Utilization
        averageUtilization: 80
  - type: Pods
    pods:
      metric:
        name: http_requests_per_second
      target:
        type: AverageValue
        averageValue: "1000"
```

**Custom Metrics** (Prometheus):
```yaml
apiVersion: v1
kind: Service
metadata:
  name: custom-metrics-apiserver
spec:
  ports:
  - port: 443
    targetPort: 6443
  selector:
    app: custom-metrics-apiserver

---
apiVersion: autoscaling/v2
kind: HorizontalPodAutoscaler
metadata:
  name: order-service-hpa
spec:
  scaleTargetRef:
    apiVersion: apps/v1
    kind: Deployment
    name: order-service
  minReplicas: 2
  maxReplicas: 10
  metrics:
  - type: Pods
    pods:
      metric:
        name: queue_depth
      target:
        type: AverageValue
        averageValue: "50"
```

---

### 8. Performance Profiling

**Go** (pprof):
```go
import (
	_ "net/http/pprof"
	"net/http"
)

func main() {
	// Enable profiling endpoint
	go func() {
		http.ListenAndServe("localhost:6060", nil)
	}()
	
	// Your application...
}

// Access profiling:
// http://localhost:6060/debug/pprof/
// go tool pprof http://localhost:6060/debug/pprof/profile?seconds=30
// go tool pprof http://localhost:6060/debug/pprof/heap
```

**Python** (cProfile):
```python
import cProfile
import pstats

@app.route('/profile')
def profile_endpoint():
    profiler = cProfile.Profile()
    profiler.enable()
    
    # Code to profile
    result = expensive_operation()
    
    profiler.disable()
    
    stats = pstats.Stats(profiler)
    stats.sort_stats('cumulative')
    stats.print_stats(20)  # Top 20 functions
    
    return result
```

**Continuous Profiling** (Pyroscope):
```python
import pyroscope

pyroscope.configure(
    application_name="order-service",
    server_address="http://pyroscope:4040"
)

# Automatically profiles all requests
```

---

### Performance Optimization Checklist

- [ ] Enable HTTP/2
- [ ] Implement caching (Redis, CDN)
- [ ] Use connection pooling
- [ ] Optimize database queries (indexes, explain plans)
- [ ] Enable response compression (gzip)
- [ ] Use read replicas for read-heavy workloads
- [ ] Implement async processing (queues)
- [ ] Configure auto-scaling
- [ ] Profile and optimize hot paths
- [ ] Use gRPC for internal communication
- [ ] Implement rate limiting
- [ ] Monitor and set SLOs

---

## Cost Optimization

### Cloud Cost Breakdown

**Typical Microservices Infrastructure** (AWS):
```
Compute (ECS/EKS):        $500-2000/month
Databases (RDS):          $200-1000/month
Load Balancers (ALB):     $50-200/month
Data Transfer:            $100-500/month
Monitoring (CloudWatch):  $50-200/month
Logs (CloudWatch Logs):   $50-150/month
Message Queue (SQS):      $10-100/month
Cache (ElastiCache):      $100-500/month
Total:                    $1060-4650/month
```

---

### 1. Right-Sizing Resources

**Monitor Actual Usage**:
```bash
# Kubernetes
kubectl top pods
kubectl top nodes

# Identify over-provisioned pods
kubectl get pods -o json | jq '.items[] | {
  name: .metadata.name,
  cpu_request: .spec.containers[0].resources.requests.cpu,
  cpu_limit: .spec.containers[0].resources.limits.cpu,
  memory_request: .spec.containers[0].resources.requests.memory
}'
```

**Vertical Pod Autoscaler** (recommends resource limits):
```yaml
apiVersion: autoscaling.k8s.io/v1
kind: VerticalPodAutoscaler
metadata:
  name: order-service-vpa
spec:
  targetRef:
    apiVersion: apps/v1
    kind: Deployment
    name: order-service
  updatePolicy:
    updateMode: "Auto"  # Automatically applies recommendations
```

**Cost Analysis**:
```python
# Analyze pod costs
import subprocess
import json

pods = json.loads(subprocess.check_output(['kubectl', 'get', 'pods', '-o', 'json']))

for pod in pods['items']:
    containers = pod['spec']['containers']
    
    for container in containers:
        cpu = container['resources']['requests'].get('cpu', '0')
        memory = container['resources']['requests'].get('memory', '0')
        
        # Estimate cost ($0.04/vCPU-hour, $0.005/GB-hour)
        cpu_cores = float(cpu.replace('m', '')) / 1000 if 'm' in cpu else float(cpu)
        memory_gb = float(memory.replace('Gi', '')) if 'Gi' in memory else 0
        
        hourly_cost = (cpu_cores * 0.04) + (memory_gb * 0.005)
        monthly_cost = hourly_cost * 730
        
        print(f"{pod['metadata']['name']}: ${monthly_cost:.2f}/month")
```

---

### 2. Spot/Preemptible Instances

**AWS EKS with Spot Instances**:
```yaml
apiVersion: v1
kind: NodeGroup
metadata:
  name: spot-nodes
spec:
  instanceTypes:
    - t3.medium
    - t3a.medium
  capacityType: SPOT
  desiredSize: 5
  minSize: 2
  maxSize: 10
  
  taints:
    - key: spot
      value: "true"
      effect: NoSchedule

---
# Tolerate spot instances for non-critical workloads
apiVersion: apps/v1
kind: Deployment
metadata:
  name: background-worker
spec:
  template:
    spec:
      tolerations:
      - key: spot
        operator: Equal
        value: "true"
        effect: NoSchedule
      nodeSelector:
        capacity-type: SPOT
```

**Savings**: 60-90% compared to on-demand instances

---

### 3. Serverless for Low-Traffic Services

**AWS Lambda** (for sporadic workloads):
```python
# lambda_function.py
import json
import boto3

dynamodb = boto3.resource('dynamodb')
table = dynamodb.Table('orders')

def lambda_handler(event, context):
    # Parse request
    body = json.loads(event['body'])
    
    # Process order
    order = {
        'order_id': str(uuid.uuid4()),
        'user_id': body['user_id'],
        'items': body['items'],
        'status': 'pending'
    }
    
    table.put_item(Item=order)
    
    return {
        'statusCode': 201,
        'body': json.dumps(order)
    }
```

**Cost**: $0.20 per 1M requests + compute time  
vs.  
**ECS**: $30-50/month (always running)

**Use When**:
- < 1000 requests/day
- Unpredictable traffic patterns
- Event-driven workloads

---

### 4. Database Optimization

**Use Serverless Databases** (Aurora Serverless):
```yaml
# AWS RDS Aurora Serverless
Type: AWS::RDS::DBCluster
Properties:
  Engine: aurora-postgresql
  EngineMode: serverless
  ScalingConfiguration:
    MinCapacity: 2  # 2 ACUs (Aurora Capacity Units)
    MaxCapacity: 16
    AutoPause: true
    SecondsUntilAutoPause: 300  # Pause after 5 min inactivity
```

**Cost**: Pay per ACU-hour (only when active)  
vs.  
**Provisioned RDS**: $200+/month (always running)

**Downgrade Dev/Staging Environments**:
```bash
# Production: db.r5.2xlarge ($500/month)
# Staging: db.t3.medium ($60/month)
# Dev: db.t3.small ($30/month)

# Auto-shutdown dev/staging after hours
aws rds stop-db-instance --db-instance-identifier dev-db
```

---

### 5. Data Transfer Optimization

**Data Transfer Costs** (AWS):
- Within AZ: Free
- Cross-AZ: $0.01/GB
- Cross-Region: $0.02/GB
- To Internet: $0.09/GB

**Optimize**:
```yaml
# Keep related services in same AZ
apiVersion: apps/v1
kind: Deployment
metadata:
  name: order-service
spec:
  template:
    spec:
      affinity:
        podAffinity:
          requiredDuringSchedulingIgnoredDuringExecution:
          - labelSelector:
              matchExpressions:
              - key: app
                operator: In
                values:
                - payment-service
            topologyKey: topology.kubernetes.io/zone
```

**Use CDN** (reduces egress):
```python
# Serve static assets from S3 + CloudFront (cheaper than EC2 egress)
@app.route('/images/<filename>')
def get_image(filename):
    # Redirect to CDN
    return redirect(f'https://cdn.example.com/images/{filename}')
```

---

### 6. Reserved Instances / Savings Plans

**Reserved Instances** (AWS):
- 1 year: 40% savings
- 3 years: 60% savings

**When to Use**:
- Baseline capacity (always running)
- Predictable workloads

**Spot for Burst, Reserved for Base**:
```
┌────────────────────────────┐
│   Burst Traffic (Spot)     │  ◄─ 70% cheaper
├────────────────────────────┤
│ Variable (On-Demand)       │
├────────────────────────────┤
│ Baseline (Reserved)        │  ◄─ 60% cheaper
└────────────────────────────┘
```

---

### 7. Monitoring & Alerts

**Cost Anomaly Detection**:
```python
import boto3

ce = boto3.client('ce')  # Cost Explorer

# Get daily costs
response = ce.get_cost_and_usage(
    TimePeriod={
        'Start': '2024-01-01',
        'End': '2024-01-31'
    },
    Granularity='DAILY',
    Metrics=['UnblendedCost'],
    GroupBy=[{'Type': 'SERVICE', 'Key': 'SERVICE'}]
)

# Alert if cost increases > 20%
for day in response['ResultsByTime']:
    cost = float(day['Total']['UnblendedCost']['Amount'])
    
    if cost > previous_day * 1.2:
        send_alert(f"Cost spike detected: ${cost:.2f}")
```

**Budget Alerts** (AWS):
```yaml
# AWS Budget
Type: AWS::Budgets::Budget
Properties:
  Budget:
    BudgetName: monthly-budget
    BudgetLimit:
      Amount: 5000
      Unit: USD
    BudgetType: COST
    TimeUnit: MONTHLY
  NotificationsWithSubscribers:
    - Notification:
        NotificationType: ACTUAL
        ComparisonOperator: GREATER_THAN
        Threshold: 80
      Subscribers:
        - SubscriptionType: EMAIL
          Address: devops@example.com
```

---

### Cost Optimization Checklist

- [ ] Right-size instances (monitor actual usage)
- [ ] Use spot/preemptible for non-critical workloads
- [ ] Implement auto-scaling (scale to zero when idle)
- [ ] Use serverless for low-traffic services
- [ ] Optimize database (serverless, read replicas only when needed)
- [ ] Minimize data transfer (same AZ, CDN)
- [ ] Use reserved instances for baseline capacity
- [ ] Delete unused resources (old snapshots, volumes)
- [ ] Implement cost monitoring & alerts
- [ ] Review and optimize logs retention
- [ ] Use cheaper storage tiers (S3 Glacier for archives)
- [ ] Shutdown dev/staging environments after hours

**Estimated Savings**: 30-60% of cloud costs

---

## Polyglot & Interoperability

### Why Polyglot?

**Use the right tool for the job**:
- **Go**: High-performance APIs, concurrent processing
- **Python**: Data processing, ML, rapid prototyping
- **Java/Spring**: Enterprise, complex business logic
- **Node.js**: Real-time, WebSockets
- **Rust**: Ultra-low latency, systems programming

---

### 1. Language-Agnostic Communication

**gRPC** (supports Go, Python, Java, C++, etc.):
```protobuf
// user.proto
syntax = "proto3";

service UserService {
  rpc GetUser(UserRequest) returns (UserResponse);
  rpc CreateUser(CreateUserRequest) returns (UserResponse);
}

message UserRequest {
  string user_id = 1;
}

message UserResponse {
  string id = 1;
  string name = 2;
  string email = 3;
}
```

**Server** (Python):
```python
import grpc
from concurrent import futures
import user_pb2
import user_pb2_grpc

class UserService(user_pb2_grpc.UserServiceServicer):
    def GetUser(self, request, context):
        user = db.users.find_one({'_id': request.user_id})
        
        return user_pb2.UserResponse(
            id=str(user['_id']),
            name=user['name'],
            email=user['email']
        )

server = grpc.server(futures.ThreadPoolExecutor(max_workers=10))
user_pb2_grpc.add_UserServiceServicer_to_server(UserService(), server)
server.add_insecure_port('[::]:50051')
server.start()
server.wait_for_termination()
```

**Client** (Go):
```go
conn, _ := grpc.Dial("user-service:50051", grpc.WithInsecure())
defer conn.Close()

client := pb.NewUserServiceClient(conn)

resp, _ := client.GetUser(context.Background(), &pb.UserRequest{
	UserId: "user123",
})

fmt.Printf("User: %s (%s)\n", resp.Name, resp.Email)
```

---

### 2. Message Formats

**Protocol Buffers** (binary, compact):
- 3-10x smaller than JSON
- Faster serialization
- Strongly typed

**Avro** (schema evolution):
```json
{
  "type": "record",
  "name": "Order",
  "fields": [
    {"name": "order_id", "type": "string"},
    {"name": "user_id", "type": "string"},
    {"name": "total", "type": "double"},
    {"name": "created_at", "type": "long", "logicalType": "timestamp-millis"}
  ]
}
```

**JSON** (human-readable, universal):
- Easy debugging
- Larger size
- Slower parsing

**Comparison**:

| Format | Size | Speed | Human-Readable | Schema Evolution |
|--------|------|-------|----------------|------------------|
| **JSON** | 100% | Slow | ✅ | Manual |
| **Protobuf** | 30% | Fast | ❌ | Good |
| **Avro** | 40% | Fast | ❌ | Excellent |
| **MessagePack** | 50% | Medium | ❌ | Manual |

---

### 3. API Versioning

**URL Versioning**:
```
GET /v1/users/123
GET /v2/users/123
```

**Header Versioning**:
```
GET /users/123
Accept: application/vnd.example.v2+json
```

**gRPC Versioning** (package names):
```protobuf
// v1/user.proto
syntax = "proto3";
package user.v1;

service UserService {
  rpc GetUser(UserRequest) returns (UserResponse);
}

// v2/user.proto
syntax = "proto3";
package user.v2;

service UserService {
  rpc GetUser(UserRequest) returns (UserResponse);
  rpc GetUserWithPreferences(UserRequest) returns (UserResponseV2);
}
```

---

### 4. Backward Compatibility

**Field Deprecation** (Protobuf):
```protobuf
message User {
  string id = 1;
  string name = 2;
  string email = 3;
  string phone = 4 [deprecated = true];  // Mark as deprecated
  string mobile_number = 5;  // New field
}
```

**Graceful Degradation**:
```python
def get_user(user_id):
    try:
        # Try new API
        response = requests.get(f"http://user-service-v2/users/{user_id}")
        if response.status_code == 200:
            return response.json()
    except:
        pass
    
    # Fallback to old API
    response = requests.get(f"http://user-service-v1/users/{user_id}")
    return response.json()
```

---

## DevOps & CI/CD

### CI/CD Pipeline

```
┌─────────┐    ┌────────┐    ┌──────┐    ┌────────┐    ┌────────┐
│  Commit │ ──►│  Build │ ──►│ Test │ ──►│ Deploy │ ──►│Monitor │
│  (Git)  │    │        │    │      │    │ (K8s)  │    │        │
└─────────┘    └────────┘    └──────┘    └────────┘    └────────┘
                   │            │            │
                   ▼            ▼            ▼
              Docker Image   Unit/Int    Staging → Prod
```

---

### 1. GitHub Actions

```yaml
# .github/workflows/deploy.yml
name: Deploy Order Service

on:
  push:
    branches: [main]
    paths:
      - 'services/order/**'

jobs:
  build:
    runs-on: ubuntu-latest
    
    steps:
    - uses: actions/checkout@v3
    
    - name: Set up Go
      uses: actions/setup-go@v4
      with:
        go-version: '1.21'
    
    - name: Run tests
      run: |
        cd services/order
        go test -v ./...
        go test -cover -coverprofile=coverage.out ./...
    
    - name: Build Docker image
      run: |
        docker build -t myregistry/order-service:${{ github.sha }} services/order
        docker tag myregistry/order-service:${{ github.sha }} myregistry/order-service:latest
    
    - name: Push to registry
      run: |
        echo "${{ secrets.DOCKER_PASSWORD }}" | docker login -u "${{ secrets.DOCKER_USERNAME }}" --password-stdin
        docker push myregistry/order-service:${{ github.sha }}
        docker push myregistry/order-service:latest
    
    - name: Deploy to Kubernetes
      run: |
        kubectl set image deployment/order-service order-service=myregistry/order-service:${{ github.sha }}
        kubectl rollout status deployment/order-service
```

---

### 2. GitLab CI/CD

```yaml
# .gitlab-ci.yml
stages:
  - test
  - build
  - deploy

test:
  stage: test
  image: python:3.11
  script:
    - pip install -r requirements.txt
    - pytest --cov=order_service
  only:
    changes:
      - services/order/**

build:
  stage: build
  image: docker:latest
  services:
    - docker:dind
  script:
    - docker build -t $CI_REGISTRY_IMAGE/order-service:$CI_COMMIT_SHA services/order
    - docker push $CI_REGISTRY_IMAGE/order-service:$CI_COMMIT_SHA
  only:
    - main

deploy_staging:
  stage: deploy
  image: bitnami/kubectl:latest
  script:
    - kubectl set image deployment/order-service order-service=$CI_REGISTRY_IMAGE/order-service:$CI_COMMIT_SHA --namespace=staging
  environment:
    name: staging
  only:
    - main

deploy_production:
  stage: deploy
  image: bitnami/kubectl:latest
  script:
    - kubectl set image deployment/order-service order-service=$CI_REGISTRY_IMAGE/order-service:$CI_COMMIT_SHA --namespace=production
  environment:
    name: production
  when: manual
  only:
    - main
```

---

### 3. Infrastructure as Code

**Terraform** (AWS EKS):
```hcl
# main.tf
provider "aws" {
  region = "us-east-1"
}

module "eks" {
  source  = "terraform-aws-modules/eks/aws"
  
  cluster_name    = "microservices-cluster"
  cluster_version = "1.27"
  
  vpc_id     = module.vpc.vpc_id
  subnet_ids = module.vpc.private_subnets
  
  eks_managed_node_groups = {
    general = {
      desired_size = 3
      min_size     = 2
      max_size     = 10
      
      instance_types = ["t3.medium"]
      capacity_type  = "ON_DEMAND"
    }
    
    spot = {
      desired_size = 5
      min_size     = 2
      max_size     = 20
      
      instance_types = ["t3.medium", "t3a.medium"]
      capacity_type  = "SPOT"
    }
  }
}

module "rds" {
  source = "terraform-aws-modules/rds/aws"
  
  identifier = "orderdb"
  
  engine            = "postgres"
  engine_version    = "14"
  instance_class    = "db.t3.medium"
  allocated_storage = 20
  
  db_name  = "orderdb"
  username = "app"
  password = var.db_password
  
  multi_az = true
  
  backup_retention_period = 7
}

# Apply:
# terraform init
# terraform plan
# terraform apply
```

**Pulumi** (Python):
```python
import pulumi
import pulumi_aws as aws
import pulumi_kubernetes as k8s

# Create VPC
vpc = aws.ec2.Vpc("microservices-vpc",
    cidr_block="10.0.0.0/16",
    enable_dns_hostnames=True
)

# Create EKS cluster
cluster = aws.eks.Cluster("microservices-cluster",
    role_arn=eks_role.arn,
    vpc_config=aws.eks.ClusterVpcConfigArgs(
        subnet_ids=[subnet.id for subnet in subnets]
    )
)

# Deploy Order Service
order_service = k8s.apps.v1.Deployment("order-service",
    metadata=k8s.meta.v1.ObjectMetaArgs(
        name="order-service"
    ),
    spec=k8s.apps.v1.DeploymentSpecArgs(
        replicas=3,
        selector=k8s.meta.v1.LabelSelectorArgs(
            match_labels={"app": "order-service"}
        ),
        template=k8s.core.v1.PodTemplateSpecArgs(
            metadata=k8s.meta.v1.ObjectMetaArgs(
                labels={"app": "order-service"}
            ),
            spec=k8s.core.v1.PodSpecArgs(
                containers=[k8s.core.v1.ContainerArgs(
                    name="order-service",
                    image="myregistry/order-service:latest",
                    ports=[k8s.core.v1.ContainerPortArgs(container_port=8080)]
                )]
            )
        )
    )
)

# Run:
# pulumi up
```

---

### 4. GitOps (ArgoCD)

**Continuous Delivery from Git**:
```yaml
# argocd-application.yaml
apiVersion: argoproj.io/v1alpha1
kind: Application
metadata:
  name: order-service
  namespace: argocd
spec:
  project: default
  
  source:
    repoURL: https://github.com/myorg/k8s-manifests
    targetRevision: HEAD
    path: order-service
  
  destination:
    server: https://kubernetes.default.svc
    namespace: production
  
  syncPolicy:
    automated:
      prune: true
      selfHeal: true
    syncOptions:
    - CreateNamespace=true
```

**Workflow**:
1. Update Kubernetes manifest in Git
2. ArgoCD detects change
3. Automatically syncs to cluster
4. Monitors drift and auto-heals

---

## Failure Injection & Chaos Engineering

### Why Chaos Engineering?

**Test resilience proactively** before production incidents.

**Chaos Engineering Principles**:
1. Define steady state (normal metrics)
2. Hypothesize steady state continues
3. Introduce real-world variables (failures)
4. Disprove hypothesis (find weaknesses)

---

### 1. Chaos Mesh (Kubernetes)

**Installation**:
```bash
curl -sSL https://mirrors.chaos-mesh.org/v2.6.0/install.sh | bash
```

**Pod Failure**:
```yaml
apiVersion: chaos-mesh.org/v1alpha1
kind: PodChaos
metadata:
  name: pod-kill-experiment
spec:
  action: pod-kill
  mode: one  # Kill one pod
  selector:
    namespaces:
      - production
    labelSelectors:
      app: order-service
  scheduler:
    cron: '@every 30m'
```

**Network Latency**:
```yaml
apiVersion: chaos-mesh.org/v1alpha1
kind: NetworkChaos
metadata:
  name: network-delay
spec:
  action: delay
  mode: all
  selector:
    namespaces:
      - production
    labelSelectors:
      app: payment-service
  delay:
    latency: '500ms'
    correlation: '25'
    jitter: '100ms'
  duration: '10m'
  direction: to  # Outgoing traffic
  target:
    selector:
      labelSelectors:
        app: database
```

**Network Partition**:
```yaml
apiVersion: chaos-mesh.org/v1alpha1
kind: NetworkChaos
metadata:
  name: network-partition
spec:
  action: partition
  mode: all
  selector:
    namespaces:
      - production
    labelSelectors:
      app: order-service
  direction: both
  target:
    selector:
      labelSelectors:
        app: user-service
  duration: '5m'
```

**CPU Stress**:
```yaml
apiVersion: chaos-mesh.org/v1alpha1
kind: StressChaos
metadata:
  name: cpu-stress
spec:
  mode: one
  selector:
    namespaces:
      - production
    labelSelectors:
      app: order-service
  stressors:
    cpu:
      workers: 4
      load: 80
  duration: '10m'
```

**Database Failure**:
```yaml
apiVersion: chaos-mesh.org/v1alpha1
kind: PodChaos
metadata:
  name: database-failure
spec:
  action: pod-failure
  mode: all
  selector:
    namespaces:
      - production
    labelSelectors:
      app: postgres
  duration: '2m'
```

---

### 2. Netflix Chaos Monkey

**AWS/Cloud Chaos**:
```bash
# Install Chaos Monkey
pip install chaostoolkit chaostoolkit-aws

# Define experiment
cat > experiment.json <<EOF
{
  "title": "Terminate random EC2 instance",
  "description": "Test auto-scaling recovery",
  "steady-state-hypothesis": {
    "title": "Service is healthy",
    "probes": [
      {
        "type": "probe",
        "name": "service-is-responding",
        "tolerance": 200,
        "provider": {
          "type": "http",
          "url": "http://api-gateway/health"
        }
      }
    ]
  },
  "method": [
    {
      "type": "action",
      "name": "terminate-instance",
      "provider": {
        "type": "python",
        "module": "chaosaws.ec2.actions",
        "func": "terminate_instances",
        "arguments": {
          "filters": [
            {"Name": "tag:Service", "Values": ["order-service"]}
          ]
        }
      }
    }
  ],
  "rollbacks": []
}
EOF

# Run experiment
chaos run experiment.json
```

---

### 3. Application-Level Chaos

**Fault Injection Middleware** (Python):
```python
import random
from flask import Flask, jsonify
import time

app = Flask(__name__)

# Chaos configuration
CHAOS_CONFIG = {
    'error_rate': 0.1,      # 10% errors
    'latency_rate': 0.2,    # 20% slow responses
    'latency_ms': 2000      # 2 second delay
}

@app.before_request
def chaos_middleware():
    # Random errors
    if random.random() < CHAOS_CONFIG['error_rate']:
        return jsonify({'error': 'Chaos: Simulated error'}), 500
    
    # Random latency
    if random.random() < CHAOS_CONFIG['latency_rate']:
        time.sleep(CHAOS_CONFIG['latency_ms'] / 1000)

@app.route('/orders', methods=['POST'])
def create_order():
    # Normal logic
    return jsonify({'order_id': '123'}), 201
```

**Go** (with feature flag control):
```go
package main

import (
	"math/rand"
	"net/http"
	"time"
)

type ChaosConfig struct {
	Enabled     bool
	ErrorRate   float64
	LatencyRate float64
	LatencyMs   int
}

var chaosConfig = ChaosConfig{
	Enabled:     true,
	ErrorRate:   0.1,
	LatencyRate: 0.2,
	LatencyMs:   2000,
}

func chaosMiddleware(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		if !chaosConfig.Enabled {
			next.ServeHTTP(w, r)
			return
		}
		
		// Inject errors
		if rand.Float64() < chaosConfig.ErrorRate {
			http.Error(w, "Chaos: Simulated error", http.StatusInternalServerError)
			return
		}
		
		// Inject latency
		if rand.Float64() < chaosConfig.LatencyRate {
			time.Sleep(time.Duration(chaosConfig.LatencyMs) * time.Millisecond)
		}
		
		next.ServeHTTP(w, r)
	})
}

func main() {
	mux := http.NewServeMux()
	mux.HandleFunc("/orders", createOrderHandler)
	
	http.ListenAndServe(":8080", chaosMiddleware(mux))
}
```

---

### 4. Chaos Experiments to Run

**1. Service Failure**:
- Kill random pod
- **Expected**: Circuit breaker opens, requests routed to healthy instances

**2. Database Failure**:
- Terminate database pod
- **Expected**: Connection retry, graceful degradation

**3. Network Partition**:
- Partition order-service from payment-service
- **Expected**: Timeout, fallback, eventual consistency

**4. High Latency**:
- Add 5s delay to user-service
- **Expected**: Timeout, circuit breaker, no cascading failures

**5. Resource Exhaustion**:
- Stress CPU to 100%
- **Expected**: Auto-scaling kicks in, no service degradation

**6. Dependency Outage**:
- Block third-party API (Stripe, SendGrid)
- **Expected**: Queue retries, graceful error messages

---

### 5. GameDays

**Scheduled Chaos Events**:
```
┌─────────────────────────────────────┐
│ GameDay: Simulate AWS Region Outage│
├─────────────────────────────────────┤
│ 10:00 - Pre-checks (all systems OK) │
│ 10:30 - Failover to backup region   │
│ 11:00 - Monitor metrics, errors     │
│ 11:30 - Restore primary region      │
│ 12:00 - Debrief, document learnings │
└─────────────────────────────────────┘
```

**Runbook**:
1. Announce to team
2. Enable chaos (gradually)
3. Monitor dashboards
4. Document issues
5. Fix identified problems
6. Repeat monthly

---

## Documentation & Governance

### 1. Service Catalog

**Track all microservices**:
```yaml
# service-catalog.yml
services:
  - name: order-service
    owner: orders-team
    oncall: orders-oncall@example.com
    repository: https://github.com/myorg/order-service
    documentation: https://docs.example.com/order-service
    dependencies:
      - user-service
      - payment-service
      - inventory-service
    sla:
      availability: 99.9%
      latency_p95: 200ms
    deployment:
      production: https://api.example.com/orders
      staging: https://staging-api.example.com/orders
    metrics:
      dashboard: https://grafana.example.com/d/order-service
      alerts: https://pagerduty.com/services/order-service
  
  - name: payment-service
    owner: payments-team
    oncall: payments-oncall@example.com
    repository: https://github.com/myorg/payment-service
    dependencies:
      - stripe-api (external)
    sla:
      availability: 99.95%
      latency_p95: 500ms
```

**Automated Catalog** (Backstage):
```yaml
# catalog-info.yaml
apiVersion: backstage.io/v1alpha1
kind: Component
metadata:
  name: order-service
  description: Order management service
  annotations:
    github.com/project-slug: myorg/order-service
spec:
  type: service
  lifecycle: production
  owner: orders-team
  system: e-commerce
  dependsOn:
    - component:user-service
    - component:payment-service
  providesApis:
    - order-api
```

---

### 2. API Documentation

**OpenAPI/Swagger**:
```yaml
# openapi.yml
openapi: 3.0.0
info:
  title: Order Service API
  version: 1.0.0
  description: Create and manage orders
  contact:
    name: Orders Team
    email: orders-team@example.com

servers:
  - url: https://api.example.com
    description: Production
  - url: https://staging-api.example.com
    description: Staging

paths:
  /orders:
    post:
      summary: Create order
      tags:
        - Orders
      requestBody:
        required: true
        content:
          application/json:
            schema:
              type: object
              properties:
                user_id:
                  type: string
                items:
                  type: array
                  items:
                    type: object
                    properties:
                      product_id:
                        type: string
                      quantity:
                        type: integer
      responses:
        '201':
          description: Order created
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/Order'
        '400':
          description: Invalid input

components:
  schemas:
    Order:
      type: object
      properties:
        id:
          type: string
        user_id:
          type: string
        items:
          type: array
        total:
          type: number
        status:
          type: string
          enum: [pending, paid, shipped, delivered]
```

**Auto-Generate from Code** (Python/Flask):
```python
from flask import Flask
from flask_restx import Api, Resource, fields

app = Flask(__name__)
api = Api(app, version='1.0', title='Order Service API',
          description='Order management API')

ns = api.namespace('orders', description='Order operations')

order_model = api.model('Order', {
    'id': fields.String(required=True, description='Order ID'),
    'user_id': fields.String(required=True, description='User ID'),
    'total': fields.Float(required=True, description='Order total'),
    'status': fields.String(required=True, description='Order status')
})

@ns.route('/')
class OrderList(Resource):
    @ns.doc('create_order')
    @ns.expect(order_model)
    @ns.marshal_with(order_model, code=201)
    def post(self):
        '''Create a new order'''
        return create_order(api.payload), 201

# Access docs at: http://localhost:5000/swagger.json
```

---

### 3. Architecture Decision Records (ADRs)

**Template**:
```markdown
# ADR-001: Use Kafka for Event Streaming

## Status
Accepted

## Context
We need asynchronous communication between microservices for:
- Order creation events
- Inventory updates
- Notification triggers

Options considered:
1. RabbitMQ
2. Apache Kafka
3. AWS SQS

## Decision
Use Apache Kafka.

## Rationale
- High throughput (100K+ messages/sec)
- Durable (event replay capability)
- Distributed and fault-tolerant
- Industry standard

**Trade-offs**:
- ✅ Pros: Scalability, durability, ecosystem
- ❌ Cons: Complexity, operational overhead

## Consequences
- Team needs Kafka training
- DevOps sets up Kafka cluster (3 brokers minimum)
- All services use Kafka SDK
- Monitoring with Kafka Exporter

## Date
2024-01-15

## Superseded by
N/A
```

---

### 4. Runbooks

**Incident Response**:
```markdown
# Runbook: Order Service Down

## Symptoms
- 500 errors on /orders endpoint
- High latency (> 5s)
- PagerDuty alert: "Order Service Unavailable"

## Impact
- Users cannot place orders
- Revenue impact: ~$1000/minute

## Investigation
1. Check service health:
   ```bash
   kubectl get pods -l app=order-service
   kubectl logs -l app=order-service --tail=100
   ```

2. Check database:
   ```bash
   kubectl exec -it postgres-0 -- psql -U app -c "SELECT 1"
   ```

3. Check Kafka:
   ```bash
   kafka-topics --list --bootstrap-server kafka:9092
   ```

4. Check metrics:
   - Grafana: https://grafana.example.com/d/order-service
   - Error rate, latency, CPU, memory

## Mitigation
### Option 1: Restart pods
```bash
kubectl rollout restart deployment/order-service
```

### Option 2: Scale up
```bash
kubectl scale deployment/order-service --replicas=10
```

### Option 3: Rollback
```bash
kubectl rollout undo deployment/order-service
```

### Option 4: Database connection pool exhaustion
```bash
# Increase pool size
kubectl set env deployment/order-service DB_POOL_SIZE=50
```

## Resolution
Document root cause and create postmortem.

## Escalation
If unresolved in 15 minutes:
- Slack: #orders-team
- Oncall: orders-oncall@example.com
- Manager: orders-manager@example.com
```

---

### 5. SLA/SLO Tracking

**Service Level Agreements**:
```yaml
# slo.yml
slos:
  - name: order-service-availability
    description: Order service must be available 99.9% of the time
    sli:
      metric: up{job="order-service"}
      query: avg_over_time(up{job="order-service"}[30d])
    objective: 0.999  # 99.9%
    window: 30d
    error_budget: 0.001  # 43 minutes/month
  
  - name: order-service-latency
    description: 95% of requests complete in < 200ms
    sli:
      metric: http_request_duration_seconds
      query: histogram_quantile(0.95, rate(http_request_duration_seconds_bucket[5m]))
    objective: 0.2  # 200ms
    window: 7d
```

**Error Budget Alerting**:
```yaml
# prometheus-alerts.yml
groups:
  - name: slo-alerts
    rules:
      - alert: ErrorBudgetExhausted
        expr: |
          (1 - avg_over_time(up{job="order-service"}[30d])) > 0.001
        for: 5m
        labels:
          severity: critical
        annotations:
          summary: "Order service error budget exhausted"
          description: "Current availability: {{ $value }}. SLO: 99.9%"
```

---

## Anti-patterns & Common Pitfalls

### 1. Distributed Monolith

**Problem**: Microservices that are tightly coupled.

```
Order Service ──► User Service ──► Payment Service
(synchronous calls, one fails → all fail)
```

**Solution**: Use events, async communication.

---

### 2. Shared Database

**Problem**: Multiple services accessing same database.

```
Order Service ──┐
                ├──► Shared DB
Payment Service ┘
```

**Solution**: Database per service.

---

### 3. No API Gateway

**Problem**: Clients call services directly.

```
Mobile App ──┬──► Order Service
             ├──► User Service
             └──► Payment Service
```

**Issues**:
- No centralized auth
- No rate limiting
- Client couples to service topology

**Solution**: Use API Gateway.

---

### 4. Chatty APIs (N+1 Problem)

**Problem**: Multiple API calls in loops.

```python
# Bad
orders = order_service.get_orders(user_id)
for order in orders:
    user = user_service.get_user(order['user_id'])  # N calls!
```

**Solution**: Batch APIs or denormalize.

```python
# Good
user_ids = [order['user_id'] for order in orders]
users = user_service.get_users_batch(user_ids)  # 1 call
```

---

### 5. Over-Microservicing

**Problem**: Too many tiny services.

```
UserService, UserEmailService, UserPhoneService, UserAddressService...
(5 services for user management)
```

**Issues**:
- Operational overhead
- Network latency
- Complex debugging

**Solution**: Start with coarser boundaries, split only when needed.

---

### 6. No Circuit Breakers

**Problem**: Cascading failures.

```
Order Service → (timeout) → User Service (down)
                  5s wait × 100 requests = 500s blocked threads
```

**Solution**: Implement circuit breakers.

---

### 7. No Timeouts

**Problem**: Infinite waits.

```python
# Bad
response = requests.get("http://user-service/users/123")  # No timeout!

# Good
response = requests.get("http://user-service/users/123", timeout=2)
```

---

### 8. Ignoring Idempotency

**Problem**: Duplicate requests cause issues.

```python
# Non-idempotent
@app.route('/orders', methods=['POST'])
def create_order():
    order = db.insert_order(request.json)  # Duplicate creates 2 orders!
    return {'order_id': order.id}
```

**Solution**: Use idempotency keys.

```python
@app.route('/orders', methods=['POST'])
def create_order():
    idempotency_key = request.headers.get('Idempotency-Key')
    
    # Check if already processed
    existing = db.get_order_by_idempotency_key(idempotency_key)
    if existing:
        return {'order_id': existing.id}, 200
    
    order = db.insert_order(request.json, idempotency_key)
    return {'order_id': order.id}, 201
```

---

### 9. No Correlation IDs

**Problem**: Can't trace requests across services.

**Solution**: Propagate correlation ID.

```python
@app.before_request
def add_correlation_id():
    correlation_id = request.headers.get('X-Correlation-ID', str(uuid.uuid4()))
    g.correlation_id = correlation_id

@app.route('/orders', methods=['POST'])
def create_order():
    logger.info("Creating order", extra={'correlation_id': g.correlation_id})
    
    # Pass to downstream services
    user = requests.get(
        "http://user-service/users/123",
        headers={'X-Correlation-ID': g.correlation_id}
    )
```

---

### 10. Version Hell

**Problem**: Breaking changes without versioning.

**Solution**: Version APIs, maintain backward compatibility.

---

## Case Studies & Real-world Examples

### 1. Netflix

**Scale**: 200+ microservices, 1M+ requests/sec

**Key Patterns**:
- **Chaos Monkey**: Random instance termination
- **Hystrix**: Circuit breaker library
- **Eureka**: Service discovery
- **Zuul**: API Gateway

**Lessons**:
- Embrace failure (design for it)
- Auto-scaling essential at scale
- Observability is critical

---

### 2. Uber

**Scale**: 2000+ microservices

**Architecture**:
```
┌────────────┐
│  API GW    │
└─────┬──────┘
      │
      ├─────────┬─────────┬─────────┐
      ▼         ▼         ▼         ▼
   Dispatch   Pricing   Payment  Routing
   Service    Service   Service  Service
```

**Key Decisions**:
- **Go** for high-performance services
- **Node.js** for I/O-heavy services
- **CQRS** for real-time data
- **Kafka** for event streaming

**Challenges**:
- Service sprawl (2000+ services)
- Dependency management
- Debugging distributed systems

---

### 3. Amazon

**"Two-Pizza Teams"**: Each service owned by small team (<10 people)

**Key Patterns**:
- **Service-Oriented Architecture** (SOA roots)
- **Ownership**: Teams own full lifecycle
- **APIs**: All communication via APIs
- **Data Ownership**: Services own their data

---

### 4. Spotify

**Squads & Tribes**:
- **Squad**: Small team (5-8 people) owning a service
- **Tribe**: Collection of squads (30-150 people)

**Tech Stack**:
- **Java/Python** for services
- **Kafka** for events
- **Cassandra** for data
- **Kubernetes** for orchestration

---

## Migration & Legacy Integration

### Strangler Fig Pattern

**Gradually replace monolith with microservices.**

```
Phase 1: Monolith
┌─────────────────┐
│   Monolith      │
│  - Users        │
│  - Orders       │
│  - Payments     │
└─────────────────┘

Phase 2: Extract first service
┌─────────────────┐    ┌─────────────┐
│   Monolith      │    │  Payment    │
│  - Users        │ ──►│  Service    │
│  - Orders       │    └─────────────┘
└─────────────────┘

Phase 3: Continue extraction
┌─────────────┐  ┌─────────────┐  ┌─────────────┐
│  User       │  │  Order      │  │  Payment    │
│  Service    │  │  Service    │  │  Service    │
└─────────────┘  └─────────────┘  └─────────────┘
```

**Implementation**:
```python
# API Gateway routes
@app.route('/payments', methods=['POST'])
def create_payment():
    # Route to new microservice
    return requests.post("http://payment-service/payments", json=request.json)

@app.route('/orders', methods=['POST'])
def create_order():
    # Still in monolith (for now)
    return monolith.create_order(request.json)
```

---

### Anti-Corruption Layer

**Translate between legacy and new systems.**

```python
class LegacyOrderAdapter:
    """Adapter for legacy order format"""
    
    def __init__(self, legacy_client):
        self.legacy_client = legacy_client
    
    def create_order(self, modern_order):
        # Transform modern format to legacy format
        legacy_order = {
            'customer_id': modern_order['user_id'],
            'line_items': [
                {
                    'sku': item['product_id'],
                    'qty': item['quantity'],
                    'unit_price': item['price']
                }
                for item in modern_order['items']
            ],
            'order_total': modern_order['total']
        }
        
        # Call legacy system
        result = self.legacy_client.submit_order(legacy_order)
        
        # Transform response back
        return {
            'order_id': result['order_number'],
            'status': 'pending' if result['status'] == 'NEW' else 'processing'
        }
```

---

### Data Synchronization

**Keep data in sync during migration.**

```python
# Dual-write pattern
def create_user(user_data):
    # Write to new system
    new_user = new_user_service.create(user_data)
    
    try:
        # Also write to legacy system
        legacy_user_service.create(transform_to_legacy(user_data))
    except Exception as e:
        logger.error("Failed to sync to legacy", exc_info=e)
        # Continue (legacy is read-only backup)
    
    return new_user
```

---

## Tooling Comparison Tables

### Service Mesh

| Tool | Complexity | Features | Adoption | Cost |
|------|------------|----------|----------|------|
| **Istio** | High | ✅✅✅ (mTLS, observability, traffic) | High | Free |
| **Linkerd** | Low | ✅✅ (mTLS, observability) | Medium | Free |
| **Consul Connect** | Medium | ✅✅ (service discovery, mTLS) | Medium | Free |
| **AWS App Mesh** | Medium | ✅✅ (AWS-integrated) | Low | Free (+ AWS costs) |

---

### Message Brokers

| Tool | Throughput | Durability | Ease of Use | Cost |
|------|------------|------------|-------------|------|
| **Kafka** | Very High | ✅✅✅ | Medium | Free (self-host) / $200+/month (managed) |
| **RabbitMQ** | Medium | ✅✅ | Easy | Free (self-host) / $100+/month (managed) |
| **AWS SQS** | High | ✅✅ | Very Easy | $0.40/million requests |
| **Redis Streams** | Very High | ✅ | Easy | Free (self-host) |
| **NATS** | Very High | ✅ | Easy | Free |

---

### Databases

| Database | Type | Use Case | Scaling | Cost |
|----------|------|----------|---------|------|
| **PostgreSQL** | SQL | Transactional, relational | Vertical + read replicas | $30-500/month |
| **MySQL** | SQL | Transactional | Vertical + read replicas | $30-500/month |
| **MongoDB** | NoSQL (Document) | Flexible schema, JSON | Horizontal (sharding) | $50-1000/month |
| **Cassandra** | NoSQL (Wide-column) | High write throughput | Horizontal | $200-2000/month |
| **DynamoDB** | NoSQL (Key-value) | Serverless, auto-scaling | Horizontal | $0.25/GB-month + requests |
| **Redis** | In-memory | Cache, sessions | Vertical | $50-500/month |

---

### Orchestration

| Tool | Complexity | Ecosystem | Adoption | Best For |
|------|------------|-----------|----------|----------|
| **Kubernetes** | High | Huge | Very High | Production, multi-cloud |
| **Docker Swarm** | Low | Small | Low | Simple deployments |
| **ECS** | Medium | AWS | Medium | AWS-native |
| **Nomad** | Medium | Growing | Medium | Multi-workload (containers + VMs) |

---

This comprehensive guide now covers everything from basics to advanced production topics! The microservices guide is now truly exhaustive with:
- Architecture patterns
- Communication strategies
- Deployment strategies
- Observability & monitoring
- Security
- Configuration management
- Data management
- Testing strategies
- Performance optimization
- Cost optimization
- DevOps & CI/CD
- Chaos engineering
- Documentation & governance
- Anti-patterns
- Real-world case studies
- Migration strategies
- Comprehensive tooling comparisons

All with production-ready code examples in Python, Go, and configuration files!
