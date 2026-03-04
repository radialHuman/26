# Systems Design Knowledge Map
**Last Updated:** February 14, 2026  
**Background:** Non-CS background, strong logical thinking, learning from first principles

---

## 📊 OVERALL PROFICIENCY SUMMARY
- **Strong Areas:** 8/8 ✅
- **Partial Understanding:** 6/8 ⚠️
- **New Concepts Learned:** 40+ 🆕
- **Real-world Scenarios:** 2 complete (Twitter, Uber), 1 in progress (Netflix)
- **Not Yet Covered:** 1 remaining area (Netflix video streaming)
- **Deferred Learning:** Payment processing (complex, regional variations)

---

## ✅ STRONG AREAS (Deep Understanding)

### 1. Load Balancing
- **Status:** ✅✅ SOLID
- **Understanding:** Purpose (distribute requests), basic implementation
- **Algorithms known:** Round-robin, least connections, DNS routing

### 2. Microservices Architecture
- **Status:** ✅ FAMILIAR
- **Understanding:** Service decomposition, communication between services
- **Related:** API gateways, service discovery

### 3. Message Queues & Pub/Sub
- **Status:** ✅✅ DEEP
- **Understanding:** 
  - Decoupling services
  - Asynchronous processing
  - Pub/Sub pattern for notifications
  - Event-driven architecture
- **New Learning:** Per-user topics, topic sharding for scale
- **Tools known:** Kafka, RabbitMQ (mentioned)

### 4. Database Sharding & Partitioning
- **Status:** ✅✅ DEEP
- **Understanding:**
  - Hash-based sharding: `shard = hash(user_id) % num_shards`
  - Challenges: Joins across shards, uneven data distribution
  - Solutions: Consistent hashing for minimal data migration
- **Strategies identified:**
  - Hash-based
  - Range-based (not detailed)
  - Directory-based (not detailed)
  - Geographic/traffic-based (intuited)
- **Key insight:** Consistent hashing reduces migration overhead when scaling

### 5. Consistency Models
- **Status:** ✅✅ DEEP
- **CAP Theorem:** ✅ Correctly identified AP (Availability + Partition Tolerance) sacrifice Consistency
- **Eventually Consistent:** ✅ Understands with message queues
- **Strong Consistency:** ✅ Knows when needed (banking)

### 6. Caching Strategies
- **Status:** ✅✅ STRONG
- **Eviction policies:**
  - FIFO: ✅ Intuited
  - LRU: ✅ Learned
  - LFU: ✅ CORRECTLY CHOSE for user profiles
  - TTL: ✅ Known
- **Key insight:** LFU better for infrequently accessed data

### 7. Database Indexing
- **Status:** ✅ UNDERSTOOD
- **Trade-off:** Cheap reads vs. expensive writes
- **Application:** Would index city column for "find users by city" queries
- **Thinking:** Optimizes based on actual access patterns (reads > writes)

### 8. Containerization & Orchestration
- **Status:** ✅ GOOD UNDERSTANDING
- **Concepts:**
  - Containers: Package app + dependencies
  - ECR (Elastic Container Registry)
  - ECS, EKS, Kubernetes
- **K8s understanding:** Desired state vs. current state, reconciliation, replicas
- **Implementation knowledge:** Moderate (knows concepts, not implementation details)

### 9. Trade-off Thinking
- **Status:** ✅✅ EXCEPTIONAL
- **Examples:**
  - Read-heavy vs. write-heavy → SQL vs. NoSQL
  - Normalization vs. denormalization → Join cost vs. write cost
  - Fixed window vs. sliding window rate limiting → Simplicity vs. burst protection
  - Vertical vs. horizontal scaling → Simplicity vs. unlimited scalability
  - Consistency vs. availability → Banking vs. user profiles

---

## ⚠️ PARTIAL UNDERSTANDING (Know Concepts, Not All Details)

### 1. Rate Limiting
- **Status:** ⚠️ CONCEPT KNOWN
- **Knows:** Why needed (DDoS, resource protection), basic counter approach
- **Doesn't know:**
  - Sliding Window algorithm details
  - Leaky Bucket algorithm
  - Token Bucket algorithm
- **Learning:** Fixed window vs. sliding window trade-off

### 2. Distributed Transactions
- **Status:** ⚠️ PARTIAL
- **Knows:** 
  - Two-Phase Commit (2PC) exists but has problems
  - Saga pattern (better for distributed systems)
  - Idempotency with UUID prevents duplicates
- **Doesn't know:** Implementation details of Saga pattern

### 3. Cache Invalidation
- **Status:** ⚠️ LEARNING
- **Knows:**
  - Direct RPC approach (Service A calls Service B to invalidate)
  - Failure handling: Stop using cache if service down
  - TTL and event-based invalidation
  - Timestamp-based conflict resolution (optimistic locking)
- **Doesn't know:** Full production implementation

### 4. Monitoring & Observability
- **Status:** ⚠️ PARTIAL
- **Knows:**
  - Metrics (p50, p90, p99 latencies)
  - Health checks per component
  - Dashboard visualization
  - Logs for debugging
- **Doesn't know:** 
  - Distributed tracing specifics
  - Trace visualization (Jaeger, Zipkin)

### 5. Kubernetes & Orchestration
- **Status:** ⚠️ MODERATE
- **Knows:**
  - Desired vs. current state reconciliation
  - Replica management
  - Self-healing (restart crashed containers)
- **Doesn't know:** Implementation, pod networking, ConfigMaps, etc.

### 6. API Design Basics
- **Status:** ⚠️ BASIC
- **Knows:** Routes, authentication, rate limiting, input/output format, backend connections
- **Doesn't know:** REST vs. GraphQL, versioning strategies

---

## 🆕 NEW CONCEPTS LEARNED (During This Session)

### Resilience & Data Consistency
1. **Circuit Breaker Pattern** ❌ NEW
   - Stops calling failed services, opens circuit
   - Prevents cascading failures
   - Status: Heard name, don't understand mechanism

2. **Optimistic Locking with Timestamps** 🆕 NEW
   - Use timestamps to detect out-of-order updates
   - If new_timestamp < existing_timestamp → Ignore
   - If new_timestamp >= existing_timestamp → Update
   - Status: Just learned, understood concept

