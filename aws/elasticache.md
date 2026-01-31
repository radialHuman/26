# Amazon ElastiCache: Complete Guide

## Table of Contents
1. [Caching Fundamentals](#caching-fundamentals)
2. [ElastiCache History](#elasticache-history)
3. [Redis vs Memcached](#redis-vs-memcached)
4. [Redis Data Structures](#redis-data-structures)
5. [Caching Strategies](#caching-strategies)
6. [Cache Eviction Policies](#cache-eviction-policies)
7. [Redis Cluster & Replication](#redis-cluster--replication)
8. [Pub/Sub Messaging](#pubsub-messaging)
9. [Redis Docker Practice](#redis-docker-practice)
10. [Interview Questions](#interview-questions)

---

## Caching Fundamentals

### Why Caching?

**Problem: Slow Database Queries**
```
Database query: 100 ms
Requests/sec: 1000
Database load: 1000 × 100ms = 100 seconds of CPU per second (impossible!)

Solution: Cache frequently accessed data
Cache hit: 1 ms
Hit ratio: 90%

New load:
- 900 requests from cache: 900 × 1ms = 0.9 sec
- 100 requests from DB: 100 × 100ms = 10 sec
- Total: 10.9 sec (vs 100 sec) → 9x improvement
```

### Cache Hit Ratio

**Formula**:
```
Hit Ratio = Cache Hits / Total Requests

Example:
1000 requests
900 cache hits
100 cache misses

Hit Ratio = 900 / 1000 = 90%
```

**Impact on Performance**:
```
Cache: 1 ms
Database: 100 ms

90% hit ratio:
Avg latency = 0.9 × 1ms + 0.1 × 100ms = 10.9 ms

95% hit ratio:
Avg latency = 0.95 × 1ms + 0.05 × 100ms = 5.95 ms

99% hit ratio:
Avg latency = 0.99 × 1ms + 0.01 × 100ms = 1.99 ms
```

### Memory Hierarchy

```
CPU Cache: <1 ns (L1/L2/L3)
RAM: ~100 ns
Redis/Memcached: ~1 ms (network latency)
SSD: ~10 ms
HDD: ~100 ms
Network storage: ~100 ms

Rule: Serve data from fastest possible tier
```

---

## ElastiCache History

### Before ElastiCache (Pre-2011)

**Self-Managed Caching**:
```
Tasks:
❌ Provision EC2 instances
❌ Install Redis/Memcached
❌ Configure replication
❌ Monitor memory usage
❌ Handle node failures
❌ Cluster management

Time: 1-2 weeks to set up HA cache cluster
```

### ElastiCache Launch (August 2011)

**Managed Caching Service**:
```
Initial Support: Memcached

Features:
✅ Automated deployment
✅ Auto-discovery
✅ Automated failover
✅ Monitoring (CloudWatch)
✅ Automatic patching

Cost: $0.035/hour for cache.m1.small
```

### Evolution Timeline

```
2011: ElastiCache Launch (Memcached)
2013: Redis support
2016: Redis cluster mode (sharding)
2017: Redis encryption (at-rest, in-transit)
2018: Redis 5.0 (Streams)
2019: Global Datastore (cross-region replication)
2020: Redis 6.0 (ACLs, TLS)
2021: Redis 6.2 (better memory efficiency)
2022: Serverless caching (pay-per-use)
2023: Redis 7.0 (Redis Functions)
```

### Why ElastiCache Was Created

**Problem 1: Cache Cluster Complexity**
```
Before: Manual cluster setup (3 days)
- Install Redis on 3 nodes
- Configure replication
- Set up Sentinel for failover
- Test failover process

After: One API call (5 minutes)
aws elasticache create-replication-group \
  --replication-group-id my-cache \
  --num-cache-clusters 3 \
  --cache-node-type cache.m5.large
```

**Problem 2: Scaling**
```
Before:
- Add new cache node
- Redistribute data (manual resharding)
- Update application config
- Downtime: Hours

After:
- Add node via console
- Automatic resharding
- Zero downtime
```

---

## Redis vs Memcached

### Comparison Table

| Feature | Redis | Memcached |
|---------|-------|-----------|
| Data Structures | Strings, Lists, Sets, Hashes, Sorted Sets, Streams | Strings only |
| Persistence | Optional (RDB, AOF) | No |
| Replication | Yes (master-slave) | No |
| Pub/Sub | Yes | No |
| Transactions | Yes (MULTI/EXEC) | No |
| Lua Scripting | Yes | No |
| Max Key Size | 512 MB | 1 MB |
| Max Value Size | 512 MB | 1 MB |
| Multi-threading | Single-threaded | Multi-threaded |
| Use Case | Complex caching, sessions, leaderboards | Simple key-value cache |

### When to Use Redis

```
✅ Complex data structures (lists, sets, sorted sets)
✅ Pub/Sub messaging
✅ Session storage (persistence required)
✅ Leaderboards (sorted sets)
✅ Real-time analytics
✅ Rate limiting
✅ Job queues

Examples:
- Gaming leaderboard (sorted sets)
- Social media feeds (lists)
- Real-time chat (pub/sub)
- Shopping cart (hashes)
```

### When to Use Memcached

```
✅ Simple key-value caching
✅ Horizontal scaling (sharding)
✅ Multi-threaded performance
✅ No persistence required

Examples:
- Page caching (HTML fragments)
- Object caching (serialized objects)
- Session caching (stateless apps)
```

### Performance

**Single-Threaded (Redis)**:
```
Operations/sec: ~100K (single core)
Latency: <1 ms

Benefit: Atomic operations, no locks
Limitation: One CPU core
```

**Multi-Threaded (Memcached)**:
```
Operations/sec: ~500K (multi-core)
Latency: <1 ms

Benefit: Uses all CPU cores
Limitation: No complex operations
```

---

## Redis Data Structures

### Strings

**Basic key-value**:
```bash
# Set/Get
SET user:1000:name "Alice"
GET user:1000:name
# "Alice"

# Increment
SET page_views 0
INCR page_views
# 1
INCRBY page_views 10
# 11

# Expire (TTL)
SETEX session:abc123 3600 "user_data"
TTL session:abc123
# 3599
```

**Use Cases**:
```
- Page views counter
- API rate limiting
- Session storage
- Cache HTML fragments
```

### Lists

**Ordered collection**:
```bash
# Push to head/tail
LPUSH notifications "New message"
RPUSH notifications "Friend request"

# Pop from head/tail
LPOP notifications
# "New message"

# Range
LRANGE notifications 0 9
# [first 10 items]

# Length
LLEN notifications
# 1
```

**Use Cases**:
```
- Activity feeds (social media)
- Job queues (background tasks)
- Recent items (browsing history)
- Leaky bucket rate limiting
```

### Hashes

**Object storage**:
```bash
# Set fields
HSET user:1000 name "Alice" age 30 city "NYC"

# Get field
HGET user:1000 name
# "Alice"

# Get all
HGETALL user:1000
# {"name": "Alice", "age": "30", "city": "NYC"}

# Increment field
HINCRBY user:1000 age 1
# 31
```

**Use Cases**:
```
- User profiles
- Shopping carts
- Product details
- Session data (better than serialized JSON)
```

### Sets

**Unique unordered collection**:
```bash
# Add members
SADD tags:post:100 "redis" "cache" "aws"

# Check membership
SISMEMBER tags:post:100 "redis"
# 1 (true)

# Set operations
SADD tags:post:101 "redis" "database" "nosql"
SINTER tags:post:100 tags:post:101
# ["redis"]

SUNION tags:post:100 tags:post:101
# ["redis", "cache", "aws", "database", "nosql"]

# Random member
SRANDMEMBER tags:post:100
# "cache"
```

**Use Cases**:
```
- Unique visitors (IP addresses)
- Tags/categories
- Followers/following
- Lottery (SRANDMEMBER)
```

### Sorted Sets

**Ordered by score**:
```bash
# Add with scores
ZADD leaderboard 1000 "Alice" 950 "Bob" 1050 "Charlie"

# Get rank
ZRANK leaderboard "Alice"
# 1 (0-indexed, Charlie=2, Alice=1, Bob=0)

# Top N
ZREVRANGE leaderboard 0 2 WITHSCORES
# ["Charlie", "1050", "Alice", "1000", "Bob", "950"]

# Increment score
ZINCRBY leaderboard 100 "Alice"
# 1100
```

**Use Cases**:
```
- Leaderboards (gaming)
- Priority queues
- Time-series data (score = timestamp)
- Rate limiting (sliding window)
- Trending topics (score = engagement)
```

### Streams

**Append-only log**:
```bash
# Add entry
XADD events * user "Alice" action "login" timestamp 1699123456
# "1699123456000-0"

# Read
XRANGE events - +
# All entries

# Consumer group
XGROUP CREATE events mygroup 0
XREADGROUP GROUP mygroup consumer1 COUNT 10 STREAMS events >
```

**Use Cases**:
```
- Event sourcing
- Activity logs
- Real-time analytics
- Message queues with consumer groups
```

---

## Caching Strategies

### Cache-Aside (Lazy Loading)

**Application manages cache**:
```python
def get_user(user_id):
    # Try cache first
    cached = redis.get(f"user:{user_id}")
    if cached:
        return json.loads(cached)
    
    # Cache miss: fetch from DB
    user = db.query("SELECT * FROM users WHERE id = ?", user_id)
    
    # Store in cache
    redis.setex(f"user:{user_id}", 3600, json.dumps(user))
    
    return user
```

**Pros**:
```
✅ Only cache what's needed (no wasted memory)
✅ Node failures don't affect DB
✅ Cache warming happens organically
```

**Cons**:
```
❌ Cache miss penalty (3 requests: check cache, query DB, update cache)
❌ Stale data (if DB updated externally)
```

### Write-Through

**Update cache when writing to DB**:
```python
def update_user(user_id, data):
    # Update database
    db.execute("UPDATE users SET name = ? WHERE id = ?", data['name'], user_id)
    
    # Update cache
    redis.setex(f"user:{user_id}", 3600, json.dumps(data))
```

**Pros**:
```
✅ Cache always consistent
✅ No cache miss penalty (for writes)
```

**Cons**:
```
❌ Every write hits cache (even if data never read)
❌ Write latency increased
```

### Write-Behind (Write-Back)

**Write to cache, async write to DB**:
```python
def update_user(user_id, data):
    # Update cache
    redis.setex(f"user:{user_id}", 3600, json.dumps(data))
    
    # Queue DB update
    queue.enqueue("db_update", user_id, data)

# Background worker
def db_update_worker():
    while True:
        job = queue.dequeue()
        db.execute("UPDATE users SET name = ? WHERE id = ?", job.data['name'], job.user_id)
```

**Pros**:
```
✅ Fast writes
✅ Reduced DB load (batch updates)
```

**Cons**:
```
❌ Data loss if cache fails before DB write
❌ Complex implementation
```

### Cache Invalidation

**Strategies**:
```
1. TTL (Time-To-Live):
   SETEX user:1000 3600 "..."  # Expire after 1 hour

2. Event-Based:
   On user update → DEL user:1000

3. Version-Based:
   Key: user:1000:v1 → user:1000:v2 (new version)

4. Lazy Invalidation:
   Store timestamp in cache, compare with DB timestamp
```

**Cache Invalidation Pattern**:
```python
def update_user(user_id, data):
    # Update DB
    db.execute("UPDATE users SET name = ?, updated_at = NOW() WHERE id = ?", 
               data['name'], user_id)
    
    # Invalidate cache
    redis.delete(f"user:{user_id}")
    
    # OR: Update cache
    # redis.setex(f"user:{user_id}", 3600, json.dumps(data))
```

---

## Cache Eviction Policies

### LRU (Least Recently Used)

**Evict least recently accessed**:
```
Memory limit: 1 GB
New data: 100 MB
Free memory: 50 MB

Action: Evict 50 MB of least recently used data
```

**Configuration**:
```bash
# Redis config
maxmemory 1gb
maxmemory-policy allkeys-lru
```

**Use Case**: General purpose caching.

### LFU (Least Frequently Used)

**Evict least frequently accessed**:
```
Key A: 100 accesses
Key B: 10 accesses
Key C: 1 access

Eviction order: C, B, A
```

**Configuration**:
```bash
maxmemory-policy allkeys-lfu
```

**Use Case**: Long-running cache, distinguish hot/cold data.

### TTL (Time-To-Live)

**Evict expired keys first**:
```bash
# Set with expiration
SETEX session:abc 3600 "user_data"

# Check TTL
TTL session:abc
# 3599

# Remove expiration
PERSIST session:abc
```

**Configuration**:
```bash
maxmemory-policy volatile-ttl
```

**Use Case**: Session data, temporary caching.

### Eviction Policies Comparison

| Policy | Evicts | Use Case |
|--------|--------|----------|
| noeviction | None (error on full) | Never lose data |
| allkeys-lru | Least recently used | General caching |
| allkeys-lfu | Least frequently used | Hot/cold data |
| volatile-lru | LRU with TTL | Session + cache |
| volatile-lfu | LFU with TTL | Session + cache |
| volatile-ttl | Shortest TTL | Session-heavy |
| allkeys-random | Random | Testing |

---

## Redis Cluster & Replication

### Replication (Master-Slave)

**Architecture**:
```
┌─────────┐
│ Master  │ Write
└────┬────┘
     │ Async replication
┌────▼────┐
│ Replica │ Read
└─────────┘
```

**Creating Replica**:
```bash
# On AWS ElastiCache
aws elasticache create-replication-group \
  --replication-group-id my-redis \
  --replication-group-description "Redis cluster" \
  --engine redis \
  --cache-node-type cache.m5.large \
  --num-cache-clusters 2 \
  --automatic-failover-enabled
```

**Failover**:
```
Master fails → Replica promoted to Master (automatic)
Failover time: <1 minute
Data loss: Minimal (async replication lag ~1 sec)
```

### Redis Cluster (Sharding)

**Horizontal scaling**:
```
16,384 hash slots
3 master nodes:
- Node 1: Slots 0-5460
- Node 2: Slots 5461-10922
- Node 3: Slots 10923-16383

Key distribution:
Hash(key) mod 16384 = slot number
```

**Hash Tags**:
```bash
# Same slot
SET {user:1000}:profile "..."
SET {user:1000}:sessions "..."

# Hash on "user:1000" only (ignore rest)
Both keys → Same slot → Same node
```

**Creating Cluster**:
```bash
aws elasticache create-replication-group \
  --replication-group-id my-redis-cluster \
  --engine redis \
  --cache-node-type cache.m5.large \
  --num-node-groups 3 \
  --replicas-per-node-group 1 \
  --cache-parameter-group-name default.redis7.cluster.on
```

### Scaling

**Vertical Scaling**: Change node type.
```bash
aws elasticache modify-replication-group \
  --replication-group-id my-redis \
  --cache-node-type cache.m5.xlarge \
  --apply-immediately
```

**Horizontal Scaling**: Add/remove shards.
```bash
# Add shard
aws elasticache increase-replica-count \
  --replication-group-id my-redis \
  --new-replica-count 2 \
  --apply-immediately
```

---

## Pub/Sub Messaging

### Publishing Messages

```bash
# Publish to channel
PUBLISH news "Breaking news!"
# Returns: Number of subscribers

# Publish to pattern
PUBLISH news:tech "New AI model released"
PUBLISH news:sports "Team wins championship"
```

### Subscribing

```bash
# Subscribe to channel
SUBSCRIBE news

# Subscribe to pattern
PSUBSCRIBE news:*

# Unsubscribe
UNSUBSCRIBE news
```

### Python Example

**Publisher**:
```python
import redis

r = redis.Redis(host='localhost', port=6379)

# Publish message
r.publish('notifications', 'New order received')
```

**Subscriber**:
```python
import redis

r = redis.Redis(host='localhost', port=6379)
pubsub = r.pubsub()

# Subscribe to channel
pubsub.subscribe('notifications')

# Listen for messages
for message in pubsub.listen():
    if message['type'] == 'message':
        print(f"Received: {message['data']}")
```

### Use Cases

```
✅ Real-time notifications
✅ Chat applications
✅ Live updates (stock prices, sports scores)
✅ Event broadcasting
✅ Cache invalidation (notify all servers)

❌ Message persistence (messages lost if no subscribers)
❌ Message ordering guarantees (use Streams instead)
```

---

## Redis Docker Practice

### Docker Compose Setup

**docker-compose.yml**:
```yaml
version: '3.8'

services:
  # Redis master
  redis-master:
    image: redis:7
    ports:
      - "6379:6379"
    command: redis-server --appendonly yes
    volumes:
      - redis-master-data:/data

  # Redis replica
  redis-replica:
    image: redis:7
    ports:
      - "6380:6379"
    command: redis-server --replicaof redis-master 6379
    depends_on:
      - redis-master

  # Redis Sentinel (failover)
  redis-sentinel:
    image: redis:7
    ports:
      - "26379:26379"
    command: >
      sh -c "echo 'sentinel monitor mymaster redis-master 6379 2
      sentinel down-after-milliseconds mymaster 5000
      sentinel parallel-syncs mymaster 1
      sentinel failover-timeout mymaster 10000' > /tmp/sentinel.conf &&
      redis-sentinel /tmp/sentinel.conf"
    depends_on:
      - redis-master
      - redis-replica

volumes:
  redis-master-data:
```

### Caching Example (Python)

```python
import redis
import psycopg2
import json
import time

# Connect to Redis
cache = redis.Redis(host='localhost', port=6379, decode_responses=True)

# Connect to PostgreSQL
db = psycopg2.connect(
    host="localhost",
    database="mydb",
    user="admin",
    password="password"
)

def get_user(user_id):
    """Cache-aside pattern"""
    # Try cache
    cache_key = f"user:{user_id}"
    cached = cache.get(cache_key)
    
    if cached:
        print("Cache HIT")
        return json.loads(cached)
    
    print("Cache MISS")
    
    # Fetch from database
    cur = db.cursor()
    cur.execute("SELECT id, name, email FROM users WHERE id = %s", (user_id,))
    row = cur.fetchone()
    
    if not row:
        return None
    
    user = {"id": row[0], "name": row[1], "email": row[2]}
    
    # Store in cache (1 hour TTL)
    cache.setex(cache_key, 3600, json.dumps(user))
    
    return user

# Test
start = time.time()
user1 = get_user(1)
print(f"First call: {time.time() - start:.3f}s")

start = time.time()
user2 = get_user(1)
print(f"Second call (cached): {time.time() - start:.3f}s")
```

### Leaderboard Example

```python
import redis

cache = redis.Redis(host='localhost', port=6379, decode_responses=True)

def add_score(player, score):
    """Add player score to leaderboard"""
    cache.zadd('leaderboard', {player: score})

def get_top_players(n=10):
    """Get top N players"""
    return cache.zrevrange('leaderboard', 0, n-1, withscores=True)

def get_player_rank(player):
    """Get player rank (0-indexed)"""
    return cache.zrevrank('leaderboard', player)

def get_player_score(player):
    """Get player score"""
    return cache.zscore('leaderboard', player)

# Test
add_score('Alice', 1000)
add_score('Bob', 950)
add_score('Charlie', 1050)
add_score('Diana', 980)

print("Top 3:")
for player, score in get_top_players(3):
    rank = get_player_rank(player)
    print(f"#{rank + 1}: {player} - {int(score)}")

# Output:
# Top 3:
# #1: Charlie - 1050
# #2: Alice - 1000
# #3: Diana - 980
```

### Rate Limiting Example

```python
import redis
import time

cache = redis.Redis(host='localhost', port=6379)

def rate_limit(user_id, max_requests=10, window=60):
    """
    Sliding window rate limiter
    Allow max_requests per window (seconds)
    """
    key = f"rate_limit:{user_id}"
    current_time = time.time()
    
    # Remove old entries
    cache.zremrangebyscore(key, 0, current_time - window)
    
    # Count requests in window
    request_count = cache.zcard(key)
    
    if request_count < max_requests:
        # Add current request
        cache.zadd(key, {current_time: current_time})
        cache.expire(key, window)
        return True
    else:
        return False

# Test
user_id = "user:1000"
for i in range(15):
    allowed = rate_limit(user_id, max_requests=10, window=60)
    print(f"Request {i+1}: {'✓ Allowed' if allowed else '✗ Denied'}")
    time.sleep(0.1)
```

---

## Interview Questions

### Conceptual

**Q: Redis vs Memcached - when to use each?**
```
Redis:
✅ Complex data structures (lists, sets, sorted sets)
✅ Persistence required
✅ Pub/Sub messaging
✅ Transactions
✅ Lua scripting

Use cases:
- Session storage (persistence)
- Leaderboards (sorted sets)
- Rate limiting (sorted sets)
- Real-time chat (pub/sub)
- Job queues (lists)

Memcached:
✅ Simple key-value
✅ Multi-threaded (better CPU utilization)
✅ Simpler (less memory overhead)

Use cases:
- Page fragment caching
- Object caching (serialized)
- Simple session storage (no persistence)

Decision:
- Need data structures → Redis
- Simple caching, high throughput → Memcached
- Default → Redis (more features, minimal cost difference)
```

**Q: How to handle cache invalidation?**
```
Strategies:

1. TTL (Time-based):
   SETEX user:1000 3600 "{data}"
   Pros: Simple, automatic cleanup
   Cons: Stale data possible

2. Event-based (Delete on write):
   update_user() → DELETE user:1000
   Pros: Always fresh
   Cons: Cache miss after every write

3. Write-through:
   update_user() → UPDATE cache + DB
   Pros: Cache always populated
   Cons: Wasted cache updates (if data not read)

4. Version-based:
   user:1000:v1 → user:1000:v2
   Pros: No deletion needed
   Cons: Memory waste (old versions)

Best Practice:
- Combine TTL + Event-based
- TTL: Safety net (1 hour)
- Event-based: Immediate invalidation
- Cache-aside pattern for reads
```

**Q: How to avoid cache stampede?**
```
Problem:
Cache expires → 1000 requests hit DB simultaneously

Solutions:

1. Lock/Mutex:
```python
def get_user(user_id):
    cached = cache.get(f"user:{user_id}")
    if cached:
        return cached
    
    # Try to acquire lock
    lock = cache.setnx(f"lock:user:{user_id}", "1", ex=10)
    if lock:
        # This request rebuilds cache
        user = db.query(...)
        cache.setex(f"user:{user_id}", 3600, user)
        cache.delete(f"lock:user:{user_id}")
        return user
    else:
        # Wait for lock holder to rebuild
        time.sleep(0.1)
        return get_user(user_id)
```

2. Probabilistic Early Expiration:
```python
def get_user(user_id):
    cached, ttl = cache.get_with_ttl(f"user:{user_id}")
    if cached and should_refresh(ttl):
        # Refresh cache in background
        queue.enqueue(refresh_user, user_id)
    return cached

def should_refresh(ttl):
    # Refresh if TTL < 10% remaining
    return ttl < 360 and random() < 0.1
```

3. Stale-While-Revalidate:
```python
# Return stale data, refresh asynchronously
cached = cache.get(f"user:{user_id}")
if cached:
    ttl = cache.ttl(f"user:{user_id}")
    if ttl < 300:  # < 5 min remaining
        queue.enqueue(refresh_user, user_id)
    return cached
else:
    # Synchronous fetch
    return fetch_and_cache(user_id)
```
```

### Design

**Q: Design caching layer for social media feed (1M users, 100M posts)**
```
Requirements:
- User feed: Last 50 posts from friends
- Friends: Avg 200 friends per user
- Read-heavy (99% reads, 1% writes)
- Latency: <100 ms

Design:

1. Cache Strategy:
   Cache-aside (lazy loading)
   
   Key: feed:{user_id}
   Value: List of post IDs [post:5001, post:5002, ...]
   TTL: 5 minutes

2. Feed Generation:
   On cache miss:
   - Fetch friend IDs from DB
   - Fetch last 50 posts from each friend (10,000 posts)
   - Sort by timestamp
   - Take top 50
   - Cache result
   
   Cost: 100 ms (DB query) → 1 ms (cache hit)

3. Feed Update (New Post):
   Option A: Fanout-on-write
   - User posts → Update all friends' feeds (cache)
   - Cost: 200 friend feeds to update
   - Celebrity problem: 10M followers = 10M updates
   
   Option B: Fanout-on-read (better for celebrities)
   - User posts → Invalidate followers' feeds
   - Next read → Regenerate feed
   - Cost: Lazy regeneration

4. Hybrid Approach:
   - Regular users (<10K followers): Fanout-on-write
   - Celebrities (>10K followers): Fanout-on-read
   
5. Redis Data Structures:
   - Feed: List (RPUSH post:5001, LTRIM feed:1000 0 49)
   - Post: Hash (HSET post:5001 user_id 100 content "..." timestamp 1699123456)

6. Cache Sizing:
   Users: 1M
   Posts per feed: 50
   Post size: 1 KB
   Total: 1M × 50 × 1KB = 50 GB
   
   With 90% hit ratio: 45 GB cached
   
   Redis instances: cache.r5.xlarge (26 GB) × 2 = 52 GB

7. Monitoring:
   - Hit ratio (target: >90%)
   - Eviction rate
   - Memory usage
   - Response time
```

**Q: Implement distributed rate limiter (10K req/sec globally)**
```
Requirements:
- Rate limit: 100 req/min per user
- Distributed (multiple servers)
- Accurate counting

Design:

1. Sliding Window (Sorted Set):
```python
import redis
import time

def rate_limit(user_id, max_requests=100, window=60):
    cache = redis.Redis()
    key = f"rate:{user_id}"
    now = time.time()
    
    # Remove old requests
    cache.zremrangebyscore(key, 0, now - window)
    
    # Count requests in window
    count = cache.zcard(key)
    
    if count < max_requests:
        # Add request with timestamp as score
        cache.zadd(key, {f"{now}:{uuid.uuid4()}": now})
        cache.expire(key, window + 1)
        return True
    return False
```

2. Token Bucket (Fixed Window):
```python
def rate_limit_token_bucket(user_id, max_requests=100, window=60):
    cache = redis.Redis()
    key = f"bucket:{user_id}"
    
    # Lua script (atomic)
    script = """
    local tokens = redis.call('GET', KEYS[1])
    local now = ARGV[1]
    local max_tokens = tonumber(ARGV[2])
    local refill_rate = tonumber(ARGV[3])
    
    if not tokens then
        redis.call('SET', KEYS[1], max_tokens - 1)
        redis.call('PEXPIRE', KEYS[1], 60000)
        return 1
    end
    
    tokens = tonumber(tokens)
    if tokens > 0 then
        redis.call('DECR', KEYS[1])
        return 1
    else
        return 0
    end
    """
    
    allowed = cache.eval(script, 1, key, time.time(), max_requests, max_requests / window)
    return allowed == 1
```

3. Capacity Planning:
   Users: 100K active/min
   Keys: 100K
   Key size: 20 bytes (user_id) + 8 bytes (timestamp) = 28 bytes
   Requests per key: 100 (sorted set members)
   Total: 100K × 100 × 28 = 280 MB
   
   Redis: cache.m5.large (6.4 GB) - sufficient

4. Monitoring:
   - Rate limit hits (rejections)
   - Latency (p99 < 5 ms)
   - Memory usage
```

---

This comprehensive ElastiCache guide covers Redis/Memcached comparison, data structures, caching strategies, eviction policies, cluster replication, pub/sub, and production patterns with complete Docker examples! 🚀

