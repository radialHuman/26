# Redis Integration

## What is Redis?

**Redis** (Remote Dictionary Server) is an in-memory data structure store used as:
- Database
- Cache
- Message broker
- Session store

## Why Use Redis?

- **Fast**: In-memory storage (microsecond latency)
- **Versatile**: Multiple data structures (strings, hashes, lists, sets, sorted sets)
- **Atomic Operations**: Thread-safe operations
- **Persistence**: Optional disk persistence
- **Pub/Sub**: Real-time messaging
- **Scalable**: Clustering support

## Installation

```bash
# Install Redis client for Go
go get github.com/go-redis/redis/v8
```

## Basic Connection

### Single Instance

```go
package main

import (
    "context"
    "fmt"
    "time"
    
    "github.com/go-redis/redis/v8"
)

var ctx = context.Background()

func main() {
    // Create Redis client
    rdb := redis.NewClient(&redis.Options{
        Addr:     "localhost:6379",
        Password: "",  // no password
        DB:       0,   // default DB
        PoolSize: 10,  // connection pool size
    })
    
    // Test connection
    pong, err := rdb.Ping(ctx).Result()
    if err != nil {
        panic(err)
    }
    
    fmt.Println("Connected to Redis:", pong)
    
    // Close connection when done
    defer rdb.Close()
}
```

### Connection with Options

```go
func NewRedisClient() *redis.Client {
    return redis.NewClient(&redis.Options{
        Addr:         "localhost:6379",
        Password:     os.Getenv("REDIS_PASSWORD"),
        DB:           0,
        DialTimeout:  10 * time.Second,
        ReadTimeout:  5 * time.Second,
        WriteTimeout: 5 * time.Second,
        PoolSize:     20,
        MinIdleConns: 5,
        MaxConnAge:   1 * time.Hour,
        PoolTimeout:  4 * time.Minute,
        IdleTimeout:  5 * time.Minute,
    })
}
```

## Basic Operations

### Strings

```go
func stringOperations(rdb *redis.Client) {
    // SET
    err := rdb.Set(ctx, "key", "value", 0).Err()
    if err != nil {
        panic(err)
    }
    
    // GET
    val, err := rdb.Get(ctx, "key").Result()
    if err == redis.Nil {
        fmt.Println("key does not exist")
    } else if err != nil {
        panic(err)
    } else {
        fmt.Println("key:", val)
    }
    
    // SET with expiration
    err = rdb.Set(ctx, "session:123", "user_data", 30*time.Minute).Err()
    
    // SETEX (set with expiration)
    err = rdb.SetEx(ctx, "temp", "value", 10*time.Second).Err()
    
    // SETNX (set if not exists)
    wasSet, err := rdb.SetNX(ctx, "lock:resource", "locked", 5*time.Second).Result()
    if wasSet {
        fmt.Println("Lock acquired")
    }
    
    // INCR (increment)
    count, err := rdb.Incr(ctx, "counter").Result()
    fmt.Println("Counter:", count)
    
    // INCRBY
    newCount, err := rdb.IncrBy(ctx, "counter", 5).Result()
    
    // DECR
    rdb.Decr(ctx, "counter")
    
    // APPEND
    length, err := rdb.Append(ctx, "message", " world").Result()
    
    // DEL
    deleted, err := rdb.Del(ctx, "key").Result()
    fmt.Println("Deleted keys:", deleted)
    
    // EXISTS
    exists, err := rdb.Exists(ctx, "key").Result()
    if exists == 1 {
        fmt.Println("Key exists")
    }
    
    // TTL (time to live)
    ttl, err := rdb.TTL(ctx, "session:123").Result()
    fmt.Println("TTL:", ttl)
}
```

### Hashes

