# WebSockets and Real-Time Communication

## What are WebSockets?

WebSockets provide **full-duplex communication** channels over a single TCP connection. Unlike HTTP's request-response model, WebSockets enable:
- **Bi-directional**: Server can push data to clients
- **Real-time**: Low latency communication
- **Persistent**: Long-lived connections
- **Efficient**: Less overhead than HTTP polling

## Why Use WebSockets?

- **Real-time Updates**: Chat, notifications, live feeds
- **Low Latency**: Gaming, trading platforms
- **Reduced Overhead**: Single connection vs. multiple HTTP requests
- **Server Push**: No polling needed

## Basic WebSocket Server

### Using Gorilla WebSocket

```bash
go get github.com/gorilla/websocket
```

### Simple Echo Server

```go
package main

import (
    "log"
    "net/http"
    
    "github.com/gorilla/websocket"
)

var upgrader = websocket.Upgrader{
    ReadBufferSize:  1024,
    WriteBufferSize: 1024,
    CheckOrigin: func(r *http.Request) bool {
        return true // Allow all origins (be more restrictive in production)
    },
}

func handleWebSocket(w http.ResponseWriter, r *http.Request) {
    // Upgrade HTTP connection to WebSocket
    conn, err := upgrader.Upgrade(w, r, nil)
    if err != nil {
        log.Println("Upgrade error:", err)
        return
    }
    defer conn.Close()
    
    log.Println("Client connected")
    
    // Read and echo messages
    for {
        messageType, message, err := conn.ReadMessage()
        if err != nil {
            if websocket.IsUnexpectedCloseError(err, websocket.CloseGoingAway, websocket.CloseAbnormalClosure) {
                log.Printf("Error: %v", err)
            }
            break
        }
        
        log.Printf("Received: %s", message)
        
        // Echo message back
        if err := conn.WriteMessage(messageType, message); err != nil {
            log.Println("Write error:", err)
            break
        }
    }
    
    log.Println("Client disconnected")
}

func main() {
    http.HandleFunc("/ws", handleWebSocket)
    
    log.Println("WebSocket server starting on :8080")
    log.Fatal(http.ListenAndServe(":8080", nil))
}
```

### JavaScript Client

```javascript
const ws = new WebSocket('ws://localhost:8080/ws');

ws.onopen = () => {
    console.log('Connected');
    ws.send('Hello, Server!');
};

ws.onmessage = (event) => {
    console.log('Received:', event.data);
};

ws.onerror = (error) => {
    console.error('Error:', error);
};

ws.onclose = () => {
    console.log('Disconnected');
};
```

## Chat Application

### Hub Pattern (Broadcast to Multiple Clients)

