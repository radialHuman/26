# Amazon ElastiCache

## What is ElastiCache?

Amazon ElastiCache is a fully managed in-memory data store and cache service that supports two open-source engines: Redis and Memcached. It provides sub-millisecond latency for read-heavy application workloads.

## Why Use ElastiCache?

### Key Benefits
- **Sub-Millisecond Latency**: In-memory performance
- **Fully Managed**: Automatic backups, patching, monitoring
- **Scalability**: Scale horizontally and vertically
- **High Availability**: Multi-AZ with automatic failover (Redis)
- **Security**: Encryption at rest and in transit, VPC isolation
- **Cost-Effective**: Pay for what you use
- **Compatibility**: Drop-in replacement for Redis/Memcached

### Use Cases
- Database caching (reduce DB load)
- Session storage (web applications)
- Real-time analytics (leaderboards, counters)
- Message queuing (pub/sub)
- Rate limiting
- Application state management
- Gaming leaderboards

## Redis vs Memcached

### Feature Comparison

| Feature | Redis | Memcached |
|---------|-------|-----------|
| Data structures | Strings, Lists, Sets, Sorted Sets, Hashes, Bitmaps, HyperLogLogs, Streams | String only |
| Persistence | Yes (RDB, AOF) | No |
| Replication | Yes (Multi-AZ, Read Replicas) | Yes (Auto Discovery) |
| Automatic failover | Yes | No |
| Pub/Sub | Yes | No |
| Transactions | Yes | No |
| Lua scripting | Yes | No |
| Geospatial | Yes | No |
| Backup/Restore | Yes | No |
| Multi-threading | Single-threaded (6.x cluster mode) | Multi-threaded |
| Use case | Complex data structures, persistence | Simple caching, multi-core |

### When to Use Redis

**Use Cases**:
- Need data persistence
- Complex data structures (lists, sets, sorted sets)
- Pub/Sub messaging
- Geospatial queries
- High availability (Multi-AZ)
- Transactions
- Leaderboards, ranking

**Example**:
```
Gaming leaderboard → Sorted Sets
Session store with TTL → Strings with EXPIRE
Real-time analytics → HyperLogLog
Message queue → Lists (LPUSH, RPOP)
```

### When to Use Memcached

**Use Cases**:
- Simple key-value caching
- Multi-threaded performance
- Horizontal scaling (partitioning)
- No persistence needed
- Simpler architecture

**Example**:
```
Database query cache → Simple key-value
HTML fragment cache → String storage
API response cache → Multi-core performance
```

## Redis Architecture

### Cluster Mode Disabled (Traditional)

**Structure**:
```
Primary Node (read/write)
  ├── Replica 1 (read-only)
  ├── Replica 2 (read-only)
  └── Replica 3 (read-only)

Max: 1 primary + 5 replicas
```

**Characteristics**:
- Single shard (all data on primary)
- Max size: ~350 GB (largest node type)
- Read scaling: Add replicas (up to 5)
- Write scaling: Vertical only (larger node)

**Multi-AZ**:
```
Primary (AZ-1) ←→ Replica (AZ-2)

Automatic failover:
  Primary fails → Replica promoted → New primary
  Downtime: <60 seconds
```

**Creating Cluster**:
```python
import boto3

elasticache = boto3.client('elasticache')

response = elasticache.create_replication_group(
    ReplicationGroupId='my-redis-cluster',
    ReplicationGroupDescription='Redis cluster for caching',
    Engine='redis',
    CacheNodeType='cache.r6g.large',
    NumCacheClusters=3,  # 1 primary + 2 replicas
    AutomaticFailoverEnabled=True,
    MultiAZEnabled=True,
    CacheSubnetGroupName='my-subnet-group',
    SecurityGroupIds=['sg-12345'],
    AtRestEncryptionEnabled=True,
    TransitEncryptionEnabled=True,
    AuthToken='MySecurePassword123!',  # Required with transit encryption
    SnapshotRetentionLimit=7,
    SnapshotWindow='03:00-05:00',
    PreferredMaintenanceWindow='sun:05:00-sun:07:00'
)
```

### Cluster Mode Enabled (Sharded)

**Structure**:
```
Shard 1 (hash slot 0-5460)
  Primary 1 + Replicas

Shard 2 (hash slot 5461-10922)
  Primary 2 + Replicas

Shard 3 (hash slot 10923-16383)
  Primary 3 + Replicas

Max: 500 shards (90 nodes/shard = 45,000 nodes total)
```

**Characteristics**:
- Data partitioned across shards
- Horizontal scaling (add/remove shards)
- Max size: 500 shards × 350 GB = 175 TB
- Read/write scaling: Both

**Sharding** (Automatic):
```
Key: "user:12345"
Hash: CRC16("user:12345") mod 16384 = 8523
Shard: Hash slot 8523 → Shard 2
```

