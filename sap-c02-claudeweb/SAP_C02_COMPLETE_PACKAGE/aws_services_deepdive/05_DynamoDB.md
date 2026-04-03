# DynamoDB - Complete Deep Dive

## 1. What Problem Did It Solve?

**Before DynamoDB (2012):**
- Relational databases don't scale horizontally well
- Sharding is complex (manual partitioning)
- NoSQL options (Cassandra, MongoDB) require ops expertise
- Provisioning capacity is guesswork
- Can't handle unpredictable spikes (Black Friday crashes)

**Problem:** Scaling databases to millions of requests/second is hard

**DynamoDB Solution:**
- Auto-scales to any workload (millions of requests/sec)
- No servers to manage (fully serverless)
- Single-digit millisecond latency at any scale
- Global tables (multi-region replication)
- Pay per request (no capacity planning)

**Impact:** Made massive scale accessible to small teams

---

## 2. What Was There Before This Service?

**NoSQL Evolution:**

**2000s: Relational databases only**
- MySQL, PostgreSQL, Oracle
- Scaling = bigger server (vertical)
- Horizontal scaling = complex sharding

**2007: Amazon Dynamo Paper**
- Internal Amazon database
- Eventually consistent
- Highly available
- Foundation for DynamoDB

**2007-2012: NoSQL emerges**
- MongoDB (2009)
- Cassandra (2008)
- All require self-management

**2012: DynamoDB launches**
- First fully managed NoSQL at scale
- Based on Dynamo paper principles
- Provisioned capacity model

**2018: On-Demand pricing**
- Don't need to guess capacity
- Pay per request
- Game-changer for unpredictable workloads

---

## 3. When to Use It

### **Use DynamoDB When:**

✅ **Simple access patterns (key-based)**
- Get user by user_id
- Get orders for customer_id
- Get game score by player_id

✅ **High throughput needed**
- Millions of requests/second
- Mobile/gaming applications
- IoT sensor data

✅ **Unpredictable traffic**
- Can spike from 0 to millions instantly
- Can't predict capacity needs
- Use On-Demand mode

✅ **Low latency required**
- Need sub-10ms response time
- Real-time applications
- Session storage

✅ **Serverless architecture**
- No servers to manage
- Pairs well with Lambda
- Focus on application, not database

✅ **Global applications**
- Global Tables (multi-region)
- Replicate to 5+ regions
- Local reads everywhere

### **DON'T Use DynamoDB When:**

❌ **Complex queries needed**
```sql
-- This query works in RDS:
SELECT * FROM users 
WHERE age > 25 AND city = 'NYC' AND joined_date > '2025-01-01'
ORDER BY last_login DESC;

-- In DynamoDB: Very inefficient or impossible!
-- Would need to scan entire table
```

❌ **Unknown access patterns**
- Ad-hoc analytics
- Business intelligence
- Data exploration
→ Use Redshift or Athena

❌ **Need ACID transactions across multiple tables**
- Complex multi-table operations
- Though DynamoDB has transactions (limited to 100 items, same region)
→ Use RDS for complex transactions

❌ **Relationships are core**
- Many foreign keys
- Complex joins
→ Use relational database

❌ **Small dataset with complex queries**
- <10 GB of data
- Need SQL flexibility
→ RDS cheaper and more flexible

---

## 4. How Is It Different from Similar Services?

### **DynamoDB vs RDS**

| Feature | DynamoDB | RDS |
|---------|----------|-----|
| **Data model** | NoSQL (key-value, document) | SQL (relational) |
| **Schema** | No fixed schema | Must define schema |
| **Scaling** | Automatic horizontal | Manual vertical (bigger instance) |
| **Query flexibility** | Limited (key-based) | High (any SQL query) |
| **Latency** | 1-10ms | 5-50ms |
| **Throughput** | Millions/sec | Thousands/sec |
| **Cost** | Per request | Per instance (24/7) |
| **Management** | Zero (serverless) | Low (AWS managed) |

**When DynamoDB wins:** Simple queries, high scale, unpredictable traffic
**When RDS wins:** Complex queries, relationships, flexibility

---

### **DynamoDB vs MongoDB (DocumentDB)**

| Feature | DynamoDB | DocumentDB |
|---------|----------|------------|
| **Compatibility** | DynamoDB API only | MongoDB-compatible |
| **Scaling** | Automatic (to any size) | Manual (instance-based) |
| **Management** | Fully managed | AWS managed (like RDS) |
| **Query language** | DynamoDB API | MongoDB query language |
| **Cost model** | Per request | Per instance |