```go
func hashOperations(rdb *redis.Client) {
    // HSET (set field)
    err := rdb.HSet(ctx, "user:1", "name", "John Doe").Err()
    
    // HMSET (set multiple fields)
    err = rdb.HMSet(ctx, "user:1", map[string]interface{}{
        "name":  "John Doe",
        "email": "john@example.com",
        "age":   30,
    }).Err()
    
    // HGET (get field)
    name, err := rdb.HGet(ctx, "user:1", "name").Result()
    fmt.Println("Name:", name)
    
    // HGETALL (get all fields)
    user, err := rdb.HGetAll(ctx, "user:1").Result()
    fmt.Println("User:", user)
    
    // HINCRBY (increment field)
    newAge, err := rdb.HIncrBy(ctx, "user:1", "age", 1).Result()
    
    // HDEL (delete field)
    deleted, err := rdb.HDel(ctx, "user:1", "age").Result()
    
    // HEXISTS
    exists, err := rdb.HExists(ctx, "user:1", "name").Result()
    
    // HKEYS (get all field names)
    keys, err := rdb.HKeys(ctx, "user:1").Result()
    
    // HVALS (get all values)
    values, err := rdb.HVals(ctx, "user:1").Result()
    
    // HLEN (number of fields)
    count, err := rdb.HLen(ctx, "user:1").Result()
}
```

### Lists

```go
func listOperations(rdb *redis.Client) {
    // LPUSH (push to left/head)
    err := rdb.LPush(ctx, "queue", "task1", "task2").Err()
    
    // RPUSH (push to right/tail)
    err = rdb.RPush(ctx, "queue", "task3").Err()
    
    // LPOP (pop from left)
    task, err := rdb.LPop(ctx, "queue").Result()
    fmt.Println("Popped:", task)
    
    // RPOP (pop from right)
    task, err = rdb.RPop(ctx, "queue").Result()
    
    // LRANGE (get range)
    tasks, err := rdb.LRange(ctx, "queue", 0, -1).Result()
    fmt.Println("All tasks:", tasks)
    
    // LLEN (length)
    length, err := rdb.LLen(ctx, "queue").Result()
    
    // LINDEX (get by index)
    item, err := rdb.LIndex(ctx, "queue", 0).Result()
    
    // LTRIM (trim list)
    err = rdb.LTrim(ctx, "queue", 0, 99).Err() // Keep first 100 items
    
    // Blocking operations
    result, err := rdb.BLPop(ctx, 5*time.Second, "queue").Result()
    if err == redis.Nil {
        fmt.Println("Timeout, no items in queue")
    }
}
```

### Sets

```go
func setOperations(rdb *redis.Client) {
    // SADD (add members)
    err := rdb.SAdd(ctx, "tags", "go", "redis", "backend").Err()
    
    // SMEMBERS (get all members)
    members, err := rdb.SMembers(ctx, "tags").Result()
    fmt.Println("Tags:", members)
    
    // SISMEMBER (check membership)
    isMember, err := rdb.SIsMember(ctx, "tags", "go").Result()
    
    // SREM (remove member)
    removed, err := rdb.SRem(ctx, "tags", "go").Result()
    
    // SCARD (cardinality/count)
    count, err := rdb.SCard(ctx, "tags").Result()
    
    // SPOP (remove and return random member)
    member, err := rdb.SPop(ctx, "tags").Result()
    
    // SRANDMEMBER (get random member without removing)
    random, err := rdb.SRandMember(ctx, "tags").Result()
    
    // Set operations
    rdb.SAdd(ctx, "set1", "a", "b", "c")
    rdb.SAdd(ctx, "set2", "b", "c", "d")
    
    // SUNION
    union, err := rdb.SUnion(ctx, "set1", "set2").Result()
    
    // SINTER (intersection)
    inter, err := rdb.SInter(ctx, "set1", "set2").Result()
    
    // SDIFF (difference)
    diff, err := rdb.SDiff(ctx, "set1", "set2").Result()
}
```

### Sorted Sets

