# Amazon RDS (Relational Database Service)

## What is RDS?

Amazon RDS is a managed relational database service that handles routine database tasks such as provisioning, patching, backup, recovery, and scaling. It supports multiple database engines and eliminates the operational overhead of managing databases.

## Why Use RDS?

### Key Benefits
- **Fully Managed**: Automated backups, patching, monitoring
- **High Availability**: Multi-AZ deployments with automatic failover
- **Scalability**: Vertical (resize instance) and horizontal (Read Replicas)
- **Security**: Encryption at rest and in transit, network isolation
- **Performance**: Optimized for database workloads
- **Cost-Effective**: Pay only for resources used

### Use Cases
- Web and mobile applications
- E-commerce platforms
- Enterprise applications
- SaaS applications
- Gaming applications
- Content management systems

## Supported Database Engines

### 1. **Amazon Aurora**
- MySQL and PostgreSQL compatible
- 5x faster than MySQL, 3x faster than PostgreSQL
- Up to 128 TB storage
- Up to 15 Read Replicas
- Serverless option available
- Global Database for multi-region

### 2. **MySQL**
- Versions: 5.7, 8.0
- Community edition
- Compatible with existing MySQL applications
- Max storage: 64 TB

### 3. **PostgreSQL**
- Versions: 11, 12, 13, 14, 15
- Advanced features (JSON, full-text search)
- Extensions support
- Max storage: 64 TB

### 4. **MariaDB**
- MySQL fork with additional features
- Versions: 10.4, 10.5, 10.6
- Compatible with MySQL
- Max storage: 64 TB

### 5. **Oracle**
- Standard Edition (SE2)
- Enterprise Edition (EE)
- Bring Your Own License (BYOL) or License Included
- Max storage: 64 TB

### 6. **Microsoft SQL Server**
- Express, Web, Standard, Enterprise editions
- Versions: 2016, 2017, 2019
- License Included or BYOL
- Max storage: 16 TB

## RDS Instance Types

### General Purpose (db.t3, db.m5, db.m6i)
**db.t3** - Burstable:
- CPU credits
- Use: Development, low-traffic apps
- Cost: $0.017/hour (db.t3.micro) - $0.544/hour (db.t3.2xlarge)

**db.m5** - Balanced:
- Consistent performance
- Use: Most production workloads
- Cost: $0.076/hour (db.m5.large) - $18.336/hour (db.m5.24xlarge)

### Memory Optimized (db.r5, db.r6i, db.x2g)
**db.r5**:
- High memory-to-vCPU ratio
- Use: In-memory caches, analytics
- Cost: $0.120/hour (db.r5.large) - $28.80/hour (db.r5.24xlarge)

**db.x2g** (Graviton2):
- Up to 40% better price-performance
- Use: Memory-intensive workloads

### Compute Optimized (db.c5, db.c6i)
- High CPU performance
- Use: Compute-intensive queries

## Storage Types

### General Purpose SSD (gp2, gp3)

**gp3** (Recommended):
- **Baseline**: 3,000 IOPS, 125 MB/s
- **Max**: 16,000 IOPS, 1,000 MB/s
- **Size**: 20 GB - 64 TB
- **Cost**: $0.115/GB-month
- **Extra IOPS**: $0.10 per provisioned IOPS-month
- **Extra Throughput**: $0.16 per MB/s-month
- **Use**: Most workloads (99%)

**gp2** (Legacy):
- 3 IOPS per GB (100-16,000 IOPS)
- Burst to 3,000 IOPS
- Cost: $0.115/GB-month
- Use: Legacy, gp3 is better

**Example** (gp3 optimization):
```
1 TB database, need 10,000 IOPS:

gp3:
Storage: 1,000 GB × $0.115 = $115/month
IOPS: (10,000 - 3,000) × $0.10 = $700/month
Total: $815/month

gp2 (would need 3,334 GB for 10,000 IOPS):
Storage: 3,334 GB × $0.115 = $383/month

gp3 saves when you need more IOPS than size warrants
```

### Provisioned IOPS SSD (io1, io2)

**io2 Block Express**:
- **IOPS**: Up to 256,000
- **Throughput**: Up to 4,000 MB/s
- **Durability**: 99.999%
- **Cost**: $0.149/GB-month + $0.119/IOPS-month
- **Use**: Mission-critical, high-performance databases

**io1**:
- **IOPS**: Up to 64,000
- **Ratio**: 50 IOPS per GB
- **Cost**: $0.138/GB-month + $0.119/IOPS-month
- **Use**: Legacy, use io2

**When to Use**:
- OLTP workloads
- Low-latency requirements (<1ms)
- Sustained IOPS > 16,000

**Example** (io2):
```
500 GB, 40,000 IOPS:

Storage: 500 × $0.149 = $74.50/month
IOPS: 40,000 × $0.119 = $4,760/month
Total: $4,834.50/month

Only use for extreme performance needs
```

### Magnetic (Standard) - Deprecated
- Not recommended
- Legacy support only