**When DynamoDB:** AWS-native, don't need MongoDB compatibility
**When DocumentDB:** Existing MongoDB app, need MongoDB queries

---

### **DynamoDB vs Cassandra (Keyspaces)**

| Feature | DynamoDB | Keyspaces |
|---------|----------|-----------|
| **API** | DynamoDB | CQL (Cassandra Query Language) |
| **Use case** | General NoSQL | Cassandra migrations |
| **Maturity** | Very mature | Newer service |

**When DynamoDB:** New projects, AWS-native
**When Keyspaces:** Migrating from Cassandra

---

## 5. Underlying Mechanism and How It's Made

### **Based on Amazon Dynamo Paper (2007):**

**Core Principles:**

**1. Partitioning (Sharding):**
```
DynamoDB automatically partitions data:

Hash function on partition key:
  user_id "user_123" → Hash → Partition 5
  user_id "user_456" → Hash → Partition 12

Partitions distributed across servers:
  Server A: Partitions 1-5
  Server B: Partitions 6-10
  Server C: Partitions 11-15

Benefits:
- Horizontal scaling (add more servers/partitions)
- No single server bottleneck
- Automatic (you don't see it)
```

---

**2. Replication:**
```
Each partition replicated 3 times across AZs:

Item: user_123
  ├─ Copy in AZ-a (Server 1)
  ├─ Copy in AZ-b (Server 2)
  └─ Copy in AZ-c (Server 3)

Writes:
  1. Write to leader
  2. Leader replicates to 2 followers
  3. Returns success after majority (2/3) acknowledge
  
Reads:
  - Eventually consistent: Read from any replica (fastest)
  - Strongly consistent: Read from leader only (slower)
```

---

**3. Consistency Models:**

**Eventually Consistent Reads (default):**
```
Write user_123 data
  ↓ Leader updated
  ↓ Replicating to followers... (milliseconds)
  
Read user_123 immediately:
  → Might get old data (if read from follower still replicating)
  → Consistent "eventually" (usually <1 second)

Benefit: Faster, cheaper (half the cost)
```

**Strongly Consistent Reads:**
```
Write user_123 data
  ↓ Leader updated
  
Read user_123 with ConsistentRead=true:
  → Always reads from leader
  → Guaranteed latest data

Trade-off: Slower, costs 2x
```

---

**4. Auto-Scaling Mechanism:**

```
On-Demand mode:
  1. Request arrives
  2. DynamoDB routes to partition
  3. If partition hot → AWS splits partition
  4. Redistributes data automatically
  5. Scales to millions/sec seamlessly

Provisioned mode with Auto Scaling:
  1. Monitor CloudWatch metrics (utilization)
  2. If >70% used for X minutes → Scale up
  3. If <30% used for X minutes → Scale down
  4. Scales RCUs/WCUs automatically
```

---

## 6. Cost

### **On-Demand Mode (Pay Per Request):**

```
Reads:
- Eventually consistent: $0.25 per million reads
- Strongly consistent: $0.50 per million reads

Writes:
- $1.25 per million writes

Storage:
- $0.25/GB/month

Example (1 million requests/day):
- 700K reads + 300K writes
- Reads: 0.7 × $0.25 = $0.175/day
- Writes: 0.3 × $1.25 = $0.375/day
- Total: $0.55/day = $16.50/month
- Plus storage: 10 GB × $0.25 = $2.50
- Total: $19/month
```

---

### **Provisioned Mode (Reserve Capacity):**

```
Reserve capacity units:

Read Capacity Unit (RCU):
- 1 RCU = 1 strongly consistent read/sec (up to 4 KB)
- Or 2 eventually consistent reads/sec
- Cost: $0.00013/hour per RCU = $0.09/month

Write Capacity Unit (WCU):
- 1 WCU = 1 write/sec (up to 1 KB)
- Cost: $0.00065/hour per WCU = $0.47/month

Example (provision 100 RCU, 50 WCU):
- RCU: 100 × $0.09 = $9/month
- WCU: 50 × $0.47 = $23.50/month
- Storage: 10 GB × $0.25 = $2.50
- Total: $35/month

Much cheaper than On-Demand if traffic is predictable!
```

---

### **On-Demand vs Provisioned - When to Use:**

```
On-Demand:
✅ Unknown/unpredictable traffic
✅ New applications
✅ Spiky workloads (viral events)
✅ Development/testing

Provisioned + Auto Scaling:
✅ Predictable traffic patterns
✅ Steady baseline with some variance
✅ Cost optimization (cheaper for steady load)
✅ Production with known patterns

Cost comparison (10K req/sec steady):
- On-Demand: ~$500/month
- Provisioned: ~$200/month (60% cheaper)
```

