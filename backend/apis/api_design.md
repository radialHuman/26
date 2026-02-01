# API Design: REST, GraphQL & Best Practices

## Table of Contents
1. [REST API Fundamentals](#rest-api-fundamentals)
2. [RESTful Design Principles](#restful-design-principles)
3. [API Versioning](#api-versioning)
4. [Authentication & Authorization](#authentication--authorization)
5. [GraphQL](#graphql)
6. [gRPC](#grpc)
7. [WebSockets](#websockets)
8. [Server-Sent Events (SSE)](#server-sent-events-sse)
9. [Webhooks](#webhooks)
10. [WebRTC](#webrtc)
11. [API Gateway & Load Balancing](#api-gateway--load-balancing)
12. [Caching Strategies](#caching-strategies)
13. [API Security](#api-security)
14. [Rate Limiting & Throttling](#rate-limiting--throttling)
15. [Error Handling & Logging](#error-handling--logging)
16. [API Testing](#api-testing)
17. [API Monitoring & Observability](#api-monitoring--observability)
18. [Performance Optimization](#performance-optimization)
19. [HATEOAS & Hypermedia](#hateoas--hypermedia)
20. [API Contracts & Schema Validation](#api-contracts--schema-validation)
21. [Batch Operations & Bulk APIs](#batch-operations--bulk-apis)
22. [Pagination Patterns](#pagination-patterns)
23. [Internationalization (i18n)](#internationalization-i18n)
24. [Database Integration](#database-integration)
25. [Message Queues & Async Processing](#message-queues--async-processing)
26. [Microservices Communication](#microservices-communication)
27. [API Deprecation Strategy](#api-deprecation-strategy)
28. [API Documentation](#api-documentation)
29. [Production Best Practices](#production-best-practices)
30. [Complete API Implementation](#complete-api-implementation)

---

## REST API Fundamentals

### What is REST?

**REST** (Representational State Transfer):
- Architectural style for networked applications
- Uses HTTP methods for CRUD operations
- Stateless client-server communication

**Roy Fielding** (2000): Defined REST in his PhD dissertation

**Key Principles**:
```
1. Client-Server: Separation of concerns
2. Stateless: Each request contains all needed info
3. Cacheable: Responses must define if cacheable
4. Uniform Interface: Consistent URL patterns
5. Layered System: Client can't tell if connected directly to server
6. Code on Demand (Optional): Server can send executable code
```

### HTTP Methods

```
GET     - Retrieve resource
POST    - Create resource
PUT     - Update/Replace resource (full)
PATCH   - Update resource (partial)
DELETE  - Delete resource
HEAD    - Same as GET but no response body
OPTIONS - Get supported methods
```

**Idempotency**:
```
Idempotent (same result if called multiple times):
- GET, PUT, DELETE, HEAD, OPTIONS

Non-Idempotent:
- POST (creates new resource each time)
- PATCH (depends on implementation)
```

### HTTP Status Codes

**Success (2xx)**:
```
200 OK              - Success (GET, PUT, PATCH)
201 Created         - Resource created (POST)
204 No Content      - Success but no response body (DELETE)
```

**Client Errors (4xx)**:
```
400 Bad Request     - Invalid syntax
401 Unauthorized    - Authentication required
403 Forbidden       - Authenticated but no permission
404 Not Found       - Resource doesn't exist
409 Conflict        - Conflict with current state (e.g., duplicate)
422 Unprocessable   - Validation error
429 Too Many Requests - Rate limit exceeded
```

**Server Errors (5xx)**:
```
500 Internal Server Error - Generic server error
502 Bad Gateway          - Invalid response from upstream
503 Service Unavailable  - Temporarily down
504 Gateway Timeout      - Upstream timeout
```

---

## RESTful Design Principles

### Resource Naming

**Good Practices**:
```
✅ Use nouns (not verbs)
   GET /users          (not /getUsers)
   POST /orders        (not /createOrder)

✅ Use plural for collections
   GET /users          (not /user)
   
✅ Use hierarchical structure
   GET /users/123/orders
   GET /orders/456/items

✅ Use hyphens (not underscores)
   /user-profiles      (not /user_profiles)

✅ Lowercase URLs
   /users              (not /Users)
```

**Bad Practices**:
```
❌ Verbs in URLs
   /getUser/123
   /createOrder

❌ Mixed singular/plural
   /user/123
   /users/123/order

❌ Deep nesting (>3 levels)
   /users/123/orders/456/items/789/details
```

### URL Examples

**Users Resource**:
```
GET    /users           - List all users
GET    /users/123       - Get user 123
POST   /users           - Create user
PUT    /users/123       - Update user 123 (full replacement)
PATCH  /users/123       - Update user 123 (partial)
DELETE /users/123       - Delete user 123
```

**Nested Resources**:
```
GET /users/123/orders          - Get orders for user 123
POST /users/123/orders         - Create order for user 123
GET /users/123/orders/456      - Get specific order
```

**Filtering, Sorting, Pagination**:
```
GET /users?status=active&role=admin  - Filter
GET /users?sort=created_at&order=desc - Sort
GET /users?page=2&limit=20           - Pagination
GET /users?fields=id,name,email      - Field selection
```

### Request/Response Format

**Request** (Create User):
```http
POST /users HTTP/1.1
Host: api.example.com
Content-Type: application/json
Authorization: Bearer eyJhbGc...

{
  "name": "Alice",
  "email": "alice@example.com",
  "role": "admin"
}
```

**Response** (Success):
```http
HTTP/1.1 201 Created
Location: /users/123
Content-Type: application/json

{
  "id": 123,
  "name": "Alice",
  "email": "alice@example.com",
  "role": "admin",
  "created_at": "2024-01-01T10:00:00Z"
}
```

**Response** (Error):
```http
HTTP/1.1 400 Bad Request
Content-Type: application/json

{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Validation failed",
    "details": [
      {
        "field": "email",
        "message": "Invalid email format"
      }
    ]
  }
}
```

---

## API Versioning

### Strategies

**1. URL Versioning** (Most Common):
```
GET /v1/users/123
GET /v2/users/123

Pros: Clear, easy to test
Cons: Multiple URLs for same resource
```

**2. Header Versioning**:
```
GET /users/123
Accept: application/vnd.myapp.v1+json

Pros: Clean URLs
Cons: Harder to test, less discoverable
```

**3. Query Parameter**:
```
GET /users/123?version=1

Pros: Easy to implement
Cons: Pollutes query string
```

**Best Practice**: Use URL versioning for major breaking changes.

### Breaking vs Non-Breaking Changes

**Non-Breaking** (No version bump):
```
✅ Adding new endpoints
✅ Adding optional request fields
✅ Adding response fields
✅ Adding new HTTP methods
```

**Breaking** (Requires new version):
```
❌ Removing endpoints
❌ Removing request/response fields
❌ Changing field types
❌ Renaming fields
❌ Changing authentication
```

---

## Authentication & Authorization

### API Key (Simple)

**Request**:
```http
GET /users
X-API-Key: abc123...
```

**Pros**: Simple  
**Cons**: No user context, hard to rotate

**Implementation** (Go):
```go
func apiKeyMiddleware(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		apiKey := r.Header.Get("X-API-Key")
		
		if !isValidAPIKey(apiKey) {
			http.Error(w, "Invalid API Key", http.StatusUnauthorized)
			return
		}
		
		next.ServeHTTP(w, r)
	})
}
```

### JWT (JSON Web Token)

**Flow**:
```
1. Client: POST /login (username, password)
2. Server: Returns JWT token
3. Client: GET /users (Authorization: Bearer <token>)
4. Server: Verifies token, returns data
```

**JWT Structure**:
```
eyJhbGc... (Header: algorithm)
.eyJzdWI... (Payload: user data)
.SflKxwR... (Signature: verify integrity)
```

**Implementation** (Python):
```python
import jwt
from datetime import datetime, timedelta

SECRET_KEY = "your-secret-key"

def generate_token(user_id):
    payload = {
        'user_id': user_id,
        'exp': datetime.utcnow() + timedelta(hours=1),
        'iat': datetime.utcnow()
    }
    return jwt.encode(payload, SECRET_KEY, algorithm='HS256')

def verify_token(token):
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=['HS256'])
        return payload['user_id']
    except jwt.ExpiredSignatureError:
        raise Exception("Token expired")
    except jwt.InvalidTokenError:
        raise Exception("Invalid token")

# Usage
@app.route('/login', methods=['POST'])
def login():
    # Verify credentials...
    token = generate_token(user_id=123)
    return jsonify({'token': token})

@app.route('/users', methods=['GET'])
def get_users():
    token = request.headers.get('Authorization').replace('Bearer ', '')
    user_id = verify_token(token)
    # Fetch users...
```

### OAuth 2.0 (Third-Party)

**Flow** (Authorization Code):
```
1. Client: Redirect to /authorize
2. User: Logs in, grants permission
3. Server: Redirects back with code
4. Client: POST /token (code)
5. Server: Returns access_token
6. Client: GET /users (Authorization: Bearer <access_token>)
```

---

## GraphQL

### What is GraphQL?

**Alternative to REST**:
- Client specifies exactly what data it needs
- Single endpoint (`/graphql`)
- Strongly typed schema

**Example**:
```graphql
# Query (Client specifies fields)
query {
  user(id: 123) {
    name
    email
    posts {
      title
      comments {
        text
      }
    }
  }
}

# Response
{
  "data": {
    "user": {
      "name": "Alice",
      "email": "alice@example.com",
      "posts": [
        {
          "title": "Hello World",
          "comments": [
            {"text": "Great post!"}
          ]
        }
      ]
    }
  }
}
```

### GraphQL vs REST

| Aspect | REST | GraphQL |
|--------|------|---------|
| **Endpoints** | Multiple (`/users`, `/posts`) | Single (`/graphql`) |
| **Data Fetching** | Over-fetching / Under-fetching | Precise |
| **Versioning** | URL versioning | Schema evolution |
| **Caching** | HTTP caching | Complex |
| **Learning Curve** | Low | Medium |

**Use REST when**:
- Simple CRUD
- HTTP caching important
- Public API

**Use GraphQL when**:
- Complex, nested data
- Mobile apps (bandwidth-sensitive)
- Rapid iteration

### GraphQL Implementation (Python)

```python
import graphene
from graphene import ObjectType, String, Int, List, Schema

class Comment(ObjectType):
    text = String()

class Post(ObjectType):
    title = String()
    comments = List(Comment)

class User(ObjectType):
    id = Int()
    name = String()
    email = String()
    posts = List(Post)

class Query(ObjectType):
    user = graphene.Field(User, id=Int(required=True))
    
    def resolve_user(self, info, id):
        # Fetch from database
        return {
            'id': id,
            'name': 'Alice',
            'email': 'alice@example.com',
            'posts': [
                {
                    'title': 'Hello World',
                    'comments': [{'text': 'Great!'}]
                }
            ]
        }

schema = Schema(query=Query)

# Execute query
query = '''
    query {
        user(id: 123) {
            name
            posts {
                title
            }
        }
    }
'''
result = schema.execute(query)
print(result.data)
```

---

## WebSockets

### What are WebSockets?

**WebSockets**: Full-duplex, bidirectional communication protocol over a single TCP connection.

**Key Characteristics**:
```
- Persistent connection (not request/response like HTTP)
- Real-time, low-latency communication
- Both client and server can send messages anytime
- Built on top of HTTP (upgrades from HTTP to WebSocket)
```

**WebSocket Handshake**:
```http
# Client Request
GET /chat HTTP/1.1
Host: example.com
Upgrade: websocket
Connection: Upgrade
Sec-WebSocket-Key: dGhlIHNhbXBsZSBub25jZQ==
Sec-WebSocket-Version: 13

# Server Response
HTTP/1.1 101 Switching Protocols
Upgrade: websocket
Connection: Upgrade
Sec-WebSocket-Accept: s3pPLMBiTxaQ9kYGzzhZRbK+xOo=
```

### When to Use WebSockets

**Use Cases**:
```
✅ Chat applications (real-time messaging)
✅ Live feeds (social media, news)
✅ Multiplayer games
✅ Collaborative editing (Google Docs style)
✅ Live sports scores
✅ Trading platforms (stock prices)
✅ IoT device communication
✅ Real-time notifications
```

**Don't Use When**:
```
❌ Simple CRUD operations (use REST)
❌ Infrequent updates (use polling or SSE)
❌ One-way data flow (use SSE)
❌ Need HTTP caching
❌ Stateless architecture required
```

### WebSockets vs Other Technologies

| Feature | WebSockets | SSE | HTTP Polling | REST |
|---------|-----------|-----|--------------|------|
| **Direction** | Bi-directional | Server → Client | Client → Server | Client → Server |
| **Connection** | Persistent | Persistent | Multiple | Multiple |
| **Protocol** | WebSocket (ws://) | HTTP | HTTP | HTTP |
| **Browser Support** | Excellent | Good | Universal | Universal |
| **Complexity** | Medium | Low | Low | Low |
| **Latency** | Very Low | Low | High | Medium |
| **Reconnection** | Manual | Automatic | N/A | N/A |

### Pros & Cons

**Pros**:
```
✅ Low latency (no HTTP overhead after handshake)
✅ Bidirectional (server can push without request)
✅ Efficient (single persistent connection)
✅ Real-time updates
✅ Lower bandwidth than polling
```

**Cons**:
```
❌ More complex than REST
❌ Harder to scale (stateful connections)
❌ No HTTP caching
❌ Requires load balancer with sticky sessions
❌ Firewalls/proxies may block
❌ Manual reconnection logic needed
```

### Cost & Trade-offs

**Infrastructure Cost**:
```
- Higher server memory (persistent connections)
- Need Redis/message broker for multi-server scaling
- Load balancers: ~$20-100/month (AWS ALB with WebSocket support)
- Cloud WebSocket services:
  - AWS API Gateway WebSocket: $1/million messages + $0.25/million connection minutes
  - Pusher: $49-499/month (100-500 concurrent connections)
  - Ably: $29-399/month
```

**Trade-offs**:
```
Scalability: Stateful connections harder to scale than REST
Complexity: More code for connection management
Reliability: Need reconnection, heartbeat logic
Monitoring: Harder to debug than HTTP requests
```

### WebSocket Implementation (Python)

**Server** (Using `websockets` library):
```python
# pip install websockets

import asyncio
import websockets
import json
from datetime import datetime

# Store connected clients
connected_clients = set()

async def chat_handler(websocket, path):
    """Handle WebSocket connections"""
    # Register client
    connected_clients.add(websocket)
    print(f"Client connected. Total clients: {len(connected_clients)}")
    
    try:
        # Send welcome message
        await websocket.send(json.dumps({
            'type': 'welcome',
            'message': 'Connected to chat server',
            'timestamp': datetime.utcnow().isoformat()
        }))
        
        # Listen for messages
        async for message in websocket:
            data = json.loads(message)
            print(f"Received: {data}")
            
            # Broadcast to all clients
            if data['type'] == 'chat':
                response = {
                    'type': 'message',
                    'user': data['user'],
                    'text': data['text'],
                    'timestamp': datetime.utcnow().isoformat()
                }
                
                # Send to all connected clients
                websockets.broadcast(connected_clients, json.dumps(response))
            
            # Handle ping (heartbeat)
            elif data['type'] == 'ping':
                await websocket.send(json.dumps({'type': 'pong'}))
    
    except websockets.exceptions.ConnectionClosed:
        print("Client disconnected")
    
    finally:
        # Unregister client
        connected_clients.remove(websocket)
        print(f"Client removed. Total clients: {len(connected_clients)}")

async def main():
    async with websockets.serve(chat_handler, "localhost", 8765):
        print("WebSocket server started on ws://localhost:8765")
        await asyncio.Future()  # Run forever

if __name__ == "__main__":
    asyncio.run(main())
```

**Client** (Python):
```python
import asyncio
import websockets
import json

async def chat_client():
    uri = "ws://localhost:8765"
    
    async with websockets.connect(uri) as websocket:
        print("Connected to server")
        
        # Send chat message
        await websocket.send(json.dumps({
            'type': 'chat',
            'user': 'Alice',
            'text': 'Hello, World!'
        }))
        
        # Receive messages
        async for message in websocket:
            data = json.loads(message)
            print(f"Received: {data}")

asyncio.run(chat_client())
```

**Client** (JavaScript/Browser):
```javascript
const socket = new WebSocket('ws://localhost:8765');

socket.addEventListener('open', (event) => {
    console.log('Connected to server');
    
    // Send message
    socket.send(JSON.stringify({
        type: 'chat',
        user: 'Alice',
        text: 'Hello from browser!'
    }));
});

socket.addEventListener('message', (event) => {
    const data = JSON.parse(event.data);
    console.log('Received:', data);
});

socket.addEventListener('close', (event) => {
    console.log('Disconnected');
});

socket.addEventListener('error', (error) => {
    console.error('WebSocket error:', error);
});
```

### WebSocket Implementation (Go)

**Server** (Using `gorilla/websocket`):
```go
// go get github.com/gorilla/websocket

package main

import (
    "encoding/json"
    "log"
    "net/http"
    "sync"
    "time"
    
    "github.com/gorilla/websocket"
)

var upgrader = websocket.Upgrader{
    CheckOrigin: func(r *http.Request) bool {
        return true // Allow all origins (configure properly in production)
    },
}

type Message struct {
    Type      string    `json:"type"`
    User      string    `json:"user,omitempty"`
    Text      string    `json:"text,omitempty"`
    Timestamp time.Time `json:"timestamp"`
}

type Client struct {
    conn *websocket.Conn
    send chan []byte
}

type Hub struct {
    clients    map[*Client]bool
    broadcast  chan []byte
    register   chan *Client
    unregister chan *Client
    mu         sync.Mutex
}

func newHub() *Hub {
    return &Hub{
        clients:    make(map[*Client]bool),
        broadcast:  make(chan []byte),
        register:   make(chan *Client),
        unregister: make(chan *Client),
    }
}

func (h *Hub) run() {
    for {
        select {
        case client := <-h.register:
            h.mu.Lock()
            h.clients[client] = true
            h.mu.Unlock()
            log.Printf("Client connected. Total: %d", len(h.clients))
            
        case client := <-h.unregister:
            h.mu.Lock()
            if _, ok := h.clients[client]; ok {
                delete(h.clients, client)
                close(client.send)
            }
            h.mu.Unlock()
            log.Printf("Client disconnected. Total: %d", len(h.clients))
            
        case message := <-h.broadcast:
            h.mu.Lock()
            for client := range h.clients {
                select {
                case client.send <- message:
                default:
                    close(client.send)
                    delete(h.clients, client)
                }
            }
            h.mu.Unlock()
        }
    }
}

func (c *Client) readPump(hub *Hub) {
    defer func() {
        hub.unregister <- c
        c.conn.Close()
    }()
    
    c.conn.SetReadDeadline(time.Now().Add(60 * time.Second))
    c.conn.SetPongHandler(func(string) error {
        c.conn.SetReadDeadline(time.Now().Add(60 * time.Second))
        return nil
    })
    
    for {
        _, message, err := c.conn.ReadMessage()
        if err != nil {
            break
        }
        
        var msg Message
        if err := json.Unmarshal(message, &msg); err != nil {
            continue
        }
        
        // Add timestamp
        msg.Timestamp = time.Now()
        
        // Broadcast to all clients
        data, _ := json.Marshal(msg)
        hub.broadcast <- data
    }
}

func (c *Client) writePump() {
    ticker := time.NewTicker(54 * time.Second)
    defer func() {
        ticker.Stop()
        c.conn.Close()
    }()
    
    for {
        select {
        case message, ok := <-c.send:
            c.conn.SetWriteDeadline(time.Now().Add(10 * time.Second))
            if !ok {
                c.conn.WriteMessage(websocket.CloseMessage, []byte{})
                return
            }
            
            if err := c.conn.WriteMessage(websocket.TextMessage, message); err != nil {
                return
            }
            
        case <-ticker.C:
            c.conn.SetWriteDeadline(time.Now().Add(10 * time.Second))
            if err := c.conn.WriteMessage(websocket.PingMessage, nil); err != nil {
                return
            }
        }
    }
}

func handleWebSocket(hub *Hub, w http.ResponseWriter, r *http.Request) {
    conn, err := upgrader.Upgrade(w, r, nil)
    if err != nil {
        log.Println(err)
        return
    }
    
    client := &Client{
        conn: conn,
        send: make(chan []byte, 256),
    }
    
    hub.register <- client
    
    // Send welcome message
    welcome := Message{
        Type:      "welcome",
        Text:      "Connected to chat server",
        Timestamp: time.Now(),
    }
    data, _ := json.Marshal(welcome)
    client.send <- data
    
    go client.writePump()
    go client.readPump(hub)
}

func main() {
    hub := newHub()
    go hub.run()
    
    http.HandleFunc("/ws", func(w http.ResponseWriter, r *http.Request) {
        handleWebSocket(hub, w, r)
    })
    
    log.Println("WebSocket server started on :8765")
    log.Fatal(http.ListenAndServe(":8765", nil))
}
```

### Advanced WebSocket Patterns

**1. Authentication**:
```python
async def authenticated_handler(websocket, path):
    # Get token from query string or first message
    token = websocket.request_headers.get('Authorization')
    
    if not verify_token(token):
        await websocket.close(1008, "Unauthorized")
        return
    
    user_id = get_user_from_token(token)
    # Continue with authenticated connection...
```

**2. Rooms/Channels** (Go):
```go
type Room struct {
    name    string
    clients map[*Client]bool
    mu      sync.Mutex
}

type Hub struct {
    rooms map[string]*Room
}

func (h *Hub) joinRoom(client *Client, roomName string) {
    h.mu.Lock()
    defer h.mu.Unlock()
    
    room, exists := h.rooms[roomName]
    if !exists {
        room = &Room{
            name:    roomName,
            clients: make(map[*Client]bool),
        }
        h.rooms[roomName] = room
    }
    
    room.mu.Lock()
    room.clients[client] = true
    room.mu.Unlock()
}

func (h *Hub) broadcastToRoom(roomName string, message []byte) {
    room, exists := h.rooms[roomName]
    if !exists {
        return
    }
    
    room.mu.Lock()
    defer room.mu.Unlock()
    
    for client := range room.clients {
        client.send <- message
    }
}
```

**3. Reconnection** (JavaScript):
```javascript
class ReconnectingWebSocket {
    constructor(url) {
        this.url = url;
        this.reconnectDelay = 1000;
        this.maxReconnectDelay = 30000;
        this.connect();
    }
    
    connect() {
        this.ws = new WebSocket(this.url);
        
        this.ws.onopen = () => {
            console.log('Connected');
            this.reconnectDelay = 1000;
        };
        
        this.ws.onclose = () => {
            console.log(`Reconnecting in ${this.reconnectDelay}ms...`);
            setTimeout(() => this.connect(), this.reconnectDelay);
            this.reconnectDelay = Math.min(
                this.reconnectDelay * 2,
                this.maxReconnectDelay
            );
        };
        
        this.ws.onerror = (error) => {
            console.error('WebSocket error:', error);
        };
    }
    
    send(data) {
        if (this.ws.readyState === WebSocket.OPEN) {
            this.ws.send(data);
        }
    }
}

const socket = new ReconnectingWebSocket('ws://localhost:8765');
```

### Scaling WebSockets

**Challenge**: Stateful connections don't work with round-robin load balancing.

**Solutions**:

**1. Sticky Sessions** (Load Balancer):
```nginx
# Nginx
upstream websocket_backend {
    ip_hash;  # Route same IP to same server
    server backend1.example.com:8765;
    server backend2.example.com:8765;
}

server {
    location /ws {
        proxy_pass http://websocket_backend;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
    }
}
```

**2. Redis Pub/Sub** (Multi-server):
```python
import asyncio
import websockets
import redis.asyncio as redis
import json

class WebSocketServer:
    def __init__(self):
        self.clients = set()
        self.redis = None
    
    async def setup_redis(self):
        self.redis = await redis.from_url('redis://localhost')
        asyncio.create_task(self.redis_subscriber())
    
    async def redis_subscriber(self):
        pubsub = self.redis.pubsub()
        await pubsub.subscribe('chat')
        
        async for message in pubsub.listen():
            if message['type'] == 'message':
                data = message['data']
                # Broadcast to local clients
                websockets.broadcast(self.clients, data)
    
    async def handler(self, websocket, path):
        self.clients.add(websocket)
        
        try:
            async for message in websocket:
                # Publish to Redis (all servers receive)
                await self.redis.publish('chat', message)
        finally:
            self.clients.remove(websocket)

server = WebSocketServer()
# Start server...
```

### Configuration Best Practices

```python
# Production configuration
WEBSOCKET_CONFIG = {
    'ping_interval': 20,        # Send ping every 20s
    'ping_timeout': 10,         # Wait 10s for pong
    'close_timeout': 10,        # Wait 10s for close handshake
    'max_size': 1024 * 1024,    # Max message size (1MB)
    'max_queue': 32,            # Max queued messages
    'compression': 'deflate',   # Enable compression
}
```

### Open Source & Commercial Tools

**Open Source**:
- **Socket.IO** (JavaScript): WebSocket + fallbacks, rooms, broadcasting
- **Gorilla WebSocket** (Go): Low-level WebSocket library
- **websockets** (Python): asyncio-based WebSocket library
- **uWebSockets** (C++): High-performance WebSocket server

**Commercial/Managed**:
- **Pusher** ($49-499/month): Managed WebSocket service
- **Ably** ($29-399/month): Real-time messaging platform
- **AWS API Gateway WebSocket**: Serverless WebSocket API
- **Firebase Realtime Database**: Real-time data sync
- **SignalR** (Microsoft): .NET real-time framework

---

## Server-Sent Events (SSE)

### What is SSE?

**Server-Sent Events**: One-way, server-to-client push over HTTP.

**Key Characteristics**:
```
- Unidirectional (Server → Client only)
- Built on HTTP (uses EventSource API)
- Automatic reconnection
- Simple text-based protocol
- Event IDs for missed events
```

**SSE Format**:
```
event: message
id: 123
data: {"text": "Hello, World!"}

event: update
data: {"status": "processing"}

data: Simple message
```

### When to Use SSE

**Use Cases**:
```
✅ Live news feeds
✅ Stock price updates
✅ Social media notifications
✅ Server monitoring dashboards
✅ Progress updates (file uploads, jobs)
✅ Live sports scores
✅ Server logs streaming
```

**Don't Use When**:
```
❌ Need bidirectional communication (use WebSockets)
❌ Binary data (use WebSockets)
❌ Client → Server messages needed
❌ IE/Edge support required (use WebSockets or polling)
```

### SSE vs WebSockets vs Polling

| Feature | SSE | WebSockets | Long Polling |
|---------|-----|-----------|--------------|
| **Direction** | Server → Client | Bi-directional | Client → Server |
| **Protocol** | HTTP | WebSocket | HTTP |
| **Reconnection** | Automatic | Manual | N/A |
| **Complexity** | Very Low | Medium | Low |
| **Browser Support** | Good (not IE) | Excellent | Universal |
| **Use Case** | Updates/Streams | Chat, Games | Fallback |

### Pros & Cons

**Pros**:
```
✅ Simple (just HTTP)
✅ Automatic reconnection
✅ Event IDs (resume from last event)
✅ Works through proxies/firewalls
✅ Less complex than WebSockets
✅ HTTP/2 multiplexing support
```

**Cons**:
```
❌ One-way only (server to client)
❌ Text-based (no binary)
❌ Limited browser support (no IE/old Edge)
❌ Connection limit (6 per domain in browsers)
❌ No built-in authentication (use headers)
```

### Cost & Trade-offs

**Infrastructure Cost**:
```
- Similar to HTTP long-polling
- Lower than WebSockets (stateless)
- Cloud costs:
  - AWS: Standard HTTP pricing
  - Cloudflare: Free on most plans
  - No special infrastructure needed
```

**Trade-offs**:
```
Simplicity: Much simpler than WebSockets
Scalability: Easier to scale (less stateful than WebSockets)
Functionality: Limited to server → client
Browser Support: Not supported in IE
```

### SSE Implementation (Python)

**Server** (Flask):
```python
from flask import Flask, Response, stream_with_context
import time
import json
from datetime import datetime

app = Flask(__name__)

def generate_events():
    """Generate SSE events"""
    event_id = 0
    
    while True:
        event_id += 1
        
        # Send current time every second
        data = {
            'timestamp': datetime.utcnow().isoformat(),
            'value': event_id
        }
        
        # SSE format: "data: <json>\n\n"
        yield f"id: {event_id}\n"
        yield f"event: update\n"
        yield f"data: {json.dumps(data)}\n\n"
        
        time.sleep(1)

@app.route('/events')
def events():
    """SSE endpoint"""
    return Response(
        stream_with_context(generate_events()),
        mimetype='text/event-stream',
        headers={
            'Cache-Control': 'no-cache',
            'X-Accel-Buffering': 'no'  # Disable nginx buffering
        }
    )

@app.route('/news')
def news_feed():
    """News updates example"""
    def generate():
        news_items = [
            "Breaking: New API released",
            "Update: Server maintenance at 2am",
            "Alert: High traffic detected"
        ]
        
        for idx, news in enumerate(news_items):
            yield f"id: {idx}\n"
            yield f"data: {json.dumps({'news': news})}\n\n"
            time.sleep(2)
    
    return Response(generate(), mimetype='text/event-stream')

if __name__ == '__main__':
    app.run(debug=True, threaded=True)
```

**Client** (JavaScript):
```javascript
const eventSource = new EventSource('http://localhost:5000/events');

// Listen for 'update' events
eventSource.addEventListener('update', (event) => {
    const data = JSON.parse(event.data);
    console.log('Update:', data);
    console.log('Event ID:', event.lastEventId);
});

// Listen for any message
eventSource.onmessage = (event) => {
    console.log('Message:', event.data);
};

// Handle errors
eventSource.onerror = (error) => {
    console.error('SSE error:', error);
    // EventSource automatically reconnects
};

// Close connection
// eventSource.close();
```

**Client** (Python):
```python
import sseclient  # pip install sseclient-py
import requests

def listen_to_events():
    response = requests.get('http://localhost:5000/events', stream=True)
    client = sseclient.SSEClient(response)
    
    for event in client.events():
        print(f"Event: {event.event}")
        print(f"Data: {event.data}")
        print(f"ID: {event.id}")

listen_to_events()
```

### SSE Implementation (Go)

**Server**:
```go
package main

import (
    "encoding/json"
    "fmt"
    "log"
    "net/http"
    "time"
)

type Event struct {
    ID    int       `json:"id"`
    Data  string    `json:"data"`
    Time  time.Time `json:"time"`
}

func sseHandler(w http.ResponseWriter, r *http.Request) {
    // Set SSE headers
    w.Header().Set("Content-Type", "text/event-stream")
    w.Header().Set("Cache-Control", "no-cache")
    w.Header().Set("Connection", "keep-alive")
    w.Header().Set("Access-Control-Allow-Origin", "*")
    
    flusher, ok := w.(http.Flusher)
    if !ok {
        http.Error(w, "Streaming unsupported", http.StatusInternalServerError)
        return
    }
    
    // Send events
    eventID := 0
    ticker := time.NewTicker(1 * time.Second)
    defer ticker.Stop()
    
    // Listen for client disconnect
    ctx := r.Context()
    
    for {
        select {
        case <-ctx.Done():
            log.Println("Client disconnected")
            return
            
        case <-ticker.C:
            eventID++
            
            event := Event{
                ID:   eventID,
                Data: fmt.Sprintf("Event %d", eventID),
                Time: time.Now(),
            }
            
            data, _ := json.Marshal(event)
            
            // Send SSE formatted event
            fmt.Fprintf(w, "id: %d\n", eventID)
            fmt.Fprintf(w, "event: update\n")
            fmt.Fprintf(w, "data: %s\n\n", data)
            
            flusher.Flush()
        }
    }
}

func main() {
    http.HandleFunc("/events", sseHandler)
    
    log.Println("SSE server started on :8080")
    log.Fatal(http.ListenAndServe(":8080", nil))
}
```

### Advanced SSE Patterns

**1. Authentication**:
```python
from flask import request

@app.route('/events')
def authenticated_events():
    # Check token
    token = request.headers.get('Authorization')
    if not verify_token(token):
        return "Unauthorized", 401
    
    def generate():
        # Generate events for authenticated user...
        pass
    
    return Response(generate(), mimetype='text/event-stream')
```

**2. Resume from Last Event**:
```javascript
// Client sends Last-Event-ID header on reconnect
const eventSource = new EventSource('/events');

eventSource.addEventListener('message', (event) => {
    // Save last event ID
    localStorage.setItem('lastEventId', event.lastEventId);
});
```

```python
from flask import request

@app.route('/events')
def resumable_events():
    # Get last event ID from client
    last_event_id = request.headers.get('Last-Event-ID', 0)
    
    def generate():
        event_id = int(last_event_id)
        
        # Send only events after last_event_id
        for event in get_events_after(event_id):
            yield f"id: {event.id}\n"
            yield f"data: {json.dumps(event.data)}\n\n"
    
    return Response(generate(), mimetype='text/event-stream')
```

**3. Multiple Event Types**:
```python
def generate():
    # Different event types
    yield "event: user-joined\n"
    yield f"data: {json.dumps({'user': 'Alice'})}\n\n"
    
    yield "event: message\n"
    yield f"data: {json.dumps({'text': 'Hello'})}\n\n"
    
    yield "event: user-left\n"
    yield f"data: {json.dumps({'user': 'Bob'})}\n\n"
```

```javascript
eventSource.addEventListener('user-joined', (e) => {
    console.log('User joined:', JSON.parse(e.data));
});

eventSource.addEventListener('message', (e) => {
    console.log('Message:', JSON.parse(e.data));
});

eventSource.addEventListener('user-left', (e) => {
    console.log('User left:', JSON.parse(e.data));
});
```

### Configuration Best Practices

```python
SSE_CONFIG = {
    'reconnection_time': 3000,  # Client retry after 3s (sent via retry field)
    'heartbeat_interval': 15,   # Send comment every 15s to keep alive
    'max_message_size': 64 * 1024,  # 64KB per message
}

def generate_with_heartbeat():
    last_heartbeat = time.time()
    
    while True:
        # Send heartbeat (comment) to keep connection alive
        if time.time() - last_heartbeat > SSE_CONFIG['heartbeat_interval']:
            yield ": heartbeat\n\n"
            last_heartbeat = time.time()
        
        # Send actual events...
```

### Scaling SSE

**Nginx Configuration**:
```nginx
location /events {
    proxy_pass http://backend;
    proxy_set_header Connection '';
    proxy_http_version 1.1;
    chunked_transfer_encoding off;
    proxy_buffering off;
    proxy_cache off;
}
```

**Redis Pub/Sub** (Multi-server):
```python
import redis

r = redis.Redis()
pubsub = r.pubsub()
pubsub.subscribe('events')

@app.route('/events')
def events():
    def generate():
        for message in pubsub.listen():
            if message['type'] == 'message':
                yield f"data: {message['data'].decode()}\n\n"
    
    return Response(generate(), mimetype='text/event-stream')

# Publish from any server
@app.route('/publish', methods=['POST'])
def publish():
    data = request.json
    r.publish('events', json.dumps(data))
    return "OK"
```

### Open Source & Commercial Tools

**Open Source**:
- **Flask-SSE** (Python): SSE for Flask
- **Mercure** (Go): Modern SSE hub with pub/sub
- **SSE-Channel** (Node.js): SSE server for Node

**Commercial**:
- **Ably** (SSE adapter available)
- **Pusher** (HTTP streaming API)
- Most don't specialize in SSE (use WebSockets)

---

## Webhooks

### What are Webhooks?

**Webhooks**: HTTP callbacks (reverse API) where the server notifies the client by making HTTP requests.

**Key Characteristics**:
```
- Event-driven (triggered by events)
- Server → Server communication
- HTTP POST requests
- Asynchronous notifications
- No persistent connection
```

**Flow**:
```
1. Client registers webhook URL with Server
2. Event occurs on Server
3. Server sends HTTP POST to Client's webhook URL
4. Client processes event and responds 200 OK
```

### When to Use Webhooks

**Use Cases**:
```
✅ Payment notifications (Stripe, PayPal)
✅ Git events (GitHub, GitLab push notifications)
✅ CI/CD triggers
✅ Email events (SendGrid delivery status)
✅ SMS notifications (Twilio)
✅ CRM updates (Salesforce)
✅ E-commerce order updates (Shopify)
✅ Chat bot commands (Slack, Discord)
```

**Don't Use When**:
```
❌ Need real-time bidirectional communication (use WebSockets)
❌ Client is browser (webhooks are server-to-server)
❌ Need guaranteed delivery order
❌ Synchronous responses required
```

### Webhooks vs Other Technologies

| Feature | Webhooks | Polling | WebSockets |
|---------|----------|---------|-----------|
| **Direction** | Server → Server | Client → Server | Bi-directional |
| **Trigger** | Event-driven | Scheduled | Real-time |
| **Connection** | Per-event HTTP | Repeated HTTP | Persistent |
| **Latency** | Low | High | Very Low |
| **Complexity** | Low | Very Low | Medium |
| **Efficiency** | High | Low (wasted requests) | High |

### Pros & Cons

**Pros**:
```
✅ Event-driven (no polling needed)
✅ Efficient (only when events occur)
✅ Simple HTTP POST
✅ Widely supported
✅ Low latency
✅ Decoupled architecture
```

**Cons**:
```
❌ Requires public endpoint
❌ No guaranteed delivery (need retries)
❌ Difficult to debug (asynchronous)
❌ Security concerns (validate requests)
❌ No ordering guarantee
❌ Firewall issues
```

### Cost & Trade-offs

**Infrastructure Cost**:
```
- Need public server endpoint ($5-10/month for basic VPS)
- SSL certificate (free with Let's Encrypt)
- Cloud webhook services:
  - Hookdeck: Free-$250/month
  - Webhook.site: Free for testing
  - Svix: $0-200/month
```

**Trade-offs**:
```
Reliability: Need retry logic and idempotency
Security: Must verify webhook signatures
Debugging: Harder than synchronous APIs
Delivery: No guarantee (use queues for critical events)
```

### Webhook Implementation (Python)

**Server** (Sending Webhooks):
```python
from flask import Flask, request, jsonify
import requests
import hmac
import hashlib
import time
from datetime import datetime

app = Flask(__name__)

# Store webhook URLs
WEBHOOK_SUBSCRIBERS = []
WEBHOOK_SECRET = "your-secret-key"

@app.route('/webhooks/subscribe', methods=['POST'])
def subscribe():
    """Register webhook URL"""
    data = request.json
    webhook_url = data.get('url')
    
    if webhook_url:
        WEBHOOK_SUBSCRIBERS.append(webhook_url)
        return jsonify({'message': 'Webhook registered', 'url': webhook_url}), 201
    
    return jsonify({'error': 'Invalid URL'}), 400

def generate_signature(payload, secret):
    """Generate HMAC signature for webhook"""
    return hmac.new(
        secret.encode(),
        payload.encode(),
        hashlib.sha256
    ).hexdigest()

def send_webhook(event_type, data):
    """Send webhook to all subscribers"""
    payload = {
        'event': event_type,
        'data': data,
        'timestamp': datetime.utcnow().isoformat()
    }
    
    payload_json = json.dumps(payload)
    signature = generate_signature(payload_json, WEBHOOK_SECRET)
    
    headers = {
        'Content-Type': 'application/json',
        'X-Webhook-Signature': signature,
        'X-Webhook-Event': event_type
    }
    
    for url in WEBHOOK_SUBSCRIBERS:
        try:
            response = requests.post(
                url,
                data=payload_json,
                headers=headers,
                timeout=5
            )
            
            if response.status_code == 200:
                print(f"Webhook sent to {url}")
            else:
                print(f"Webhook failed: {response.status_code}")
                # Implement retry logic here
        
        except requests.exceptions.RequestException as e:
            print(f"Webhook error: {e}")
            # Log for retry

@app.route('/orders', methods=['POST'])
def create_order():
    """Create order and trigger webhook"""
    order_data = request.json
    
    # Save order...
    order_id = 123
    
    # Send webhook notification
    send_webhook('order.created', {
        'order_id': order_id,
        'customer': order_data['customer'],
        'total': order_data['total']
    })
    
    return jsonify({'order_id': order_id}), 201

if __name__ == '__main__':
    app.run(debug=True)
```

**Client** (Receiving Webhooks):
```python
from flask import Flask, request, jsonify
import hmac
import hashlib

app = Flask(__name__)

WEBHOOK_SECRET = "your-secret-key"

def verify_signature(payload, signature):
    """Verify webhook signature"""
    expected = hmac.new(
        WEBHOOK_SECRET.encode(),
        payload,
        hashlib.sha256
    ).hexdigest()
    
    return hmac.compare_digest(signature, expected)

@app.route('/webhook', methods=['POST'])
def webhook_handler():
    """Handle incoming webhook"""
    
    # Verify signature
    signature = request.headers.get('X-Webhook-Signature')
    if not verify_signature(request.data, signature):
        return jsonify({'error': 'Invalid signature'}), 401
    
    # Parse event
    data = request.json
    event_type = data['event']
    
    # Process based on event type
    if event_type == 'order.created':
        order = data['data']
        print(f"New order: {order['order_id']}")
        # Process order...
    
    elif event_type == 'order.cancelled':
        order = data['data']
        print(f"Order cancelled: {order['order_id']}")
        # Handle cancellation...
    
    # Always return 200 OK quickly
    return jsonify({'status': 'received'}), 200

if __name__ == '__main__':
    app.run(port=5001)
```

### Webhook Implementation (Go)

**Server** (Sending Webhooks):
```go
package main

import (
    "bytes"
    "crypto/hmac"
    "crypto/sha256"
    "encoding/hex"
    "encoding/json"
    "fmt"
    "log"
    "net/http"
    "time"
)

const webhookSecret = "your-secret-key"

var webhookSubscribers = []string{}

type WebhookPayload struct {
    Event     string      `json:"event"`
    Data      interface{} `json:"data"`
    Timestamp string      `json:"timestamp"`
}

func generateSignature(payload []byte) string {
    mac := hmac.New(sha256.New, []byte(webhookSecret))
    mac.Write(payload)
    return hex.EncodeToString(mac.Sum(nil))
}

func sendWebhook(eventType string, data interface{}) {
    payload := WebhookPayload{
        Event:     eventType,
        Data:      data,
        Timestamp: time.Now().UTC().Format(time.RFC3339),
    }
    
    payloadJSON, _ := json.Marshal(payload)
    signature := generateSignature(payloadJSON)
    
    for _, url := range webhookSubscribers {
        go func(webhookURL string) {
            req, _ := http.NewRequest("POST", webhookURL, bytes.NewBuffer(payloadJSON))
            req.Header.Set("Content-Type", "application/json")
            req.Header.Set("X-Webhook-Signature", signature)
            req.Header.Set("X-Webhook-Event", eventType)
            
            client := &http.Client{Timeout: 5 * time.Second}
            resp, err := client.Do(req)
            
            if err != nil {
                log.Printf("Webhook error: %v", err)
                // Implement retry logic
                return
            }
            defer resp.Body.Close()
            
            if resp.StatusCode == 200 {
                log.Printf("Webhook sent to %s", webhookURL)
            } else {
                log.Printf("Webhook failed: %d", resp.StatusCode)
            }
        }(url)
    }
}

func subscribeWebhook(w http.ResponseWriter, r *http.Request) {
    var data struct {
        URL string `json:"url"`
    }
    
    json.NewDecoder(r.Body).Decode(&data)
    
    if data.URL != "" {
        webhookSubscribers = append(webhookSubscribers, data.URL)
        json.NewEncoder(w).Encode(map[string]string{
            "message": "Webhook registered",
            "url":     data.URL,
        })
    }
}

func createOrder(w http.ResponseWriter, r *http.Request) {
    var order map[string]interface{}
    json.NewDecoder(r.Body).Decode(&order)
    
    orderID := 123
    
    // Send webhook
    sendWebhook("order.created", map[string]interface{}{
        "order_id": orderID,
        "customer": order["customer"],
        "total":    order["total"],
    })
    
    w.WriteHeader(http.StatusCreated)
    json.NewEncoder(w).Encode(map[string]int{"order_id": orderID})
}

func main() {
    http.HandleFunc("/webhooks/subscribe", subscribeWebhook)
    http.HandleFunc("/orders", createOrder)
    
    log.Println("Server started on :8080")
    log.Fatal(http.ListenAndServe(":8080", nil))
}
```

**Client** (Receiving Webhooks):
```go
package main

import (
    "crypto/hmac"
    "crypto/sha256"
    "encoding/hex"
    "encoding/json"
    "io"
    "log"
    "net/http"
)

const webhookSecret = "your-secret-key"

type WebhookPayload struct {
    Event     string                 `json:"event"`
    Data      map[string]interface{} `json:"data"`
    Timestamp string                 `json:"timestamp"`
}

func verifySignature(payload []byte, signature string) bool {
    mac := hmac.New(sha256.New, []byte(webhookSecret))
    mac.Write(payload)
    expected := hex.EncodeToString(mac.Sum(nil))
    return hmac.Equal([]byte(signature), []byte(expected))
}

func webhookHandler(w http.ResponseWriter, r *http.Request) {
    // Read body
    body, _ := io.ReadAll(r.Body)
    
    // Verify signature
    signature := r.Header.Get("X-Webhook-Signature")
    if !verifySignature(body, signature) {
        http.Error(w, "Invalid signature", http.StatusUnauthorized)
        return
    }
    
    // Parse payload
    var payload WebhookPayload
    json.Unmarshal(body, &payload)
    
    // Process based on event type
    switch payload.Event {
    case "order.created":
        log.Printf("New order: %v", payload.Data["order_id"])
        // Process order...
    
    case "order.cancelled":
        log.Printf("Order cancelled: %v", payload.Data["order_id"])
        // Handle cancellation...
    }
    
    // Always respond quickly
    w.WriteHeader(http.StatusOK)
    json.NewEncoder(w).Encode(map[string]string{"status": "received"})
}

func main() {
    http.HandleFunc("/webhook", webhookHandler)
    
    log.Println("Webhook receiver on :5001")
    log.Fatal(http.ListenAndServe(":5001", nil))
}
```

### Advanced Webhook Patterns

**1. Retry Logic with Exponential Backoff**:
```python
import time
from requests.adapters import HTTPAdapter
from requests.packages.urllib3.util.retry import Retry

def send_webhook_with_retry(url, payload):
    session = requests.Session()
    retry = Retry(
        total=3,
        backoff_factor=1,  # 1s, 2s, 4s
        status_forcelist=[500, 502, 503, 504]
    )
    adapter = HTTPAdapter(max_retries=retry)
    session.mount('http://', adapter)
    session.mount('https://', adapter)
    
    try:
        response = session.post(url, json=payload, timeout=10)
        return response.status_code == 200
    except Exception as e:
        log_failed_webhook(url, payload, str(e))
        return False
```

**2. Idempotency** (Client side):
```python
# Store processed webhook IDs
processed_webhooks = set()

@app.route('/webhook', methods=['POST'])
def webhook_handler():
    data = request.json
    webhook_id = data.get('id')  # Unique webhook ID from sender
    
    # Check if already processed
    if webhook_id in processed_webhooks:
        return jsonify({'status': 'already_processed'}), 200
    
    # Process webhook...
    process_order(data['data'])
    
    # Mark as processed
    processed_webhooks.add(webhook_id)
    
    return jsonify({'status': 'received'}), 200
```

**3. Webhook Queue** (Reliable delivery):
```python
from celery import Celery

celery = Celery('webhooks', broker='redis://localhost:6379')

@celery.task(bind=True, max_retries=3)
def send_webhook_task(self, url, payload):
    try:
        response = requests.post(url, json=payload, timeout=10)
        if response.status_code != 200:
            raise Exception(f"HTTP {response.status_code}")
    except Exception as e:
        # Retry with exponential backoff
        self.retry(exc=e, countdown=2 ** self.request.retries)

# Usage
def send_webhook(event_type, data):
    payload = {'event': event_type, 'data': data}
    for url in WEBHOOK_SUBSCRIBERS:
        send_webhook_task.delay(url, payload)
```

### Webhook Security Best Practices

**1. Signature Verification**:
```python
# Always verify webhook signatures
def verify_webhook(request):
    signature = request.headers.get('X-Webhook-Signature')
    payload = request.data
    
    expected = hmac.new(
        WEBHOOK_SECRET.encode(),
        payload,
        hashlib.sha256
    ).hexdigest()
    
    if not hmac.compare_digest(signature, expected):
        raise SecurityError("Invalid signature")
```

**2. IP Whitelist**:
```python
ALLOWED_IPS = ['192.168.1.1', '10.0.0.1']

@app.before_request
def check_ip():
    if request.remote_addr not in ALLOWED_IPS:
        abort(403)
```

**3. HTTPS Only**:
```python
@app.before_request
def require_https():
    if not request.is_secure and not app.debug:
        return redirect(request.url.replace('http://', 'https://'))
```

**4. Timestamp Verification**:
```python
from datetime import datetime, timedelta

def verify_timestamp(timestamp_str):
    timestamp = datetime.fromisoformat(timestamp_str)
    now = datetime.utcnow()
    
    # Reject if older than 5 minutes
    if now - timestamp > timedelta(minutes=5):
        raise SecurityError("Webhook too old")
```

### Testing Webhooks

**Local Testing** (ngrok):
```bash
# Install ngrok
# Expose local server to internet
ngrok http 5001

# Use ngrok URL as webhook endpoint
# https://abc123.ngrok.io/webhook
```

**Mock Webhook Testing**:
```python
import pytest
from unittest.mock import patch

def test_webhook_handler():
    with patch('app.process_order') as mock_process:
        response = client.post('/webhook', json={
            'event': 'order.created',
            'data': {'order_id': 123}
        })
        
        assert response.status_code == 200
        mock_process.assert_called_once()
```

### Configuration Best Practices

```python
WEBHOOK_CONFIG = {
    'timeout': 10,              # Request timeout (seconds)
    'max_retries': 3,           # Number of retries
    'retry_delay': 60,          # Initial retry delay (seconds)
    'max_payload_size': 1024 * 1024,  # 1MB
    'signature_algorithm': 'sha256',
    'timestamp_tolerance': 300,  # 5 minutes
}
```

### Open Source & Commercial Tools

**Open Source**:
- **Svix** (Open source): Webhook service/library
- **Hookdeck** (CLI): Webhook testing and debugging
- **webhook** (Go): Simple webhook server

**Commercial/Managed**:
- **Svix** ($0-200/month): Managed webhook infrastructure
- **Hookdeck** (Free-$250/month): Webhook gateway
- **Webhook.site** (Free): Testing webhooks
- **ngrok** (Free-$65/month): Local webhook testing

**Webhook Providers** (send webhooks):
- **Stripe**: Payment webhooks
- **GitHub**: Repository events
- **Twilio**: SMS/Call webhooks
- **SendGrid**: Email events
- **Shopify**: E-commerce webhooks

---

## WebRTC

### What is WebRTC?

**WebRTC** (Web Real-Time Communication): Peer-to-peer audio, video, and data streaming in browsers.

**Key Characteristics**:
```
- Peer-to-peer (direct browser-to-browser)
- Real-time media streaming
- No plugins required
- UDP-based (low latency)
- NAT traversal (STUN/TURN)
- End-to-end encryption
```

**Components**:
```
1. MediaStream: Access camera/microphone
2. RTCPeerConnection: Peer-to-peer audio/video
3. RTCDataChannel: Peer-to-peer data transfer
4. Signaling: Exchange connection info (not part of WebRTC)
```

### When to Use WebRTC

**Use Cases**:
```
✅ Video conferencing (Zoom, Google Meet)
✅ Voice calls (WhatsApp, Discord)
✅ Screen sharing
✅ Live streaming (low latency)
✅ File transfer (P2P)
✅ Gaming (P2P multiplayer)
✅ Remote desktop
✅ IoT device control
```

**Don't Use When**:
```
❌ Simple data sync (use WebSockets/SSE)
❌ No peer-to-peer needed (use WebSockets)
❌ Browser support critical (older browsers)
❌ Complex server-side processing needed
```

### WebRTC vs Other Technologies

| Feature | WebRTC | WebSockets | HTTP Streaming |
|---------|--------|-----------|----------------|
| **Media** | Audio/Video | Data only | Data only |
| **Connection** | Peer-to-peer | Client-Server | Client-Server |
| **Latency** | Very Low (<100ms) | Low | Medium-High |
| **Protocol** | UDP (SRTP/SCTP) | TCP | TCP |
| **NAT Traversal** | Built-in (STUN/TURN) | N/A | N/A |
| **Bandwidth** | Adaptive | Fixed | Fixed |

### Pros & Cons

**Pros**:
```
✅ Peer-to-peer (no server bandwidth)
✅ Very low latency
✅ End-to-end encryption
✅ Adaptive bitrate
✅ Browser built-in (no plugins)
✅ Supports audio, video, data
```

**Cons**:
```
❌ Complex setup (signaling, STUN/TURN)
❌ NAT/firewall issues
❌ Browser compatibility variations
❌ Difficult to scale (mesh topology)
❌ TURN servers costly (fallback)
❌ No guaranteed delivery (UDP)
```

### Cost & Trade-offs

**Infrastructure Cost**:
```
STUN Servers: Free (Google, Twilio)
TURN Servers: $50-500/month (bandwidth costs)
  - AWS EC2 + Coturn: ~$50/month
  - Twilio TURN: $0.0004/minute
  - Xirsys: $50-500/month

Signaling Server: $5-20/month (simple WebSocket server)

Commercial:
  - Agora.io: $0.99-3.99 per 1000 minutes
  - Vonage Video API: $0.0035/minute
  - Daily.co: Free-$99/month
```

**Trade-offs**:
```
Complexity: Much more complex than WebSockets
Scalability: P2P doesn't scale beyond ~4-6 peers (need SFU/MCU)
Reliability: UDP = no guaranteed delivery
Cost: TURN servers expensive for fallback
```

### WebRTC Architecture

**Signaling Flow**:
```
1. Peer A creates offer (SDP)
2. Peer A sends offer to Peer B (via signaling server)
3. Peer B creates answer (SDP)
4. Peer B sends answer to Peer A
5. Exchange ICE candidates
6. Direct P2P connection established
```

**Topology Options**:
```
Mesh: Everyone connects to everyone (max 4-6 peers)
SFU (Selective Forwarding Unit): Server forwards streams (scalable)
MCU (Multipoint Control Unit): Server mixes streams (high CPU)
```

### WebRTC Implementation (Python Signaling Server)

**Signaling Server** (Flask + SocketIO):
```python
# pip install flask flask-socketio python-socketio

from flask import Flask, render_template
from flask_socketio import SocketIO, emit, join_room, leave_room

app = Flask(__name__)
app.config['SECRET_KEY'] = 'secret'
socketio = SocketIO(app, cors_allowed_origins="*")

rooms = {}  # Track users in rooms

@socketio.on('join')
def on_join(data):
    """User joins a room"""
    room = data['room']
    user_id = data['user_id']
    
    join_room(room)
    
    if room not in rooms:
        rooms[room] = []
    rooms[room].append(user_id)
    
    # Notify others in room
    emit('user-joined', {'user_id': user_id}, room=room, skip_sid=request.sid)
    
    # Send list of existing users
    emit('users-in-room', {'users': rooms[room]})

@socketio.on('offer')
def on_offer(data):
    """Forward offer to specific user"""
    emit('offer', {
        'from': data['from'],
        'offer': data['offer']
    }, room=data['to'])

@socketio.on('answer')
def on_answer(data):
    """Forward answer to specific user"""
    emit('answer', {
        'from': data['from'],
        'answer': data['answer']
    }, room=data['to'])

@socketio.on('ice-candidate')
def on_ice_candidate(data):
    """Forward ICE candidate"""
    emit('ice-candidate', {
        'from': data['from'],
        'candidate': data['candidate']
    }, room=data['to'])

@socketio.on('leave')
def on_leave(data):
    room = data['room']
    user_id = data['user_id']
    
    leave_room(room)
    
    if room in rooms:
        rooms[room].remove(user_id)
    
    emit('user-left', {'user_id': user_id}, room=room)

if __name__ == '__main__':
    socketio.run(app, debug=True, port=5000)
```

**Client** (JavaScript):
```javascript
// Connect to signaling server
const socket = io('http://localhost:5000');

const roomId = 'room123';
const userId = 'user-' + Math.random().toString(36).substr(2, 9);

let localStream;
let peerConnections = {};

const configuration = {
    iceServers: [
        { urls: 'stun:stun.l.google.com:19302' },  // Free STUN server
        // TURN server (if needed)
        // {
        //     urls: 'turn:your-turn-server.com:3478',
        //     username: 'user',
        //     credential: 'pass'
        // }
    ]
};

// Get local media
async function startLocalStream() {
    try {
        localStream = await navigator.mediaDevices.getUserMedia({
            video: true,
            audio: true
        });
        
        document.getElementById('local-video').srcObject = localStream;
        
        // Join room
        socket.emit('join', { room: roomId, user_id: userId });
    } catch (err) {
        console.error('Error accessing media devices:', err);
    }
}

// Create peer connection
function createPeerConnection(remoteUserId) {
    const pc = new RTCPeerConnection(configuration);
    
    // Add local stream tracks
    localStream.getTracks().forEach(track => {
        pc.addTrack(track, localStream);
    });
    
    // Handle remote stream
    pc.ontrack = (event) => {
        const remoteVideo = document.getElementById(`remote-${remoteUserId}`);
        if (!remoteVideo.srcObject) {
            remoteVideo.srcObject = event.streams[0];
        }
    };
    
    // Handle ICE candidates
    pc.onicecandidate = (event) => {
        if (event.candidate) {
            socket.emit('ice-candidate', {
                to: remoteUserId,
                from: userId,
                candidate: event.candidate
            });
        }
    };
    
    peerConnections[remoteUserId] = pc;
    return pc;
}

// Handle new user joined
socket.on('user-joined', async (data) => {
    const remoteUserId = data.user_id;
    console.log('User joined:', remoteUserId);
    
    // Create video element
    const video = document.createElement('video');
    video.id = `remote-${remoteUserId}`;
    video.autoplay = true;
    document.getElementById('remote-videos').appendChild(video);
    
    // Create offer
    const pc = createPeerConnection(remoteUserId);
    const offer = await pc.createOffer();
    await pc.setLocalDescription(offer);
    
    socket.emit('offer', {
        to: remoteUserId,
        from: userId,
        offer: offer
    });
});

// Handle offer
socket.on('offer', async (data) => {
    const remoteUserId = data.from;
    
    const video = document.createElement('video');
    video.id = `remote-${remoteUserId}`;
    video.autoplay = true;
    document.getElementById('remote-videos').appendChild(video);
    
    const pc = createPeerConnection(remoteUserId);
    await pc.setRemoteDescription(new RTCSessionDescription(data.offer));
    
    const answer = await pc.createAnswer();
    await pc.setLocalDescription(answer);
    
    socket.emit('answer', {
        to: remoteUserId,
        from: userId,
        answer: answer
    });
});

// Handle answer
socket.on('answer', async (data) => {
    const pc = peerConnections[data.from];
    await pc.setRemoteDescription(new RTCSessionDescription(data.answer));
});

// Handle ICE candidate
socket.on('ice-candidate', async (data) => {
    const pc = peerConnections[data.from];
    await pc.addIceCandidate(new RTCIceCandidate(data.candidate));
});

// Handle user left
socket.on('user-left', (data) => {
    const remoteUserId = data.user_id;
    
    if (peerConnections[remoteUserId]) {
        peerConnections[remoteUserId].close();
        delete peerConnections[remoteUserId];
    }
    
    const video = document.getElementById(`remote-${remoteUserId}`);
    if (video) video.remove();
});

// Start
startLocalStream();
```

**HTML**:
```html
<!DOCTYPE html>
<html>
<head>
    <title>WebRTC Video Chat</title>
</head>
<body>
    <h1>Video Chat</h1>
    
    <div>
        <h2>Local Video</h2>
        <video id="local-video" autoplay muted style="width: 300px;"></video>
    </div>
    
    <div>
        <h2>Remote Videos</h2>
        <div id="remote-videos"></div>
    </div>
    
    <script src="https://cdn.socket.io/4.0.0/socket.io.min.js"></script>
    <script src="client.js"></script>
</body>
</html>
```

### WebRTC Implementation (Go Signaling Server)

**Signaling Server** (Using Gorilla WebSocket):
```go
package main

import (
    "encoding/json"
    "log"
    "net/http"
    "sync"
    
    "github.com/gorilla/websocket"
)

var upgrader = websocket.Upgrader{
    CheckOrigin: func(r *http.Request) bool {
        return true
    },
}

type Client struct {
    ID   string
    Conn *websocket.Conn
    Room string
}

type Message struct {
    Type      string          `json:"type"`
    From      string          `json:"from,omitempty"`
    To        string          `json:"to,omitempty"`
    Room      string          `json:"room,omitempty"`
    UserID    string          `json:"user_id,omitempty"`
    Offer     json.RawMessage `json:"offer,omitempty"`
    Answer    json.RawMessage `json:"answer,omitempty"`
    Candidate json.RawMessage `json:"candidate,omitempty"`
}

type Room struct {
    Clients map[string]*Client
    mu      sync.Mutex
}

var rooms = make(map[string]*Room)
var roomsMu sync.Mutex

func getOrCreateRoom(roomID string) *Room {
    roomsMu.Lock()
    defer roomsMu.Unlock()
    
    if room, exists := rooms[roomID]; exists {
        return room
    }
    
    room := &Room{
        Clients: make(map[string]*Client),
    }
    rooms[roomID] = room
    return room
}

func handleWebSocket(w http.ResponseWriter, r *http.Request) {
    conn, err := upgrader.Upgrade(w, r, nil)
    if err != nil {
        log.Println(err)
        return
    }
    defer conn.Close()
    
    var client *Client
    
    for {
        var msg Message
        err := conn.ReadJSON(&msg)
        if err != nil {
            if client != nil {
                // Remove from room
                room := getOrCreateRoom(client.Room)
                room.mu.Lock()
                delete(room.Clients, client.ID)
                room.mu.Unlock()
                
                // Notify others
                leaveMsg := Message{
                    Type:   "user-left",
                    UserID: client.ID,
                }
                broadcastToRoom(room, leaveMsg, client.ID)
            }
            break
        }
        
        switch msg.Type {
        case "join":
            client = &Client{
                ID:   msg.UserID,
                Conn: conn,
                Room: msg.Room,
            }
            
            room := getOrCreateRoom(msg.Room)
            room.mu.Lock()
            
            // Get existing users
            users := make([]string, 0, len(room.Clients))
            for userID := range room.Clients {
                users = append(users, userID)
            }
            
            room.Clients[client.ID] = client
            room.mu.Unlock()
            
            // Send existing users to new client
            conn.WriteJSON(Message{
                Type: "users-in-room",
            })
            
            // Notify others
            joinMsg := Message{
                Type:   "user-joined",
                UserID: client.ID,
            }
            broadcastToRoom(room, joinMsg, client.ID)
        
        case "offer":
            room := getOrCreateRoom(client.Room)
            sendToUser(room, msg.To, Message{
                Type:  "offer",
                From:  msg.From,
                Offer: msg.Offer,
            })
        
        case "answer":
            room := getOrCreateRoom(client.Room)
            sendToUser(room, msg.To, Message{
                Type:   "answer",
                From:   msg.From,
                Answer: msg.Answer,
            })
        
        case "ice-candidate":
            room := getOrCreateRoom(client.Room)
            sendToUser(room, msg.To, Message{
                Type:      "ice-candidate",
                From:      msg.From,
                Candidate: msg.Candidate,
            })
        }
    }
}

func sendToUser(room *Room, userID string, msg Message) {
    room.mu.Lock()
    defer room.mu.Unlock()
    
    if client, exists := room.Clients[userID]; exists {
        client.Conn.WriteJSON(msg)
    }
}

func broadcastToRoom(room *Room, msg Message, skipUserID string) {
    room.mu.Lock()
    defer room.mu.Unlock()
    
    for userID, client := range room.Clients {
        if userID != skipUserID {
            client.Conn.WriteJSON(msg)
        }
    }
}

func main() {
    http.HandleFunc("/ws", handleWebSocket)
    
    log.Println("Signaling server started on :5000")
    log.Fatal(http.ListenAndServe(":5000", nil))
}
```

### Advanced WebRTC Patterns

**1. Screen Sharing**:
```javascript
async function startScreenShare() {
    try {
        const screenStream = await navigator.mediaDevices.getDisplayMedia({
            video: true,
            audio: false
        });
        
        // Replace video track
        const videoTrack = screenStream.getVideoTracks()[0];
        const sender = peerConnection.getSenders().find(s => 
            s.track.kind === 'video'
        );
        sender.replaceTrack(videoTrack);
        
        // When screen share stops
        videoTrack.onended = () => {
            // Switch back to camera
            const cameraTrack = localStream.getVideoTracks()[0];
            sender.replaceTrack(cameraTrack);
        };
    } catch (err) {
        console.error('Screen share error:', err);
    }
}
```

**2. Data Channel** (P2P file transfer):
```javascript
// Sender
const dataChannel = peerConnection.createDataChannel('file-transfer');

dataChannel.onopen = () => {
    console.log('Data channel open');
    
    // Send file in chunks
    const file = document.getElementById('file-input').files[0];
    const chunkSize = 16384;  // 16KB chunks
    let offset = 0;
    
    const readSlice = (offset) => {
        const reader = new FileReader();
        const slice = file.slice(offset, offset + chunkSize);
        
        reader.onload = (e) => {
            dataChannel.send(e.target.result);
            offset += e.target.result.byteLength;
            
            if (offset < file.size) {
                readSlice(offset);
            } else {
                dataChannel.send('EOF');
            }
        };
        
        reader.readAsArrayBuffer(slice);
    };
    
    // Send metadata
    dataChannel.send(JSON.stringify({
        name: file.name,
        size: file.size,
        type: file.type
    }));
    
    readSlice(0);
};

// Receiver
peerConnection.ondatachannel = (event) => {
    const dataChannel = event.channel;
    let receivedBuffer = [];
    let fileMetadata;
    
    dataChannel.onmessage = (event) => {
        if (typeof event.data === 'string') {
            if (event.data === 'EOF') {
                // Save file
                const blob = new Blob(receivedBuffer, { type: fileMetadata.type });
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = fileMetadata.name;
                a.click();
            } else {
                fileMetadata = JSON.parse(event.data);
            }
        } else {
            receivedBuffer.push(event.data);
        }
    };
};
```

**3. Recording**:
```javascript
let mediaRecorder;
let recordedChunks = [];

function startRecording() {
    // Record local + remote streams
    const mixedStream = new MediaStream([
        ...localStream.getTracks(),
        ...remoteStream.getTracks()
    ]);
    
    mediaRecorder = new MediaRecorder(mixedStream, {
        mimeType: 'video/webm'
    });
    
    mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
            recordedChunks.push(event.data);
        }
    };
    
    mediaRecorder.onstop = () => {
        const blob = new Blob(recordedChunks, { type: 'video/webm' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'recording.webm';
        a.click();
    };
    
    mediaRecorder.start();
}

function stopRecording() {
    mediaRecorder.stop();
}
```

### Scaling WebRTC (SFU)

**SFU** (Selective Forwarding Unit): Server forwards streams without mixing.

**Using Mediasoup** (Node.js SFU):
```bash
npm install mediasoup
```

```javascript
// Simplified SFU concept
// Server forwards each peer's stream to all others
// Much more scalable than mesh (100+ participants)

// Peers send to server once, server sends to all others
// Lower bandwidth for clients, higher for server
```

**Commercial SFU Solutions**:
- **Jitsi**: Open source SFU
- **Mediasoup**: Node.js SFU library
- **Janus**: C-based SFU/MCU
- **Kurento**: Java media server

### STUN/TURN Setup

**Free STUN Servers**:
```javascript
const configuration = {
    iceServers: [
        { urls: 'stun:stun.l.google.com:19302' },
        { urls: 'stun:stun1.l.google.com:19302' },
        { urls: 'stun:stun.stunprotocol.org:3478' }
    ]
};
```

**Self-hosted TURN** (Coturn):
```bash
# Install coturn
sudo apt-get install coturn

# Configure /etc/turnserver.conf
listening-port=3478
external-ip=YOUR_SERVER_IP
realm=yourdomain.com
server-name=yourdomain.com
lt-cred-mech
user=username:password
```

```javascript
const configuration = {
    iceServers: [
        { urls: 'stun:stun.l.google.com:19302' },
        {
            urls: 'turn:yourdomain.com:3478',
            username: 'username',
            credential: 'password'
        }
    ]
};
```

### Configuration Best Practices

```javascript
const rtcConfig = {
    // ICE servers
    iceServers: [
        { urls: 'stun:stun.l.google.com:19302' },
        { urls: 'turn:your-turn-server.com:3478', username: 'x', credential: 'y' }
    ],
    
    // ICE transport policy
    iceTransportPolicy: 'all',  // 'all' or 'relay' (TURN only)
    
    // Bundle policy
    bundlePolicy: 'balanced',  // 'balanced', 'max-compat', 'max-bundle'
    
    // RTCP mux policy
    rtcpMuxPolicy: 'require',
    
    // Certificates (optional)
    // certificates: [...]
};

// Media constraints
const mediaConstraints = {
    video: {
        width: { ideal: 1280 },
        height: { ideal: 720 },
        frameRate: { ideal: 30 }
    },
    audio: {
        echoCancellation: true,
        noiseSuppression: true,
        autoGainControl: true
    }
};
```

### Open Source & Commercial Tools

**Open Source**:
- **Jitsi Meet**: Full video conferencing solution
- **Mediasoup**: SFU library (Node.js)
- **Janus Gateway**: WebRTC gateway (C)
- **Kurento**: Media server (Java)
- **Coturn**: TURN server
- **SimpleWebRTC**: WebRTC wrapper library

**Commercial/Managed**:
- **Agora.io**: $0.99-3.99 per 1000 minutes
- **Twilio Video**: $0.0015-0.004/minute
- **Vonage Video API**: $0.0035/minute
- **Daily.co**: Free-$99/month
- **100ms**: $0.001/minute
- **AWS Chime SDK**: $0.0017/minute

---

## API Gateway & Load Balancing

### What is an API Gateway?

**API Gateway**: Single entry point for all API requests, routing to backend services.

**Key Functions**:
```
- Request routing
- Authentication & authorization
- Rate limiting & throttling
- Request/response transformation
- Protocol translation (REST to gRPC)
- Caching
- Logging & monitoring
- API versioning
- Load balancing
```

### When to Use API Gateway

**Use Cases**:
```
✅ Microservices architecture (single entry point)
✅ Need centralized authentication
✅ Multiple backend protocols (REST, gRPC, GraphQL)
✅ Rate limiting across services
✅ API composition (aggregating multiple services)
✅ Legacy system integration
✅ Multi-tenant applications
```

**Don't Use When**:
```
❌ Simple monolith application
❌ Internal-only services (no external access)
❌ Very high throughput (avoid extra hop)
```

### API Gateway vs Reverse Proxy vs Load Balancer

| Feature | API Gateway | Reverse Proxy | Load Balancer |
|---------|-------------|---------------|---------------|
| **Routing** | Path-based, complex | Simple | Round-robin |
| **Authentication** | Yes | Limited | No |
| **Rate Limiting** | Yes | Limited | No |
| **Protocol Translation** | Yes | Limited | No |
| **Caching** | Yes | Yes | No |
| **Load Balancing** | Yes | Yes | Yes (only) |
| **Use Case** | APIs | Web apps | Traffic distribution |

### Pros & Cons

**Pros**:
```
✅ Single entry point (simplifies client)
✅ Centralized security & authentication
✅ Rate limiting & throttling
✅ Request aggregation (reduce client calls)
✅ Protocol translation
✅ Analytics & monitoring
✅ A/B testing & canary deployments
```

**Cons**:
```
❌ Single point of failure (need HA)
❌ Added latency (extra hop)
❌ Complexity in configuration
❌ Can become bottleneck
❌ Vendor lock-in (managed services)
```

### Cost & Trade-offs

**Infrastructure Cost**:
```
Self-Hosted:
- Kong: Free (open source) + $5-50/month for hosting
- Nginx: Free + $5-20/month for hosting
- Traefik: Free + $5-20/month for hosting

Managed:
- AWS API Gateway: $3.50 per million requests + data transfer
- Google Cloud API Gateway: $3/million requests
- Azure API Management: $50-13,000/month
- Kong Enterprise: $1,250-5,000/month
- Tyk: $500-2,500/month
```

**Trade-offs**:
```
Latency: Adds 5-50ms per request
Complexity: Need to configure routing, auth, etc.
Availability: Must run multiple instances
Cost: Extra infrastructure layer
```

### API Gateway Implementation (Kong)

**Docker Compose Setup**:
```yaml
# docker-compose.yml
version: '3.8'

services:
  kong-database:
    image: postgres:13
    environment:
      POSTGRES_USER: kong
      POSTGRES_DB: kong
      POSTGRES_PASSWORD: kong
    volumes:
      - kong-data:/var/lib/postgresql/data
  
  kong-migrations:
    image: kong:latest
    command: kong migrations bootstrap
    environment:
      KONG_DATABASE: postgres
      KONG_PG_HOST: kong-database
      KONG_PG_PASSWORD: kong
    depends_on:
      - kong-database
  
  kong:
    image: kong:latest
    environment:
      KONG_DATABASE: postgres
      KONG_PG_HOST: kong-database
      KONG_PG_PASSWORD: kong
      KONG_PROXY_ACCESS_LOG: /dev/stdout
      KONG_ADMIN_ACCESS_LOG: /dev/stdout
      KONG_PROXY_ERROR_LOG: /dev/stderr
      KONG_ADMIN_ERROR_LOG: /dev/stderr
      KONG_ADMIN_LISTEN: 0.0.0.0:8001
    ports:
      - "8000:8000"   # Proxy
      - "8443:8443"   # Proxy SSL
      - "8001:8001"   # Admin API
    depends_on:
      - kong-database

volumes:
  kong-data:
```

**Configure Kong**:
```bash
# Add a service
curl -i -X POST http://localhost:8001/services \
  --data name=user-service \
  --data url=http://backend:5000

# Add a route
curl -i -X POST http://localhost:8001/services/user-service/routes \
  --data paths[]=/api/users

# Add authentication plugin
curl -i -X POST http://localhost:8001/services/user-service/plugins \
  --data name=key-auth

# Add rate limiting
curl -i -X POST http://localhost:8001/services/user-service/plugins \
  --data name=rate-limiting \
  --data config.minute=10 \
  --data config.policy=local

# Test
curl http://localhost:8000/api/users \
  -H "apikey: your-api-key"
```

### API Gateway Implementation (Python - Flask + Nginx)

**Nginx as Reverse Proxy + Load Balancer**:
```nginx
# /etc/nginx/nginx.conf

upstream backend_pool {
    least_conn;  # Load balancing algorithm
    server backend1:5000 weight=3;
    server backend2:5000 weight=2;
    server backend3:5000 weight=1;
    
    # Health checks
    server backend4:5000 backup;
}

# Rate limiting
limit_req_zone $binary_remote_addr zone=api_limit:10m rate=10r/s;

server {
    listen 80;
    server_name api.example.com;
    
    # Rate limiting
    limit_req zone=api_limit burst=20 nodelay;
    
    # Authentication (basic)
    auth_basic "API Access";
    auth_basic_user_file /etc/nginx/.htpasswd;
    
    # CORS headers
    add_header 'Access-Control-Allow-Origin' '*';
    add_header 'Access-Control-Allow-Methods' 'GET, POST, PUT, DELETE';
    
    # API v1
    location /api/v1/ {
        proxy_pass http://backend_pool/;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        
        # Timeouts
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;
    }
    
    # Health check endpoint
    location /health {
        access_log off;
        return 200 "OK";
    }
    
    # Caching
    location /api/v1/users {
        proxy_cache my_cache;
        proxy_cache_valid 200 5m;
        proxy_cache_key "$request_uri";
        proxy_pass http://backend_pool/users;
    }
}

# Cache configuration
proxy_cache_path /var/cache/nginx levels=1:2 keys_zone=my_cache:10m max_size=1g inactive=60m;
```

**Python API Gateway** (Simple):
```python
from flask import Flask, request, jsonify
import requests
import jwt
from functools import wraps

app = Flask(__name__)

# Service registry
SERVICES = {
    'users': 'http://user-service:5000',
    'orders': 'http://order-service:5001',
    'products': 'http://product-service:5002'
}

# Middleware: Authentication
def require_auth(f):
    @wraps(f)
    def wrapper(*args, **kwargs):
        token = request.headers.get('Authorization', '').replace('Bearer ', '')
        
        if not token:
            return jsonify({'error': 'No token provided'}), 401
        
        try:
            payload = jwt.decode(token, 'secret', algorithms=['HS256'])
            request.user = payload
        except jwt.ExpiredSignatureError:
            return jsonify({'error': 'Token expired'}), 401
        except jwt.InvalidTokenError:
            return jsonify({'error': 'Invalid token'}), 401
        
        return f(*args, **kwargs)
    
    return wrapper

# Gateway routing
@app.route('/api/<service>/<path:path>', methods=['GET', 'POST', 'PUT', 'DELETE'])
@require_auth
def gateway(service, path):
    """Route requests to appropriate service"""
    
    if service not in SERVICES:
        return jsonify({'error': 'Service not found'}), 404
    
    # Build target URL
    target_url = f"{SERVICES[service]}/{path}"
    
    # Forward query parameters
    if request.query_string:
        target_url += f"?{request.query_string.decode()}"
    
    # Forward request
    try:
        response = requests.request(
            method=request.method,
            url=target_url,
            headers={k: v for k, v in request.headers if k != 'Host'},
            data=request.get_data(),
            timeout=30
        )
        
        return jsonify(response.json()), response.status_code
    
    except requests.exceptions.Timeout:
        return jsonify({'error': 'Service timeout'}), 504
    except requests.exceptions.RequestException as e:
        return jsonify({'error': 'Service unavailable'}), 503

# Health check
@app.route('/health')
def health():
    return jsonify({'status': 'healthy'}), 200

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=8080)
```

### Load Balancing Algorithms

**1. Round Robin**:
```
Request 1 → Server A
Request 2 → Server B
Request 3 → Server C
Request 4 → Server A (cycle repeats)

Pros: Simple, fair distribution
Cons: Doesn't consider server load
```

**2. Least Connections**:
```
Route to server with fewest active connections

Pros: Better for long-lived connections
Cons: More complex tracking
```

**3. IP Hash**:
```
hash(client_ip) % num_servers = server_index

Pros: Session persistence (same client → same server)
Cons: Uneven distribution if few clients
```

**4. Weighted Round Robin**:
```nginx
upstream backend {
    server server1 weight=3;  # Gets 3x traffic
    server server2 weight=2;
    server server3 weight=1;
}
```

### API Gateway Implementation (Go - Custom)

```go
package main

import (
    "encoding/json"
    "fmt"
    "log"
    "net/http"
    "net/http/httputil"
    "net/url"
    "sync"
    "time"
)

// Service registry
var services = map[string]string{
    "users":    "http://localhost:5000",
    "orders":   "http://localhost:5001",
    "products": "http://localhost:5002",
}

// Rate limiter
type RateLimiter struct {
    requests map[string][]time.Time
    mu       sync.Mutex
    limit    int
    window   time.Duration
}

func NewRateLimiter(limit int, window time.Duration) *RateLimiter {
    return &RateLimiter{
        requests: make(map[string][]time.Time),
        limit:    limit,
        window:   window,
    }
}

func (rl *RateLimiter) Allow(ip string) bool {
    rl.mu.Lock()
    defer rl.mu.Unlock()
    
    now := time.Now()
    cutoff := now.Add(-rl.window)
    
    // Clean old requests
    var valid []time.Time
    for _, t := range rl.requests[ip] {
        if t.After(cutoff) {
            valid = append(valid, t)
        }
    }
    
    if len(valid) >= rl.limit {
        return false
    }
    
    rl.requests[ip] = append(valid, now)
    return true
}

// Gateway handler
type Gateway struct {
    rateLimiter *RateLimiter
}

func (g *Gateway) ServeHTTP(w http.ResponseWriter, r *http.Request) {
    // Rate limiting
    ip := r.RemoteAddr
    if !g.rateLimiter.Allow(ip) {
        http.Error(w, "Rate limit exceeded", http.StatusTooManyRequests)
        return
    }
    
    // Authentication (simplified)
    token := r.Header.Get("Authorization")
    if token != "Bearer valid-token" {
        http.Error(w, "Unauthorized", http.StatusUnauthorized)
        return
    }
    
    // Parse route: /api/{service}/{path}
    path := r.URL.Path
    if len(path) < 5 || path[:5] != "/api/" {
        http.Error(w, "Invalid path", http.StatusBadRequest)
        return
    }
    
    // Extract service name
    parts := splitPath(path[5:])
    if len(parts) == 0 {
        http.Error(w, "Service not specified", http.StatusBadRequest)
        return
    }
    
    service := parts[0]
    serviceURL, exists := services[service]
    if !exists {
        http.Error(w, "Service not found", http.StatusNotFound)
        return
    }
    
    // Create reverse proxy
    target, _ := url.Parse(serviceURL)
    proxy := httputil.NewSingleHostReverseProxy(target)
    
    // Modify request
    r.URL.Host = target.Host
    r.URL.Scheme = target.Scheme
    r.Header.Set("X-Forwarded-Host", r.Header.Get("Host"))
    r.Host = target.Host
    
    // Forward request
    proxy.ServeHTTP(w, r)
}

func splitPath(path string) []string {
    var parts []string
    current := ""
    for _, ch := range path {
        if ch == '/' {
            if current != "" {
                parts = append(parts, current)
                current = ""
            }
        } else {
            current += string(ch)
        }
    }
    if current != "" {
        parts = append(parts, current)
    }
    return parts
}

func main() {
    gateway := &Gateway{
        rateLimiter: NewRateLimiter(10, time.Minute),
    }
    
    http.HandleFunc("/health", func(w http.ResponseWriter, r *http.Request) {
        w.WriteHeader(http.StatusOK)
        json.NewEncoder(w).Encode(map[string]string{"status": "healthy"})
    })
    
    http.Handle("/api/", gateway)
    
    log.Println("API Gateway started on :8080")
    log.Fatal(http.ListenAndServe(":8080", nil))
}
```

### Open Source & Commercial Tools

**Open Source**:
- **Kong**: Lua-based, plugin architecture
- **Tyk**: Go-based, fast performance
- **KrakenD**: Ultra-fast, stateless
- **Express Gateway**: Node.js-based
- **Nginx**: Reverse proxy + API gateway features
- **Traefik**: Modern, Docker-native
- **Apache APISIX**: Cloud-native, supports Wasm

**Commercial/Managed**:
- **AWS API Gateway**: $3.50/million requests
- **Google Cloud API Gateway**: $3/million requests
- **Azure API Management**: $50-13,000/month
- **Kong Enterprise**: $1,250-5,000/month
- **Tyk Enterprise**: $500-2,500/month
- **Apigee** (Google): Enterprise pricing
- **MuleSoft**: Enterprise pricing

---

## Caching Strategies

### What is API Caching?

**Caching**: Storing responses to reduce latency and backend load.

**Benefits**:
```
✅ Reduced latency (faster responses)
✅ Lower backend load
✅ Cost savings (fewer database queries)
✅ Better scalability
✅ Improved user experience
```

### Cache Levels

**1. Client-Side** (Browser cache)
**2. CDN** (Edge caching)
**3. API Gateway** (Reverse proxy cache)
**4. Application Cache** (Redis, Memcached)
**5. Database Cache** (Query result cache)

### HTTP Caching Headers

**Cache-Control**:
```http
# Cache for 1 hour
Cache-Control: public, max-age=3600

# No caching
Cache-Control: no-store, no-cache, must-revalidate

# Cache but revalidate
Cache-Control: no-cache

# Private (browser only, not CDN)
Cache-Control: private, max-age=3600
```

**ETags** (Entity Tags):
```http
# Server response
HTTP/1.1 200 OK
ETag: "33a64df551425fcc55e4d42a148795d9f25f89d4"
Content-Type: application/json

{"id": 123, "name": "Alice"}

# Client subsequent request
GET /users/123
If-None-Match: "33a64df551425fcc55e4d42a148795d9f25f89d4"

# Server response (unchanged)
HTTP/1.1 304 Not Modified
```

**Last-Modified**:
```http
# Server response
Last-Modified: Wed, 21 Oct 2015 07:28:00 GMT

# Client request
If-Modified-Since: Wed, 21 Oct 2015 07:28:00 GMT

# Response (unchanged)
HTTP/1.1 304 Not Modified
```

### Caching Implementation (Python + Redis)

**Setup**:
```python
# pip install redis flask

from flask import Flask, request, jsonify, make_response
import redis
import json
import hashlib
from datetime import timedelta
from functools import wraps

app = Flask(__name__)
redis_client = redis.Redis(host='localhost', port=6379, decode_responses=True)

def cache_response(timeout=300):
    """Decorator to cache API responses"""
    def decorator(f):
        @wraps(f)
        def wrapper(*args, **kwargs):
            # Generate cache key from URL + query params
            cache_key = f"cache:{request.path}:{request.query_string.decode()}"
            
            # Check cache
            cached = redis_client.get(cache_key)
            if cached:
                response = make_response(json.loads(cached))
                response.headers['X-Cache'] = 'HIT'
                return response
            
            # Call function
            result = f(*args, **kwargs)
            
            # Cache result
            if isinstance(result, tuple):
                data, status_code = result
            else:
                data, status_code = result, 200
            
            if status_code == 200:
                redis_client.setex(
                    cache_key,
                    timeout,
                    json.dumps(data)
                )
            
            response = make_response(data, status_code)
            response.headers['X-Cache'] = 'MISS'
            response.headers['Cache-Control'] = f'public, max-age={timeout}'
            return response
        
        return wrapper
    return decorator

@app.route('/users')
@cache_response(timeout=60)  # Cache for 60 seconds
def get_users():
    """Get users (cached)"""
    # Expensive database query...
    users = [
        {'id': 1, 'name': 'Alice'},
        {'id': 2, 'name': 'Bob'}
    ]
    return jsonify(users)

@app.route('/users/<int:user_id>')
def get_user(user_id):
    """Get user with ETag"""
    user = {'id': user_id, 'name': 'Alice', 'email': 'alice@example.com'}
    
    # Generate ETag
    etag = hashlib.md5(json.dumps(user).encode()).hexdigest()
    
    # Check If-None-Match header
    client_etag = request.headers.get('If-None-Match')
    if client_etag == etag:
        return '', 304  # Not Modified
    
    response = make_response(jsonify(user))
    response.headers['ETag'] = etag
    response.headers['Cache-Control'] = 'no-cache'
    return response

# Cache invalidation
@app.route('/users/<int:user_id>', methods=['PUT'])
def update_user(user_id):
    """Update user and invalidate cache"""
    # Update database...
    
    # Invalidate cache
    pattern = f"cache:/users/*"
    for key in redis_client.scan_iter(match=pattern):
        redis_client.delete(key)
    
    return jsonify({'status': 'updated'})

if __name__ == '__main__':
    app.run(debug=True)
```

### Caching Implementation (Go + Redis)

```go
package main

import (
    "context"
    "crypto/md5"
    "encoding/json"
    "fmt"
    "log"
    "net/http"
    "time"
    
    "github.com/go-redis/redis/v8"
)

var (
    ctx = context.Background()
    rdb *redis.Client
)

type User struct {
    ID    int    `json:"id"`
    Name  string `json:"name"`
    Email string `json:"email"`
}

func init() {
    rdb = redis.NewClient(&redis.Options{
        Addr: "localhost:6379",
    })
}

func cacheMiddleware(ttl time.Duration) func(http.HandlerFunc) http.HandlerFunc {
    return func(next http.HandlerFunc) http.HandlerFunc {
        return func(w http.ResponseWriter, r *http.Request) {
            cacheKey := fmt.Sprintf("cache:%s:%s", r.URL.Path, r.URL.RawQuery)
            
            // Check cache
            cached, err := rdb.Get(ctx, cacheKey).Result()
            if err == nil {
                w.Header().Set("Content-Type", "application/json")
                w.Header().Set("X-Cache", "HIT")
                w.Header().Set("Cache-Control", fmt.Sprintf("public, max-age=%d", int(ttl.Seconds())))
                w.Write([]byte(cached))
                return
            }
            
            // Capture response
            recorder := &responseRecorder{
                ResponseWriter: w,
                statusCode:     200,
            }
            
            next(recorder, r)
            
            // Cache response if 200
            if recorder.statusCode == 200 && len(recorder.body) > 0 {
                rdb.Set(ctx, cacheKey, recorder.body, ttl)
                w.Header().Set("X-Cache", "MISS")
            }
        }
    }
}

type responseRecorder struct {
    http.ResponseWriter
    statusCode int
    body       []byte
}

func (r *responseRecorder) WriteHeader(statusCode int) {
    r.statusCode = statusCode
    r.ResponseWriter.WriteHeader(statusCode)
}

func (r *responseRecorder) Write(b []byte) (int, error) {
    r.body = append(r.body, b...)
    return r.ResponseWriter.Write(b)
}

func getUsers(w http.ResponseWriter, r *http.Request) {
    users := []User{
        {ID: 1, Name: "Alice", Email: "alice@example.com"},
        {ID: 2, Name: "Bob", Email: "bob@example.com"},
    }
    
    w.Header().Set("Content-Type", "application/json")
    json.NewEncoder(w).Encode(users)
}

func getUserWithETag(w http.ResponseWriter, r *http.Request) {
    user := User{ID: 1, Name: "Alice", Email: "alice@example.com"}
    
    // Generate ETag
    data, _ := json.Marshal(user)
    etag := fmt.Sprintf("%x", md5.Sum(data))
    
    // Check If-None-Match
    clientETag := r.Header.Get("If-None-Match")
    if clientETag == etag {
        w.WriteHeader(http.StatusNotModified)
        return
    }
    
    w.Header().Set("ETag", etag)
    w.Header().Set("Cache-Control", "no-cache")
    w.Header().Set("Content-Type", "application/json")
    json.NewEncoder(w).Encode(user)
}

func main() {
    // Cached endpoint (60 second TTL)
    http.HandleFunc("/users", cacheMiddleware(60*time.Second)(getUsers))
    
    // ETag endpoint
    http.HandleFunc("/user/1", getUserWithETag)
    
    log.Println("Server started on :8080")
    log.Fatal(http.ListenAndServe(":8080", nil))
}
```

### Cache Invalidation Strategies

**1. Time-Based (TTL)**:
```python
# Cache expires after fixed time
redis_client.setex('key', 300, 'value')  # 5 minutes
```

**2. Event-Based**:
```python
# Invalidate when data changes
@app.route('/users/<id>', methods=['PUT'])
def update_user(id):
    # Update database
    db.update_user(id, request.json)
    
    # Invalidate specific cache
    redis_client.delete(f'user:{id}')
    redis_client.delete('users:list')
    
    return jsonify({'status': 'updated'})
```

**3. Tag-Based**:
```python
# Tag caches for bulk invalidation
def cache_with_tags(key, value, ttl, tags):
    redis_client.setex(key, ttl, value)
    for tag in tags:
        redis_client.sadd(f'tag:{tag}', key)

def invalidate_tag(tag):
    keys = redis_client.smembers(f'tag:{tag}')
    for key in keys:
        redis_client.delete(key)
    redis_client.delete(f'tag:{tag}')

# Usage
cache_with_tags('user:123', data, 300, ['users', 'team:5'])
invalidate_tag('users')  # Invalidate all user caches
```

**4. Stale-While-Revalidate**:
```python
def get_with_swr(key, fetch_fn, ttl=300, stale_ttl=600):
    """Serve stale while refreshing in background"""
    value = redis_client.get(key)
    
    # Fresh cache
    if value and redis_client.ttl(key) > ttl - stale_ttl:
        return json.loads(value)
    
    # Stale cache - refresh in background
    if value:
        # Serve stale
        result = json.loads(value)
        
        # Refresh async
        def refresh():
            new_value = fetch_fn()
            redis_client.setex(key, ttl, json.dumps(new_value))
        
        threading.Thread(target=refresh).start()
        return result
    
    # No cache - fetch now
    result = fetch_fn()
    redis_client.setex(key, ttl, json.dumps(result))
    return result
```

### CDN Caching

**CloudFlare Example**:
```python
from flask import Flask, make_response

@app.route('/static-data')
def static_data():
    data = {'message': 'This is cached at CDN'}
    response = make_response(jsonify(data))
    
    # Cache at CDN for 1 hour
    response.headers['Cache-Control'] = 'public, max-age=3600, s-maxage=3600'
    response.headers['CDN-Cache-Control'] = 'max-age=3600'
    
    return response
```

### Cache Configuration Best Practices

```python
CACHE_CONFIG = {
    'default_ttl': 300,           # 5 minutes
    'max_ttl': 3600,              # 1 hour
    'stale_ttl': 600,             # 10 minutes (stale-while-revalidate)
    'max_size': '1GB',            # Max cache size
    'eviction_policy': 'lru',     # Least Recently Used
    'compression': True,          # Compress cached data
}

# Different TTLs for different endpoints
CACHE_TTL = {
    '/users': 60,                 # 1 minute
    '/products': 300,             # 5 minutes
    '/static': 3600,              # 1 hour
}
```

### Open Source & Commercial Tools

**Open Source**:
- **Redis**: In-memory data store
- **Memcached**: High-performance memory cache
- **Varnish**: HTTP accelerator/reverse proxy cache
- **Nginx**: Reverse proxy with caching

**Commercial/Managed**:
- **AWS ElastiCache**: Redis/Memcached as a service ($15-200/month)
- **Redis Enterprise**: $50-5,000/month
- **CloudFlare**: CDN + caching (Free-$200/month)
- **Fastly**: CDN + edge computing ($50-500/month)
- **Akamai**: Enterprise CDN

---

## API Security

### OWASP API Security Top 10 (2023)

**1. Broken Object Level Authorization (BOLA)**:
```python
# Vulnerable
@app.route('/users/<user_id>/profile')
def get_profile(user_id):
    # No check if current user can access this profile!
    return db.get_user(user_id)

# Secure
@app.route('/users/<user_id>/profile')
def get_profile(user_id):
    current_user = get_current_user()
    
    # Check authorization
    if current_user.id != int(user_id) and not current_user.is_admin:
        abort(403, "Forbidden")
    
    return db.get_user(user_id)
```

**2. Broken Authentication**:
```python
# Secure authentication
from werkzeug.security import generate_password_hash, check_password_hash
import secrets

@app.route('/register', methods=['POST'])
def register():
    data = request.json
    
    # Hash password
    password_hash = generate_password_hash(data['password'], method='pbkdf2:sha256')
    
    # Store user
    user = create_user(data['email'], password_hash)
    return jsonify({'id': user.id})

@app.route('/login', methods=['POST'])
def login():
    data = request.json
    user = db.get_user_by_email(data['email'])
    
    if not user or not check_password_hash(user.password_hash, data['password']):
        # Don't reveal which failed (email or password)
        abort(401, "Invalid credentials")
    
    # Generate secure token
    token = generate_jwt(user.id)
    return jsonify({'token': token})
```

**3. Broken Object Property Level Authorization**:
```python
# Mass assignment vulnerability
@app.route('/users/<user_id>', methods=['PUT'])
def update_user(user_id):
    # Vulnerable - user can set any field including 'is_admin'!
    user = db.get_user(user_id)
    for key, value in request.json.items():
        setattr(user, key, value)
    db.save(user)

# Secure - whitelist allowed fields
@app.route('/users/<user_id>', methods=['PUT'])
def update_user(user_id):
    ALLOWED_FIELDS = ['name', 'email', 'bio']
    
    user = db.get_user(user_id)
    for key, value in request.json.items():
        if key in ALLOWED_FIELDS:
            setattr(user, key, value)
    db.save(user)
```

**4. Unrestricted Resource Consumption**:
```python
# Add limits to prevent abuse
@app.route('/search', methods=['POST'])
def search():
    data = request.json
    
    # Limit query length
    if len(data.get('query', '')) > 100:
        abort(400, "Query too long")
    
    # Limit results
    limit = min(int(data.get('limit', 10)), 100)
    
    results = db.search(data['query'], limit=limit)
    return jsonify(results)
```

**5. Broken Function Level Authorization**:
```python
# Role-based access control
from functools import wraps

def require_admin(f):
    @wraps(f)
    def wrapper(*args, **kwargs):
        user = get_current_user()
        if not user.is_admin:
            abort(403, "Admin access required")
        return f(*args, **kwargs)
    return wrapper

@app.route('/admin/users', methods=['DELETE'])
@require_admin
def delete_all_users():
    db.delete_all_users()
    return jsonify({'status': 'deleted'})
```

### Input Validation & Sanitization

**Python (Marshmallow)**:
```python
# pip install marshmallow

from marshmallow import Schema, fields, validates, ValidationError
import re

class UserSchema(Schema):
    name = fields.Str(required=True, validate=lambda x: len(x) >= 2)
    email = fields.Email(required=True)
    age = fields.Int(validate=lambda x: 0 < x < 150)
    website = fields.URL()
    
    @validates('name')
    def validate_name(self, value):
        # No special characters
        if not re.match(r'^[a-zA-Z\s]+$', value):
            raise ValidationError("Name can only contain letters")

@app.route('/users', methods=['POST'])
def create_user():
    schema = UserSchema()
    
    try:
        # Validate and deserialize
        data = schema.load(request.json)
    except ValidationError as err:
        return jsonify({'errors': err.messages}), 400
    
    user = db.create_user(**data)
    return jsonify(schema.dump(user)), 201
```

**Go (validator)**:
```go
// go get github.com/go-playground/validator/v10

package main

import (
    "github.com/gin-gonic/gin"
    "github.com/go-playground/validator/v10"
)

type CreateUserRequest struct {
    Name     string `json:"name" binding:"required,min=2,max=50"`
    Email    string `json:"email" binding:"required,email"`
    Age      int    `json:"age" binding:"required,gt=0,lt=150"`
    Password string `json:"password" binding:"required,min=8"`
}

var validate = validator.New()

func createUser(c *gin.Context) {
    var req CreateUserRequest
    
    // Bind and validate
    if err := c.ShouldBindJSON(&req); err != nil {
        c.JSON(400, gin.H{"error": err.Error()})
        return
    }
    
    // Additional custom validation
    if err := validate.Struct(req); err != nil {
        c.JSON(400, gin.H{"error": err.Error()})
        return
    }
    
    // Create user...
    c.JSON(201, gin.H{"status": "created"})
}
```

### SQL Injection Prevention

**Python (parameterized queries)**:
```python
import psycopg2

# Vulnerable
user_id = request.args.get('id')
cursor.execute(f"SELECT * FROM users WHERE id = {user_id}")  # SQL Injection!

# Secure
user_id = request.args.get('id')
cursor.execute("SELECT * FROM users WHERE id = %s", (user_id,))

# Using ORM (SQLAlchemy)
user = User.query.filter_by(id=user_id).first()  # Safe
```

### XSS Prevention

**Escape output**:
```python
from flask import escape

@app.route('/comment/<comment_id>')
def show_comment(comment_id):
    comment = db.get_comment(comment_id)
    
    # Escape HTML
    safe_text = escape(comment.text)
    
    return jsonify({'text': safe_text})
```

**Content Security Policy**:
```python
@app.after_request
def set_csp(response):
    response.headers['Content-Security-Policy'] = "default-src 'self'; script-src 'self'"
    return response
```

### CORS Configuration

**Python (Flask-CORS)**:
```python
from flask_cors import CORS

app = Flask(__name__)

# Allow all origins (development only!)
# CORS(app)

# Production configuration
CORS(app, resources={
    r"/api/*": {
        "origins": ["https://example.com", "https://app.example.com"],
        "methods": ["GET", "POST", "PUT", "DELETE"],
        "allow_headers": ["Content-Type", "Authorization"],
        "expose_headers": ["X-Total-Count"],
        "max_age": 3600
    }
})
```

**Go (Gin)**:
```go
import "github.com/gin-contrib/cors"

func main() {
    r := gin.Default()
    
    // CORS configuration
    config := cors.Config{
        AllowOrigins:     []string{"https://example.com"},
        AllowMethods:     []string{"GET", "POST", "PUT", "DELETE"},
        AllowHeaders:     []string{"Content-Type", "Authorization"},
        ExposeHeaders:    []string{"X-Total-Count"},
        AllowCredentials: true,
        MaxAge:           12 * time.Hour,
    }
    
    r.Use(cors.New(config))
    
    r.Run(":8080")
}
```

### Secrets Management

**Environment Variables**:
```python
import os
from dotenv import load_dotenv

load_dotenv()

DATABASE_URL = os.getenv('DATABASE_URL')
SECRET_KEY = os.getenv('SECRET_KEY')
API_KEY = os.getenv('API_KEY')
```

**HashiCorp Vault**:
```python
import hvac

client = hvac.Client(url='http://localhost:8200', token='your-token')

# Read secret
secret = client.secrets.kv.v2.read_secret_version(path='myapp/config')
db_password = secret['data']['data']['db_password']

# Write secret
client.secrets.kv.v2.create_or_update_secret(
    path='myapp/config',
    secret={'db_password': 'newpass123'}
)
```

### API Security Headers

```python
@app.after_request
def security_headers(response):
    response.headers['X-Content-Type-Options'] = 'nosniff'
    response.headers['X-Frame-Options'] = 'DENY'
    response.headers['X-XSS-Protection'] = '1; mode=block'
    response.headers['Strict-Transport-Security'] = 'max-age=31536000; includeSubDomains'
    response.headers['Content-Security-Policy'] = "default-src 'self'"
    return response
```

---

## Rate Limiting & Throttling

### What is Rate Limiting?

**Rate Limiting**: Controlling the rate of requests to prevent abuse and ensure fair usage.

**Why Rate Limit**:
```
✅ Prevent DoS attacks
✅ Protect backend resources
✅ Ensure fair usage
✅ Reduce costs
✅ Maintain service quality
```

### Rate Limiting Algorithms

**1. Fixed Window**:
```
Allow N requests per time window

Example: 100 requests per minute
00:00-00:59 → 100 requests allowed
01:00-01:59 → 100 requests allowed (counter resets)

Pros: Simple
Cons: Burst at window boundary (200 requests in 2 seconds)
```

**2. Sliding Window**:
```
Track requests in rolling time window

Example: 100 requests per minute
At 00:30, check requests from 23:30-00:30

Pros: More accurate
Cons: More complex, memory intensive
```

**3. Token Bucket**:
```
Bucket fills with tokens at fixed rate
Each request consumes a token
Allow bursts up to bucket capacity

Pros: Allows controlled bursts
Cons: More complex
```

**4. Leaky Bucket**:
```
Requests added to queue
Processed at fixed rate
Queue has max size

Pros: Smooth traffic
Cons: Can delay requests
```

### Rate Limiting Implementation (Python + Redis)

**Token Bucket Algorithm**:
```python
import redis
import time
from flask import Flask, request, jsonify
from functools import wraps

app = Flask(__name__)
redis_client = redis.Redis(host='localhost', port=6379, decode_responses=True)

class TokenBucket:
    def __init__(self, capacity, refill_rate):
        self.capacity = capacity
        self.refill_rate = refill_rate  # tokens per second
    
    def allow_request(self, key):
        """Check if request is allowed"""
        now = time.time()
        
        # Get current bucket state
        bucket_data = redis_client.hgetall(key)
        
        if not bucket_data:
            # New bucket
            tokens = self.capacity - 1
            last_refill = now
        else:
            tokens = float(bucket_data['tokens'])
            last_refill = float(bucket_data['last_refill'])
            
            # Refill tokens
            time_passed = now - last_refill
            new_tokens = time_passed * self.refill_rate
            tokens = min(self.capacity, tokens + new_tokens)
            
            # Consume token
            if tokens >= 1:
                tokens -= 1
            else:
                return False
        
        # Update bucket
        redis_client.hset(key, mapping={
            'tokens': tokens,
            'last_refill': now
        })
        redis_client.expire(key, 3600)  # Expire after 1 hour
        
        return True

bucket = TokenBucket(capacity=10, refill_rate=1)  # 10 tokens, refill 1/second

def rate_limit(f):
    @wraps(f)
    def wrapper(*args, **kwargs):
        # Use IP address as key
        key = f"rate_limit:{request.remote_addr}"
        
        if not bucket.allow_request(key):
            return jsonify({'error': 'Rate limit exceeded'}), 429
        
        return f(*args, **kwargs)
    return wrapper

@app.route('/api/data')
@rate_limit
def get_data():
    return jsonify({'data': 'Hello, World!'})

if __name__ == '__main__':
    app.run(debug=True)
```

**Sliding Window Algorithm**:
```python
import redis
import time
from flask import request, jsonify

redis_client = redis.Redis(host='localhost', port=6379)

def sliding_window_rate_limit(max_requests=10, window=60):
    """Rate limit using sliding window"""
    def decorator(f):
        def wrapper(*args, **kwargs):
            key = f"rate_limit:{request.remote_addr}"
            now = time.time()
            window_start = now - window
            
            # Remove old entries
            redis_client.zremrangebyscore(key, 0, window_start)
            
            # Count requests in window
            request_count = redis_client.zcard(key)
            
            if request_count >= max_requests:
                retry_after = int(window)
                return jsonify({'error': 'Rate limit exceeded'}), 429, {
                    'Retry-After': retry_after
                }
            
            # Add current request
            redis_client.zadd(key, {str(now): now})
            redis_client.expire(key, window)
            
            # Add rate limit headers
            response = f(*args, **kwargs)
            if isinstance(response, tuple):
                data, status_code = response
                headers = {
                    'X-RateLimit-Limit': str(max_requests),
                    'X-RateLimit-Remaining': str(max_requests - request_count - 1),
                    'X-RateLimit-Reset': str(int(now + window))
                }
                return data, status_code, headers
            return response
        
        return wrapper
    return decorator

@app.route('/api/search')
@sliding_window_rate_limit(max_requests=5, window=60)
def search():
    return jsonify({'results': []})
```

### Rate Limiting Implementation (Go + Redis)

```go
package main

import (
    "context"
    "fmt"
    "log"
    "net/http"
    "strconv"
    "time"
    
    "github.com/gin-gonic/gin"
    "github.com/go-redis/redis/v8"
)

var (
    ctx = context.Background()
    rdb *redis.Client
)

type RateLimiter struct {
    maxRequests int
    window      time.Duration
}

func NewRateLimiter(maxRequests int, window time.Duration) *RateLimiter {
    return &RateLimiter{
        maxRequests: maxRequests,
        window:      window,
    }
}

func (rl *RateLimiter) Allow(ip string) (bool, int) {
    key := fmt.Sprintf("rate_limit:%s", ip)
    now := time.Now().Unix()
    windowStart := now - int64(rl.window.Seconds())
    
    pipe := rdb.Pipeline()
    
    // Remove old entries
    pipe.ZRemRangeByScore(ctx, key, "0", strconv.FormatInt(windowStart, 10))
    
    // Count requests in window
    countCmd := pipe.ZCard(ctx, key)
    
    // Add current request
    pipe.ZAdd(ctx, key, &redis.Z{
        Score:  float64(now),
        Member: fmt.Sprintf("%d", now),
    })
    
    // Set expiry
    pipe.Expire(ctx, key, rl.window)
    
    _, err := pipe.Exec(ctx)
    if err != nil {
        return false, 0
    }
    
    count := int(countCmd.Val())
    remaining := rl.maxRequests - count
    
    if count > rl.maxRequests {
        return false, 0
    }
    
    return true, remaining
}

func RateLimitMiddleware(rl *RateLimiter) gin.HandlerFunc {
    return func(c *gin.Context) {
        ip := c.ClientIP()
        
        allowed, remaining := rl.Allow(ip)
        
        // Set rate limit headers
        c.Header("X-RateLimit-Limit", strconv.Itoa(rl.maxRequests))
        c.Header("X-RateLimit-Remaining", strconv.Itoa(remaining))
        c.Header("X-RateLimit-Reset", strconv.FormatInt(time.Now().Add(rl.window).Unix(), 10))
        
        if !allowed {
            c.Header("Retry-After", strconv.Itoa(int(rl.window.Seconds())))
            c.JSON(http.StatusTooManyRequests, gin.H{
                "error": "Rate limit exceeded",
            })
            c.Abort()
            return
        }
        
        c.Next()
    }
}

func main() {
    // Initialize Redis
    rdb = redis.NewClient(&redis.Options{
        Addr: "localhost:6379",
    })
    
    r := gin.Default()
    
    // Rate limiter: 10 requests per minute
    limiter := NewRateLimiter(10, time.Minute)
    r.Use(RateLimitMiddleware(limiter))
    
    r.GET("/api/data", func(c *gin.Context) {
        c.JSON(200, gin.H{"data": "Hello, World!"})
    })
    
    log.Println("Server started on :8080")
    r.Run(":8080")
}
```

### Different Rate Limits for Different Users

```python
def get_rate_limit(user):
    """Different limits based on user tier"""
    if user.tier == 'premium':
        return 1000  # 1000 requests per hour
    elif user.tier == 'standard':
        return 100
    else:
        return 10

@app.route('/api/search')
def search():
    user = get_current_user()
    limit = get_rate_limit(user)
    
    key = f"rate_limit:{user.id}"
    
    # Check rate limit
    count = redis_client.incr(key)
    if count == 1:
        redis_client.expire(key, 3600)  # 1 hour
    
    if count > limit:
        return jsonify({'error': 'Rate limit exceeded'}), 429
    
    return jsonify({'results': []})
```

### Distributed Rate Limiting

**Using Redis Lua Script** (Atomic):
```python
RATE_LIMIT_SCRIPT = """
local key = KEYS[1]
local limit = tonumber(ARGV[1])
local window = tonumber(ARGV[2])
local now = tonumber(ARGV[3])

local count = redis.call('INCR', key)

if count == 1 then
    redis.call('EXPIRE', key, window)
end

if count > limit then
    return 0
else
    return 1
end
"""

def check_rate_limit(user_id, limit=10, window=60):
    key = f"rate_limit:{user_id}"
    now = int(time.time())
    
    result = redis_client.eval(
        RATE_LIMIT_SCRIPT,
        1,
        key,
        limit,
        window,
        now
    )
    
    return result == 1
```

### Rate Limit Response Headers

```python
@app.route('/api/data')
def get_data():
    user = get_current_user()
    key = f"rate_limit:{user.id}"
    
    # Check rate limit
    count = int(redis_client.get(key) or 0)
    limit = 100
    remaining = max(0, limit - count)
    reset_time = int(time.time()) + 3600
    
    response = jsonify({'data': 'Hello'})
    response.headers['X-RateLimit-Limit'] = str(limit)
    response.headers['X-RateLimit-Remaining'] = str(remaining)
    response.headers['X-RateLimit-Reset'] = str(reset_time)
    
    return response
```

### Open Source & Commercial Tools

**Open Source**:
- **Redis**: In-memory data store for rate limiting
- **Nginx**: `limit_req` module
- **Kong**: Rate limiting plugin
- **Traefik**: Rate limiting middleware

**Commercial**:
- **AWS API Gateway**: Built-in rate limiting
- **Cloudflare**: DDoS protection + rate limiting (Free-$200/month)
- **Fastly**: Rate limiting + edge compute
- **Tyk**: API management with rate limiting

---

## Error Handling & Logging

### Structured Error Responses

**Standard Error Format**:
```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Validation failed",
    "details": [
      {
        "field": "email",
        "message": "Invalid email format"
      }
    ],
    "request_id": "550e8400-e29b-41d4-a716-446655440000",
    "timestamp": "2024-01-01T12:00:00Z"
  }
}
```

**Python Implementation**:
```python
from flask import Flask, jsonify, request
import uuid
from datetime import datetime
import traceback

app = Flask(__name__)

class APIError(Exception):
    """Base API exception"""
    def __init__(self, message, status_code=400, details=None):
        super().__init__(message)
        self.message = message
        self.status_code = status_code
        self.details = details or []

class ValidationError(APIError):
    def __init__(self, details):
        super().__init__("Validation failed", 400, details)

class NotFoundError(APIError):
    def __init__(self, resource):
        super().__init__(f"{resource} not found", 404)

class UnauthorizedError(APIError):
    def __init__(self):
        super().__init__("Unauthorized", 401)

@app.errorhandler(APIError)
def handle_api_error(error):
    """Handle custom API errors"""
    response = {
        'error': {
            'code': error.__class__.__name__.replace('Error', '').upper(),
            'message': error.message,
            'details': error.details,
            'request_id': str(uuid.uuid4()),
            'timestamp': datetime.utcnow().isoformat() + 'Z'
        }
    }
    return jsonify(response), error.status_code

@app.errorhandler(404)
def not_found(error):
    """Handle 404 errors"""
    return jsonify({
        'error': {
            'code': 'NOT_FOUND',
            'message': 'Resource not found',
            'path': request.path
        }
    }), 404

@app.errorhandler(500)
def internal_error(error):
    """Handle 500 errors"""
    # Log error
    app.logger.error(f"Internal error: {error}\n{traceback.format_exc()}")
    
    # Don't expose internal details to client
    return jsonify({
        'error': {
            'code': 'INTERNAL_ERROR',
            'message': 'An internal error occurred',
            'request_id': str(uuid.uuid4())
        }
    }), 500

# Usage
@app.route('/users/<int:user_id>')
def get_user(user_id):
    user = db.get_user(user_id)
    if not user:
        raise NotFoundError('User')
    return jsonify(user)

@app.route('/users', methods=['POST'])
def create_user():
    data = request.json
    
    errors = []
    if 'email' not in data:
        errors.append({'field': 'email', 'message': 'Required field'})
    if 'name' not in data:
        errors.append({'field': 'name', 'message': 'Required field'})
    
    if errors:
        raise ValidationError(errors)
    
    user = db.create_user(data)
    return jsonify(user), 201
```

### Structured Logging

**Python (structlog)**:
```python
# pip install structlog

import structlog
from flask import Flask, request, g
import uuid
import time

# Configure structlog
structlog.configure(
    processors=[
        structlog.stdlib.add_log_level,
        structlog.stdlib.add_logger_name,
        structlog.processors.TimeStamper(fmt="iso"),
        structlog.processors.StackInfoRenderer(),
        structlog.processors.format_exc_info,
        structlog.processors.JSONRenderer()
    ],
    context_class=dict,
    logger_factory=structlog.stdlib.LoggerFactory(),
)

logger = structlog.get_logger()

app = Flask(__name__)

@app.before_request
def before_request():
    """Add request context"""
    g.request_id = str(uuid.uuid4())
    g.start_time = time.time()
    
    logger.info(
        "request_started",
        request_id=g.request_id,
        method=request.method,
        path=request.path,
        ip=request.remote_addr,
        user_agent=request.user_agent.string
    )

@app.after_request
def after_request(response):
    """Log response"""
    duration = time.time() - g.start_time
    
    logger.info(
        "request_completed",
        request_id=g.request_id,
        status_code=response.status_code,
        duration_ms=round(duration * 1000, 2)
    )
    
    # Add request ID to response headers
    response.headers['X-Request-ID'] = g.request_id
    
    return response

@app.route('/users/<user_id>')
def get_user(user_id):
    logger.info("fetching_user", request_id=g.request_id, user_id=user_id)
    
    # Simulate database query
    user = {'id': user_id, 'name': 'Alice'}
    
    logger.info("user_fetched", request_id=g.request_id, user_id=user_id)
    
    return jsonify(user)

# Output:
# {"event": "request_started", "request_id": "abc123", "method": "GET", "path": "/users/1", ...}
# {"event": "fetching_user", "request_id": "abc123", "user_id": "1"}
# {"event": "user_fetched", "request_id": "abc123", "user_id": "1"}
# {"event": "request_completed", "request_id": "abc123", "status_code": 200, "duration_ms": 12.5}
```

**Go (zap)**:
```go
// go get go.uber.org/zap

package main

import (
    "net/http"
    "time"
    
    "github.com/gin-gonic/gin"
    "github.com/google/uuid"
    "go.uber.org/zap"
)

var logger *zap.Logger

func init() {
    var err error
    // Production logger (JSON)
    logger, err = zap.NewProduction()
    // Development logger (console)
    // logger, err = zap.NewDevelopment()
    
    if err != nil {
        panic(err)
    }
}

func RequestLogger() gin.HandlerFunc {
    return func(c *gin.Context) {
        start := time.Now()
        requestID := uuid.New().String()
        
        // Add request ID to context
        c.Set("request_id", requestID)
        c.Header("X-Request-ID", requestID)
        
        logger.Info("request_started",
            zap.String("request_id", requestID),
            zap.String("method", c.Request.Method),
            zap.String("path", c.Request.URL.Path),
            zap.String("ip", c.ClientIP()),
        )
        
        c.Next()
        
        duration := time.Since(start)
        
        logger.Info("request_completed",
            zap.String("request_id", requestID),
            zap.Int("status", c.Writer.Status()),
            zap.Duration("duration", duration),
        )
    }
}

func main() {
    defer logger.Sync()
    
    r := gin.Default()
    r.Use(RequestLogger())
    
    r.GET("/users/:id", func(c *gin.Context) {
        userID := c.Param("id")
        requestID, _ := c.Get("request_id")
        
        logger.Info("fetching_user",
            zap.String("request_id", requestID.(string)),
            zap.String("user_id", userID),
        )
        
        c.JSON(200, gin.H{"id": userID, "name": "Alice"})
    })
    
    r.Run(":8080")
}
```

### Centralized Logging (ELK Stack)

**Logstash Configuration**:
```ruby
# logstash.conf
input {
  file {
    path => "/var/log/app/*.json"
    codec => "json"
  }
}

filter {
  # Parse timestamp
  date {
    match => ["timestamp", "ISO8601"]
  }
  
  # Add tags based on log level
  if [level] == "ERROR" {
    mutate {
      add_tag => ["error"]
    }
  }
}

output {
  elasticsearch {
    hosts => ["localhost:9200"]
    index => "app-logs-%{+YYYY.MM.dd}"
  }
}
```

**Send logs to Elasticsearch**:
```python
from elasticsearch import Elasticsearch
import logging

es = Elasticsearch(['localhost:9200'])

class ElasticsearchHandler(logging.Handler):
    def emit(self, record):
        log_entry = {
            'timestamp': record.created,
            'level': record.levelname,
            'message': record.getMessage(),
            'logger': record.name,
            'path': record.pathname,
            'line': record.lineno
        }
        
        es.index(index='app-logs', document=log_entry)

logger = logging.getLogger('myapp')
logger.addHandler(ElasticsearchHandler())
```

### Error Tracking (Sentry)

```python
# pip install sentry-sdk

import sentry_sdk
from sentry_sdk.integrations.flask import FlaskIntegration

sentry_sdk.init(
    dsn="https://examplePublicKey@o0.ingest.sentry.io/0",
    integrations=[FlaskIntegration()],
    traces_sample_rate=1.0,
    environment="production"
)

@app.route('/users/<user_id>')
def get_user(user_id):
    try:
        user = db.get_user(user_id)
        return jsonify(user)
    except Exception as e:
        # Automatically captured by Sentry
        sentry_sdk.capture_exception(e)
        raise
```

### Log Levels

```python
import logging

logger = logging.getLogger(__name__)
logger.setLevel(logging.INFO)

# DEBUG: Detailed debugging info
logger.debug("User query SQL: SELECT * FROM users WHERE id = 1")

# INFO: General informational messages
logger.info("User logged in", extra={'user_id': 123})

# WARNING: Warning messages
logger.warning("Rate limit approaching", extra={'remaining': 5})

# ERROR: Error messages
logger.error("Database connection failed", exc_info=True)

# CRITICAL: Critical errors
logger.critical("System out of memory")
```

### Open Source & Commercial Tools

**Open Source**:
- **ELK Stack** (Elasticsearch, Logstash, Kibana): Log aggregation
- **Grafana Loki**: Log aggregation (lightweight)
- **Fluentd**: Log collector
- **Graylog**: Log management

**Commercial**:
- **Datadog**: $15-23 per host/month
- **New Relic**: $25-100/user/month
- **Splunk**: $150-1,800/GB/month
- **Sentry**: Free-$80/month
- **Loggly**: $79-399/month

---

## API Documentation

### OpenAPI (Swagger)

**Specification** (openapi.yaml):
```yaml
openapi: 3.0.0
info:
  title: User API
  version: 1.0.0

servers:
  - url: https://api.example.com/v1

paths:
  /users:
    get:
      summary: List all users
      parameters:
        - name: page
          in: query
          schema:
            type: integer
        - name: limit
          in: query
          schema:
            type: integer
      responses:
        '200':
          description: Success
          content:
            application/json:
              schema:
                type: array
                items:
                  $ref: '#/components/schemas/User'
    
    post:
      summary: Create user
      requestBody:
        required: true
        content:
          application/json:
            schema:
              $ref: '#/components/schemas/CreateUserRequest'
      responses:
        '201':
          description: Created
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/User'

components:
  schemas:
    User:
      type: object
      properties:
        id:
          type: integer
        name:
          type: string
        email:
          type: string
    
    CreateUserRequest:
      type: object
      required:
        - name
        - email
      properties:
        name:
          type: string
        email:
          type: string
          format: email
```

**Auto-Generate Docs** (Python):
```python
from flask import Flask
from flask_restx import Api, Resource, fields

app = Flask(__name__)
api = Api(app, version='1.0', title='User API',
          description='A simple User API')

user_model = api.model('User', {
    'id': fields.Integer,
    'name': fields.String(required=True),
    'email': fields.String(required=True)
})

@api.route('/users')
class UserList(Resource):
    @api.doc('list_users')
    @api.marshal_list_with(user_model)
    def get(self):
        """List all users"""
        return [{'id': 1, 'name': 'Alice', 'email': 'alice@example.com'}]
    
    @api.doc('create_user')
    @api.expect(user_model)
    @api.marshal_with(user_model, code=201)
    def post(self):
        """Create a user"""
        return api.payload, 201

# Access: http://localhost:5000 (Swagger UI auto-generated)
```

---

## API Testing

### Types of API Testing

**1. Unit Testing**: Test individual functions
**2. Integration Testing**: Test API endpoints
**3. Contract Testing**: Validate API contracts
**4. Load Testing**: Test under high load
**5. Security Testing**: Test for vulnerabilities

### Unit Testing (Python - pytest)

```python
# pip install pytest pytest-flask

import pytest
from myapp import app, db
from myapp.models import User

@pytest.fixture
def client():
    app.config['TESTING'] = True
    app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///:memory:'
    
    with app.test_client() as client:
        with app.app_context():
            db.create_all()
        yield client
        with app.app_context():
            db.drop_all()

def test_get_users(client):
    """Test GET /users"""
    response = client.get('/users')
    assert response.status_code == 200
    assert response.json == []

def test_create_user(client):
    """Test POST /users"""
    response = client.post('/users', json={
        'name': 'Alice',
        'email': 'alice@example.com'
    })
    assert response.status_code == 201
    assert response.json['name'] == 'Alice'

def test_create_user_validation_error(client):
    """Test validation error"""
    response = client.post('/users', json={
        'name': 'Alice'
        # Missing email
    })
    assert response.status_code == 400
    assert 'error' in response.json

def test_get_user_not_found(client):
    """Test 404 error"""
    response = client.get('/users/999')
    assert response.status_code == 404

def test_authentication_required(client):
    """Test authentication"""
    response = client.get('/admin/users')
    assert response.status_code == 401

def test_authenticated_request(client):
    """Test with auth token"""
    # Login first
    login_response = client.post('/login', json={
        'email': 'admin@example.com',
        'password': 'password'
    })
    token = login_response.json['token']
    
    # Make authenticated request
    response = client.get('/admin/users', headers={
        'Authorization': f'Bearer {token}'
    })
    assert response.status_code == 200
```

### Integration Testing (Go - httptest)

```go
package main

import (
    "bytes"
    "encoding/json"
    "net/http"
    "net/http/httptest"
    "testing"
    
    "github.com/gin-gonic/gin"
    "github.com/stretchr/testify/assert"
)

func setupRouter() *gin.Engine {
    gin.SetMode(gin.TestMode)
    r := gin.Default()
    
    // Setup routes
    r.GET("/users", getUsers)
    r.POST("/users", createUser)
    r.GET("/users/:id", getUser)
    
    return r
}

func TestGetUsers(t *testing.T) {
    router := setupRouter()
    
    w := httptest.NewRecorder()
    req, _ := http.NewRequest("GET", "/users", nil)
    router.ServeHTTP(w, req)
    
    assert.Equal(t, 200, w.Code)
    
    var response []User
    json.Unmarshal(w.Body.Bytes(), &response)
    assert.NotNil(t, response)
}

func TestCreateUser(t *testing.T) {
    router := setupRouter()
    
    user := User{Name: "Alice", Email: "alice@example.com"}
    jsonData, _ := json.Marshal(user)
    
    w := httptest.NewRecorder()
    req, _ := http.NewRequest("POST", "/users", bytes.NewBuffer(jsonData))
    req.Header.Set("Content-Type", "application/json")
    router.ServeHTTP(w, req)
    
    assert.Equal(t, 201, w.Code)
    
    var response User
    json.Unmarshal(w.Body.Bytes(), &response)
    assert.Equal(t, "Alice", response.Name)
}

func TestGetUserNotFound(t *testing.T) {
    router := setupRouter()
    
    w := httptest.NewRecorder()
    req, _ := http.NewRequest("GET", "/users/999", nil)
    router.ServeHTTP(w, req)
    
    assert.Equal(t, 404, w.Code)
}
```

### Contract Testing (Pact)

**Consumer Test** (Python):
```python
# pip install pact-python

from pact import Consumer, Provider

pact = Consumer('UserService').has_pact_with(Provider('UserAPI'))

def test_get_user():
    expected = {
        'id': 1,
        'name': 'Alice',
        'email': 'alice@example.com'
    }
    
    (pact
     .given('user 1 exists')
     .upon_receiving('a request for user 1')
     .with_request('GET', '/users/1')
     .will_respond_with(200, body=expected))
    
    with pact:
        response = requests.get('http://localhost:1234/users/1')
        assert response.json() == expected
```

### Load Testing (Locust)

```python
# pip install locust
# locustfile.py

from locust import HttpUser, task, between

class APIUser(HttpUser):
    wait_time = between(1, 3)  # Wait 1-3 seconds between requests
    
    def on_start(self):
        """Login once per user"""
        response = self.client.post("/login", json={
            "email": "test@example.com",
            "password": "password"
        })
        self.token = response.json()['token']
    
    @task(3)  # Weight: 3x more likely than other tasks
    def get_users(self):
        self.client.get("/users", headers={
            "Authorization": f"Bearer {self.token}"
        })
    
    @task(1)
    def create_user(self):
        self.client.post("/users", json={
            "name": "Test User",
            "email": "test@example.com"
        }, headers={
            "Authorization": f"Bearer {self.token}"
        })
    
    @task(2)
    def get_user_detail(self):
        self.client.get("/users/1", headers={
            "Authorization": f"Bearer {self.token}"
        })

# Run: locust -f locustfile.py --host=http://localhost:5000
# Open: http://localhost:8089
```

**Load Testing (k6)**:
```javascript
// loadtest.js
import http from 'k6/http';
import { check, sleep } from 'k6';

export let options = {
    stages: [
        { duration: '30s', target: 10 },   // Ramp up to 10 users
        { duration: '1m', target: 50 },    // Ramp up to 50 users
        { duration: '30s', target: 100 },  // Ramp up to 100 users
        { duration: '1m', target: 100 },   // Stay at 100 users
        { duration: '30s', target: 0 },    // Ramp down
    ],
    thresholds: {
        http_req_duration: ['p(95)<500'],  // 95% of requests < 500ms
        http_req_failed: ['rate<0.01'],     // < 1% errors
    },
};

export default function () {
    // Login
    let loginRes = http.post('http://localhost:5000/login', JSON.stringify({
        email: 'test@example.com',
        password: 'password'
    }), {
        headers: { 'Content-Type': 'application/json' },
    });
    
    check(loginRes, {
        'login successful': (r) => r.status === 200,
    });
    
    let token = loginRes.json('token');
    
    // Get users
    let usersRes = http.get('http://localhost:5000/users', {
        headers: { 'Authorization': `Bearer ${token}` },
    });
    
    check(usersRes, {
        'users fetched': (r) => r.status === 200,
    });
    
    sleep(1);
}

// Run: k6 run loadtest.js
```

### Mocking (WireMock)

```python
# pip install wiremock

from wiremock import WireMock

wiremock = WireMock("localhost", 8080)

# Stub response
wiremock.stub_for({
    "request": {
        "method": "GET",
        "url": "/users/1"
    },
    "response": {
        "status": 200,
        "headers": {
            "Content-Type": "application/json"
        },
        "jsonBody": {
            "id": 1,
            "name": "Alice",
            "email": "alice@example.com"
        }
    }
})

# Test code makes real HTTP call to WireMock
response = requests.get("http://localhost:8080/users/1")
assert response.status_code == 200
```

### End-to-End Testing (Playwright)

```python
# pip install playwright
# playwright install

from playwright.sync_api import sync_playwright

def test_user_workflow():
    with sync_playwright() as p:
        browser = p.chromium.launch()
        page = browser.new_page()
        
        # Navigate to app
        page.goto("http://localhost:3000")
        
        # Login
        page.fill('input[name="email"]', 'test@example.com')
        page.fill('input[name="password"]', 'password')
        page.click('button[type="submit"]')
        
        # Wait for navigation
        page.wait_for_selector('#users-list')
        
        # Verify users loaded
        users = page.query_selector_all('.user-item')
        assert len(users) > 0
        
        browser.close()
```

### Testing Tools Comparison

| Tool | Type | Language | Use Case |
|------|------|----------|----------|
| **pytest** | Unit/Integration | Python | Python APIs |
| **Go testing** | Unit/Integration | Go | Go APIs |
| **Postman/Newman** | Integration | N/A | API testing |
| **Pact** | Contract | Multiple | Microservices |
| **Locust** | Load | Python | Performance |
| **k6** | Load | JavaScript | Performance |
| **JMeter** | Load | Java | Performance |
| **WireMock** | Mocking | Java/Python | API mocking |
| **Playwright** | E2E | Multiple | Browser testing |

### Open Source & Commercial Tools

**Open Source**:
- **pytest**: Python testing framework
- **Jest**: JavaScript testing
- **Locust**: Load testing (Python)
- **k6**: Load testing (Go-based)
- **Pact**: Contract testing
- **WireMock**: API mocking

**Commercial**:
- **Postman**: Free-$49/user/month
- **Katalon**: Free-$208/user/month
- **BlazeMeter**: $99-Custom/month
- **Gatling Enterprise**: Custom pricing

---

## API Monitoring & Observability

### Three Pillars of Observability

**1. Metrics**: Numerical data (latency, error rate)
**2. Logs**: Event records
**3. Traces**: Request flow through systems

### Metrics Collection (Prometheus)

**Python (prometheus_client)**:
```python
# pip install prometheus-client

from flask import Flask
from prometheus_client import Counter, Histogram, Gauge, generate_latest
import time

app = Flask(__name__)

# Metrics
REQUEST_COUNT = Counter(
    'api_requests_total',
    'Total API requests',
    ['method', 'endpoint', 'status']
)

REQUEST_DURATION = Histogram(
    'api_request_duration_seconds',
    'API request duration',
    ['method', 'endpoint']
)

ACTIVE_REQUESTS = Gauge(
    'api_active_requests',
    'Number of active requests'
)

@app.before_request
def before_request():
    request.start_time = time.time()
    ACTIVE_REQUESTS.inc()

@app.after_request
def after_request(response):
    # Record duration
    duration = time.time() - request.start_time
    REQUEST_DURATION.labels(
        method=request.method,
        endpoint=request.path
    ).observe(duration)
    
    # Record request count
    REQUEST_COUNT.labels(
        method=request.method,
        endpoint=request.path,
        status=response.status_code
    ).inc()
    
    ACTIVE_REQUESTS.dec()
    
    return response

@app.route('/metrics')
def metrics():
    """Prometheus metrics endpoint"""
    return generate_latest()

@app.route('/users')
def get_users():
    return jsonify([{'id': 1, 'name': 'Alice'}])

if __name__ == '__main__':
    app.run(debug=True)
```

**Prometheus Configuration**:
```yaml
# prometheus.yml
global:
  scrape_interval: 15s

scrape_configs:
  - job_name: 'api'
    static_configs:
      - targets: ['localhost:5000']
```

**Go (prometheus/client_golang)**:
```go
package main

import (
    "net/http"
    "time"
    
    "github.com/gin-gonic/gin"
    "github.com/prometheus/client_golang/prometheus"
    "github.com/prometheus/client_golang/prometheus/promhttp"
)

var (
    requestCount = prometheus.NewCounterVec(
        prometheus.CounterOpts{
            Name: "api_requests_total",
            Help: "Total API requests",
        },
        []string{"method", "endpoint", "status"},
    )
    
    requestDuration = prometheus.NewHistogramVec(
        prometheus.HistogramOpts{
            Name:    "api_request_duration_seconds",
            Help:    "API request duration",
            Buckets: prometheus.DefBuckets,
        },
        []string{"method", "endpoint"},
    )
)

func init() {
    prometheus.MustRegister(requestCount)
    prometheus.MustRegister(requestDuration)
}

func PrometheusMiddleware() gin.HandlerFunc {
    return func(c *gin.Context) {
        start := time.Now()
        
        c.Next()
        
        duration := time.Since(start).Seconds()
        
        requestDuration.WithLabelValues(
            c.Request.Method,
            c.FullPath(),
        ).Observe(duration)
        
        requestCount.WithLabelValues(
            c.Request.Method,
            c.FullPath(),
            string(rune(c.Writer.Status())),
        ).Inc()
    }
}

func main() {
    r := gin.Default()
    r.Use(PrometheusMiddleware())
    
    // Metrics endpoint
    r.GET("/metrics", gin.WrapH(promhttp.Handler()))
    
    r.GET("/users", func(c *gin.Context) {
        c.JSON(200, gin.H{"users": []string{}})
    })
    
    r.Run(":8080")
}
```

### Distributed Tracing (OpenTelemetry)

**Python**:
```python
# pip install opentelemetry-api opentelemetry-sdk opentelemetry-instrumentation-flask

from opentelemetry import trace
from opentelemetry.sdk.trace import TracerProvider
from opentelemetry.sdk.trace.export import BatchSpanProcessor, ConsoleSpanExporter
from opentelemetry.instrumentation.flask import FlaskInstrumentor
from opentelemetry.exporter.jaeger.thrift import JaegerExporter

# Setup tracer
trace.set_tracer_provider(TracerProvider())
tracer = trace.get_tracer(__name__)

# Export to Jaeger
jaeger_exporter = JaegerExporter(
    agent_host_name="localhost",
    agent_port=6831,
)

trace.get_tracer_provider().add_span_processor(
    BatchSpanProcessor(jaeger_exporter)
)

app = Flask(__name__)

# Auto-instrument Flask
FlaskInstrumentor().instrument_app(app)

@app.route('/users/<user_id>')
def get_user(user_id):
    # Create custom span
    with tracer.start_as_current_span("fetch_user_from_db") as span:
        span.set_attribute("user.id", user_id)
        
        # Simulate database query
        time.sleep(0.1)
        user = {'id': user_id, 'name': 'Alice'}
        
        span.set_attribute("user.name", user['name'])
    
    return jsonify(user)
```

### Health Checks

**Kubernetes-style Health Checks**:
```python
from flask import Flask, jsonify
import redis
import psycopg2

app = Flask(__name__)

@app.route('/health/live')
def liveness():
    """Liveness probe - is app running?"""
    return jsonify({'status': 'alive'}), 200

@app.route('/health/ready')
def readiness():
    """Readiness probe - is app ready to serve traffic?"""
    checks = {
        'database': check_database(),
        'redis': check_redis(),
    }
    
    all_healthy = all(checks.values())
    status_code = 200 if all_healthy else 503
    
    return jsonify({
        'status': 'ready' if all_healthy else 'not ready',
        'checks': checks
    }), status_code

def check_database():
    try:
        conn = psycopg2.connect("dbname=test user=test password=test")
        conn.close()
        return True
    except:
        return False

def check_redis():
    try:
        r = redis.Redis()
        r.ping()
        return True
    except:
        return False
```

### Alerting (Prometheus AlertManager)

**Alert Rules**:
```yaml
# alerts.yml
groups:
  - name: api_alerts
    interval: 30s
    rules:
      # High error rate
      - alert: HighErrorRate
        expr: |
          rate(api_requests_total{status=~"5.."}[5m]) > 0.05
        for: 5m
        labels:
          severity: critical
        annotations:
          summary: "High error rate detected"
          description: "Error rate is {{ $value }} errors/sec"
      
      # High latency
      - alert: HighLatency
        expr: |
          histogram_quantile(0.95, api_request_duration_seconds_bucket) > 1
        for: 10m
        labels:
          severity: warning
        annotations:
          summary: "High API latency"
          description: "95th percentile latency is {{ $value }}s"
      
      # Service down
      - alert: ServiceDown
        expr: up == 0
        for: 1m
        labels:
          severity: critical
        annotations:
          summary: "Service is down"
```

### APM (Application Performance Monitoring)

**New Relic**:
```python
# pip install newrelic

import newrelic.agent
newrelic.agent.initialize('newrelic.ini')

app = Flask(__name__)

# Wrap app with New Relic
app = newrelic.agent.WSGIApplicationWrapper(app)

@app.route('/users')
@newrelic.agent.function_trace()
def get_users():
    # Custom metrics
    newrelic.agent.record_custom_metric('Custom/Users/Count', len(users))
    return jsonify(users)
```

### Grafana Dashboards

**Dashboard JSON** (example):
```json
{
  "dashboard": {
    "title": "API Metrics",
    "panels": [
      {
        "title": "Request Rate",
        "targets": [{
          "expr": "rate(api_requests_total[5m])"
        }],
        "type": "graph"
      },
      {
        "title": "Error Rate",
        "targets": [{
          "expr": "rate(api_requests_total{status=~\"5..\"}[5m])"
        }],
        "type": "graph"
      },
      {
        "title": "95th Percentile Latency",
        "targets": [{
          "expr": "histogram_quantile(0.95, api_request_duration_seconds_bucket)"
        }],
        "type": "graph"
      }
    ]
  }
}
```

### SLI/SLO/SLA

**Service Level Indicators (SLI)**:
```
- Availability: % of successful requests
- Latency: p50, p95, p99 response times
- Error rate: % of failed requests
```

**Service Level Objectives (SLO)**:
```
- 99.9% availability (43 minutes downtime/month)
- p95 latency < 500ms
- Error rate < 0.1%
```

**Service Level Agreement (SLA)**:
```
- 99.5% uptime guarantee
- Penalties for breach
- Customer-facing commitment
```

**Measuring SLI**:
```python
# Calculate availability SLI
total_requests = prometheus_query("sum(api_requests_total)")
successful = prometheus_query("sum(api_requests_total{status=~'2..'})")
availability = successful / total_requests

# Check SLO
slo_target = 0.999  # 99.9%
if availability < slo_target:
    alert("SLO breached: availability is {:.2%}".format(availability))
```

### Open Source & Commercial Tools

**Open Source**:
- **Prometheus**: Metrics collection
- **Grafana**: Visualization
- **Jaeger**: Distributed tracing
- **OpenTelemetry**: Observability framework
- **ELK Stack**: Logs

**Commercial**:
- **Datadog**: $15-23/host/month
- **New Relic**: $25-100/user/month
- **Dynatrace**: $74-125/host/month
- **AppDynamics**: Custom pricing
- **Honeycomb**: $0-200/user/month

---

## Performance Optimization

### Database Query Optimization

**N+1 Query Problem**:
```python
# BAD: N+1 queries
users = User.query.all()  # 1 query
for user in users:
    orders = user.orders  # N queries (one per user)

# GOOD: Eager loading
users = User.query.options(joinedload(User.orders)).all()  # 1 or 2 queries
```

**Indexing**:
```sql
-- Before (slow)
SELECT * FROM users WHERE email = 'alice@example.com';  -- Table scan

-- Add index
CREATE INDEX idx_users_email ON users(email);

-- After (fast)
SELECT * FROM users WHERE email = 'alice@example.com';  -- Index scan
```

**Connection Pooling**:
```python
# pip install sqlalchemy

from sqlalchemy import create_engine
from sqlalchemy.pool import QueuePool

engine = create_engine(
    'postgresql://user:pass@localhost/db',
    poolclass=QueuePool,
    pool_size=10,           # Number of persistent connections
    max_overflow=20,        # Max additional connections
    pool_timeout=30,        # Timeout waiting for connection
    pool_recycle=3600,      # Recycle connections after 1 hour
)
```

**Go Connection Pooling**:
```go
db, err := sql.Open("postgres", "connection-string")

// Configure pool
db.SetMaxOpenConns(25)           // Max open connections
db.SetMaxIdleConns(10)           // Max idle connections
db.SetConnMaxLifetime(time.Hour) // Max connection lifetime
```

### Response Compression

**Python (gzip)**:
```python
from flask import Flask
from flask_compress import Compress

app = Flask(__name__)
Compress(app)  # Auto-compress responses > 500 bytes

@app.route('/users')
def get_users():
    # Response automatically compressed if client supports gzip
    return jsonify(large_user_list)
```

**Go (gzip)**:
```go
import "github.com/gin-contrib/gzip"

r := gin.Default()
r.Use(gzip.Gzip(gzip.DefaultCompression))

r.GET("/users", func(c *gin.Context) {
    c.JSON(200, largeUserList)  // Auto-compressed
})
```

### Async/Background Jobs

**Python (Celery)**:
```python
# pip install celery redis

from celery import Celery

celery = Celery('tasks', broker='redis://localhost:6379/0')

@celery.task
def send_email(user_id, subject, body):
    """Long-running task"""
    user = db.get_user(user_id)
    email_service.send(user.email, subject, body)

@app.route('/users', methods=['POST'])
def create_user():
    user = db.create_user(request.json)
    
    # Send email asynchronously
    send_email.delay(user.id, "Welcome", "Thanks for signing up!")
    
    return jsonify(user), 201

# Run worker: celery -A tasks worker
```

**Go (goroutines + channels)**:
```go
func createUser(c *gin.Context) {
    var user User
    c.BindJSON(&user)
    
    // Save to database
    db.Create(&user)
    
    // Send email asynchronously
    go func() {
        sendEmail(user.Email, "Welcome", "Thanks for signing up!")
    }()
    
    c.JSON(201, user)
}
```

### HTTP/2

**Benefits**:
```
- Multiplexing (multiple requests over one connection)
- Header compression
- Server push
- Binary protocol (faster parsing)
```

**Enable HTTP/2** (Python with gunicorn + SSL):
```bash
gunicorn --bind 0.0.0.0:443 \
         --certfile=cert.pem \
         --keyfile=key.pem \
         --worker-class=uvicorn.workers.UvicornWorker \
         app:app
```

### Response Pagination

**Offset-Based**:
```python
@app.route('/users')
def get_users():
    page = request.args.get('page', 1, type=int)
    per_page = request.args.get('per_page', 20, type=int)
    
    users = User.query.offset((page - 1) * per_page).limit(per_page).all()
    total = User.query.count()
    
    return jsonify({
        'data': users,
        'pagination': {
            'page': page,
            'per_page': per_page,
            'total': total,
            'pages': (total + per_page - 1) // per_page
        }
    })
```

**Cursor-Based** (better performance):
```python
@app.route('/users')
def get_users():
    cursor = request.args.get('cursor')  # Last seen ID
    limit = request.args.get('limit', 20, type=int)
    
    query = User.query.order_by(User.id)
    if cursor:
        query = query.filter(User.id > cursor)
    
    users = query.limit(limit + 1).all()
    has_more = len(users) > limit
    users = users[:limit]
    
    next_cursor = users[-1].id if has_more else None
    
    return jsonify({
        'data': users,
        'pagination': {
            'next_cursor': next_cursor,
            'has_more': has_more
        }
    })
```

### Field Selection (Sparse Fieldsets)

```python
@app.route('/users')
def get_users():
    fields = request.args.get('fields', '').split(',')
    
    if fields and fields[0]:
        # Return only requested fields
        allowed_fields = {'id', 'name', 'email', 'created_at'}
        selected = set(fields) & allowed_fields
        
        users = User.query.with_entities(*[getattr(User, f) for f in selected]).all()
    else:
        users = User.query.all()
    
    return jsonify(users)

# Request: GET /users?fields=id,name
# Response: [{"id": 1, "name": "Alice"}, ...]
```

### Profiling

**Python (cProfile)**:
```python
import cProfile
import pstats

def profile_endpoint():
    profiler = cProfile.Profile()
    profiler.enable()
    
    # Call your function
    result = get_users()
    
    profiler.disable()
    
    stats = pstats.Stats(profiler)
    stats.sort_stats('cumulative')
    stats.print_stats(10)  # Top 10 slowest functions
    
    return result
```

**Go (pprof)**:
```go
import _ "net/http/pprof"

func main() {
    go func() {
        log.Println(http.ListenAndServe("localhost:6060", nil))
    }()
    
    // Your app...
}

// Access: http://localhost:6060/debug/pprof/
// CPU profile: go tool pprof http://localhost:6060/debug/pprof/profile?seconds=30
```

---

## HATEOAS & Hypermedia

### What is HATEOAS?

**HATEOAS**: Hypermedia As The Engine Of Application State

**Concept**: API responses include links to related resources and possible actions.

### Richardson Maturity Model

```
Level 0: Single endpoint, single HTTP method
Level 1: Multiple resource URIs
Level 2: HTTP verbs (GET, POST, PUT, DELETE)
Level 3: HATEOAS (hypermedia controls)
```

### HATEOAS Example

**Response with Links**:
```json
{
  "id": 123,
  "name": "Alice",
  "email": "alice@example.com",
  "_links": {
    "self": {
      "href": "/users/123"
    },
    "orders": {
      "href": "/users/123/orders"
    },
    "edit": {
      "href": "/users/123",
      "method": "PUT"
    },
    "delete": {
      "href": "/users/123",
      "method": "DELETE"
    }
  }
}
```

### Implementation (Python - Flask)

```python
from flask import Flask, jsonify, url_for

app = Flask(__name__)

def user_to_json(user):
    """Convert user to JSON with HATEOAS links"""
    return {
        'id': user.id,
        'name': user.name,
        'email': user.email,
        '_links': {
            'self': {
                'href': url_for('get_user', user_id=user.id, _external=True)
            },
            'orders': {
                'href': url_for('get_user_orders', user_id=user.id, _external=True)
            },
            'edit': {
                'href': url_for('update_user', user_id=user.id, _external=True),
                'method': 'PUT'
            },
            'delete': {
                'href': url_for('delete_user', user_id=user.id, _external=True),
                'method': 'DELETE'
            }
        }
    }

@app.route('/users/<int:user_id>')
def get_user(user_id):
    user = db.get_user(user_id)
    return jsonify(user_to_json(user))

@app.route('/users')
def get_users():
    users = db.get_all_users()
    return jsonify({
        'users': [user_to_json(u) for u in users],
        '_links': {
            'self': {'href': url_for('get_users', _external=True)},
            'create': {
                'href': url_for('create_user', _external=True),
                'method': 'POST'
            }
        }
    })
```

### HAL (Hypertext Application Language)

**Format**:
```json
{
  "_links": {
    "self": { "href": "/users/123" },
    "orders": { "href": "/users/123/orders" }
  },
  "id": 123,
  "name": "Alice",
  "email": "alice@example.com",
  "_embedded": {
    "orders": [
      {
        "_links": { "self": { "href": "/orders/456" } },
        "id": 456,
        "total": 99.99
      }
    ]
  }
}
```

### JSON:API

**Format**:
```json
{
  "data": {
    "type": "users",
    "id": "123",
    "attributes": {
      "name": "Alice",
      "email": "alice@example.com"
    },
    "relationships": {
      "orders": {
        "links": {
          "self": "/users/123/relationships/orders",
          "related": "/users/123/orders"
        }
      }
    }
  },
  "links": {
    "self": "/users/123"
  }
}
```

---

## API Contracts & Schema Validation

### JSON Schema

**Schema Definition**:
```json
{
  "$schema": "http://json-schema.org/draft-07/schema#",
  "title": "User",
  "type": "object",
  "required": ["name", "email"],
  "properties": {
    "name": {
      "type": "string",
      "minLength": 2,
      "maxLength": 100
    },
    "email": {
      "type": "string",
      "format": "email"
    },
    "age": {
      "type": "integer",
      "minimum": 0,
      "maximum": 150
    }
  }
}
```

**Python Validation**:
```python
# pip install jsonschema

from jsonschema import validate, ValidationError

user_schema = {
    "type": "object",
    "required": ["name", "email"],
    "properties": {
        "name": {"type": "string", "minLength": 2},
        "email": {"type": "string", "format": "email"},
        "age": {"type": "integer", "minimum": 0}
    }
}

@app.route('/users', methods=['POST'])
def create_user():
    try:
        validate(instance=request.json, schema=user_schema)
    except ValidationError as e:
        return jsonify({'error': e.message}), 400
    
    user = db.create_user(request.json)
    return jsonify(user), 201
```

### Protocol Buffers (protobuf)

**Schema Definition** (.proto):
```protobuf
syntax = "proto3";

message User {
  int64 id = 1;
  string name = 2;
  string email = 3;
  int32 age = 4;
}

message CreateUserRequest {
  string name = 1;
  string email = 2;
}

message CreateUserResponse {
  User user = 1;
}

service UserService {
  rpc CreateUser (CreateUserRequest) returns (CreateUserResponse);
  rpc GetUser (GetUserRequest) returns (User);
}
```

### Pydantic (Python)

```python
# pip install pydantic

from pydantic import BaseModel, EmailStr, validator
from typing import Optional

class CreateUserRequest(BaseModel):
    name: str
    email: EmailStr
    age: Optional[int] = None
    
    @validator('name')
    def name_must_not_be_empty(cls, v):
        if len(v) < 2:
            raise ValueError('name must be at least 2 characters')
        return v
    
    @validator('age')
    def age_must_be_positive(cls, v):
        if v is not None and v < 0:
            raise ValueError('age must be positive')
        return v

@app.route('/users', methods=['POST'])
def create_user():
    try:
        request_data = CreateUserRequest(**request.json)
    except Exception as e:
        return jsonify({'error': str(e)}), 400
    
    user = db.create_user(request_data.dict())
    return jsonify(user), 201
```

---

## Batch Operations & Bulk APIs

### Batch Create

**Endpoint**:
```python
@app.route('/users/batch', methods=['POST'])
def batch_create_users():
    """Create multiple users in one request"""
    users_data = request.json  # List of user objects
    
    # Validate
    if not isinstance(users_data, list):
        return jsonify({'error': 'Expected array of users'}), 400
    
    if len(users_data) > 100:
        return jsonify({'error': 'Maximum 100 users per batch'}), 400
    
    results = []
    errors = []
    
    for idx, user_data in enumerate(users_data):
        try:
            user = db.create_user(user_data)
            results.append({
                'index': idx,
                'id': user.id,
                'status': 'created'
            })
        except Exception as e:
            errors.append({
                'index': idx,
                'error': str(e)
            })
    
    return jsonify({
        'results': results,
        'errors': errors,
        'summary': {
            'total': len(users_data),
            'successful': len(results),
            'failed': len(errors)
        }
    }), 207  # Multi-Status
```

### Bulk Update

**PATCH /users/bulk**:
```python
@app.route('/users/bulk', methods=['PATCH'])
def bulk_update():
    """
    Request:
    {
      "updates": [
        {"id": 1, "name": "Alice Updated"},
        {"id": 2, "email": "bob@new.com"}
      ]
    }
    """
    updates = request.json.get('updates', [])
    
    results = []
    for update in updates:
        user_id = update.pop('id')
        user = db.get_user(user_id)
        
        if user:
            for key, value in update.items():
                setattr(user, key, value)
            db.save(user)
            results.append({'id': user_id, 'status': 'updated'})
        else:
            results.append({'id': user_id, 'status': 'not_found'})
    
    return jsonify({'results': results})
```

### Async Processing with Job Queue

```python
@app.route('/users/import', methods=['POST'])
def import_users():
    """Import large CSV file"""
    file = request.files['file']
    
    # Create job
    job_id = str(uuid.uuid4())
    
    # Process asynchronously
    process_import.delay(job_id, file.read())
    
    return jsonify({
        'job_id': job_id,
        'status': 'processing',
        '_links': {
            'status': f'/jobs/{job_id}'
        }
    }), 202  # Accepted

@celery.task
def process_import(job_id, file_content):
    redis_client.hset(f'job:{job_id}', 'status', 'processing')
    
    try:
        # Process CSV
        users = parse_csv(file_content)
        for user in users:
            db.create_user(user)
        
        redis_client.hset(f'job:{job_id}', 'status', 'completed')
    except Exception as e:
        redis_client.hset(f'job:{job_id}', 'status', 'failed')
        redis_client.hset(f'job:{job_id}', 'error', str(e))

@app.route('/jobs/<job_id>')
def get_job_status(job_id):
    status = redis_client.hgetall(f'job:{job_id}')
    return jsonify(status)
```

---

## Pagination Patterns

### Offset-Based Pagination

```python
@app.route('/users')
def get_users():
    page = request.args.get('page', 1, type=int)
    per_page = min(request.args.get('per_page', 20, type=int), 100)
    
    users = User.query.offset((page - 1) * per_page).limit(per_page).all()
    total = User.query.count()
    
    return jsonify({
        'data': [user.to_dict() for user in users],
        'pagination': {
            'page': page,
            'per_page': per_page,
            'total': total,
            'pages': (total + per_page - 1) // per_page,
            'has_next': page * per_page < total,
            'has_prev': page > 1
        },
        '_links': {
            'self': url_for('get_users', page=page, per_page=per_page),
            'next': url_for('get_users', page=page+1, per_page=per_page) if page * per_page < total else None,
            'prev': url_for('get_users', page=page-1, per_page=per_page) if page > 1 else None
        }
    })
```

### Cursor-Based Pagination

```python
@app.route('/users')
def get_users():
    cursor = request.args.get('cursor')
    limit = min(request.args.get('limit', 20, type=int), 100)
    
    query = User.query.order_by(User.id)
    
    if cursor:
        query = query.filter(User.id > int(cursor))
    
    users = query.limit(limit + 1).all()
    has_more = len(users) > limit
    users = users[:limit]
    
    next_cursor = str(users[-1].id) if has_more and users else None
    
    return jsonify({
        'data': [user.to_dict() for user in users],
        'pagination': {
            'next_cursor': next_cursor,
            'has_more': has_more
        }
    })
```

### Keyset Pagination

```python
@app.route('/users')
def get_users():
    last_id = request.args.get('last_id', type=int)
    last_created = request.args.get('last_created')
    limit = 20
    
    query = User.query.order_by(User.created_at.desc(), User.id.desc())
    
    if last_created and last_id:
        query = query.filter(
            (User.created_at < last_created) |
            ((User.created_at == last_created) & (User.id < last_id))
        )
    
    users = query.limit(limit).all()
    
    return jsonify({
        'data': [user.to_dict() for user in users],
        'pagination': {
            'last_id': users[-1].id if users else None,
            'last_created': users[-1].created_at.isoformat() if users else None
        }
    })
```

---

## Internationalization (i18n)

### Accept-Language Header

```python
from flask import request
from babel import Locale

@app.route('/users/<user_id>')
def get_user(user_id):
    # Parse Accept-Language header
    lang = request.accept_languages.best_match(['en', 'es', 'fr', 'de'])
    
    user = db.get_user(user_id)
    
    # Translate messages
    message = {
        'en': 'User found',
        'es': 'Usuario encontrado',
        'fr': 'Utilisateur trouvé',
        'de': 'Benutzer gefunden'
    }.get(lang, 'User found')
    
    return jsonify({
        'message': message,
        'user': user.to_dict()
    })
```

### Error Messages Translation

```python
# translations.py
TRANSLATIONS = {
    'en': {
        'VALIDATION_ERROR': 'Validation failed',
        'NOT_FOUND': 'Resource not found',
        'UNAUTHORIZED': 'Unauthorized access'
    },
    'es': {
        'VALIDATION_ERROR': 'Error de validación',
        'NOT_FOUND': 'Recurso no encontrado',
        'UNAUTHORIZED': 'Acceso no autorizado'
    }
}

def translate(key, lang='en'):
    return TRANSLATIONS.get(lang, {}).get(key, key)

@app.errorhandler(404)
def not_found(error):
    lang = request.accept_languages.best_match(['en', 'es'])
    return jsonify({
        'error': {
            'code': 'NOT_FOUND',
            'message': translate('NOT_FOUND', lang)
        }
    }), 404
```

### Currency & Date Formatting

```python
from babel.numbers import format_currency
from babel.dates import format_datetime
from datetime import datetime

@app.route('/products/<product_id>')
def get_product(product_id):
    product = db.get_product(product_id)
    locale = request.accept_languages.best_match(['en_US', 'es_ES', 'fr_FR'])
    
    return jsonify({
        'name': product.name,
        'price': format_currency(product.price, 'USD', locale=locale),
        'created_at': format_datetime(product.created_at, locale=locale)
    })

# en_US: "$99.99", "Jan 1, 2024, 10:00:00 AM"
# es_ES: "99,99 US$", "1 ene 2024, 10:00:00"
```

---

## Database Integration

### Connection Pooling (Python)

```python
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, scoped_session

engine = create_engine(
    'postgresql://user:pass@localhost/db',
    pool_size=10,           # Maintain 10 connections
    max_overflow=20,        # Allow up to 20 extra connections
    pool_timeout=30,        # Wait 30s for available connection
    pool_recycle=3600,      # Recycle connections after 1 hour
    pool_pre_ping=True,     # Test connections before use
)

Session = scoped_session(sessionmaker(bind=engine))

@app.before_request
def before_request():
    request.db = Session()

@app.teardown_request
def teardown_request(exception=None):
    Session.remove()

@app.route('/users')
def get_users():
    users = request.db.query(User).all()
    return jsonify([u.to_dict() for u in users])
```

### Database Migrations (Alembic)

```python
# pip install alembic

# Initialize
# alembic init migrations

# Create migration
# alembic revision --autogenerate -m "create users table"

# migrations/versions/001_create_users.py
def upgrade():
    op.create_table(
        'users',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('name', sa.String(100), nullable=False),
        sa.Column('email', sa.String(255), nullable=False),
        sa.Column('created_at', sa.DateTime(), nullable=False),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index('idx_users_email', 'users', ['email'], unique=True)

def downgrade():
    op.drop_table('users')

# Apply migrations
# alembic upgrade head
```

### Read Replicas

```python
from sqlalchemy import create_engine
import random

# Master (writes)
master_engine = create_engine('postgresql://master/db')

# Replicas (reads)
replica_engines = [
    create_engine('postgresql://replica1/db'),
    create_engine('postgresql://replica2/db'),
]

def get_read_engine():
    """Load balance across replicas"""
    return random.choice(replica_engines)

@app.route('/users', methods=['GET'])
def get_users():
    # Use replica for reads
    engine = get_read_engine()
    with engine.connect() as conn:
        users = conn.execute("SELECT * FROM users").fetchall()
    return jsonify(users)

@app.route('/users', methods=['POST'])
def create_user():
    # Use master for writes
    with master_engine.connect() as conn:
        conn.execute("INSERT INTO users (name, email) VALUES (%s, %s)",
                    (request.json['name'], request.json['email']))
    return jsonify({'status': 'created'}), 201
```

---

## Message Queues & Async Processing

### RabbitMQ (Python)

```python
# pip install pika

import pika

connection = pika.BlockingConnection(pika.ConnectionParameters('localhost'))
channel = connection.channel()
channel.queue_declare(queue='tasks', durable=True)

@app.route('/users', methods=['POST'])
def create_user():
    user_data = request.json
    
    # Save to database
    user = db.create_user(user_data)
    
    # Publish to queue
    channel.basic_publish(
        exchange='',
        routing_key='tasks',
        body=json.dumps({'type': 'send_welcome_email', 'user_id': user.id}),
        properties=pika.BasicProperties(delivery_mode=2)  # Persistent
    )
    
    return jsonify(user.to_dict()), 201

# Worker
def callback(ch, method, properties, body):
    task = json.loads(body)
    if task['type'] == 'send_welcome_email':
        send_email(task['user_id'])
    ch.basic_ack(delivery_tag=method.delivery_tag)

channel.basic_qos(prefetch_count=1)
channel.basic_consume(queue='tasks', on_message_callback=callback)
channel.start_consuming()
```

### Redis Streams

```python
import redis

r = redis.Redis()

@app.route('/orders', methods=['POST'])
def create_order():
    order = db.create_order(request.json)
    
    # Add to stream
    r.xadd('orders', {
        'order_id': order.id,
        'user_id': order.user_id,
        'total': order.total
    })
    
    return jsonify(order.to_dict()), 201

# Consumer
while True:
    messages = r.xread({'orders': '$'}, count=10, block=5000)
    for stream, entries in messages:
        for message_id, data in entries:
            process_order(data)
            r.xdel('orders', message_id)
```

---

## Microservices Communication

### Service Discovery (Consul)

```python
# pip install python-consul

import consul

consul_client = consul.Consul(host='localhost', port=8500)

# Register service
consul_client.agent.service.register(
    name='user-service',
    service_id='user-service-1',
    address='localhost',
    port=5000,
    check=consul.Check.http('http://localhost:5000/health', interval='10s')
)

# Discover service
def get_service_url(service_name):
    _, services = consul_client.health.service(service_name, passing=True)
    if services:
        service = random.choice(services)
        return f"http://{service['Service']['Address']}:{service['Service']['Port']}"
    raise Exception(f"Service {service_name} not found")

# Make request to another service
order_service_url = get_service_url('order-service')
response = requests.get(f"{order_service_url}/orders/123")
```

### Circuit Breaker Pattern

```python
# pip install pybreaker

from pybreaker import CircuitBreaker

breaker = CircuitBreaker(fail_max=5, timeout_duration=60)

@breaker
def call_external_service(url):
    response = requests.get(url, timeout=5)
    response.raise_for_status()
    return response.json()

@app.route('/users/<user_id>/orders')
def get_user_orders(user_id):
    try:
        orders = call_external_service(f'http://order-service/users/{user_id}/orders')
        return jsonify(orders)
    except Exception as e:
        # Circuit is open, return cached or default data
        return jsonify({'orders': [], 'error': 'Service temporarily unavailable'}), 503
```

---

## API Deprecation Strategy

### Sunset Header

```python
from datetime import datetime, timedelta

@app.route('/api/v1/users')
def get_users_v1():
    # Deprecated endpoint
    sunset_date = datetime.utcnow() + timedelta(days=90)
    
    response = jsonify(get_users())
    response.headers['Sunset'] = sunset_date.strftime('%a, %d %b %Y %H:%M:%S GMT')
    response.headers['Deprecation'] = 'true'
    response.headers['Link'] = '</api/v2/users>; rel="successor-version"'
    
    return response
```

### Gradual Migration

```python
@app.route('/api/v2/users')
def get_users_v2():
    # New version
    users = get_users()
    return jsonify({
        'data': users,
        'meta': {'version': '2.0'}
    })

# Redirect old version after deprecation period
@app.route('/api/v1/users')
def get_users_v1_redirect():
    return redirect(url_for('get_users_v2'), code=301)  # Permanent redirect
```

---

## Production Best Practices

### Rate Limiting

**Fixed Window**:
```python
from flask import Flask, request, jsonify
from functools import wraps
import time

app = Flask(__name__)

# In-memory store (use Redis in production)
requests_store = {}

def rate_limit(max_requests=10, window=60):
    def decorator(f):
        @wraps(f)
        def wrapper(*args, **kwargs):
            ip = request.remote_addr
            now = int(time.time())
            window_start = now - (now % window)
            
            key = f"{ip}:{window_start}"
            
            if key not in requests_store:
                requests_store[key] = 0
            
            requests_store[key] += 1
            
            if requests_store[key] > max_requests:
                return jsonify({
                    'error': 'Rate limit exceeded',
                    'retry_after': window - (now % window)
                }), 429
            
            return f(*args, **kwargs)
        
        return wrapper
    return decorator

@app.route('/users')
@rate_limit(max_requests=10, window=60)
def get_users():
    return jsonify([{'id': 1, 'name': 'Alice'}])
```

### Pagination

**Offset-based**:
```python
@app.route('/users')
def get_users():
    page = request.args.get('page', 1, type=int)
    limit = request.args.get('limit', 20, type=int)
    
    offset = (page - 1) * limit
    
    users = db.execute("""
        SELECT * FROM users
        ORDER BY created_at DESC
        LIMIT ? OFFSET ?
    """, limit, offset).fetchall()
    
    return jsonify({
        'data': users,
        'pagination': {
            'page': page,
            'limit': limit,
            'total': db.count_users()
        }
    })
```

**Cursor-based** (Better for large datasets):
```python
@app.route('/users')
def get_users():
    cursor = request.args.get('cursor')  # last_seen_id
    limit = request.args.get('limit', 20, type=int)
    
    if cursor:
        users = db.execute("""
            SELECT * FROM users
            WHERE id > ?
            ORDER BY id
            LIMIT ?
        """, cursor, limit).fetchall()
    else:
        users = db.execute("""
            SELECT * FROM users
            ORDER BY id
            LIMIT ?
        """, limit).fetchall()
    
    next_cursor = users[-1]['id'] if users else None
    
    return jsonify({
        'data': users,
        'next_cursor': next_cursor
    })
```

### Error Handling

**Consistent Error Format**:
```python
from flask import jsonify

class APIError(Exception):
    def __init__(self, message, status_code=400, payload=None):
        self.message = message
        self.status_code = status_code
        self.payload = payload

@app.errorhandler(APIError)
def handle_api_error(error):
    response = {
        'error': {
            'message': error.message,
            'code': error.status_code
        }
    }
    if error.payload:
        response['error']['details'] = error.payload
    
    return jsonify(response), error.status_code

# Usage
@app.route('/users/<int:user_id>')
def get_user(user_id):
    user = db.get_user(user_id)
    if not user:
        raise APIError('User not found', status_code=404)
    return jsonify(user)
```

---

This comprehensive API design guide covers REST principles, versioning, authentication, GraphQL, documentation, and production best practices with complete implementations!