## Storage Autoscaling

**What**: Automatically increase storage when threshold reached

**Configuration**:
```
Enable autoscaling: Yes
Maximum storage: 1000 GB
Threshold: 10% free space
```

**Behavior**:
- Scales when <10% free OR
- Low space >5 minutes OR
- 6 hours since last scale

**Benefits**:
- Prevent outages
- No manual intervention
- Cost-effective (pay for growth)

**Best Practice**: Enable for production databases

## RDS Multi-AZ Deployments

### What is Multi-AZ?

**Purpose**: High availability and disaster recovery

**How it Works**:
```
Primary DB (AZ-A)
    ↓ (Synchronous replication)
Standby DB (AZ-B)
    ↓ (Automatic failover)
Connection endpoint unchanged
```

**Characteristics**:
- **Synchronous replication**: Zero data loss
- **Automatic failover**: 1-2 minutes
- **Same region**: Different AZs
- **Single DNS name**: No application changes
- **Standby**: Not readable (use Read Replicas for read scaling)

### Multi-AZ Types

**1. Multi-AZ DB Instance** (Traditional):
```
Primary (AZ-1) ↔ Standby (AZ-2)
- Synchronous replication
- Failover: 60-120 seconds
- Supported: MySQL, PostgreSQL, MariaDB, Oracle, SQL Server
```

**2. Multi-AZ DB Cluster** (Newer):
```
Writer Instance (AZ-1)
    ↓
Reader Instance (AZ-2)
Reader Instance (AZ-3)
- 2 readable standbys
- Failover: <35 seconds
- Supported: MySQL, PostgreSQL
```

**Comparison**:
| Feature | DB Instance | DB Cluster |
|---------|-------------|------------|
| Readable standbys | No | Yes (2) |
| Failover time | 60-120s | <35s |
| Writer endpoint | 1 | 1 |
| Reader endpoint | N/A | 1 |
| Cost | Lower | Higher |

### When Failover Occurs

**Automatic Failover Triggers**:
- Primary DB instance failure
- AZ failure
- Instance type change
- OS patching
- Manual reboot with failover

**Failover Process**:
```
1. Detect failure (health checks)
2. Promote standby to primary
3. Update DNS to point to new primary
4. Old primary (if recoverable) becomes standby
```

**Application Impact**:
- 60-120 seconds downtime (DB Instance)
- <35 seconds downtime (DB Cluster)
- Connection strings unchanged
- In-flight transactions lost

**Best Practices**:
```python
# Handle transient errors
import time
from mysql.connector import Error

def execute_with_retry(query, max_retries=3):
    for attempt in range(max_retries):
        try:
            cursor.execute(query)
            return cursor.fetchall()
        except Error as e:
            if attempt < max_retries - 1:
                time.sleep(2 ** attempt)  # Exponential backoff
                continue
            raise
```

### Multi-AZ Cost

**Additional Costs**:
- 2x instance cost (primary + standby)
- 2x storage cost
- No additional charge for replication
- No charge for data transfer

**Example** (db.m5.large, 500 GB gp3):
```
Single-AZ:
Instance: $0.152/hour × 730 = $110.96/month
Storage: 500 × $0.115 = $57.50/month
Total: $168.46/month

Multi-AZ:
Instance: $0.304/hour × 730 = $221.92/month
Storage: 1,000 × $0.115 = $115/month
Total: $336.92/month (2x cost)
```

**When to Use Multi-AZ**:
- Production databases
- Applications requiring high availability
- Compliance requirements
- Databases with infrequent backups

**When NOT to Use**:
- Development/test environments
- Read-heavy workloads (use Read Replicas)
- Cost-sensitive non-critical applications

## Read Replicas

### What are Read Replicas?

**Purpose**: Scale read traffic, not for HA

**How it Works**:
```
Primary DB (read/write)
    ↓ (Asynchronous replication)
Read Replica 1 (read-only)
Read Replica 2 (read-only)
Read Replica 3 (read-only)
```

**Characteristics**:
- **Asynchronous replication**: Eventual consistency (seconds lag)
- **Read-only**: Cannot write to replicas
- **Separate endpoints**: Application chooses which to use
- **Cross-region**: Supported
- **Up to 15 replicas**: Aurora (5 for other engines)

### Use Cases

**1. Read Scaling**:
```
Application:
- Writes → Primary
- Reads → Load balance across replicas

Benefit: Reduce load on primary
```

**2. Reporting/Analytics**:
```
Production traffic → Primary
Analytics queries → Read Replica (no impact on production)
```

**3. Disaster Recovery**:
```
Primary (us-east-1)
    ↓
Read Replica (us-west-2)
    ↓ (Manual promotion)
Become standalone DB
```

**4. Cross-Region Low Latency**:
```
Primary (us-east-1)
    ↓
Read Replica (eu-west-1) - Local reads for EU users
```

### Creating Read Replicas

**Requirements**:
- Automated backups enabled
- Backup retention > 0 days

