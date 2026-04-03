# WebSockets

## What is WebSockets?

Imagine a phone call vs sending letters back and forth. With letters (traditional HTTP), you write something, mail it, wait for a response, then repeat. With a phone call (WebSockets), you establish a connection once and can talk back and forth instantly without hanging up and redialing.

WebSockets is a **communication protocol** that provides **full-duplex** (two-way), **persistent** connections between client and server over a single TCP connection.

## How It Came to Be

**Timeline:**
- **Before 2008**: Polling/Long-polling hacks for real-time web
- **2008**: First WebSocket specification proposed
- **2011**: RFC 6455 standardized WebSocket protocol
- **2012**: Major browsers added support
- **Today**: Standard for real-time web applications

**The Problem It Solved:**

Before WebSockets, real-time updates required hacky workarounds:

```
❌ Polling (wasteful):
Client: "Any updates?" → Server: "No"
(wait 5 seconds)
Client: "Any updates?" → Server: "No"
(wait 5 seconds)
Client: "Any updates?" → Server: "Yes! Here's data"

❌ Long-polling (better but still hacky):
Client: "Tell me when there's an update"
Server: (keeps connection open... waits... waits...)
Server: "Here's an update!"
Client: "Tell me when there's another update"
(repeat forever)

✅ WebSockets (efficient):
Client: "Open connection"
Server: "Connected!"
↕️ Data flows both ways anytime, instantly
```

## How WebSockets Work

### The Handshake (Upgrade from HTTP to WebSocket)

```
1. Client → Server: HTTP Request
   GET /chat HTTP/1.1
   Host: example.com
   Upgrade: websocket
   Connection: Upgrade
   Sec-WebSocket-Key: dGhlIHNhbXBsZSBub25jZQ==
   Sec-WebSocket-Version: 13

2. Server → Client: HTTP Response
   HTTP/1.1 101 Switching Protocols
   Upgrade: websocket
   Connection: Upgrade
   Sec-WebSocket-Accept: s3pPLMBiTxaQ9kYGzzhZRbK+xOo=

3. ✅ Connection upgraded! Now using WebSocket protocol
   Both can send messages anytime
```

### Message Flow

```
Client                    Server
  |                          |
  |-------- "Hello!" ------->|
  |                          |
  |<--- "Hello back!" -------|
  |                          |
  |--- "How are you?" ------>|
  |                          |
  |<------ "Great!" ---------|
  |                          |
  (connection stays open)
```

## Pros and Cons

### ✅ Pros

1. **Real-time Communication**: Instant data updates
2. **Bi-directional**: Both client and server can send messages anytime
3. **Low Latency**: No HTTP overhead after initial handshake
4. **Efficient**: Single persistent connection vs many HTTP requests
5. **Less Bandwidth**: No HTTP headers on every message
6. **Server Push**: Server can send data without client request
7. **Stateful**: Connection maintains state
8. **Browser Support**: All modern browsers support it
9. **Binary & Text**: Can send both types of data

### ❌ Cons

1. **Complexity**: More complex than simple HTTP requests
2. **Scaling Challenges**: Keeping many connections open requires resources
3. **Load Balancing**: Sticky sessions needed
4. **Firewalls/Proxies**: Some corporate networks block WebSockets
5. **No HTTP Caching**: Can't leverage HTTP caching
6. **Connection Management**: Need to handle disconnects, reconnects
7. **Security**: Need to implement authentication yourself
8. **Debugging**: Harder to debug than REST calls
9. **Resource Intensive**: Server must maintain many open connections

## When to Use WebSockets

### ✅ Great For:

- **Chat Applications**: Instant messaging, team collaboration
- **Live Feeds**: Social media feeds, notifications
- **Real-time Dashboards**: Stock tickers, analytics, monitoring
- **Multiplayer Games**: Online gaming, real-time gameplay
- **Collaborative Editing**: Google Docs-style editing
- **Live Sports Scores**: Real-time score updates
- **Trading Platforms**: Stock/crypto trading
- **IoT Dashboards**: Sensor data streaming
- **Video Streaming Control**: Player controls, chat alongside video
- **Live Auctions**: Bidding updates