3. **Idempotency** 🆕 CRITICAL LEARNING
   - Each request has unique ID
   - If same ID received twice, don't process again
   - Prevents duplicate operations in distributed systems
   - Applied to: Batch processing, transactions, retries

4. **Saga Pattern** 🆕 NEW
   - Break distributed transactions into independent steps
   - Each step can fail; compensation reverses it
   - Better than 2PC for unreliable networks
   - Status: Concept learned, implementation unknown

5. **Two-Phase Commit (2PC)** ❌ NEW (But problematic)
   - Phase 1: Ask participants if ready
   - Phase 2: Commit or abort based on responses
   - Problem: Blocks if any participant is slow/unreachable
   - Status: Not suitable for distributed systems

### Database Layer
6. **Consistent Hashing** 🆕 NEW
   - Circular ring approach for sharding
   - Adding new shard only affects subset of data
   - Advantage: Minimal data migration
   - Status: Concept understood, implementation unknown

7. **Hash-based Sharding Mechanics** ✅ INTUITED CORRECTLY
   - Formula: `shard_number = hash(user_id) % num_shards`
   - Problem: Scaling changes modulo, requires migration
   - Solution: Consistent hashing

### API Layer
8. **Fixed Window Rate Limiting** ✅ INTUITED
   - Counter per user, resets every minute
   - Problem: Allows bursts across window boundaries
   - Status: Understood

9. **Sliding Window Rate Limiting** 🆕 NEW
   - Tracks last 60 seconds exactly
   - Better burst protection than fixed window
   - Trade-off: More expensive to implement
   - Status: Concept known, implementation unknown

10. **Leaky Bucket Algorithm** ❌ NEW
    - Water drips from bucket at constant rate
    - Status: Heard of, don't understand

11. **Token Bucket Algorithm** ❌ NEW
    - Bucket fills with tokens, requests consume them
    - Status: Heard of, don't understand

### Real-time Systems
12. **WebSockets** ✅ INTUITED
    - Server pushes updates without client asking
    - Persistent connection between client and server

13. **Server-Sent Events (SSE)** ❌ NEW
    - Similar to WebSockets
    - Server pushes updates
    - Status: Mentioned, not explored