---

## 7. Pros and Cons

### **Pros ✅**

1. **Fully serverless**
   - No servers, no instances
   - No provisioning (On-Demand mode)
   - Zero management

2. **Scales to any size**
   - Proven: Amazon.com uses it (billions of requests/day)
   - Auto-sharding
   - No scale limits

3. **Low latency**
   - Single-digit milliseconds
   - DAX: Microsecond caching

4. **High availability**
   - Multi-AZ by default
   - 99.99% SLA
   - No Multi-AZ config needed

5. **Flexible pricing**
   - On-Demand: Pay per request
   - Provisioned: Reserve capacity
   - Switch between modes

6. **Global Tables**
   - Multi-region replication
   - Active-active (write anywhere)
   - Conflict resolution built-in

7. **Event-driven**
   - DynamoDB Streams (change capture)
   - Trigger Lambda on changes
   - Build reactive systems

### **Cons ❌**

1. **Limited query flexibility**
   - Only query by partition key + sort key
   - Complex filters require scans (slow, expensive)
   - No joins

2. **Access patterns required upfront**
   - Must design table for queries
   - Hard to change later
   - Need to know how data will be accessed

3. **Item size limit**
   - Max 400 KB per item
   - Large items = split or use S3

4. **Eventual consistency default**
   - Reads might return stale data
   - Strongly consistent costs 2x

5. **Learning curve**
   - Different from SQL
   - Partition key design is critical
   - Easy to design poorly

6. **Costs can spike**
   - On-Demand with traffic spike = surprise bill
   - Provisioned: Throttling if exceed capacity

---

## 8. SAP-C02 Questions Related to This

### **Question Type 1: DynamoDB vs RDS**
```
Scenario: Gaming app, millions of users, simple queries (get user by ID, update score)

Answer: DynamoDB
Why:
- Simple access pattern (key-based) ✅
- High throughput needed ✅
- Unpredictable (viral potential) ✅
- No complex queries needed ✅

Wrong: RDS (overkill, doesn't scale as easily)
```

---

### **Question Type 2: Capacity Mode**
```
Scenario: New startup app, traffic unknown, want predictable costs

Answer: On-Demand mode
Why:
- Unknown traffic = can't provision
- Unpredictable = might spike or be low
- Budget constraint = don't want overprovisioning

Wrong: Provisioned (would overprovision or underprovision)
```

---

### **Question Type 3: Global Application**
```
Scenario: Mobile app, users worldwide, need low latency everywhere

Answer: DynamoDB Global Tables
- Replicate to 5 regions
- Users read/write locally (low latency)
- Automatic conflict resolution
- Active-active (write in any region)

Setup:
1. Create table in us-east-1
2. Add replica regions: eu-west-1, ap-southeast-1, etc.
3. DynamoDB handles replication automatically
```

---

### **Question Type 4: Event-Driven Architecture**
```
Scenario: Trigger Lambda when item changes in DynamoDB

Answer: DynamoDB Streams
- Captures changes (insert, update, delete)
- Streams to Lambda
- Process changes in real-time

Use cases:
- Send email when order placed
- Update analytics when user signs up
- Audit trail of changes
```

---

### **Question Type 5: Performance Issue**
```
Scenario: Queries slow, seeing ProvisionedThroughputExceededException

Diagnosis:
- Provisioned capacity exceeded
- Hot partition (one partition getting all traffic)

Solutions:
- Increase WCUs/RCUs (Provisioned mode)
- Switch to On-Demand mode
- Fix hot partition (better partition key design)
- Add DAX (caching layer)
```

---

### **Question Type 6: Caching**
```
Scenario: DynamoDB reads expensive, need microsecond latency

Answer: DAX (DynamoDB Accelerator)
- In-memory cache for DynamoDB
- Microsecond reads (vs milliseconds)
- Write-through cache
- Fully managed
- Compatible with DynamoDB API (minimal code change)

Cost: ~$0.12/hour for dax.t3.small = $87.60/month
```

---

## 9. Configurations

### **1. Table Creation**

**Primary Key Design (CRITICAL):**

**Option A: Partition Key Only**
```
Table: Users
Partition Key: user_id

Items:
{user_id: "user_123", name: "Alice", email: "alice@example.com"}
{user_id: "user_456", name: "Bob", email: "bob@example.com"}

Query: GetItem(user_id = "user_123") → Fast! ✅
Query: Find all users in NYC → Scan entire table ❌ Slow!
```

