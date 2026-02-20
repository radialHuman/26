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

4. **Advanced Consensus Algorithms** (Not started)
   - Raft, Paxos
   - When to use for distributed agreements

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