```go
func sortedSetOperations(rdb *redis.Client) {
    // ZADD (add members with scores)
    err := rdb.ZAdd(ctx, "leaderboard", &redis.Z{
        Score:  100,
        Member: "player1",
    }, &redis.Z{
        Score:  85,
        Member: "player2",
    }).Err()
    
    // ZINCRBY (increment score)
    newScore, err := rdb.ZIncrBy(ctx, "leaderboard", 5, "player1").Result()
    
    // ZSCORE (get score)
    score, err := rdb.ZScore(ctx, "leaderboard", "player1").Result()
    
    // ZRANGE (get range by rank)
    members, err := rdb.ZRange(ctx, "leaderboard", 0, -1).Result()
    
    // ZREVRANGE (get range in reverse)
    top10, err := rdb.ZRevRange(ctx, "leaderboard", 0, 9).Result()
    
    // ZRANGE with scores
    membersWithScores, err := rdb.ZRangeWithScores(ctx, "leaderboard", 0, -1).Result()
    for _, z := range membersWithScores {
        fmt.Printf("%s: %.0f\n", z.Member, z.Score)
    }
    
    // ZRANGEBYSCORE (get by score range)
    highScorers, err := rdb.ZRangeByScore(ctx, "leaderboard", &redis.ZRangeBy{
        Min: "90",
        Max: "+inf",
    }).Result()
    
    // ZRANK (get rank)
    rank, err := rdb.ZRank(ctx, "leaderboard", "player1").Result()
    
    // ZREM (remove member)
    removed, err := rdb.ZRem(ctx, "leaderboard", "player1").Result()
    
    // ZCARD (count)
    count, err := rdb.ZCard(ctx, "leaderboard").Result()
}
```

## Caching Patterns

### Cache-Aside Pattern

```go
type UserRepository struct {
    db    *sql.DB
    cache *redis.Client
}

func (r *UserRepository) GetUser(userID int) (*User, error) {
    cacheKey := fmt.Sprintf("user:%d", userID)
    
    // Try cache first
    cached, err := r.cache.Get(ctx, cacheKey).Result()
    if err == nil {
        var user User
        json.Unmarshal([]byte(cached), &user)
        return &user, nil
    }
    
    // Cache miss - fetch from database
    var user User
    err = r.db.QueryRow("SELECT id, name, email FROM users WHERE id = $1", userID).
        Scan(&user.ID, &user.Name, &user.Email)
    if err != nil {
        return nil, err
    }
    
    // Store in cache
    userData, _ := json.Marshal(user)
    r.cache.Set(ctx, cacheKey, userData, 1*time.Hour)
    
    return &user, nil
}

func (r *UserRepository) UpdateUser(user *User) error {
    // Update database
    _, err := r.db.Exec("UPDATE users SET name = $1, email = $2 WHERE id = $3",
        user.Name, user.Email, user.ID)
    if err != nil {
        return err
    }
    
    // Invalidate cache
    cacheKey := fmt.Sprintf("user:%d", user.ID)
    r.cache.Del(ctx, cacheKey)
    
    return nil
}
```

### Write-Through Cache

```go
func (r *UserRepository) CreateUser(user *User) error {
    // Write to database
    err := r.db.QueryRow(
        "INSERT INTO users (name, email) VALUES ($1, $2) RETURNING id",
        user.Name, user.Email,
    ).Scan(&user.ID)
    if err != nil {
        return err
    }
    
    // Write to cache
    cacheKey := fmt.Sprintf("user:%d", user.ID)
    userData, _ := json.Marshal(user)
    r.cache.Set(ctx, cacheKey, userData, 1*time.Hour)
    
    return nil
}
```

### Cache with Expiration

```go
type CacheService struct {
    client *redis.Client
}

func (c *CacheService) Set(key string, value interface{}, expiration time.Duration) error {
    data, err := json.Marshal(value)
    if err != nil {
        return err
    }
    
    return c.client.Set(ctx, key, data, expiration).Err()
}

func (c *CacheService) Get(key string, dest interface{}) error {
    data, err := c.client.Get(ctx, key).Result()
    if err != nil {
        return err
    }
    
    return json.Unmarshal([]byte(data), dest)
}

func (c *CacheService) Delete(keys ...string) error {
    return c.client.Del(ctx, keys...).Err()
}

// Usage
cache := &CacheService{client: rdb}

// Set
user := User{ID: 1, Name: "John"}
cache.Set("user:1", user, 30*time.Minute)

// Get
var cachedUser User
if err := cache.Get("user:1", &cachedUser); err == nil {
    fmt.Println("Cached user:", cachedUser.Name)
}

// Delete
cache.Delete("user:1")
```

