# Systems Design Knowledge Map
**Last Updated:** February 14, 2026  
**Background:** Non-CS background, strong logical thinking, learning from first principles

---

## 📊 OVERALL PROFICIENCY SUMMARY
- **Strong Areas:** 6/8
- **Partial Understanding:** 5/8
- **New Concepts Learned:** 15+
- **Not Yet Covered:** 10 major areas (in progress)

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

## ❌ NOT YET COVERED (9 Remaining Gaps)

1. **Batch Processing** (Just started)
   - Checkpoints, MapReduce, Spark concepts learned
   - Implementation details: Unknown

2. **Search & Query Layer** (Briefly mentioned)
   - Elasticsearch, OpenSearch exist
   - When to use: Complex search, full-text, filtering
   - User chose: PostgreSQL for simple searches

3. **Disaster Recovery** (Not started)
   - Backups and recovery strategies
   - Failover and redundancy
   - Cross-region replication
   - RTO (Recovery Time Objective), RPO (Recovery Point Objective)

4. **API Versioning** (Not started)
   - How to evolve APIs without breaking clients
   - Versioning strategies (URL versioning, header versioning)

5. **Testing Distributed Systems** (Not started)
   - Chaos engineering
   - Distributed system testing challenges
   - Mocking failures

6. **Cost Optimization** (Not started)
   - Resource utilization
   - Reserved instances vs. on-demand
   - Multi-region cost analysis

7. **Encryption & Secrets Management** (Not started)
   - Data encryption (at rest, in transit)
   - Key management
   - Secrets rotation

8. **Advanced Consensus Algorithms** (Not started)
   - Raft, Paxos
   - When to use for distributed agreements

9. **Event Sourcing** (Not started)
   - Store all events as source of truth
   - Replay events to reconstruct state

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