**Online Scaling**:
```
Vertical: Change node type (minimal downtime)
Horizontal: Add/remove shards (data rebalancing)
```

**Creating Sharded Cluster**:
```python
response = elasticache.create_replication_group(
    ReplicationGroupId='my-redis-sharded',
    ReplicationGroupDescription='Sharded Redis cluster',
    Engine='redis',
    CacheNodeType='cache.r6g.large',
    NumNodeGroups=3,  # 3 shards
    ReplicasPerNodeGroup=2,  # 2 replicas per shard
    AutomaticFailoverEnabled=True,
    MultiAZEnabled=True,
    CacheParameterGroupName='default.redis7.cluster.on'
)
```

## Memcached Architecture

**Structure**:
```
Node 1 (partition 1)
Node 2 (partition 2)
Node 3 (partition 3)
...
Node N (partition N)

Max: 300 nodes per cluster
```

**Characteristics**:
- Consistent hashing (client-side partitioning)
- Auto Discovery (client finds all nodes)
- No replication (node failure = data loss)
- Multi-threaded (efficient CPU usage)

**Creating Memcached Cluster**:
```python
response = elasticache.create_cache_cluster(
    CacheClusterId='my-memcached',
    Engine='memcached',
    CacheNodeType='cache.r6g.large',
    NumCacheNodes=3,  # 3 nodes (partitions)
    CacheSubnetGroupName='my-subnet-group',
    SecurityGroupIds=['sg-12345'],
    AZMode='cross-az',  # Distribute across AZs
    PreferredAvailabilityZones=['us-east-1a', 'us-east-1b', 'us-east-1c']
)
```

**Auto Discovery**:
```python
from pymemcache.client.hash import HashClient
from elasticache_auto_discovery import MemcacheClient

# Auto Discovery endpoint (discovers all nodes)
client = MemcacheClient('my-cluster.cfg.use1.cache.amazonaws.com:11211')

# Automatically connects to all nodes
client.set('key', 'value')
```

## Node Types

### Current Generation

**General Purpose** (M6g, M5):
```
cache.m6g.large: 2 vCPU, 6.38 GiB RAM, $0.136/hr
cache.m6g.xlarge: 4 vCPU, 12.93 GiB RAM, $0.272/hr
cache.m6g.2xlarge: 8 vCPU, 26.04 GiB RAM, $0.544/hr
cache.m6g.4xlarge: 16 vCPU, 52.26 GiB RAM, $1.088/hr

Use: Balanced price/performance
```

**Memory Optimized** (R6g, R5):
```
cache.r6g.large: 2 vCPU, 13.07 GiB RAM, $0.201/hr
cache.r6g.xlarge: 4 vCPU, 26.32 GiB RAM, $0.402/hr
cache.r6g.2xlarge: 8 vCPU, 52.82 GiB RAM, $0.804/hr
cache.r6g.4xlarge: 16 vCPU, 105.81 GiB RAM, $1.608/hr
cache.r6g.8xlarge: 32 vCPU, 211.80 GiB RAM, $3.216/hr
cache.r6g.12xlarge: 48 vCPU, 317.77 GiB RAM, $4.824/hr
cache.r6g.16xlarge: 64 vCPU, 423.55 GiB RAM, $6.432/hr

Use: Large datasets, high performance
```

**Graviton2** (R6gd, M6gd):
```
cache.r6gd.xlarge: 4 vCPU, 26.32 GiB RAM, NVMe SSD, $0.504/hr

Use: Cost optimization (vs Intel), local NVMe for snapshots
```

**Previous Generation** (T3, T2):
```
cache.t3.micro: 2 vCPU, 0.5 GiB RAM, $0.017/hr
cache.t3.small: 2 vCPU, 1.37 GiB RAM, $0.034/hr
cache.t3.medium: 2 vCPU, 3.09 GiB RAM, $0.068/hr

Use: Development, testing, low traffic
```

## Caching Strategies

### Lazy Loading (Cache-Aside)

**How It Works**:
```
1. Application requests data
2. Check cache
3. Cache hit: Return cached data
4. Cache miss: Query database
5. Store in cache
6. Return data
```

**Code Example**:
```python
import redis
import json

redis_client = redis.Redis(
    host='my-cluster.cache.amazonaws.com',
    port=6379,
    decode_responses=True,
    ssl=True,
    password='MySecurePassword123!'
)

def get_user(user_id):
    # Check cache
    cache_key = f'user:{user_id}'
    cached_user = redis_client.get(cache_key)
    
    if cached_user:
        # Cache hit
        return json.loads(cached_user)
    
    # Cache miss - query database
    user = db.query('SELECT * FROM users WHERE id = ?', user_id)
    
    # Store in cache (TTL: 1 hour)
    redis_client.setex(
        cache_key,
        3600,
        json.dumps(user)
    )
    
    return user
```