**Configuration**:
```
Source: my-primary-db
Replica name: my-read-replica
Region: Same or different
Instance class: Can be different from primary
Storage: Can be different type/size
Multi-AZ: Optional (replica can be Multi-AZ)
```

**Replication Lag**:
- Monitor: `ReplicaLag` CloudWatch metric
- Typically: <1 second
- Can increase during: Heavy writes, network issues, under-provisioned replica

### Read Replica Promotion

**What**: Convert replica to standalone database

**When**:
- Disaster recovery
- Testing new version
- Create separate database

**Process**:
```
1. Stop replication (automatic during promotion)
2. Promote replica to standalone
3. Replica becomes read/write
4. Original primary unchanged
```

**Impact**:
- Cannot undo
- Replica no longer syncs from primary
- Takes several minutes

### Cross-Region Read Replicas

**Benefits**:
- Local read performance for global users
- Disaster recovery
- Data locality compliance

**Considerations**:
- **Cost**: Data transfer $0.02/GB (cross-region)
- **Lag**: Higher than same-region (network latency)
- **Encryption**: Both must be encrypted

**Example**:
```
Primary: us-east-1 (MySQL 8.0)
    ↓
Read Replica: eu-west-1
    ↓
Read Replica: ap-southeast-1

Cost:
- Data transfer: 100 GB/day × $0.02 × 30 = $60/month
- Replica instances: Same as primary pricing
```

### Read Replicas vs Multi-AZ

| Feature | Read Replica | Multi-AZ |
|---------|--------------|----------|
| Purpose | Read scaling | High availability |
| Replication | Asynchronous | Synchronous |
| Readable | Yes | No (standby) |
| Regions | Same or cross | Same only |
| Failover | Manual | Automatic |
| Endpoint | Separate | Same |
| Data loss | Possible | None |
| Use case | Performance | Availability |

**Can Combine**:
```
Primary DB (Multi-AZ)
    ↓
Standby (AZ-B) - Not readable
    ↓
Read Replica (Multi-AZ) - Readable + HA
```

## Backups and Snapshots

### Automated Backups

**What**: Daily full backup + transaction logs

**Retention**: 0-35 days (0 disables)

**Backup Window**: Specify 30-minute window or let AWS choose

**Process**:
```
1. Daily snapshot of storage volume
2. Transaction logs backed up every 5 minutes
3. Point-in-time recovery (PITR) to any second in retention period
```

**Storage Location**: S3 (managed by AWS)

**Cost**: 
- Included up to 100% of database storage
- Additional: $0.095/GB-month

**Example**:
```
Database: 500 GB
Retention: 7 days
Backup size: ~500 GB (first day) + daily changes

Cost: Included (within 500 GB limit)
```

**Restore**:
```
Creates new RDS instance
Choose point in time (within retention)
Restore time: Depends on size and activity
```

### Manual Snapshots

**What**: User-initiated backups

**Retention**: Indefinite (until manually deleted)

**Cost**: $0.095/GB-month

**Use Cases**:
- Before major changes
- Long-term retention
- Share across accounts
- Compliance

**Creating Snapshot**:
```
Source: my-database
Snapshot name: my-snapshot-2026-01-31
Encryption: Inherit or change
```

**Sharing Snapshots**:
```
1. Manual snapshot only (not automated)
2. Share with specific AWS account
3. Recipient can restore in their account
4. Encrypted snapshots require KMS key sharing
```

**Cross-Region Copy**:
```
Source: Snapshot in us-east-1
Destination: us-west-2
Encryption: Can enable/change KMS key

Cost: $0.095/GB-month (in destination) + data transfer
```

### Backup Best Practices

**1. Retention Strategy**:
```
Development: 1 day (automated)
Production: 7-35 days (automated) + monthly snapshots
Compliance: Manual snapshots (7+ years)
```

**2. Test Restores**:
```
Monthly: Restore from backup to test instance
Verify: Data integrity, performance
Document: Restore time (RTO)
```

**3. Cross-Region Snapshots**:
```
Critical databases: Copy snapshots to secondary region
Frequency: Daily or after significant changes
```

**4. Snapshot Lifecycle**:
```
Use AWS Backup or Lambda to:
- Delete old snapshots
- Copy to Glacier for long-term retention
- Automate cross-region copies
```

## Encryption

### Encryption at Rest

**What**: Encrypt database storage, backups, snapshots

**Key Management**: AWS KMS (managed or customer managed keys)

**Scope**:
- Database files
- Automated backups
- Snapshots
- Read replicas
- Logs

**Enabling**:
- **New database**: Check "Enable encryption" during creation
- **Existing database**: Cannot enable directly (must restore from snapshot)

**Process to Encrypt Existing**:
```
1. Create snapshot of unencrypted DB
2. Copy snapshot with encryption enabled
3. Restore from encrypted snapshot
4. Update application to use new endpoint
5. Delete old unencrypted database
```

**Performance Impact**: Negligible (hardware-accelerated)

**Cost**: No additional charge (KMS key costs apply)

