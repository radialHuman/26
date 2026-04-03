# SSE (Server-Sent Events)

## What is SSE?

Imagine a news ticker on TV or a stock price display. Information flows from the broadcaster (server) to you (client) continuously, but you don't send anything back - you just watch. SSE is exactly that: a one-way street where the server pushes updates to the client whenever something changes.

SSE is a **standard** that allows servers to push data to web clients over HTTP, creating a persistent connection where the server can send multiple messages over time.

## How It Came to Be

**Timeline:**
- **2004**: First attempts at "Comet" pattern (server push hacks)
- **2006**: XMLHttpRequest long-polling becomes popular
- **2009**: HTML5 introduces EventSource API (SSE)
- **2011**: Becomes W3C Candidate Recommendation
- **Today**: Widely supported in all modern browsers

**The Problem It Solved:**

Before SSE, getting live updates required ugly hacks:

```
❌ Polling (wasteful):
Every 5 seconds → Client: "Anything new?"
Server keeps responding to thousands of requests

❌ Long-polling (better but complex):
Client: "Tell me when there's news"
Server holds connection until news arrives
Reconnect after each message

✅ SSE (clean):
Client: "Keep me updated"
Server: "Here's update 1... update 2... update 3..."
One persistent connection, server sends when ready
```

## How SSE Works

### The Connection Flow

```
1. Client opens connection:
   GET /events HTTP/1.1
   Accept: text/event-stream

2. Server responds with special headers:
   HTTP/1.1 200 OK
   Content-Type: text/event-stream
   Cache-Control: no-cache
   Connection: keep-alive

3. Server sends events:
   data: This is message 1
   
   data: This is message 2
   
   data: {"json": "message 3"}
   
4. Connection stays open, server sends more events anytime
```

### Event Format

```
event: message
id: 123
data: Hello World

event: update
id: 124
data: {"temperature": 72}
data: {"humidity": 45}

: this is a comment

data: Simple message without event name
```

## Pros and Cons

### ✅ Pros

1. **Simple**: Just HTTP, no special protocol
2. **One-Way**: Perfect when server → client is all you need
3. **Auto-Reconnect**: Built-in reconnection with last-event-id
4. **Text-Based**: Easy to debug and understand
5. **Lightweight**: Less overhead than WebSockets
6. **Browser Native**: EventSource API built into browsers
7. **Works Through Proxies**: Just HTTP, no upgrade needed
8. **Event IDs**: Track message order and resume
9. **Named Events**: Different event types on same connection
10. **Low Latency**: Messages arrive as soon as sent

### ❌ Cons

1. **One-Way Only**: Client can't send data back (must use separate HTTP)
2. **Text Only**: No binary data (WebSockets support binary)
3. **Browser Limits**: Max 6 connections per domain
4. **No IE Support**: Internet Explorer doesn't support SSE
5. **UTF-8 Only**: Can't send other encodings
6. **HTTP/2 Needed for Scale**: HTTP/1.1 limits concurrent connections
7. **Less Control**: Can't customize headers per message
8. **No Built-in Authentication**: Need to handle in initial request

## When to Use SSE

### ✅ Great For:

- **Live Feeds**: News feeds, social media updates
- **Real-time Notifications**: User notifications, alerts
- **Stock Tickers**: Price updates, market data
- **Live Scores**: Sports scores, game updates
- **Progress Updates**: File upload progress, task status
- **Server Monitoring**: Metrics, logs streaming
- **Live Blogs**: Event coverage with live updates
- **Activity Streams**: User activity, audit logs
- **IoT Data**: Sensor readings (when server aggregates)

### ❌ Not Ideal For:

- **Two-Way Chat**: Use WebSockets (need client → server)
- **Gaming**: WebSockets better (need bidirectional)
- **Binary Data**: WebSockets or HTTP download
- **High-Frequency Trading**: WebSockets (lower latency)
- **Client-Initiated Actions**: Need separate HTTP calls
- **IE Support Required**: Use WebSockets or polling

## SSE vs WebSockets

| Feature | SSE | WebSockets |
|---------|-----|------------|
| **Direction** | Server → Client only | Bidirectional |
| **Protocol** | HTTP | Custom over HTTP Upgrade |
| **Data Format** | Text (UTF-8) | Text or Binary |
| **Reconnection** | Automatic | Manual |
| **Browser Support** | All except IE | All modern browsers |
| **Complexity** | Simple | More complex |
| **Overhead** | Lower | Higher |
| **Use Case** | Live feeds, notifications | Chat, games, collaboration |