**Pros**:
- Only requested data is cached
- Node failures don't break application
- Cache can be empty on startup

**Cons**:
- Cache miss penalty (3 trips: cache, DB, cache)
- Stale data possible

### Write-Through

**How It Works**:
```
1. Application writes data
2. Write to cache
3. Write to database
4. Return success
```

**Code Example**:
```python
def update_user(user_id, user_data):
    cache_key = f'user:{user_id}'
    
    # Write to cache
    redis_client.setex(
        cache_key,
        3600,
        json.dumps(user_data)
    )
    
    # Write to database
    db.execute('UPDATE users SET ... WHERE id = ?', user_id)
    
    return user_data
```

**Pros**:
- Cache always up-to-date
- No stale data
- Cache miss penalty only on first read

**Cons**:
- Write penalty (every write updates cache)
- Cache can have data never read (wasted memory)

### Combination (Lazy + Write-Through)

**Best Practice**:
```python
def get_user(user_id):
    # Lazy loading
    cache_key = f'user:{user_id}'
    cached = redis_client.get(cache_key)
    if cached:
        return json.loads(cached)
    
    user = db.query('SELECT * FROM users WHERE id = ?', user_id)
    redis_client.setex(cache_key, 3600, json.dumps(user))
    return user

def update_user(user_id, user_data):
    # Write-through
    cache_key = f'user:{user_id}'
    
    # Update database first
    db.execute('UPDATE users SET ... WHERE id = ?', user_id)
    
    # Update cache
    redis_client.setex(cache_key, 3600, json.dumps(user_data))
    
    return user_data

def delete_user(user_id):
    # Invalidate cache
    redis_client.delete(f'user:{user_id}')
    
    # Delete from database
    db.execute('DELETE FROM users WHERE id = ?', user_id)
```

### TTL (Time to Live)

**Strategies**:
```python
# Short TTL for frequently changing data
redis_client.setex('stock_price:AAPL', 60, price)  # 1 minute

# Medium TTL for moderate updates
redis_client.setex('user:12345', 3600, user_data)  # 1 hour

# Long TTL for rarely changing data
redis_client.setex('config:app', 86400, config)  # 24 hours

# No TTL for static data
redis_client.set('country_codes', json.dumps(codes))  # No expiration
```

**TTL Best Practices**:
- Balance freshness vs performance
- Shorter TTL = fresher data, more DB load
- Longer TTL = less DB load, stale data
- Add jitter to prevent thundering herd

**Jitter Example**:
```python
import random

# Add random jitter (±10%)
base_ttl = 3600
jitter = int(base_ttl * 0.1 * random.uniform(-1, 1))
ttl = base_ttl + jitter

redis_client.setex('key', ttl, value)

# Prevents all keys expiring at same time
```

## Redis Data Structures

### Strings

**Operations**:
```python
# Set/Get
redis_client.set('key', 'value')
value = redis_client.get('key')

# Set with TTL
redis_client.setex('session:12345', 3600, session_data)

# Increment (atomic)
redis_client.incr('page_views')
redis_client.incrby('counter', 5)

# Decrement
redis_client.decr('inventory')

# Set if not exists
redis_client.setnx('lock:resource', 'locked')

# Multiple set/get
redis_client.mset({'key1': 'val1', 'key2': 'val2'})
values = redis_client.mget(['key1', 'key2'])
```

**Use Cases**:
- Session storage
- Counters (page views, votes)
- Caching (API responses, HTML fragments)
- Distributed locks

### Lists

**Operations**:
```python
# Push (add to ends)
redis_client.lpush('queue', 'item1')  # Left push
redis_client.rpush('queue', 'item2')  # Right push

# Pop (remove from ends)
item = redis_client.lpop('queue')  # Left pop
item = redis_client.rpop('queue')  # Right pop

# Blocking pop (wait for item)
item = redis_client.blpop('queue', timeout=30)

# Range
items = redis_client.lrange('queue', 0, -1)  # All items

# Length
length = redis_client.llen('queue')

# Trim (keep only range)
redis_client.ltrim('recent_logs', 0, 99)  # Keep latest 100
```

**Use Cases**:
- Message queues (FIFO)
- Activity feeds (recent items)
- Task queues
- Chat message history

**Example** (Message Queue):
```python
# Producer
redis_client.lpush('tasks', json.dumps({'task': 'send_email', 'to': 'user@example.com'}))

# Consumer (worker)
while True:
    task_data = redis_client.brpop('tasks', timeout=5)
    if task_data:
        _, task_json = task_data
        task = json.loads(task_json)
        process_task(task)
```

### Sets

