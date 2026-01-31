# Amazon RDS: Complete Guide

## Table of Contents
1. [RDS History & Evolution](#rds-history--evolution)
2. [RDS Fundamentals](#rds-fundamentals)
3. [Database Engines](#database-engines)
4. [Multi-AZ Deployments](#multi-az-deployments)
5. [Read Replicas](#read-replicas)
6. [Backups & Recovery](#backups--recovery)
7. [Parameter Groups](#parameter-groups)
8. [Performance Insights](#performance-insights)
9. [PostgreSQL Docker Replication](#postgresql-docker-replication)
10. [Interview Questions](#interview-questions)

---

## RDS History & Evolution

### Before RDS (Pre-2009)

**Self-Managed Databases**:
```
Tasks:
❌ Provision servers
❌ Install database software
❌ Configure replication
❌ Set up backups
❌ Apply patches
❌ Monitor performance
❌ Handle failover manually

Time: 2-3 weeks to set up HA database
Expertise: Requires DBA skills
Cost: Server + DBA salary ($100K/year)
```

**Problems**:
```
1. Maintenance Burden:
   - Security patches every month
   - Database upgrades
   - OS updates
   
2. High Availability:
   - Manual failover (downtime: 15-30 minutes)
   - Complex replication setup
   
3. Backup Management:
   - Custom scripts
   - Off-site storage
   - Recovery testing
```

### RDS Launch (October 2009)

**Relational Database Service**: Managed MySQL database.

**Revolutionary Features**:
```
✅ Automated backups (point-in-time recovery)
✅ Automated patching
✅ Multi-AZ deployments (auto failover)
✅ Monitoring (CloudWatch integration)
✅ Scaling (vertical: resize instance)
✅ Pay-as-you-go pricing

Initial Engine: MySQL 5.1
Cost: $0.11/hour for db.m1.small
```

### Evolution Timeline

```
2009: RDS Launch (MySQL)
2011: Oracle support
2012: PostgreSQL support, Read Replicas
2013: SQL Server support
2014: Aurora (MySQL-compatible, 5x performance)
2015: MariaDB support, Enhanced Monitoring
2016: Aurora PostgreSQL-compatible
2017: Database Migration Service (DMS)
2018: Performance Insights (query-level metrics)
2019: RDS Proxy (connection pooling)
2020: Aurora Serverless v2
2021: RDS Blue/Green Deployments
2022: RDS Optimized Writes (2x write throughput)
2023: Aurora Limitless (horizontal scaling)
```

### Why RDS Was Created

**Problem 1: Undifferentiated Heavy Lifting**
```
Before: Spend 70% time on maintenance, 30% on features
After: Spend 5% time on database config, 95% on features

AWS handles:
- Hardware provisioning
- Database setup
- Patching
- Backups
- Failover

ROI: Faster time to market
```

**Problem 2: High Availability Complexity**
```
Before (Self-Managed):
1. Setup master-slave replication (2 days)
2. Monitor replication lag (custom scripts)
3. Failover process (manual, 15-30 min downtime)

After (RDS Multi-AZ):
1. Check "Enable Multi-AZ" box
2. Automatic failover (1-2 minutes)
3. Zero data loss (synchronous replication)

Setup time: 2 days → 5 minutes
Failover time: 15-30 min → 1-2 min
```

**Problem 3: Disaster Recovery**
```
Before:
- Daily backups (cron job)
- Store backups offsite (S3, Glacier)
- Test recovery (quarterly)
- Recovery: Manual restore (hours)

After:
- Automated backups (every day, 35 days retention)
- Point-in-time recovery (to any second)
- Restore: One click (minutes)
```

---

## RDS Fundamentals

### Database Instance Classes

**General Purpose (db.t, db.m)**:
```
db.t3.micro:
- 2 vCPUs
- 1 GB RAM
- Burstable CPU
- $0.017/hour = $12.40/month

db.m5.large:
- 2 vCPUs
- 8 GB RAM
- Sustained performance
- $0.192/hour = $140/month
```

**Memory Optimized (db.r, db.x)**:
```
db.r5.xlarge:
- 4 vCPUs
- 32 GB RAM (8:1 ratio)
- $0.48/hour = $350/month

Use case: In-memory operations, large datasets
```

**Burstable (db.t3, db.t4g)**:
```
CPU Credits:
- Earn credits when idle (below baseline)
- Spend credits when busy (above baseline)

Baseline: 20% CPU (for db.t3)
Burst: Up to 100% CPU (using credits)

Use case: Dev/test, low-traffic apps
```

### Storage Types

**General Purpose SSD (gp2, gp3)**:
```
gp3 (Recommended):
- Baseline: 3,000 IOPS (125 MB/s)
- Scalable: Up to 16,000 IOPS (1,000 MB/s)
- Size: 20 GB - 64 TB
- Cost: $0.115/GB/month

gp2 (Legacy):
- IOPS: 3 IOPS per GB (100 GB = 300 IOPS)
- Burst: Up to 3,000 IOPS
- Cost: $0.115/GB/month

Use case: General workloads
```

**Provisioned IOPS SSD (io1, io2)**:
```
io2:
- IOPS: Up to 64,000 IOPS
- Size: 100 GB - 64 TB
- Latency: <1 ms
- Cost: $0.125/GB/month + $0.065/IOPS/month

Example: 500 GB, 10,000 IOPS
= 500 × $0.125 + 10,000 × $0.065 = $712.50/month

Use case: High-performance databases, OLTP
```

**Magnetic (standard)** - Deprecated:
```
Legacy storage (not recommended)
```

### Storage Autoscaling

**Automatic expansion**:
```
Initial: 100 GB
Max: 1,000 GB

Trigger: <10% free space
Action: Increase by 10% or 10 GB (whichever is greater)

Example:
100 GB → 90 GB used → Scale to 110 GB
110 GB → 99 GB used → Scale to 121 GB
```

---

## Database Engines

### MySQL

**Versions**: 5.7, 8.0
```
Features:
✅ InnoDB storage engine
✅ JSON support
✅ Full-text search
✅ Replication

Use case: Web applications, e-commerce
```

### PostgreSQL

**Versions**: 11, 12, 13, 14, 15
```
Features:
✅ Advanced data types (JSON, JSONB, arrays, hstore)
✅ Full-text search
✅ PostGIS (geospatial)
✅ Parallel queries
✅ ACID compliance

Use case: Analytics, geospatial applications
```

### MariaDB

**MySQL fork** (created by MySQL founder):
```
Features:
✅ MySQL compatible
✅ Better performance (Aria storage engine)
✅ More storage engines
✅ Advanced replication

Use case: MySQL replacement
```

### Oracle

**Commercial database**:
```
Editions:
- Standard Edition 2 (SE2)
- Enterprise Edition (EE)

Licensing:
- License Included (pay AWS)
- BYOL (Bring Your Own License)

Cost:
SE2: $0.35/hour
EE: $3.50/hour

Use case: Enterprise applications, legacy Oracle apps
```

### SQL Server

**Microsoft SQL Server**:
```
Editions:
- Express (free, limited to 10 GB)
- Web
- Standard
- Enterprise

Versions: 2016, 2017, 2019, 2022

Cost:
Express: $0.06/hour
Enterprise: $6.50/hour

Use case: .NET applications, Windows environments
```

### Aurora

**AWS-built MySQL/PostgreSQL compatible**:
```
Features:
✅ 5x faster than MySQL
✅ 3x faster than PostgreSQL
✅ 6 copies across 3 AZs (HA)
✅ Continuous backup to S3
✅ Up to 15 Read Replicas
✅ Auto-scaling storage (10 GB - 128 TB)

Cost: 20% higher than RDS, but better performance

Use case: High-performance, HA applications
```

---

## Multi-AZ Deployments

### Architecture

```
┌────────────────────────────────────────────┐
│ Region: us-east-1                          │
│                                            │
│  AZ-1a                    AZ-1b            │
│  ┌──────────┐            ┌──────────┐     │
│  │ Primary  │ Sync Rep  │ Standby  │     │
│  │ Database │◄──────────►│ Database │     │
│  └────┬─────┘            └──────────┘     │
│       │                                    │
│  Application                               │
│  (writes/reads)                            │
└────────────────────────────────────────────┘
```

### How It Works

**Synchronous Replication**:
```
1. Application → Write to Primary
2. Primary → Replicate to Standby (synchronous)
3. Standby → Acknowledge
4. Primary → Return success to Application

Zero data loss: Write confirmed only after standby ack
```

**Automatic Failover**:
```
Failure Scenarios:
- Primary instance failure
- AZ failure
- Network connectivity loss
- Storage failure

Failover Process:
1. RDS detects failure (1-2 minutes)
2. DNS updates to Standby IP
3. Standby promoted to Primary
4. Application reconnects (same endpoint)

Downtime: 1-2 minutes
Data loss: Zero (synchronous replication)
```

### Enabling Multi-AZ

```bash
# Create Multi-AZ RDS instance
aws rds create-db-instance \
  --db-instance-identifier mydb \
  --db-instance-class db.m5.large \
  --engine postgres \
  --master-username admin \
  --master-user-password MyPassword123 \
  --allocated-storage 100 \
  --storage-type gp3 \
  --multi-az \
  --vpc-security-group-ids sg-12345 \
  --db-subnet-group-name my-db-subnet-group

# Convert existing instance to Multi-AZ
aws rds modify-db-instance \
  --db-instance-identifier mydb \
  --multi-az \
  --apply-immediately
```

### Multi-AZ vs Single-AZ

| Feature | Single-AZ | Multi-AZ |
|---------|-----------|----------|
| Availability | 99.5% | 99.95% |
| Failover | Manual (hours) | Automatic (1-2 min) |
| Data Loss | Possible | Zero |
| Cost | $140/month | $280/month (2x) |
| Maintenance | Downtime | Zero downtime |

### Maintenance Windows

**Without Multi-AZ**:
```
Patching → Database offline (30-60 minutes)
```

**With Multi-AZ**:
```
1. Patch Standby
2. Failover to Standby (1-2 min downtime)
3. Patch old Primary (now Standby)
4. Failback (optional)

Total downtime: 1-2 minutes
```

---

## Read Replicas

### Architecture

```
┌────────────────────────────────────────────────────┐
│ Region: us-east-1                                  │
│                                                    │
│  ┌──────────┐    Async    ┌──────────┐            │
│  │ Primary  │───────────→ │ Replica1 │            │
│  │ (Master) │             └──────────┘            │
│  └────┬─────┘                                      │
│       │         Async    ┌──────────┐             │
│       └─────────────────→│ Replica2 │             │
│                          └──────────┘             │
│                                                    │
│  Application:                                      │
│  - Writes → Primary                                │
│  - Reads → Replicas (load distribution)           │
└────────────────────────────────────────────────────┘
```

### How It Works

**Asynchronous Replication**:
```
1. Write to Primary
2. Primary acknowledges immediately
3. Primary replicates to Replicas (async, eventually consistent)

Replication Lag: Typically <1 second
```

### Use Cases

**1. Read Scaling**:
```
Application:
- 10% writes → Primary
- 90% reads → 5 Read Replicas

Benefit: 5x read capacity
```

**2. Reporting**:
```
Production DB: Primary
Reporting queries: Read Replica

Benefit: Heavy reports don't impact production
```

**3. Cross-Region DR**:
```
Primary: us-east-1
Read Replica: eu-west-1

Disaster Recovery:
1. us-east-1 region failure
2. Promote eu-west-1 replica to Primary
3. Point application to new Primary

RPO (Recovery Point Objective): Replication lag (~1 sec)
RTO (Recovery Time Objective): Promotion time (~5 min)
```

### Creating Read Replicas

```bash
# Create Read Replica (same region)
aws rds create-db-instance-read-replica \
  --db-instance-identifier mydb-replica1 \
  --source-db-instance-identifier mydb \
  --db-instance-class db.m5.large

# Create Cross-Region Read Replica
aws rds create-db-instance-read-replica \
  --db-instance-identifier mydb-replica-eu \
  --source-db-instance-identifier mydb \
  --region eu-west-1 \
  --db-instance-class db.m5.large

# Promote Read Replica to standalone
aws rds promote-read-replica \
  --db-instance-identifier mydb-replica1
```

### Read Replica Limits

| Engine | Max Replicas |
|--------|--------------|
| MySQL | 5 |
| PostgreSQL | 5 |
| MariaDB | 5 |
| Oracle | N/A (not supported) |
| SQL Server | N/A (not supported) |
| Aurora | 15 |

### Multi-AZ + Read Replicas

**Combined Architecture**:
```
Primary (Multi-AZ):
  AZ-1a: Primary
  AZ-1b: Standby (synchronous)

Read Replicas (async from Primary):
  AZ-1a: Replica 1
  AZ-1b: Replica 2
  us-west-2: Replica 3 (cross-region)

Benefits:
- High availability (Multi-AZ failover)
- Read scaling (3 Read Replicas)
- Disaster recovery (cross-region replica)
```

---

## Backups & Recovery

### Automated Backups

**Daily snapshots + transaction logs**:
```
Retention: 1-35 days (default: 7 days)
Backup Window: Specify time (e.g., 03:00-04:00 UTC)
Storage: S3 (no charge for storage ≤ DB size)

Point-in-Time Recovery:
- Restore to any second within retention period
- Creates new DB instance
```

**Enabling Automated Backups**:
```bash
aws rds modify-db-instance \
  --db-instance-identifier mydb \
  --backup-retention-period 30 \
  --preferred-backup-window "03:00-04:00"
```

**Backup Process**:
```
Single-AZ: I/O suspension during snapshot (~5 min)
Multi-AZ: Snapshot from Standby (no impact on Primary)
```

### Manual Snapshots

**User-initiated snapshots**:
```
Retention: Indefinite (until manually deleted)
Cost: $0.095/GB/month (S3 storage)

Use case: Pre-upgrade backup, compliance
```

```bash
# Create manual snapshot
aws rds create-db-snapshot \
  --db-instance-identifier mydb \
  --db-snapshot-identifier mydb-snapshot-2023-11-01

# List snapshots
aws rds describe-db-snapshots \
  --db-instance-identifier mydb

# Delete snapshot
aws rds delete-db-snapshot \
  --db-snapshot-identifier mydb-snapshot-2023-11-01
```

### Restoring from Backup

**Point-in-Time Restore**:
```bash
# Restore to specific time
aws rds restore-db-instance-to-point-in-time \
  --source-db-instance-identifier mydb \
  --target-db-instance-identifier mydb-restored \
  --restore-time 2023-11-01T14:30:00Z
```

**Restore from Snapshot**:
```bash
aws rds restore-db-instance-from-db-snapshot \
  --db-instance-identifier mydb-restored \
  --db-snapshot-identifier mydb-snapshot-2023-11-01
```

**Important Notes**:
```
❌ Cannot restore over existing DB (creates new instance)
✅ Can restore to different instance class
✅ Can restore to different VPC
✅ Can restore to different region (from snapshot)
```

### Backup Strategy

**Example: Production Database**
```
Automated Backups:
- Retention: 30 days
- Backup Window: 02:00-03:00 UTC (low traffic)

Manual Snapshots:
- Before major upgrades
- Monthly (compliance: keep 1 year)

Cross-Region Snapshots:
- Copy automated snapshot to dr-region
- Frequency: Daily (via Lambda)

Cost:
- Automated: Free (≤ DB size)
- Manual: $0.095/GB × 500 GB × 12 months = $570/year
```

---

## Parameter Groups

### What are Parameter Groups?

**Database configuration**:
```
Parameter Group = Collection of DB engine parameters

Examples:
- max_connections (PostgreSQL)
- innodb_buffer_pool_size (MySQL)
- query_cache_size (MySQL)
```

### Default vs Custom

**Default Parameter Group**:
```
Cannot modify default parameter group
Must create custom parameter group
```

**Creating Custom Parameter Group**:
```bash
# Create parameter group
aws rds create-db-parameter-group \
  --db-parameter-group-name my-postgres-params \
  --db-parameter-group-family postgres14 \
  --description "Custom PostgreSQL parameters"

# Modify parameters
aws rds modify-db-parameter-group \
  --db-parameter-group-name my-postgres-params \
  --parameters \
    "ParameterName=max_connections,ParameterValue=200,ApplyMethod=pending-reboot" \
    "ParameterName=shared_buffers,ParameterValue='{DBInstanceClassMemory/4}',ApplyMethod=pending-reboot"

# Apply to DB instance
aws rds modify-db-instance \
  --db-instance-identifier mydb \
  --db-parameter-group-name my-postgres-params \
  --apply-immediately
```

### Common Parameters

**PostgreSQL**:
```
max_connections: 100 (default) → 500
  Impact: More concurrent connections
  Reboot: Required

shared_buffers: 25% of RAM
  Impact: Buffer cache size
  Reboot: Required

work_mem: 4 MB (default) → 16 MB
  Impact: Memory per sort/hash operation
  Reboot: Not required

log_statement: 'none' → 'all'
  Impact: Log all SQL statements
  Reboot: Not required
```

**MySQL**:
```
max_connections: 150 (default) → 500
innodb_buffer_pool_size: 70% of RAM
query_cache_size: 0 (disabled in MySQL 8.0)
slow_query_log: 1 (enabled)
long_query_time: 2 (seconds)
```

### Dynamic vs Static Parameters

**Dynamic**: Apply without reboot.
**Static**: Require reboot.

```bash
# Check if reboot required
aws rds describe-db-instances \
  --db-instance-identifier mydb \
  --query 'DBInstances[0].PendingModifiedValues'

# Reboot if needed
aws rds reboot-db-instance \
  --db-instance-identifier mydb
```

---

## Performance Insights

### What is Performance Insights?

**Database performance monitoring**:
```
Metrics:
- Query-level statistics
- Wait events
- Top SQL statements
- Database load

Retention:
- Free tier: 7 days
- Paid: Up to 2 years
```

### Enabling Performance Insights

```bash
aws rds modify-db-instance \
  --db-instance-identifier mydb \
  --enable-performance-insights \
  --performance-insights-retention-period 7
```

### Key Metrics

**Database Load (DB Load)**:
```
Average Active Sessions (AAS)
= Number of sessions executing queries

Target: AAS < vCPU count

Example:
db.m5.large (2 vCPUs)
AAS = 5 → Overloaded (5 > 2)
AAS = 1.5 → Healthy (1.5 < 2)
```

**Top SQL**:
```
Queries ranked by:
- Total execution time
- Calls per second
- Average latency

Example:
Query: SELECT * FROM users WHERE email = ?
Calls: 10,000/sec
Avg latency: 50 ms
Total time: 500 seconds

Optimization: Add index on email column
```

**Wait Events**:
```
CPU: Query execution
I/O: Disk reads/writes
Lock: Waiting for locks
Network: Client communication

Example:
Wait Event: IO:DataFileRead (70% of time)
→ Solution: Increase IOPS, optimize queries
```

### Performance Tuning

**Example: Slow Queries**
```
Problem: Query takes 5 seconds

Performance Insights:
- Top SQL: SELECT * FROM orders WHERE user_id = ?
- Wait Event: IO:DataFileRead (90%)

Analysis:
- Table scan (no index on user_id)
- 1M rows scanned

Solution:
CREATE INDEX idx_user_id ON orders(user_id);

Result: Query time 5s → 50ms
```

---

## PostgreSQL Docker Replication

### Master-Slave Replication

**docker-compose.yml**:
```yaml
version: '3.8'

services:
  # Master database
  postgres-master:
    image: postgres:14
    environment:
      POSTGRES_USER: admin
      POSTGRES_PASSWORD: password
      POSTGRES_DB: mydb
    volumes:
      - master-data:/var/lib/postgresql/data
      - ./master-init.sh:/docker-entrypoint-initdb.d/init.sh
    ports:
      - "5432:5432"
    command: postgres -c wal_level=replica -c max_wal_senders=3

  # Slave database (Read Replica)
  postgres-slave:
    image: postgres:14
    environment:
      POSTGRES_USER: replicator
      POSTGRES_PASSWORD: replica_password
    volumes:
      - slave-data:/var/lib/postgresql/data
      - ./slave-init.sh:/docker-entrypoint-initdb.d/init.sh
    ports:
      - "5433:5432"
    depends_on:
      - postgres-master

volumes:
  master-data:
  slave-data:
```

**master-init.sh**:
```bash
#!/bin/bash
# Create replication user
psql -U admin -d mydb <<EOF
CREATE ROLE replicator WITH REPLICATION LOGIN PASSWORD 'replica_password';
EOF

# Configure pg_hba.conf for replication
cat >> /var/lib/postgresql/data/pg_hba.conf <<EOF
host replication replicator 0.0.0.0/0 md5
EOF

# Reload configuration
psql -U admin -c "SELECT pg_reload_conf();"
```

**slave-init.sh**:
```bash
#!/bin/bash
# Stop PostgreSQL
pg_ctl stop

# Remove data directory
rm -rf /var/lib/postgresql/data/*

# Base backup from master
pg_basebackup -h postgres-master -U replicator -D /var/lib/postgresql/data -P -R

# Start PostgreSQL
pg_ctl start
```

### Testing Replication

**Python Script**:
```python
import psycopg2
import time

# Connect to master
master_conn = psycopg2.connect(
    host="localhost",
    port=5432,
    user="admin",
    password="password",
    database="mydb"
)

# Connect to slave
slave_conn = psycopg2.connect(
    host="localhost",
    port=5433,
    user="admin",
    password="password",
    database="mydb"
)

# Create table on master
master_cur = master_conn.cursor()
master_cur.execute("""
    CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        name VARCHAR(100),
        created_at TIMESTAMP DEFAULT NOW()
    )
""")
master_conn.commit()

# Insert data on master
master_cur.execute("INSERT INTO users (name) VALUES ('Alice')")
master_conn.commit()
print("Inserted into master")

# Wait for replication
time.sleep(2)

# Read from slave
slave_cur = slave_conn.cursor()
slave_cur.execute("SELECT * FROM users")
rows = slave_cur.fetchall()
print(f"Read from slave: {rows}")

# Check replication lag
master_cur.execute("SELECT pg_current_wal_lsn()")
master_lsn = master_cur.fetchone()[0]
print(f"Master LSN: {master_lsn}")

slave_cur.execute("SELECT pg_last_wal_replay_lsn()")
slave_lsn = slave_cur.fetchone()[0]
print(f"Slave LSN: {slave_lsn}")

# Close connections
master_conn.close()
slave_conn.close()
```

### Failover Simulation

**Promote Slave to Master**:
```bash
# Stop master (simulate failure)
docker stop postgres-master

# Promote slave to master
docker exec -it postgres-slave bash
pg_ctl promote
```

---

## Interview Questions

### Conceptual

**Q: Multi-AZ vs Read Replicas?**
```
Multi-AZ:
- Purpose: High availability
- Replication: Synchronous (zero data loss)
- Failover: Automatic (1-2 min)
- Endpoint: Single DNS endpoint
- Use case: Production databases

Read Replicas:
- Purpose: Read scaling, DR
- Replication: Asynchronous (eventual consistency)
- Failover: Manual promotion
- Endpoint: Separate endpoint per replica
- Use case: Read-heavy workloads, reporting

Combined:
Primary (Multi-AZ) + Read Replicas
- HA: Multi-AZ failover
- Read scaling: Distribute reads to replicas
- DR: Cross-region replica
```

**Q: When to use RDS vs Aurora?**
```
RDS:
✅ Standard MySQL/PostgreSQL compatibility
✅ Lower cost (if <5 Read Replicas)
✅ Specific engine version required
❌ Limited scaling (5 Read Replicas)
❌ Slower failover (1-2 min)

Aurora:
✅ 5x faster (MySQL-compatible)
✅ Up to 15 Read Replicas
✅ Faster failover (<30 sec)
✅ Auto-scaling storage
✅ Continuous backup to S3
❌ 20% more expensive
❌ Proprietary (vendor lock-in)

Decision:
- Small apps: RDS (lower cost)
- High performance: Aurora
- Read-heavy: Aurora (15 replicas)
- Strict MySQL version: RDS
```

**Q: How to minimize downtime during maintenance?**
```
Without Multi-AZ:
- Maintenance window → Database offline (30-60 min)
- Schedule during low-traffic period

With Multi-AZ:
1. Patch Standby
2. Failover to Standby (1-2 min)
3. Patch old Primary
Result: 1-2 min downtime

Blue/Green Deployments (2021+):
1. Create Green environment (clone)
2. Apply changes to Green
3. Test Green
4. Cutover to Green (switchover)
5. Rollback available (switch back to Blue)
Result: <1 min downtime, safe rollback

Best Practice:
- Multi-AZ for production
- Blue/Green for major upgrades
- Test failover regularly
```

### Design

**Q: Design RDS architecture for e-commerce site (1M users, 100K orders/day)**
```
Requirements:
- Writes: 100K orders/day = 1.15 orders/sec
- Reads: User browsing, order history (90% reads)
- High availability
- Disaster recovery

Architecture:

1. Primary Database (Multi-AZ):
   Engine: Aurora PostgreSQL
   Instance: db.r5.xlarge (32 GB RAM)
   Storage: Auto-scaling (10 GB - 128 TB)
   Multi-AZ: Enabled (AZ-1a primary, AZ-1b standby)

2. Read Replicas (5 replicas):
   us-east-1a: 2 replicas
   us-east-1b: 2 replicas
   us-west-2: 1 replica (DR)

3. Connection Pooling:
   RDS Proxy:
   - Max connections: 1000
   - Connection reuse
   - Failover without connection errors

4. Caching:
   ElastiCache (Redis):
   - Cache product catalog
   - Cache user sessions
   - TTL: 1 hour

5. Application Layer:
   Write operations → Primary
   Read operations → Read Replicas (load balanced)
   
   Read distribution:
   - Product catalog: Cache (80% hit rate)
   - User profile: Read Replica
   - Order history: Read Replica

6. Backup Strategy:
   Automated backups: 30 days retention
   Manual snapshots: Before major deployments
   Cross-region snapshot: Daily copy to us-west-2

7. Monitoring:
   Performance Insights: Enabled
   CloudWatch Alarms:
   - CPU > 80%
   - Connections > 900
   - Replication lag > 5 seconds
   - Disk free < 20%

Capacity Calculation:
Orders: 100K/day = 1.15/sec (writes)
Reads: 10x writes = 11.5/sec

Database sizing:
- Orders table: 100K × 365 × 5 years = 182M rows
- Storage: 182M × 2 KB/row = 364 GB

Instance type:
- Working set: 364 GB × 0.2 = 73 GB (active data)
- Buffer pool: 70% of RAM = 22 GB (db.r5.xlarge)
- Insufficient → Upgrade to db.r5.2xlarge (64 GB RAM)

Cost:
Primary (Multi-AZ): $0.48 × 2 × 730 = $700
Read Replicas: $0.48 × 5 × 730 = $1,752
RDS Proxy: $0.015 × 730 = $11
Backups: 364 GB × $0.095 = $35
Total: ~$2,500/month
```

**Q: Handle database failure with zero downtime**
```
Scenario: Primary database fails

Solution: Multi-AZ + Application Retry Logic

Architecture:
Primary: AZ-1a (db.m5.large)
Standby: AZ-1b (synchronous replication)

Failover Process:
1. Primary failure detected (30 sec)
2. RDS promotes Standby to Primary
3. DNS updated (mydb.abc123.us-east-1.rds.amazonaws.com → new IP)
4. Applications reconnect

Application Code (Python):
```python
import psycopg2
from psycopg2 import OperationalError
import time

def get_connection(max_retries=3):
    for attempt in range(max_retries):
        try:
            conn = psycopg2.connect(
                host="mydb.abc123.us-east-1.rds.amazonaws.com",
                port=5432,
                user="admin",
                password="password",
                database="mydb",
                connect_timeout=10
            )
            return conn
        except OperationalError as e:
            print(f"Connection failed (attempt {attempt + 1}): {e}")
            if attempt < max_retries - 1:
                time.sleep(5)  # Wait before retry
            else:
                raise

# Usage
conn = get_connection()
```

**Additional Measures**:
```
1. Connection Pooling (RDS Proxy):
   - Maintains connection pool
   - Automatic failover without app errors
   - No connection storm during failover

2. Read Replicas:
   - Promote Read Replica if Multi-AZ fails
   - Manual intervention (rare)

3. Monitoring:
   CloudWatch Alarm → SNS → PagerDuty
   - Alert on failover
   - Verify application recovery

Expected Downtime:
- DNS propagation: 30-60 sec
- Application retry: 5-10 sec
- Total: ~1 minute
```

---

This comprehensive RDS guide covers database engines, Multi-AZ, Read Replicas, backups, Performance Insights, and production architectures with PostgreSQL replication examples! 🗄️