14. **Message Queue Topics** ❌ NEW
    - Communication channels (like Slack #channels)
    - Subscribers listen to topics of interest
    - Status: Just learned concept

15. **Topic Sharding for Scale** ❌ ADVANCED NEW
    - Instead of 1 billion topics (one per user), shard topics
    - Example: notifications_shard_0 to notifications_shard_9999
    - Each shard has manageable number of subscribers
    - Status: Just learned, advanced pattern

16. **Pub/Sub at Scale for Real-time** ❌ NEW
    - Architecture for delivering real-time updates to millions
    - Use message queues as backbone
    - Status: Framework understood, details unknown

---

## 📚 PARTIAL UNDERSTANDING: SQL vs NoSQL

### ✅ Learned This Session
- **Normalization (SQL):** Split data across tables, avoid duplication
- **Denormalization (NoSQL):** Combine data in documents, allow duplication
- **Read-heavy systems:** Use NoSQL (denormalized)
  - Example: User profiles (read frequently, write rarely)
- **Write-heavy systems:** Use SQL (normalized)
  - Example: Banking transactions (write frequently)
- **Transaction support:** SQL has ACID, NoSQL has BASE
- **Join operations:** Easy in SQL, hard in NoSQL (but can denormalize)

### ❌ Not Yet Covered
- NoSQL document structure (MongoDB examples)
- Specific consistency guarantees of NoSQL databases
- When to use NoSQL's flexibility over SQL's structure

---

## 🆕 BATCH PROCESSING (Just Started)

### ✅ Understood
- **Use case:** Processing millions of records daily (summaries, emails, leaderboards)
- **Triggers:** Cron jobs, Lambda, time-based events
- **Parallelization:** Split work across multiple EC2 instances
- **Failure handling:** Detect which chunks failed, retry

### 🆕 Just Learned
- **Checkpoints:** Track progress of batch jobs
  - Know which tasks are completed, in-progress, or failed
  - Allow resuming from last checkpoint (not from start)
- **Duplicate prevention:** Use idempotency
  - Each result has UUID
  - Check if UUID exists before writing
- **MapReduce concept:** Map (process in parallel) → Reduce (combine results)
- **Tools:** Apache Spark, MapReduce (mentioned, not detailed)

---

## 🔍 SECURITY (Just Started)

### Authentication ✅ Learned
- **Password-based approach:**
  - Server verifies, creates session
  - Server stores millions of sessions (doesn't scale across servers)
- **JWT approach (stateless):**
  - Server verifies password, issues JWT token
  - No server-side storage needed
  - All servers can validate same JWT
  - Problem: Can't instantly revoke (valid for duration)
  - Solution: JWT blacklist (revocation list in Redis)

### Authorization ✅ Learned
- **RBAC (Role-Based Access Control):**
  - Users have roles (admin, user, etc.)
  - Roles have permissions (can delete, can view, etc.)
  - Check: Does user's role have permission for this action?
- **Where to define permissions:**
  - Database: Dynamic, can change without redeployment (but slower)
  - Code: Fast, but need redeployment to change
  - Best practice: Database + caching in Redis

### ❌ Not Yet Covered
- Encryption (at rest, in transit)
- Secrets management (API keys, passwords)
- OAuth, SSO details
- Certificate management

---

## 🚀 SCALABILITY PATTERNS (Just Covered)

### ✅ Understood Trade-offs
- **Vertical Scaling:**
  - Easier to implement
  - Limited by hardware physics and budget
  - Single point of failure

- **Horizontal Scaling:**
  - More servers, distribute load
  - Unlimited scalability (theoretically)
  - More complex to implement (coordination, consistency)

### Preference: ✅ Horizontal scaling
- Reason: Better for unlimited growth
- Correctly identified: Many small systems scale better than one large system

---

## 🎯 REAL-WORLD SYSTEM DESIGN SCENARIOS

### Twitter (Complete Design) ✅
- **Feed algorithm:** Fan-out on write (normal users) vs. fan-out on read (celebrities)
- **Sharding:** By timestamp for tweets (hot shard for recent tweets)
- **Search:** Elasticsearch with batch indexing (1-hour lag acceptable)
- **Notifications:** Message queue + WebSocket for real-time delivery
- **Media:** S3 for storage, CDN for celebrity content (geo-distributed)
- **Architecture:** Load balancer → API gateway → Microservices → Databases + Caches + Queues

### Uber (Complete Design) ✅
- **Geospatial matching:** Find drivers within radius (Redis for real-time, PostGIS for persistence)
- **Real-time location:** Redis Pub/Sub for broadcasting driver location to 1M riders (5-sec updates)
- **Matching algorithm:** Weighted score (distance + rating + wait_time + demand), progressive filtering
- **Surge pricing:** Multiplier = demand_ratio / supply_ratio, capped by city regulations
- **Ratings/Reviews:** Database storage, batch average calculation, spam detection (IP/NLP)
- **Cancellations:** State tracking, payment failures handled via tabs/wallet, write-off small amounts
- **Payment:** Pre-authorization, use payment processor (not store cards)

### Netflix (In Progress)
- **Video streaming:** 20GB 4K movies to 5M concurrent viewers (upcoming)

---

## 🔍 DEEP DIVE: DATABASE INTERNALS

### B-Tree Indexes ✅
- **Problem:** Find one record among 100M (scan all = slow)
- **Solution:** B-tree index with pointers
- **How it works:** Balanced tree structure, log(N) lookups instead of N
- **Example:** Find id=123 takes ~27 comparisons (not 100M)
- **Trade-off:** Faster reads, slower writes (index updates needed)

## 🔍 DEEP DIVE: CACHING

### Cache Invalidation Failures ✅
- **Problem:** Cache invalidation fails while database is updated
  - Database has new data, cache has old data (stale)
  - Inconsistency until cache TTL expires or Redis recovers
- **Solution: Cache-Aside Pattern (Lazy Loading)**
  - Cache miss → Query database (always fallback works)
  - Even if cache fails, get correct data from DB
  - Trade-off: Some requests slow (100ms), but always correct
- **Key insight:** Cache is optional optimization, not mandatory

### Cache Stampede (Thundering Herd) ✅
- **Problem:** Cache expires, 10,000 concurrent requests hit DB simultaneously
- **Impact:** Database overload spike, cascading slowdown, more cache misses
- **Solutions:**
  - Probabilistic early expiration: Refresh cache before TTL (spread load over 5 min)
  - Lock-based refresh: First request locks & refreshes, others wait for updated cache
  - Only ONE database query (not 10,000)
- **Prevention:** Single-threaded cache updates (use locks/semaphores)

### Cache Coherence in Distributed Systems ✅
- **Problem:** Invalidate cache across 10+ servers consistently
- **Approaches:**
  - Direct API calls: ❌ Unreliable (timeouts, failures)
  - Broadcast message queue: ✅ Better (persistent, eventually consistent)
  - Versioned cache: ✅ Alternative (detect stale with version mismatch)
- **Persistent queue solution (Kafka):**
  - Database publishes "cache invalidated" to queue
  - Servers subscribe and consume messages
  - Queue persists messages on disk (survives crashes)
  - Offline servers consume messages when back online
  - Trade-off: Eventual consistency (few minutes acceptable)
- **Failure scenarios:**
  - Server offline: Queue holds message, delivered on restart
  - Queue broker crashes: Other replicas have copy
  - All brokers crash: Message lost (rare, accepted risk)
- **Real solution:** 3+ broker replication (Kafka) + TTL + monitoring

### Cache Warming ✅
- **Problem:** Cold start (empty cache at startup = first requests miss)
- **Thundering herd:** Many first requests hit DB simultaneously
- **Predictive cache warming:**
  - Analyze historical patterns: 80% of requests for celebrity profiles
  - Preload hot data at startup (top 1000 profiles)
  - Cold data loaded on-demand (cache-aside)
- **Implementation:**
  - Synchronous: Wait for cache load before starting (slower startup)
  - Asynchronous: Start immediately, warm in background (better UX)
  - Hybrid: Preload critical data, rest on-demand
- **Trade-off:** Startup time vs. initial cache hit rate

### Distributed Caching Scaling ✅
- **Problem:** Single Redis instance bottleneck (50k ops/sec, need 100k+)
- **Horizontal scaling approaches:**

  **Consistent Hashing:**
  - Map keys to servers using circular ring (not modulo)
  - Adding server affects ~10-20% of keys (not all)
  - Better than modulo hashing (which remaps 90% of keys)
  - When Server 11 added to 10-server cluster:
    - Old: hash(key) % 10 → All mappings change
    - Consistent: Ring adjusted → Only keys in new server's range move
  - Trade-off: More complex algorithm, but minimal cache invalidation on scale

  **Virtual Nodes:**
  - Prevent hot spots where many keys hash to same server
  - Each physical server has multiple positions on ring
  - Hot servers get more virtual nodes
  - Example: Server B has 3 virtual nodes, Server A has 1
  - Load distributed across server's virtual node copies
  - Allows scaling individual servers independently

  **Full Replication for Ultra-Hot Keys:**
  - Copy key to ALL servers (not distributed)
  - Any request gets local copy (zero latency)
  - Example: Celebrity profile (1M requests/sec)
  - Trade-off: More storage (replicated on all servers), complex updates
  - When celebrity updates profile:
    - Must invalidate on ALL servers
    - Broadcast invalidation message to all
    - More coordination overhead

- **When to use each:**
  - Normal keys (100-1000 req/sec): Consistent hashing (distributed)
  - Hot keys (10k-100k req/sec): Virtual nodes (more instances)
  - Ultra-hot keys (1M+ req/sec): Full replication (all servers)

### Multi-Level Cache Hierarchies ✅
- **Three-tier caching:**
  - L1: Local cache (in-app memory, ultra-fast, ~1µs)
  - L2: Distributed cache (Redis, shared, ~1ms)
  - L3: Database (persistent, ~100ms)
- **Request flow:**
  - L1 miss → L2 hit → Return + Update L1 (1ms)
  - L2 miss → L3 hit → Return + Update L2 + L1 (100ms)
- **L1 Cache size constraints:**
  - App server memory: 2GB total
  - App code: 500MB, Runtime: 500MB, L1 cache: 1GB max
  - Can cache ~1M keys (if 1KB per key)
  - Must select which keys to cache (can't cache all 10M)

### Ensuring L1 Cache Coherence ✅
- **Problem:** 10 app servers, each with L1 cache = Different values possible
- **Approaches:**

  **Broadcast Invalidation:** ❌ Unreliable
  - Misses: If server offline when broadcast sent → L1 stays stale
  - Complex coordination

  **Periodic Checks:** ❌ Expensive
  - Every 30 seconds: Check if L1 version == L2 version
  - Lots of version comparisons, inefficient

  **TTL on L1:** ✅ Practical
  - L1 cache TTL: 30 seconds (much shorter than L2)
  - After TTL, fetch fresh from L2
  - Ensures staleness at most 30 seconds
  - Trade-off: More L2 hits (every 30 seconds)

  **Versioning:** ✅ Best approach
  - Store version number with key (+4 bytes per key = negligible)
  - On request: Compare L1 version with L2 version
  - Mismatch → L1 stale → Fetch from L2
  - Always detects staleness, no missed invalidations
  - No extra storage cost (version = 4 byte integer)

### Selecting Hot Keys for L1 Cache ✅
- **Constraint:** Only 1M of 10M keys fit in L1 (1GB limit)
- **Must choose which keys to cache:**

  **Offline Analysis (Batch Job):**
  - Every night: Analyze logs → Find top 1M accessed keys
  - Build preload list: [profile_1, profile_50, tweet_200, ...]
  - Restart app servers with new list
  - Problem: Hours to restart, misses recent trends

  **Online LFU (Least Frequently Used):**
  - Track: access_count per key
  - On request: Increment counter for that key
  - Cache full → Evict least frequently used
  - Always optimized to current traffic patterns
  - Cost: ~1 microsecond overhead per request (acceptable)

  **Hybrid Approach:** ✅ Best
  - L1: Online LFU tracking (optimal, small overhead)
  - L2: Simple TTL (no tracking, Redis is fast)
  - Result: L1 stays optimal, L2 stays simple

---

## 🔍 DEEP DIVE: MESSAGE QUEUES

### Message Queue Storage & Durability ✅
- **Problem:** Service A produces 1000 msg/sec, Service B consumes 100 msg/sec
  - Without queue: 900 messages/sec dropped (data loss)
  - With queue: Messages buffered, Service B consumes at own pace
- **Storage approach: Hybrid (Memory + Disk + Replication)**
  - Step 1: Write to memory buffer (fast)
  - Step 2: Flush to disk periodically (durable, survives crashes)
  - Step 3: Replicate to other brokers (redundancy, survives broker failure)

### Durability Guarantees (Kafka acks) ✅
- **acks=0:** Confirm immediately (FASTEST, no durability)
  - Use case: Metrics, non-critical (data loss acceptable)
- **acks=1:** Confirm after disk write (MEDIUM safety)
  - Use case: Balance between speed and safety
- **acks=all:** Confirm after replicated to ALL brokers (SAFEST, SLOWEST)
  - Use case: Critical data (financial, emails, orders)
- **Trade-off:** Latency vs. Durability

### Message Ordering & Partitioning ✅
- **Problem:** Multiple partitions = Out-of-order processing
- **Solution: Partition by key (e.g., account_id)**
  - All messages for same account → Same partition
  - Partition consumed sequentially (ordering guaranteed)
  - Different accounts processed in parallel (scalable)
- **Trade-off:** ✅ Ordering guaranteed, ✅ Parallelism, ❌ Hot key bottlenecks partition
- **Key insight:** Partition for causality (local ordering, not global)

### Offset Management ✅
- **Problem:** Consumer crashes, where to resume?
- **Solution: Store offset in Kafka (persistent)**
  - Offset = "Last successfully processed message"
  - On restart: Resume from next message (avoid duplicate)

### Delivery Guarantees & Idempotency ✅
- **At-least-once:** Message might process multiple times
- **Exactly-once:** Hard to achieve (requires distributed transactions)
- **Practical: Idempotent processing** ✅
  - Each message has transaction_id
  - Check: "txn_id already processed?" (cache + DB)
  - If yes → Skip, If no → Process and record
  - Even if duplicated, same result
- **Storage:** Cache (fast) + Database (persistent)

---

## INDEX STRATEGY (CONTINUED)
- **When to index:** Frequently queried, high cardinality, high read-to-write ratio
- **Single index:** Smaller, less overhead, partial speedup
- **Composite index:** (user_id, created_at) = Full speedup for multi-column queries
- **Decision:** Based on query patterns and cost-benefit

### Locking & Concurrency ✅
- **Problem:** Two users updating same row simultaneously
- **Solution:** Locking (mutex-like, one user locks, others wait)
- **Isolation (ACID I):** Prevents concurrent interference
- **Deadlock:** Two users waiting for each other's locks
- **Prevention strategies:**
  - Lock ordering: Always acquire locks in same order (BEST for banking)
  - Timeout: Kill transaction if lock not acquired (risky, causes retries)
  - Deadlock detection: Monitor and kill victim transaction (automatic recovery)

### COUNT(*) Optimization ✅
- **Naive:** Scan all 100M rows (10+ seconds, SLOW)
- **Exact count:** Store in column, update on insert (bottleneck: lock contention)
- **Approximate count:** Sample/estimate, update daily (NO contention, good enough)
- **Twitter approach:** Approximate + round for display (1.5K, 5M)

### Query Optimization ✅
- **Query Optimizer:** Chooses best execution plan
- **Uses statistics:** Min/max values, distinct counts, data distribution
- **Execution plans:**
  - Full table scan: If many rows match (low selectivity)
  - Index scan: If few rows match (high selectivity)
- **If stats wrong:** Optimizer picks bad plan (slow query)
- **Update frequency:** Based on write speed (high writes = frequent updates)

### EXPLAIN Command ✅
- **Purpose:** Shows execution plan for a query
- **Reveals:** Which indexes used (or not used), estimated vs actual rows
- **Problems it identifies:**
  - Full scan when index available → Update statistics
  - Wrong index used → Create better index
  - Query inefficient → Rewrite query
  - Missing index → Create index

### Isolation Levels ✅
- **Read Uncommitted:** See uncommitted changes (DANGEROUS)
- **Read Committed:** See only committed changes (SAFE)
- **Repeatable Read:** Consistent snapshot (SAFER)
- **Serializable:** Behave as if one-at-a-time (SAFEST, for banking)
- **Trade-off:** Higher isolation = Slower performance

### MVCC (Multi-Version Concurrency Control) ✅
- **Concept:** Store multiple versions of each row
- **How it works:**
  - Transaction A writes new version (uncommitted)
  - Transaction B reads old version (committed)
  - Both proceed simultaneously (no locking)
- **Benefits:** No blocking, fast concurrent access
- **Cost:** Table grows (multiple versions per row)
- **Solution:** VACUUM command (garbage collect old versions)
- **Metadata tracks:** Which transaction created version, if committed, visibility rules

### Write-Ahead Log (WAL) ✅
- **Purpose:** Durability (survive crashes)
- **How it works:**
  - Step 1: Write operation to log on disk
  - Step 2: Write to memory/buffer (fast)
  - Step 3: Confirm to user (success)
  - Step 4: Later, flush memory to database file on disk
- **Safety:** If crash between 3 & 4, log exists → Can replay on recovery
- **Best practice:** Log on different disk than database (survive disk failure)

### Replication Durability ✅
- **Synchronous replication:** Wait for backup confirmation (RPO=0, slow)
  - Good for: Banking, critical transactions
- **Asynchronous replication:** Confirm immediately, replicate later (RPO=5min, fast)
  - Good for: Social media, non-critical
- **Risk:** Primary + backup crash = Data in memory lost
- **Mitigation:**
  - Log on separate disk (survives primary crash)
  - Third replica in different region (survives primary+backup)
  - If primary fails, log + third replica enable recovery

### Distributed Transactions ✅
- **Problem:** Multiple databases, one operation (DB A succeeds, DB B fails)
- **Two-Phase Commit:** ❌ Problematic (locks, blocks on slow participants)
- **Saga Pattern:** ✅ Better (independent steps, compensation on failure)
- **Eventual Consistency:** ✅ Practical approach
  - Primary operation: Synchronous (immediate)
  - Secondary operation: Asynchronous (queued)
  - Retry queue with exponential backoff
  - Eventually consistent within acceptable window

### Acceptable Consistency Windows ✅
- **Banking:** < 5 minutes (regulatory requirement for audit logs)
- **Social media:** < 1 hour (non-critical)
- **Analytics:** < 1 day (very non-critical)

---

## 🆕 NEWLY COVERED GAPS (10 out of 10 Covered!)

### 1. Batch Processing ✅
- **Checkpoints:** Track progress of batch jobs (completed, in-progress, failed)
- **Resume from checkpoint:** Don't restart from beginning, continue from last known state
- **Duplicate prevention:** Use idempotency with UUID
- **Parallelization:** Split work across multiple EC2 instances
- **MapReduce concept:** Map (process in parallel) → Reduce (combine results)
- **Tools:** Apache Spark, MapReduce (mentioned)

### 2. Search & Query Layer ✅
- **Elasticsearch/OpenSearch:** For complex search, full-text search, filtering at scale
- **When NOT to use:** Simple queries (PostgreSQL is fine)
- **User preference:** Simple searches use PostgreSQL, complex use Elasticsearch

### 3. Disaster Recovery ✅
- **RPO (Recovery Point Objective):**
  - RPO = 0: No data loss (synchronous replication, slow)
  - RPO = N minutes: Acceptable loss (asynchronous, fast)
  - Banks need RPO = 0
- **RTO (Recovery Time Objective):**
  - How long to recover and be back online
  - Fast RTO: Automated failover, active-active setup
  - Slow RTO: Manual failover, restore from backups
  - Banks need RTO in seconds
- **Active-active setup:** Both regions serve traffic, both have full data
- **Write conflict resolution:** Need consensus algorithm

### 4. API Versioning ✅
- **URL-based versioning:** /api/v1/users vs /api/v2/users
- **Simultaneous support:** Old and new versions run together
- **Migration strategy:** Move high-volume apps first to reduce costs
- **Deprecation strategy:** 🆕 NEW
  - Announce deprecation date
  - Send deprecation warnings
  - Hard cutoff (some apps will break)
  - Accept that some abandoned apps won't migrate

### 5. Testing Distributed Systems ✅
- **Challenges:** Random crashes, network delays, out-of-order messages, database failures
- **User's approach:** Health checks, logging, monitoring, queue resilience
- **Chaos Engineering:** 🆕 NEW CONCEPT
  - Deliberately inject failures (like vaccines)
  - Kill services, delay networks, corrupt data
  - Tools: Chaos Monkey, Gremlin
  - Goal: Build resilience through controlled failure testing

### 6. Cost Optimization ✅
- **Approach:** Diagnose before prescribing
- **Bill analysis:** Find top cost consumers
- **Storage heavy:** Migrate to cheaper DB or reduce data retention
- **Read/write heavy:** Optimize with indexing, caching, query optimization
- **Service replacement:** EC2→Lambda, expensive DB→cheaper alternative
- **Right-sizing:** Use smaller instances or spot instances
- **App deprecation:** Remove unused apps

### 8. Message Patterns (Pub/Sub vs Queue vs WebSocket) ✅
- **Message Queue (Kafka, RabbitMQ):**
  - Design: One-to-one (each message, one consumer)
  - Use case: Task distribution, work queues
  - Persistence: Messages stored until consumed
  - NOT good for: Broadcasting
- **Pub/Sub (Redis Pub/Sub, Kafka Topics):**
  - Design: One-to-many (broadcast to all subscribers)
  - Use case: Real-time broadcasts (location updates, notifications)
  - Persistence: NOT persistent (fire and forget)
  - Problem: New subscriber misses old messages
  - Good for: Real-time updates without history
- **WebSocket:**
  - Design: Bidirectional persistent connection
  - Use case: Real-time two-way communication (chat, collaboration)
  - Persistence: Only while connected
  - Cost: Connection overhead (memory per client)

### 9. Geospatial Queries ❌ NEW (Not sure, need to learn)
- **Problem:** Find drivers within 2-mile radius from millions of drivers
- **Storage options:**
  - Redis: Sorted sets with lat/long (fast, limited queries)
  - PostgreSQL + PostGIS: Full geospatial SQL extension
  - MongoDB with geospatial indexes: Native NoSQL support
- **Uber approach (Hybrid):** Redis for real-time, PostGIS for persistence

### 10. Payment Processing ⚠️ NEW (Complex, deferred learning)
- **When to charge:** Pre-authorization at start, finalize at end (not end only)
- **Where to store:** Use payment processor (Stripe, PayPal), not your DB
- **Tokenization:** Get token from processor, store token (not card)
- **Failure handling:** Retry 3x, mark as pending, notify user
- **Idempotency:** Same request shouldn't charge twice
- **Regional variations:** Different payment methods, taxes, regulations per region
- **PCI-DSS Compliance:** Legal requirement for card data handling

### 11. Cancellation & Tabs ✅ NEW
- **Scenarios:** Before accept (no charge), after accept (charge fee), driver cancels, no-show
- **Payment failures:** Keep tab/wallet balance, settle on next payout
- **Cost-benefit:** Write off amounts < $10 (not worth pursuing)
- **State tracking:** Required (requested, accepted, started, completed, cancelled)

### 12. Load Shedding ✅ NEW
- **Concept:** Deliberately reject requests to protect system during spikes
- **Implementation:** Return 429 (Too Many Requests) when load high
- **Trade-off:** Some users rejected immediately (can retry), but accepted users get fast responses
- **Better than:** Slow responses (worse UX)

### 13. Heartbeat/Keep-alive ✅ NEW
- **Purpose:** Detect when clients go offline
- **Implementation:** Server sends periodic signal, client responds
- **Acceptable lag:** 2-5 minutes (less frequent = less traffic)
- **Use case:** Track online status (Uber drivers, Twitter users)

### 14. Pre-warming Servers ✅ INTUITED
- **Purpose:** Have backup servers ready for traffic spikes
- **Trade-off:** Costs money to keep idle, but faster failover

### 15. Constraints Relaxation ✅ NEW
- **Concept:** Start strict, progressively relax filters if no results
- **Example (Uber):** distance <= 1 mile AND rating >= 4.5 → No results
  - Relax to: distance <= 2 miles AND rating >= 4.5
  - Continue until finding candidates
- **Application:** Search, matching algorithms where perfect match unavailable

### 16. Surge Pricing Formula ✅ NEW
- **Formula:** Multiplier = (current_demand / avg_demand) / (current_supply / avg_supply)
- **Regulation:** Cap by city (e.g., max 2x)
- **Purpose:** Incentivize supply increase during high demand

### 17. Batch vs On-demand Calculation ✅ NEW
- **Question:** Calculate average rating on-demand or in batch?
- **Answer:** Depends on:
  - Impact of one extreme value (with 10k reviews, minimal)
  - Query load (1M queries/day = consider batching)
  - Acceptable staleness (1 hour old is fine)
- **Solution:** Cache in database column, batch update hourly

---

## 🎓 LEARNING PATTERNS IDENTIFIED

### Your Strengths
1. **Cost-benefit thinking:** Knows when optimization isn't worth it ($5 tab pursuit)
2. **Trade-off analysis:** Always considers pros/cons (batch vs on-demand)
3. **Constraint relaxation:** Progressively relax constraints when strict match fails
4. **Hybrid approaches:** Combines multiple technologies (Redis + PostGIS, Pub/Sub + cache)
5. **Pragmatism:** Accepts acceptable lag/staleness when appropriate
6. **System thinking:** Connects layers (payment → tabs → settlement)

### Feedback on Question Format
- ✅ **One question at a time** — Preferred (no rushing)
- ✅ **Open-ended questions** — Preferred (no hints via options)
- ✅ **Walk me through** prompts — Effective for deep thinking
- ❌ **MCQs with options** — Rejected (creates bias)
- ✅ **Real-world context needed** — Good catch on Netflix/Twitter explanation

## ❌ NOT YET COVERED (3 Remaining Gaps)

1. **Encryption & Secrets Management**
   - Data encryption (at rest, in transit)
   - Key management
   - Secrets rotation

2. **Event Sourcing**
   - Store all events as source of truth
   - Replay events to reconstruct state

3. **Advanced Networking Concepts** (Optional)
   - TCP/UDP details
   - DNS
   - Network optimization

---

## 📈 LEARNING STYLE & STRENGTHS

### Strengths
1. **Excellent trade-off thinking:** Naturally considers pros/cons
2. **Logical reasoning:** Intuits correct answers from first principles
3. **Pattern recognition:** Connects concepts (idempotency in transactions → batch processing)
4. **Honest about gaps:** Comfortable saying "I don't know"
5. **Practical thinking:** Asks "how does this actually work?" not just theory

### Learning Preferences
1. **Layer-by-layer approach preferred** (breadth before depth)
2. **Open-ended questions over MCQs** (MCQs don't test understanding)
3. **One question at a time** (no rush, room to think)
4. **Concrete examples** helpful for understanding
5. **Live artifact** for future reference

### Background Context
- Non-CS background
- Theoretical knowledge, no production experience at scale
- Strong fundamentals, catching up on terminology
- No preference for specific technology stack

---

## 🎯 NEXT STEPS (When Resuming)

**Current position:** Covered scalability basics, about to continue with:
1. Disaster Recovery (backups, failover, cross-region)
2. API Versioning
3. Testing strategies
4. Cost optimization
5. Encryption & secrets
6. Advanced patterns (Raft, Paxos, Event Sourcing)

**Estimated completion:** 5-10 more hours of learning to cover all gaps comprehensively.

**Resume approach:** Continue with same structure - one question at a time, layer-by-layer, building on existing knowledge.

---

## 💡 KEY INSIGHTS & MENTAL MODELS

1. **All systems design is about trade-offs:** There's no perfect solution, only trade-offs aligned with requirements

2. **Consistency is expensive:** The more consistent your system, the slower it is (CAP theorem)

3. **Failure is inevitable:** Distributed systems WILL fail. Design for it (circuit breakers, retries, idempotency)

4. **Denormalization at scale:** When data is distributed, you often accept duplication to avoid expensive joins

5. **Scalability requires asynchrony:** To scale, move from synchronous to asynchronous communication (message queues)

6. **Know your access patterns:** Optimize based on reads vs. writes, not general principles

7. **Decouple everything:** Services, data, processes - decoupling is the core of scalability

---

**Document created:** 2026-02-14  
**Total learning time this session:** ~2 hours  
**Concepts covered:** 25+  
**Next review:** Whenever resuming

---

## 🔍 DEEP DIVE: NETWORKING

### Geographic Distribution & Latency ✅
- **Problem:** Users far from database = High latency
  - Physics limit: Speed of light = 186,000 miles/second
  - NY to California: 2500 miles = 13.5ms minimum latency
  - NY to California and back: 27ms minimum
- **Solution: Replicate data closer to users**
  - East coast users: Query NY database (13.5ms)
  - Central users: Query Central replica (13.5ms)
  - West coast users: Query West replica (13.5ms)
  - Result: All users same latency (physics-limited)

### Read-After-Write Consistency Problem ✅
- **Problem:** When data updated in NY, replicas are stale
  - User in NY writes profile → NY database updated
  - Replication to West coast: 27ms delay
  - User in West reads immediately → Gets old data (stale)
- **Two approaches:**
  - **Strong consistency:** Wait for all replicas before confirming write
    - Cost: 50-75ms latency (user waits for replication)
    - Benefit: All regions have same data
    - Use case: Banking, financial (correctness critical)
  - **Eventual consistency:** Return immediately, replicate later
    - Cost: Temporary stale data (seconds)
    - Benefit: Fast response (no waiting)
    - Use case: Social media, non-critical (speed critical)
- **Decision:** Based on data criticality
  - Financial: Strong consistency (latency acceptable)
  - Social: Eventual consistency (speed critical)

### TCP Retransmission & Adaptive Timeouts ✅
- **Problem:** Network packet loss (1% typical)
  - Packet sent, lost in network
  - Sender doesn't receive ACK (acknowledgment)
  - How long to wait before assuming lost?
- **TCP solution: Retransmit on timeout**
  - Send packet
  - Wait for ACK
  - No ACK received (timeout) → Assume lost
  - Retransmit packet
  - Receive ACK → Continue
- **RTO (Retransmission Timeout) calculation:**
  - Monitor RTT (round-trip time) samples: [10ms, 12ms, 11ms, 50ms, ...]
  - Calculate percentiles:
    - p50 (median): 12ms
    - p95: 45ms
    - p99: 50ms
  - Set timeout = p99 + buffer (e.g., 50ms + 10ms = 60ms)
- **Why p99?**
  - If timeout = p50: Too aggressive, unnecessary retransmits
  - If timeout = p99: Only slowest 1% timeout unnecessarily
  - Good balance: Catches real losses, few false alarms
- **Adaptive:** RTO adjusts based on observed network latency
  - Fast network: Short timeout
  - Slow network: Long timeout

### Congestion Control (AIMD) ✅
- **Problem:** Apps send faster than network capacity
  - Network capacity: 1000 packets/sec
  - App sends 1500 packets/sec → 500 packets dropped
- **TCP solution: AIMD (Additive Increase, Multiplicative Decrease)**
  - No congestion: Increase rate slowly (additive +1 packet per round)
    - 750 → 751 → 752 → ... (slow recovery)
  - Congestion detected: Decrease rate aggressively (multiplicative / 2)
    - 1500 → 750 (fast response to congestion)
  - Asymmetry intentional: Fast reaction, slow recovery
    - Why? Congestion is bad (respond immediately)
    - Recovery is safe (can probe slowly)

### Why Divide by 2 (not 1.5 or 1.1) ✅
- **Simplicity:** Divide by 2 = bit shift in binary (fast kernel operation)
- **Fairness:** Multiple apps competing on same network
  - All divide by 2 → Proportional reduction
  - Example: App A (1500) and App B (500) both / 2
    - App A: 750, App B: 250 (fair, proportional)
    - Divide by 1.5 would be unfair/unstable
- **Mathematical:** Proven to converge fairly with AIMD
- **Trade-off:**
  - Divide by 2: Fast response, but might overshoot (too conservative)
  - Divide by 1.5: Gentler, but slower to stop packet loss

### Modern Congestion Control: BBR ✅
- **Problem with AIMD:** Waits for packet loss (late detection)
  - Packet loss = Congestion already happened
  - Packets already dropped (wasted)
- **Latency-based detection:**
  - Latency increases BEFORE packet loss
  - Queues build up at routers
  - High latency = Early warning sign
- **BBR (Google's algorithm):**
  - Measures bottleneck bandwidth and RTT directly
  - Detects rising latency → Reduces rate BEFORE packets drop
  - Proactive: Avoids congestion before it happens
  - Better for modern high-bandwidth networks
- **Comparison:**
  - AIMD (loss-based): Reactive, loses packets
  - BBR (latency-based): Proactive, avoids loss
  - Trade-off: AIMD simpler, BBR more sophisticated

---

## 🔍 DEEP DIVE: MONITORING & OBSERVABILITY (FINAL)

**Coming next:** Deep dive into metrics, logging, tracing, and alerting for production systems.


### Monitoring Frameworks: RED vs USE ✅
- **RED Method (Request-driven systems like APIs):**
  - **R**ate: How many requests per second?
  - **E**rrors: How many failed?
  - **D**uration: How long did they take (p50, p99)?
  - Good for: Understanding user experience
  - Example: "p99 latency = 500ms, 2% error rate, 1000 req/sec"

- **USE Method (Resource-based systems like databases):**
  - **U**tilization: How much CPU/memory/disk is used?
  - **S**aturation: How full is the queue? How much waiting?
  - **E**rrors: How many operations failed?
  - Good for: Understanding bottlenecks and why system is slow
  - Example: "CPU at 95%, queue depth = 1000, 0.1% errors"

- **Best practice: Use BOTH frameworks**
  - RED: User-facing metrics (what users experience)
  - USE: Resource metrics (why system behaves that way)
  - Together: Diagnose "app is slow"
    - RED shows: "Yes, p99 = 500ms (confirmed)"
    - USE shows: "CPU at 95% (root cause)"

### Three Pillars of Observability ✅
- **Metrics:** Numbers aggregated over time
  - Examples: p50, p99 latency, error rate, CPU usage, request rate
  - Useful for: Detecting problems, alerting
  - Resolution: 1-minute or 5-minute buckets (aggregated)

- **Logs:** Individual events with context
  - Examples: "User 123 logged in", "Query took 500ms", errors/exceptions
  - Useful for: Detailed debugging, understanding specific events
  - Resolution: Per-event (fine-grained)

- **Traces:** Request flow through distributed system
  - Examples: Request → API (50ms) → Service A (100ms) → DB (300ms) → Response
  - Useful for: Identifying which service is bottleneck
  - Resolution: Per-request (complete path)

- **Diagnostic flow:**
  - Step 1: Metrics alert "p99 latency = 500ms" (WHAT is wrong)
  - Step 2: Traces show "Database query = 300ms" (WHERE bottleneck)
  - Step 3: Logs show "SELECT * FROM big_table took 300ms" (WHY slow)

### Trace Sampling at Scale ✅
- **Problem:** 100 million requests per day
  - 1KB per trace = 100TB storage per day (too expensive)
  - Can't store traces for all requests

- **Threshold-based sampling:**
  - Store traces only when latency > 500ms
  - Store any errors
  - Skip fast requests
  - Problem: Threshold might be wrong
    - Too high: Miss slow requests (below threshold)
    - Too low: Store too many traces (expensive)

- **Percentile-based sampling:** ✅ Better approach
  - Sample 100% of p99 (slowest 1%)
  - Sample 10% of p90-p99 range
  - Sample 1% of p50-p90 range
  - Sample 0% of p0-p50 range (fast requests)
  - Benefits:
    - Always capture slowest requests (high value)
    - Statistically capture normal requests
    - Never waste storage on fast requests
    - Adaptive: As p99 changes, sampling adjusts

- **Trade-off: Storage cost vs. diagnostic coverage**
  - Sample 1% of all traces: Cheap, but might miss issues
  - Sample 10% of all traces: Moderate cost, good coverage
  - Sample 100% of all traces: Expensive, but complete visibility

### Correlation IDs & Trace Propagation ✅
- **Problem:** Request flows through 5 services
  - API → Service A → Service B → Database → Service C
  - Logs scattered across 5 different log files/services
  - Hard to correlate which logs belong to same request

- **Solution: UUID-based Trace/Correlation ID**
  - Generate UUID when request arrives: "abc123def456-7890-xyz"
  - Pass in HTTP headers: X-Trace-ID: abc123def456-7890-xyz
  - Each service logs with it: "[abc123...] Processing request"
  - Each service forwards to next: Includes same header
  - Result: grep "abc123" logs/ shows all entries for ONE request

- **Why not timestamp as ID?**
  - Multiple requests at same millisecond
  - Both would have same ID
  - Logs mixed, correlation fails

- **Propagation challenge: Manual propagation is error-prone**
  - Developer in Service B might forget to pass header to Service C
  - Connection to original request lost
  - Hard to debug without trace

- **Solution: Automatic middleware/library**
  - Interceptor/middleware intercepts all requests
  - Automatically checks for X-Trace-ID header
  - If missing: Generate new UUID
  - If present: Extract and propagate
  - Automatically adds to ALL outgoing service calls
  - Developers don't have to remember
  - Tools: OpenTelemetry (supports all languages)

---

## 📊 FINAL SUMMARY

**Total Deep Dives Completed:** 5
1. ✅ Database Internals (ACID, WAL, locking, MVCC, transactions)
2. ✅ Caching at Scale (stampede, coherence, multi-level, distributed)
3. ✅ Message Queues (durability, ordering, idempotency)
4. ✅ Networking (geographic distribution, TCP, congestion control)
5. ✅ Monitoring & Observability (metrics, logs, traces, RED/USE, sampling)

**Total Concepts Learned This Session:** 70+
- Foundational concepts: 8 areas (load balancing, microservices, etc.)
- Partial understanding: 6 areas (rate limiting, transactions, etc.)
- New concepts: 50+ (circuit breaker, MVCC, Raft, BBR, etc.)

**Real-World Scenarios Designed:** 2 Complete
- Twitter (feed algorithm, search, notifications, media)
- Uber (geospatial, matching, pricing, cancellations)
- Netflix: In progress (video streaming)

**Session Statistics:**
- Learning approach: One question at a time, layer-by-layer
- Background: Non-CS, strong logical thinking, first-principles learning
- Feedback incorporated: Prefer open-ended questions, avoid MCQs with options
- Learning style: Trade-off analysis, cost-benefit thinking, pragmatic decisions

**Key Mental Models Developed:**
1. All systems design is trade-offs (no perfect solution)
2. Consistency is expensive (CAP theorem applies everywhere)
3. Failure is inevitable (design for it, not around it)
4. Denormalization at scale (accept duplication, avoid expensive joins)
5. Asynchrony enables scalability (decouple services)
6. Know your access patterns (optimize for actual usage)
7. Observability wins (can't fix what you can't measure)

---

**When You Resume:**

1. **Netflix Video Streaming Scenario** (capstone project)
   - Video delivery at scale (5M concurrent viewers)
   - Encoding and quality adaptation
   - CDN strategy
   - Buffering and playback optimization

2. **Optional Deep Dives:**
   - DNS and domain resolution
   - Load balancing algorithms (consistent hashing details)
   - BGP routing
   - Event sourcing patterns
   - Advanced consensus (Raft implementation details)

3. **AWS Services Deep Dive** (noted but deferred)
   - IAM, Secrets Manager
   - RDS, DynamoDB, S3
   - Lambda, SQS, SNS, Kafka
   - CloudWatch, ELB, Auto Scaling

**Knowledge Map is saved and ready for future reference!**

---

**Document Updated:** February 14, 2026 (Evening)
**Total Learning Time This Session:** ~6 hours
**Concepts Covered:** 70+
**Next Session Recommendation:** Netflix scenario + optional deep dives

**You've done excellent work! Take your break! 🎉**