```go
package main

import (
    "log"
    "sync"
    
    "github.com/gorilla/websocket"
)

// Client represents a connected user
type Client struct {
    hub      *Hub
    conn     *websocket.Conn
    send     chan []byte
    username string
}

// Hub manages all connected clients
type Hub struct {
    clients    map[*Client]bool
    broadcast  chan []byte
    register   chan *Client
    unregister chan *Client
    mu         sync.RWMutex
}

func NewHub() *Hub {
    return &Hub{
        clients:    make(map[*Client]bool),
        broadcast:  make(chan []byte),
        register:   make(chan *Client),
        unregister: make(chan *Client),
    }
}

func (h *Hub) Run() {
    for {
        select {
        case client := <-h.register:
            h.mu.Lock()
            h.clients[client] = true
            h.mu.Unlock()
            log.Printf("Client registered: %s (total: %d)", client.username, len(h.clients))
            
        case client := <-h.unregister:
            h.mu.Lock()
            if _, ok := h.clients[client]; ok {
                delete(h.clients, client)
                close(client.send)
                log.Printf("Client unregistered: %s (total: %d)", client.username, len(h.clients))
            }
            h.mu.Unlock()
            
        case message := <-h.broadcast:
            h.mu.RLock()
            for client := range h.clients {
                select {
                case client.send <- message:
                default:
                    // Client can't receive, unregister
                    close(client.send)
                    delete(h.clients, client)
                }
            }
            h.mu.RUnlock()
        }
    }
}

// Read messages from client
func (c *Client) readPump() {
    defer func() {
        c.hub.unregister <- c
        c.conn.Close()
    }()
    
    for {
        _, message, err := c.conn.ReadMessage()
        if err != nil {
            if websocket.IsUnexpectedCloseError(err, websocket.CloseGoingAway, websocket.CloseAbnormalClosure) {
                log.Printf("Error: %v", err)
            }
            break
        }
        
        // Broadcast message to all clients
        c.hub.broadcast <- message
    }
}

// Write messages to client
func (c *Client) writePump() {
    defer c.conn.Close()
    
    for message := range c.send {
        if err := c.conn.WriteMessage(websocket.TextMessage, message); err != nil {
            log.Println("Write error:", err)
            break
        }
    }
}

func main() {
    hub := NewHub()
    go hub.Run()
    
    http.HandleFunc("/ws", func(w http.ResponseWriter, r *http.Request) {
        conn, err := upgrader.Upgrade(w, r, nil)
        if err != nil {
            log.Println(err)
            return
        }
        
        username := r.URL.Query().Get("username")
        if username == "" {
            username = "Anonymous"
        }
        
        client := &Client{
            hub:      hub,
            conn:     conn,
            send:     make(chan []byte, 256),
            username: username,
        }
        
        hub.register <- client
        
        go client.writePump()
        go client.readPump()
    })
    
    log.Fatal(http.ListenAndServe(":8080", nil))
}
```

## Advanced Chat with Message Types

```go
package main

import (
    "encoding/json"
    "time"
)

// Message types
const (
    MessageTypeText      = "text"
    MessageTypeJoin      = "join"
    MessageTypeLeave     = "leave"
    MessageTypeTyping    = "typing"
    MessageTypeUserList  = "user_list"
)

type Message struct {
    Type      string    `json:"type"`
    Username  string    `json:"username"`
    Content   string    `json:"content,omitempty"`
    Timestamp time.Time `json:"timestamp"`
    Users     []string  `json:"users,omitempty"`
}

type Client struct {
    hub      *Hub
    conn     *websocket.Conn
    send     chan []byte
    username string
    id       string
}

type Hub struct {
    clients    map[*Client]bool
    broadcast  chan *Message
    register   chan *Client
    unregister chan *Client
    mu         sync.RWMutex
}

func (h *Hub) broadcastUserList() {
    h.mu.RLock()
    users := make([]string, 0, len(h.clients))
    for client := range h.clients {
        users = append(users, client.username)
    }
    h.mu.RUnlock()
    
    msg := &Message{
        Type:      MessageTypeUserList,
        Users:     users,
        Timestamp: time.Now(),
    }
    
    h.broadcast <- msg
}

func (h *Hub) Run() {
    for {
        select {
        case client := <-h.register:
            h.mu.Lock()
            h.clients[client] = true
            h.mu.Unlock()
            
            // Notify others that user joined
            joinMsg := &Message{
                Type:      MessageTypeJoin,
                Username:  client.username,
                Content:   client.username + " joined the chat",
                Timestamp: time.Now(),
            }
            h.broadcast <- joinMsg
            h.broadcastUserList()
            
        case client := <-h.unregister:
            h.mu.Lock()
            if _, ok := h.clients[client]; ok {
                delete(h.clients, client)
                close(client.send)
                
                // Notify others that user left
                leaveMsg := &Message{
                    Type:      MessageTypeLeave,
                    Username:  client.username,
                    Content:   client.username + " left the chat",
                    Timestamp: time.Now(),
                }
                h.broadcast <- leaveMsg
            }
            h.mu.Unlock()
            h.broadcastUserList()
            
        case message := <-h.broadcast:
            data, _ := json.Marshal(message)
            
            h.mu.RLock()
            for client := range h.clients {
                select {
                case client.send <- data:
                default:
                    close(client.send)
                    delete(h.clients, client)
                }
            }
            h.mu.RUnlock()
        }
    }
}

func (c *Client) readPump() {
    defer func() {
        c.hub.unregister <- c
        c.conn.Close()
    }()
    
    c.conn.SetReadDeadline(time.Now().Add(60 * time.Second))
    c.conn.SetPongHandler(func(string) error {
        c.conn.SetReadDeadline(time.Now().Add(60 * time.Second))
        return nil
    })
    
    for {
        _, data, err := c.conn.ReadMessage()
        if err != nil {
            break
        }
        
        var msg Message
        if err := json.Unmarshal(data, &msg); err != nil {
            continue
        }
        
        msg.Username = c.username
        msg.Timestamp = time.Now()
        
        c.hub.broadcast <- &msg
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
```

