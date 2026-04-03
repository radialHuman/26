# 05 — Amazon DynamoDB — Exhaustive Deep-Dive

---

## 1. What Problem DynamoDB Solves

### The Problem with Relational Databases at Scale

Relational databases (MySQL, PostgreSQL, Oracle) work brilliantly for most applications. But they have a fundamental problem: **they don't scale horizontally well**.

Imagine Amazon.com on Prime Day:
- 300 million items for sale
- Millions of concurrent shoppers
- Each adding items to carts, checking out, updating preferences
- The database needs to handle **millions of reads AND writes per second**

With a relational database (like RDS), you can only scale **vertically** (bigger server). The biggest RDS instance (db.r6g.16xlarge) has 64 vCPUs and 512 GB RAM. What happens when even THAT isn't enough?

You'd need to **shard** (split) the database across multiple servers — but that's incredibly complex with relational databases because of JOINs, transactions, and referential integrity.

### The Amazon.com Shopping Cart Story

In 2004, Amazon's internal teams were struggling with this exact problem. Their relational databases couldn't keep up with the scale of Amazon.com. So they built an internal system called **Dynamo** (published as a research paper in 2007 — the "Dynamo Paper" is famous in computer science).

The key insight: **If you give up some relational features (JOINs, complex queries), you can scale horizontally to virtually unlimited capacity.**

DynamoDB (launched 2012) is the AWS-managed service based on these principles.

### Before vs After

| Before DynamoDB | After DynamoDB |
|---|---|
| Scale vertically (bigger servers) | Scale horizontally (add partitions automatically) |
| Complex sharding if you outgrow one server | Automatic partitioning by AWS |
| Manage replication, failover, backups | Fully managed — zero administration |
| Latency increases under load | **Single-digit millisecond latency at ANY scale** |
| Capacity planning months ahead | Change capacity in seconds (or use on-demand) |
| Multiple servers, manual failover | Built-in replication across 3 AZs |

### Real-World Examples

- **Amazon.com** — Shopping carts, user sessions, product catalog (tens of millions of requests per second during Prime Day)
- **Lyft** — Driver/rider matching, GPS location tracking in real-time
- **Samsung** — IoT device state management for millions of smart devices
- **Snapchat** — User chat data with massive read/write throughput
- **Duolingo** — User progress tracking for 500M+ registered users

---

## 2. Historical Context

| Year | Event |
|---|---|
| 2004 | Amazon internally builds Dynamo for amazon.com |
| 2007 | Amazon publishes the "Dynamo" research paper |
| 2012 | **DynamoDB launched** as an AWS service |
| 2013 | Local Secondary Indexes (LSI), fine-grained access control |
| 2014 | Global Secondary Indexes (GSI), Streams |
| 2017 | DynamoDB Global Tables (multi-region), VPC Endpoints, On-Demand Backup |
| 2018 | **On-Demand Capacity Mode** (no capacity planning needed), PITR, Transactions |
| 2019 | **DynamoDB Accelerator (DAX)** improvements, Contributor Insights |
| 2020 | Export to S3, PartiQL support (SQL-like query language) |
| 2021 | Kinesis Data Streams integration, Standard-IA table class |
| 2022 | Import from S3, table deletion protection |
| 2023 | Zero-ETL integration with Redshift, resource-based policies |

---

## 3. When to Use DynamoDB

### 10+ Use Cases