**Option B: Partition Key + Sort Key (Composite)**
```
Table: Orders
Partition Key: customer_id
Sort Key: order_date

Items:
{customer_id: "cust_1", order_date: "2026-03-20", amount: 99.99}
{customer_id: "cust_1", order_date: "2026-03-15", amount: 49.99}
{customer_id: "cust_2", order_date: "2026-03-19", amount: 149.99}

Queries:
- Get all orders for customer: Query(customer_id = "cust_1") ✅
- Get orders for customer in March: Query(customer_id = "cust_1", order_date >= "2026-03-01") ✅
- Get orders for ALL customers on 2026-03-20: ❌ Can't do efficiently!
```

**The Design Decision:**
```
Ask: "What's my MOST COMMON query?"

If: "Get data for specific entity (user, customer, product)"
→ Use that as partition key

If: "Need to query within entity by time/category"
→ Add sort key for that dimension
```

---

### **2. Capacity Modes**

**On-Demand:**
```
Enable: Capacity mode = On-Demand

AWS handles:
- Auto-scales to workload
- No capacity planning
- Handles spikes automatically

Billing:
- Pay per request
- More expensive per request than Provisioned
- But no waste if traffic is low
```

**Provisioned:**
```
Configure:
- Read Capacity Units: 100
- Write Capacity Units: 50

If exceeded: ProvisionedThroughputExceededException

Enable Auto Scaling:
- Min: 50 RCU, Max: 500 RCU
- Target: 70% utilization
- Scales automatically within range

Best for: Predictable traffic
```

---

### **3. Global Secondary Index (GSI)**

```
Problem: Can only query by partition key

Solution: Create GSI (alternate access pattern)

Base Table:
Partition: user_id
Sort: -

Items: {user_id: "user_123", email: "alice@example.com", city: "NYC"}

GSI (EmailIndex):
Partition: email
Sort: -

Now can query:
- GetItem(email = "alice@example.com") ✅ Fast!

Limitation:
- GSI is separate table (consumes capacity)
- Eventually consistent with base table
- Costs extra (storage + RCUs/WCUs)
- Max 20 GSIs per table
```

---

### **4. Local Secondary Index (LSI)**

```
Must create at table creation (can't add later!)

Base Table:
Partition: customer_id
Sort: order_date

LSI (OrderAmountIndex):
Partition: customer_id (SAME as base table!)
Sort: amount (different sort key)

Query:
- Get customer's orders sorted by amount (not date)
- Query(customer_id = "cust_1", SortBy: amount) ✅

Limitation:
- Same partition key as base table
- Max 5 LSIs per table
- Shares capacity with base table
```

**GSI vs LSI:**
```
GSI: Different partition key, create anytime, eventually consistent
LSI: Same partition key, create at table creation only, strongly consistent
```

---

### **5. DynamoDB Streams**

```
Enable Streams:
- Captures changes (24-hour retention)
- StreamViewType:
  - KEYS_ONLY: Just keys changed
  - NEW_IMAGE: New item after change
  - OLD_IMAGE: Item before change
  - NEW_AND_OLD_IMAGES: Both

Connect to Lambda:
- Lambda polls stream
- Processes changes in order
- Batch size: 1-10,000 records

Use cases:
- Audit trail (log all changes)
- Cross-region replication (before Global Tables existed)
- Trigger workflows (order placed → send email)
- Real-time analytics
```

---

### **6. Global Tables**

```
Create in us-east-1 → Add replicas:
- eu-west-1
- ap-southeast-1
- sa-east-1

AWS handles:
- Automatic replication (sub-second)
- Multi-active (write in any region)
- Conflict resolution (last writer wins by timestamp)

Benefits:
- Low latency for global users (read locally)
- DR (multi-region redundancy)
- Business continuity

Cost: Pay for:
- Storage in each region
- Replication writes (cross-region data transfer)
- Requests in each region
```

---

### **7. Time To Live (TTL)**

```
Automatically delete old items:

Enable TTL on attribute (e.g., "expirationTime"):
{
  "session_id": "sess_123",
  "data": "...",
  "expirationTime": 1711123200  // Unix timestamp
}

DynamoDB:
- Checks TTL attribute
- If current time > expirationTime → Delete item
- Background process (within 48 hours of expiration)
- Free (no WCU consumed!)

Use cases:
- Session data (expire after 1 hour)
- Temporary data
- Automatic cleanup
```