## Room-Based Chat

```go
type Room struct {
    name       string
    clients    map[*Client]bool
    broadcast  chan *Message
    register   chan *Client
    unregister chan *Client
    mu         sync.RWMutex
}

type ChatServer struct {
    rooms map[string]*Room
    mu    sync.RWMutex
}

func NewChatServer() *ChatServer {
    return &ChatServer{
        rooms: make(map[string]*Room),
    }
}

func (cs *ChatServer) GetOrCreateRoom(name string) *Room {
    cs.mu.Lock()
    defer cs.mu.Unlock()
    
    room, exists := cs.rooms[name]
    if !exists {
        room = &Room{
            name:       name,
            clients:    make(map[*Client]bool),
            broadcast:  make(chan *Message),
            register:   make(chan *Client),
            unregister: make(chan *Client),
        }
        cs.rooms[name] = room
        go room.Run()
    }
    
    return room
}

func (r *Room) Run() {
    for {
        select {
        case client := <-r.register:
            r.mu.Lock()
            r.clients[client] = true
            r.mu.Unlock()
            
            msg := &Message{
                Type:      MessageTypeJoin,
                Username:  client.username,
                Content:   client.username + " joined " + r.name,
                Timestamp: time.Now(),
            }
            r.broadcast <- msg
            
        case client := <-r.unregister:
            r.mu.Lock()
            if _, ok := r.clients[client]; ok {
                delete(r.clients, client)
                close(client.send)
                
                msg := &Message{
                    Type:      MessageTypeLeave,
                    Username:  client.username,
                    Content:   client.username + " left " + r.name,
                    Timestamp: time.Now(),
                }
                r.broadcast <- msg
            }
            r.mu.Unlock()
            
        case message := <-r.broadcast:
            data, _ := json.Marshal(message)
            
            r.mu.RLock()
            for client := range r.clients {
                select {
                case client.send <- data:
                default:
                    close(client.send)
                    delete(r.clients, client)
                }
            }
            r.mu.RUnlock()
        }
    }
}

// HTTP handler
func (cs *ChatServer) handleWebSocket(w http.ResponseWriter, r *http.Request) {
    conn, err := upgrader.Upgrade(w, r, nil)
    if err != nil {
        return
    }
    
    username := r.URL.Query().Get("username")
    roomName := r.URL.Query().Get("room")
    
    if roomName == "" {
        roomName = "general"
    }
    
    room := cs.GetOrCreateRoom(roomName)
    
    client := &Client{
        conn:     conn,
        send:     make(chan []byte, 256),
        username: username,
        id:       uuid.New().String(),
    }
    
    room.register <- client
    
    go client.writePump()
    client.readPump()
}
```

## WebSocket with Gin

```go
package main

import (
    "github.com/gin-gonic/gin"
    "github.com/gorilla/websocket"
)

var upgrader = websocket.Upgrader{
    CheckOrigin: func(r *http.Request) bool {
        return true
    },
}

func main() {
    r := gin.Default()
    
    hub := NewHub()
    go hub.Run()
    
    r.GET("/ws", func(c *gin.Context) {
        conn, err := upgrader.Upgrade(c.Writer, c.Request, nil)
        if err != nil {
            c.JSON(500, gin.H{"error": err.Error()})
            return
        }
        
        username := c.Query("username")
        
        client := &Client{
            hub:      hub,
            conn:     conn,
            send:     make(chan []byte, 256),
            username: username,
        }
        
        hub.register <- client
        
        go client.writePump()
        go client.readPump()
    })
    
    // Serve static files
    r.Static("/static", "./static")
    r.LoadHTMLGlob("templates/*")
    
    r.GET("/", func(c *gin.Context) {
        c.HTML(200, "chat.html", nil)
    })
    
    r.Run(":8080")
}
```