## Session Management

```go
type SessionStore struct {
    client *redis.Client
}

func (s *SessionStore) Create(userID int, data map[string]interface{}) (string, error) {
    // Generate session ID
    sessionID := uuid.New().String()
    
    // Store session data
    key := fmt.Sprintf("session:%s", sessionID)
    err := s.client.HMSet(ctx, key, data).Err()
    if err != nil {
        return "", err
    }
    
    // Set expiration
    s.client.Expire(ctx, key, 24*time.Hour)
    
    return sessionID, nil
}

func (s *SessionStore) Get(sessionID string) (map[string]string, error) {
    key := fmt.Sprintf("session:%s", sessionID)
    return s.client.HGetAll(ctx, key).Result()
}

func (s *SessionStore) Update(sessionID string, field, value string) error {
    key := fmt.Sprintf("session:%s", sessionID)
    return s.client.HSet(ctx, key, field, value).Err()
}

func (s *SessionStore) Delete(sessionID string) error {
    key := fmt.Sprintf("session:%s", sessionID)
    return s.client.Del(ctx, key).Err()
}

func (s *SessionStore) Extend(sessionID string, duration time.Duration) error {
    key := fmt.Sprintf("session:%s", sessionID)
    return s.client.Expire(ctx, key, duration).Err()
}
```

## Rate Limiting

### Fixed Window

```go
type RateLimiter struct {
    client *redis.Client
}

func (rl *RateLimiter) Allow(userID string, limit int, window time.Duration) (bool, error) {
    key := fmt.Sprintf("rate:%s", userID)
    
    // Increment counter
    count, err := rl.client.Incr(ctx, key).Result()
    if err != nil {
        return false, err
    }
    
    // Set expiration on first request
    if count == 1 {
        rl.client.Expire(ctx, key, window)
    }
    
    return count <= int64(limit), nil
}

// Usage
limiter := &RateLimiter{client: rdb}

allowed, _ := limiter.Allow("user:123", 100, 1*time.Minute)
if !allowed {
    // Rate limit exceeded
    http.Error(w, "Rate limit exceeded", http.StatusTooManyRequests)
    return
}
```

### Sliding Window

```go
func (rl *RateLimiter) AllowSlidingWindow(userID string, limit int, window time.Duration) (bool, error) {
    key := fmt.Sprintf("rate:sliding:%s", userID)
    now := time.Now().UnixNano()
    windowStart := now - int64(window)
    
    pipe := rl.client.Pipeline()
    
    // Remove old entries
    pipe.ZRemRangeByScore(ctx, key, "0", fmt.Sprintf("%d", windowStart))
    
    // Count current requests
    pipe.ZCard(ctx, key)
    
    // Add current request
    pipe.ZAdd(ctx, key, &redis.Z{
        Score:  float64(now),
        Member: now,
    })
    
    // Set expiration
    pipe.Expire(ctx, key, window)
    
    cmds, err := pipe.Exec(ctx)
    if err != nil {
        return false, err
    }
    
    count := cmds[1].(*redis.IntCmd).Val()
    return count < int64(limit), nil
}
```

## Distributed Locking