## Implementation Examples

### Python Implementation (FastAPI)

```python
from fastapi import FastAPI
from fastapi.responses import StreamingResponse
from typing import AsyncGenerator
import asyncio
import json
from datetime import datetime
import random

app = FastAPI()

# ============================================
# SIMPLE SSE ENDPOINT
# ============================================

async def event_generator() -> AsyncGenerator[str, None]:
    """
    Simple event generator
    Yields events in SSE format
    """
    counter = 0
    while True:
        # Wait for 2 seconds
        await asyncio.sleep(2)
        
        counter += 1
        
        # Send event in SSE format
        # Format: "data: <message>\n\n"
        yield f"data: Message {counter} at {datetime.now()}\n\n"
        
        # Stop after 10 messages (in real app, this runs forever)
        if counter >= 10:
            break


@app.get("/events/simple")
async def simple_events():
    """
    Simple SSE endpoint
    Sends messages every 2 seconds
    """
    return StreamingResponse(
        event_generator(),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "Connection": "keep-alive",
        }
    )


# ============================================
# STRUCTURED EVENTS WITH ID AND TYPE
# ============================================

async def structured_event_generator() -> AsyncGenerator[str, None]:
    """
    Generate structured events with ID and event type
    """
    event_id = 0
    
    while True:
        await asyncio.sleep(1)
        event_id += 1
        
        # Create event data
        data = {
            "timestamp": datetime.now().isoformat(),
            "value": random.randint(1, 100)
        }
        
        # SSE format with event type and ID
        event = f"event: update\n"
        event += f"id: {event_id}\n"
        event += f"data: {json.dumps(data)}\n\n"
        
        yield event


@app.get("/events/structured")
async def structured_events():
    """
    SSE endpoint with event types and IDs
    """
    return StreamingResponse(
        structured_event_generator(),
        media_type="text/event-stream"
    )


# ============================================
# STOCK TICKER EXAMPLE
# ============================================

# Simulated stock data
STOCKS = ["AAPL", "GOOGL", "MSFT", "AMZN", "TSLA"]

async def stock_ticker_generator() -> AsyncGenerator[str, None]:
    """
    Stream stock price updates
    """
    event_id = 0
    
    # Initial prices
    prices = {stock: random.uniform(100, 500) for stock in STOCKS}
    
    while True:
        await asyncio.sleep(1)
        event_id += 1
        
        # Update one random stock
        stock = random.choice(STOCKS)
        change = random.uniform(-5, 5)
        prices[stock] += change
        
        # Create event
        event_data = {
            "stock": stock,
            "price": round(prices[stock], 2),
            "change": round(change, 2),
            "timestamp": datetime.now().isoformat()
        }
        
        event = f"event: stock-update\n"
        event += f"id: {event_id}\n"
        event += f"data: {json.dumps(event_data)}\n\n"
        
        yield event


@app.get("/events/stocks")
async def stock_ticker():
    """
    Real-time stock price updates
    """
    return StreamingResponse(
        stock_ticker_generator(),
        media_type="text/event-stream"
    )


# ============================================
# NOTIFICATION SYSTEM
# ============================================

# In-memory notification queue (in production, use Redis/RabbitMQ)
notification_queues = {}

async def notification_generator(user_id: str) -> AsyncGenerator[str, None]:
    """
    Stream notifications for a specific user
    """
    # Create queue for this user
    notification_queues[user_id] = asyncio.Queue()
    queue = notification_queues[user_id]
    
    try:
        event_id = 0
        while True:
            # Wait for notification
            notification = await queue.get()
            event_id += 1
            
            # Send as SSE
            event = f"event: notification\n"
            event += f"id: {event_id}\n"
            event += f"data: {json.dumps(notification)}\n\n"
            
            yield event
            
    finally:
        # Clean up queue when client disconnects
        del notification_queues[user_id]


@app.get("/events/notifications/{user_id}")
async def notifications_stream(user_id: str):
    """
    Personal notification stream
    """
    return StreamingResponse(
        notification_generator(user_id),
        media_type="text/event-stream"
    )


# REST endpoint to send notifications
@app.post("/api/notify/{user_id}")
async def send_notification(user_id: str, notification: dict):
    """
    Send notification to a user's SSE stream
    """
    if user_id in notification_queues:
        await notification_queues[user_id].put(notification)
        return {"status": "sent"}
    return {"status": "user not connected"}


# ============================================
# SERVER METRICS DASHBOARD
# ============================================

async def metrics_generator() -> AsyncGenerator[str, None]:
    """
    Stream server metrics
    """
    event_id = 0
    
    while True:
        await asyncio.sleep(2)
        event_id += 1
        
        # Simulate metrics
        metrics = {
            "cpu": random.randint(10, 90),
            "memory": random.randint(30, 80),
            "disk": random.randint(40, 95),
            "requests_per_sec": random.randint(50, 500),
            "active_connections": random.randint(10, 100),
            "timestamp": datetime.now().isoformat()
        }
        
        event = f"event: metrics\n"
        event += f"id: {event_id}\n"
        event += f"data: {json.dumps(metrics)}\n\n"
        
        yield event


@app.get("/events/metrics")
async def metrics_stream():
    """
    Real-time server metrics
    """
    return StreamingResponse(
        metrics_generator(),
        media_type="text/event-stream"
    )


# ============================================
# MULTI-LINE DATA SUPPORT
# ============================================

async def multiline_generator() -> AsyncGenerator[str, None]:
    """
    Send multi-line messages
    """
    messages = [
        "Line 1\nLine 2\nLine 3",
        "Another\nMulti-line\nMessage"
    ]
    
    for idx, message in enumerate(messages):
        await asyncio.sleep(2)
        
        # For multi-line data, use multiple data: lines
        event = f"id: {idx}\n"
        for line in message.split('\n'):
            event += f"data: {line}\n"
        event += "\n"
        
        yield event


@app.get("/events/multiline")
async def multiline_events():
    """
    SSE with multi-line messages
    """
    return StreamingResponse(
        multiline_generator(),
        media_type="text/event-stream"
    )


# ============================================
# CLIENT EXAMPLE (JavaScript)
# ============================================

HTML_CLIENT = """
<!DOCTYPE html>
<html>
<head>
    <title>SSE Client</title>
    <style>
        #events { 
            border: 1px solid #ccc; 
            height: 400px; 
            overflow-y: scroll; 
            padding: 10px; 
            font-family: monospace;
        }
        .event { 
            padding: 5px; 
            margin: 5px 0; 
            background: #f0f0f0; 
        }
    </style>
</head>
<body>
    <h1>Server-Sent Events Demo</h1>
    
    <button onclick="connectSimple()">Simple Events</button>
    <button onclick="connectStock()">Stock Ticker</button>
    <button onclick="connectMetrics()">Server Metrics</button>
    <button onclick="disconnect()">Disconnect</button>
    
    <div id="status">Not connected</div>
    <div id="events"></div>
    
    <script>
        let eventSource = null;
        
        function connectSimple() {
            connect('/events/simple');
        }
        
        function connectStock() {
            connect('/events/stocks', handleStockEvent);
        }
        
        function connectMetrics() {
            connect('/events/metrics', handleMetricsEvent);
        }
        
        function connect(url, customHandler) {
            disconnect();
            
            eventSource = new EventSource(url);
            
            eventSource.onopen = function() {
                document.getElementById('status').textContent = 'Connected to ' + url;
                addEvent('Connected!', 'system');
            };
            
            eventSource.onmessage = function(event) {
                addEvent(event.data, 'message');
            };
            
            // Handle custom event types
            if (customHandler) {
                customHandler(eventSource);
            }
            
            eventSource.onerror = function(error) {
                document.getElementById('status').textContent = 'Error or disconnected';
                addEvent('Connection error', 'error');
            };
        }
        
        function handleStockEvent(es) {
            es.addEventListener('stock-update', function(event) {
                const data = JSON.parse(event.data);
                const text = `${data.stock}: $${data.price} (${data.change > 0 ? '+' : ''}${data.change})`;
                addEvent(text, 'stock');
            });
        }
        
        function handleMetricsEvent(es) {
            es.addEventListener('metrics', function(event) {
                const data = JSON.parse(event.data);
                const text = `CPU: ${data.cpu}% | Memory: ${data.memory}% | RPS: ${data.requests_per_sec}`;
                addEvent(text, 'metrics');
            });
        }
        
        function disconnect() {
            if (eventSource) {
                eventSource.close();
                eventSource = null;
                document.getElementById('status').textContent = 'Disconnected';
                addEvent('Disconnected', 'system');
            }
        }
        
        function addEvent(text, type) {
            const eventsDiv = document.getElementById('events');
            const eventEl = document.createElement('div');
            eventEl.className = 'event';
            eventEl.textContent = `[${type}] ${new Date().toLocaleTimeString()} - ${text}`;
            eventsDiv.appendChild(eventEl);
            eventsDiv.scrollTop = eventsDiv.scrollHeight;
        }
        
        // Automatic reconnection is built-in!
        // EventSource will reconnect automatically if connection drops
    </script>
</body>
</html>
"""

@app.get("/")
async def serve_client():
    """Serve HTML client"""
    from fastapi.responses import HTMLResponse
    return HTMLResponse(content=HTML_CLIENT)


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
```