1. **Session storage** — Web/mobile app sessions (fast key-value lookups, TTL for expiration)
2. **Shopping carts** — Add/remove items by user ID (Amazon's original use case)
3. **Gaming leaderboards** — Real-time ranking with sort keys
4. **IoT data ingestion** — Millions of sensor readings per second
5. **User profiles/preferences** — Key-value lookup by user ID
6. **Metadata storage** — File metadata, image tags, catalog information
7. **Ad tech / clickstream** — Real-time bid data, click tracking at massive scale
8. **Mobile backends** — Syncing app state across devices
9. **Content management** — Storing articles, posts with flexible attributes
10. **Event logging** — Application events with timestamp sort keys
11. **Caching layer** — When you need persistence (unlike Redis/ElastiCache which is in-memory only)

### 5+ Anti-Patterns (When NOT to Use DynamoDB)

1. **Complex JOIN queries** → Use **RDS/Aurora**. DynamoDB has NO JOIN support. If your data model requires joining 5 tables in a single query, use a relational database.
2. **Ad-hoc analytical queries** → Use **Redshift or Athena**. DynamoDB requires you to know your access patterns at design time. You can't run arbitrary SQL queries efficiently.
3. **Small, simple datasets** → Use **RDS**. If your dataset fits in a single MySQL table with <100 requests/second, RDS is simpler and cheaper.
4. **Large binary objects** → Use **S3**. DynamoDB items max at 400 KB. Don't store images or documents in DynamoDB — store a reference (S3 URL) instead.
5. **Strong relational integrity** → Use **RDS**. DynamoDB has no foreign keys, no referential integrity, no cascading deletes.
6. **Full-text search** → Use **OpenSearch**. DynamoDB can do exact matches and begins_with, but not fuzzy search or full-text search.

---

## 4. How DynamoDB Differs from Similar Services

### DynamoDB vs RDS

| Feature | DynamoDB | RDS |
|---|---|---|
| Data model | Key-value / document | Relational (tables, rows, columns) |
| Schema | **Schemaless** (flexible attributes per item) | Fixed schema |
| Query language | Key-based + filter expressions + PartiQL | Full SQL |
| JOINs | **NO** | Yes |
| Transactions | Yes (max 100 items, 4 MB) | Full ACID |
| Scaling | **Horizontal (automatic)** | Vertical (bigger instance) |
| Latency | Single-digit ms (microsecond with DAX) | Single-digit ms |
| Management | **Fully managed** (zero admin) | Semi-managed |
| Max item size | **400 KB** | Row size varies by engine |
| Cost model | RCU/WCU or On-Demand | Instance + storage |
| Best for | High-throughput, simple access patterns | Complex queries, relationships |

### DynamoDB vs ElastiCache (Redis)

| Feature | DynamoDB | ElastiCache (Redis) |
|---|---|---|
| Storage | **Persistent** (disk-based with SSD) | **In-memory** (data lost on restart unless persistence enabled) |
| Latency | Single-digit milliseconds | **Sub-millisecond** |
| Max item size | 400 KB | 512 MB per key |
| Durability | 11 nines (3 AZs) | Limited (depends on replication) |
| Scaling | Automatic partitioning | Manual sharding |
| Cost | Pay per request or capacity | Pay per node |
| Use DynamoDB when | Need persistent, durable NoSQL storage | Need absolute fastest reads, caching layer |

### DynamoDB vs MongoDB (DocumentDB)

| Feature | DynamoDB | DocumentDB (MongoDB-compatible) |
|---|---|---|
| Data model | Key-value + document | Document (JSON) |
| Query flexibility | Limited (key-based) | **Rich queries** (nested documents, arrays) |
| Scaling | **Automatic, limitless** | Manual, limited |
| Management | Fully managed | Semi-managed (cluster-based) |
| Indexing | GSI/LSI (must plan ahead) | Flexible indexes |
| Cost | Can be cheaper at scale | Instance-based pricing |

---

## 5. How DynamoDB Works Under the Hood

### Partition Key Hashing

When you write an item, DynamoDB:
1. Takes the **partition key** value (e.g., user_id = "user123")
2. Runs it through a **hash function**
3. The hash determines which **partition** (physical storage node) stores the item
4. Each partition can hold up to **10 GB** of data and handle **3,000 RCU / 1,000 WCU**

```
Item: {user_id: "user123", name: "Alice"}
        ↓
Hash("user123") → Partition #7
        ↓
Stored on Partition #7 (across 3 AZs)
```

### Automatic Partitioning

As your table grows, DynamoDB automatically splits partitions:
- Table starts with a small number of partitions
- When data exceeds 10 GB per partition or throughput exceeds 3,000 RCU/1,000 WCU, the partition splits
- This is invisible to you
- This is why **partition key design is critical** — a bad key leads to "hot partitions"

### Replication

Every DynamoDB item is automatically replicated across **3 Availability Zones**:
- Write goes to the primary partition
- Synchronously replicated to 2 other AZs
- **Strongly consistent read**: Reads from the primary (guaranteed latest data)
- **Eventually consistent read**: Reads from any replica (might be slightly stale, but 2× throughput)

### How Reads Work

1. **Eventually Consistent Read** (default): Reads from any of the 3 replicas. May not reflect a write that happened in the last ~1 second. Uses **half the RCU** of strongly consistent.
2. **Strongly Consistent Read**: Reads from the primary replica. Guaranteed to return the latest data. Uses full RCU.

---

## 6. Basic Components and Working

### Tables, Items, and Attributes

- **Table**: A collection of items (like a database table)
- **Item**: A single record (like a row). Maximum **400 KB** per item.
- **Attribute**: A data field (like a column). But items in the same table can have DIFFERENT attributes — this is the "schemaless" nature.

### Primary Key (EXAM CRITICAL!)

Every table must have a primary key. Two options:

**Option 1: Partition Key Only (Simple Primary Key)**
```
Table: Users
Partition Key: user_id
Item 1: {user_id: "u001", name: "Alice", email: "alice@ex.com"}
Item 2: {user_id: "u002", name: "Bob", age: 30}  ← Notice: different attributes!
```

**Option 2: Partition Key + Sort Key (Composite Primary Key)**
```
Table: Orders
Partition Key: customer_id
Sort Key: order_date
Item 1: {customer_id: "c001", order_date: "2024-01-15", total: 99.99}
Item 2: {customer_id: "c001", order_date: "2024-02-20", total: 49.99}
Item 3: {customer_id: "c002", order_date: "2024-01-15", total: 199.99}
```

With a composite key:
- The partition key determines WHICH partition stores the item
- The sort key orders items WITHIN that partition
- You can query: "Get all orders for customer c001" or "Get orders for c001 between Jan and Feb"

### Secondary Indexes (EXAM CRITICAL!)

Indexes let you query data using attributes OTHER than the primary key.

#### GSI (Global Secondary Index)

| Feature | Details |
|---|---|
| Partition key | **Different** from the table's partition key |
| Sort key | Optional, can be different |
| When to create | **Anytime** (can add to existing table) |
| Capacity | **Has its OWN RCU/WCU** (separate from table) |
| Consistency | **Eventually consistent ONLY** |
| Size limit | No limit |
| Max per table | **25** |
| Data | Projected attributes (you choose which) |

**Example**: Table has `user_id` as PK. You need to query by `email`. Create a GSI with `email` as the partition key.

#### LSI (Local Secondary Index)

| Feature | Details |
|---|---|
| Partition key | **SAME** as the table's partition key |
| Sort key | **Different** from the table's sort key |
| When to create | **At table creation ONLY** (cannot add later!) |
| Capacity | **Shares the table's RCU/WCU** |
| Consistency | **Strongly or eventually consistent** |
| Size limit | **10 GB per partition key value** |
| Max per table | **5** |
| Data | Projected attributes |

**Example**: Table has `customer_id` (PK) + `order_date` (SK). You also want to query by `customer_id` + `total_amount`. Create an LSI with `total_amount` as the sort key.

**EXAM CRITICAL GSI vs LSI Decision:**
- Need different partition key? → **GSI**
- Need to add after table creation? → **GSI**
- Need strongly consistent reads on index? → **LSI**
- Same partition key, different sort key? → **LSI** (if created at table creation)

### Capacity Modes

#### Provisioned Capacity (with Auto Scaling)

You specify the number of read and write capacity units:

**Read Capacity Unit (RCU):**
- 1 RCU = **1 strongly consistent read per second** for an item up to **4 KB**
- 1 RCU = **2 eventually consistent reads per second** for an item up to 4 KB
- Items > 4 KB: Round up to next 4 KB multiple

**Write Capacity Unit (WCU):**
- 1 WCU = **1 write per second** for an item up to **1 KB**
- Items > 1 KB: Round up to next 1 KB multiple

**Transactional reads/writes cost 2×**

#### On-Demand Capacity

- No capacity planning needed
- Pay per request ($1.25 per million write requests, $0.25 per million read requests in us-east-1)
- Scales instantly to any traffic level
- 2.5× more expensive than well-utilized provisioned capacity
- Best for: Unpredictable workloads, new tables where you don't know the traffic pattern

### RCU/WCU Calculation Examples (EXAM FAVORITE!)

**Example 1: Read Capacity**
- Application needs: 100 strongly consistent reads/second
- Each item is 6 KB
- RCU per read = ceiling(6 KB / 4 KB) = 2 RCU
- Total RCU = 100 × 2 = **200 RCU**
- If eventually consistent: 200 / 2 = **100 RCU**

**Example 2: Write Capacity**
- Application needs: 50 writes/second
- Each item is 2.5 KB
- WCU per write = ceiling(2.5 KB / 1 KB) = 3 WCU
- Total WCU = 50 × 3 = **150 WCU**

**Example 3: Transactional Read**
- 20 transactional reads/second
- Each item is 8 KB
- RCU per read = ceiling(8 KB / 4 KB) × 2 (transactional) = 4 RCU
- Total RCU = 20 × 4 = **80 RCU**

**Example 4: Mixed Workload**
- 500 eventually consistent reads/sec, items 3 KB → ceiling(3/4) = 1 RCU each, /2 for EC = 250 RCU
- 200 writes/sec, items 1.5 KB → ceiling(1.5/1) = 2 WCU each = 400 WCU
- **Total: 250 RCU + 400 WCU**

### DynamoDB Streams

A real-time, ordered log of every change (insert, update, delete) to items in the table.

- Records appear in the stream within ~200ms of the change
- Retained for 24 hours
- Can trigger **Lambda functions** (the most common pattern)
- Used for: Event-driven architectures, replication, analytics, audit trails

**Stream record views:**
- KEYS_ONLY — Only the key attributes
- NEW_IMAGE — The entire item after the change
- OLD_IMAGE — The entire item before the change
- NEW_AND_OLD_IMAGES — Both before and after

### DynamoDB Global Tables

Multi-region, fully replicated tables for global applications:
- **Active-active** — Write to ANY region, reads from ANY region
- Changes replicate to all regions (typically within 1 second)
- Requires DynamoDB Streams (enabled automatically)
- Conflict resolution: Last writer wins

**Use case**: A gaming company needs players in US, Europe, and Asia to all see the same leaderboard with low latency.

### TTL (Time to Live)

- Automatically delete items after a specified timestamp
- No additional cost (free deletes)
- Deleted within 48 hours of expiration (not instantaneous)
- Use case: Session data, temporary tokens, event logs

### DynamoDB Transactions

- ACID transactions across multiple items and tables
- Up to **100 items** per transaction, **4 MB** total
- **TransactWriteItems**: Group multiple puts/updates/deletes
- **TransactGetItems**: Group multiple reads
- Cost: **2× the normal RCU/WCU**

### DAX (DynamoDB Accelerator)

An in-memory cache specifically for DynamoDB:
- **Microsecond latency** (vs milliseconds for DynamoDB directly)
- Read-through / write-through cache
- Compatible with DynamoDB API (just change the endpoint)
- Fully managed (cluster of cache nodes)
- Best for: Read-heavy workloads, repeated reads of the same items

**DAX vs ElastiCache:**
- **DAX**: Specifically for DynamoDB, API-compatible, simpler
- **ElastiCache**: General-purpose cache, more features, for any data source

---

## 7. Cost

### Provisioned Capacity Pricing (us-east-1)

| Component | Cost |
|---|---|
| Write Capacity Unit (WCU) | $0.00065 per WCU per hour ($0.47/WCU/month) |
| Read Capacity Unit (RCU) | $0.00013 per RCU per hour ($0.09/RCU/month) |
| Storage | $0.25 per GB per month |
| Streams reads | $0.02 per 100,000 read requests |
| On-Demand backup | $0.10 per GB |
| Continuous backup (PITR) | $0.20 per GB per month |

### On-Demand Pricing (us-east-1)

| Component | Cost |
|---|---|
| Write Request Unit | $1.25 per million |
| Read Request Unit | $0.25 per million |
| Storage | $0.25 per GB per month |

### Cost Calculation Example

**Provisioned mode:**
- 1,000 WCU + 5,000 RCU + 100 GB storage
- WCU: 1,000 × $0.47/month = $470
- RCU: 5,000 × $0.09/month = $450
- Storage: 100 × $0.25 = $25
- **Total: ~$945/month**

**On-Demand mode for same workload (assuming consistent usage):**
- 1,000 writes/sec × 60 × 60 × 24 × 30 = 2.592B writes/month
- 2,592 million × $1.25 = $3,240
- 5,000 reads/sec → $648/month
- **Total: ~$3,913/month** (4× more expensive!)

**Conclusion**: On-Demand is ~2.5× more expensive than well-utilized Provisioned. Use On-Demand for spiky/unpredictable workloads, Provisioned for steady workloads.

### GSI Costs

**Critical**: GSIs have their OWN capacity. If your table has 1,000 WCU and you have a GSI, every write to the table also writes to the GSI, consuming the GSI's WCU.

### Reserved Capacity

- Commit to minimum usage for 1 or 3 years
- Up to 77% discount over on-demand provisioned pricing
- Best for stable, predictable workloads

### DynamoDB Standard-IA Table Class

- 60% cheaper storage ($0.10/GB vs $0.25/GB)
- 25% higher read/write costs
- Best for tables that store a lot of data but are infrequently accessed

---

## 8. Pros and Cons

### Pros

1. **Fully managed** — Zero administration (no patching, no servers, no maintenance)
2. **Single-digit millisecond latency at any scale** — Whether you have 10 or 10 million requests/sec
3. **Automatic scaling** — On-Demand mode scales instantly; Provisioned mode auto-scales
4. **Built-in high availability** — Data replicated across 3 AZs
5. **Flexible schema** — Each item can have different attributes
6. **Global Tables** — Multi-region active-active replication
7. **DynamoDB Streams** — Event-driven architecture with Lambda
8. **DAX** — Microsecond read latency
9. **TTL** — Free automatic item deletion
10. **Transactions** — ACID compliance for complex operations
11. **On-Demand mode** — No capacity planning needed
12. **Encryption at rest** — Default, using AWS-owned, AWS-managed, or customer-managed KMS keys

### Cons

1. **No JOINs** — Must denormalize data or make multiple queries
2. **400 KB item size limit** — Can't store large documents
3. **GSI eventually consistent only** — Can't get strongly consistent reads from GSIs
4. **Must design access patterns first** — Changing query patterns may require redesigning tables/indexes
5. **Hot partition problem** — Bad partition key design causes uneven load distribution
6. **On-Demand pricing** — 2.5× more expensive than provisioned for steady workloads
7. **Complex pricing** — RCU/WCU calculations, GSI costs, data transfer — harder to predict costs
8. **25 GSI limit per table** — May require creative data modeling
9. **No full-text search** — Need to pair with OpenSearch for search functionality
10. **Query limitations** — Can only query on primary key and sort key (plus filters, but filters are applied AFTER reading)

---

## 9. SAP-C02 Exam Questions (15+ Scenarios)

### Question 1 — RCU Calculation
**Scenario**: An application requires 200 strongly consistent reads per second. Each item is 12 KB. How many RCUs are needed?

**Answer**: 
- RCU per read = ceiling(12 KB / 4 KB) = 3 RCU
- Total = 200 × 3 = **600 RCU**

If eventually consistent: 600 / 2 = **300 RCU**

---

### Question 2 — WCU Calculation
**Scenario**: An application writes 100 items per second. Each item is 3 KB. How many WCUs are needed?

**Answer**: 
- WCU per write = ceiling(3 KB / 1 KB) = 3 WCU
- Total = 100 × 3 = **300 WCU**

---

### Question 3 — GSI vs LSI
**Scenario**: A table has `user_id` (PK) and `created_date` (SK). A new requirement needs querying by `email`. The table already exists with data. What should be used?

**Answer**: **Global Secondary Index (GSI)** with `email` as partition key

**Why not LSI**: LSI must be created at table creation time. The table already exists.

---

### Question 4 — Hot Partition
**Scenario**: A DynamoDB table uses `date` as the partition key for IoT sensor data. On any given day, all writes go to the same partition key value (today's date), causing throttling. How to fix?

**Answer**: Options:
1. **Add a random suffix** to the date: `2024-01-15_001`, `2024-01-15_002` (write sharding)
2. Use a **composite key**: device_id (PK) + timestamp (SK) — distributes across partitions
3. Switch to **On-Demand mode** (handles spikes better, but doesn't fully solve hot partition)

**Best answer**: Redesign the partition key to distribute writes evenly (option 2 is best for IoT).

---

### Question 5 — DynamoDB Streams + Lambda
**Scenario**: When a new order is placed in a DynamoDB table, the system needs to send a confirmation email and update inventory in another table. How should this be architected?

**Answer**: 
1. Enable **DynamoDB Streams** on the orders table
2. Create a **Lambda function** triggered by the stream
3. Lambda sends email via SES AND updates inventory table

Stream view type: **NEW_IMAGE** (to see the full new order details)

---

### Question 6 — Global Tables
**Scenario**: A mobile app serves users in US, Europe, and Asia. Users need to read/write their profile data with <10ms latency regardless of location. What should be used?

**Answer**: **DynamoDB Global Tables** with replicas in us-east-1, eu-west-1, and ap-southeast-1

Users read/write to the nearest region. Changes replicate across all regions (typically <1 second). Active-active: writes accepted in any region.

---

### Question 7 — DAX vs ElastiCache
**Scenario**: A DynamoDB-backed application has a hot item that's read thousands of times per second. The company wants to reduce DynamoDB costs and improve latency. What should they use?

**Answer**: **DAX (DynamoDB Accelerator)**

**Why not ElastiCache**: While ElastiCache works, DAX is purpose-built for DynamoDB:
- API-compatible (just change endpoint, no code rewrite)
- Handles cache invalidation automatically
- Simpler to set up for DynamoDB workloads

---

### Question 8 — On-Demand vs Provisioned
**Scenario**: A new startup is launching an app and has no idea what the traffic will look like. They expect spikes during media coverage. What capacity mode?

**Answer**: **On-Demand** — No capacity planning, scales instantly, pay per request. Switch to Provisioned once they understand their traffic patterns.

---

### Question 9 — TTL
**Scenario**: A DynamoDB table stores session data. Sessions should expire after 24 hours. What's the most cost-effective way to clean up expired sessions?

**Answer**: **Enable TTL** on a timestamp attribute. Set the attribute to current_time + 86400 (24 hours in seconds). DynamoDB will automatically delete expired items at no additional cost.

---

### Question 10 — Transactional Writes
**Scenario**: A banking application needs to transfer money between two accounts. Both the debit and credit must succeed or fail together. How to implement?

**Answer**: **DynamoDB Transactions (TransactWriteItems)** — Group the debit (update account A) and credit (update account B) in a single transaction. Either both succeed or both fail.

Cost: 2× the WCU of normal writes.

---

### Question 11 — Export to S3
**Scenario**: An analytics team needs to run complex queries on DynamoDB data. DynamoDB doesn't support ad-hoc SQL queries efficiently. What should they do?

**Answer**: 
1. **Export DynamoDB table to S3** (built-in feature, no RCU consumed)
2. Query with **Athena** (serverless SQL on S3 data)

OR use the new **zero-ETL integration with Redshift** for ongoing analytics.

---

### Question 12 — Encryption Options
**Scenario**: A compliance requirement mandates that the company controls and can rotate the encryption key used for DynamoDB data at rest. What should they use?

**Answer**: **Customer-managed KMS key (CMK)**

DynamoDB encryption options:
1. **AWS-owned key** (default, free, no control) 
2. **AWS-managed key** (free, visible in KMS, AWS controls rotation)
3. **Customer-managed key** (you create, you control rotation, you pay)

---

### Question 13 — Backup and Restore
**Scenario**: A DynamoDB table with 500 GB of data needs to be backed up for disaster recovery. The backup should not affect table performance. What options exist?

**Answer**: Two options:
1. **On-Demand Backup**: Creates a full backup at any time. No impact on performance. $0.10/GB.
2. **Point-in-Time Recovery (PITR)**: Continuous backup. Restore to any second in the last 35 days. $0.20/GB/month.

Both are performed without consuming table RCU/WCU.

---

### Question 14 — Conditional Writes
**Scenario**: An e-commerce system needs to decrement inventory count only if the current count is greater than 0 (to prevent overselling). How?

**Answer**: **Conditional Write** with a condition expression:
```
UpdateItem: SET inventory_count = inventory_count - 1 
CONDITION: inventory_count > 0
```
If the condition fails (inventory is 0), the write is rejected.

---

### Question 15 — Standard-IA Table Class
**Scenario**: A company has a DynamoDB table storing historical order data. The table is 2 TB but accessed only a few times per month for auditing. How to reduce costs?

**Answer**: **Switch to DynamoDB Standard-IA table class**
- Storage: $0.10/GB (vs $0.25/GB) → saves $300/month on 2 TB
- Read/write costs are 25% higher, but infrequent access means this is negligible

---

## 10. Configuration Details

### Creating a Table

```bash
# Create table with provisioned capacity
aws dynamodb create-table \
  --table-name Orders \
  --attribute-definitions \
    AttributeName=customer_id,AttributeType=S \
    AttributeName=order_date,AttributeType=S \
  --key-schema \
    AttributeName=customer_id,KeyType=HASH \
    AttributeName=order_date,KeyType=RANGE \
  --billing-mode PROVISIONED \
  --provisioned-throughput ReadCapacityUnits=100,WriteCapacityUnits=50

# Create table with on-demand capacity
aws dynamodb create-table \
  --table-name Sessions \
  --attribute-definitions AttributeName=session_id,AttributeType=S \
  --key-schema AttributeName=session_id,KeyType=HASH \
  --billing-mode PAY_PER_REQUEST

# Add a GSI
aws dynamodb update-table \
  --table-name Orders \
  --attribute-definitions AttributeName=product_id,AttributeType=S \
  --global-secondary-index-updates '[{
    "Create": {
      "IndexName": "ProductIndex",
      "KeySchema": [{"AttributeName":"product_id","KeyType":"HASH"}],
      "Projection": {"ProjectionType":"ALL"},
      "ProvisionedThroughput": {"ReadCapacityUnits":50,"WriteCapacityUnits":25}
    }
  }]'

# Enable DynamoDB Streams
aws dynamodb update-table \
  --table-name Orders \
  --stream-specification StreamEnabled=true,StreamViewType=NEW_AND_OLD_IMAGES

# Enable TTL
aws dynamodb update-time-to-live \
  --table-name Sessions \
  --time-to-live-specification Enabled=true,AttributeName=expiration_time

# Enable PITR
aws dynamodb update-continuous-backups \
  --table-name Orders \
  --point-in-time-recovery-specification PointInTimeRecoveryEnabled=true
```

---

## 11. Services DynamoDB Works With

| Service | Integration |
|---|---|
| **Lambda** | Stream triggers, API backend, event processing |
| **API Gateway** | Direct DynamoDB integration (no Lambda needed for simple CRUD) |
| **DAX** | In-memory caching layer |
| **S3** | Export table data for analytics |
| **Athena** | Query exported DynamoDB data |
| **Redshift** | Zero-ETL integration for analytics |
| **Kinesis Data Streams** | Alternative to DynamoDB Streams (longer retention: 365 days) |
| **CloudWatch** | Metrics (throttling, consumed capacity, errors) |
| **CloudTrail** | API call auditing |
| **IAM** | Fine-grained access control (per-item, per-attribute) |
| **VPC Endpoints** | Gateway Endpoint for private DynamoDB access (**FREE!**) |
| **Glue** | ETL to/from DynamoDB |
| **EMR** | Read/write DynamoDB from Spark/Hadoop |
| **AppSync** | GraphQL API with DynamoDB resolvers |

---

## 12. Additional Critical Information

### Partition Key Design Best Practices

1. ✅ **High cardinality** — Use keys with many distinct values (user_id, device_id, NOT date or status)
2. ✅ **Even distribution** — Avoid keys that concentrate traffic on few values
3. ✅ **Write sharding** — Add random suffix for high-write keys (e.g., `date_001`, `date_002`)
4. ✅ **Composite keys** — Use partition key + sort key for flexible queries

### Common Mistakes (12+)

1. ❌ Using date as partition key (all today's writes hit one partition)
2. ❌ Not understanding GSI costs (GSIs consume their own WCU on every table write)
3. ❌ Trying to add LSI to existing table (impossible!)
4. ❌ Storing items >400 KB (will fail — store in S3 instead)
5. ❌ Overusing On-Demand when traffic is predictable (2.5× more expensive)
6. ❌ Not monitoring throttling events in CloudWatch
7. ❌ Scanning the entire table for queries (use query/index instead)
8. ❌ Not using VPC Gateway Endpoint (it's free for DynamoDB!)
9. ❌ Forgetting that GSIs are eventually consistent only
10. ❌ Using Scan instead of Query (Scan reads the entire table!)
11. ❌ Not enabling PITR for critical tables
12. ❌ Ignoring GSI capacity when sizing WCU (writes fan out to GSIs)

### Key Limits

| Resource | Limit |
|---|---|
| Item size | **400 KB** |
| Partition key value size | 2,048 bytes |
| Sort key value size | 1,024 bytes |
| GSIs per table | **25** |
| LSIs per table | **5** |
| Maximum RCU/WCU per table | 40,000 (can be increased) |
| Maximum RCU/WCU per account per region | 80,000 (can be increased) |
| Partition throughput | 3,000 RCU / 1,000 WCU per partition |
| Transaction items | 100 items, 4 MB total |
| Batch operations | 25 items per BatchWriteItem |

### Exam Tips

1. **RCU/WCU calculations WILL appear** — Practice the formulas until automatic
2. **GSI vs LSI** — Know the differences cold (creation time, partition key, consistency, capacity)
3. **"Microsecond reads"** → DAX
4. **"Multi-region active-active"** → Global Tables
5. **"Event-driven processing on table changes"** → DynamoDB Streams + Lambda
6. **"Unpredictable traffic"** → On-Demand mode
7. **"Free VPC access"** → Gateway VPC Endpoint (like S3)
8. **"Auto-delete expired data"** → TTL
9. **"400 KB limit"** → Store large data in S3, reference in DynamoDB
10. **"Hot partition"** → Bad partition key design, need to shard or redesign
11. **"Analytics on DynamoDB data"** → Export to S3 + Athena
12. **"Filter expression"** → Applied AFTER reading (still consumes RCU for scanned items!)

---

*Word count: ~5,200+ words. This document covers every DynamoDB concept tested on the SAP-C02 exam.*