### ❌ Not Ideal For:

- **Simple Request-Response**: Use REST instead
- **Infrequent Updates**: SSE might be simpler
- **Large File Transfers**: Use HTTP with chunked transfer
- **SEO-Critical Content**: Search engines can't index WebSocket data
- **One-time Data Fetch**: REST is simpler
- **Public APIs**: REST is more standard

## Implementation Examples

### Python Implementation (Using FastAPI + WebSockets)

```python
from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from typing import List, Dict
import json
import asyncio
from datetime import datetime

app = FastAPI()

# ============================================
# CONNECTION MANAGER
# ============================================

class ConnectionManager:
    """
    Manages active WebSocket connections
    """
    def __init__(self):
        # Store active connections
        self.active_connections: List[WebSocket] = []
        # Store connections by room/channel
        self.rooms: Dict[str, List[WebSocket]] = {}
    
    async def connect(self, websocket: WebSocket, room: str = "global"):
        """Accept and register a new connection"""
        await websocket.accept()
        self.active_connections.append(websocket)
        
        # Add to room
        if room not in self.rooms:
            self.rooms[room] = []
        self.rooms[room].append(websocket)
        
        print(f"Client connected. Total: {len(self.active_connections)}")
    
    def disconnect(self, websocket: WebSocket, room: str = "global"):
        """Remove a disconnected client"""
        self.active_connections.remove(websocket)
        
        # Remove from room
        if room in self.rooms and websocket in self.rooms[room]:
            self.rooms[room].remove(websocket)
        
        print(f"Client disconnected. Total: {len(self.active_connections)}")
    
    async def send_personal_message(self, message: str, websocket: WebSocket):
        """Send message to a specific client"""
        await websocket.send_text(message)
    
    async def broadcast(self, message: str):
        """Send message to all connected clients"""
        for connection in self.active_connections:
            await connection.send_text(message)
    
    async def broadcast_to_room(self, message: str, room: str):
        """Send message to all clients in a room"""
        if room in self.rooms:
            for connection in self.rooms[room]:
                await connection.send_text(message)


manager = ConnectionManager()


# ============================================
# SIMPLE WEBSOCKET ENDPOINT
# ============================================

@app.websocket("/ws")
async def websocket_endpoint(websocket: WebSocket):
    """
    Simple echo WebSocket endpoint
    Sends back whatever it receives
    """
    await manager.connect(websocket)
    
    try:
        while True:
            # Receive message from client
            data = await websocket.receive_text()
            
            # Echo back
            await manager.send_personal_message(f"Echo: {data}", websocket)
            
    except WebSocketDisconnect:
        manager.disconnect(websocket)
        print("Client disconnected")


# ============================================
# CHAT ROOM WEBSOCKET
# ============================================

@app.websocket("/ws/chat/{room_name}")
async def chat_room(websocket: WebSocket, room_name: str):
    """
    Chat room WebSocket endpoint
    Clients can join different rooms
    """
    await manager.connect(websocket, room=room_name)
    
    # Notify room about new user
    await manager.broadcast_to_room(
        json.dumps({
            "type": "system",
            "message": f"User joined {room_name}",
            "timestamp": datetime.now().isoformat()
        }),
        room=room_name
    )
    
    try:
        while True:
            # Receive message
            data = await websocket.receive_text()
            
            # Parse message
            try:
                message_data = json.loads(data)
            except json.JSONDecodeError:
                # Plain text message
                message_data = {"text": data}
            
            # Broadcast to room
            await manager.broadcast_to_room(
                json.dumps({
                    "type": "message",
                    "text": message_data.get("text", ""),
                    "room": room_name,
                    "timestamp": datetime.now().isoformat()
                }),
                room=room_name
            )
            
    except WebSocketDisconnect:
        manager.disconnect(websocket, room=room_name)
        
        # Notify room about user leaving
        await manager.broadcast_to_room(
            json.dumps({
                "type": "system",
                "message": f"User left {room_name}",
                "timestamp": datetime.now().isoformat()
            }),
            room=room_name
        )


# ============================================
# REAL-TIME DASHBOARD (Server Push)
# ============================================

@app.websocket("/ws/dashboard")
async def dashboard_stream(websocket: WebSocket):
    """
    Stream real-time metrics to dashboard
    Server pushes updates without client request
    """
    await manager.connect(websocket)
    
    try:
        # Send initial data
        await websocket.send_json({
            "type": "init",
            "message": "Connected to dashboard stream"
        })
        
        # Continuously send updates
        while True:
            # Simulate real-time metrics
            import random
            metrics = {
                "type": "metrics",
                "cpu": random.randint(10, 90),
                "memory": random.randint(30, 80),
                "requests_per_sec": random.randint(100, 1000),
                "active_users": len(manager.active_connections),
                "timestamp": datetime.now().isoformat()
            }
            
            await websocket.send_json(metrics)
            
            # Wait before sending next update
            await asyncio.sleep(2)  # Update every 2 seconds
            
    except WebSocketDisconnect:
        manager.disconnect(websocket)


# ============================================
# NOTIFICATION SYSTEM
# ============================================

class NotificationService:
    """
    Service to send notifications to specific users
    """
    def __init__(self, manager: ConnectionManager):
        self.manager = manager
        self.user_connections: Dict[str, WebSocket] = {}
    
    def register_user(self, user_id: str, websocket: WebSocket):
        """Register user's WebSocket connection"""
        self.user_connections[user_id] = websocket
    
    async def send_notification(self, user_id: str, notification: dict):
        """Send notification to specific user"""
        if user_id in self.user_connections:
            websocket = self.user_connections[user_id]
            await websocket.send_json({
                "type": "notification",
                **notification,
                "timestamp": datetime.now().isoformat()
            })


notification_service = NotificationService(manager)


@app.websocket("/ws/notifications/{user_id}")
async def notification_stream(websocket: WebSocket, user_id: str):
    """
    Personal notification stream for a user
    """
    await manager.connect(websocket)
    notification_service.register_user(user_id, websocket)
    
    try:
        # Keep connection alive and listen for pings
        while True:
            data = await websocket.receive_text()
            
            # Handle ping
            if data == "ping":
                await websocket.send_text("pong")
                
    except WebSocketDisconnect:
        manager.disconnect(websocket)
        if user_id in notification_service.user_connections:
            del notification_service.user_connections[user_id]


# ============================================
# REST ENDPOINT TO TRIGGER NOTIFICATIONS
# ============================================

@app.post("/api/notify/{user_id}")
async def send_notification(user_id: str, notification: dict):
    """
    REST endpoint to send notification to a user
    """
    await notification_service.send_notification(user_id, notification)
    return {"status": "sent"}


# ============================================
# WEBSOCKET CLIENT EXAMPLE (Python)
# ============================================

async def websocket_client_example():
    """
    Example WebSocket client using websockets library
    """
    import websockets
    
    # Connect to WebSocket server
    async with websockets.connect("ws://localhost:8000/ws") as websocket:
        
        # Send message
        await websocket.send("Hello Server!")
        
        # Receive response
        response = await websocket.recv()
        print(f"Received: {response}")
        
        # Send another message
        await websocket.send("How are you?")
        
        # Receive response
        response = await websocket.recv()
        print(f"Received: {response}")


async def chat_client_example():
    """
    Example chat client
    """
    import websockets
    
    room = "general"
    
    async with websockets.connect(f"ws://localhost:8000/ws/chat/{room}") as websocket:
        
        # Send message to room
        await websocket.send(json.dumps({
            "text": "Hello everyone!"
        }))
        
        # Listen for messages
        async for message in websocket:
            data = json.loads(message)
            print(f"[{data['type']}] {data.get('text', data.get('message'))}")


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
```

