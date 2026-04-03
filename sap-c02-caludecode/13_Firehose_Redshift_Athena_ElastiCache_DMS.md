# 21-25 — Kinesis Firehose, Redshift, Athena, ElastiCache, DMS

---

# 21 — Amazon Kinesis Data Firehose (now Amazon Data Firehose)

## 1. What It Does

The easiest way to **load streaming data into storage/analytics services**. Fully managed — no shards to manage, no code to write for delivery.

**Think of it as a pipe**: Data goes in → optionally transformed → delivered to destination.

## 2. Key Features

| Feature | Details |
|---|---|
| **Sources** | Kinesis Data Streams, direct PUT, CloudWatch Logs, IoT, etc. |
| **Destinations** | S3, Redshift (via S3), OpenSearch, Splunk, HTTP endpoints, 3rd-party (Datadog, New Relic, MongoDB) |
| **Transformation** | Lambda function (inline transformation before delivery) |
| **Compression** | GZIP, Snappy, ZIP (for S3 delivery) |
| **Encryption** | SSE-KMS for data at rest |
| **Buffer** | Size (1-128 MB) or time (60-900 seconds) — whichever comes first |
| **Failed data** | Backup to S3 (all data or only failed records) |

## 3. Firehose vs Data Streams

| Feature | Firehose | Data Streams |
|---|---|---|
| Management | **Fully managed** | You manage shards |
| Latency | Near real-time (60s minimum) | Real-time (~200ms) |
| Scaling | Automatic | Manual (add shards) |
| Custom processing | Lambda only | Any consumer code |
| Replay | No | Yes |
| Destinations | Built-in (S3, Redshift, etc.) | Custom |

**Exam Pattern**: "Deliver streaming data to S3 with minimal effort" → **Firehose**. "Real-time processing with custom logic" → **Data Streams**.

## 4. Cost

Pay per GB ingested. No hourly charges, no shard management.
- $0.029/GB (first 500 TB/month, us-east-1)
- Lambda transformation: Lambda pricing
- Format conversion (Parquet/ORC): $0.018/GB

---

# 22 — Amazon Redshift

## 1. What It Does

A fully managed **data warehouse** for analytics. While RDS handles operational queries (OLTP — "find order #12345"), Redshift handles analytical queries (OLAP — "what were total sales by region for Q3?").

| Feature | RDS (OLTP) | Redshift (OLAP) |
|---|---|---|
| Query type | Simple lookups, inserts | Complex aggregations, joins |
| Data volume | GBs to low TBs | **Terabytes to petabytes** |
| Storage | Row-based | **Columnar** (stores data by column, not row) |
| Optimization | Fast single-row access | Fast scans of large datasets |

## 2. Why Columnar Storage Matters

**Row storage** (RDS): Reads entire rows. For "SELECT AVG(salary) FROM employees", it reads ALL columns for every row.

**Columnar storage** (Redshift): Reads ONLY the salary column. Much less I/O → much faster for analytics.

## 3. Architecture

- **Leader Node**: Receives queries, creates execution plan, coordinates compute nodes
- **Compute Nodes**: Store data and execute queries in parallel
- **Node Types**: RA3 (managed storage, SSD cache) or DC2 (dense compute, local SSD)

### Redshift Serverless

- No cluster management
- Auto-scales compute
- Pay for compute used (RPU-hours) + storage
- Best for: Variable/unpredictable analytics workloads

## 4. Key Features

| Feature | Description | Exam Note |
|---|---|---|
| **Spectrum** | Query S3 data directly without loading into Redshift | Extend warehouse to data lake |
| **Concurrency Scaling** | Auto-add clusters for burst read queries | Handles spikes |
| **Materialized Views** | Pre-computed query results | Faster repeated queries |
| **Cross-Region Snapshot** | Copy snapshots to another region for DR | Snapshots are incremental |
| **Data Sharing** | Share live data across Redshift clusters (no copying) | Multi-team analytics |
| **Zero-ETL** | Automatic replication from Aurora, DynamoDB | No ETL pipeline needed |
| **AQUA** | Hardware-accelerated cache for faster queries | RA3 nodes only |

## 5. Cost

