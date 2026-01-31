# System Design Fundamentals: Complete Backend Engineer's Guide

## Table of Contents
1. [Introduction to System Design](#introduction-to-system-design)
2. [Design Process & Methodology](#design-process--methodology)
3. [Scalability Principles](#scalability-principles)
4. [CAP Theorem](#cap-theorem)
5. [Load Balancing](#load-balancing)
6. [Caching Strategies](#caching-strategies)
7. [Database Scaling](#database-scaling)
8. [Microservices vs Monolith](#microservices-vs-monolith)
9. [Message Queues](#message-queues)
10. [API Design](#api-design)
11. [Capacity Estimation](#capacity-estimation)
12. [Practice Problems](#practice-problems)

---

## Introduction to System Design

### What is System Design?

System design is the process of defining the architecture, components, modules, interfaces, and data for a system to satisfy specified requirements.

**For Backend Engineers**: Designing scalable, reliable, maintainable distributed systems.

### Why System Design Matters

**History of Scaling Challenges**:

**2000s: Early Web Scale**
- **Problem**: Slashdot effect - viral traffic crashed servers
- **Solution**: Content Delivery Networks (CDNs), caching
- **Example**: Digg, Reddit handling traffic spikes

**2006: Facebook's Scale**
- **Problem**: 8 million users, MySQL couldn't scale
- **Solution**: Memcached for caching layer
- **Result**: Handled 100M+ users

**2007: Twitter's Fail Whale**
- **Problem**: Ruby on Rails monolith couldn't scale
- **Solution**: Rewrote in Scala, introduced message queues
- **Lesson**: Technology choices affect scalability

**2010s: Cloud Era**
- **Netflix**: Moved to AWS, pioneered microservices
- **Uber**: Built distributed real-time systems
- **Airbnb**: Multi-region deployments

---

## Design Process & Methodology

### The Standard Interview Process

**1. Requirements Clarification (5 min)**

Ask these questions:
- **Functional requirements**: What features?
- **Non-functional requirements**: Scale, performance, reliability?
- **Constraints**: Budget, timeline, technology?

**Example**:
```
Interviewer: "Design Twitter"

You ask:
- Can users post tweets? (yes)
- Can users follow others? (yes)
- Do we need DMs? (no, not in scope)
- How many users? (100M active users)
- How many tweets/day? (50M tweets/day)
- Read vs write ratio? (100:1 read-heavy)
```

**2. Back-of-the-Envelope Estimation (5 min)**

Calculate:
- **QPS** (Queries Per Second)
- **Storage** requirements
- **Bandwidth** needs

**Example**:
```
Twitter Estimation:
- 100M daily active users (DAU)
- 50M tweets/day
- Average tweet: 140 chars = 200 bytes
- Each user reads 200 tweets/day

Write QPS:
50M tweets / 86400 seconds ≈ 580 tweets/sec
Peak: 580 * 3 = 1740 tweets/sec

Read QPS:
100M users * 200 tweets / 86400 ≈ 231,000 reads/sec

Storage (1 year):
50M tweets/day * 365 days * 200 bytes = 3.65 TB/year
```

**3. High-Level Design (10-15 min)**

Draw boxes and arrows:
```
┌──────────┐         ┌────────────┐         ┌──────────┐
│  Client  │────────▶│  Load      │────────▶│  Web     │
│ (Mobile/ │         │  Balancer  │         │  Servers │
│  Web)    │         └────────────┘         └────┬─────┘
└──────────┘                                      │
                                                  ▼
                     ┌────────────────────────────┴─────┐
                     │                                  │
                ┌────▼──────┐                    ┌──────▼───┐
                │  Cache    │                    │ Database │
                │  (Redis)  │                    │ (MySQL)  │
                └───────────┘                    └──────────┘
```

**4. Deep Dive (15-20 min)**

Focus on 2-3 components:
- Database schema
- API endpoints
- Specific algorithms

**5. Bottlenecks & Scaling (5-10 min)**

Identify and address:
- Single points of failure
- Performance bottlenecks
- How to scale each component

---

## Scalability Principles

### Vertical vs Horizontal Scaling

**Vertical Scaling (Scale Up)**:
- Add more CPU, RAM, disk to single machine
- ✅ Simple (no code changes)
- ❌ Hardware limits (can't scale infinitely)
- ❌ Single point of failure
- ❌ Expensive (non-linear cost)

**Horizontal Scaling (Scale Out)**:
- Add more machines
- ✅ No theoretical limit
- ✅ Better fault tolerance
- ✅ Cost-effective
- ❌ Complex (need load balancing, data partitioning)
- ❌ Requires code changes

**Example**:
```
Vertical:
┌────────────────┐
│  Server        │
│  32 CPU        │  →  ┌────────────────┐
│  256 GB RAM    │      │  Server        │
│  10 TB SSD     │      │  64 CPU        │
└────────────────┘      │  512 GB RAM    │
                        │  20 TB SSD     │
                        └────────────────┘

Horizontal:
┌──────┐           ┌──────┐ ┌──────┐ ┌──────┐ ┌──────┐
│Server│           │Server│ │Server│ │Server│ │Server│
│8 CPU │     →     │8 CPU │ │8 CPU │ │8 CPU │ │8 CPU │
│32 GB │           │32 GB │ │32 GB │ │32 GB │ │32 GB │
└──────┘           └──────┘ └──────┘ └──────┘ └──────┘
```

### Stateless vs Stateful Services

**Stateless**:
- No session data stored on server
- Any server can handle any request
- ✅ Easy to scale horizontally
- ✅ Simple load balancing

**Stateful**:
- Session data stored on server
- Must route user to same server
- ❌ Sticky sessions needed
- ❌ Harder to scale

**Solution**: Store session in external storage (Redis, database)

```
Stateful (Bad):
User1 → Server1 (has User1's session)
User1 → Server2 (no session data!) ❌

Stateless (Good):
User1 → Server1 → Redis (get session)
User1 → Server2 → Redis (get session) ✅
```

---

## CAP Theorem

### The Theorem (2000, Eric Brewer)

**You can only have TWO of three**:

**C**onsistency: All nodes see same data at same time
**A**vailability: Every request gets response (success/failure)
**P**artition Tolerance: System works despite network failures

```
       Consistency
            △
           /│\
          / │ \
       CP /  │  \ CA
         /   │   \
        /    │    \
       /_____|_____\
      /      │      \
     /       │       \
    /        │        \
AP /_________|_________\ 
Partition      Availability
Tolerance
```

### Real-World Examples

**CP Systems** (Consistency + Partition Tolerance):
- **Example**: Traditional RDBMS, HBase, MongoDB (with strong consistency)
- **Trade-off**: May be unavailable during partition
- **Use case**: Banking, financial systems

**AP Systems** (Availability + Partition Tolerance):
- **Example**: Cassandra, DynamoDB, Couchbase
- **Trade-off**: May return stale data
- **Use case**: Shopping carts, user sessions

**CA Systems** (Consistency + Availability):
- **Example**: Single-node databases
- **Problem**: Can't tolerate partitions (not distributed)
- **Reality**: Not practical for distributed systems

### Eventual Consistency

**Definition**: Given enough time, all replicas converge to same value.

**Example: Social Media Likes**
```
Time 0: Post has 100 likes
User A likes (writes to Replica 1): 101 likes
User B reads (from Replica 2): 100 likes (stale!)
Time + 10ms: Replica 2 syncs: 101 likes
User B reads again: 101 likes (consistent!)
```

---

## Load Balancing

### What is Load Balancing?

Distributes incoming traffic across multiple servers.

**Why Needed**:
- Single server can't handle all traffic
- Prevents overloading
- Enables horizontal scaling
- Provides redundancy

### Load Balancing Algorithms

**1. Round Robin**
```
Request 1 → Server A
Request 2 → Server B
Request 3 → Server C
Request 4 → Server A
...
```
- ✅ Simple, fair distribution
- ❌ Doesn't account for server load

**2. Least Connections**
```
Server A: 10 connections
Server B: 5 connections  ← Route here
Server C: 8 connections

Next request → Server B
```
- ✅ Balances actual load
- ❌ More complex tracking

**3. IP Hash**
```
hash(client_ip) % num_servers = server_index

Client 192.168.1.1 → hash % 3 = 1 → Server B
Always routes to same server
```
- ✅ Session affinity without sticky sessions
- ❌ Uneven distribution if few clients

**4. Weighted Round Robin**
```
Server A (weight: 3) gets 3 requests
Server B (weight: 2) gets 2 requests
Server C (weight: 1) gets 1 request

Per 6 requests: A, A, A, B, B, C
```
- ✅ Accounts for varying server capacity
- ❌ Need to configure weights

### Layer 4 vs Layer 7 Load Balancing

**L4 (Transport Layer)**:
- Routes based on IP/Port
- Fast (no content inspection)
- Protocol agnostic
- Example: AWS NLB, HAProxy (TCP mode)

**L7 (Application Layer)**:
- Routes based on HTTP headers, URLs, cookies
- Slower (inspects content)
- More intelligent routing
- Example: AWS ALB, Nginx, HAProxy (HTTP mode)

```
L4:
User → LB → Backend
      ↓
   (IP:Port only)

L7:
User → LB → /api/* → API Servers
      ↓
      └──→ /static/* → Static Servers
         ↓
      (Parse HTTP)
```

---

## Caching Strategies

### Cache Levels

```
Browser Cache (100ms)
     ↓
CDN Cache (100ms)
     ↓
Application Cache (10ms) - Redis/Memcached
     ↓
Database Cache (1ms) - Query cache, buffer pool
     ↓
Disk (10ms)
```

### Caching Patterns

**1. Cache-Aside (Lazy Loading)**
```python
def get_user(user_id):
    # Check cache first
    user = cache.get(f"user:{user_id}")
    if user:
        return user  # Cache hit
    
    # Cache miss: query database
    user = db.query(f"SELECT * FROM users WHERE id = {user_id}")
    
    # Store in cache
    cache.set(f"user:{user_id}", user, ttl=3600)
    return user
```
- ✅ Only cache requested data
- ❌ Cache miss penalty (3 calls: cache check, DB query, cache set)

**2. Write-Through**
```python
def update_user(user_id, data):
    # Update database
    db.update(f"UPDATE users SET ... WHERE id = {user_id}")
    
    # Update cache synchronously
    cache.set(f"user:{user_id}", data, ttl=3600)
```
- ✅ Cache always consistent
- ❌ Higher write latency

**3. Write-Behind (Write-Back)**
```python
def update_user(user_id, data):
    # Update cache immediately
    cache.set(f"user:{user_id}", data)
    
    # Queue database update asynchronously
    queue.push({"type": "db_update", "user_id": user_id, "data": data})
```
- ✅ Fast writes
- ❌ Risk of data loss if cache fails
- Use case: High-write systems (analytics, logging)

**4. Refresh-Ahead**
```python
def get_user(user_id):
    user = cache.get(f"user:{user_id}")
    
    # If TTL < threshold, refresh in background
    if cache.ttl(f"user:{user_id}") < 300:  # 5 min remaining
        background_refresh(user_id)
    
    return user
```
- ✅ Avoids cache miss penalty
- ❌ Complex prediction of hot data

### Cache Eviction Policies

**LRU (Least Recently Used)**:
```
Cache: [A, B, C, D] (max size: 4)
Access: E
Evict: A (least recently used)
Cache: [B, C, D, E]
```

**LFU (Least Frequently Used)**:
```
Access counts: A(5), B(3), C(10), D(1)
Access: E
Evict: D (least frequent)
```

**FIFO (First In, First Out)**:
```
Cache: [A, B, C, D]
Access: E
Evict: A (oldest)
```

**TTL (Time To Live)**:
```
Cache: [A(expires in 10s), B(expires in 60s)]
After 10s: A expires, auto-removed
```

### Cache Stampede Prevention

**Problem**: Many requests for same uncached item hit database simultaneously.

```
1000 requests for user:123
Cache miss → All 1000 queries hit database!
Database overload
```

**Solution 1: Locking**
```python
def get_user(user_id):
    key = f"user:{user_id}"
    user = cache.get(key)
    if user:
        return user
    
    # Acquire lock
    lock_key = f"lock:{key}"
    if cache.set_nx(lock_key, "1", ex=10):  # Set if not exists
        try:
            user = db.query(...)
            cache.set(key, user)
            return user
        finally:
            cache.delete(lock_key)
    else:
        # Another request is fetching; wait and retry
        time.sleep(0.1)
        return get_user(user_id)
```

**Solution 2: Early Expiration**
```python
# Store (data, timestamp)
cache.set(key, (user, time.time()), ttl=3600)

def get_user(user_id):
    cached = cache.get(key)
    if cached:
        user, timestamp = cached
        # Refresh if within 5 min of expiration
        if time.time() - timestamp > 3300:  # 55 min
            background_refresh(user_id)
        return user
    ...
```

---

## Database Scaling

### Read Scaling: Replication

**Master-Slave (Primary-Replica)**:
```
         ┌─────────┐
Writes → │ Master  │
         └────┬────┘
              │
       Replication
       ┌──────┼──────┐
       │      │      │
   ┌───▼──┐ ┌▼────┐ ┌▼────┐
   │Slave1│ │Slave2│ │Slave3│ ← Reads
   └──────┘ └─────┘ └─────┘
```

- ✅ Scales reads
- ❌ Single master bottleneck for writes
- ❌ Replication lag (async)

**Master-Master (Multi-Primary)**:
```
   ┌──────────┐  Sync  ┌──────────┐
   │ Master 1 │◄──────►│ Master 2 │
   └──────────┘        └──────────┘
       │                    │
   Writes/Reads        Writes/Reads
```

- ✅ Scales writes
- ❌ Complex conflict resolution
- ❌ Risk of inconsistency

### Write Scaling: Sharding

**Horizontal Partitioning (Sharding)**:

Split data across multiple databases.

**Sharding Key Selection**:
```
users table (10M rows)
Shard by user_id % 4

Shard 0: user_id 0, 4, 8, 12, ...
Shard 1: user_id 1, 5, 9, 13, ...
Shard 2: user_id 2, 6, 10, 14, ...
Shard 3: user_id 3, 7, 11, 15, ...
```

**Sharding Strategies**:

**1. Range-Based**
```
Shard 1: user_id 1-1000000
Shard 2: user_id 1000001-2000000
Shard 3: user_id 2000001-3000000
```
- ✅ Simple range queries
- ❌ Uneven distribution (hot shards)

**2. Hash-Based**
```
shard = hash(user_id) % num_shards
```
- ✅ Even distribution
- ❌ Hard to do range queries
- ❌ Resharding is expensive

**3. Directory-Based**
```
Lookup table:
user_id: 123 → Shard 2
user_id: 456 → Shard 1
```
- ✅ Flexible
- ❌ Lookup overhead
- ❌ Lookup table is bottleneck

**Consistent Hashing** (for resharding):
```
Hash ring: 0 to 2^32

Servers: S1(100), S2(200), S3(300)
Key K: hash(K) = 250 → goes to S3 (next clockwise)

Add S4(150):
Only keys between S1 and S4 move!
```

---

## Capacity Estimation

### QPS Calculation

```
Daily Active Users (DAU): 100M
Average actions per user per day: 10
Total actions per day: 1B

Actions per second: 1B / 86400 = ~11,500
Peak (assume 2x average): 23,000 QPS
```

### Storage Calculation

```
100M users
Average user data: 1 KB
Total: 100 GB

With 3x replication: 300 GB
With 10 years retention: 3 TB
```

### Bandwidth Calculation

```
Average request size: 10 KB
Average response size: 50 KB
QPS: 10,000

Incoming: 10,000 * 10 KB = 100 MB/s
Outgoing: 10,000 * 50 KB = 500 MB/s
Total bandwidth: 600 MB/s = 4.8 Gbps
```

### Example: URL Shortener

**Requirements**:
- 100M URLs created per month
- 10:1 read/write ratio
- URL lifetime: 10 years
- Average URL length: 100 chars

**Calculations**:

**Write QPS**:
```
100M / 30 days / 86400 seconds = ~38 writes/sec
Peak: 38 * 2 = 76 writes/sec
```

**Read QPS**:
```
38 * 10 = 380 reads/sec
Peak: 760 reads/sec
```

**Storage**:
```
100M URLs/month * 12 months * 10 years = 12B URLs
Per URL: 100 bytes + overhead (200 bytes)
Total: 12B * 200 bytes = 2.4 TB
```

**Short Code Length**:
```
Base62 (a-z, A-Z, 0-9): 62 characters
Length 6: 62^6 = 56B possible URLs ✓
Length 7: 62^7 = 3.5T possible URLs ✓✓
```

---

## Practice Problems

### Design Pattern Template

For each system, answer:

1. **Requirements**:
   - Functional: What features?
   - Non-functional: Scale, latency, availability?

2. **Estimations**:
   - Users, QPS, storage, bandwidth

3. **API Design**:
   - REST endpoints
   - Request/response formats

4. **Database Schema**:
   - Tables, relationships
   - Indexes

5. **High-Level Design**:
   - Components diagram
   - Data flow

6. **Deep Dive**:
   - Algorithm details
   - Specific components

7. **Bottlenecks & Scaling**:
   - Single points of failure
   - How to scale

### Quick Design: Rate Limiter

**Requirements**:
- Limit users to N requests per minute
- Distributed system
- Low latency

**Algorithm**: Token Bucket

```python
class RateLimiter:
    def __init__(self, redis_client):
        self.redis = redis_client
        self.max_requests = 100
        self.window = 60  # seconds
    
    def allow_request(self, user_id):
        key = f"rate_limit:{user_id}"
        current = int(time.time())
        window_start = current - self.window
        
        # Remove old entries
        self.redis.zremrangebyscore(key, 0, window_start)
        
        # Count requests in window
        count = self.redis.zcard(key)
        
        if count < self.max_requests:
            # Add current request
            self.redis.zadd(key, {current: current})
            self.redis.expire(key, self.window)
            return True
        
        return False
```

---

This covers system design fundamentals comprehensively. The file includes theory, practical examples, and real-world applications. Let me continue creating the remaining files to complete the full content set.
