# Computer Networks: Complete Backend Engineer's Guide

## Table of Contents
1. [Introduction & History](#introduction--history)
2. [Why Networks Matter for Backend Engineers](#why-networks-matter)
3. [Network Models (OSI & TCP/IP)](#network-models)
4. [Application Layer Protocols](#application-layer-protocols)
5. [Transport Layer (TCP & UDP)](#transport-layer)
6. [Network Layer (IP)](#network-layer)
7. [DNS & Domain Resolution](#dns--domain-resolution)
8. [Load Balancing](#load-balancing)
9. [Network Security](#network-security)
10. [Tools & Hands-On Practice](#tools--hands-on-practice)
11. [Production Applications](#production-applications)

---

## Introduction & History

### The Evolution of Computer Networks

**1960s: ARPANET - The Beginning**
- **Problem**: Researchers at different universities couldn't share expensive computer resources.
- **Solution**: ARPA (Advanced Research Projects Agency) funded development of ARPANET.
- **1969**: First message sent between UCLA and Stanford Research Institute.
- **Innovation**: Packet switching (data broken into packets, routed independently).
- **Why Revolutionary**: Previous systems used circuit switching (dedicated line, wasteful).

**1970s: TCP/IP Revolution**
- **Problem**: Different networks used incompatible protocols (couldn't communicate).
- **1974**: Vint Cerf and Bob Kahn published TCP/IP specification.
- **Why Important**: Universal protocol suite enabled internetworking.
- **1983**: ARPANET officially switched to TCP/IP (birth of Internet).

**1980s: DNS & Email**
- **1983**: DNS invented by Paul Mockapetris.
- **Problem**: Host files were manually distributed, didn't scale.
- **Solution**: Distributed hierarchical naming system.
- **Impact**: Made Internet user-friendly (names instead of IP addresses).

**1990s: World Wide Web & HTTP**
- **1989**: Tim Berners-Lee invented HTTP and HTML at CERN.
- **1991**: First web page published.
- **Why Revolutionary**: Made Internet accessible to non-technical users.
- **Impact**: Explosive growth - 16 million users in 1995, 400 million by 2000.

**2000s: Broadband & Mobile**
- **DSL, Cable, Fiber**: High-speed home internet.
- **WiFi (802.11)**: Wireless networking standards.
- **3G/4G**: Mobile internet access.

**2010s-Present: Cloud & Modern Protocols**
- **HTTP/2 (2015)**: Multiplexing, server push, header compression.
- **QUIC/HTTP/3 (2020)**: Built on UDP, faster connection establishment.
- **WebSockets**: Full-duplex communication for real-time apps.
- **5G**: Low-latency, high-bandwidth mobile networks.

---

## Why Networks Matter for Backend Engineers

### The What: Network Fundamentals

Networking enables communication between computers. For backend engineers:
- **APIs**: HTTP/REST communication
- **Databases**: Network protocols for queries
- **Microservices**: Service-to-service communication
- **Caching**: Redis/Memcached over network
- **Message Queues**: Kafka, RabbitMQ distributed systems

### The Why: Impact on Backend Systems

1. **Performance**: Network is often the bottleneck
   - **Example**: 1ms local database query vs 100ms across continents
   - **HTTP/2 vs HTTP/1.1**: 50% faster page loads via multiplexing

2. **Reliability**: Networks fail, systems must handle it
   - **Timeouts**: Prevent hanging requests
   - **Retries**: Handle transient failures
   - **Circuit Breakers**: Prevent cascade failures

3. **Scalability**: Network limits affect capacity
   - **Bandwidth**: Data transfer rate (GB/s)
   - **Latency**: Round-trip time (ms)
   - **Connections**: Max concurrent TCP connections

4. **Security**: Networks are attack vectors
   - **DDoS**: Overwhelm servers with traffic
   - **MITM**: Intercept/modify data in transit
   - **TLS/SSL**: Encrypt communication

### The How: Practical Applications

| Network Concept | Backend Use Case | Example |
|-----------------|------------------|---------|
| HTTP/HTTPS | API communication | REST APIs, GraphQL |
| WebSockets | Real-time updates | Chat apps, live notifications |
| TCP | Reliable delivery | Database connections |
| UDP | Low-latency | Video streaming, gaming |
| DNS | Service discovery | Kubernetes DNS for microservices |
| Load Balancing | Traffic distribution | Nginx, HAProxy, AWS ELB |
| CDN | Static content delivery | Cloudflare, Akamai |
| VPN | Secure remote access | Database access from cloud |

---

## Network Models

### OSI Model (7 Layers)

**History (1984)**: ISO standardized network communication model.

```
┌─────────────────────┬──────────────────────────────────────┐
│ 7. Application      │ HTTP, FTP, SMTP, DNS                 │
├─────────────────────┼──────────────────────────────────────┤
│ 6. Presentation     │ Encryption, Compression (TLS, JPEG)  │
├─────────────────────┼──────────────────────────────────────┤
│ 5. Session          │ Session management, Authentication   │
├─────────────────────┼──────────────────────────────────────┤
│ 4. Transport        │ TCP, UDP (Port numbers)              │
├─────────────────────┼──────────────────────────────────────┤
│ 3. Network          │ IP addressing, Routing               │
├─────────────────────┼──────────────────────────────────────┤
│ 2. Data Link        │ MAC addresses, Ethernet, WiFi        │
├─────────────────────┼──────────────────────────────────────┤
│ 1. Physical         │ Cables, Signals, Bits                │
└─────────────────────┴──────────────────────────────────────┘
```

### TCP/IP Model (4 Layers) - What We Actually Use

```
┌─────────────────────┬──────────────────────────────────────┐
│ 4. Application      │ HTTP, DNS, SSH, FTP                  │
├─────────────────────┼──────────────────────────────────────┤
│ 3. Transport        │ TCP, UDP                             │
├─────────────────────┼──────────────────────────────────────┤
│ 2. Internet         │ IP, ICMP, ARP                        │
├─────────────────────┼──────────────────────────────────────┤
│ 1. Link             │ Ethernet, WiFi, PPP                  │
└─────────────────────┴──────────────────────────────────────┘
```

**Why TCP/IP Won Over OSI**:
- Simpler, practical model
- Already implemented in Unix/Internet
- OSI was theoretical, TCP/IP was battle-tested

---

## Application Layer Protocols

### HTTP (Hypertext Transfer Protocol)

**History**:
- **HTTP/0.9 (1991)**: Only GET method, no headers
- **HTTP/1.0 (1996)**: Added headers, POST, status codes
- **HTTP/1.1 (1997)**: Persistent connections, chunked transfer
- **HTTP/2 (2015)**: Binary protocol, multiplexing, server push
- **HTTP/3 (2020)**: Based on QUIC (UDP), faster handshake

**HTTP/1.1 Request/Response**:

```
GET /api/users/123 HTTP/1.1
Host: api.example.com
User-Agent: curl/7.68.0
Accept: application/json
Authorization: Bearer eyJhbGc...

HTTP/1.1 200 OK
Content-Type: application/json
Content-Length: 58
Cache-Control: max-age=3600

{"id": 123, "name": "John Doe", "email": "john@example.com"}
```

**HTTP Methods**:

| Method | Purpose | Idempotent | Safe |
|--------|---------|------------|------|
| GET | Retrieve resource | ✅ | ✅ |
| POST | Create resource | ❌ | ❌ |
| PUT | Update/Replace | ✅ | ❌ |
| PATCH | Partial update | ❌ | ❌ |
| DELETE | Remove resource | ✅ | ❌ |
| HEAD | Get headers only | ✅ | ✅ |
| OPTIONS | Get allowed methods | ✅ | ✅ |

**HTTP Status Codes**:

```
1xx: Informational
  100 Continue
  101 Switching Protocols

2xx: Success
  200 OK
  201 Created
  204 No Content

3xx: Redirection
  301 Moved Permanently
  302 Found
  304 Not Modified

4xx: Client Errors
  400 Bad Request
  401 Unauthorized
  403 Forbidden
  404 Not Found
  429 Too Many Requests

5xx: Server Errors
  500 Internal Server Error
  502 Bad Gateway
  503 Service Unavailable
  504 Gateway Timeout
```

### HTTP/2 vs HTTP/1.1

**HTTP/1.1 Problems**:
1. **Head-of-line blocking**: One slow resource blocks others
2. **No multiplexing**: One request per TCP connection
3. **Header overhead**: Repetitive headers (cookies, user-agent)

**HTTP/2 Solutions**:
1. **Binary protocol**: More efficient parsing
2. **Multiplexing**: Multiple requests on single connection
3. **Header compression**: HPACK algorithm
4. **Server push**: Server sends resources before requested
5. **Stream prioritization**: Important resources first

**Performance Comparison**:
```
HTTP/1.1: 
[Request 1 ──────] [Request 2 ──────] [Request 3 ──────]
Time: 300ms

HTTP/2 (multiplexed):
[Request 1 ──────]
[Request 2 ──────]
[Request 3 ──────]
Time: 100ms
```

### HTTP/3 (QUIC)

**Why Created (2020)**:
- **Problem**: HTTP/2 still uses TCP, has head-of-line blocking at transport layer
- **Solution**: Built on QUIC (Quick UDP Internet Connections)
- **Benefits**:
  - 0-RTT connection establishment (vs 2-RTT for TCP+TLS)
  - No head-of-line blocking (independent streams)
  - Better mobile support (connection migration)

### WebSockets

**History (2011)**: Standardized for full-duplex communication.

**Problem Solved**: HTTP is request-response; can't push updates to client.

**How It Works**:
1. Client sends HTTP Upgrade request
2. Server agrees, switches to WebSocket protocol
3. Bidirectional communication over single TCP connection

**Use Cases**:
- Real-time chat
- Live notifications
- Collaborative editing
- Gaming
- Stock tickers

### Implementation in Go

```go
package main

import (
	"fmt"
	"io"
	"net/http"
	"time"
	"github.com/gorilla/websocket"
)

// HTTP/1.1 Server
func simpleHTTPServer() {
	http.HandleFunc("/", func(w http.ResponseWriter, r *http.Request) {
		fmt.Fprintf(w, "Hello from HTTP server!\n")
		fmt.Fprintf(w, "Method: %s\n", r.Method)
		fmt.Fprintf(w, "URL: %s\n", r.URL.Path)
		fmt.Fprintf(w, "Headers:\n")
		for key, values := range r.Header {
			for _, value := range values {
				fmt.Fprintf(w, "  %s: %s\n", key, value)
			}
		}
	})

	http.HandleFunc("/api/users", func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Content-Type", "application/json")
		
		switch r.Method {
		case "GET":
			w.WriteHeader(http.StatusOK)
			fmt.Fprintf(w, `[{"id": 1, "name": "Alice"}, {"id": 2, "name": "Bob"}]`)
		case "POST":
			body, _ := io.ReadAll(r.Body)
			w.WriteHeader(http.StatusCreated)
			fmt.Fprintf(w, `{"id": 3, "created": true, "data": %s}`, body)
		default:
			w.WriteHeader(http.StatusMethodNotAllowed)
			fmt.Fprintf(w, `{"error": "Method not allowed"}`)
		}
	})

	fmt.Println("HTTP server starting on :8080")
	http.ListenAndServe(":8080", nil)
}

// HTTP/2 Server (requires TLS)
func http2Server() {
	http.HandleFunc("/", func(w http.ResponseWriter, r *http.Request) {
		fmt.Fprintf(w, "HTTP/2 Server\n")
		fmt.Fprintf(w, "Protocol: %s\n", r.Proto)
	})

	// Generate self-signed cert for demo:
	// openssl req -newkey rsa:2048 -nodes -keyout server.key -x509 -days 365 -out server.crt
	
	fmt.Println("HTTP/2 server starting on :8443")
	http.ListenAndServeTLS(":8443", "server.crt", "server.key", nil)
}

// WebSocket Server
var upgrader = websocket.Upgrader{
	CheckOrigin: func(r *http.Request) bool {
		return true // Allow all origins (production: validate!)
	},
}

func websocketHandler(w http.ResponseWriter, r *http.Request) {
	conn, err := upgrader.Upgrade(w, r, nil)
	if err != nil {
		fmt.Println("Upgrade error:", err)
		return
	}
	defer conn.Close()

	fmt.Println("Client connected")

	// Send welcome message
	conn.WriteMessage(websocket.TextMessage, []byte("Welcome to WebSocket server!"))

	// Echo loop
	for {
		messageType, message, err := conn.ReadMessage()
		if err != nil {
			fmt.Println("Read error:", err)
			break
		}

		fmt.Printf("Received: %s\n", message)

		// Echo back
		err = conn.WriteMessage(messageType, message)
		if err != nil {
			fmt.Println("Write error:", err)
			break
		}
	}
}

func websocketServer() {
	http.HandleFunc("/ws", websocketHandler)
	
	fmt.Println("WebSocket server starting on :8081")
	http.ListenAndServe(":8081", nil)
}

// HTTP Client Examples
func httpClientExamples() {
	client := &http.Client{
		Timeout: 10 * time.Second,
	}

	// GET request
	resp, err := client.Get("http://api.example.com/users")
	if err != nil {
		fmt.Println("GET error:", err)
		return
	}
	defer resp.Body.Close()

	body, _ := io.ReadAll(resp.Body)
	fmt.Printf("Status: %d\n", resp.StatusCode)
	fmt.Printf("Body: %s\n", body)

	// POST request
	jsonData := []byte(`{"name": "Alice", "email": "alice@example.com"}`)
	resp, err = client.Post(
		"http://api.example.com/users",
		"application/json",
		bytes.NewBuffer(jsonData),
	)
	if err != nil {
		fmt.Println("POST error:", err)
		return
	}
	defer resp.Body.Close()

	// Custom request with headers
	req, _ := http.NewRequest("GET", "http://api.example.com/protected", nil)
	req.Header.Set("Authorization", "Bearer token123")
	req.Header.Set("User-Agent", "MyApp/1.0")
	
	resp, err = client.Do(req)
	if err != nil {
		fmt.Println("Request error:", err)
		return
	}
	defer resp.Body.Close()
}

// Rate Limiting Middleware
func rateLimiter(next http.HandlerFunc) http.HandlerFunc {
	type client struct {
		lastSeen time.Time
		count    int
	}
	
	clients := make(map[string]*client)
	limit := 10 // requests per minute
	
	return func(w http.ResponseWriter, r *http.Request) {
		ip := r.RemoteAddr
		
		now := time.Now()
		c, exists := clients[ip]
		
		if !exists {
			clients[ip] = &client{lastSeen: now, count: 1}
			next(w, r)
			return
		}
		
		if now.Sub(c.lastSeen) > time.Minute {
			c.count = 1
			c.lastSeen = now
			next(w, r)
			return
		}
		
		if c.count >= limit {
			w.WriteHeader(http.StatusTooManyRequests)
			fmt.Fprintf(w, "Rate limit exceeded")
			return
		}
		
		c.count++
		next(w, r)
	}
}

func main() {
	// Run different servers (choose one or run in goroutines)
	
	// go simpleHTTPServer()
	// go http2Server()
	// go websocketServer()
	
	// Or run HTTP client examples
	httpClientExamples()
}
```

### Implementation in Python

```python
import socket
import http.server
import socketserver
from http.server import BaseHTTPRequestHandler, HTTPServer
import json
import asyncio
import websockets
from urllib.parse import urlparse, parse_qs
import requests
from typing import Dict, Any

# Simple HTTP Server
class SimpleHTTPHandler(BaseHTTPRequestHandler):
    """Custom HTTP request handler."""
    
    def do_GET(self):
        """Handle GET requests."""
        if self.path == '/':
            self.send_response(200)
            self.send_header('Content-type', 'text/html')
            self.end_headers()
            self.wfile.write(b'<h1>Hello from Python HTTP Server!</h1>')
        
        elif self.path.startswith('/api/users'):
            self.send_response(200)
            self.send_header('Content-type', 'application/json')
            self.end_headers()
            
            users = [
                {"id": 1, "name": "Alice"},
                {"id": 2, "name": "Bob"}
            ]
            self.wfile.write(json.dumps(users).encode())
        
        else:
            self.send_response(404)
            self.send_header('Content-type', 'application/json')
            self.end_headers()
            self.wfile.write(json.dumps({"error": "Not found"}).encode())
    
    def do_POST(self):
        """Handle POST requests."""
        content_length = int(self.headers['Content-Length'])
        post_data = self.rfile.read(content_length)
        
        try:
            data = json.loads(post_data.decode())
            
            self.send_response(201)
            self.send_header('Content-type', 'application/json')
            self.end_headers()
            
            response = {
                "id": 3,
                "created": True,
                "data": data
            }
            self.wfile.write(json.dumps(response).encode())
        
        except json.JSONDecodeError:
            self.send_response(400)
            self.send_header('Content-type', 'application/json')
            self.end_headers()
            self.wfile.write(json.dumps({"error": "Invalid JSON"}).encode())
    
    def log_message(self, format, *args):
        """Override to customize logging."""
        print(f"{self.client_address[0]} - {format % args}")


def run_http_server(port=8080):
    """Run simple HTTP server."""
    server = HTTPServer(('0.0.0.0', port), SimpleHTTPHandler)
    print(f"HTTP server starting on port {port}")
    server.serve_forever()


# WebSocket Server (async)
async def websocket_handler(websocket, path):
    """Handle WebSocket connections."""
    print(f"Client connected from {websocket.remote_address}")
    
    # Send welcome message
    await websocket.send("Welcome to WebSocket server!")
    
    try:
        async for message in websocket:
            print(f"Received: {message}")
            
            # Echo back
            await websocket.send(f"Echo: {message}")
    
    except websockets.exceptions.ConnectionClosed:
        print("Client disconnected")


async def run_websocket_server(port=8081):
    """Run WebSocket server."""
    print(f"WebSocket server starting on port {port}")
    async with websockets.serve(websocket_handler, "0.0.0.0", port):
        await asyncio.Future()  # Run forever


# HTTP Client Examples
def http_client_examples():
    """Demonstrate HTTP client usage."""
    print("=== HTTP Client Examples ===\n")
    
    # GET request
    print("--- GET Request ---")
    response = requests.get('https://api.github.com/users/octocat')
    print(f"Status: {response.status_code}")
    print(f"Headers: {dict(response.headers)}")
    print(f"Body: {response.json()}\n")
    
    # POST request
    print("--- POST Request ---")
    data = {"name": "Alice", "email": "alice@example.com"}
    response = requests.post(
        'https://httpbin.org/post',
        json=data,
        headers={'User-Agent': 'MyApp/1.0'}
    )
    print(f"Status: {response.status_code}")
    print(f"Response: {response.json()}\n")
    
    # Request with timeout
    print("--- Request with Timeout ---")
    try:
        response = requests.get('https://httpbin.org/delay/10', timeout=2)
    except requests.Timeout:
        print("Request timed out!\n")
    
    # Session (keeps cookies, connection pooling)
    print("--- Session Example ---")
    session = requests.Session()
    session.headers.update({'User-Agent': 'MyApp/1.0'})
    
    response = session.get('https://httpbin.org/get')
    print(f"Session request status: {response.status_code}\n")
    
    # Retry logic
    print("--- Retry Logic ---")
    from requests.adapters import HTTPAdapter
    from requests.packages.urllib3.util.retry import Retry
    
    retry_strategy = Retry(
        total=3,
        backoff_factor=1,
        status_forcelist=[429, 500, 502, 503, 504]
    )
    
    adapter = HTTPAdapter(max_retries=retry_strategy)
    session = requests.Session()
    session.mount("http://", adapter)
    session.mount("https://", adapter)
    
    try:
        response = session.get('https://httpbin.org/status/500')
        print(f"Status: {response.status_code}")
    except Exception as e:
        print(f"Failed after retries: {e}")


# Low-level socket programming
def tcp_server_example(port=9000):
    """Simple TCP echo server."""
    print(f"=== TCP Server on port {port} ===")
    
    server_socket = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
    server_socket.setsockopt(socket.SOL_SOCKET, socket.SO_REUSEADDR, 1)
    server_socket.bind(('0.0.0.0', port))
    server_socket.listen(5)
    
    print("Server listening...")
    
    try:
        while True:
            client_socket, address = server_socket.accept()
            print(f"Connection from {address}")
            
            try:
                while True:
                    data = client_socket.recv(1024)
                    if not data:
                        break
                    
                    print(f"Received: {data.decode()}")
                    client_socket.send(data)  # Echo back
            
            except Exception as e:
                print(f"Error: {e}")
            
            finally:
                client_socket.close()
    
    except KeyboardInterrupt:
        print("\nServer shutting down...")
    
    finally:
        server_socket.close()


def tcp_client_example(host='localhost', port=9000):
    """Simple TCP client."""
    print(f"=== TCP Client connecting to {host}:{port} ===")
    
    client_socket = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
    
    try:
        client_socket.connect((host, port))
        print("Connected to server")
        
        # Send message
        message = "Hello, server!"
        client_socket.send(message.encode())
        print(f"Sent: {message}")
        
        # Receive response
        response = client_socket.recv(1024)
        print(f"Received: {response.decode()}")
    
    except Exception as e:
        print(f"Error: {e}")
    
    finally:
        client_socket.close()


# UDP example
def udp_server_example(port=9001):
    """Simple UDP echo server."""
    print(f"=== UDP Server on port {port} ===")
    
    server_socket = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
    server_socket.bind(('0.0.0.0', port))
    
    print("UDP server listening...")
    
    try:
        while True:
            data, address = server_socket.recvfrom(1024)
            print(f"Received from {address}: {data.decode()}")
            
            # Echo back
            server_socket.sendto(data, address)
    
    except KeyboardInterrupt:
        print("\nServer shutting down...")
    
    finally:
        server_socket.close()


if __name__ == "__main__":
    import sys
    
    if len(sys.argv) > 1:
        mode = sys.argv[1]
        
        if mode == 'http':
            run_http_server()
        elif mode == 'ws':
            asyncio.run(run_websocket_server())
        elif mode == 'tcp-server':
            tcp_server_example()
        elif mode == 'tcp-client':
            tcp_client_example()
        elif mode == 'udp':
            udp_server_example()
        elif mode == 'client':
            http_client_examples()
        else:
            print("Unknown mode")
    else:
        print("Usage: python script.py [http|ws|tcp-server|tcp-client|udp|client]")
        http_client_examples()
```

---

## Transport Layer (TCP & UDP)

### TCP (Transmission Control Protocol)

**What**: Reliable, connection-oriented protocol.

**Key Features**:
1. **Reliable**: Guarantees delivery (ACKs, retransmission)
2. **Ordered**: Packets arrive in order
3. **Flow control**: Prevents overwhelming receiver
4. **Congestion control**: Prevents network congestion

**TCP 3-Way Handshake** (Connection Establishment):

```
Client                          Server
  |                               |
  |-------- SYN (seq=x) -------->|
  |                               |
  |<--- SYN-ACK (seq=y,ack=x+1)--|
  |                               |
  |------ ACK (ack=y+1) -------->|
  |                               |
  |     Connection Established    |
```

**Why 3-Way?**
- Prevents old duplicate connections
- Both sides confirm sequence numbers
- Establishes initial sequence numbers (ISN)

**TCP 4-Way Termination**:

```
Client                          Server
  |                               |
  |--------- FIN --------------->|
  |                               |
  |<-------- ACK ----------------|
  |                               |
  |<-------- FIN ----------------|
  |                               |
  |--------- ACK --------------->|
  |                               |
  |     Connection Closed         |
```

**TCP Flow Control (Sliding Window)**:

Receiver advertises window size (buffer space available):

```
Sender                        Receiver
  |                              |
  |--- Data (1-100) ----------->| Window: 100
  |<-- ACK (100), Window=50 ----|
  |--- Data (101-150) --------->| Can only send 50 more
  |<-- ACK (150), Window=0 ------|  Buffer full!
  |  (wait for window update)    |
  |<-- ACK (150), Window=100 ----|  Buffer cleared
  |--- Data (151-250) --------->|
```

**TCP Congestion Control**:

Algorithms prevent network congestion:

1. **Slow Start**: Exponentially increase window
2. **Congestion Avoidance**: Linear increase
3. **Fast Retransmit**: 3 duplicate ACKs trigger retransmit
4. **Fast Recovery**: Multiplicative decrease on loss

```
Window Size
     ^
     |     Slow      Congestion
     |     Start     Avoidance
     |       /|         /
     |      / |        /
     |     /  |       /
     |    /   |      /
     |   /    |     /
     |  /     |    /
     | /      |   /___
     |/       |  /    \___
     +--------+--+----+----+-----> Time
              ^  ^    ^
           Threshold  Loss
```

### UDP (User Datagram Protocol)

**What**: Unreliable, connectionless protocol.

**Key Features**:
1. **Fast**: No handshake, no ACKs
2. **Low overhead**: Minimal header (8 bytes vs TCP's 20+)
3. **No guarantees**: Packets may be lost, duplicated, or reordered
4. **Stateless**: No connection state

**UDP Header**:
```
 0      7 8     15 16    23 24    31
+--------+--------+--------+--------+
|  Source Port   | Dest Port       |
+--------+--------+--------+--------+
|  Length        | Checksum        |
+--------+--------+--------+--------+
|          Data (payload)          |
+----------------------------------+
```

**When to Use UDP**:
- **DNS**: Single packet query/response
- **Video streaming**: Some loss acceptable, latency critical
- **Online gaming**: Real-time, loss-tolerant
- **VoIP**: Low latency more important than reliability
- **DHCP**: Simple request/response

**TCP vs UDP Comparison**:

| Feature | TCP | UDP |
|---------|-----|-----|
| Connection | Connection-oriented | Connectionless |
| Reliability | Guaranteed delivery | Best effort |
| Ordering | In-order | May be out-of-order |
| Speed | Slower (overhead) | Faster |
| Header size | 20-60 bytes | 8 bytes |
| Flow control | ✅ | ❌ |
| Congestion control | ✅ | ❌ |
| Use cases | HTTP, FTP, Email | DNS, Streaming, Gaming |

---

## Hands-On Practice on Linux

### Network Monitoring Tools

```bash
#!/bin/bash

echo "=== Network Analysis Tools ==="

# 1. Install tools
sudo apt-get update
sudo apt-get install -y net-tools tcpdump wireshark-cli netcat nmap iperf3 mtr traceroute dnsutils

# 2. Network interfaces
echo "--- Network Interfaces ---"
ip addr show
# or older: ifconfig

# 3. Active connections
echo -e "\n--- Active Connections ---"
netstat -tuln  # TCP/UDP listening ports
# or newer: ss -tuln

# 4. Routing table
echo -e "\n--- Routing Table ---"
ip route show
# or: route -n

# 5. DNS resolution
echo -e "\n--- DNS Resolution ---"
dig google.com
nslookup google.com
host google.com

# 6. Trace route
echo -e "\n--- Trace Route ---"
traceroute google.com
# or better: mtr google.com

# 7. Port scanning
echo -e "\n--- Port Scan (localhost) ---"
nmap -p 1-1000 localhost

# 8. Network statistics
echo -e "\n--- Network Statistics ---"
netstat -s  # Protocol statistics
```

### Packet Capture with tcpdump

```bash
# Capture HTTP traffic
sudo tcpdump -i any -n port 80 -A

# Capture specific host
sudo tcpdump -i any host 8.8.8.8

# Save to file
sudo tcpdump -i any -w capture.pcap

# Read from file
tcpdump -r capture.pcap

# Filter by protocol
sudo tcpdump -i any tcp
sudo tcpdump -i any udp
sudo tcpdump -i any icmp

# Capture DNS queries
sudo tcpdump -i any port 53

# Advanced filter
sudo tcpdump -i any 'tcp port 80 and (((ip[2:2] - ((ip[0]&0xf)<<2)) - ((tcp[12]&0xf0)>>2)) != 0)'
```

### Building Network Servers

```bash
# 1. Simple HTTP server with netcat
echo -e "HTTP/1.1 200 OK\n\nHello from netcat!" | nc -l 8080

# Make it loop
while true; do
  echo -e "HTTP/1.1 200 OK\n\nHello $(date)" | nc -l 8080
done

# 2. TCP echo server
nc -l 9000  # Client: nc localhost 9000

# 3. UDP server
nc -lu 9001  # Client: nc -u localhost 9001

# 4. Port forwarding
# Forward local:8080 to remote:80
nc -l 8080 | nc remote.server.com 80

# 5. Test bandwidth with iperf3
# Server: iperf3 -s
# Client: iperf3 -c server_ip

# 6. Simulate network latency
sudo tc qdisc add dev eth0 root netem delay 100ms
# Remove: sudo tc qdisc del dev eth0 root

# 7. Simulate packet loss
sudo tc qdisc add dev eth0 root netem loss 10%
```

### Network Performance Testing

```bash
#!/bin/bash

# Create performance test script
cat > network_perf.sh << 'EOF'
#!/bin/bash

echo "=== Network Performance Testing ==="

# 1. Bandwidth test
echo "--- Bandwidth Test (iperf3) ---"
# Terminal 1: iperf3 -s
# Terminal 2: iperf3 -c localhost
# Result shows throughput in Gbps/Mbps

# 2. Latency test
echo "--- Latency Test (ping) ---"
ping -c 10 8.8.8.8 | tail -5

# 3. Connection test
echo "--- Connection Speed Test ---"
time curl -o /dev/null -s https://speed.cloudflare.com/__down?bytes=100000000

# 4. DNS performance
echo "--- DNS Resolution Time ---"
time nslookup google.com > /dev/null

# 5. TCP handshake time
echo "--- TCP Connection Time ---"
time nc -zv google.com 443

# 6. HTTP request time
echo "--- HTTP Request Breakdown ---"
curl -w "\nTime Breakdown:\n\
DNS lookup:     %{time_namelookup}s\n\
TCP handshake:  %{time_connect}s\n\
TLS handshake:  %{time_appconnect}s\n\
Server process: %{time_starttransfer}s\n\
Total time:     %{time_total}s\n" \
-o /dev/null -s https://www.google.com

EOF

chmod +x network_perf.sh
./network_perf.sh
```

### Wireshark Analysis (CLI)

```bash
# Install tshark (Wireshark CLI)
sudo apt-get install -y tshark

# Capture and analyze HTTP
sudo tshark -i any -f "tcp port 80" -Y "http"

# Extract HTTP hosts
sudo tshark -i any -f "tcp port 80" -Y "http.request" -T fields -e http.host

# Analyze saved capture
tshark -r capture.pcap

# Statistics
tshark -r capture.pcap -q -z io,stat,1  # 1-second intervals
tshark -r capture.pcap -q -z conv,tcp   # TCP conversations
tshark -r capture.pcap -q -z http,tree  # HTTP statistics

# Filter examples
tshark -r capture.pcap -Y "ip.addr == 192.168.1.1"
tshark -r capture.pcap -Y "tcp.port == 443"
tshark -r capture.pcap -Y "http.request.method == GET"
```

---

## DNS & Domain Resolution

### How DNS Works

**DNS Hierarchy**:
```
                      Root (.)
                         |
        +----------------+----------------+
        |                |                |
      .com             .org             .net
        |                |                |
    example.com      wikipedia.org    golang.net
        |
   www.example.com
```

**DNS Resolution Process**:

1. Check local cache
2. Query recursive resolver (ISP)
3. Resolver queries root nameserver
4. Root returns TLD nameserver (.com)
5. TLD returns authoritative nameserver
6. Authoritative returns IP address

**DNS Record Types**:

| Type | Purpose | Example |
|------|---------|---------|
| A | IPv4 address | example.com → 93.184.216.34 |
| AAAA | IPv6 address | example.com → 2606:2800:220:1:... |
| CNAME | Canonical name (alias) | www → example.com |
| MX | Mail server | mail.example.com |
| NS | Nameserver | ns1.example.com |
| TXT | Text (verification, SPF) | "v=spf1..." |
| PTR | Reverse lookup | 34.216.184.93 → example.com |
| SRV | Service location | _http._tcp.example.com |

### DNS Tools

```bash
# Query DNS
dig example.com
dig example.com A
dig example.com MX
dig example.com NS

# Trace DNS resolution
dig +trace example.com

# Reverse lookup
dig -x 8.8.8.8

# Query specific nameserver
dig @8.8.8.8 example.com

# Short output
dig +short example.com

# nslookup
nslookup example.com
nslookup example.com 8.8.8.8

# host command
host example.com
host -t MX example.com
```

---

## Production Applications

### Real-World Network Patterns

**1. Connection Pooling**:
```
Problem: Creating new TCP connection for each request is slow (3-way handshake)
Solution: Maintain pool of persistent connections
Benefit: 10x faster for high-frequency requests
```

**2. Keep-Alive**:
```
HTTP/1.0: One request per connection
HTTP/1.1: Connection: keep-alive (reuse connection)
Result: Reduced latency, fewer resources
```

**3. Load Balancing**:
```
L4 (Transport): Based on IP/Port
L7 (Application): Based on HTTP headers, URLs
Methods: Round-robin, Least connections, IP hash
```

**4. CDN (Content Delivery Network)**:
```
Problem: Users far from server = high latency
Solution: Cache content at edge locations worldwide
Example: Cloudflare, Akamai
Result: 50-90% faster load times
```

**5. Network Timeouts**:
```python
# Always set timeouts!
requests.get(url, timeout=5)  # 5 seconds

# Connect vs read timeout
requests.get(url, timeout=(3, 10))  # 3s connect, 10s read
```

---

This is the comprehensive Computer Networks content. Let me continue with the next files.
