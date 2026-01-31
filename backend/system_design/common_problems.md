# Common System Design Problems: Interview Solutions

## Table of Contents
1. [URL Shortener](#1-url-shortener)
2. [Twitter/Social Media Feed](#2-twitter-feed)
3. [WhatsApp/Real-Time Messaging](#3-whatsapp-messaging)
4. [YouTube/Video Streaming](#4-youtube-streaming)
5. [Uber/Ride Sharing](#5-uber-ride-sharing)
6. [Instagram/Photo Sharing](#6-instagram)
7. [Web Crawler](#7-web-crawler)
8. [Search Engine](#8-search-engine)
9. [Notification System](#9-notification-system)
10. [Rate Limiter](#10-rate-limiter)

---

## 1. URL Shortener

### Requirements
**Functional**:
- Shorten URL: `https://example.com/very/long/url` → `https://short.ly/abc123`
- Redirect: `https://short.ly/abc123` → Original URL
- Analytics: Track clicks

**Non-Functional**:
- 100M new URLs/month
- 10x read/write ratio (1B redirects/month)
- Low latency (<50ms)
- High availability (99.99%)

### Capacity Estimation

**Storage**:
```
100M URLs/month × 12 months = 1.2B URLs/year
Average URL length: 500 bytes
Total: 1.2B × 500 = 600GB/year
5 years: 3TB
```

**Bandwidth**:
```
Write: 100M/month ÷ 2.6M seconds = 38 writes/second
Read: 1B/month ÷ 2.6M seconds = 385 reads/second
```

**Cache**:
```
80/20 rule: 20% URLs = 80% traffic
Cache 20%: 240M × 500 bytes = 120GB
```

### Design

**High-Level Architecture**:
```
┌─────────┐
│ Client  │
└────┬────┘
     │
     ▼
┌─────────────┐
│ Load        │
│ Balancer    │
└──────┬──────┘
       │
       ├──────────────┬──────────────┐
       ▼              ▼              ▼
┌──────────┐    ┌──────────┐  ┌──────────┐
│ App      │    │ App      │  │ App      │
│ Server 1 │    │ Server 2 │  │ Server 3 │
└────┬─────┘    └────┬─────┘  └────┬─────┘
     │               │             │
     └───────────┬───┴─────────────┘
                 │
        ┌────────┴────────┐
        │                 │
        ▼                 ▼
  ┌──────────┐      ┌──────────┐
  │ Redis    │      │ Database │
  │ (Cache)  │      │(PostgreSQL)│
  └──────────┘      └──────────┘
```

**Database Schema**:
```sql
CREATE TABLE urls (
    id BIGSERIAL PRIMARY KEY,
    short_code VARCHAR(10) UNIQUE NOT NULL,
    original_url TEXT NOT NULL,
    user_id BIGINT,
    created_at TIMESTAMP DEFAULT NOW(),
    expires_at TIMESTAMP,
    INDEX (short_code),
    INDEX (user_id)
);

CREATE TABLE analytics (
    id BIGSERIAL PRIMARY KEY,
    short_code VARCHAR(10),
    clicked_at TIMESTAMP DEFAULT NOW(),
    ip_address VARCHAR(45),
    user_agent TEXT,
    referer TEXT,
    INDEX (short_code, clicked_at)
);
```

### Short Code Generation

**Option 1: Base62 Encoding**
```python
import random
import string

def base62_encode(num):
    """Convert number to base62 (0-9, a-z, A-Z)"""
    base62 = string.digits + string.ascii_lowercase + string.ascii_uppercase
    if num == 0:
        return base62[0]
    
    result = []
    while num:
        result.append(base62[num % 62])
        num //= 62
    
    return ''.join(reversed(result))

def generate_short_code():
    # Use auto-increment ID, encode to base62
    # 62^7 = 3.5 trillion unique codes
    db_id = db.insert_and_get_id()
    return base62_encode(db_id)
```

**Option 2: Random + Collision Check**
```python
import secrets

def generate_short_code(length=7):
    while True:
        code = ''.join(secrets.choice(string.ascii_letters + string.digits) 
                      for _ in range(length))
        if not db.exists(code):
            return code
```

**Option 3: MD5 Hash (first 7 characters)**
```python
import hashlib

def generate_short_code(url):
    hash_val = hashlib.md5(url.encode()).hexdigest()[:7]
    # Handle collisions with counter
    counter = 0
    while db.exists(hash_val):
        counter += 1
        hash_val = hashlib.md5(f"{url}{counter}".encode()).hexdigest()[:7]
    return hash_val
```

### Implementation (Go)

```go
package main

import (
	"database/sql"
	"encoding/json"
	"net/http"
	"time"
	
	"github.com/go-redis/redis/v8"
	"github.com/gorilla/mux"
	_ "github.com/lib/pq"
)

type URLService struct {
	db    *sql.DB
	cache *redis.Client
}

type ShortenRequest struct {
	URL string `json:"url"`
}

type ShortenResponse struct {
	ShortCode string `json:"short_code"`
	ShortURL  string `json:"short_url"`
}

func (s *URLService) ShortenURL(w http.ResponseWriter, r *http.Request) {
	var req ShortenRequest
	json.NewDecoder(r.Body).Decode(&req)
	
	// Generate short code
	shortCode := generateShortCode()
	
	// Store in database
	_, err := s.db.Exec(`
		INSERT INTO urls (short_code, original_url)
		VALUES ($1, $2)
	`, shortCode, req.URL)
	
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}
	
	// Cache
	s.cache.Set(ctx, shortCode, req.URL, 24*time.Hour)
	
	resp := ShortenResponse{
		ShortCode: shortCode,
		ShortURL:  "https://short.ly/" + shortCode,
	}
	
	json.NewEncoder(w).Encode(resp)
}

func (s *URLService) RedirectURL(w http.ResponseWriter, r *http.Request) {
	vars := mux.Vars(r)
	shortCode := vars["code"]
	
	// Try cache first
	url, err := s.cache.Get(ctx, shortCode).Result()
	
	if err == redis.Nil {
		// Cache miss, query database
		err := s.db.QueryRow(`
			SELECT original_url FROM urls 
			WHERE short_code = $1
		`, shortCode).Scan(&url)
		
		if err == sql.ErrNoRows {
			http.Error(w, "URL not found", http.StatusNotFound)
			return
		}
		
		// Update cache
		s.cache.Set(ctx, shortCode, url, 24*time.Hour)
	}
	
	// Track analytics (async)
	go s.trackAnalytics(shortCode, r)
	
	// Redirect
	http.Redirect(w, r, url, http.StatusMovedPermanently)
}

func (s *URLService) trackAnalytics(shortCode string, r *http.Request) {
	s.db.Exec(`
		INSERT INTO analytics (short_code, ip_address, user_agent, referer)
		VALUES ($1, $2, $3, $4)
	`, shortCode, r.RemoteAddr, r.UserAgent(), r.Referer())
}

func generateShortCode() string {
	const charset = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789"
	b := make([]byte, 7)
	for i := range b {
		b[i] = charset[rand.Intn(len(charset))]
	}
	return string(b)
}
```

---

## 2. Twitter Feed

### Requirements
**Functional**:
- Post tweet (280 characters)
- Follow users
- View timeline (tweets from followed users)
- Trending topics

**Non-Functional**:
- 300M active users
- 500M tweets/day
- Read-heavy (100:1 read/write)

### Design

**Timeline Generation Strategies**:

**Option 1: Fan-out on Write (Push)**
```
When user posts tweet:
1. Write to own timeline
2. Fan-out to all followers' timelines

Pros: Fast reads (pre-computed)
Cons: Slow writes for users with many followers (celebrities)
```

**Option 2: Fan-out on Read (Pull)**
```
When user views timeline:
1. Fetch tweets from all followed users
2. Merge and sort

Pros: Fast writes
Cons: Slow reads (query all followed users)
```

**Hybrid Approach**:
```
Regular users: Fan-out on write
Celebrities (>1M followers): Fan-out on read

Example:
User A follows: [B, C, Elon Musk]
Timeline = Pre-computed(B, C) + Real-time query(Elon)
```

**Database Schema**:
```sql
CREATE TABLE users (
    id BIGSERIAL PRIMARY KEY,
    username VARCHAR(50) UNIQUE,
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE tweets (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT REFERENCES users(id),
    content TEXT,
    created_at TIMESTAMP DEFAULT NOW(),
    INDEX (user_id, created_at)
);

CREATE TABLE follows (
    follower_id BIGINT REFERENCES users(id),
    followee_id BIGINT REFERENCES users(id),
    created_at TIMESTAMP DEFAULT NOW(),
    PRIMARY KEY (follower_id, followee_id),
    INDEX (followee_id)  -- For fan-out
);

CREATE TABLE timelines (
    user_id BIGINT,
    tweet_id BIGINT,
    created_at TIMESTAMP,
    PRIMARY KEY (user_id, created_at, tweet_id)
);
```

### Implementation (Python)

```python
from typing import List
import redis
from datetime import datetime

class TwitterService:
    def __init__(self, db, cache: redis.Redis):
        self.db = db
        self.cache = cache
    
    def post_tweet(self, user_id: int, content: str):
        # Insert tweet
        tweet_id = self.db.execute("""
            INSERT INTO tweets (user_id, content)
            VALUES (?, ?)
            RETURNING id
        """, user_id, content).fetchone()[0]
        
        # Fan-out to followers
        followers = self.db.execute("""
            SELECT follower_id FROM follows
            WHERE followee_id = ?
        """, user_id).fetchall()
        
        # Check if celebrity (>1M followers)
        if len(followers) < 1_000_000:
            # Fan-out on write
            for follower in followers:
                self.db.execute("""
                    INSERT INTO timelines (user_id, tweet_id, created_at)
                    VALUES (?, ?, NOW())
                """, follower['follower_id'], tweet_id)
        
        return tweet_id
    
    def get_timeline(self, user_id: int, limit: int = 20) -> List[dict]:
        # Try cache first
        cache_key = f"timeline:{user_id}"
        cached = self.cache.get(cache_key)
        
        if cached:
            return json.loads(cached)
        
        # Get pre-computed timeline
        timeline = self.db.execute("""
            SELECT t.id, t.user_id, t.content, t.created_at, u.username
            FROM timelines tl
            JOIN tweets t ON tl.tweet_id = t.id
            JOIN users u ON t.user_id = u.id
            WHERE tl.user_id = ?
            ORDER BY tl.created_at DESC
            LIMIT ?
        """, user_id, limit).fetchall()
        
        # Get celebrity tweets (real-time)
        celebrity_follows = self.db.execute("""
            SELECT followee_id FROM follows f
            JOIN users u ON f.followee_id = u.id
            WHERE f.follower_id = ? AND u.follower_count > 1000000
        """, user_id).fetchall()
        
        if celebrity_follows:
            celeb_tweets = self.db.execute("""
                SELECT id, user_id, content, created_at, username
                FROM tweets
                WHERE user_id IN (?)
                AND created_at > NOW() - INTERVAL '24 hours'
                ORDER BY created_at DESC
                LIMIT 10
            """, [c['followee_id'] for c in celebrity_follows]).fetchall()
            
            # Merge and sort
            timeline = sorted(timeline + celeb_tweets, 
                            key=lambda x: x['created_at'], 
                            reverse=True)[:limit]
        
        # Cache for 1 minute
        self.cache.setex(cache_key, 60, json.dumps(timeline))
        
        return timeline
```

---

## 3. WhatsApp Messaging

### Requirements
**Functional**:
- Send/receive messages
- Group chat
- Online status
- Message delivery/read receipts
- Media sharing

**Non-Functional**:
- 2B users
- 100B messages/day
- Real-time (<100ms latency)
- High availability

### Design

**Architecture**:
```
┌─────────┐
│ Client  │
└────┬────┘
     │ WebSocket
     ▼
┌──────────────┐
│ Chat Server  │ ← Maintains persistent connections
└──────┬───────┘
       │
       ▼
┌──────────────┐
│ Message Queue│ (Kafka)
└──────┬───────┘
       │
       ├─────────────┬─────────────┐
       ▼             ▼             ▼
┌───────────┐  ┌───────────┐  ┌──────────┐
│ Database  │  │ Storage   │  │ Push     │
│(Cassandra)│  │   (S3)    │  │Notification│
└───────────┘  └───────────┘  └──────────┘
```

**Database Schema (Cassandra)**:
```sql
-- Messages table (partition by chat_id)
CREATE TABLE messages (
    chat_id UUID,
    message_id TIMEUUID,
    sender_id BIGINT,
    content TEXT,
    media_url TEXT,
    created_at TIMESTAMP,
    PRIMARY KEY (chat_id, message_id)
) WITH CLUSTERING ORDER BY (message_id DESC);

-- User connections (which server they're connected to)
CREATE TABLE user_connections (
    user_id BIGINT PRIMARY KEY,
    server_id VARCHAR(50),
    last_seen TIMESTAMP
);
```

### Implementation (Go with WebSocket)

```go
package main

import (
	"encoding/json"
	"log"
	"net/http"
	
	"github.com/gorilla/websocket"
)

var upgrader = websocket.Upgrader{
	CheckOrigin: func(r *http.Request) bool {
		return true
	},
}

type Message struct {
	From    string `json:"from"`
	To      string `json:"to"`
	Content string `json:"content"`
	Type    string `json:"type"`  // "text", "image", "video"
}

type ChatServer struct {
	clients   map[string]*websocket.Conn  // userID -> connection
	broadcast chan Message
	register  chan *Client
	unregister chan *Client
}

type Client struct {
	userID string
	conn   *websocket.Conn
}

func NewChatServer() *ChatServer {
	return &ChatServer{
		clients:   make(map[string]*websocket.Conn),
		broadcast: make(chan Message),
		register:  make(chan *Client),
		unregister: make(chan *Client),
	}
}

func (cs *ChatServer) Run() {
	for {
		select {
		case client := <-cs.register:
			cs.clients[client.userID] = client.conn
			log.Printf("User %s connected", client.userID)
		
		case client := <-cs.unregister:
			if _, ok := cs.clients[client.userID]; ok {
				delete(cs.clients, client.userID)
				client.conn.Close()
				log.Printf("User %s disconnected", client.userID)
			}
		
		case msg := <-cs.broadcast:
			// Send to recipient
			if conn, ok := cs.clients[msg.To]; ok {
				err := conn.WriteJSON(msg)
				if err != nil {
					log.Printf("Error sending message: %v", err)
					conn.Close()
					delete(cs.clients, msg.To)
				}
			} else {
				// User offline, send push notification
				sendPushNotification(msg.To, msg)
			}
			
			// Store in database
			storeMessage(msg)
		}
	}
}

func (cs *ChatServer) HandleWebSocket(w http.ResponseWriter, r *http.Request) {
	conn, err := upgrader.Upgrade(w, r, nil)
	if err != nil {
		log.Println(err)
		return
	}
	
	// Get user ID from query or auth token
	userID := r.URL.Query().Get("user_id")
	
	client := &Client{
		userID: userID,
		conn:   conn,
	}
	
	cs.register <- client
	
	// Read messages from client
	go func() {
		defer func() {
			cs.unregister <- client
		}()
		
		for {
			var msg Message
			err := conn.ReadJSON(&msg)
			if err != nil {
				log.Printf("Error reading message: %v", err)
				break
			}
			
			msg.From = userID
			cs.broadcast <- msg
		}
	}()
}

func storeMessage(msg Message) {
	// Store in Cassandra
	db.Exec(`
		INSERT INTO messages (chat_id, message_id, sender_id, content, created_at)
		VALUES (?, uuid(), ?, ?, NOW())
	`, getChatID(msg.From, msg.To), msg.From, msg.Content)
}

func sendPushNotification(userID string, msg Message) {
	// Send via FCM/APNS
	log.Printf("Sending push notification to %s", userID)
}

func main() {
	server := NewChatServer()
	go server.Run()
	
	http.HandleFunc("/ws", server.HandleWebSocket)
	http.ListenAndServe(":8080", nil)
}
```

---

Due to length constraints, I'll continue with the remaining system design problems (YouTube, Uber, Instagram, Web Crawler, Search Engine, Notification System, Rate Limiter) in the next batch of files. This file provides comprehensive solutions for URL Shortener, Twitter, and WhatsApp with complete implementations.