### Go Implementation (Using Gorilla WebSocket)

```go
package main

import (
	"encoding/json"
	"fmt"
	"log"
	"net/http"
	"sync"
	"time"

	"github.com/gorilla/websocket"
)

// ============================================
// WEBSOCKET UPGRADER
// ============================================

var upgrader = websocket.Upgrader{
	ReadBufferSize:  1024,
	WriteBufferSize: 1024,
	CheckOrigin: func(r *http.Request) bool {
		// Allow all origins (in production, be more restrictive)
		return true
	},
}

// ============================================
// CLIENT STRUCTURE
// ============================================

// Client represents a WebSocket client
type Client struct {
	ID   string
	Conn *websocket.Conn
	Send chan []byte
	Room string
}

// ============================================
// HUB (Connection Manager)
// ============================================

// Hub maintains active clients and broadcasts messages
type Hub struct {
	// Registered clients
	clients map[*Client]bool
	
	// Clients organized by room
	rooms map[string]map[*Client]bool
	
	// Register requests from clients
	register chan *Client
	
	// Unregister requests from clients
	unregister chan *Client
	
	// Broadcast messages to all clients
	broadcast chan []byte
	
	// Broadcast to specific room
	roomBroadcast chan RoomMessage
	
	// Mutex for thread safety
	mu sync.RWMutex
}

type RoomMessage struct {
	Room    string
	Message []byte
}

// NewHub creates a new Hub
func NewHub() *Hub {
	return &Hub{
		clients:       make(map[*Client]bool),
		rooms:         make(map[string]map[*Client]bool),
		register:      make(chan *Client),
		unregister:    make(chan *Client),
		broadcast:     make(chan []byte),
		roomBroadcast: make(chan RoomMessage),
	}
}

// Run starts the hub
func (h *Hub) Run() {
	for {
		select {
		case client := <-h.register:
			h.mu.Lock()
			h.clients[client] = true
			
			// Add to room
			if h.rooms[client.Room] == nil {
				h.rooms[client.Room] = make(map[*Client]bool)
			}
			h.rooms[client.Room][client] = true
			
			h.mu.Unlock()
			
			log.Printf("Client registered. Total clients: %d", len(h.clients))
			
		case client := <-h.unregister:
			h.mu.Lock()
			if _, ok := h.clients[client]; ok {
				delete(h.clients, client)
				
				// Remove from room
				if h.rooms[client.Room] != nil {
					delete(h.rooms[client.Room], client)
				}
				
				close(client.Send)
			}
			h.mu.Unlock()
			
			log.Printf("Client unregistered. Total clients: %d", len(h.clients))
			
		case message := <-h.broadcast:
			h.mu.RLock()
			for client := range h.clients {
				select {
				case client.Send <- message:
				default:
					close(client.Send)
					delete(h.clients, client)
				}
			}
			h.mu.RUnlock()
			
		case roomMsg := <-h.roomBroadcast:
			h.mu.RLock()
			if clients, ok := h.rooms[roomMsg.Room]; ok {
				for client := range clients {
					select {
					case client.Send <- roomMsg.Message:
					default:
						close(client.Send)
						delete(h.clients, client)
					}
				}
			}
			h.mu.RUnlock()
		}
	}
}

// ============================================
// CLIENT READ/WRITE PUMPS
// ============================================

// readPump reads messages from WebSocket connection
func (c *Client) readPump(hub *Hub) {
	defer func() {
		hub.unregister <- c
		c.Conn.Close()
	}()
	
	// Set read deadline
	c.Conn.SetReadDeadline(time.Now().Add(60 * time.Second))
	
	// Set pong handler
	c.Conn.SetPongHandler(func(string) error {
		c.Conn.SetReadDeadline(time.Now().Add(60 * time.Second))
		return nil
	})
	
	for {
		_, message, err := c.Conn.ReadMessage()
		if err != nil {
			if websocket.IsUnexpectedCloseError(err, websocket.CloseGoingAway, websocket.CloseAbnormalClosure) {
				log.Printf("error: %v", err)
			}
			break
		}
		
		// Broadcast message to room
		hub.roomBroadcast <- RoomMessage{
			Room:    c.Room,
			Message: message,
		}
	}
}

// writePump writes messages to WebSocket connection
func (c *Client) writePump() {
	ticker := time.NewTicker(54 * time.Second)
	defer func() {
		ticker.Stop()
		c.Conn.Close()
	}()
	
	for {
		select {
		case message, ok := <-c.Send:
			c.Conn.SetWriteDeadline(time.Now().Add(10 * time.Second))
			
			if !ok {
				// Hub closed the channel
				c.Conn.WriteMessage(websocket.CloseMessage, []byte{})
				return
			}
			
			// Write message
			err := c.Conn.WriteMessage(websocket.TextMessage, message)
			if err != nil {
				return
			}
			
		case <-ticker.C:
			// Send ping
			c.Conn.SetWriteDeadline(time.Now().Add(10 * time.Second))
			if err := c.Conn.WriteMessage(websocket.PingMessage, nil); err != nil {
				return
			}
		}
	}
}

// ============================================
// HTTP HANDLERS
// ============================================

var hub = NewHub()

// Simple echo endpoint
func handleEcho(w http.ResponseWriter, r *http.Request) {
	// Upgrade HTTP connection to WebSocket
	conn, err := upgrader.Upgrade(w, r, nil)
	if err != nil {
		log.Println(err)
		return
	}
	
	client := &Client{
		ID:   generateID(),
		Conn: conn,
		Send: make(chan []byte, 256),
		Room: "echo",
	}
	
	hub.register <- client
	
	// Start read and write pumps
	go client.writePump()
	go client.readPump(hub)
}

// Chat room endpoint
func handleChatRoom(w http.ResponseWriter, r *http.Request) {
	room := r.URL.Query().Get("room")
	if room == "" {
		room = "general"
	}
	
	conn, err := upgrader.Upgrade(w, r, nil)
	if err != nil {
		log.Println(err)
		return
	}
	
	client := &Client{
		ID:   generateID(),
		Conn: conn,
		Send: make(chan []byte, 256),
		Room: room,
	}
	
	hub.register <- client
	
	// Send join message
	joinMsg, _ := json.Marshal(map[string]string{
		"type":    "system",
		"message": fmt.Sprintf("User joined %s", room),
	})
	hub.roomBroadcast <- RoomMessage{
		Room:    room,
		Message: joinMsg,
	}
	
	go client.writePump()
	go client.readPump(hub)
}

// Dashboard streaming endpoint
func handleDashboard(w http.ResponseWriter, r *http.Request) {
	conn, err := upgrader.Upgrade(w, r, nil)
	if err != nil {
		log.Println(err)
		return
	}
	
	client := &Client{
		ID:   generateID(),
		Conn: conn,
		Send: make(chan []byte, 256),
		Room: "dashboard",
	}
	
	hub.register <- client
	
	// Start background metrics sender
	go func() {
		ticker := time.NewTicker(2 * time.Second)
		defer ticker.Stop()
		
		for range ticker.C {
			metrics := map[string]interface{}{
				"type":             "metrics",
				"cpu":              randomInt(10, 90),
				"memory":           randomInt(30, 80),
				"requests_per_sec": randomInt(100, 1000),
				"timestamp":        time.Now().Format(time.RFC3339),
			}
			
			data, _ := json.Marshal(metrics)
			
			select {
			case client.Send <- data:
			default:
				return
			}
		}
	}()
	
	go client.writePump()
	go client.readPump(hub)
}

// ============================================
// HELPERS
// ============================================

func generateID() string {
	return fmt.Sprintf("%d", time.Now().UnixNano())
}

func randomInt(min, max int) int {
	return min + int(time.Now().UnixNano()%int64(max-min))
}

// ============================================
// MAIN
// ============================================

func main() {
	// Start hub
	go hub.Run()
	
	// Register handlers
	http.HandleFunc("/ws/echo", handleEcho)
	http.HandleFunc("/ws/chat", handleChatRoom)
	http.HandleFunc("/ws/dashboard", handleDashboard)
	
	// Serve static files
	http.HandleFunc("/", func(w http.ResponseWriter, r *http.Request) {
		http.ServeFile(w, r, "index.html")
	})
	
	log.Println("WebSocket server running on :8080")
	log.Fatal(http.ListenAndServe(":8080", nil))
}
```