### Encryption in Transit

**What**: SSL/TLS connections between client and database

**Enabling**:
```
MySQL/MariaDB: Connect with SSL
PostgreSQL: require_ssl = 1 parameter
Oracle: Use SSL option group
SQL Server: Force_SSL parameter
```

**Client Configuration**:
```python
# Python MySQL example
import mysql.connector

connection = mysql.connector.connect(
    host='mydb.us-east-1.rds.amazonaws.com',
    user='admin',
    password='password',
    database='mydb',
    ssl_ca='/path/to/rds-ca-2019-root.pem'
)
```

**Certificate**: Download from AWS (RDS CA certificates)

**Enforcement**:
```sql
-- MySQL: Require SSL for user
ALTER USER 'myuser'@'%' REQUIRE SSL;

-- PostgreSQL: Set parameter
require_ssl = 1
```

## RDS Proxy

### What is RDS Proxy?

**Purpose**: Manage database connections, improve scalability

**Problems It Solves**:
1. **Connection pooling**: Reduces database connection overhead
2. **Failover**: Faster recovery (66% faster than native)
3. **IAM auth**: Centralized authentication
4. **Connection limits**: Prevents exhausting database connections

**Architecture**:
```
Application (Lambda, ECS)
    ↓ (Pooled connections)
RDS Proxy
    ↓ (Fewer connections)
RDS Database
```

### Use Cases

**1. Serverless Applications** (Primary use case):
```
Problem: Lambda creates new connections frequently
Solution: RDS Proxy pools connections

Without Proxy:
1,000 Lambda invocations = 1,000 DB connections
Database maxes out connections

With Proxy:
1,000 Lambda invocations → RDS Proxy → 100 DB connections
Proxy pools and reuses connections
```

**2. Microservices**:
```
Many services connecting to same database
Proxy manages connection pool
Prevents connection exhaustion
```

**3. Applications with Unpredictable Load**:
```
Spiky traffic patterns
Proxy maintains steady connection count
Database not overwhelmed
```

### Configuration

**Creating RDS Proxy**:
```
Target: my-database
Engine: MySQL 8.0
Authentication: Secrets Manager secret
Subnets: Private subnets (same as DB)
Security groups: Allow access from application
```

**Connection Pooling**:
```
Max connections: 100% of database max
Connection borrow timeout: 120 seconds
Init query: SET time_zone = '+00:00'
Session pinning filters: EXCLUDE_VARIABLE_SETS
```

**IAM Authentication**:
```
Enable IAM authentication
Application uses IAM role to connect
No passwords in code
```

### Benefits

**1. Reduced Failover Time**:
- Native RDS failover: 60-120 seconds
- With Proxy: <30 seconds (66% faster)
- Proxy maintains connections during failover

**2. Connection Pooling**:
```
100 application instances
Each needs 10 connections
Without Proxy: 1,000 connections needed
With Proxy: ~100-200 connections used

Benefit: Reduced database load
```

**3. IAM Integration**:
```python
import boto3
import pymysql

client = boto3.client('rds')
token = client.generate_db_auth_token(
    DBHostname='myproxy.proxy-xxxxxx.us-east-1.rds.amazonaws.com',
    Port=3306,
    DBUsername='admin'
)

connection = pymysql.connect(
    host='myproxy.proxy-xxxxxx.us-east-1.rds.amazonaws.com',
    user='admin',
    password=token,
    database='mydb',
    ssl={'ca': '/path/to/rds-ca-2019-root.pem'}
)
```

### Limitations

- **Supported engines**: MySQL, PostgreSQL, MariaDB only
- **No Oracle/SQL Server**: Not supported
- **Same region**: Proxy and database must be in same region
- **Private only**: No public access to proxy

### Cost

- $0.015/hour per vCPU (~$11/month for 2 vCPU)
- Data processed: No additional charge

**Example** (Small deployment):
```
Proxy: 2 vCPU × $0.015 × 730 hours = $21.90/month

Compare to:
- Over-provisioned database: $100+/month saved
- Connection management overhead: Time saved
```

### Best Practices

**1. Use with Lambda**:
```
Always use RDS Proxy with Lambda
Reuse connections in Lambda impossible
Proxy essential for Lambda + RDS
```

**2. Private Subnets**:
```
Deploy proxy in private subnets
Same VPC as database
Same security posture
```

**3. Monitor**:
```
CloudWatch Metrics:
- DatabaseConnections
- ClientConnections
- QueryDatabaseResponseLatency
```

## Performance Insights

### What is Performance Insights?

**Purpose**: Database performance monitoring and troubleshooting

**Features**:
- Identify performance bottlenecks
- Visualize database load
- Drill down into SQL statements
- Historical analysis (7 days free, up to 2 years paid)

**Dashboard**:
```
Database Load (Average Active Sessions)
    ↓
Top SQL: Queries consuming most resources
    ↓
Top Waits: What queries are waiting for
    ↓
Top Hosts: Which clients cause most load
```