```go
type DistributedLock struct {
    client *redis.Client
}

func (dl *DistributedLock) Acquire(resource string, ttl time.Duration) (bool, error) {
    lockKey := fmt.Sprintf("lock:%s", resource)
    
    // Try to acquire lock
    success, err := dl.client.SetNX(ctx, lockKey, "locked", ttl).Result()
    return success, err
}

func (dl *DistributedLock) Release(resource string) error {
    lockKey := fmt.Sprintf("lock:%s", resource)
    return dl.client.Del(ctx, lockKey).Err()
}

// Usage with defer
func processWithLock(dl *DistributedLock, resource string) error {
    acquired, err := dl.Acquire(resource, 10*time.Second)
    if err != nil {
        return err
    }
    if !acquired {
        return fmt.Errorf("could not acquire lock")
    }
    defer dl.Release(resource)
    
    // Do work
    fmt.Println("Processing", resource)
    time.Sleep(2 * time.Second)
    
    return nil
}
```

## Pub/Sub (Publish/Subscribe)

```go
func publisher(rdb *redis.Client) {
    for i := 0; i < 10; i++ {
        msg := fmt.Sprintf("Message %d", i)
        err := rdb.Publish(ctx, "notifications", msg).Err()
        if err != nil {
            panic(err)
        }
        time.Sleep(1 * time.Second)
    }
}

func subscriber(rdb *redis.Client) {
    pubsub := rdb.Subscribe(ctx, "notifications")
    defer pubsub.Close()
    
    // Wait for subscription to be created
    _, err := pubsub.Receive(ctx)
    if err != nil {
        panic(err)
    }
    
    // Consume messages
    ch := pubsub.Channel()
    for msg := range ch {
        fmt.Println("Received:", msg.Payload)
    }
}

func main() {
    rdb := redis.NewClient(&redis.Options{Addr: "localhost:6379"})
    
    go subscriber(rdb)
    time.Sleep(100 * time.Millisecond)
    
    publisher(rdb)
}
```

## Pipeline (Batch Operations)

```go
func pipelineExample(rdb *redis.Client) {
    pipe := rdb.Pipeline()
    
    // Queue multiple commands
    incr := pipe.Incr(ctx, "counter")
    pipe.Expire(ctx, "counter", 1*time.Hour)
    pipe.Set(ctx, "key", "value", 0)
    pipe.Get(ctx, "key")
    
    // Execute all commands
    _, err := pipe.Exec(ctx)
    if err != nil {
        panic(err)
    }
    
    // Get result of specific command
    fmt.Println("Counter:", incr.Val())
}
```

## Transactions

```go
func transactionExample(rdb *redis.Client) error {
    // Watch keys for changes
    err := rdb.Watch(ctx, func(tx *redis.Tx) error {
        // Get current value
        val, err := tx.Get(ctx, "balance").Int()
        if err != nil && err != redis.Nil {
            return err
        }
        
        // Begin transaction
        _, err = tx.TxPipelined(ctx, func(pipe redis.Pipeliner) error {
            pipe.Set(ctx, "balance", val+100, 0)
            pipe.SAdd(ctx, "transactions", time.Now().Unix())
            return nil
        })
        
        return err
    }, "balance")
    
    return err
}
```

## Best Practices

### Connection Pooling

```go
func NewRedisClient() *redis.Client {
    return redis.NewClient(&redis.Options{
        Addr:         "localhost:6379",
        PoolSize:     20,              // Max connections
        MinIdleConns: 5,               // Min idle connections
        MaxConnAge:   1 * time.Hour,   // Max connection lifetime
        PoolTimeout:  4 * time.Second, // Wait timeout
        IdleTimeout:  5 * time.Minute, // Idle timeout
    })
}
```

### Error Handling

```go
val, err := rdb.Get(ctx, "key").Result()
switch {
case err == redis.Nil:
    fmt.Println("Key does not exist")
case err != nil:
    fmt.Println("Error:", err)
default:
    fmt.Println("Value:", val)
}
```

### Key Naming

```go
// Use clear, hierarchical naming
"user:123:profile"
"session:abc-def"
"cache:posts:latest"
"rate:user:456:api"
```

## Summary

Redis provides:
- **Caching**: Fast data access
- **Sessions**: User session storage
- **Rate Limiting**: API throttling
- **Locking**: Distributed locks
- **Pub/Sub**: Real-time messaging
- **Queues**: Task queues

Essential for high-performance backend systems.