**Operations**:
```python
# Add members
redis_client.sadd('tags', 'python', 'redis', 'aws')

# Remove member
redis_client.srem('tags', 'redis')

# Check membership
exists = redis_client.sismember('tags', 'python')

# Get all members
members = redis_client.smembers('tags')

# Count
count = redis_client.scard('tags')

# Set operations
redis_client.sinter('set1', 'set2')  # Intersection
redis_client.sunion('set1', 'set2')  # Union
redis_client.sdiff('set1', 'set2')   # Difference

# Random member
random_member = redis_client.srandmember('tags')
```

**Use Cases**:
- Unique items (unique visitors, tags)
- Relationships (followers, friends)
- Access control (roles, permissions)
- Deduplication

**Example** (Unique Visitors):
```python
# Track unique visitors per day
date = '2026-01-31'
redis_client.sadd(f'visitors:{date}', user_id)

# Count unique visitors
unique_count = redis_client.scard(f'visitors:{date}')
```

### Sorted Sets (ZSet)

**Operations**:
```python
# Add with score
redis_client.zadd('leaderboard', {'player1': 1000, 'player2': 1500, 'player3': 800})

# Increment score
redis_client.zincrby('leaderboard', 100, 'player1')

# Range by rank
top_10 = redis_client.zrevrange('leaderboard', 0, 9, withscores=True)

# Range by score
high_scorers = redis_client.zrangebyscore('leaderboard', 1000, 2000, withscores=True)

# Rank (position)
rank = redis_client.zrevrank('leaderboard', 'player1')  # 0-based

# Score
score = redis_client.zscore('leaderboard', 'player1')

# Remove
redis_client.zrem('leaderboard', 'player1')

# Count in score range
count = redis_client.zcount('leaderboard', 1000, 2000)
```

**Use Cases**:
- Leaderboards (gaming scores)
- Priority queues (by timestamp/priority)
- Rate limiting (sliding window)
- Time-series data

**Example** (Leaderboard):
```python
# Add score
def add_score(player_id, score):
    redis_client.zadd('game:leaderboard', {player_id: score})

# Get top 10
def get_top_10():
    return redis_client.zrevrange('game:leaderboard', 0, 9, withscores=True)

# Get player rank
def get_rank(player_id):
    rank = redis_client.zrevrank('game:leaderboard', player_id)
    return rank + 1 if rank is not None else None

# Get score
def get_score(player_id):
    return redis_client.zscore('game:leaderboard', player_id)
```

**Example** (Rate Limiting):
```python
import time

def is_rate_limited(user_id, max_requests=100, window_seconds=3600):
    key = f'rate_limit:{user_id}'
    now = time.time()
    
    # Remove old entries (outside window)
    redis_client.zremrangebyscore(key, 0, now - window_seconds)
    
    # Count requests in window
    request_count = redis_client.zcard(key)
    
    if request_count >= max_requests:
        return True
    
    # Add current request
    redis_client.zadd(key, {str(now): now})
    redis_client.expire(key, window_seconds)
    
    return False
```

### Hashes

**Operations**:
```python
# Set field
redis_client.hset('user:12345', 'name', 'John Doe')
redis_client.hset('user:12345', 'email', 'john@example.com')

# Set multiple fields
redis_client.hmset('user:12345', {
    'name': 'John Doe',
    'email': 'john@example.com',
    'age': '30'
})

# Get field
name = redis_client.hget('user:12345', 'name')

# Get all fields
user = redis_client.hgetall('user:12345')

# Delete field
redis_client.hdel('user:12345', 'age')

# Increment field
redis_client.hincrby('user:12345', 'login_count', 1)

# Check field exists
exists = redis_client.hexists('user:12345', 'email')

# Get all keys
keys = redis_client.hkeys('user:12345')
```

**Use Cases**:
- Object storage (user profiles, product details)
- Counters (multiple counters per entity)
- Session attributes

**Example** (User Session):
```python
def create_session(session_id, user_data):
    session_key = f'session:{session_id}'
    redis_client.hmset(session_key, user_data)
    redis_client.expire(session_key, 3600)  # 1 hour TTL

def get_session(session_id):
    session_key = f'session:{session_id}'
    return redis_client.hgetall(session_key)

def update_session(session_id, field, value):
    session_key = f'session:{session_id}'
    redis_client.hset(session_key, field, value)
    redis_client.expire(session_key, 3600)  # Refresh TTL
```

## Persistence (Redis Only)

### RDB (Redis Database Backup)

**What**: Point-in-time snapshots

**Configuration**:
```
save 900 1     # Save if 1 key changed in 15 minutes
save 300 10    # Save if 10 keys changed in 5 minutes
save 60 10000  # Save if 10,000 keys changed in 1 minute
```

**Pros**:
- Compact (single file)
- Fast restarts
- Good for backups

**Cons**:
- Data loss possible (last snapshot to failure)
- CPU/IO spike during save

**Creating Snapshot**:
```bash
# Manual snapshot
redis-cli BGSAVE

# On ElastiCache (automatic backups)
Backup retention: 1-35 days
Backup window: Specify time
```

### AOF (Append-Only File)