### Metrics

**Database Load**:
- Average Active Sessions (AAS)
- Grouped by: SQL, Wait, User, Host

**Wait Types**:
- CPU
- I/O (disk reads/writes)
- Lock waits
- Network waits

**Example Analysis**:
```
High AAS → Top SQL → Slow query identified
Wait: I/O → Missing index
Action: Add index → Performance improved
```

### Enabling

**New Database**: Enable during creation
**Existing Database**: Modify database, enable Performance Insights

**Cost**:
- 7 days retention: Free
- Long-term (up to 2 years): $0.01/vCPU-hour (~$7/month for db.m5.large)

### Use Cases

**1. Slow Query Investigation**:
```
1. Performance Insights shows high AAS
2. Top SQL reveals problematic query
3. Examine query plan
4. Optimize or add index
```

**2. Resource Contention**:
```
Wait events show lock waits
Identify blocking queries
Optimize transactions or add indexes
```

**3. Capacity Planning**:
```
Historical AAS trends
Predict when to scale
Determine instance size needed
```

**4. Anomaly Detection**:
```
Set CloudWatch alarm on AAS
Alert when DB load exceeds threshold
Investigate spikes in Performance Insights
```

### Best Practices

**1. Enable for Production**:
```
Small cost relative to value
Critical for troubleshooting
```

**2. Regular Review**:
```
Weekly: Check top SQL
Monthly: Analyze trends
After changes: Verify performance impact
```

**3. Combine with CloudWatch**:
```
CloudWatch: Infrastructure metrics (CPU, IOPS)
Performance Insights: Database-specific (queries, waits)
Together: Complete picture
```

## Parameter Groups

### What are Parameter Groups?

**Purpose**: Configure database engine settings

**Types**:
- **DB Parameter Group**: Instance-level settings
- **DB Cluster Parameter Group**: Cluster-level (Aurora)

**Default**: AWS provides default parameter groups (read-only)

**Custom**: Create custom groups for your configurations

### Common Parameters

**MySQL/MariaDB**:
```
max_connections: 151 (default) → 1000 (increased)
innodb_buffer_pool_size: {DBInstanceClassMemory*3/4}
slow_query_log: 1 (enable slow query logging)
long_query_time: 2 (queries >2 seconds are "slow")
```

**PostgreSQL**:
```
max_connections: 100 (default) → 500
shared_buffers: {DBInstanceClassMemory/32768}
work_mem: 4096 (4 MB)
maintenance_work_mem: 65536 (64 MB)
```

**SQL Server**:
```
max server memory: Instance-dependent
max worker threads: Auto (can customize)
```

### Dynamic vs Static Parameters

**Dynamic**: Apply immediately or during maintenance window
**Static**: Require database reboot

**Example**:
```
Dynamic: max_connections (apply immediately)
Static: innodb_buffer_pool_size (requires reboot)
```

### Creating Parameter Group

**Steps**:
```
1. Create parameter group
   - Engine: MySQL 8.0
   - Family: mysql8.0
   - Name: my-custom-params

2. Modify parameters
   - max_connections: 1000
   - slow_query_log: 1

3. Associate with DB
   - Modify database
   - Select new parameter group
   - Apply immediately or during maintenance window
```

### Best Practices

**1. Custom Groups for Production**:
```
Don't use default
Create custom group with optimized settings
```

**2. Version-Specific**:
```
Parameter group tied to engine version
Create new group when upgrading engine
```

**3. Document Changes**:
```
Tag parameter groups
Document why parameters changed
Track parameter group versions
```

## Option Groups

### What are Option Groups?

**Purpose**: Enable additional features for DB engines

**Supported**: Oracle, SQL Server, MySQL, MariaDB

**Examples**:

**Oracle**:
- Transparent Data Encryption (TDE)
- Oracle Advanced Security
- Oracle Enterprise Manager (OEM)

**SQL Server**:
- SQL Server Audit
- SQL Server Analysis Services (SSAS)
- SQL Server Integration Services (SSIS)

**MySQL/MariaDB**:
- MariaDB Audit Plugin

### Creating Option Group

**Example** (Oracle TDE):
```
1. Create option group
   - Engine: Oracle EE
   - Version: 19.0

2. Add option: TDE
   - Security settings
   - KMS key

3. Associate with DB instance
```

**Cost**: Some options have additional charges

## Maintenance and Updates

### Maintenance Window

**What**: Time window for AWS to perform maintenance

**Activities**:
- Database engine patches
- OS updates
- Hardware maintenance

**Configuration**:
```
Preferred window: Sun 03:00-04:00 UTC
Auto minor version upgrade: Enabled/Disabled
```

**Impact**:
- Multi-AZ: Standby upgraded first, then failover, then old primary
  - Brief connection interruption (1-2 minutes)
- Single-AZ: Database unavailable during upgrade (minutes to hours)

### Engine Versions

**Major Version**: 5.7 → 8.0, 11 → 12
**Minor Version**: 8.0.28 → 8.0.32