### HTML/JavaScript Client

```html
<!DOCTYPE html>
<html>
<head>
    <title>WebSocket Client</title>
</head>
<body>
    <h1>WebSocket Chat</h1>
    
    <div id="messages" style="border: 1px solid #ccc; height: 300px; overflow-y: scroll; padding: 10px;"></div>
    
    <input type="text" id="messageInput" placeholder="Type a message..." style="width: 80%;">
    <button onclick="sendMessage()">Send</button>
    
    <script>
        // Create WebSocket connection
        const ws = new WebSocket('ws://localhost:8000/ws/chat/general');
        
        // Connection opened
        ws.addEventListener('open', function (event) {
            addMessage('Connected to server!', 'system');
        });
        
        // Listen for messages
        ws.addEventListener('message', function (event) {
            const data = JSON.parse(event.data);
            addMessage(data.text || data.message, data.type);
        });
        
        // Connection closed
        ws.addEventListener('close', function (event) {
            addMessage('Disconnected from server', 'system');
        });
        
        // Connection error
        ws.addEventListener('error', function (event) {
            addMessage('WebSocket error!', 'error');
        });
        
        // Send message
        function sendMessage() {
            const input = document.getElementById('messageInput');
            const message = input.value.trim();
            
            if (message && ws.readyState === WebSocket.OPEN) {
                ws.send(JSON.stringify({ text: message }));
                input.value = '';
            }
        }
        
        // Add message to display
        function addMessage(text, type) {
            const messagesDiv = document.getElementById('messages');
            const messageEl = document.createElement('div');
            messageEl.textContent = `[${type}] ${text}`;
            messagesDiv.appendChild(messageEl);
            messagesDiv.scrollTop = messagesDiv.scrollHeight;
        }
        
        // Send on Enter key
        document.getElementById('messageInput').addEventListener('keypress', function(e) {
            if (e.key === 'Enter') {
                sendMessage();
            }
        });
    </script>
</body>
</html>
```