**What**: Log of all write operations

**Sync Policies**:
```
appendfsync always    # Every write (slow, safest)
appendfsync everysec  # Every second (balance)
appendfsync no        # OS decides (fastest, riskiest)
```

**Pros**:
- Minimal data loss (1 second max)
- Durable
- Can be replayed

**Cons**:
- Larger files than RDB
- Slower than RDB

**Rewrite** (Compaction):
```
AOF grows large → Rewrite to compact
Background process, no downtime
```

**ElastiCache Configuration**:
```python
response = elasticache.create_replication_group(
    ReplicationGroupId='my-redis',
    # ...
    SnapshotRetentionLimit=7,  # RDB backups
    # AOF not directly configurable (managed by AWS)
)
```

### Backup and Restore

**Automatic Backups**:
```python
response = elasticache.create_replication_group(
    ReplicationGroupId='my-redis',
    SnapshotRetentionLimit=7,  # Keep 7 days of backups
    SnapshotWindow='03:00-05:00',  # Daily backup window
    # ...
)
```

**Manual Snapshot**:
```python
response = elasticache.create_snapshot(
    ReplicationGroupId='my-redis',
    SnapshotName='my-backup-20260131'
)
```

**Restore from Snapshot**:
```python
response = elasticache.create_replication_group(
    ReplicationGroupId='my-redis-restored',
    SnapshotName='my-backup-20260131',
    # ...
)
```

**Copy Snapshot (Cross-Region)**:
```python
response = elasticache.copy_snapshot(
    SourceSnapshotName='my-backup-20260131',
    TargetSnapshotName='my-backup-20260131-eu',
    TargetBucket='my-snapshots-eu-west-1'
)
```

## Security

### Encryption

**At Rest**:
```python
response = elasticache.create_replication_group(
    ReplicationGroupId='my-redis',
    AtRestEncryptionEnabled=True,  # Encrypts disk backups
    # ...
)
```

**In Transit**:
```python
response = elasticache.create_replication_group(
    ReplicationGroupId='my-redis',
    TransitEncryptionEnabled=True,  # TLS
    AuthToken='MySecurePassword123!',  # Required with transit encryption
    # ...
)
```

**Connecting with TLS**:
```python
import redis

redis_client = redis.Redis(
    host='my-cluster.cache.amazonaws.com',
    port=6379,
    ssl=True,
    ssl_cert_reqs='required',
    password='MySecurePassword123!'
)
```

### Redis AUTH

**Enable AUTH Token**:
```python
response = elasticache.create_replication_group(
    ReplicationGroupId='my-redis',
    TransitEncryptionEnabled=True,
    AuthToken='MySecurePassword123!',  # Min 16 chars, alphanumeric + !&#$^<>-
    # ...
)
```

**Rotate AUTH Token**:
```python
response = elasticache.modify_replication_group(
    ReplicationGroupId='my-redis',
    AuthToken='NewSecurePassword456!',
    AuthTokenUpdateStrategy='ROTATE'  # Or 'SET' for immediate
)
```

### Network Security

**VPC**:
```
ElastiCache always deployed in VPC
Cannot be publicly accessible
```

**Security Groups**:
```python
# Allow traffic from application servers
{
    'IpProtocol': 'tcp',
    'FromPort': 6379,  # Redis port (or 11211 for Memcached)
    'ToPort': 6379,
    'SourceSecurityGroupId': 'sg-app-servers'
}
```

**Subnet Groups**:
```python
response = elasticache.create_cache_subnet_group(
    CacheSubnetGroupName='my-subnet-group',
    CacheSubnetGroupDescription='Private subnets for ElastiCache',
    SubnetIds=['subnet-1', 'subnet-2', 'subnet-3']
)
```

### IAM Authentication (Redis 7+)

**Enable IAM**:
```python
response = elasticache.create_user(
    UserId='my-user',
    UserName='my-user',
    Engine='redis',
    AccessString='on ~* +@all',  # Full access
    AuthenticationMode={
        'Type': 'iam'
    }
)

response = elasticache.create_user_group(
    UserGroupId='my-user-group',
    Engine='redis',
    UserIds=['my-user']
)

response = elasticache.create_replication_group(
    ReplicationGroupId='my-redis',
    UserGroupIds=['my-user-group'],
    # ...
)
```

**Connect with IAM**:
```python
import boto3
from redis import Redis
from botocore.auth import SigV4Auth
from botocore.awsrequest import AWSRequest

# Generate IAM auth token
session = boto3.Session()
credentials = session.get_credentials()

# Connect with IAM token
redis_client = Redis(
    host='my-cluster.cache.amazonaws.com',
    port=6379,
    ssl=True,
    username='my-user',
    password=auth_token  # Generated from IAM
)
```

## Monitoring

### CloudWatch Metrics