## Real-Time Notifications

```go
package main

import (
    "encoding/json"
    "sync"
    "time"
)

type Notification struct {
    ID        string                 `json:"id"`
    UserID    string                 `json:"user_id"`
    Type      string                 `json:"type"`
    Title     string                 `json:"title"`
    Message   string                 `json:"message"`
    Data      map[string]interface{} `json:"data,omitempty"`
    Timestamp time.Time              `json:"timestamp"`
    Read      bool                   `json:"read"`
}

type NotificationHub struct {
    // Map of user ID to their connections
    connections map[string]map[*websocket.Conn]bool
    mu          sync.RWMutex
}

func NewNotificationHub() *NotificationHub {
    return &NotificationHub{
        connections: make(map[string]map[*websocket.Conn]bool),
    }
}

func (nh *NotificationHub) Register(userID string, conn *websocket.Conn) {
    nh.mu.Lock()
    defer nh.mu.Unlock()
    
    if nh.connections[userID] == nil {
        nh.connections[userID] = make(map[*websocket.Conn]bool)
    }
    nh.connections[userID][conn] = true
}

func (nh *NotificationHub) Unregister(userID string, conn *websocket.Conn) {
    nh.mu.Lock()
    defer nh.mu.Unlock()
    
    if conns, ok := nh.connections[userID]; ok {
        delete(conns, conn)
        if len(conns) == 0 {
            delete(nh.connections, userID)
        }
    }
}

func (nh *NotificationHub) SendToUser(userID string, notification *Notification) error {
    nh.mu.RLock()
    defer nh.mu.RUnlock()
    
    conns, ok := nh.connections[userID]
    if !ok {
        return nil // User not connected
    }
    
    data, err := json.Marshal(notification)
    if err != nil {
        return err
    }
    
    for conn := range conns {
        if err := conn.WriteMessage(websocket.TextMessage, data); err != nil {
            // Connection broken, will be cleaned up
            continue
        }
    }
    
    return nil
}

func (nh *NotificationHub) Broadcast(notification *Notification) {
    nh.mu.RLock()
    defer nh.mu.RUnlock()
    
    data, _ := json.Marshal(notification)
    
    for _, conns := range nh.connections {
        for conn := range conns {
            conn.WriteMessage(websocket.TextMessage, data)
        }
    }
}

// HTTP handler
func (nh *NotificationHub) HandleWebSocket(w http.ResponseWriter, r *http.Request) {
    userID := r.URL.Query().Get("user_id")
    if userID == "" {
        http.Error(w, "user_id required", 400)
        return
    }
    
    conn, err := upgrader.Upgrade(w, r, nil)
    if err != nil {
        return
    }
    defer conn.Close()
    
    nh.Register(userID, conn)
    defer nh.Unregister(userID, conn)
    
    // Keep connection alive
    for {
        if _, _, err := conn.ReadMessage(); err != nil {
            break
        }
    }
}

// Example: Send notification
func sendOrderNotification(nh *NotificationHub, userID string, orderID string) {
    notification := &Notification{
        ID:     uuid.New().String(),
        UserID: userID,
        Type:   "order_update",
        Title:  "Order Confirmed",
        Message: "Your order has been confirmed",
        Data: map[string]interface{}{
            "order_id": orderID,
            "status":   "confirmed",
        },
        Timestamp: time.Now(),
        Read:      false,
    }
    
    nh.SendToUser(userID, notification)
}
```

## Live Dashboard