**Auto Minor Version Upgrade**:
- Enabled: AWS applies minor patches automatically during maintenance window
- Disabled: Manual control

**Best Practice**:
```
Production: Disable auto minor version upgrade
Test patches in staging first
Apply manually when ready
```

**Major Version Upgrade**:
```
Always manual
Test thoroughly in staging
Create snapshot before upgrade
Upgrade process can take hours
```

### Blue/Green Deployments

**What**: Zero-downtime database updates (RDS MySQL, MariaDB, PostgreSQL)

**Process**:
```
1. Create clone (green) of production (blue)
2. Apply changes to green (engine upgrade, parameter changes)
3. Replicate from blue to green (catch up)
4. Switchover: Green becomes new production
5. Blue becomes old environment (can delete or keep for rollback)
```

**Benefits**:
- Near-zero downtime
- Easy rollback (keep blue environment)
- Test before switchover

**Use Cases**:
- Major version upgrades
- Schema changes (via replication)
- Parameter tuning

## Monitoring and Alarms

### CloudWatch Metrics

**Standard Metrics** (1-minute):
- **CPUUtilization**: Database CPU usage
- **DatabaseConnections**: Active connections
- **FreeableMemory**: Available RAM
- **FreeStorageSpace**: Available disk space
- **ReadIOPS**, **WriteIOPS**: I/O operations
- **ReadLatency**, **WriteLatency**: I/O latency
- **ReadThroughput**, **WriteThroughput**: MB/s

**Use Cases**:

**High CPU**:
```
Alarm: CPUUtilization > 80% for 5 minutes
Action: SNS notification → Investigate slow queries
```

**Storage Full**:
```
Alarm: FreeStorageSpace < 10 GB
Action: Enable storage autoscaling or manual resize
```

**High Connections**:
```
Alarm: DatabaseConnections > 90% of max
Action: Scale instance or use RDS Proxy
```

### Enhanced Monitoring

**What**: OS-level metrics (1-second granularity)

**Metrics**:
- Detailed CPU (user, system, wait, steal)
- Memory (active, inactive, cached)
- Disk I/O (device-level)
- Network
- Processes

**Cost**: $0.30/instance/month

**Use Case**: Deep troubleshooting of resource contention

### Event Subscriptions

**What**: Notifications for RDS events

**Event Categories**:
- Availability (failover, failure)
- Backup
- Configuration change
- Deletion
- Failover
- Maintenance
- Recovery

**Notification**: SNS topic

**Example**:
```
Event: Failover completed
SNS → Email/Lambda/SQS
Action: Alert team, update monitoring
```

## Cost Optimization

### 1. Right-Size Instances