**Key Metrics** (Redis):
- **CPUUtilization**: CPU usage (multi-threaded in cluster mode)
- **EngineCPUUtilization**: Redis main thread CPU (single-threaded)
- **DatabaseMemoryUsagePercentage**: Memory used by data
- **CacheHits**: Successful key lookups
- **CacheMisses**: Failed key lookups
- **CacheHitRate**: Hits / (Hits + Misses) × 100
- **Evictions**: Keys evicted due to memory pressure
- **ReplicationLag**: Replica lag (milliseconds)
- **NetworkBytesIn/Out**: Network traffic
- **CurrConnections**: Current connections

**Key Metrics** (Memcached):
- **CPUUtilization**: CPU usage
- **BytesUsedForCacheItems**: Memory used
- **CacheHits/CacheMisses**: Hit/miss count
- **Evictions**: Evicted items
- **CurrConnections**: Current connections

**Alarms**:
```python
cloudwatch = boto3.client('cloudwatch')

# High CPU
cloudwatch.put_metric_alarm(
    AlarmName='ElastiCache-High-CPU',
    MetricName='EngineCPUUtilization',
    Namespace='AWS/ElastiCache',
    Statistic='Average',
    Period=300,
    EvaluationPeriods=2,
    Threshold=75,
    ComparisonOperator='GreaterThanThreshold',
    Dimensions=[
        {'Name': 'CacheClusterId', 'Value': 'my-redis-001'}
    ],
    AlarmActions=[sns_topic_arn]
)

# High memory
cloudwatch.put_metric_alarm(
    AlarmName='ElastiCache-High-Memory',
    MetricName='DatabaseMemoryUsagePercentage',
    Namespace='AWS/ElastiCache',
    Statistic='Average',
    Period=300,
    EvaluationPeriods=1,
    Threshold=90,
    ComparisonOperator='GreaterThanThreshold',
    Dimensions=[
        {'Name': 'CacheClusterId', 'Value': 'my-redis-001'}
    ],
    AlarmActions=[sns_topic_arn]
)

# Low cache hit rate
cloudwatch.put_metric_alarm(
    AlarmName='ElastiCache-Low-Hit-Rate',
    MetricName='CacheHitRate',
    Namespace='AWS/ElastiCache',
    Statistic='Average',
    Period=300,
    EvaluationPeriods=2,
    Threshold=80,
    ComparisonOperator='LessThanThreshold',
    Dimensions=[
        {'Name': 'CacheClusterId', 'Value': 'my-redis-001'}
    ],
    AlarmActions=[sns_topic_arn]
)
```

### Monitoring Best Practices

**1. Cache Hit Rate**:
```
Target: >80%
Low hit rate: Review TTL, cache keys, data access patterns
```

**2. Memory Usage**:
```
Target: <90%
High memory: Scale up, eviction policy, reduce TTL
```

**3. CPU (Redis)**:
```
EngineCPUUtilization >75%: Scale up or shard
Single-threaded bottleneck
```

**4. Evictions**:
```
Evictions >0: Memory pressure
Solutions: Scale up, reduce TTL, eviction policy
```

**5. Replication Lag**:
```
Target: <1000 ms
High lag: Network issues, primary overloaded
```

## Cost Optimization

### Reserved Nodes

**Savings**: Up to 55% vs On-Demand

**Terms**:
- 1 year: ~35% discount
- 3 years: ~55% discount

**Payment**:
- No Upfront
- Partial Upfront
- All Upfront (highest discount)

**Example**:
```
cache.r6g.large On-Demand: $0.201/hr × 730 hr/month = $146.73/month
Reserved 3-year All Upfront: ~$66/month (55% savings)
Annual savings: ~$970
```

**Purchasing**:
```python
response = elasticache.purchase_reserved_cache_nodes_offering(
    ReservedCacheNodesOfferingId='offering-id',
    ReservedCacheNodeId='my-reserved-node',
    CacheNodeCount=3
)
```

### Right-Sizing

**Metrics to Monitor**:
```
DatabaseMemoryUsagePercentage consistently <50%: Over-provisioned
EngineCPUUtilization consistently <25%: Over-provisioned
```

**Recommendations**:
```
Low usage: Downsize to smaller node type
High usage: Upsize or add shards (cluster mode)
```

### Graviton2 Instances

**Savings**: ~20% vs x86 (same performance)

**Example**:
```
cache.r5.large: $0.252/hr
cache.r6g.large: $0.201/hr
Savings: 20% ($37/month per node)
```

### Global Datastore vs Multi-Region

**Global Datastore** (for DR):
```
Primary region + read-only replicas in other regions
Lower cost than separate clusters
```

**Multiple Clusters** (for active-active):
```
Full clusters in each region
Higher cost, independent operations
```

## Real-World Scenarios

### Scenario 1: Database Caching

**Requirements**:
- Reduce RDS query load
- Sub-millisecond reads
- 100 GB dataset
- 10,000 read req/sec