### Go Implementation

```go
package main

import (
	"encoding/json"
	"fmt"
	"log"
	"math/rand"
	"net/http"
	"time"
)

// ============================================
// SSE HELPERS
// ============================================

// Event represents an SSE event
type Event struct {
	ID    string
	Event string
	Data  string
}

// FormatSSE formats an event in SSE format
func (e *Event) FormatSSE() string {
	msg := ""
	
	if e.ID != "" {
		msg += fmt.Sprintf("id: %s\n", e.ID)
	}
	
	if e.Event != "" {
		msg += fmt.Sprintf("event: %s\n", e.Event)
	}
	
	msg += fmt.Sprintf("data: %s\n\n", e.Data)
	
	return msg
}

// SetSSEHeaders sets required SSE headers
func SetSSEHeaders(w http.ResponseWriter) {
	w.Header().Set("Content-Type", "text/event-stream")
	w.Header().Set("Cache-Control", "no-cache")
	w.Header().Set("Connection", "keep-alive")
	w.Header().Set("Access-Control-Allow-Origin", "*")
}

// ============================================
// SIMPLE SSE ENDPOINT
// ============================================

func simpleEventsHandler(w http.ResponseWriter, r *http.Request) {
	SetSSEHeaders(w)
	
	// Get flusher to send data immediately
	flusher, ok := w.(http.Flusher)
	if !ok {
		http.Error(w, "Streaming unsupported", http.StatusInternalServerError)
		return
	}
	
	// Send events
	for i := 1; i <= 10; i++ {
		event := Event{
			ID:   fmt.Sprintf("%d", i),
			Data: fmt.Sprintf("Message %d at %s", i, time.Now().Format(time.RFC3339)),
		}
		
		fmt.Fprint(w, event.FormatSSE())
		flusher.Flush()
		
		time.Sleep(2 * time.Second)
		
		// Check if client disconnected
		select {
		case <-r.Context().Done():
			log.Println("Client disconnected")
			return
		default:
		}
	}
}

// ============================================
// STOCK TICKER
// ============================================

type StockUpdate struct {
	Stock     string    `json:"stock"`
	Price     float64   `json:"price"`
	Change    float64   `json:"change"`
	Timestamp time.Time `json:"timestamp"`
}

func stockTickerHandler(w http.ResponseWriter, r *http.Request) {
	SetSSEHeaders(w)
	
	flusher, ok := w.(http.Flusher)
	if !ok {
		http.Error(w, "Streaming unsupported", http.StatusInternalServerError)
		return
	}
	
	stocks := []string{"AAPL", "GOOGL", "MSFT", "AMZN", "TSLA"}
	prices := make(map[string]float64)
	
	// Initialize prices
	for _, stock := range stocks {
		prices[stock] = 100 + rand.Float64()*400
	}
	
	eventID := 0
	ticker := time.NewTicker(1 * time.Second)
	defer ticker.Stop()
	
	for {
		select {
		case <-ticker.C:
			eventID++
			
			// Update random stock
			stock := stocks[rand.Intn(len(stocks))]
			change := (rand.Float64() - 0.5) * 10
			prices[stock] += change
			
			update := StockUpdate{
				Stock:     stock,
				Price:     prices[stock],
				Change:    change,
				Timestamp: time.Now(),
			}
			
			data, _ := json.Marshal(update)
			
			event := Event{
				ID:    fmt.Sprintf("%d", eventID),
				Event: "stock-update",
				Data:  string(data),
			}
			
			fmt.Fprint(w, event.FormatSSE())
			flusher.Flush()
			
		case <-r.Context().Done():
			log.Println("Client disconnected from stock ticker")
			return
		}
	}
}

// ============================================
// SERVER METRICS
// ============================================

type Metrics struct {
	CPU               int       `json:"cpu"`
	Memory            int       `json:"memory"`
	Disk              int       `json:"disk"`
	RequestsPerSec    int       `json:"requests_per_sec"`
	ActiveConnections int       `json:"active_connections"`
	Timestamp         time.Time `json:"timestamp"`
}

func metricsHandler(w http.ResponseWriter, r *http.Request) {
	SetSSEHeaders(w)
	
	flusher, ok := w.(http.Flusher)
	if !ok {
		http.Error(w, "Streaming unsupported", http.StatusInternalServerError)
		return
	}
	
	eventID := 0
	ticker := time.NewTicker(2 * time.Second)
	defer ticker.Stop()
	
	for {
		select {
		case <-ticker.C:
			eventID++
			
			metrics := Metrics{
				CPU:               10 + rand.Intn(80),
				Memory:            30 + rand.Intn(50),
				Disk:              40 + rand.Intn(55),
				RequestsPerSec:    50 + rand.Intn(450),
				ActiveConnections: 10 + rand.Intn(90),
				Timestamp:         time.Now(),
			}
			
			data, _ := json.Marshal(metrics)
			
			event := Event{
				ID:    fmt.Sprintf("%d", eventID),
				Event: "metrics",
				Data:  string(data),
			}
			
			fmt.Fprint(w, event.FormatSSE())
			flusher.Flush()
			
		case <-r.Context().Done():
			log.Println("Client disconnected from metrics")
			return
		}
	}
}

// ============================================
// MAIN
// ============================================

func main() {
	http.HandleFunc("/events/simple", simpleEventsHandler)
	http.HandleFunc("/events/stocks", stockTickerHandler)
	http.HandleFunc("/events/metrics", metricsHandler)
	
	// Serve HTML client
	http.HandleFunc("/", func(w http.ResponseWriter, r *http.Request) {
		http.ServeFile(w, r, "index.html")
	})
	
	log.Println("SSE Server running on :8080")
	log.Fatal(http.ListenAndServe(":8080", nil))
}
```