---

### **8. Transactions**

```
Atomic operations across multiple items:

transactWriteItems([
  {Put: {table: "Orders", item: {...}}},
  {Update: {table: "Inventory", key: {...}, decrease: 1}},
  {Put: {table: "Payments", item: {...}}}
]);

All succeed or all fail (atomic)

Limitations:
- Max 100 items per transaction
- All items in same region
- Costs 2x normal write
- Can conflict with other transactions (retry needed)

Use when: Need ACID guarantees (order + payment + inventory)
```

---

## 10. Anything Else You Need to Know

### **Partition Key Design (CRITICAL)**

**Good Partition Keys:**
```
✅ user_id (unique per user, even distribution)
✅ order_id (unique, random)
✅ device_id (IoT, many devices)
✅ customer_id (unique per customer)

Characteristics:
- High cardinality (many distinct values)
- Even distribution (no hot keys)
- Maps to access pattern
```

**Bad Partition Keys:**
```
❌ status (only 3 values: pending, shipped, delivered)
   → All "pending" orders on same partition (hot partition!)
   
❌ date (all today's data on one partition)
   → Today's partition gets all writes (bottleneck!)
   
❌ country (USA gets 80% of traffic)
   → USA partition overwhelmed
```

**Hot Partition Problem:**
```
Total capacity: 1000 WCUs across 10 partitions
Per partition: 100 WCUs

If one partition gets 500 writes/sec:
→ Exceeds 100 WCU limit
→ Throttled (even though total capacity available!)

Solution: Better partition key design (add randomness)
```

---

### **Capacity Calculations (Exam Math)**

**Reads:**
```
Item size: 6 KB
Query: Eventually consistent reads

RCU needed:
- 1 RCU = 4 KB eventually consistent
- 6 KB item = 2 RCUs (round up to 4 KB blocks)

100 reads/sec:
- 100 × 2 = 200 RCUs needed
```

**Writes:**
```
Item size: 3 KB

WCU needed:
- 1 WCU = 1 KB
- 3 KB item = 3 WCUs

100 writes/sec:
- 100 × 3 = 300 WCUs needed
```

**Exam question:**
```
"Table receives 200 reads/sec (4 KB items, eventually consistent) and 50 writes/sec (2 KB items). Calculate RCUs and WCUs needed."

Answer:
Reads: 200 × (4 KB / 4 KB) = 200 RCUs (eventually = 1 RCU per 4KB)
Writes: 50 × 2 = 100 WCUs

Provision: 200 RCUs, 100 WCUs
```

---

### **DynamoDB Accelerator (DAX)**

```
In-memory cache layer:

Without DAX:
  App → DynamoDB (5ms latency)

With DAX:
  App → DAX (check cache)
    ├─ Cache hit: Return (microseconds!)
    └─ Cache miss: Query DynamoDB → Cache result → Return

Cache policies:
- Item cache: Individual items (TTL: 5 minutes default)
- Query cache: Query results

Cost:
- dax.t3.small: $0.04/hour = $29/month
- Must have 3+ nodes (cluster)
- Total: ~$87/month minimum

When to use:
- Read-heavy workloads
- Same items queried repeatedly
- Need microsecond latency
- Cost-effective vs provisioning more RCUs
```

---

### **Common Mistakes**

❌ **Scanning instead of querying**
```
Scan: Reads entire table (slow, expensive)
Query: Reads specific partition (fast, cheap)

Always use Query when possible!
```

❌ **Bad partition key (hot partition)**
```
Using "status" as partition key
→ All "active" items on one partition
→ Bottleneck!
```

❌ **Not using sparse indexes**
```
Don't create GSI on attribute most items don't have
→ Wastes storage and capacity
```

❌ **Provisioned without Auto Scaling**
```
Traffic varies but capacity is fixed
→ Either throttled or overprovisioned (waste money)

Enable Auto Scaling!
```

---

### **Best Practices**

✅ **Design for access patterns** (know queries upfront)
✅ **Use On-Demand** for new/unpredictable workloads
✅ **Use Provisioned + Auto Scaling** for predictable patterns
✅ **Avoid scans** (use Query with indexes)
✅ **Enable Point-in-Time Recovery** (PITR) for backups
✅ **Use DynamoDB Streams** for event-driven
✅ **Cache with DAX** for read-heavy workloads
✅ **Global Tables** for multi-region
✅ **Use TTL** for automatic cleanup
✅ **Monitor throttling** (CloudWatch alarms)

---

**END OF DYNAMODB DEEP DIVE**