**Architecture**:
```
Application → ElastiCache (Redis) → RDS MySQL
                ↓ (cache miss)
            RDS MySQL
```

**Implementation**:
```python
import redis
import pymysql
import json

redis_client = redis.Redis(
    host='my-redis.cache.amazonaws.com',
    port=6379,
    ssl=True,
    password='MyPassword',
    decode_responses=True
)

db = pymysql.connect(
    host='my-rds.rds.amazonaws.com',
    user='admin',
    password='password',
    database='mydb'
)

def get_product(product_id):
    cache_key = f'product:{product_id}'
    
    # Check cache
    cached_product = redis_client.get(cache_key)
    if cached_product:
        return json.loads(cached_product)
    
    # Cache miss - query DB
    cursor = db.cursor(pymysql.cursors.DictCursor)
    cursor.execute('SELECT * FROM products WHERE id = %s', (product_id,))
    product = cursor.fetchone()
    
    # Store in cache (1 hour TTL)
    redis_client.setex(cache_key, 3600, json.dumps(product))
    
    return product
```

**Cluster Configuration**:
```
Node type: cache.r6g.large (13 GB RAM)
Cluster mode: Disabled
Replicas: 2 (Multi-AZ)
Cost: $0.201/hr × 3 nodes × 730 hr = $440/month
```

**Results**:
```
Cache hit rate: 95%
RDS queries reduced: 95% (from 10K to 500 req/sec)
Response time: <1 ms (cache hits)
```

### Scenario 2: Session Store

**Requirements**:
- Web application sessions
- 1 million concurrent users
- Session size: ~5 KB
- Session TTL: 30 minutes

**Storage Needed**:
```
1M sessions × 5 KB = 5 GB
Add 20% overhead = 6 GB
```

**Cluster Configuration**:
```
Engine: Redis (persistence for reliability)
Node type: cache.m6g.large (6.38 GB RAM)
Cluster mode: Disabled
Replicas: 1 (Multi-AZ for HA)
Cost: $0.136/hr × 2 nodes × 730 hr = $198/month
```

**Implementation**:
```python
import redis
import uuid
import json

redis_client = redis.Redis(
    host='sessions.cache.amazonaws.com',
    port=6379,
    ssl=True
)

def create_session(user_id, user_data):
    session_id = str(uuid.uuid4())
    session_key = f'session:{session_id}'
    
    session_data = {
        'user_id': user_id,
        'user_data': user_data,
        'created_at': time.time()
    }
    
    # Store with 30-minute TTL
    redis_client.setex(
        session_key,
        1800,
        json.dumps(session_data)
    )
    
    return session_id

def get_session(session_id):
    session_key = f'session:{session_id}'
    session_data = redis_client.get(session_key)
    
    if session_data:
        # Refresh TTL on access
        redis_client.expire(session_key, 1800)
        return json.loads(session_data)
    
    return None

def delete_session(session_id):
    redis_client.delete(f'session:{session_id}')
```

### Scenario 3: Gaming Leaderboard

**Requirements**:
- Real-time leaderboard
- 10 million players
- Update scores frequently
- Query top 100 instantly

**Implementation**:
```python
import redis

redis_client = redis.Redis(
    host='leaderboard.cache.amazonaws.com',
    port=6379,
    ssl=True,
    decode_responses=True
)

# Update player score
def update_score(player_id, score):
    redis_client.zadd('global_leaderboard', {player_id: score})

# Get top N players
def get_top_players(n=100):
    # ZREVRANGE: Descending order by score
    return redis_client.zrevrange(
        'global_leaderboard',
        0,
        n - 1,
        withscores=True
    )

# Get player rank
def get_player_rank(player_id):
    # ZREVRANK: Rank in descending order (0-based)
    rank = redis_client.zrevrank('global_leaderboard', player_id)
    return rank + 1 if rank is not None else None

# Get player score
def get_player_score(player_id):
    return redis_client.zscore('global_leaderboard', player_id)

# Get players around rank
def get_surrounding_players(player_id, range_size=10):
    rank = redis_client.zrevrank('global_leaderboard', player_id)
    if rank is None:
        return []
    
    start = max(0, rank - range_size)
    end = rank + range_size
    
    return redis_client.zrevrange(
        'global_leaderboard',
        start,
        end,
        withscores=True
    )
```

**Cluster Configuration**:
```
Node type: cache.r6g.xlarge (26 GB RAM)
10M players × 100 bytes/player = 1 GB
Cluster mode: Disabled
Replicas: 2 (Multi-AZ)
Cost: $0.402/hr × 3 nodes × 730 hr = $880/month
```

**Performance**:
```
Update score: O(log N) = <1 ms
Get top 100: O(log N + 100) = <1 ms
Get rank: O(log N) = <1 ms
Get score: O(1) = <1 ms
```