## Best Practices

### 1. Handle Reconnection with Last-Event-ID

```python
@app.get("/events/resumable")
async def resumable_events(last_event_id: str = None):
    """
    Resume from last received event
    """
    start_id = int(last_event_id) if last_event_id else 0
    
    async def generator():
        event_id = start_id
        while True:
            event_id += 1
            yield f"id: {event_id}\ndata: Event {event_id}\n\n"
            await asyncio.sleep(1)
    
    return StreamingResponse(generator(), media_type="text/event-stream")
```

### 2. Send Heartbeat Comments

```python
async def generator_with_heartbeat():
    while True:
        # Send heartbeat every 15 seconds
        yield ": heartbeat\n\n"
        await asyncio.sleep(15)
```

### 3. Authenticate SSE Connections

```python
@app.get("/events/secure")
async def secure_events(token: str):
    user = verify_token(token)
    if not user:
        raise HTTPException(status_code=401)
    
    async def generator():
        # Send events only for this user
        pass
    
    return StreamingResponse(generator(), media_type="text/event-stream")
```

### 4. Close Stale Connections

```python
async def generator_with_timeout():
    start_time = time.time()
    timeout = 3600  # 1 hour
    
    while time.time() - start_time < timeout:
        yield f"data: Event\n\n"
        await asyncio.sleep(1)
    
    # Connection will close after timeout
```