```go
package main

import (
    "encoding/json"
    "math/rand"
    "time"
)

type DashboardData struct {
    Timestamp   time.Time              `json:"timestamp"`
    Metrics     map[string]interface{} `json:"metrics"`
}

type DashboardHub struct {
    clients   map[*websocket.Conn]bool
    broadcast chan *DashboardData
    mu        sync.RWMutex
}

func NewDashboardHub() *DashboardHub {
    hub := &DashboardHub{
        clients:   make(map[*websocket.Conn]bool),
        broadcast: make(chan *DashboardData),
    }
    
    go hub.Run()
    go hub.generateMetrics()
    
    return hub
}

func (dh *DashboardHub) Run() {
    for data := range dh.broadcast {
        jsonData, _ := json.Marshal(data)
        
        dh.mu.RLock()
        for client := range dh.clients {
            if err := client.WriteMessage(websocket.TextMessage, jsonData); err != nil {
                client.Close()
                delete(dh.clients, client)
            }
        }
        dh.mu.RUnlock()
    }
}

func (dh *DashboardHub) generateMetrics() {
    ticker := time.NewTicker(1 * time.Second)
    defer ticker.Stop()
    
    for range ticker.C {
        data := &DashboardData{
            Timestamp: time.Now(),
            Metrics: map[string]interface{}{
                "cpu_usage":    rand.Float64() * 100,
                "memory_usage": rand.Float64() * 100,
                "requests":     rand.Intn(1000),
                "active_users": rand.Intn(500),
                "response_time": rand.Float64() * 200,
            },
        }
        
        dh.broadcast <- data
    }
}

func (dh *DashboardHub) HandleWebSocket(w http.ResponseWriter, r *http.Request) {
    conn, err := upgrader.Upgrade(w, r, nil)
    if err != nil {
        return
    }
    
    dh.mu.Lock()
    dh.clients[conn] = true
    dh.mu.Unlock()
    
    defer func() {
        dh.mu.Lock()
        delete(dh.clients, conn)
        dh.mu.Unlock()
        conn.Close()
    }()
    
    // Keep connection alive
    for {
        if _, _, err := conn.ReadMessage(); err != nil {
            break
        }
    }
}
```

## Best Practices

### 1. Connection Management

```go
// Set timeouts
c.conn.SetReadDeadline(time.Now().Add(60 * time.Second))
c.conn.SetWriteDeadline(time.Now().Add(10 * time.Second))

// Ping/Pong for keep-alive
ticker := time.NewTicker(54 * time.Second)
defer ticker.Stop()

for range ticker.C {
    if err := conn.WriteMessage(websocket.PingMessage, nil); err != nil {
        return
    }
}
```

### 2. Graceful Shutdown

```go
func (c *Client) Close() error {
    // Send close message
    c.conn.WriteMessage(
        websocket.CloseMessage,
        websocket.FormatCloseMessage(websocket.CloseNormalClosure, ""),
    )
    
    time.Sleep(time.Second) // Allow time for close frame
    return c.conn.Close()
}
```

### 3. Error Handling

```go
if websocket.IsUnexpectedCloseError(err, websocket.CloseGoingAway, websocket.CloseAbnormalClosure) {
    log.Printf("Error: %v", err)
}
```

### 4. Authentication

```go
func (h *Hub) HandleWebSocket(w http.ResponseWriter, r *http.Request) {
    // Validate JWT token
    token := r.URL.Query().Get("token")
    claims, err := ValidateJWT(token)
    if err != nil {
        http.Error(w, "Unauthorized", 401)
        return
    }
    
    conn, _ := upgrader.Upgrade(w, r, nil)
    
    client := &Client{
        userID:   claims.UserID,
        username: claims.Username,
        conn:     conn,
    }
    
    // Register client...
}
```

### 5. Rate Limiting

```go
type Client struct {
    limiter *rate.Limiter
    // ...
}

func (c *Client) readPump() {
    for {
        _, message, err := c.conn.ReadMessage()
        if err != nil {
            break
        }
        
        // Rate limit
        if !c.limiter.Allow() {
            c.conn.WriteMessage(websocket.TextMessage, []byte("Rate limit exceeded"))
            continue
        }
        
        // Process message
    }
}
```

## Summary

WebSockets enable:
- **Real-time Chat**: Multi-user communication
- **Live Notifications**: Push updates to users
- **Dashboards**: Live metrics and monitoring
- **Collaborative Editing**: Real-time collaboration
- **Gaming**: Low-latency game state updates

Essential for modern real-time applications.