## Best Practices

### 1. Implement Heartbeat/Ping-Pong

```python
async def heartbeat(websocket: WebSocket):
    while True:
        try:
            await websocket.send_text("ping")
            await asyncio.sleep(30)
        except:
            break
```

### 2. Handle Reconnection

```javascript
class ReconnectingWebSocket {
    constructor(url) {
        this.url = url;
        this.reconnectDelay = 1000;
        this.connect();
    }
    
    connect() {
        this.ws = new WebSocket(this.url);
        
        this.ws.onclose = () => {
            setTimeout(() => this.connect(), this.reconnectDelay);
            this.reconnectDelay = Math.min(this.reconnectDelay * 2, 30000);
        };
        
        this.ws.onopen = () => {
            this.reconnectDelay = 1000; // Reset delay on successful connect
        };
    }
}
```

### 3. Authenticate Connections

```python
@app.websocket("/ws/secure")
async def secure_websocket(websocket: WebSocket, token: str):
    # Verify token
    user = verify_token(token)
    if not user:
        await websocket.close(code=1008, reason="Unauthorized")
        return
    
    await manager.connect(websocket)
    # ... rest of logic
```

### 4. Rate Limiting

```python
from collections import defaultdict
from time import time

rate_limits = defaultdict(list)

async def check_rate_limit(client_id: str, max_messages: int = 10, window: int = 60):
    now = time()
    # Clean old messages
    rate_limits[client_id] = [t for t in rate_limits[client_id] if now - t < window]
    
    if len(rate_limits[client_id]) >= max_messages:
        return False
    
    rate_limits[client_id].append(now)
    return True
```

## Key Takeaway

WebSockets are like keeping a phone line open instead of hanging up and redialing for every conversation. Perfect for real-time, two-way communication like chat, live updates, and multiplayer games. More complex than REST, but essential when you need instant, bidirectional data flow.