**Monitor**:
- CPUUtilization (should be 40-70% on average)
- FreeableMemory (shouldn't be too high)

**Action**:
```
Over-provisioned: db.m5.2xlarge at 20% CPU
Right-sized: db.m5.large
Savings: 50%
```

**Tools**: CloudWatch, Performance Insights, Compute Optimizer

### 2. Reserved Instances

**Commitment**: 1 or 3 years

**Savings**: 
- 1-year, no upfront: ~25%
- 1-year, all upfront: ~40%
- 3-year, all upfront: ~60%

**Example**:
```
db.m5.large On-Demand: $0.152/hour = $1,342/year
db.m5.large 1-year RI (all upfront): $806/year
Savings: $536/year (40%)
```

**Best Practice**: Use RIs for steady-state production databases

### 3. Storage Optimization

**gp3 vs gp2**:
```
Same storage and IOPS:
gp2: $0.115/GB-month
gp3: $0.115/GB-month (baseline 3,000 IOPS)

If need <3,000 IOPS per GB: gp3 is better value
```

**Autoscaling**: Enable to avoid over-provisioning

### 4. Snapshot Lifecycle

**Policy**:
```
Automated backups: 7 days
Manual snapshots:
  - Monthly snapshots: Keep 12 months
  - Quarterly snapshots: Keep 7 years (compliance)
  - Delete all other manual snapshots after 30 days
```

**Automation**: AWS Backup or Lambda

### 5. Development Databases

**Strategies**:
- Use smaller instances (db.t3.small)
- No Multi-AZ
- Stop databases during non-business hours
- Snapshots instead of always-running for infrequent use

**Example**:
```
Production: db.m5.large Multi-AZ = $336/month
Development: db.t3.medium Single-AZ, stopped 16 hours/day = $25/month
```

### 6. Read Replica Optimization

**Evaluate**:
- Do you need all replicas?
- Can you use smaller instances for replicas?

**Example**:
```
Primary: db.m5.2xlarge (write-heavy)
Replicas: db.m5.large (read-only, less CPU needed)
```

### 7. Delete Unused Resources

**Audit**:
- Old snapshots
- Unused Read Replicas
- Test/dev databases
- Orphaned parameter/option groups

## RDS vs Alternatives

### RDS vs EC2 Self-Managed

| Factor | RDS | EC2 Self-Managed |
|--------|-----|------------------|
| Management | Automated | Manual |
| Backups | Automatic | Manual setup |
| Patches | AWS applies | Manual |
| HA | Multi-AZ | Manual setup |
| Scaling | Easy | Manual |
| Cost | Higher | Lower (but hidden costs) |
| Control | Limited | Full |

**When RDS**:
- Want managed service
- Standard database engines
- High availability needed
- Don't want operational burden

**When EC2**:
- Need OS-level access
- Unsupported engine version
- Custom configurations not available
- Cost is critical and have expertise

### RDS vs Aurora

| Factor | RDS | Aurora |
|--------|-----|--------|
| Performance | Standard | 5x MySQL, 3x PostgreSQL |
| Storage | 64 TB max | 128 TB |
| Replicas | 5 | 15 |
| Failover | 60-120s | <30s |
| Cost | Lower | Higher |
| Features | Standard | Advanced (Global, Serverless) |

**When RDS**:
- Budget-constrained
- Standard performance acceptable
- No need for advanced features

**When Aurora**:
- Need high performance
- Global applications
- Many read replicas
- Serverless requirements

### RDS vs DynamoDB

| Factor | RDS | DynamoDB |
|--------|-----|----------|
| Type | Relational | NoSQL |
| Schema | Fixed | Flexible |
| Queries | SQL | Key-value, limited queries |
| Scaling | Vertical | Horizontal (automatic) |
| Cost | Predictable | Variable (pay per request) |

**When RDS**:
- Relational data (JOINS, transactions)
- Complex queries
- Existing SQL applications

**When DynamoDB**:
- Simple access patterns
- Need massive scale
- Variable workload
- Serverless architecture

## Real-World Scenarios

### Scenario 1: E-commerce Platform

**Requirements**:
- High availability (99.99%)
- 500 GB database
- 10,000 IOPS
- Read-heavy (80% reads)

**Solution**:
```
Primary: db.m5.xlarge Multi-AZ
- Engine: MySQL 8.0
- Storage: 500 GB gp3 (10,000 IOPS provisioned)
- Multi-AZ: Enabled
- Automated backups: 7 days

Read Replicas: 3 × db.m5.large (different AZs)
- Distribute read traffic
- Local AZ for low latency

RDS Proxy:
- Connection pooling for application servers
- IAM authentication

Application:
- Writes → Primary endpoint
- Reads → Load balance across replica endpoints

Monitoring:
- Performance Insights enabled
- CloudWatch alarms: CPU, storage, connections
```

**Cost** (~monthly):
```
Primary Multi-AZ: $380
Storage: $815 (500 GB + 10k IOPS)
Replicas: 3 × $110 = $330
RDS Proxy: $22
Total: ~$1,547/month
```

### Scenario 2: SaaS Application with Global Users

**Requirements**:
- Customers worldwide
- Low latency
- Disaster recovery

**Solution**:
```
Primary: us-east-1 (db.r5.2xlarge Multi-AZ)
- Write operations

Cross-Region Read Replicas:
- eu-west-1 (db.r5.xlarge)
- ap-southeast-1 (db.r5.xlarge)

Application routing:
- Route 53 Geolocation
  - US users → us-east-1 primary (writes + reads)
  - EU users → eu-west-1 replica (reads)
  - APAC users → ap-southeast-1 replica (reads)

Disaster Recovery:
- Cross-region replica can be promoted
- Manual failover if primary region fails
- RPO: ~1 minute (replication lag)
- RTO: ~10 minutes (promotion + app updates)
```

**Cost** (~monthly):
```
Primary Multi-AZ: $1,200
EU replica: $300
APAC replica: $300
Data transfer: $600 (cross-region replication)
Total: ~$2,400/month
```

### Scenario 3: Compliance and Auditing

**Requirements**:
- 7-year retention
- Encryption required
- Audit all access
- No data loss acceptable

**Solution**:
```
Database:
- Engine: PostgreSQL 14
- Encryption: KMS (customer-managed key)
- Multi-AZ: Enabled (zero data loss)
- Automated backups: 35 days

Manual Snapshots:
- Monthly snapshots
- Copy to separate AWS account (backup account)
- Cross-region copy for geo-redundancy
- Lifecycle: Keep 7 years

Logging:
- Performance Insights: 2-year retention
- Database logs: Export to CloudWatch Logs
- CloudWatch Logs: Export to S3 (Glacier Deep Archive)

Audit:
- PostgreSQL pgaudit extension
- Log all DDL and DML
- CloudTrail for API calls

Access Control:
- IAM authentication
- Secrets Manager for credentials rotation
- VPC with private subnets only
- Security groups: Whitelist known IPs
```

**Cost** (~monthly):
```
Database: $500
Snapshots (7 years, 500 GB × 84): $3,990
Logging: $50
Total: ~$4,540/month
```

### Scenario 4: Migration from On-Premises

**Requirements**:
- 2 TB Oracle database
- Minimize downtime
- Maintain compatibility

**Solution**:
```
1. Assessment:
   - Use AWS Schema Conversion Tool (SCT)
   - Identify compatibility issues
   - Determine if RDS or Aurora PostgreSQL better

2. Initial Migration (DMS):
   - Create RDS Oracle instance (same version)
   - Use AWS Database Migration Service (DMS)
   - Full load + CDC (Change Data Capture)

3. Testing:
   - Parallel run (on-prem and RDS)
   - Validate data integrity
   - Performance testing

4. Cutover:
   - Stop on-prem writes
   - Allow DMS to catch up (<1 minute)
   - Switch application to RDS endpoint
   - Monitor

5. Post-Migration:
   - Enable Multi-AZ
   - Set up Read Replicas
   - Implement backup strategy
```

**Cost** (~monthly):
```
RDS Oracle EE: $8,000 (BYOL lower)
DMS instance (during migration): $300 (temporary)
Total ongoing: ~$8,000/month
```

### Scenario 5: Serverless Application with Lambda

**Requirements**:
- AWS Lambda functions
- Connection pooling needed
- Sporadic traffic

**Solution**:
```
RDS MySQL:
- Instance: db.t3.medium (sufficient for workload)
- RDS Proxy: Required for Lambda
  - Connection pooling
  - IAM authentication
  - Secrets Manager for credentials

Lambda Functions:
- VPC: Same as RDS
- Connect via RDS Proxy endpoint
- Use IAM authentication token

Configuration:
├── Lambda (Python)
│   ├── VPC: Same as RDS
│   ├── Security Group: Allow outbound to Proxy
│   └── IAM Role: rds:connect permission
│
├── RDS Proxy
│   ├── Target: RDS MySQL
│   ├── Secrets: Secrets Manager
│   └── Max connections: 100
│
└── RDS MySQL
    ├── Instance: db.t3.medium
    ├── Max connections: 150
    └── Private subnet
```

**Code Example**:
```python
import boto3
import pymysql
import os

def get_db_connection():
    rds_client = boto3.client('rds')
    token = rds_client.generate_db_auth_token(
        DBHostname=os.environ['DB_PROXY_ENDPOINT'],
        Port=3306,
        DBUsername=os.environ['DB_USER']
    )
    
    connection = pymysql.connect(
        host=os.environ['DB_PROXY_ENDPOINT'],
        user=os.environ['DB_USER'],
        password=token,
        database=os.environ['DB_NAME'],
        ssl={'ssl': True}
    )
    return connection

def lambda_handler(event, context):
    conn = get_db_connection()
    # Use connection
    conn.close()
```

**Cost** (~monthly):
```
RDS: $50
RDS Proxy: $22
Total: ~$72/month
```

## Exam Tips (SAP-C02)

### Key Decision Points

**High Availability**:
- Need zero data loss? → Multi-AZ
- Need read scaling? → Read Replicas
- Need both? → Multi-AZ + Read Replicas

**Performance**:
- Slow queries? → Performance Insights + indexes
- High CPU? → Larger instance or optimize queries
- High IOPS? → Provisioned IOPS (io2) or more storage (gp3)
- Many connections? → RDS Proxy

**Disaster Recovery**:
- Same region? → Multi-AZ (automatic failover)
- Cross-region? → Read Replica (manual failover)
- RPO = 0? → Multi-AZ
- RPO = minutes? → Read Replica

**Cost Optimization**:
- Steady workload? → Reserved Instances
- Dev/test? → Smaller instances, stop when not in use
- Storage growing? → Enable autoscaling
- Many snapshots? → Lifecycle policy

**Security**:
- Encryption? → Enable at creation (cannot add later)
- Audit? → Database logs + CloudTrail
- Network isolation? → Private subnets, security groups
- Credential management? → Secrets Manager + rotation

**Scaling**:
- Read scaling? → Read Replicas
- Write scaling? → Vertical (larger instance) or Aurora
- Global users? → Cross-region Read Replicas
- Connection pooling? → RDS Proxy

### Common Scenarios

**"Database runs out of connections"**:
- Use RDS Proxy (Lambda, microservices)
- Increase max_connections parameter
- Connection pooling in application

**"Need zero downtime for upgrades"**:
- Blue/Green Deployments (MySQL, PostgreSQL, MariaDB)
- Or: Read Replica → promote → switch app

**"Slow performance after traffic spike"**:
- Check: CPU, IOPS, memory
- Performance Insights: Identify slow queries
- Add indexes or scale instance

**"Must retain backups for 7 years"**:
- Automated backups: Max 35 days
- Manual snapshots: Indefinite
- Copy to separate account for isolation

**"Lambda with RDS timing out"**:
- Must use RDS Proxy
- VPC Lambda (adds cold start time)
- Increase Lambda timeout

**"Minimize cross-region replication cost"**:
- Compress data before replication
- Replicate only necessary data
- Use Direct Connect instead of internet

This comprehensive RDS guide covers all aspects needed for the SAP-C02 exam and practical implementations.