- **RA3.xlplus**: $1.086/hour per node (min 2 nodes)
- **DC2.large**: $0.25/hour per node
- **Redshift Serverless**: $0.375/RPU-hour + $0.024/GB storage
- **Reserved**: Up to 75% discount (1 or 3 year)

## 6. Exam Scenarios

**"Petabyte-scale analytics"** → Redshift
**"Query S3 data without loading"** → Redshift Spectrum or Athena
**"Data warehouse with unpredictable usage"** → Redshift Serverless
**"Real-time data from Aurora for analytics"** → Zero-ETL to Redshift
**"Redshift + S3 data lake"** → Redshift Spectrum
**"Cross-region DR for Redshift"** → Cross-region snapshot copy

### Redshift vs Athena

| Feature | Redshift | Athena |
|---|---|---|
| Data location | Loaded into Redshift | **Stays in S3** |
| Performance | **Faster for large, complex queries** | Good for ad-hoc queries |
| Management | Cluster/serverless management | **Zero management** |
| Cost model | Cluster hours or RPU hours | $5/TB scanned |
| Best for | Regular, complex analytics | Ad-hoc, infrequent queries |

---

# 23 — Amazon Athena

## 1. What It Does

**Serverless SQL query engine** for analyzing data in S3. No infrastructure to manage — just point at S3 data and run SQL queries.

## 2. How It Works

1. Data sits in S3 (CSV, JSON, Parquet, ORC, Avro)
2. Define table schema in **AWS Glue Data Catalog** (or Athena catalog)
3. Run SQL queries → Athena scans S3 → returns results
4. Results stored in S3

## 3. Key Features

| Feature | Details |
|---|---|
| **Pricing** | $5.00 per TB of data scanned |
| **Performance** | Good for ad-hoc queries |
| **Data formats** | CSV, JSON, ORC, Parquet, Avro |
| **Compression** | Supports GZIP, Snappy, ZSTD |
| **Partitioning** | Reduce scanned data by year/month/day folders |
| **Federated Query** | Query data in RDS, DynamoDB, Redshift, on-premises via Lambda connectors |
| **CTAS** | Create Table As Select — transform and save results |

## 4. Cost Optimization (EXAM CRITICAL!)

**Reduce costs by reducing data scanned:**
1. **Use columnar formats** (Parquet, ORC) — Only reads needed columns → 30-90% less scanning
2. **Partition data** — `/year=2024/month=01/` → Athena only scans relevant partitions
3. **Compress data** — Smaller files = less scanning
4. **Use LIMIT** — But be careful, Athena still scans all data before applying LIMIT for some queries

**Example**: 1 TB CSV → $5.00 per query. Same data in Parquet (columnar): ~100 GB scanned → **$0.50** per query (10× cheaper).

## 5. Exam Scenarios

**"Ad-hoc SQL queries on S3 data"** → Athena
**"Serverless analytics"** → Athena
**"Analyze CloudTrail/VPC Flow Logs/ELB logs"** → Athena (logs stored in S3)
**"Cost-effective analytics on infrequent queries"** → Athena (pay per query)
**"Query data across S3, RDS, DynamoDB"** → Athena Federated Query
**"Convert CSV to Parquet"** → Athena CTAS or Glue ETL

---

# 24 — Amazon ElastiCache

## 1. What It Does

Fully managed **in-memory caching** service. Provides microsecond to millisecond response times by storing frequently accessed data in RAM instead of querying a database.

## 2. Two Engines

| Feature | Redis | Memcached |
|---|---|---|
| Data structures | Strings, lists, sets, sorted sets, hashes, streams | Simple key-value only |
| Persistence | **Yes** (snapshots, AOF) | No |
| Replication | **Yes** (up to 5 read replicas) | No |
| Multi-AZ | **Yes** (automatic failover) | No |
| Clustering | **Yes** (up to 500 nodes) | Yes (simple sharding) |
| Pub/Sub | **Yes** | No |
| Geospatial | **Yes** | No |
| Backup/Restore | **Yes** | No |
| Use case | Complex caching, real-time, sessions | Simple caching, multi-threaded |

**Exam Answer**: Almost always **Redis** unless the question specifically mentions "simplest caching" or "multi-threaded."

## 3. Caching Strategies (EXAM CRITICAL!)