## SSE with Different Event Types

```javascript
// Client side
const eventSource = new EventSource('/events/structured');

// Listen to specific event types
eventSource.addEventListener('user-joined', (event) => {
    console.log('User joined:', event.data);
});

eventSource.addEventListener('message-sent', (event) => {
    console.log('New message:', event.data);
});

// Default message handler
eventSource.onmessage = (event) => {
    console.log('Generic event:', event.data);
};
```

## Real-World Use Cases

1. **News Websites**: Live blog updates during events
2. **Finance**: Stock price tickers, crypto prices
3. **Sports**: Live score updates
4. **Social Media**: Notification feeds
5. **Monitoring**: Server metrics, log streaming
6. **E-commerce**: Inventory updates, flash sale countdowns
7. **Collaboration**: Presence updates (who's online)
8. **IoT Dashboards**: Sensor data visualization

## Key Takeaway

SSE is like a news ticker or radio broadcast - the server sends updates whenever it wants, and clients just listen. It's simpler than WebSockets when you only need one-way communication from server to client. Perfect for live feeds, notifications, and real-time dashboards where clients don't need to send data back frequently.

Choose SSE when:
- ✅ You only need server → client updates
- ✅ You want automatic reconnection
- ✅ You prefer simple, HTTP-based protocol
- ✅ You're building notifications, feeds, or monitoring

Choose WebSockets when:
- ❌ You need true two-way communication
- ❌ You need to send binary data
- ❌ You need lower latency (though SSE is quite fast)