### Scenario 4: Rate Limiting API

**Requirements**:
- Rate limit: 1000 requests/hour per user
- 100,000 active users
- Distributed application (multiple servers)

**Implementation** (Sliding Window):
```python
import redis
import time

redis_client = redis.Redis(
    host='rate-limit.cache.amazonaws.com',
    port=6379,
    ssl=True
)

def is_rate_limited(user_id, max_requests=1000, window_seconds=3600):
    key = f'rate_limit:{user_id}'
    now = time.time()
    
    # Pipeline for atomic operations
    pipe = redis_client.pipeline()
    
    # Remove old entries outside window
    pipe.zremrangebyscore(key, 0, now - window_seconds)
    
    # Count requests in window
    pipe.zcard(key)
    
    # Execute pipeline
    _, request_count = pipe.execute()
    
    if request_count >= max_requests:
        return True
    
    # Add current request
    redis_client.zadd(key, {str(now): now})
    redis_client.expire(key, window_seconds)
    
    return False

# Usage
if is_rate_limited(user_id):
    return {"error": "Rate limit exceeded"}, 429
else:
    # Process request
    return process_api_request()
```

**Cluster Configuration**:
```
Node type: cache.m6g.large (6.38 GB RAM)
Cost: $0.136/hr × 730 hr = $99/month
```

### Scenario 5: Pub/Sub Real-Time Messaging

**Requirements**:
- Chat application
- Real-time message delivery
- 10,000 concurrent chat rooms
- 100,000 connected users

**Implementation**:
```python
import redis
import json

redis_client = redis.Redis(
    host='chat.cache.amazonaws.com',
    port=6379,
    ssl=True,
    decode_responses=True
)

# Publish message to channel
def send_message(room_id, user_id, message):
    channel = f'chat:room:{room_id}'
    
    message_data = {
        'user_id': user_id,
        'message': message,
        'timestamp': time.time()
    }
    
    redis_client.publish(channel, json.dumps(message_data))

# Subscribe to channel (worker process)
def listen_to_room(room_id):
    pubsub = redis_client.pubsub()
    channel = f'chat:room:{room_id}'
    pubsub.subscribe(channel)
    
    for message in pubsub.listen():
        if message['type'] == 'message':
            message_data = json.loads(message['data'])
            # Send to connected WebSocket clients
            broadcast_to_clients(room_id, message_data)

# Store recent messages (for history)
def store_message(room_id, message_data):
    key = f'chat:history:{room_id}'
    redis_client.lpush(key, json.dumps(message_data))
    redis_client.ltrim(key, 0, 99)  # Keep latest 100 messages
    redis_client.expire(key, 86400)  # 24 hour history

# Get message history
def get_message_history(room_id, limit=50):
    key = f'chat:history:{room_id}'
    messages = redis_client.lrange(key, 0, limit - 1)
    return [json.loads(msg) for msg in messages]
```

**Cluster Configuration**:
```
Node type: cache.m6g.large (6.38 GB RAM)
Replicas: 1 (Multi-AZ)
Cost: $0.136/hr × 2 nodes × 730 hr = $198/month
```

## Exam Tips (SAP-C02)

### Key Decision Points

**Redis vs Memcached**:
```
Need persistence → Redis
Complex data structures → Redis
Pub/Sub → Redis
Multi-AZ failover → Redis
Simple caching, multi-threading → Memcached
```

**Cluster Mode**:
```
Data >350 GB → Cluster mode enabled
Write scaling needed → Cluster mode enabled
Read scaling only → Cluster mode disabled (replicas)
```

**Node Type**:
```
Large dataset → Memory-optimized (R6g)
Cost optimization → Graviton2 (R6g, M6g)
Development → Burstable (T3)
```

**Caching Strategy**:
```
Read-heavy → Lazy loading
Write-heavy → Write-through
Best practice → Combination + TTL
```

### Common Scenarios

**"Reduce database load"**:
- ElastiCache in front of RDS
- Lazy loading pattern
- Monitor cache hit rate

**"Store user sessions"**:
- Redis (persistence)
- TTL for automatic expiration
- Multi-AZ for availability

**"Real-time leaderboard"**:
- Redis Sorted Sets
- ZADD, ZREVRANGE, ZRANK operations

**"Rate limiting"**:
- Redis Sorted Sets (sliding window)
- TTL for automatic cleanup

**"Pub/Sub messaging"**:
- Redis PUBLISH/SUBSCRIBE
- Multiple subscribers per channel

**"High availability"**:
- Multi-AZ with automatic failover
- Read replicas (up to 5)

**"Scale horizontally"**:
- Cluster mode enabled
- Add/remove shards online

**"Reduce costs"**:
- Reserved nodes (55% savings)
- Graviton2 instances (20% savings)
- Right-size based on metrics

This comprehensive ElastiCache guide covers all aspects for SAP-C02 exam success.