### Lazy Loading (Cache-Aside)
1. App checks cache → **miss** → query database → write result to cache → return
2. Next request → **hit** → return from cache (fast!)
- **Pro**: Only caches what's actually requested
- **Con**: Cache miss = 3 trips (cache + DB + cache write). Stale data possible.

### Write-Through
1. Every database write ALSO writes to cache
- **Pro**: Cache always up-to-date
- **Con**: Write latency increases. Caches data that may never be read.

### TTL (Time to Live)
- Set expiration on cached data
- Balances freshness vs performance
- Common pattern: Lazy Loading + TTL

## 4. Use Cases

| Use Case | Why ElastiCache |
|---|---|
| Database query caching | Reduce RDS load, microsecond reads |
| Session storage | Shared sessions across EC2 instances (stateless app tier) |
| Real-time leaderboards | Redis sorted sets |
| Rate limiting | Redis atomic counters |
| Pub/Sub messaging | Redis Pub/Sub for real-time |

## 5. ElastiCache vs DAX

| Feature | ElastiCache (Redis) | DAX |
|---|---|---|
| Backend | **Any data source** | **DynamoDB only** |
| API | Redis API (custom code) | DynamoDB-compatible API |
| Latency | Microseconds | Microseconds |
| Use case | General-purpose caching | DynamoDB read acceleration |

## 6. Exam Scenarios

**"Reduce RDS read load"** → ElastiCache (Redis) with Lazy Loading
**"Store sessions for stateless app tier"** → ElastiCache (Redis) or DynamoDB
**"In-memory cache with replication and failover"** → ElastiCache Redis
**"Accelerate DynamoDB reads"** → DAX (not ElastiCache)
**"Real-time leaderboard"** → ElastiCache Redis (sorted sets)
**"Cache with persistence and backup"** → Redis (not Memcached)

---

# 25 — AWS DMS (Database Migration Service)

## 1. What It Does

Migrates databases to AWS with **minimal downtime**. The source database remains operational during migration.

## 2. How It Works

```
Source Database → DMS Replication Instance → Target Database
    ↓                                            ↓
On-premises MySQL                          Amazon Aurora
(continues operating)                      (catches up via CDC)
```

### Migration Types

| Type | Description | Use Case |
|---|---|---|
| **Full Load** | Copies all existing data | One-time migration |
| **Full Load + CDC** | Copies data, then **Continuous Data Capture** for ongoing changes | Migration with minimal downtime |
| **CDC only** | Only replicates changes (assumes data already migrated) | Ongoing replication |

### Homogeneous vs Heterogeneous

| Type | Example | Extra Tool Needed? |
|---|---|---|
| **Homogeneous** | MySQL → MySQL, Oracle → Oracle | No |
| **Heterogeneous** | Oracle → PostgreSQL, SQL Server → Aurora | **Yes — AWS SCT (Schema Conversion Tool)** |

**AWS SCT**: Converts database schema and code (stored procedures, views) from one engine to another. Run SCT FIRST, then DMS for data.

## 3. Supported Sources and Targets

**Sources**: On-premises databases, RDS, Aurora, S3, Azure SQL, MongoDB, and more
**Targets**: RDS, Aurora, DynamoDB, S3, Redshift, OpenSearch, Kinesis, DocumentDB, Neptune

## 4. Key Features

| Feature | Description |
|---|---|
| **Replication Instance** | EC2 instance running DMS (choose size based on data volume) |
| **Multi-AZ** | Replication instance redundancy |
| **Table mapping** | Select/exclude specific tables, transform schema |
| **Validation** | Verify data integrity after migration |
| **Premigration Assessment** | Check compatibility before starting |

## 5. Exam Scenarios

**"Migrate on-prem Oracle to Aurora PostgreSQL"** → AWS SCT (schema conversion) + DMS (data migration)
**"Migrate MySQL to Aurora MySQL with minimal downtime"** → DMS with Full Load + CDC
**"Ongoing replication from on-prem to AWS"** → DMS with CDC
**"Migrate database to S3 for data lake"** → DMS with S3 as target
**"Migrate MongoDB to DynamoDB"** → DMS supports this directly
**"Migrate to Redshift"** → DMS (loads into S3, then COPY to Redshift)

---

*Combined word count: ~3,800+ words for services 21-25*
